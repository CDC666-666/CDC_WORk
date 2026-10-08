import assert from "node:assert/strict";
import test from "node:test";
import { createExperienceKnowledge, experienceValidationIssues, filterExperiences,
  withExperienceReviewStatus } from "@/services/engineering-experience-service";
import { parseAutoAimCase, sharedCaseKnowledgeId } from "@/services/shared-memory-experience";
import { syntheticCase } from "@/tests/fixtures/experience-case";

test("shared case keeps a stable identity and separate review/evidence states", () => {
  const item = parseAutoAimCase(syntheticCase, "workspace-one");
  assert.equal(item.id, sharedCaseKnowledgeId("workspace-one"));
  assert.notEqual(item.id, sharedCaseKnowledgeId("workspace-two"));
  assert.equal(item.experience?.evidenceStatus, "历史现场反馈");
  assert.equal(item.experience?.reviewStatus, "待审核");
  const reviewed = withExperienceReviewStatus(item, "已审核");
  assert.equal(reviewed.experience?.reviewStatus, "已审核");
  assert.equal(reviewed.experience?.evidenceStatus, "历史现场反馈");
  assert.equal(experienceValidationIssues(reviewed as unknown as Record<string, unknown>).length, 0);
  assert.throws(() => parseAutoAimCase(syntheticCase.replace("## 来源", "## 无来源"), "workspace-one"));
});

test("experience search and three filters find the source case", () => {
  const imported = parseAutoAimCase(syntheticCase, "workspace-one");
  const items = [imported];
  assert.equal(filterExperiences(items, { query: "机械对齐", project: "auto_aim", tag: "初始化",
    evidenceStatus: "历史现场反馈" }).length, 1);
  assert.equal(filterExperiences(items, { query: "", project: "auto_aim", tag: "",
    evidenceStatus: "实测验证" }).length, 0);
  assert.equal(filterExperiences(items, { query: "", project: "other", tag: "",
    evidenceStatus: "全部" }).length, 0);
  const edited = createExperienceKnowledge({ title: imported.title, tags: imported.tags,
    experience: { ...imported.experience!, reviewStatus: "已审核" } }, imported);
  assert.equal(edited.experience?.sourceRevision, imported.experience?.sourceRevision);
  assert.equal(edited.experience?.evidenceStatus, "历史现场反馈");
});
