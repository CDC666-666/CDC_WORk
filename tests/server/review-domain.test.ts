import assert from "node:assert/strict";
import test from "node:test";

import { ApiError } from "@/lib/server/api-response";
import { canonicalReviewDate, formatDateOnly, parseDateOnly } from "@/lib/server/calendar-date";
import { createServerReviewService, type ServerReviewStore } from "@/services/server/review-domain";
import { parseReviewCreate, parseReviewPatch, parseReviewQuery } from "@/services/server/review-input";
import type { ReviewCreate, ServerReview } from "@/types/server-review";

const base: ReviewCreate = { type: "DAILY", date: "2026-10-03", summary: "今天的总结",
  achievement: "完成测试", problem: "", plan: "继续开发" };

test("calendar dates stay YYYY-MM-DD and weekly/monthly dates normalize", () => {
  assert.equal(formatDateOnly(canonicalReviewDate("WEEKLY", "2026-10-04")), "2026-09-28");
  assert.equal(formatDateOnly(canonicalReviewDate("MONTHLY", "2026-10-31")), "2026-10-01");
  assert.equal(formatDateOnly(parseDateOnly("2026-10-03")), "2026-10-03");
  assert.throws(() => parseDateOnly("2026-02-30"));
  assert.equal(parseReviewCreate({ ...base, type: "PROJECT", relatedProjectId: "project-1" }).relatedProjectId, "project-1");
  assert.throws(() => parseReviewCreate({ ...base, type: "PROJECT" }), ApiError);
  assert.throws(() => parseReviewPatch({ summary: "变更" }), ApiError);
  assert.throws(() => parseReviewQuery(new URLSearchParams("dateFrom=2026-10-04&dateTo=2026-10-03")), ApiError);
});

test("service preserves source fields, reports write errors, and checks versions", async () => {
  const records = new Map<string, ServerReview>();
  const projects = new Set(["project-1"]);
  let failNextWrite = false;
  const store: ServerReviewStore = {
    async list(_workspaceId, query) {
      return [...records.values()].filter((item) => !query?.type || item.type === query.type);
    },
    async get(_workspaceId, id) { return records.get(id) ?? null; },
    async create(_workspaceId, draft) {
      if (draft.relatedProjectId && !projects.has(draft.relatedProjectId)) throw new ApiError(422, "关联项目不存在。");
      if (failNextWrite) { failNextWrite = false; throw new Error("database unavailable"); }
      const item: ServerReview = { ...draft, id: "review-1", version: 1,
        createdAt: "2026-10-03T00:00:00.000Z", updatedAt: "2026-10-03T00:00:00.000Z" };
      records.set(item.id, item);
      return item;
    },
    async update(_workspaceId, id, version, draft) {
      const current = records.get(id);
      if (!current || current.version !== version) throw new ApiError(409, "版本冲突。");
      if (draft.relatedProjectId && !projects.has(draft.relatedProjectId)) throw new ApiError(422, "关联项目不存在。");
      if (failNextWrite) { failNextWrite = false; throw new Error("database unavailable"); }
      const item = { ...current, ...draft, version: version + 1 };
      records.set(id, item);
      return item;
    },
    async delete(_workspaceId, id, version) {
      if (records.get(id)?.version !== version) throw new ApiError(409, "版本冲突。");
      records.delete(id);
    },
  };
  const service = createServerReviewService(store);
  failNextWrite = true;
  await assert.rejects(service.create("workspace-1", base));
  assert.equal((await service.list("workspace-1")).length, 0);
  const created = await service.create("workspace-1", base);
  assert.equal(created.version, 1);
  failNextWrite = true;
  await assert.rejects(service.update("workspace-1", created.id, { version: 1, summary: "未写入" }));
  assert.equal((await service.get("workspace-1", created.id)).summary, base.summary);
  const updated = await service.update("workspace-1", created.id, { version: 1, plan: "新计划" });
  assert.equal(updated.summary, base.summary);
  assert.equal(updated.version, 2);
  await assert.rejects(service.update("workspace-1", created.id, { version: 1, summary: "旧设备覆盖" }),
    (error: unknown) => error instanceof ApiError && error.status === 409);
  await assert.rejects(service.update("workspace-1", created.id, { version: 2, relatedProjectId: "missing" }),
    (error: unknown) => error instanceof ApiError && error.status === 422);
  assert.equal((await service.get("workspace-1", created.id)).plan, "新计划");
  await service.delete("workspace-1", created.id, 2);
  assert.equal((await service.list("workspace-1")).length, 0);
});
