import { createEmptyWorkspaceData } from "@/data/initial-workspace-data";
import { isWorkspaceDomainBackup } from "@/lib/storage/domain-validation";
import { assertDomainReferences } from "@/lib/storage/domain-relations";
import { migrateWorkspaceV2, migrateWorkspaceV3, projectDomainToWorkspaceV3 } from "@/lib/storage/workspace-migration";
import { normalizeWorkspaceData } from "@/lib/storage/workspace-normalization";
import { isWorkspaceBackup, isWorkspaceBackupV2 } from "@/lib/storage/workspace-validation";
import {
  localWorkspaceRepository,
  type WorkspaceRepository,
} from "@/repositories/workspace-repository";
import type { WorkspaceBackup, WorkspaceData, WorkspaceDomainBackup, WorkspaceDomainState, WorkspaceLoadResult } from "@/types/workspace";

export interface WorkspaceImportPreview {
  app: "CDC AI Workspace";
  schemaVersion: 2 | 3 | 4;
  exportedAt: string;
  data: WorkspaceData;
  domainState: WorkspaceDomainState;
}

export interface WorkspaceDataService {
  load(): Promise<WorkspaceLoadResult>;
  save(data: WorkspaceData): Promise<boolean>;
  reset(): Promise<WorkspaceData>;
  createDomainBackup(data: WorkspaceData, now?: Date): Promise<WorkspaceDomainBackup>;
  importBackup(backup: WorkspaceImportPreview): Promise<WorkspaceData>;
}

export function createWorkspaceDataService(repository: WorkspaceRepository): WorkspaceDataService {
  let pendingOperation: Promise<void> = Promise.resolve();

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pendingOperation.then(operation);
    pendingOperation = result.then(() => undefined, () => undefined);
    return result;
  }

  return {
    load: () => enqueue(() => repository.load()),
    save: (data) => enqueue(() => repository.save(data)),
    reset: () => enqueue(() => repository.reset()),
    createDomainBackup: (data, now = new Date()) => enqueue(async () => {
      if (!(await repository.save(data))) throw new Error("本地数据保存失败，无法生成完整备份。");
      return { app: "CDC AI Workspace", schemaVersion: 4, exportedAt: now.toISOString(),
        data: await repository.loadDomain() };
    }),
    importBackup: (backup) => enqueue(() => repository.replaceDomain(backup.domainState)),
  };
}

export const workspaceDataService = createWorkspaceDataService(localWorkspaceRepository);
export { WORKSPACE_STORAGE_KEY } from "@/repositories/workspace-repository";

export function createWorkspaceInitialState(): WorkspaceData {
  return createEmptyWorkspaceData();
}

export function createWorkspaceBackup(data: WorkspaceData, now = new Date()): WorkspaceBackup {
  return {
    app: "CDC AI Workspace",
    schemaVersion: data.metadata.schemaVersion,
    exportedAt: now.toISOString(),
    data,
  };
}

export function parseWorkspaceBackup(rawValue: string): WorkspaceImportPreview {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("文件不是有效的 JSON。请确认选择了 CDC Workspace 备份文件。");
  }
  if (isWorkspaceDomainBackup(parsed)) {
    assertDomainReferences(parsed.data);
    return { app: parsed.app, schemaVersion: 4, exportedAt: parsed.exportedAt,
      data: normalizeWorkspaceData(projectDomainToWorkspaceV3(parsed.data)), domainState: parsed.data };
  }
  if (isWorkspaceBackup(parsed)) {
    const data = normalizeWorkspaceData(parsed.data);
    const domainState = migrateWorkspaceV3(data);
    assertDomainReferences(domainState);
    return { ...parsed, data, domainState };
  }
  if (isWorkspaceBackupV2(parsed)) {
    const data = normalizeWorkspaceData(migrateWorkspaceV2(parsed.data));
    const domainState = migrateWorkspaceV3(data);
    assertDomainReferences(domainState);
    return {
      app: "CDC AI Workspace",
      schemaVersion: 2,
      exportedAt: parsed.exportedAt,
      data,
      domainState,
    };
  }
  throw new Error("备份结构或 schema version 不受支持，未修改当前数据。");
}
