# Private API v1

- `GET/POST /api/private/projects`: list or create a minimal server project.
- `GET/POST /api/private/reviews`: list/filter or create reflections.
- `GET/PATCH/DELETE /api/private/reviews/:id`: read, update, or delete one reflection.
- `POST /api/private/migration/preview`: preview all browser collections without writing entities.
- `POST /api/private/migration/execute`: execute a preview by digest; creates a verified batch.
- `GET /api/private/migration/batches/:id`: read a verified result in the current Workspace.

Every handler calls the server session/Workspace check. Mutations require an Origin
matching `NEXTAUTH_URL`. PATCH requires a JSON `version` integer; DELETE requires
`If-Match: "<version>"`. Version conflicts return 409. Successful writes are sent
only after the database transaction commits. The daily Workspace pages do not call
the project or review server routes yet.
The migration page calls only the migration routes after explicit user actions. It does
not switch normal page storage. Each migration route repeats the private server check.

Dates are `YYYY-MM-DD`; timestamps are UTC ISO 8601. Future currency amounts will
be decimal strings to prevent floating point loss in JSON.
