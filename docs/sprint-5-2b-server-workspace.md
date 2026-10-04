# Sprint 5.2B server workbench coverage

The private layout checks the GitHub allowlist on the server, mounts the server Workspace provider, and reads `/api/private/workspace`. Every daily write uses `/api/private/entities/:collection` or `/api/private/entities/:collection/:id` with an explicit create, update or delete operation. The API checks identity and same origin for writes. A successful mutation refreshes the shared aggregate; a failed write leaves the form open and reports the error. A read failure blocks the workbench with a retry action. An empty database shows a migration link and does not import local data.

| Business area / current view | PostgreSQL collections | Daily access |
| --- | --- | --- |
| Projects and project detail | `projects`, `projectModules`, `projectMilestones` | Aggregate read; individual CRUD |
| Tasks, home and calendar | `tasks` | Individual CRUD; home and calendar derive from aggregate |
| Engineering logs and tests | `engineeringLogs`, `experiments` | Individual CRUD |
| Knowledge | `knowledge` | Individual CRUD |
| Skills and evidence | `skills`, `skillEvidence` | Individual CRUD; score changes with evidence transaction |
| Academic | `semesters`, `courses`, `chapters`, `classSessions`, `assignments`, `exams` | Individual CRUD; assignment is the sole stored source of home/calendar homework |
| Summaries and project reflections | `reviews` | Individual CRUD; project links checked |
| Growth timeline and attachments | `timeline`, `attachments` | Aggregate/API and migration coverage; no dedicated editor exists today |
| Learning | `studyPlans`, `studySessions` | Individual CRUD; plan progress changes with session transaction |
| Reading | `readingItems` | Individual CRUD |
| Issue closure | `technicalIssues`, `issueSolutions` | Individual CRUD |
| Reports | `reports` | Individual CRUD; deterministic template generation remains client side |
| Resume materials | `resumeMaterials` | Individual CRUD |
| Manual calendar entries | `calendarEvents` | Individual CRUD; derived entries are read only |
| Personal finance | `financeTransactions` | Individual CRUD with exact cent validation |
| Technical content | `contentStates` | Per item CRUD; the demonstration content catalogue remains in `data/` |

The 28 collections above include every `WorkspaceDomainState` array and the independent content progress state. `metadata` comes from the Workspace row. Static profile text and the clearly labelled demo AI interface are presentation data, not persisted business records.

The six original browser keys and the migration route stay intact. Settings still offers explicit operations on the **old browser data only**; those operations do not write PostgreSQL. The server workbench does not mount `WorkspaceDataProvider`, call its load/save effects, or use a local fallback. Source hashes, batch IDs and source snapshots remain migration provenance; everyday updates change the current payload, indexed columns, relation references, version and update time together. Replaying an old source after a server edit is a conflict.

## Acceptance and limits

- Database tests exercise migration of all 28 collections, native CRUD and versions, project/course relations, invalid dates and amounts, failed writes and retry. HTTP tests cover anonymous/denied access, cross request reads, stale versions and linked deletion. Browser tests cover the raw key preservation route and a temporary migrated project followed by daily task creation, completion, conflict, refresh, second browser read and deletion. The same browser test creates a semester, course and assignment, checks one derived home item and its calendar entry, completes the assignment from home, verifies course detail and a second browser, and confirms no Task row was created. It also opens every sidebar navigation route at 390px, checks for HTTP 200 and horizontal overflow, and verifies that those visits leave old browser keys unchanged.
- CI runs lint, typecheck, unit/database tests, production build, private HTTP/browser tests and `docker compose up --build --wait` with a persistent task and reflection across container restart. The local Windows host has no Docker executable; the Compose result must be read from this PR's CI run.
- Live GitHub OAuth and actual personal browser data migration require local credentials and user action. ECS deployment and removal of the old import/export controls remain later work.
