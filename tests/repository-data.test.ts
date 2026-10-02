import assert from "node:assert/strict";
import test from "node:test";

import { createInitialWorkspaceData } from "@/data/initial-workspace-data";
import { LEGACY_TASK_STORAGE_KEY } from "@/lib/storage/workspace-migration";
import { createContentStateRepository, CONTENT_STATE_STORAGE_KEY } from "@/repositories/content-state-repository";
import type { StorageAdapter } from "@/repositories/storage-adapter";
import {
  createWorkspaceRepository,
  LEGACY_WORKSPACE_STORAGE_KEY,
  LEGACY_WORKSPACE_V3_STORAGE_KEY,
  WORKSPACE_STORAGE_KEY,
} from "@/repositories/workspace-repository";
import { createContentStateService } from "@/services/content-state-service";
import { createWorkspaceDataService } from "@/services/workspace-data-service";
import type { ContentItem } from "@/types/content";
import type { WorkspaceDataV2 } from "@/types/workspace";

class MemoryStorageAdapter implements StorageAdapter {
  readonly values = new Map<string, string>();
  failWrites = false;

  async getItem(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async setItem(key: string, value: string): Promise<boolean> {
    if (this.failWrites) return false;
    this.values.set(key, value);
    return true;
  }

  async removeItem(key: string): Promise<void> {
    this.values.delete(key);
  }
}

const fixedNow = new Date("2026-07-14T08:00:00+08:00");

function createV2Data(): WorkspaceDataV2 {
  const data = createInitialWorkspaceData(fixedNow);
  return {
    tasks: data.tasks,
    studyPlans: data.studyPlans,
    studySessions: data.studySessions,
    readingItems: data.readingItems,
    metadata: { schemaVersion: 2, createdAt: data.metadata.createdAt, updatedAt: data.metadata.updatedAt },
  };
}

test("Workspace Repository loads v3 data and saves a v4 copy", async () => {
  const storage = new MemoryStorageAdapter();
  const data = createInitialWorkspaceData(fixedNow);
  storage.values.set(LEGACY_WORKSPACE_V3_STORAGE_KEY, JSON.stringify(data));

  const result = await createWorkspaceDataService(createWorkspaceRepository(storage)).load();

  assert.equal(result.recoveryKind, "migration");
  assert.equal(result.data.tasks[0].id, data.tasks[0].id);
  assert.equal(storage.values.has(LEGACY_WORKSPACE_V3_STORAGE_KEY), true);
  assert.equal(JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null").metadata.schemaVersion, 4);
});

test("v2 migration writes v4 before removing the old key", async () => {
  const storage = new MemoryStorageAdapter();
  const oldData = createV2Data();
  storage.values.set(LEGACY_WORKSPACE_STORAGE_KEY, JSON.stringify(oldData));

  const result = await createWorkspaceDataService(createWorkspaceRepository(storage)).load();

  assert.equal(result.recoveryKind, "migration");
  assert.deepEqual(result.data.tasks, oldData.tasks);
  assert.equal(storage.values.has(LEGACY_WORKSPACE_STORAGE_KEY), false);
  assert.equal(JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null").metadata.schemaVersion, 4);
});

test("failed migration write leaves the v2 data untouched", async () => {
  const storage = new MemoryStorageAdapter();
  storage.values.set(LEGACY_WORKSPACE_STORAGE_KEY, JSON.stringify(createV2Data()));
  storage.failWrites = true;

  const result = await createWorkspaceDataService(createWorkspaceRepository(storage)).load();

  assert.equal(result.recoveryKind, "migration");
  assert.equal(storage.values.has(LEGACY_WORKSPACE_STORAGE_KEY), true);
  assert.equal(storage.values.has(WORKSPACE_STORAGE_KEY), false);
});

test("legacy completed-task state is migrated through the Repository", async () => {
  const storage = new MemoryStorageAdapter();
  const taskId = createInitialWorkspaceData(fixedNow).tasks[0].id;
  storage.values.set(LEGACY_TASK_STORAGE_KEY, JSON.stringify([taskId]));

  const result = await createWorkspaceDataService(createWorkspaceRepository(storage)).load();

  assert.equal(result.recoveryKind, "migration");
  assert.equal(result.data.tasks.find((task) => task.id === taskId)?.status, "已完成");
  assert.equal(storage.values.has(LEGACY_TASK_STORAGE_KEY), false);
});

test("reset clears legacy keys and saves a fresh v4 domain workspace", async () => {
  const storage = new MemoryStorageAdapter();
  storage.values.set(LEGACY_WORKSPACE_STORAGE_KEY, "old");
  storage.values.set(LEGACY_TASK_STORAGE_KEY, "old");
  const service = createWorkspaceDataService(createWorkspaceRepository(storage));

  const resetData = await service.reset();

  assert.equal(storage.values.has(LEGACY_WORKSPACE_STORAGE_KEY), false);
  assert.equal(storage.values.has(LEGACY_TASK_STORAGE_KEY), false);
  assert.equal(resetData.metadata.schemaVersion, 3);
  assert.equal(storage.values.has(WORKSPACE_STORAGE_KEY), true);
  assert.equal(JSON.parse(storage.values.get(WORKSPACE_STORAGE_KEY) ?? "null").metadata.schemaVersion, 4);
});

test("Content Repository overlays only saved item state", async () => {
  const storage = new MemoryStorageAdapter();
  const item: ContentItem = {
    id: "content-1", title: "CAN", source: "github", contentType: "article", author: "demo",
    publishedAt: "2026-07-14", thumbnailUrl: "", originalUrl: "", durationMinutes: 0,
    rawDescription: "", aiSummary: { overview: "", keyPoints: [], learningOutcome: "" },
    projectRelevance: "", recommendationScore: 0, recommendationReason: "",
    recommendation: { score: 0, level: "一般", reason: "" }, tags: [],
    status: "unprocessed", isFavorite: false, isInKnowledgeBase: false, isInStudyPlan: false,
    addedAt: "2026-07-14",
  };
  storage.values.set(CONTENT_STATE_STORAGE_KEY, JSON.stringify({
    version: 1,
    items: { "content-1": { status: "completed", isFavorite: true, isInKnowledgeBase: false, isInStudyPlan: false } },
  }));

  const service = createContentStateService(createContentStateRepository(storage));
  const loaded = await service.load([item]);

  assert.equal(loaded[0].title, "CAN");
  assert.equal(loaded[0].status, "completed");
  assert.equal(loaded[0].isFavorite, true);
  assert.equal(await service.save(loaded), true);
  assert.equal(JSON.parse(storage.values.get(CONTENT_STATE_STORAGE_KEY) ?? "null").version, 1);
});

test("malformed content state is discarded without failing the page", async () => {
  const storage = new MemoryStorageAdapter();
  storage.values.set(CONTENT_STATE_STORAGE_KEY, "{broken");
  const service = createContentStateService(createContentStateRepository(storage));

  assert.deepEqual(await service.load([]), []);
  assert.equal(storage.values.has(CONTENT_STATE_STORAGE_KEY), false);
});
