import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import type { KnowledgeItem } from "@/types/knowledge";

export const SNAPSHOT_SOURCE = "shared-memory/cases/auto-aim-init-alignment.md";
const CASE_NAME = "auto-aim-init-alignment.md";
const SNAPSHOT_FORMAT_VERSION = 2;

export interface SnapshotRecord {
  id: string;
  version: number;
  updatedAt: Date;
  item: KnowledgeItem & { experience: NonNullable<KnowledgeItem["experience"]> };
}

export type SnapshotState = { kind: "active"; record: SnapshotRecord } |
  { kind: "retired"; reason: "deleted" | "archived" | "no-longer-experience" };

interface IndexMeta {
  state: "active" | "retired";
  formatVersion: number;
  generatedAt: string;
  recordId?: string;
  version?: number;
  updatedAt?: string;
  payloadHash?: string;
  file?: string;
}

export interface SnapshotResult {
  result: "created" | "updated" | "unchanged" | "retired";
  generatedAt: string;
  file?: string;
  version?: number;
  payloadHash?: string;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stable(entry)]));
  return value;
}

export function payloadHash(item: KnowledgeItem): string {
  return createHash("sha256").update(JSON.stringify(stable(item))).digest("hex");
}

function safeText(value: string): string {
  // Only known experience fields are exported. Refuse a snapshot if an editor pasted credentials into one.
  if (/gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:GITHUB_CLIENT_SECRET|NEXTAUTH_SECRET|DATABASE_URL|access_token|refresh_token|sessionToken|client_secret)\s*[:=]/i.test(value)) {
    throw new Error("SNAPSHOT_SENSITIVE_CONTENT");
  }
  return value.trim();
}

function rewriteRelativeLinks(value: string, outputFile: string, workplaceRoot: string): string {
  const sourceDir = resolve(workplaceRoot, "shared-memory", "cases");
  return safeText(value).replace(/\]\(([^)#]+)(#[^)]+)?\)/g, (match, target: string, anchor: string | undefined) => {
    if (/^(?:[a-z]+:|\/|\\)/i.test(target)) return match;
    const destination = resolve(sourceDir, target);
    const link = relative(dirname(outputFile), destination).split(sep).join("/");
    return `](${link}${anchor ?? ""})`;
  });
}

export function renderCase(record: SnapshotRecord, outputFile: string, workplaceRoot: string,
  generatedAt: string): string {
  const item = record.item;
  const detail = item.experience;
  const body = (value: string) => rewriteRelativeLinks(value, outputFile, workplaceRoot);
  const sources = detail.evidenceSources.map((value) => `- ${body(value)}`).join("\n");
  const clockWarning = record.updatedAt.getTime() > new Date(generatedAt).getTime()
    ? `> 时间提示：数据库更新时间晚于快照生成时间；本机时间或时区口径待核实。请以实体版本和摘要比较内容，不据此推断时间先后。\n`
    : "";
  return `# ${safeText(item.title)}\n\n` +
    `> 数据库派生快照，请勿手动修改。数据库是工作台经验的主数据源；此文件只代表 ${generatedAt} 的读取结果。\n` +
    `> 待审核经验可作为排查线索；引用时必须同时说明证据状态、适用条件与限制。此快照与原始共享案例属于同一来源，不能算两份独立证据。\n\n` +
    clockWarning +
    `- 实体 ID：\`${record.id}\`\n- 数据库版本：\`${record.version}\`\n` +
    `- 来源标识：\`${safeText(detail.sourceKey ?? "")}\`\n` +
    `- 来源摘要 SHA-256：\`${safeText(detail.sourceRevision ?? "")}\`\n` +
    `- 数据库更新时间：\`${record.updatedAt.toISOString()}\`\n` +
    `- 快照生成时间：\`${generatedAt}\`\n` +
    `- 来源项目：\`${safeText(detail.sourceProject)}\`\n` +
    `- 标签：${item.tags.map((tag) => `\`${safeText(tag)}\``).join("、")}\n` +
    `- 审核状态：**${safeText(detail.reviewStatus)}**\n` +
    `- 证据状态：**${safeText(detail.evidenceStatus)}**\n\n` +
    `## 现象\n\n${body(detail.phenomenon)}\n\n` +
    `## 环境与版本\n\n${body(detail.environment)}\n\n${body(detail.sourceVersion)}\n\n` +
    `## 排查过程\n\n${body(detail.investigation)}\n\n` +
    `## 失败尝试\n\n${body(detail.failedAttempts)}\n\n` +
    `## 原因\n\n${body(detail.cause)}\n\n` +
    `## 解决办法\n\n${body(detail.resolution)}\n\n` +
    `## 验证结果\n\n${body(detail.verificationResult)}\n\n` +
    `## 适用条件\n\n${body(detail.applicability)}\n\n` +
    `## 不适用条件与限制\n\n${body(detail.limitations)}\n\n` +
    `## 待确认\n\n${body(detail.openQuestions)}\n\n` +
    `## 证据来源\n\n${sources}\n\n` +
    `原始整理文件：[${SNAPSHOT_SOURCE}](${relative(dirname(outputFile), resolve(workplaceRoot, SNAPSHOT_SOURCE)).split(sep).join("/")})。\n`;
}

async function readMeta(outputRoot: string): Promise<IndexMeta | undefined> {
  try {
    const index = await readFile(join(outputRoot, "INDEX.md"), "utf8");
    const match = /^<!-- snapshot-meta: (\{[^\n]+\}) -->/m.exec(index);
    if (!match) return undefined;
    const parsed: unknown = JSON.parse(match[1]);
    if (!parsed || typeof parsed !== "object") return undefined;
    const meta = parsed as Partial<IndexMeta>;
    return (meta.state === "active" || meta.state === "retired") && typeof meta.generatedAt === "string"
      ? meta as IndexMeta : undefined;
  } catch (cause: unknown) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw cause;
  }
}

async function atomicText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.tmp-${randomUUID()}`;
  try {
    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, path);
  } catch (cause: unknown) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw cause;
  }
}

async function pruneUnlinkedVersions(outputRoot: string, currentFile?: string): Promise<void> {
  const versionsRoot = resolve(outputRoot, ".versions");
  const currentDirectory = currentFile ? dirname(resolve(outputRoot, currentFile)) : undefined;
  let entries;
  try { entries = await readdir(versionsRoot, { withFileTypes: true }); }
  catch (cause: unknown) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") return;
    throw cause;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^(?:f\d+-)?v\d+-[a-f0-9]{16}-\d{17}(?:-\d{17})?$/.test(entry.name)) continue;
    const target = resolve(versionsRoot, entry.name);
    // Verify the absolute recursive-delete target is exactly one child of this output directory.
    if (dirname(target) !== versionsRoot || target === currentDirectory) continue;
    await rm(target, { recursive: true, force: true });
  }
}

function renderIndex(meta: IndexMeta, state: SnapshotState, title?: string, tags?: string[]): string {
  const header = `<!-- snapshot-meta: ${JSON.stringify(meta)} -->\n# 工作台工程经验数据库快照索引\n\n` +
    `> 数据库派生快照，请勿手动修改。只以本索引列出的记录作为当前快照；隐藏的旧版本不是另一条经验，也不代表数据库现状。\n` +
    `> 快照只反映上次成功读取时的数据库状态。读取前查看 [刷新状态](STATUS.md)；失败时将旧快照仅作为历史线索。\n\n` +
    `- 最后成功时间：\`${meta.generatedAt}\`\n- 来源项目：\`auto_aim\`\n` +
    `- 原始共享案例：[${SNAPSHOT_SOURCE}](../cases/auto-aim-init-alignment.md)（同一来源，不是独立证据）\n\n`;
  if (state.kind === "retired") return header +
    `## 当前有效记录\n\n无。数据库记录已${state.reason === "deleted" ? "删除" : state.reason === "archived" ? "归档" : "不再属于工程经验"}；旧快照不可作为当前有效经验。\n`;
  return header + `## 当前有效记录\n\n` +
    `- [${safeText(title ?? state.record.item.title)}](${meta.file})：${state.record.item.experience.sourceProject}；` +
    `关键词 ${tags?.map(safeText).join("、") ?? state.record.item.tags.map(safeText).join("、")}；` +
    `审核 **${state.record.item.experience.reviewStatus}**，证据 **${state.record.item.experience.evidenceStatus}**。` +
    `版本 \`${meta.version}\`，来源摘要 \`${state.record.item.experience.sourceRevision}\`。\n` +
    (state.record.updatedAt.getTime() > new Date(meta.generatedAt).getTime()
      ? "\n时间提示：数据库更新时间晚于快照生成时间；时钟或时区口径待核实，以版本和摘要比较内容。\n" : "");
}

export async function lastSuccessfulAt(outputRoot: string): Promise<string | null> {
  return (await readMeta(outputRoot))?.generatedAt ?? null;
}

export async function markRefreshFailure(outputRoot: string, code: string, attemptedAt: string): Promise<void> {
  const last = await lastSuccessfulAt(outputRoot);
  await atomicText(join(outputRoot, "STATUS.md"), `# 快照刷新状态\n\n` +
    `**刷新失败；当前数据库状态未知。** 上次完整快照保留，但只能作为历史排查线索。\n\n` +
    `- 尝试时间：\`${attemptedAt}\`\n- 最后成功时间：${last ? `\`${last}\`` : "无"}\n` +
    `- 错误代码：\`${code}\`\n`);
}

/** Publishes a complete immutable case before atomically switching the public index. */
export async function publishSnapshot(outputRoot: string, workplaceRoot: string, state: SnapshotState,
  generatedAt = new Date().toISOString(), beforeIndexPublish?: () => Promise<void>): Promise<SnapshotResult> {
  const previous = await readMeta(outputRoot);
  let meta: IndexMeta;
  let result: SnapshotResult["result"];
  if (state.kind === "active") {
    const hash = payloadHash(state.record.item);
    const date = state.record.updatedAt.toISOString();
    if (previous?.state === "active" && previous.formatVersion === SNAPSHOT_FORMAT_VERSION &&
      previous.recordId === state.record.id &&
      previous.version === state.record.version && previous.updatedAt === date &&
      previous.payloadHash === hash && previous.file) {
      try {
        const candidate = resolve(outputRoot, previous.file);
        const relativeCandidate = relative(resolve(outputRoot), candidate);
        if (!relativeCandidate || relativeCandidate.startsWith("..") || relativeCandidate.includes(`..${sep}`)) {
          throw new Error("SNAPSHOT_INDEX_INVALID");
        }
        const currentText = await readFile(candidate, "utf8");
        if (currentText !== renderCase(state.record, candidate, workplaceRoot, previous.generatedAt)) {
          throw new Error("SNAPSHOT_CONTENT_DRIFT");
        }
        await atomicText(join(outputRoot, "STATUS.md"), `# 快照刷新状态\n\n最近一次读取成功；当前索引仍是完整快照。\n\n- 检查时间：\`${generatedAt}\`\n- 最后成功时间：\`${previous.generatedAt}\`\n`);
        return { result: "unchanged", generatedAt: previous.generatedAt, file: previous.file,
          version: previous.version, payloadHash: hash };
      } catch (cause: unknown) {
        if ((cause as NodeJS.ErrnoException).code !== "ENOENT" &&
          !(cause instanceof Error && cause.message === "SNAPSHOT_CONTENT_DRIFT")) throw cause;
      }
    }
    const folder = `f${SNAPSHOT_FORMAT_VERSION}-v${state.record.version}-${hash.slice(0, 16)}-` +
      `${date.replace(/[^0-9]/g, "")}-${generatedAt.replace(/[^0-9]/g, "")}`;
    const file = `.versions/${folder}/${CASE_NAME}`;
    const fullPath = resolve(outputRoot, file);
    await atomicText(fullPath, renderCase(state.record, fullPath, workplaceRoot, generatedAt));
    meta = { state: "active", formatVersion: SNAPSHOT_FORMAT_VERSION, generatedAt,
      recordId: state.record.id, version: state.record.version,
      updatedAt: date, payloadHash: hash, file };
    result = previous ? "updated" : "created";
  } else {
    meta = { state: "retired", formatVersion: SNAPSHOT_FORMAT_VERSION, generatedAt };
    result = "retired";
  }
  const index = renderIndex(meta, state);
  if (beforeIndexPublish) await beforeIndexPublish();
  await atomicText(join(outputRoot, "INDEX.md"), index);
  await atomicText(join(outputRoot, "STATUS.md"), `# 快照刷新状态\n\n最近一次读取成功；当前状态以 [索引](INDEX.md) 为准。\n\n- 最后成功时间：\`${generatedAt}\`\n`);
  // Cleanup is best effort after publication; a leftover hidden version is never indexed as current.
  await pruneUnlinkedVersions(outputRoot, meta.file).catch(() => undefined);
  return { result, generatedAt, file: meta.file, version: meta.version, payloadHash: meta.payloadHash };
}
