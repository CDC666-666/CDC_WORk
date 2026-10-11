# Server database backup and recovery drill

Status checked 2026-10-11 for `codex/launch-prep` based on `main@2eb70879cc47e984839f59cf694aa3605e597908`. The server is accessed through an SSH tunnel; these archives include personal and authentication data and must remain outside Git.

The server-only installation copies `ops/backup-database.sh` to `/opt/cdc-work/ops/` and the two systemd units to `/etc/systemd/system/`. The timer runs at **03:15 Asia/Shanghai daily** with `Persistent=true`. It writes `pg_dump -Fc -b` archives to `/var/backups/cdc-work/automatic/` (directory 0700; archives, manifests and log 0600). Each run checks `pg_restore --list`, fully decodes the archive with `pg_restore --file=/dev/null`, records SHA-256, size, PostgreSQL version and deployed Git commit, then publishes the complete archive and manifest. Failed runs write a timestamped `FAILED` entry to `backup.log` and remove partial files; systemd also records the failed service. A lock prevents overlapping runs. Successful runs retain all archives for 30 days and at least the newest two. Monitor available disk space; the script refuses to start below 1 GiB free.

Useful checks on the server:

```sh
systemctl list-timers cdc-work-db-backup.timer --no-pager
systemctl status cdc-work-db-backup.service --no-pager
tail -n 20 /var/backups/cdc-work/automatic/backup.log
```

The first manual run on 2026-10-11 produced a 93,706-byte archive. Its SHA-256 was `8cdc91635dc52addb9eda8fd9ae3a8ae6ad9059026f90e29b169bb68b0490653`. `ops/restore-backup-drill.sh` verified the manifest and restored this archive with `pg_restore --single-transaction --exit-on-error` into a **new database**, never `cdc_workspace`. `ops/compare-restored-database.py` matched all 37 public tables, row counts, primary keys, database-side row hashes, 6 migration records, the GitHub Account/User/Workspace owner relation, and the sole engineering experience's version, payload hash and review/evidence status. The deployed Prisma Client read the restored database successfully. Database-side row hashes include authentication table fields; token plaintext was not returned to the comparison script or printed. A simulated `docker` failure returned code 97, logged `FAILED`, removed the partial file and kept the last successful archive. The isolated restoration and synthetic test databases were dropped after verification; `cdc_workspace` was left intact. A second archive after the candidate image was deployed had SHA-256 `7c94ad51e68cb82171ee63d9cf9877c0db9c3900d44aad771e3e6ab5ef8393f8` and recorded the deployed image digest. Both completed archives remain in the protected server directory.

This is an **on-server backup**, not an offsite copy. On 2026-10-11 the server had no configured OSS/S3 target, remote backup mount, `rclone`, `restic`, `ossutil` or cloud CLI. Before enabling offsite replication, provide a separate bucket/region or other remote target, an access method with scoped write/read/list/delete permission, encryption and retention requirements, and a safe way to install credentials without sending them in chat or committing them. Then test upload checksum, retrieval and a separate restore. The existing archive must never be uploaded to a public Git repository.

The deployment still needs the reviewed domain and ICP status, a production-specific GitHub OAuth App with its final callback URL, old browser data migration, and a full public-domain acceptance run. Until then the SSH tunnel and loopback-only bindings remain in use.
