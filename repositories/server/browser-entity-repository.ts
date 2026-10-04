import type { MigrationCollection } from "@/types/migration";
import type { EntityMutationResult, ServerWorkspaceSnapshot } from "@/types/server-workspace";

export class ServerDataError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

async function responseJson<T>(response: Response): Promise<T> {
  const value: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = value && typeof value === "object" && "error" in value &&
      typeof (value as { error: unknown }).error === "string" ? (value as { error: string }).error :
      response.status === 401 ? "登录已失效，请重新登录。" : "服务器数据操作失败。";
    throw new ServerDataError(error, response.status);
  }
  return value as T;
}

export const browserEntityRepository = {
  async load(): Promise<ServerWorkspaceSnapshot> {
    const response = await fetch("/api/private/workspace", { credentials: "same-origin", cache: "no-store" });
    return responseJson<ServerWorkspaceSnapshot>(response);
  },
  async create(collection: MigrationCollection, item: Record<string, unknown>): Promise<EntityMutationResult> {
    const response = await fetch(`/api/private/entities/${collection}`, { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item }) });
    return responseJson<EntityMutationResult>(response);
  },
  async update(collection: MigrationCollection, id: string, version: number,
    item: Record<string, unknown>): Promise<EntityMutationResult> {
    const response = await fetch(`/api/private/entities/${collection}/${encodeURIComponent(id)}`, {
      method: "PATCH", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version, item }),
    });
    return responseJson<EntityMutationResult>(response);
  },
  async delete(collection: MigrationCollection, id: string, version: number): Promise<EntityMutationResult> {
    const response = await fetch(`/api/private/entities/${collection}/${encodeURIComponent(id)}`, {
      method: "DELETE", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version }),
    });
    return responseJson<EntityMutationResult>(response);
  },
};
