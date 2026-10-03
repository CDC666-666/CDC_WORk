# Raw migration source

`readRawBrowserSnapshot` performs six `getItem` calls and never calls the normal
Workspace or content Repository. It does not save, repair, delete, or upload data.
The user must initiate precheck and separately confirm server preview/execution.

`server-repository.ts` uses a compile-time table/column whitelist. It stores each
entity's complete v4 payload plus queryable relationship/status fields in its own
Prisma model; values are SQL parameters. The server migrator checks row hashes and
versions before insert/skip and verifies row counts before marking a batch complete.
