# Server Workspace provider

The private layout mounts this provider after server authentication. It fetches the server aggregate once, exposes the existing v3 page projection and the v4 domain state, and queues per-entity writes with current record versions. A successful write reloads shared state so home, calendar and detail pages see the same committed data. Read errors show a retry screen; write errors keep page forms open and show the server response, including version conflicts.

The browser-only provider and Settings data-management screen have been removed. The server provider does not replace failed reads with demo data. `/migration` redirects to Settings; historical migration API code remains isolated from daily page flows.
