import assert from "node:assert/strict";
import test from "node:test";
import { createEmptyWorkspaceData, createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { migrateWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { createQqExperienceKnowledge } from "@/services/engineering-experience-service";
import { searchServerWorkspace } from "@/services/server/global-search";
import type { ServerWorkspaceSnapshot } from "@/types/server-workspace";

const qq = createQqExperienceKnowledge({ title: "CAN 超时排查", body: "检查 4310 电机的 PID 参数与超时重试。",
  sourceGroup: "控制技术讨论", discussionDate: "2026-10-15", excerpt: "原讨论提到 CAN timeout",
  screenshot: "", verification: "待验证", supplement: "尚未在本人设备实测", applicability: "仅适用于相同固件",
  tags: "CAN, PID", projectId: "" });
const domain = migrateWorkspaceV3(createEmptyWorkspaceData());
domain.knowledge = [qq];
domain.reviews = [{ id: "review-1", type: "DAILY", date: "2026-10-15", summary: "复盘 4310",
  achievement: "收获：检查 CAN 总线", problem: "超时仍待定位", plan: "复测 PID" }];
const snapshot: ServerWorkspaceSnapshot = { domain, contentStates: {}, versions: {}, migrationBatchCount: 0, hasServerRecords: true };

test("server search finds Chinese body, case-insensitive technical terms, and QQ source without duplicates", () => {
  const chinese = searchServerWorkspace(snapshot, "CAN 超时");
  assert.equal(chinese.filter((item) => item.id === `工程经验:${qq.id}`).length, 1);
  assert.equal(chinese[0].title, "CAN 超时排查");
  assert.ok(searchServerWorkspace(snapshot, "4310").some((item) => item.href === `/experiences?record=${qq.id}`));
  assert.ok(searchServerWorkspace(snapshot, "pid").some((item) => item.id === `工程经验:${qq.id}`));
  assert.ok(searchServerWorkspace(snapshot, "控制技术讨论").some((item) => item.source.includes("QQ 技术群")));
});

test("search filters by type and tags, keeps reflections on their own record URL, and does not cache deleted records", () => {
  assert.deepEqual(searchServerWorkspace(snapshot, "4310", { type: "总结" }).map((item) => item.id), ["总结:review-1"]);
  assert.equal(searchServerWorkspace(snapshot, "4310", { tag: "PID" }).length, 1);
  assert.equal(searchServerWorkspace(snapshot, "4310", { tag: "missing" }).length, 0);
  assert.equal(searchServerWorkspace(snapshot, "超时", { projectId: "another-workspace" }).length, 0);
  const afterDelete = { ...snapshot, domain: { ...domain, knowledge: [] } };
  assert.equal(searchServerWorkspace(afterDelete, "控制技术讨论").length, 0);
});

test("unified engineering view keeps the original log identity and suppresses a copied experience hit", () => {
  const withLog = migrateWorkspaceV3(createInitialWorkspaceData(new Date("2026-10-18T08:00:00+08:00")));
  const log = { ...withLog.engineeringLogs[0], title: "独立日志标识 X4310", workContent: "记录原始研发过程" };
  withLog.engineeringLogs = [log];
  withLog.knowledge = [{ ...qq, id: "copied-log-experience", title: "独立日志标识 X4310", sourceId: log.id }];
  const result = searchServerWorkspace({ ...snapshot, domain: withLog }, "X4310", { type: "工程经验" });
  assert.deepEqual(result.map((item) => item.href), [`/experiences?record=${log.id}`]);
  assert.equal(withLog.engineeringLogs[0].id, log.id);
});
