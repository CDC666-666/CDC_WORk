import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@/lib/server/prisma";
import { filterExperiences } from "@/services/engineering-experience-service";
import { importAutoAimCase } from "@/services/server/shared-memory-import";
import { AUTO_AIM_CASE_SOURCE, parseAutoAimCase } from "@/services/shared-memory-experience";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const workspaceArg = args.find((arg) => arg.startsWith("--workspace-id="));
  const workspaceId = workspaceArg?.slice("--workspace-id=".length);
  const execute = args.includes("--execute");
  if (!workspaceId || args.some((arg) => arg !== workspaceArg && arg !== "--execute")) {
    throw new Error("用法：npm run import:experience -- --workspace-id=<目标 Workspace ID> [--execute]；默认仅预览");
  }
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const sourcePath = resolve(repositoryRoot, "..", ...AUTO_AIM_CASE_SOURCE.split("/"));
  const source = await readFile(sourcePath, "utf8");
  const item = parseAutoAimCase(source, workspaceId);
  const searchMatch = filterExperiences([item], { query: "切入突转", project: "auto_aim",
    tag: "初始化", evidenceStatus: "历史现场反馈" }).length;
  if (searchMatch !== 1) throw new Error("案例未通过标题、项目、标签与证据状态联合检索");
  console.log(JSON.stringify({ action: execute ? "execute" : "preview", id: item.id, title: item.title,
    sourceKey: item.experience?.sourceKey, sourceRevision: item.experience?.sourceRevision,
    reviewStatus: item.experience?.reviewStatus, evidenceStatus: item.experience?.evidenceStatus,
    searchMatch }));
  if (!execute) return;
  if (!process.env.DATABASE_URL) throw new Error("执行导入需要 DATABASE_URL；预览无需数据库连接");
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId }, select: { id: true } });
  if (!workspace) throw new Error("目标工作区不存在；未执行导入");
  console.log(JSON.stringify(await importAutoAimCase(workspaceId, source)));
}

main().catch((cause: unknown) => { console.error(cause instanceof Error ? cause.message : cause); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
