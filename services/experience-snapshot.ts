import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import type { KnowledgeItem } from "@/types/knowledge";

const FORMAT = 4;

export interface SnapshotRecord {
  id: string;
  version: number;
  updatedAt: Date;
  item: KnowledgeItem & { experience: NonNullable<KnowledgeItem["experience"]> };
}

interface Entry {
  id: string;
  version: number;
  updatedAt: string;
  payloadHash: string;
  file: string;
}
interface Meta {
  formatVersion: 4;
  generatedAt: string;
  batchHash: string;
  entries: Entry[];
}
interface PriorMeta { generatedAt: string; updatedAt?: string }
interface StatusMeta {
  lastSuccessfulCheckAt: string;
  lastGeneratedAt: string;
  databaseUpdatedAt?: string;
}
export interface SnapshotResult {
  result: "created" | "updated" | "unchanged";
  generatedAt: string;
  checkedAt: string;
  count: number;
  batchHash: string;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, entry]) => [key, stable(entry)]));
  return value;
}
function sha(value: string): string { return createHash("sha256").update(value).digest("hex"); }
export function payloadHash(item: KnowledgeItem): string { return sha(JSON.stringify(stable(item))); }
function safeText(value: string): string {
  if (/gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:GITHUB_CLIENT_SECRET|NEXTAUTH_SECRET|DATABASE_URL|access_token|refresh_token|sessionToken|client_secret)\s*[:=]/i.test(value)) {
    throw new Error("SNAPSHOT_SENSITIVE_CONTENT");
  }
  return value.trim();
}
function inline(value: string): string {
  return safeText(value).replace(/[\r\n]+/g, " ").replace(/[\\|[\]*<>]/g, "\\$&");
}
function sourceFile(record: SnapshotRecord, workplaceRoot: string): string | undefined {
  const source = record.item.experience.sourceKey;
  if (record.item.sourceType !== "sharedMemory" || !source) return undefined;
  const root = resolve(workplaceRoot, "shared-memory", "cases");
  const candidate = resolve(workplaceRoot, source);
  const relation = relative(root, candidate);
  if (relation.startsWith("..") || relation === "" || /^(?:[A-Za-z]:|\\|\/)/.test(relation)) return undefined;
  return candidate;
}
function rewriteLinks(value: string, record: SnapshotRecord, outputFile: string, workplaceRoot: string): string {
  const base = sourceFile(record, workplaceRoot);
  return safeText(value).replace(/\]\(([^)#]+)(#[^)]+)?\)/g, (match, target: string, anchor: string | undefined) => {
    if (!base || /^(?:[a-z]+:|\/|\\)/i.test(target)) return match;
    const destination = resolve(dirname(base), target);
    const rel = relative(dirname(outputFile), destination).split(sep).join("/");
    return "](" + rel + (anchor ?? "") + ")";
  });
}
function field(value: string | undefined): string { return value ? safeText(value) : "未提供"; }
export function renderCase(record: SnapshotRecord, outputFile: string, workplaceRoot: string,
  generatedAt: string): string {
  const item = record.item;
  const detail = item.experience;
  const body = (value: string) => rewriteLinks(value, record, outputFile, workplaceRoot);
  const original = sourceFile(record, workplaceRoot);
  const originalLink = original
    ? "\n原始整理文件：[" + inline(detail.sourceKey ?? "") + "](" +
      relative(dirname(outputFile), original).split(sep).join("/") + ")。\n"
    : "";
  const clockWarning = Math.abs(record.updatedAt.getTime() - new Date(item.updatedAt).getTime()) > 60_000
    ? "\n> 时间提示：数据库索引列与正文更新时间不一致；保留原值，以版本和摘要核对。\n"
    : "";
  return "# " + safeText(item.title) + "\n\n" +
    "> 数据库派生快照，请勿手动修改。此文件仅代表 " + generatedAt + " 的数据库读取结果。\n" +
    "> 待审核经验只作排查线索；请连同证据状态、适用条件和限制引用。同一来源的多个版本不是独立证据。\n" +
    clockWarning + "\n" +
    "- 实体 ID：" + safeText(record.id) + "\n" +
    "- 数据库版本：" + record.version + "\n" +
    "- 数据库内容摘要 SHA-256：" + payloadHash(item) + "\n" +
    "- 来源类型：" + safeText(item.sourceType) + "\n" +
    "- 来源标识：" + field(detail.sourceKey) + "\n" +
    "- 来源摘要 SHA-256：" + field(detail.sourceRevision) + "\n" +
    "- 来源记录 ID：" + field(item.sourceId) + "\n" +
    "- 数据库更新时间：" + record.updatedAt.toISOString() + "\n" +
    "- 快照生成时间：" + generatedAt + "\n" +
    "- 来源项目：" + safeText(detail.sourceProject) + "\n" +
    "- 标签：" + (item.tags.length ? item.tags.map(inline).join("、") : "未提供") + "\n" +
    "- 审核状态：" + safeText(detail.reviewStatus) + "\n" +
    "- 证据状态：" + safeText(detail.evidenceStatus) + "\n\n" +
    "## 现象\n\n" + body(detail.phenomenon) + "\n\n" +
    "## 环境与版本\n\n" + body(detail.environment) + "\n\n" + body(detail.sourceVersion) + "\n\n" +
    "## 排查过程\n\n" + body(detail.investigation) + "\n\n" +
    "## 失败尝试\n\n" + body(detail.failedAttempts) + "\n\n" +
    "## 原因\n\n" + body(detail.cause) + "\n\n" +
    "## 解决办法\n\n" + body(detail.resolution) + "\n\n" +
    "## 验证结果\n\n" + body(detail.verificationResult) + "\n\n" +
    "## 适用条件\n\n" + body(detail.applicability) + "\n\n" +
    "## 不适用条件与限制\n\n" + body(detail.limitations) + "\n\n" +
    "## 待确认\n\n" + body(detail.openQuestions) + "\n\n" +
    "## 证据来源\n\n" + detail.evidenceSources.map((value) => "- " + body(value)).join("\n") + "\n" +
    originalLink;
}
function isMeta(value: unknown): value is Meta {
  if (!value || typeof value !== "object") return false;
  const meta = value as Partial<Meta>;
  return meta.formatVersion === FORMAT && typeof meta.generatedAt === "string" &&
    typeof meta.batchHash === "string" && Array.isArray(meta.entries) &&
    meta.entries.every((entry) => typeof entry.id === "string" && typeof entry.file === "string" &&
      typeof entry.payloadHash === "string" && typeof entry.version === "number" &&
      typeof entry.updatedAt === "string");
}
async function readMeta(root: string): Promise<Meta | PriorMeta | undefined> {
  try {
    const index = await readFile(join(root, "INDEX.md"), "utf8");
    const match = /^<!-- snapshot-meta: (\{[^\n]+\}) -->/m.exec(index);
    if (!match) return undefined;
    const parsed: unknown = JSON.parse(match[1]);
    if (isMeta(parsed)) return parsed;
    if (parsed && typeof parsed === "object" && typeof (parsed as PriorMeta).generatedAt === "string") {
      return parsed as PriorMeta;
    }
    return undefined;
  } catch (cause: unknown) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw cause;
  }
}
async function readStatus(root: string): Promise<StatusMeta | undefined> {
  try {
    const status = await readFile(join(root, "STATUS.md"), "utf8");
    const match = /^<!-- status-meta: (\{[^\n]+\}) -->/m.exec(status);
    if (!match) return undefined;
    const parsed: unknown = JSON.parse(match[1]);
    if (!parsed || typeof parsed !== "object") return undefined;
    const meta = parsed as Partial<StatusMeta>;
    return typeof meta.lastSuccessfulCheckAt === "string" && typeof meta.lastGeneratedAt === "string"
      ? meta as StatusMeta : undefined;
  } catch (cause: unknown) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw cause;
  }
}
async function atomicText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = path + ".tmp-" + randomUUID();
  try {
    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, path);
  } catch (cause: unknown) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw cause;
  }
}
function latestUpdate(meta: Meta): string | undefined {
  return meta.entries.map((entry) => entry.updatedAt).sort().at(-1);
}
async function writeSuccess(root: string, checkedAt: string, meta: Meta): Promise<void> {
  const status: StatusMeta = { lastSuccessfulCheckAt: checkedAt, lastGeneratedAt: meta.generatedAt,
    ...(latestUpdate(meta) ? { databaseUpdatedAt: latestUpdate(meta) } : {}) };
  await atomicText(join(root, "STATUS.md"), "<!-- status-meta: " + JSON.stringify(status) +
    " -->\n# 快照刷新状态\n\n最近一次数据库读取成功；当前状态以 [索引](INDEX.md) 为准。\n\n" +
    "- 最近成功核对时间：" + checkedAt + "\n" +
    "- 当前快照生成时间：" + meta.generatedAt + "\n" +
    "- 数据库更新时间：" + (status.databaseUpdatedAt ?? "无当前记录") + "\n");
}
function currentPath(root: string, file: string): string {
  const absolute = resolve(root, file);
  const rel = relative(resolve(root), absolute);
  if (!rel || rel.startsWith("..") || rel.includes(".." + sep) || !rel.startsWith(".versions" + sep)) {
    throw new Error("SNAPSHOT_INDEX_INVALID");
  }
  return absolute;
}
function renderIndex(meta: Meta, records: SnapshotRecord[]): string {
  const byId = new Map(records.map((record) => [record.id, record]));
  const projects = new Map<string, Entry[]>();
  for (const entry of meta.entries) {
    const project = byId.get(entry.id)?.item.experience.sourceProject ?? "";
    projects.set(project, [...(projects.get(project) ?? []), entry]);
  }
  let content = "<!-- snapshot-meta: " + JSON.stringify(meta) +
    " -->\n# 工作台工程经验数据库快照索引\n\n" +
    "> 数据库派生快照，请勿手动修改。这里只列出上次成功核对时未归档的工程经验。\n" +
    "> 同一来源的多个版本不是独立证据；待审核记录仅作排查线索，须连同证据状态和限制阅读。\n" +
    "> 刷新失败时以 [STATUS.md](STATUS.md) 为准，旧快照仅作历史线索。\n\n" +
    "- 当前快照生成时间：" + meta.generatedAt + "\n" +
    "- 当前记录数：" + meta.entries.length + "\n" +
    "- 数据库更新时间：" + (latestUpdate(meta) ?? "无当前记录") + "\n\n";
  if (meta.entries.length === 0) return content + "## 当前有效记录\n\n无。\n";
  for (const project of [...projects.keys()].sort((a, b) => a.localeCompare(b, "zh-CN"))) {
    content += "## 来源项目：" + inline(project) + "\n\n";
    for (const entry of projects.get(project) ?? []) {
      const record = byId.get(entry.id);
      if (!record) throw new Error("SNAPSHOT_INDEX_INVALID");
      const detail = record.item.experience;
      content += "- [" + inline(record.item.title) + "](" + entry.file + ")：" +
        "标签 " + (record.item.tags.length ? record.item.tags.map(inline).join("、") : "未提供") +
        "；审核 " + inline(detail.reviewStatus) + "；证据 " + inline(detail.evidenceStatus) +
        "；版本 " + entry.version + "；实体 ID " + inline(entry.id) +
        "；来源标识 " + inline(field(detail.sourceKey)) +
        "；来源摘要 " + inline(field(detail.sourceRevision)) +
        "；内容摘要 " + entry.payloadHash + "。\n";
    }
    content += "\n";
  }
  return content;
}
async function prune(root: string, currentFolder: string): Promise<void> {
  const versions = resolve(root, ".versions");
  let entries;
  try { entries = await readdir(versions, { withFileTypes: true }); }
  catch (cause: unknown) {
    if ((cause as NodeJS.ErrnoException).code === "ENOENT") return;
    throw cause;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^(?:batch-|f\d+-v|v)\w/.test(entry.name)) continue;
    const target = resolve(versions, entry.name);
    if (dirname(target) !== versions || target === currentFolder) continue;
    await rm(target, { recursive: true, force: true });
  }
}
export async function lastSuccessfulCheckAt(root: string): Promise<string | null> {
  return (await readStatus(root))?.lastSuccessfulCheckAt ?? (await readMeta(root))?.generatedAt ?? null;
}
export async function markRefreshFailure(root: string, code: string, attemptedAt: string): Promise<void> {
  const prior = await readMeta(root);
  const last = await lastSuccessfulCheckAt(root);
  const updatedAt = (prior && isMeta(prior)) ? latestUpdate(prior) : prior?.updatedAt;
  const status: StatusMeta | undefined = last && prior ? {
    lastSuccessfulCheckAt: last, lastGeneratedAt: prior.generatedAt,
    ...(updatedAt ? { databaseUpdatedAt: updatedAt } : {}),
  } : undefined;
  await atomicText(join(root, "STATUS.md"),
    (status ? "<!-- status-meta: " + JSON.stringify(status) + " -->\n" : "") +
    "# 快照刷新状态\n\n**刷新失败；当前数据库状态未知。** 旧快照仅作历史线索。\n\n" +
    "- 尝试时间：" + attemptedAt + "\n" +
    "- 最后成功核对时间：" + (last ?? "无") + "\n" +
    "- 当前快照生成时间：" + (prior?.generatedAt ?? "无") + "\n" +
    "- 上次核对的数据库更新时间：" + (updatedAt ?? "无当前记录") + "\n" +
    "- 错误代码：" + code + "\n");
}
/** Render every record first, write an immutable batch, then switch the public index once. */
export async function publishSnapshots(root: string, workplaceRoot: string, records: SnapshotRecord[],
  checkedAt = new Date().toISOString(), beforeIndexPublish?: () => Promise<void>): Promise<SnapshotResult> {
  const sorted = [...records].sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(sorted.map((record) => record.id)).size !== sorted.length) throw new Error("SNAPSHOT_DUPLICATE_ID");
  const entries: Entry[] = sorted.map((record) => ({
    id: record.id, version: record.version, updatedAt: record.updatedAt.toISOString(),
    payloadHash: payloadHash(record.item), file: "",
  }));
  const batchHash = sha(JSON.stringify(entries.map((entry) => ({ id: entry.id, version: entry.version, updatedAt: entry.updatedAt, payloadHash: entry.payloadHash }))));
  const prior = await readMeta(root);
  if (prior && isMeta(prior) && prior.batchHash === batchHash) {
    try {
      const index = await readFile(join(root, "INDEX.md"), "utf8");
      if (index !== renderIndex(prior, sorted)) throw new Error("SNAPSHOT_CONTENT_DRIFT");
      for (const entry of prior.entries) {
        const record = sorted.find((candidate) => candidate.id === entry.id);
        if (!record || entry.payloadHash !== payloadHash(record.item)) throw new Error("SNAPSHOT_CONTENT_DRIFT");
        const file = currentPath(root, entry.file);
        if (await readFile(file, "utf8") !== renderCase(record, file, workplaceRoot, prior.generatedAt)) {
          throw new Error("SNAPSHOT_CONTENT_DRIFT");
        }
      }
      await writeSuccess(root, checkedAt, prior);
      return { result: "unchanged", generatedAt: prior.generatedAt, checkedAt,
        count: sorted.length, batchHash };
    } catch (cause: unknown) {
      if ((cause as NodeJS.ErrnoException).code !== "ENOENT" &&
        !(cause instanceof Error && cause.message === "SNAPSHOT_CONTENT_DRIFT")) throw cause;
    }
  }
  const folder = "batch-" + batchHash.slice(0, 16) + "-" + checkedAt.replace(/[^0-9]/g, "") + "-" +
    randomUUID().slice(0, 8);
  const meta: Meta = { formatVersion: FORMAT, generatedAt: checkedAt, batchHash,
    entries: entries.map((entry) => ({
      ...entry, file: ".versions/" + folder + "/" + sha(entry.id) + ".md",
    })) };
  const rendered = meta.entries.map((entry, index) => ({
    file: currentPath(root, entry.file),
    content: renderCase(sorted[index], currentPath(root, entry.file), workplaceRoot, checkedAt),
  }));
  const index = renderIndex(meta, sorted);
  for (const file of rendered) await atomicText(file.file, file.content);
  if (beforeIndexPublish) await beforeIndexPublish();
  await atomicText(join(root, "INDEX.md"), index);
  await writeSuccess(root, checkedAt, meta);
  await prune(root, resolve(root, ".versions", folder)).catch(() => undefined);
  return { result: prior ? "updated" : "created", generatedAt: checkedAt,
    checkedAt, count: sorted.length, batchHash };
}
