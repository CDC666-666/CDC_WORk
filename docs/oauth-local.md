# 本地 GitHub OAuth 配置与验收

本地访问地址固定为 `http://localhost:3000`，GitHub OAuth 回调固定为
`http://localhost:3000/api/auth/callback/github`。请在浏览器中始终使用
`localhost`，不要在同一次登录中改用 `127.0.0.1`，以免会话 Cookie 的主机不一致。

1. 登录 GitHub，打开 **Settings → Developer settings → OAuth apps → New OAuth App**。
   Application name 可填 `CDC WORK Local`；Homepage URL 填
   `http://localhost:3000`；Authorization callback URL 填
   `http://localhost:3000/api/auth/callback/github`。注册后在该应用页面取得
   Client ID，并生成 Client Secret。建议本地与未来正式域名分别建立 OAuth App。
2. 在实际运行应用的仓库目录把 `.env.example` 复制为 `.env`。填写下列字段，
   两个密码与 OAuth Secret 只留在本机 `.env`，不要提交到 GitHub 或发到聊天：

   ```dotenv
   POSTGRES_USER="cdc"
   POSTGRES_PASSWORD="<本地数据库密码；使用 URL 安全的字母数字字符>"
   POSTGRES_DB="cdc_workspace"
   DATABASE_URL="postgresql://cdc:<同一密码>@localhost:5432/cdc_workspace?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="<本机生成的至少 32 字节随机值>"
   GITHUB_CLIENT_ID="<OAuth App 的 Client ID>"
   GITHUB_CLIENT_SECRET="<OAuth App 的 Client Secret>"
   ALLOWED_GITHUB_USER_ID="248133835"
   ```

   如果数据库密码含 `@`、`:`、`/`、`?` 等字符，需要对连接串中的密码做 URL 编码。
   `NEXTAUTH_SECRET` 可以在本机运行
   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"` 生成，
   然后仅粘贴到 `.env`。`.env` 已被 Git 忽略。
3. 有 Docker 的本机运行 `docker compose up --build --wait -d`；或先运行
   `docker compose up -d db`，再运行 `npm ci`、`npm run db:generate`、
   `npm run db:deploy`、`npm run dev`。打开 `http://localhost:3000/login`，
   点击“使用 GitHub 登录”。只有 GitHub 数字用户 ID `248133835` 可以进入私人工作台。
4. 登录后打开 `/reflections`，刷新页面确认会话保持；点击顶栏的“退出登录”，
   确认返回 `/login`。退出后访问 `/reflections` 应跳转登录页，访问
   `/api/private/reviews` 应返回 HTTP 401。

CI 使用伪造的数据库测试会话验证服务端访问控制与退出接口，不代表真实 GitHub
授权回调已完成验收。真实 OAuth 验收需要以上 Client ID/Secret 在本机配置完成。

若浏览器能打开 GitHub，但本机服务端在 OAuth 回调时出现 `ECONNRESET` 或请求超时，
应先检查 Node.js 是否走了本机网络代理。Node.js 26 可通过 `--use-env-proxy` 使用
`HTTP_PROXY` / `HTTPS_PROXY`，同时将 `localhost,127.0.0.1` 放入 `NO_PROXY`。
这些值按本机网络环境设置，不写入仓库。排查回调错误时不要直接复制原始服务端日志；
NextAuth / Prisma 的错误内容可能包含 OAuth 令牌。

## 本机真实 OAuth 验收（2026-10-08）

在 `codex/engineering-experience` 上基于 `0980943` 的本轮修复中，
用户亲自完成 GitHub 授权，数据库核对数字账号准入、会话和 Workspace 归属；
刷新后会话保持、退出后私有页面返回登录页。可见 Chrome 窗口中的真实会话还通过了
工程经验临时记录的新增、详情、编辑、搜索、刷新和 390px 详情布局检查；记录已清理。
这些是本机开发库结果，不代表部署。自动化数据库/API 测试使用另一隔离库和合成会话。

本分支增加可空的 `Account.refresh_token_expires_in` 字段及迁移，账户关联只接收明确列出的
持久化字段。NextAuth 的错误、警告和调试日志不输出原始认证元数据；针对含模拟令牌、
客户端密钥和完整提供者响应的错误路径有脱敏回归测试。若认证失败，先查看受限错误代码
和网络类别；不要复制原始回调 URL 或令牌。当前工作台只用 GitHub 完成身份认证，
尚未实现供未来 GitHub API 调用的令牌续期。

参考：[GitHub 创建 OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)、
[NextAuth GitHub Provider](https://next-auth.js.org/providers/github)、
[NextAuth 环境变量](https://next-auth.js.org/configuration/options)。
