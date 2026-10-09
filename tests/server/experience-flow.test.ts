import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaClient } from "@prisma/client";
import { createExperienceKnowledge, filterExperiences, withExperienceReviewStatus } from "@/services/engineering-experience-service";
import { serverWorkspaceEntityService } from "@/services/server/workspace-entity-service";
import { importAutoAimCase } from "@/services/server/shared-memory-import";
import { syntheticCase } from "@/tests/fixtures/experience-case";
import type { KnowledgeItem } from "@/types/knowledge";

test("database experience persists edits, filters, protects evidence and versions, and imports once",
  { skip: !process.env.DATABASE_URL }, async () => {
    const db = new PrismaClient();
    const marker = randomUUID();
    const user = await db.user.create({ data: { githubId: `experience-${marker}` } });
    const workspace = await db.workspace.create({ data: { userId: user.id } });
    try {
      const first = await importAutoAimCase(workspace.id, syntheticCase);
      assert.equal(first.result, "created");
      const second = await importAutoAimCase(workspace.id, syntheticCase);
      assert.equal(second.result, "already_exists");
      assert.equal(second.id, first.id);
      assert.equal(await db.knowledge.count({ where: { workspaceId: workspace.id } }), 1);

      const fresh = new PrismaClient();
      try {
        const persisted = await fresh.knowledge.findFirst({ where: { workspaceId: workspace.id, id: first.id } });
        assert.ok(persisted?.payload);
        const importedPayload = persisted.payload as Record<string, unknown>;
        assert.equal(typeof importedPayload.updatedAt, "string");
        assert.ok(Math.abs(persisted.updatedAt.getTime() - Date.parse(String(importedPayload.updatedAt))) < 10_000,
          "database updatedAt must use UTC wall time, independent of the PostgreSQL session time zone");
        const snapshot = await serverWorkspaceEntityService.snapshot(workspace.id);
        const found = filterExperiences(snapshot.domain.knowledge as KnowledgeItem[], {
          query: "机械对齐", project: "auto_aim", tag: "初始化", evidenceStatus: "历史现场反馈",
        });
        assert.equal(found.length, 1);
        assert.equal(filterExperiences(snapshot.domain.knowledge as KnowledgeItem[], {
          query: "机械对齐", project: "other", tag: "初始化", evidenceStatus: "历史现场反馈",
        }).length, 0);
        assert.equal(filterExperiences(snapshot.domain.knowledge as KnowledgeItem[], {
          query: "机械对齐", project: "auto_aim", tag: "missing", evidenceStatus: "历史现场反馈",
        }).length, 0);
        assert.equal(filterExperiences(snapshot.domain.knowledge as KnowledgeItem[], {
          query: "机械对齐", project: "auto_aim", tag: "初始化", evidenceStatus: "实测验证",
        }).length, 0);
        const reviewed = withExperienceReviewStatus(found[0], "已审核");
        const updated = await serverWorkspaceEntityService.update(workspace.id, "knowledge", first.id,
          snapshot.versions[`knowledge:${first.id}`], reviewed);
        assert.equal((updated.item?.experience as { reviewStatus: string }).reviewStatus, "已审核");
        assert.equal((updated.item?.experience as { evidenceStatus: string }).evidenceStatus, "历史现场反馈");
        assert.ok(updated.version);
        const edited = createExperienceKnowledge({ title: "测试案例：服务器编辑", tags: ["初始化", "反馈延迟"],
          experience: { ...reviewed.experience!, phenomenon: "编辑后的现象", environment: "编辑后的环境",
            sourceVersion: "编辑后的版本", investigation: "编辑后的排查", failedAttempts: "编辑后的失败尝试",
            cause: "编辑后的原因", resolution: "编辑后的方案", verificationResult: "编辑后的验证",
            evidenceSources: ["测试证据 A", "测试证据 B"], applicability: "编辑后的适用条件",
            limitations: "编辑后的限制", openQuestions: "编辑后的待确认" } }, reviewed);
        const saved = await serverWorkspaceEntityService.update(workspace.id, "knowledge", first.id,
          updated.version, edited);
        assert.ok(saved.version);
        await assert.rejects(serverWorkspaceEntityService.update(workspace.id, "knowledge", first.id,
          updated.version, edited), (error: unknown) => (error as { status?: number }).status === 409);
        const reloaded = await fresh.knowledge.findFirst({ where: { workspaceId: workspace.id, id: first.id } });
        assert.ok(reloaded?.payload);
        const editedPayload = reloaded.payload as Record<string, unknown>;
        assert.ok(Math.abs(reloaded.updatedAt.getTime() - Date.parse(String(editedPayload.updatedAt))) < 10_000);
        const reloadedItem = (await serverWorkspaceEntityService.get(workspace.id, "knowledge", first.id)).item as unknown as KnowledgeItem;
        assert.equal(reloadedItem.title, edited.title);
        assert.deepEqual(reloadedItem.tags, edited.tags);
        assert.deepEqual(reloadedItem.experience, edited.experience);
        assert.equal(reloadedItem.experience?.reviewStatus, "已审核");
        assert.equal(reloadedItem.experience?.evidenceStatus, "历史现场反馈");
        const third = await importAutoAimCase(workspace.id, syntheticCase.replace("核对模式。", "核对另一种模式。"));
        assert.equal(third.result, "already_exists");
        assert.equal(third.sourceChanged, true);
        const afterReimport = (await serverWorkspaceEntityService.get(workspace.id, "knowledge", first.id)).item as unknown as KnowledgeItem;
        assert.deepEqual(afterReimport, reloadedItem);
        assert.equal(await fresh.knowledge.count({ where: { workspaceId: workspace.id } }), 1);
      } finally { await fresh.$disconnect(); }
    } finally {
      await db.knowledge.deleteMany({ where: { workspaceId: workspace.id } });
      await db.workspace.delete({ where: { id: workspace.id } });
      await db.user.delete({ where: { id: user.id } });
      await db.$disconnect();
    }
  });
