import { RAW_STORAGE_KEYS, type RawBrowserSnapshot } from "@/types/migration";

/** Deliberately bypasses WorkspaceRepository.load: that method can repair or remove old keys. */
export function readRawBrowserSnapshot(storage: Pick<Storage, "getItem">): RawBrowserSnapshot {
  return Object.fromEntries(RAW_STORAGE_KEYS.map((key) => [key, storage.getItem(key)])) as RawBrowserSnapshot;
}
