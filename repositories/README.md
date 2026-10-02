# Repository data layer

All browser storage reads and writes pass through `StorageAdapter`. The
`localStorageAdapter` writes `cdc-workspace-data-v4` and reads the old v3, v2,
and task keys for migration. A valid v3 key is retained after migration as a
recovery copy. Malformed v4 JSON is copied to the recovery key before fallback.
Repository methods are asynchronous and serialize writes.

`workspace-repository.ts` and `content-state-repository.ts` own the persisted
keys, parsing, and local schema migration. `WorkspaceRepository` exposes a v3
facade for the existing pages plus v4 `loadDomain`, `updateDomain`, and
`replaceDomain` methods. V3 page saves merge against the last loaded projection
so newly created v4 projects/tasks are retained. Their public contracts return
typed data rather than serialized JSON. `demo-data-repository.ts` is a read-only
source for demonstration views. Services coordinate operations and business
behavior; components should not import a repository or call `localStorage`
directly.

The future database implementation belongs behind server-side repositories and
an authenticated API or server action. A browser component must never import a
Prisma client or database credentials. Switching storage will also require a
versioned import of existing browser backups; the interface alone does not
migrate user data.
