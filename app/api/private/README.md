# Private API v1

- `GET/POST /api/private/projects`: list or create a minimal server project.
- `GET/POST /api/private/reviews`: list/filter or create reflections.
- `GET/PATCH/DELETE /api/private/reviews/:id`: read, update, or delete one reflection.

Every handler calls the server session/Workspace check. Mutations require an Origin
matching `NEXTAUTH_URL`. PATCH requires a JSON `version` integer; DELETE requires
`If-Match: "<version>"`. Version conflicts return 409. Successful writes are sent
only after the database transaction commits. No client page calls these routes yet.

Dates are `YYYY-MM-DD`; timestamps are UTC ISO 8601. Future currency amounts will
be decimal strings to prevent floating point loss in JSON.
