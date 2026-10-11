#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

# Server-only deployment paths. Do not source the application .env here.
readonly app_dir=/opt/cdc-work/app
readonly backup_dir=/var/backups/cdc-work/automatic
mkdir -p -- "$backup_dir"
chmod 0700 "$backup_dir"
touch "$backup_dir/backup.log"
chmod 0600 "$backup_dir/backup.log"
exec >>"$backup_dir/backup.log" 2>&1

exec 9>"$backup_dir/.lock"
if ! flock -n 9; then
  printf '%s SKIPPED backup already running\n' "$(date -u +%FT%TZ)"
  exit 1
fi

cd "$app_dir"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
name="cdc_workspace_${timestamp}_$$"
partial=$(mktemp "$backup_dir/.${name}.XXXXXX.partial")
archive="$backup_dir/$name.dump"
manifest="$backup_dir/$name.json"
trap 'rm -f -- "$partial" "$manifest.partial"' EXIT

on_failure() {
  local result=$?
  printf '%s FAILED rc=%s archive=%s\n' "$(date -u +%FT%TZ)" "$result" "$name"
  exit "$result"
}
trap on_failure ERR

available_kib=$(df -Pk "$backup_dir" | awk 'NR == 2 { print $4 }')
if [[ ! "$available_kib" =~ ^[0-9]+$ ]] || (( available_kib < 1048576 )); then
  printf '%s FAILED insufficient free space\n' "$(date -u +%FT%TZ)"
  exit 1
fi

printf '%s START archive=%s\n' "$(date -u +%FT%TZ)" "$name"
docker compose exec -T db sh -ec 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -b' > "$partial"
test -s "$partial"
docker compose exec -T db pg_restore --list < "$partial" > /dev/null
docker compose exec -T db pg_restore --file=/dev/null < "$partial"

sha=$(sha256sum "$partial" | awk '{print $1}')
size=$(stat -c %s "$partial")
commit=$(git rev-parse HEAD)
web_container=$(docker compose ps -q web 2>/dev/null || true)
web_image=unavailable
if test -n "$web_container"; then
  web_image=$(docker inspect --format '{{.Image}}' "$web_container")
fi
pg_version=$(docker compose exec -T db sh -ec 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SHOW server_version"')
generated_at=$(date -u +%FT%TZ)
printf '{"generatedAt":"%s","archive":"%s","bytes":%s,"sha256":"%s","postgresVersion":"%s","applicationCommit":"%s","deployedWebImage":"%s","integrity":"pg_restore --list and --file=/dev/null passed"}\n' \
  "$generated_at" "$(basename "$archive")" "$size" "$sha" "$pg_version" "$commit" "$web_image" > "$manifest.partial"
chmod 0600 "$manifest.partial"
mv -- "$partial" "$archive"
mv -- "$manifest.partial" "$manifest"
chmod 0600 "$archive" "$manifest"
printf '%s SUCCESS archive=%s bytes=%s sha256=%s\n' "$generated_at" "$name" "$size" "$sha"

# Keep all successful daily archives for 30 days and at least two newest archives.
# Only files with this exact generated-name pattern in this fixed directory are removed.
python3 - "$backup_dir" <<'PY'
from datetime import datetime, timedelta, timezone
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
pattern = re.compile(r"^cdc_workspace_(\d{8}T\d{6}Z)_\d+\.dump$")
archives = []
for path in root.iterdir():
    match = pattern.fullmatch(path.name)
    if match and path.is_file() and (root / (path.stem + ".json")).is_file():
        created = datetime.strptime(match.group(1), "%Y%m%dT%H%M%SZ").replace(tzinfo=timezone.utc)
        archives.append((created, path))
archives.sort(reverse=True)
cutoff = datetime.now(timezone.utc) - timedelta(days=30)
for index, (created, path) in enumerate(archives):
    if index < 2 or created >= cutoff:
        continue
    path.unlink()
    (root / (path.stem + ".json")).unlink()
    print(f"{datetime.now(timezone.utc).isoformat()} RETAINED_POLICY_REMOVED archive={path.stem}")
PY
