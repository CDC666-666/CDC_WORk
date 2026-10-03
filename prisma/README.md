# Sprint 5.1 schema

Prisma 6.19.3 is pinned with `@prisma/client` at the same version. The first migration
creates authentication tables, one Workspace per User, and Project/Review/Attachment
tables required by the server reflection API. Existing localStorage v4 data is not
imported or changed by this migration.

`Review.version` starts at 1. Updates and deletes use `WHERE id, workspaceId, version`
in a database transaction; stale callers receive HTTP 409. Project references use a
composite workspace-scoped foreign key with restricted deletion. Attachment references
are polymorphic and are checked by the service until their full migration in 5.2.

The SQL migration was generated from `schema.prisma` with `prisma migrate diff` and
must be deployed before starting the API. Date-only business values use PostgreSQL
`date`; API values use `YYYY-MM-DD`. Timestamps are UTC ISO 8601. Future money API
fields will use decimal strings.
