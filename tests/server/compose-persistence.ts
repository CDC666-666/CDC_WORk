import assert from "node:assert/strict";

import { PrismaClient } from "@prisma/client";

const [phase, marker] = process.argv.slice(2);
if ((phase !== "prepare" && phase !== "verify") || !marker || !/^[A-Za-z0-9-]{1,80}$/.test(marker)) {
  throw new Error("Use prepare|verify and a CI run marker.");
}

const allowedId = process.env.ALLOWED_GITHUB_USER_ID ?? "";
const baseUrl = process.env.NEXTAUTH_URL ?? "";
assert.ok(allowedId && baseUrl);

const ids = {
  user: `compose-user-${marker}`,
  workspace: `compose-workspace-${marker}`,
  project: `compose-project-${marker}`,
  review: `compose-review-${marker}`,
  task: `compose-task-${marker}`,
  session: `compose-session-${marker}`,
};
const db = new PrismaClient();

async function main(): Promise<void> {
  try {
    if (phase === "prepare") {
      await db.user.create({ data: { id: ids.user, githubId: allowedId } });
      await db.account.create({ data: {
        userId: ids.user, type: "oauth", provider: "github", providerAccountId: allowedId,
      } });
      await db.session.create({ data: {
        userId: ids.user, sessionToken: ids.session, expires: new Date(Date.now() + 3_600_000),
      } });
      await db.workspace.create({ data: { id: ids.workspace, userId: ids.user } });
      await db.project.create({ data: { id: ids.project, workspaceId: ids.workspace, name: "Compose 持久化检查" } });
      await db.review.create({ data: {
        id: ids.review, workspaceId: ids.workspace, type: "PROJECT", date: new Date("2026-10-03T00:00:00.000Z"),
        summary: "容器重启前已保存", relatedProjectId: ids.project,
      } });
      const createdTask = await fetch(`${baseUrl}/api/private/entities/tasks`, {
        method: "POST", headers: { cookie: `next-auth.session-token=${ids.session}`,
          origin: baseUrl, "content-type": "application/json" },
        body: JSON.stringify({ item: { id: ids.task, title: "容器重启任务", status: "待开始",
          priority: "中", sourceType: "PROJECT", relatedId: ids.project,
          scheduledDate: "2026-10-03", deadline: "2026-10-04T12:00:00.000Z" } }),
      });
      assert.equal(createdTask.status, 201);
      process.stdout.write(`PREPARED ${ids.review}\n`);
    } else {
      const saved = await db.review.findUnique({ where: { id: ids.review } });
      assert.equal(saved?.summary, "容器重启前已保存");
      assert.equal(saved.relatedProjectId, ids.project);
      const response = await fetch(`${baseUrl}/api/private/reviews/${ids.review}`, {
        headers: { cookie: `next-auth.session-token=${ids.session}` },
      });
      assert.equal(response.status, 200);
      const body: unknown = await response.json();
      assert.ok(body && typeof body === "object" && "item" in body);
      const item = body.item;
      assert.ok(item && typeof item === "object" && "date" in item && "relatedProjectId" in item);
      assert.equal(item.date, "2026-10-03");
      assert.equal(item.relatedProjectId, ids.project);
      const persistedTask = await db.task.findUniqueOrThrow({ where: { id: ids.task } });
      assert.equal((persistedTask.payload as { title: string }).title, "容器重启任务");
      const workspaceRead = await fetch(`${baseUrl}/api/private/workspace`, {
        headers: { cookie: `next-auth.session-token=${ids.session}` },
      });
      assert.equal(workspaceRead.status, 200);
      const workspaceBody = (await workspaceRead.json()) as { domain: { tasks: Array<{ id: string }> } };
      assert.ok(workspaceBody.domain.tasks.some((task) => task.id === ids.task));
      process.stdout.write(`PERSISTED_RECORD ${ids.review}\n`);
      await db.task.delete({ where: { id: ids.task } });
      await db.review.delete({ where: { id: ids.review } });
      await db.project.delete({ where: { id: ids.project } });
      await db.workspace.delete({ where: { id: ids.workspace } });
      await db.session.delete({ where: { sessionToken: ids.session } });
      await db.account.delete({ where: { provider_providerAccountId: { provider: "github", providerAccountId: allowedId } } });
      await db.user.delete({ where: { id: ids.user } });
    }
  } finally {
    await db.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
