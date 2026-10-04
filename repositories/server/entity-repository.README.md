# Server entity repository

All 28 domain collections use one compile-time table/column registry. The repository writes one entity at a time and updates its JSON payload, structured columns, relation references, version, and timestamp in the same SQL statement. Migration provenance remains nullable for native records and unchanged on later edits to migrated records.
