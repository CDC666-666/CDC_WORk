#!/usr/bin/env python3
"""Compare the live database with one independent drill database without exporting row bodies."""
import hashlib
import json
import re
import subprocess
import sys

SOURCE = "cdc_workspace"
ALLOWED_GITHUB_ID = "248133835"
ROW_HASH = "encode(sha256(convert_to(row_to_json(t)::text, 'UTF8')), 'hex')"


def read(db: str, sql: str) -> list[dict]:
    command = ["docker", "compose", "exec", "-T", "db", "psql", "-X", "-Atq",
               "-U", "cdc", "-d", db, "-c",
               "BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY; "
               "SET LOCAL TIME ZONE 'Asia/Shanghai'; " + sql + "; COMMIT;"]
    result = subprocess.run(command, cwd="/opt/cdc-work/app", text=True,
                            capture_output=True, check=True, timeout=120)
    return [json.loads(line) for line in result.stdout.splitlines() if line.strip()]


def quoted(value: str) -> str:
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", value):
        raise ValueError("Unexpected SQL identifier")
    return '"' + value + '"'


def inventory(db: str) -> dict:
    names = [row["name"] for row in read(db,
        "SELECT json_build_object('name',tablename)::text FROM pg_catalog.pg_tables "
        "WHERE schemaname='public' ORDER BY tablename")]
    keys = read(db,
        "SELECT json_build_object('table',c.table_name,'column',k.column_name)::text "
        "FROM information_schema.table_constraints c JOIN "
        "information_schema.key_column_usage k ON "
        "c.constraint_name=k.constraint_name AND c.table_schema=k.table_schema "
        "AND c.table_name=k.table_name WHERE c.table_schema='public' "
        "AND c.constraint_type='PRIMARY KEY' "
        "ORDER BY c.table_name,k.ordinal_position")
    key_map = {name: [] for name in names}
    for row in keys:
        key_map[row["table"]].append(row["column"])
    tables = {}
    for name in names:
        columns = key_map[name]
        pk = ("json_build_array(" + ",".join("t." + quoted(col) for col in columns) + ")::text") \
            if columns else ROW_HASH
        rows = read(db, "SELECT json_build_object('pk'," + pk + ",'rowHash'," + ROW_HASH +
                    ")::text FROM public." + quoted(name) + " t")
        rows.sort(key=lambda row: row["pk"])
        digest = hashlib.sha256("\n".join(
            row["pk"] + "\t" + row["rowHash"] for row in rows).encode()).hexdigest()
        tables[name] = {"count": len(rows), "primaryKeyColumns": columns, "digest": digest}
    migrations = read(db,
        "SELECT json_build_object('name',migration_name,'checksum',checksum,"
        "'finishedAt',to_char(finished_at AT TIME ZONE 'UTC',"
        "'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"'))::text "
        "FROM public.\"_prisma_migrations\" ORDER BY started_at,id")
    owner = read(db,
        "SELECT json_build_object('userId',u.id,'workspaceId',w.id,"
        "'githubId',u.\"githubId\",'accountId',a.\"providerAccountId\","
        "'workspaceUserId',w.\"userId\")::text FROM public.\"User\" u "
        "JOIN public.\"Account\" a ON a.\"userId\"=u.id AND a.provider='github' "
        "JOIN public.\"Workspace\" w ON w.\"userId\"=u.id "
        "WHERE u.\"githubId\"='" + ALLOWED_GITHUB_ID + "'")
    if len(owner) != 1 or owner[0]["accountId"] != ALLOWED_GITHUB_ID:
        raise ValueError("Expected GitHub owner/Workspace relation missing")
    experiences = read(db,
        "SELECT json_build_object('id',k.id,'version',k.version,"
        "'payloadSha256',encode(sha256(convert_to(k.payload::text,'UTF8')),'hex'),"
        "'reviewStatus',k.payload->'experience'->>'reviewStatus',"
        "'evidenceStatus',k.payload->'experience'->>'evidenceStatus',"
        "'updatedAt',to_char(k.\"updatedAt\",'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"'))::text "
        "FROM public.\"Knowledge\" k WHERE k.\"workspaceId\"='" +
        owner[0]["workspaceId"].replace("'", "''") + "' "
        "AND k.payload->>'itemType'='工程经验' "
        "AND k.payload->>'status' IS DISTINCT FROM '已归档' ORDER BY k.id")
    return {"tables": tables, "migrations": migrations, "owner": owner[0],
            "experiences": experiences}


def main() -> None:
    if len(sys.argv) != 2 or not re.fullmatch(r"cdc_restore_verify_\d{8}T\d{6}Z", sys.argv[1]):
        raise ValueError("Expected one newly created drill database name")
    source = inventory(SOURCE)
    restored = inventory(sys.argv[1])
    if not source["tables"] or not source["migrations"]:
        raise ValueError("Source database inventory is incomplete")
    assert source == restored, "Source and drill database inventories differ"
    print(json.dumps({"result": "MATCH", "businessTables": len(source["tables"]),
                      "migrationRecords": len(source["migrations"]),
                      "experienceRecords": len(source["experiences"]),
                      "ownerWorkspace": "MATCH", "allPrimaryKeysAndRowHashes": "MATCH",
                      "experienceVersionAndPayload": "MATCH"}, ensure_ascii=False))


if __name__ == "__main__":
    main()
