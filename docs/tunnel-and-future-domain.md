# SSH tunnel today; public domain plan for later

Checked 2026-10-11 against `codex/launch-prep` based on `origin/main@2eb70879cc47e984839f59cf694aa3605e597908`, `lib/server/auth.ts`, `app/api/auth/[...nextauth]/route.ts`, server instance metadata, and the server's listening sockets. Domain registration is user-reported; ICP filing has not been verified and the user plans to defer it. The server reports `cn-hangzhou` (mainland China). Caddy is inactive; Web and PostgreSQL bind only to server `127.0.0.1:3000` and `127.0.0.1:5432`.

## Daily private access

In a **new PowerShell window on the user's Windows machine**, check that local port 3000 is free or reuse the existing project tunnel. Then run:

```powershell
ssh -i "D:\01_CDC666\CZU\cdc-work-server.pem" -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 -N -L 127.0.0.1:3000:127.0.0.1:3000 root@114.215.174.39
```

Keep that PowerShell window open and browse to `http://localhost:3000/login` (use `localhost`, not `127.0.0.1`, for the browser cookie). Stop only that tunnel with Ctrl+C. The command reads the local key through SSH; do not copy the key or its contents into documents. Port 3000 must be available locally; `Get-NetTCPConnection -LocalPort 3000 -State Listen` can identify an existing listener. Do not kill an unrelated process to free it.

This tunnel preserves the existing local GitHub OAuth App and `NEXTAUTH_URL=http://localhost:3000`. Nothing in this plan changes the running `.env`, public firewall, DNS, or Caddy.

## Future public cutover (inactive plan)

The NextAuth handler is `app/api/auth/[...nextauth]/route.ts` with GitHubProvider in `lib/server/auth.ts`, so the future GitHub OAuth App settings are:

| Setting | Future value |
|---|---|
| Application homepage URL | `https://work.cdc666.cn` |
| Authorization callback URL | `https://work.cdc666.cn/api/auth/callback/github` |

Disable wildcard callback matching. In the server's protected `.env`, the future cutover would set `NEXTAUTH_URL=https://work.cdc666.cn`, the **new production OAuth App's** `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, retain `ALLOWED_GITHUB_USER_ID=248133835`, and supply a protected `NEXTAUTH_SECRET`. Keep database credentials and OAuth values out of Git and chat. The `cdc666.cn` apex is reserved for a later personal site; do not point it at the private workspace as a shortcut.

After ICP filing is confirmed and a cutover is authorized, create a DNS `A` record for host `work` pointing to the server's verified public IP, and allow inbound 80/443 in both the instance firewall and host firewall. Keep 3000 and 5432 bound to loopback. A future Caddyfile site block would be:

```caddyfile
work.cdc666.cn {
    reverse_proxy 127.0.0.1:3000
}
```

Caddy's automatic HTTPS needs working DNS and public reachability on 80/443 for normal certificate issuance. Do not install this block or start its public site while the filing is deferred. The existing Caddy installation remains inactive. At cutover, first back up the database and current `.env`, install the separate OAuth App values through a protected file, validate Caddy configuration, then verify real login, cookie session, private API authorization, reverse proxy headers, HTTPS renewal, logout, and rollback through the tunnel.

For a mainland `cn-hangzhou` server, domain registration alone does not authorize opening a public website. Alibaba Cloud's [ICP filing guidance](https://help.aliyun.com/zh/icp-filing/basic-icp-service/product-overview/icp-filing-requirements-for-a-regular-website) says HTTP and HTTPS sites require filing before public access. [Caddy's HTTPS guide](https://caddyserver.com/docs/quick-starts/https) describes port 80/443 reachability, and [GitHub's OAuth guidance](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps) describes callback matching. ICP status remains unverified and the public cutover is deferred by the user.
