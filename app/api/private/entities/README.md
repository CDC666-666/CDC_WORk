# Daily entity API

`POST /api/private/entities/:collection` creates one record. `GET /api/private/entities/:collection/:id` reads one scoped record with its version. `PATCH` and `DELETE` on that URL require the record version and use an atomic database check. Every request verifies the GitHub allowlist session and same-origin writes. The server validates fields and references, and rejects deletion while dependent records exist. `GET /api/private/workspace` is the read-only aggregate for existing pages. No endpoint accepts a whole Workspace snapshot for replacement.

The earlier `/api/private/reviews` routes retain their response format but delegate all mutations to the same entity service. Both route families update the review payload, indexed fields, relation references, version, and update time in one transaction.
