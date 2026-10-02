# Local schema migration

`workspace-migration.ts` converts v3 arrays into `WorkspaceDomainState` v4 and
projects v4 back to the unchanged `WorkspaceData` shape for current UI pages.
V3 `dueAt` becomes v4 `deadline`; v3 task creation provenance is preserved
separately from v4 domain `sourceType`/`relatedId`. Project publication defaults
to `PRIVATE`; unknown structured log/experiment fields remain empty. All v3
collections are retained, including those stored in `legacy`.

`domain-validation.ts` checks untrusted v4 localStorage and imported backups
before use. The repository first reads v4, then v3, v2, and the old task key.
It writes v4 before removing older migratable keys. The old v3 key is retained
as a recovery copy. No Prisma or server database migration is performed here.
