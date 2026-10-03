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

参考：[GitHub 创建 OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)、
[NextAuth GitHub Provider](https://next-auth.js.org/providers/github)、
[NextAuth 环境变量](https://next-auth.js.org/configuration/options)。
