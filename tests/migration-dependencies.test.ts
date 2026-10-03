import assert from "node:assert/strict";
import test from "node:test";

import { collectMigrationDependencies } from "@/services/migration/dependency-graph";
import type { MigrationDisposition, MigrationEntity } from "@/types/migration";

test("a personal assignment can reveal a two-level demo course dependency without selecting all demos", () => {
  const entities: MigrationEntity[] = [
    { collection: "semesters", id: "demo-semester", sourceOrdinal: 0, payload: {},
      relations: [], origin: "DEMO", reasons: [] },
    { collection: "courses", id: "demo-course", sourceOrdinal: 0, payload: {},
      relations: [{ field: "semesterId", collection: "semesters", id: "demo-semester" }],
      origin: "DEMO", reasons: [] },
    { collection: "assignments", id: "personal-assignment", sourceOrdinal: 0, payload: {},
      relations: [{ field: "courseId", collection: "courses", id: "demo-course" }],
      origin: "PERSONAL", reasons: [] },
    { collection: "courses", id: "other-demo-course", sourceOrdinal: 1, payload: {},
      relations: [], origin: "DEMO", reasons: [] },
  ];
  const skipped = new Map<string, MigrationDisposition>([
    ["semesters:demo-semester", "skip"], ["courses:demo-course", "skip"],
    ["assignments:personal-assignment", "pending"], ["courses:other-demo-course", "skip"],
  ]);
  const dependencies = collectMigrationDependencies(entities, skipped, new Set(), new Set());
  assert.deepEqual(dependencies.map((item) => item.requiredKey).sort(),
    ["courses:demo-course", "semesters:demo-semester"]);
  assert.equal(dependencies.every((item) => !item.satisfied && item.requiredOrigin === "DEMO"), true);
  const selected = new Set(["courses:demo-course", "semesters:demo-semester"]);
  const planned = new Map(skipped);
  planned.set("courses:demo-course", "write");
  planned.set("semesters:demo-semester", "write");
  planned.set("assignments:personal-assignment", "write");
  assert.equal(collectMigrationDependencies(entities, planned, new Set(), selected)
    .every((item) => item.satisfied), true);
});
