# Daily entity API

`POST /api/private/entities/:collection` creates one record. `PATCH` and `DELETE /api/private/entities/:collection/:id` require the record version and use an atomic database check. Every request verifies the GitHub allowlist session and same-origin writes. The server validates fields and references, and rejects deletion while dependent records exist. `GET /api/private/workspace` is the read-only aggregate for existing pages. No endpoint accepts a whole Workspace snapshot for replacement.
