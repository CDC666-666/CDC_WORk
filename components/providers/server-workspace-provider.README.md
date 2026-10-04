# Server Workspace provider

The private layout mounts this provider after server authentication. It fetches the server aggregate once, exposes the existing v3 page projection and the v4 domain state, and queues per-entity writes with current record versions. A successful write reloads shared state so home, calendar and detail pages see the same committed data. Read errors show a retry screen; write errors keep page forms open and show the server response, including version conflicts.

The old `WorkspaceDataProvider` remains available only as migration-era code and is not mounted in private or migration layouts. The migration page has a separate layout. Explicit legacy tools in Settings may still read or change old browser keys; the server provider never loads, saves, repairs or uploads them.
