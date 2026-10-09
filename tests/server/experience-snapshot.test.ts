import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import test from "node:test";
import { markRefreshFailure, publishSnapshots, type SnapshotRecord } from "@/services/experience-snapshot";
import { parseAutoAimCase } from "@/services/shared-memory-experience";
import { syntheticCase } from "@/tests/fixtures/experience-case";

function records(): SnapshotRecord[] {
  const source = parseAutoAimCase(syntheticCase, "fixture-workspace");
  if (!source.experience) throw new Error("fixture missing experience");
  const manual = structuredClone(source) as typeof source & { experience: NonNullable<typeof source.experience> };
  manual.id = "experience-manual-b";
  manual.title = "底盘合成案例";
  manual.sourceType = "manual";
  manual.sourceId = undefined;
  manual.experience.sourceProject = "chassis";
  manual.experience.sourceKey = undefined;
  manual.experience.sourceRevision = undefined;
  return [
    { id: source.id, version: 1, updatedAt: new Date("2026-10-08T12:00:00.000Z"),
      item: { ...source, experience: source.experience } },
    { id: manual.id, version: 1, updatedAt: new Date("2026-10-08T12:05:00.000Z"),
      item: { ...manual, experience: manual.experience } },
  ];
}
async function cleanup(root: string): Promise<void> {
  assert.equal(dirname(resolve(root)), resolve(tmpdir()));
  assert.match(basename(root), /^experience-snapshot-/);
  await rm(root, { recursive: true, force: true });
}
function entries(index: string): Array<{id:string;file:string;version:number}> {
  const match = /^<!-- snapshot-meta: (\{[^\n]+\}) -->/m.exec(index);
  if (!match) throw new Error("missing metadata");
  return JSON.parse(match[1]).entries;
}
test("two projects, manual/shared sources, stable filenames, and unchanged check", async () => {
  const root = await mkdtemp(join(tmpdir(), "experience-snapshot-"));
  try {
    const output = join(root, "server-snapshots");
    const data = records();
    const first = await publishSnapshots(output, root, data, "2026-10-08T13:00:00.000Z");
    assert.equal(first.result, "created");
    assert.equal(first.count, 2);
    const index = await readFile(join(output, "INDEX.md"), "utf8");
    assert.match(index, /来源项目：auto_aim/);
    assert.match(index, /来源项目：chassis/);
    assert.match(index, /审核 待审核；证据 历史现场反馈；版本 1/);
    const listed = entries(index);
    assert.equal(listed.length, 2);
    for (const entry of listed) assert.match(entry.file, /^\.versions\/batch-[^/]+\/[a-f0-9]{64}\.md$/);
    const manual = listed.find((entry) => entry.id === "experience-manual-b");
    assert.ok(manual);
    const body = await readFile(resolve(output, manual.file), "utf8");
    assert.match(body, /来源标识：未提供/);
    assert.match(body, /来源摘要 SHA-256：未提供/);
    assert.match(body, /数据库内容摘要 SHA-256：[a-f0-9]{64}/);
    for (const heading of ["现象", "环境与版本", "排查过程", "失败尝试", "原因",
      "解决办法", "验证结果", "适用条件", "不适用条件与限制", "待确认", "证据来源"]) {
      assert.match(body, new RegExp("## " + heading));
    }
    const second = await publishSnapshots(output, root, data, "2026-10-08T14:00:00.000Z");
    assert.equal(second.result, "unchanged");
    assert.equal(second.generatedAt, first.generatedAt);
    assert.equal(await readFile(join(output, "INDEX.md"), "utf8"), index);
    const status = await readFile(join(output, "STATUS.md"), "utf8");
    assert.match(status, /最近成功核对时间：2026-10-08T14:00:00.000Z/);
    assert.match(status, /当前快照生成时间：2026-10-08T13:00:00.000Z/);
    assert.match(status, /数据库更新时间：2026-10-08T12:05:00.000Z/);
    assert.equal((await readdir(join(output, ".versions"))).length, 1);
    await writeFile(resolve(output, manual.file), "drift");
    const repaired = await publishSnapshots(output, root, data, "2026-10-08T15:00:00.000Z");
    assert.equal(repaired.result, "updated");
    assert.equal((await readdir(join(output, ".versions"))).length, 1);
  } finally { await cleanup(root); }
});
test("edit, deletion and archival remove stale entries after a complete batch", async () => {
  const root = await mkdtemp(join(tmpdir(), "experience-snapshot-"));
  try {
    const output = join(root, "server-snapshots");
    const data = records();
    await publishSnapshots(output, root, data, "2026-10-08T13:00:00.000Z");
    data[1].version = 2;
    data[1].item.experience.cause = "合成更新";
    await publishSnapshots(output, root, data, "2026-10-08T14:00:00.000Z");
    let index = await readFile(join(output, "INDEX.md"), "utf8");
    assert.match(index, /版本 2/);
    const listed = entries(index);
    assert.match(await readFile(resolve(output, listed.find((entry) => entry.id === data[1].id)!.file), "utf8"),
      /合成更新/);
    await publishSnapshots(output, root, data.slice(0, 1), "2026-10-08T15:00:00.000Z");
    index = await readFile(join(output, "INDEX.md"), "utf8");
    assert.equal(entries(index).length, 1);
    assert.doesNotMatch(index, /chassis/);
    await publishSnapshots(output, root, [], "2026-10-08T16:00:00.000Z");
    index = await readFile(join(output, "INDEX.md"), "utf8");
    assert.match(index, /当前有效记录\n\n无/);
    assert.equal(entries(index).length, 0);
  } finally { await cleanup(root); }
});
test("mid-batch failure keeps old complete index and cases", async () => {
  const root = await mkdtemp(join(tmpdir(), "experience-snapshot-"));
  try {
    const output = join(root, "server-snapshots");
    const data = records();
    await publishSnapshots(output, root, data, "2026-10-08T13:00:00.000Z");
    await publishSnapshots(output, root, data, "2026-10-08T13:30:00.000Z");
    const old = await readFile(join(output, "INDEX.md"), "utf8");
    const oldBodies = await Promise.all(entries(old).map((entry) => readFile(resolve(output, entry.file), "utf8")));
    data[1].version = 2;
    data[1].item.experience.cause = "新合成结论";
    await assert.rejects(publishSnapshots(output, root, data, "2026-10-08T14:00:00.000Z",
      async () => { throw new Error("injected failure"); }));
    await markRefreshFailure(output, "SNAPSHOT_FAILED", "2026-10-08T14:00:00.000Z");
    assert.equal(await readFile(join(output, "INDEX.md"), "utf8"), old);
    assert.deepEqual(await Promise.all(entries(old).map((entry) => readFile(resolve(output, entry.file), "utf8"))),
      oldBodies);
    assert.match(await readFile(join(output, "STATUS.md"), "utf8"),
      /最后成功核对时间：2026-10-08T13:30:00.000Z/);
    const recovered = await publishSnapshots(output, root, data, "2026-10-08T15:00:00.000Z");
    assert.equal(recovered.result, "updated");
    assert.equal((await readdir(join(output, ".versions"))).length, 1);
  } finally { await cleanup(root); }
});
test("credential-shaped content is rejected before index switch", async () => {
  const root = await mkdtemp(join(tmpdir(), "experience-snapshot-"));
  try {
    const output = join(root, "server-snapshots");
    const data = records();
    await publishSnapshots(output, root, data);
    const old = await readFile(join(output, "INDEX.md"), "utf8");
    data[1].item.experience.cause = "GITHUB_CLIENT_SECRET=synthetic-only";
    await assert.rejects(publishSnapshots(output, root, data), /SNAPSHOT_SENSITIVE_CONTENT/);
    assert.equal(await readFile(join(output, "INDEX.md"), "utf8"), old);
  } finally { await cleanup(root); }
});
