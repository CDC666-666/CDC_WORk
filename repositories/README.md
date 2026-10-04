# Repository data layer

Daily private pages now use `server/browser-entity-repository.ts` to call the
authenticated entity API. The browser storage repositories below are retained
for explicit legacy backup and migration operations only.

All browser storage reads and writes pass through `StorageAdapter`. The
`localStorageAdapter` writes `cdc-workspace-data-v4` and reads the old v3, v2,
and task keys for migration. A valid v3 key is retained after migration as a
recovery copy. Malformed v4 JSON is copied to the recovery key before fallback.
Repository methods are asynchronous and serialize writes.

`workspace-repository.ts` and `content-state-repository.ts` own the persisted
keys, parsing, and local schema migration. `WorkspaceRepository` exposes a v3
facade for the existing pages plus v4 `loadDomain`, `updateDomain`, and
`replaceDomain` methods. V3 page saves merge against the last loaded projection
so newly created v4 projects/tasks are retained. The merge compares each field
with the last UI projection: unchanged UI fields keep domain updates, explicitly
changed UI fields win, and a domain deletion cannot be undone by a stale page.
Page project deletion is rejected when dependent records remain. Repository
methods return typed data rather than serialized JSON. `demo-data-repository.ts` is a read-only
source for demonstration views. Services coordinate operations and business
behavior; components should not import a repository or call `localStorage`
directly.

`readPersistedDomain` reads the current v4 storage key without migration or
writes. It supports recovery export when normal save is blocked by invalid
references.

Server-side repositories and an authenticated API now handle daily records.
Browser components never import Prisma or database credentials. The isolated
migration tool provides the explicit versioned import for older browser data.
