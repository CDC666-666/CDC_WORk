import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

import { parseAutoAimCase } from "@/services/shared-memory-experience";
import { syntheticCase } from "@/tests/fixtures/experience-case";

const baseUrl = process.env.TEST_BASE_URL;

test("experience editor explicitly clears a project through HTTP and database columns", {
  skip: !baseUrl || !process.env.DATABASE_URL,
}, async () => {
  assert.ok(baseUrl);
  const allowedId = process.env.ALLOWED_GITHUB_USER_ID;
  assert.ok(allowedId);
  const db = new PrismaClient();
  const marker = randomUUID();
  const user = await db.user.create({ data: { githubId: allowedId } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const sessionToken = randomUUID();
  await db.account.create({ data: { userId: user.id, type: "oauth", provider: "github",
    providerAccountId: allowedId } });
  await db.session.create({ data: { userId: user.id, sessionToken,
    expires: new Date(Date.now() + 3600_000) } });
  const headers = { cookie: `next-auth.session-token=${sessionToken}`, origin: baseUrl,
    "content-type": "application/json" };
  const projectId = `experience-project-${marker}`;
  const template = parseAutoAimCase(syntheticCase, workspace.id);
  const item = { ...template, id: `experience-unlink-${marker}`, title: "取消项目关联测试经验",
    projectId, sourceType: "manual", sourceId: undefined,
    experience: { ...template.experience, sourceKey: undefined, sourceRevision: undefined } };
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    const project = await fetch(`${baseUrl}/api/private/entities/projects`, { method: "POST", headers,
      body: JSON.stringify({ item: { id: projectId, name: "待取消关联项目", code: "EXP", status: "规划中",
        category: "个人", role: "个人", description: "", progress: 0, objectives: [], responsibilities: [],
        techStack: [], tags: [], visibility: "PRIVATE", coverStyle: "blue", repositoryUrl: "" } }) });
    assert.equal(project.status, 201, project.status === 201 ? undefined : await project.text());
    const createdProject = (await project.json()) as { version: number };
    const created = await fetch(`${baseUrl}/api/private/entities/knowledge`, { method: "POST", headers,
      body: JSON.stringify({ item }) });
    assert.equal(created.status, 201, created.status === 201 ? undefined : await created.text());
    const createdExperience = (await created.json()) as { version: number };

    // Omitting the field means no change; choosing "不关联" in the editor must send a clear marker.
    const unchanged = await fetch(`${baseUrl}/api/private/entities/knowledge/${item.id}`, {
      method: "PATCH", headers, body: JSON.stringify({ version: createdExperience.version,
        item: { title: "取消项目关联测试经验" } }),
    });
    assert.equal(unchanged.status, 200, await unchanged.text());
    assert.equal((await db.knowledge.findUniqueOrThrow({ where: { id: item.id } })).projectId, projectId);

    browser = await chromium.launch({ headless: true,
      channel: process.env.TEST_BROWSER_CHANNEL ?? undefined });
    const context = await browser.newContext({ viewport: { width: 1280, height: 844 } });
    await context.addCookies([{ name: "next-auth.session-token", value: sessionToken, url: baseUrl }]);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/experiences`);
    await page.getByRole("article").filter({ hasText: item.title }).getByRole("button", { name: "编辑" }).click();
    const editor = page.getByRole("dialog");
    await page.waitForFunction((id) => document.querySelector<HTMLSelectElement>("#experience-linked-project")?.value === id,
      projectId);
    assert.equal(await editor.locator("#experience-linked-project").inputValue(), projectId);
    await editor.locator("#experience-linked-project").selectOption("");
    const patchRequest = page.waitForRequest((request) => request.method() === "PATCH" &&
      request.url().endsWith(`/api/private/entities/knowledge/${item.id}`));
    await editor.getByRole("button", { name: "保存经验" }).click();
    const submitted = JSON.parse((await patchRequest).postData() ?? "null") as { item?: { projectId?: string } };
    await page.getByText("经验已保存").waitFor();
    assert.equal(submitted.item?.projectId, "",
      "the browser must serialize an explicit clear marker");
    const row = await db.knowledge.findUniqueOrThrow({ where: { id: item.id } });
    assert.equal(row.projectId, null, "indexed projectId must be cleared");
    assert.equal((row.payload as Record<string, unknown>).projectId, undefined,
      "payload must not retain the old project");
    assert.deepEqual(row.relationRefs, [], "relationRefs must not retain the old project");
    await page.reload();
    await page.getByRole("dialog").getByRole("button", { name: "编辑经验" }).click();
    assert.equal(await page.getByRole("dialog").locator("#experience-linked-project").inputValue(), "");
    const deletedProject = await fetch(`${baseUrl}/api/private/entities/projects/${projectId}`, {
      method: "DELETE", headers, body: JSON.stringify({ version: createdProject.version }),
    });
    assert.equal(deletedProject.status, 200, await deletedProject.text());
    await context.close();
  } finally {
    await browser?.close();
    await db.knowledge.deleteMany({ where: { workspaceId: workspace.id } });
    await db.project.deleteMany({ where: { workspaceId: workspace.id } });
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
