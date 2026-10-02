# Domain services

`ProjectService`, `TaskService`, `AcademicService`, and `ReviewService` provide
asynchronous `create`, `update`, `delete`, and `query` operations over
`WorkspaceDomainState`. They use `WorkspaceRepository.updateDomain` so each
change is validated and stored as one serialized v4 write. Project/course
relations are checked before task creation and update; deletes reject records
with dependent data. Existing page helpers and the v3 reducer remain in place.

`WorkspaceDataService` coordinates page load/save, v4 backup export/import,
and v2/v3 backup parsing. Services do not access `localStorage` directly.
Its recovery export reads the persisted v4 state without saving, labels the
file, and includes broken-reference details. Normal import rejects recovery
files and keeps reference validation in force.
Later server implementations can provide the same repository contract behind
authenticated endpoints; browser code must not import a database client.
