#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

readonly backup_dir=/var/backups/cdc-work/automatic
readonly app_dir=/opt/cdc-work/app
cd "$app_dir"
manifest=$(find "$backup_dir" -maxdepth 1 -type f -name 'cdc_workspace_*.json' | sort | tail -n 1)
test -n "$manifest"
archive="${manifest%.json}.dump"
test -f "$archive"
python3 - "$manifest" "$archive" <<'PY'
import hashlib
import json
from pathlib import Path
import sys

manifest = json.loads(Path(sys.argv[1]).read_text())
archive = Path(sys.argv[2])
assert manifest['archive'] == archive.name
assert manifest['bytes'] == archive.stat().st_size
assert manifest['sha256'] == hashlib.file_digest(archive.open('rb'), 'sha256').hexdigest()
PY

test_db="cdc_restore_verify_$(date -u +%Y%m%dT%H%M%SZ)"
test "$test_db" != cdc_workspace
exists=$(docker compose exec -T db psql -U cdc -d postgres -Atc \
  "SELECT count(*) FROM pg_database WHERE datname = '$test_db'")
test "$exists" = 0
docker compose exec -T db createdb -U cdc "$test_db"
docker compose exec -T db pg_restore -U cdc -d "$test_db" \
  --single-transaction --exit-on-error < "$archive"
printf 'RESTORE_OK db=%s archive=%s bytes=%s sha_match=yes\n' \
  "$test_db" "$(basename "$archive")" "$(stat -c %s "$archive")"
