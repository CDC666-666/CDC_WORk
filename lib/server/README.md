# Server boundary

`prisma.ts` is server-only and keeps the PostgreSQL connection out of client bundles.
`auth.ts` configures GitHub OAuth with a single numeric GitHub ID allowlist. Empty
credentials or an empty allowlist never grant access. `private-api.ts` checks the
database session for every private API request and checks request origin for writes.
The protected App Router group calls the same session check on the server.
`middleware.ts` only redirects requests with no session cookie early; a cookie by
itself never grants access.

`calendar-date.ts` parses date-only values using UTC calendar arithmetic without
converting a local calendar day to another date. `api-response.ts` returns explicit
JSON errors and disables caching on private API responses.
