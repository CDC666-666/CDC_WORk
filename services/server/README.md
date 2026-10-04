# Server business service

`workspace-entity-service.ts` reads an aggregate for the existing UI and writes one entity per request. A write validates the authenticated workspace, input, referenced records and dependent records, then changes payload, indexed columns, relation references, version and update time in one PostgreSQL transaction. Stale versions return HTTP 409. Engineering log time, learning session progress and skill evidence score are changed in the same transaction as their source record.

`workspace-action-mapping.ts` converts existing page actions into individual entity mutations. It rejects `workspace/replaced`; the daily workbench never sends or saves an entire Workspace snapshot. Assignment remains the only stored source of an academic task.

Date-only fields use local `YYYY-MM-DD` strings in JSON and PostgreSQL `DATE` columns. Instants use ISO 8601 strings with a timezone; money is a JSON number checked for exact cents before writing to `NUMERIC(20,2)`. Migration source hashes and batch IDs are nullable for newly created records; migrated rows keep their provenance and receive the same version checks when edited.
