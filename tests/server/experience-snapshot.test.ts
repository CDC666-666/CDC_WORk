import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import test from "node:test";
import { markRefreshFailure, publishSnapshot, type SnapshotRecord } from "@/services/experience-snapshot";
import { parseAutoAimCase } from "@/services/shared-memory-experience";
import { syntheticCase } from "@/tests/fixtures/experience-case";

function record(version = 1): SnapshotRecord {
  const item = parseAutoAimCase(syntheticCase, "fixture-workspace");
  if (!item.experience) throw new Error("fixture missing experience");
  return { id: item.id, version, updatedAt: new Date("2026-10-08T12:00:00.000Z"),
    item: { ...item, experience: item.experience } };
}

async function removeTestDirectory(root: string): Promise<void> {
  assert.equal(dirname(resolve(root)), resolve(tmpdir()));
  assert.match(basename(root), /^experience-snapshot-/);
  await rm(root, { recursive: true, force: true });
}

test("publishes one indexed experience and does not duplicate an unchanged database version", async () => {
  const root = await mkdtemp(join(tmpdir(), "experience-snapshot-"));
  try {
    const output = join(root, "server-snapshots");
    const source = record();
    const first = await publishSnapshot(output, root, { kind: "active", record: source },
      "2026-10-08T13:00:00.000Z");
    assert.equal(first.result, "created");
    const index = await readFile(join(output, "INDEX.md"), "utf8");
    const caseFile = await readFile(resolve(output, first.file ?? ""), "utf8");
    assert.match(index, /审核 \*\*待审核\*\*，证据 \*\*历史现场反馈\*\*/);
    for (const heading of ["现象", "环境与版本", "排查过程", "失败尝试", "原因", "解决办法",
      "验证结果", "适用条件", "不适用条件与限制", "待确认", "证据来源"]) {
      assert.match(caseFile, new RegExp(`## ${heading}`));
    }
    assert.match(caseFile, /数据库派生快照，请勿手动修改/);
    assert.match(caseFile, /数据库版本：`1`/);
    assert.match(caseFile, /来源摘要 SHA-256：`[a-f0-9]{64}`/);
    const second = await publishSnapshot(output, root, { kind: "active", record: source },
      "2026-10-08T14:00:00.000Z");
    assert.equal(second.result, "unchanged");
    assert.equal(second.generatedAt, first.generatedAt);
    assert.equal(await readFile(join(output, "INDEX.md"), "utf8"), index);
    assert.equal((await readdir(join(output, ".versions"))).length, 1);
    await writeFile(resolve(output, first.file ?? ""), "local drift");
    const repaired = await publishSnapshot(output, root, { kind: "active", record: source },
      "2026-10-08T15:00:00.000Z");
    assert.equal(repaired.result, "updated");
    assert.match(await readFile(resolve(output, repaired.file ?? ""), "utf8"), /数据库派生快照/);
    assert.equal((await readdir(join(output, ".versions"))).length, 1);
  } finally { await removeTestDirectory(root); }
});

test("generation failure keeps the previous complete snapshot and reports its success time", async () => {
  const root = await mkdtemp(join(tmpdir(), "experience-snapshot-"));
  try {
    const output = join(root, "server-snapshots");
    const first = await publishSnapshot(output, root, { kind: "active", record: record() },
      "2026-10-08T13:00:00.000Z");
    const oldIndex = await readFile(join(output, "INDEX.md"), "utf8");
    const oldCase = await readFile(resolve(output, first.file ?? ""), "utf8");
    const changed = record(2);
    changed.item.experience.cause = "新的合成结论";
    await assert.rejects(publishSnapshot(output, root, { kind: "active", record: changed },
      "2026-10-08T14:00:00.000Z", async () => { throw new Error("injected failure"); }));
    await markRefreshFailure(output, "SNAPSHOT_FAILED", "2026-10-08T14:00:00.000Z");
    assert.equal(await readFile(join(output, "INDEX.md"), "utf8"), oldIndex);
    assert.equal(await readFile(resolve(output, first.file ?? ""), "utf8"), oldCase);
    const status = await readFile(join(output, "STATUS.md"), "utf8");
    assert.match(status, /刷新失败；当前数据库状态未知/);
    assert.match(status, /2026-10-08T13:00:00.000Z/);
    const recovered = await publishSnapshot(output, root, { kind: "active", record: changed },
      "2026-10-08T15:00:00.000Z");
    assert.equal(recovered.result, "updated");
    assert.match(await readFile(resolve(output, recovered.file ?? ""), "utf8"), /新的合成结论/);
    assert.ok(!(await readFile(join(output, "INDEX.md"), "utf8")).includes(first.file ?? ""));
    assert.equal((await readdir(join(output, ".versions"))).length, 1);
  } finally { await removeTestDirectory(root); }
});

test("deleted or archived source removes the current-case link", async () => {
  const root = await mkdtemp(join(tmpdir(), "experience-snapshot-"));
  try {
    const output = join(root, "server-snapshots");
    await publishSnapshot(output, root, { kind: "active", record: record() });
    const retired = await publishSnapshot(output, root, { kind: "retired", reason: "archived" });
    assert.equal(retired.result, "retired");
    const index = await readFile(join(output, "INDEX.md"), "utf8");
    assert.match(index, /无。数据库记录已归档/);
    assert.doesNotMatch(index, /\]\(\.versions\//);
  } finally { await removeTestDirectory(root); }
});

test("credential-shaped content is rejected before replacing the published index", async () => {
  const root = await mkdtemp(join(tmpdir(), "experience-snapshot-"));
  try {
    const output = join(root, "server-snapshots");
    await publishSnapshot(output, root, { kind: "active", record: record() });
    const oldIndex = await readFile(join(output, "INDEX.md"), "utf8");
    const changed = record(2);
    changed.item.experience.cause = "GITHUB_CLIENT_SECRET=synthetic-only";
    await assert.rejects(publishSnapshot(output, root, { kind: "active", record: changed }),
      /SNAPSHOT_SENSITIVE_CONTENT/);
    assert.equal(await readFile(join(output, "INDEX.md"), "utf8"), oldIndex);
  } finally { await removeTestDirectory(root); }
});
