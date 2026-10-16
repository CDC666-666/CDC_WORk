# Public domain deployment

Status: preparation on 2026-10-16, `codex/portfolio-v1` based on `codex/launch-prep`. The server still runs the prior `795f7cd` image until a committed release is built and switched. Public DNS, HTTPS, and production GitHub OAuth must be verified before calling this live.

## Boundaries

- `https://cdc666.cn/` redirects to `/portfolio`; only curated portfolio routes, their public aggregate API, and required Next static assets pass through Caddy. Unknown and private paths return 404.
- `https://work.cdc666.cn/` proxies to the same loopback-only Next service and keeps the existing database-session and GitHub numeric-ID checks. Public portfolio and visit endpoints are blocked on this host.
- The source-controlled `ops/Caddyfile.production` is a candidate; validate it and make a protected copy of the active `/etc/caddy/Caddyfile` before activation. Caddy obtains and renews HTTPS certificates after DNS and ports 80/443 are available.
- Compose keeps Web on `127.0.0.1:3000` and PostgreSQL on `127.0.0.1:5432`; never publish these ports. Bare-IP HTTP returns 404.

## Required configuration

DNS A records: `@` and `work` to the verified server IPv4. Optional `www` can be added later with a redirect to the apex. GitHub OAuth App: Homepage `https://work.cdc666.cn`; callback `https://work.cdc666.cn/api/auth/callback/github` (from `app/api/auth/[...nextauth]/route.ts` and GitHubProvider). The protected server `.env` needs `NEXTAUTH_URL=https://work.cdc666.cn`, that App's client ID and secret, existing `ALLOWED_GITHUB_USER_ID=248133835` and `NEXTAUTH_SECRET`, a newly generated production `PORTFOLIO_ANALYTICS_SECRET`, and the approved `SITE_ICP_NUMBER` and `SITE_ICP_NAME`. `SITE_POLICE_NUMBER` is optional until obtained. Set `PORTFOLIO_LAUNCHED_AT` once, to the actual first public opening timestamp with timezone, and preserve it across releases. The public metadata endpoint returns only these approved legal/time fields, never auth or database configuration.

`NEXT_PUBLIC_PRIVATE_WORKSPACE_URL` is compiled into the image. The Docker build defaults it to `https://work.cdc666.cn/login`; inspect the resulting public link before activation. The local `.env` preview value must not be copied into the image. Email/WeChat stay hidden until explicitly approved and configured in `data/public-contact.ts`.

## Release and rollback

1. Record the old image ID/revision and compose overrides. Run the existing backup service, verify `pg_restore --list` and a full decode plus SHA-256, and copy `.env`, compose overrides, and Caddyfile into a root-only backup directory. Keep the old image and active override.
2. Review `git diff`, migrations, and secret scan. Run lint, typecheck, tests and build. Commit the final source. Build from that exact commit in an isolated server release directory, label the image with its revision, and record its image ID. Apply only reviewed additive migrations after backup.
3. Switch the Web image while leaving the PostgreSQL container and volume untouched. Verify the healthy service, migration list, original account/Workspace relationship and business-data baseline before opening public DNS/HTTPS.
4. Install and validate Caddy config, then activate after DNS, OAuth and 80/443 reachability checks. Test public and private hosts from the server and an external browser, including negative authorization cases.
5. To roll back, restore the previous Caddyfile and compose override, restart only Caddy/Web, and verify private API, original data and health. Do not reset the database or volume. The added analytics tables can remain unused by an older image; any destructive schema rollback requires a separate review and verified restore plan.

Server backup is on the same host. It is not an offsite copy. The previous offsite-backup gap remains open.
