import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_BASE_URL;

test("profile and workspace crop independently, persist after reload, and quick menu closes correctly", {
  skip: !baseUrl || !process.env.DATABASE_URL || !process.env.ALLOWED_GITHUB_USER_ID,
}, async () => {
  assert.ok(baseUrl);
  const db = new PrismaClient();
  const user = await db.user.create({ data: { githubId: process.env.ALLOWED_GITHUB_USER_ID } });
  const workspace = await db.workspace.create({ data: { userId: user.id } });
  const token = randomUUID();
  await db.account.create({ data: { userId: user.id, type: "oauth", provider: "github",
    providerAccountId: process.env.ALLOWED_GITHUB_USER_ID! } });
  await db.session.create({ data: { userId: user.id, sessionToken: token,
    expires: new Date(Date.now() + 3600_000) } });
  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
  try {
    browser = await chromium.launch({ headless: true, channel: process.env.TEST_BROWSER_CHANNEL ?? undefined });
    const context = await browser.newContext({ viewport: { width: 1280, height: 844 } });
    await context.addCookies([{ name: "next-auth.session-token", value: token, url: baseUrl }]);
    const page = await context.newPage();
    await page.goto(`${baseUrl}/settings`);
    const png = await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = 400; canvas.height = 300;
      const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#ef4444"; ctx.fillRect(0, 0, 200, 300);
      ctx.fillStyle = "#2563eb"; ctx.fillRect(200, 0, 200, 300);
      return canvas.toDataURL("image/png").split(",")[1];
    });
    const image = { name: "crop.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") };
    const profileFile = page.locator("form").nth(0).locator('input[type="file"]');
    await profileFile.setInputFiles(image);
    const crop = page.getByRole("dialog", { name: "裁剪个人头像" });
    await crop.waitFor();
    await crop.getByRole("button", { name: "取消" }).click();
    assert.equal(await page.getByAltText("个人头像预览").count(), 0);
    await profileFile.setInputFiles(image);
    await crop.locator('input[type="range"]').evaluate((input) => {
      const slider = input as HTMLInputElement; slider.value = "1.5"; slider.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.mouse.move(640, 360); await page.mouse.down(); await page.mouse.move(660, 370); await page.mouse.up();
    await crop.getByRole("button", { name: "确认裁剪" }).click();
    await page.getByLabel("显示姓名").fill("测试显示名");
    await page.getByLabel("个人简介").fill("测试简介");
    await page.getByRole("button", { name: "保存个人资料" }).click();
    await page.getByText("个人资料已保存到服务器。").waitFor();

    const greenPng = await page.evaluate(() => {
      const canvas = document.createElement("canvas"); canvas.width = 300; canvas.height = 300;
      const ctx = canvas.getContext("2d")!; ctx.fillStyle = "#16a34a"; ctx.fillRect(0, 0, 300, 300);
      return canvas.toDataURL("image/png").split(",")[1];
    });
    const workspaceFile = page.locator("form").nth(1).locator('input[type="file"]');
    await workspaceFile.setInputFiles({ name: "icon.png", mimeType: "image/png", buffer: Buffer.from(greenPng, "base64") });
    await page.getByRole("dialog", { name: "裁剪工作台图标" }).getByRole("button", { name: "确认裁剪" }).click();
    await page.getByLabel("工作台名称").fill("自定义工作台");
    await page.getByLabel("副标题").fill("技术与学习");
    await page.getByRole("button", { name: "保存工作台标识" }).click();
    await page.getByText("工作台标识已保存到服务器。").waitFor();
    await page.reload();
    await page.getByText("自定义工作台", { exact: true }).waitFor();
    assert.equal(await page.getByLabel("显示姓名").inputValue(), "测试显示名");
    assert.equal(await page.getByLabel("个人简介").inputValue(), "测试简介");
    assert.match(await page.getByAltText("个人头像预览").getAttribute("src") ?? "", /^data:image\/webp;base64,/);
    assert.match(await page.getByAltText("工作台图标预览").getAttribute("src") ?? "", /^data:image\/webp;base64,/);
    const saved = await db.workspace.findUniqueOrThrow({ where: { id: workspace.id } });
    assert.equal(saved.displayName, "测试显示名"); assert.equal(saved.workspaceName, "自定义工作台");
    assert.ok(saved.avatar && saved.workspaceIcon && saved.avatar !== saved.workspaceIcon);

    const quick = page.getByRole("button", { name: "快速新建" });
    await quick.click(); assert.equal(await page.getByRole("menu").count(), 1);
    await quick.click(); assert.equal(await page.getByRole("menu").count(), 0);
    await quick.click(); await page.getByRole("heading", { name: "个人设置" }).click();
    assert.equal(await page.getByRole("menu").count(), 0);
    await quick.click(); await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("menu").count(), 0);
    assert.equal(await quick.evaluate((element) => document.activeElement === element), true);
    await quick.click(); await page.getByRole("menuitem", { name: /工程经验/ }).click();
    await page.waitForURL(`${baseUrl}/experiences`);
    assert.equal(await page.getByRole("menu").count(), 0);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth + 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
  } finally {
    await browser?.close();
    await db.session.deleteMany({ where: { userId: user.id } });
    await db.account.deleteMany({ where: { userId: user.id } });
    await db.workspace.delete({ where: { id: workspace.id } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
});
