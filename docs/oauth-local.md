# 本地 GitHub OAuth 配置

开发地址为 `http://localhost:3000`，回调为 `http://localhost:3000/api/auth/callback/github`。同一次登录不要切换 `localhost` 与 `127.0.0.1`，以免会话 Cookie 主机不同。

1. 在 GitHub Settings → Developer settings → OAuth apps 创建独立本地 App；Homepage 与 callback 使用上述地址。生产域名使用另一 App。
2. 复制 `.env.example` 为被忽略的 `.env`，按独立开发环境填写数据库、随机会话密钥及 OAuth 参数。下面仅为占位示例，不能直接运行：

```dotenv
POSTGRES_USER="cdc"
POSTGRES_PASSWORD="<独立开发库密码>"
POSTGRES_DB="cdc_workspace"
DATABASE_URL="postgresql://cdc:<URL编码后的密码>@localhost:5432/cdc_workspace?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<本机生成的随机密钥>"
GITHUB_CLIENT_ID="<本地OAuth App的ID>"
GITHUB_CLIENT_SECRET="<本地OAuth App的Secret>"
ALLOWED_GITHUB_USER_ID="<获准账号的数字ID>"
```

应用按配置的稳定数字 ID 判断准入，不按显示名。现有本地快照命令另有固定目标检查，不能据此改写生产准入或将生产配置复制到测试库。

3. 确认数据库目标后，在独立开发库执行 `npm ci`、`npm run db:generate`、`npm run db:deploy`、`npm run dev`；或使用独立 Compose 环境。迁移会修改目标库。
4. 用户亲自完成 GitHub 登录，验证私有页面刷新、Workspace 归属和退出；退出后私有 API 返回 401、页面跳转登录。不要把会话总数必须为零当作单个浏览器退出成功的判据。

## 认证与日志

账户关联只持久化明确列出的字段，包含可空的 `refresh_token_expires_in`。自定义 NextAuth logger 丢弃原始认证元数据，仅输出受限错误代码和网络类别；相关合成测试见 `tests/server/auth-logging.test.ts`、`tests/server/auth-configuration.test.ts`。

OAuth 回调失败时先核对服务器运行时网络与回调地址，不能因为浏览器可访问 GitHub 就推定 Node.js 也可连接。代理支持须按实际 Node 版本核对；配置留在私人环境。不要复制原始回调 URL、提供者响应、令牌或服务日志到 GitHub。

CI 的合成数据库会话只验证访问控制，不能替代真实 OAuth。公开验收只记录检查类别，不记录私人数据库的内容、实体或会话明细。应用目前以 GitHub 做身份认证，不承诺未来 GitHub API 调用的令牌续期。

参考：[GitHub 创建 OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app)、[NextAuth GitHub Provider](https://next-auth.js.org/providers/github)、[NextAuth 配置](https://next-auth.js.org/configuration/options)。
