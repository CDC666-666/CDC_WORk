# Server repositories

`review-repository.ts` implements server reflections. `entity-repository.ts`
implements the other business collections through a fixed table registry. Every
query is scoped to the authenticated Workspace. Individual writes keep JSON
payloads, indexed columns, relation references, version, and update time in the
same transaction. Update and delete require the expected version.

`browser-entity-repository.ts` is the private API client used by the daily
Workspace provider. The older localStorage repositories remain available for
explicit legacy backup tools and the isolated migration page; they are not the
daily page adapter.
