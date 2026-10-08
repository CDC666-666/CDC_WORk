# 工程经验管理与一次性导入（2026-10-08）

## 数据位置与复用

`/experiences` 使用现有私有 `Knowledge` 记录：`itemType=工程经验`，结构化字段放在 `payload.experience`，`sourceType=sharedMemory` 表示本地共享案例。沿用受 GitHub 允许账号保护的私人路由、`/api/private/workspace` 读取和 `/api/private/entities/knowledge` 版本化写入。工程日志记录过程、技术问题与方案记录具体问题；工程经验在知识库中保存可跨项目引用的结论，因而没有另建一张重复的业务表。

`experience` 保存现象、来源项目、环境、版本、排查过程、失败尝试、原因、解决办法、验证结果、证据来源、适用条件、限制及待确认项。`reviewStatus` 表示内容审核，`evidenceStatus` 表示证据等级；两者分别编辑，审核操作不改变证据。`Knowledge.id` 是服务器稳定记录 ID；`sourceKey` 是共享文件的相对路径；`sourceRevision` 是原文 SHA-256；数据库行 `version` 用于并发写入检查。此版本在已存在记录上**跳过导入而不覆盖服务器编辑**，即使原文摘要发生变化也只报告差异。

## 首条案例导入

导入工具只接受 `../shared-memory/cases/auto-aim-init-alignment.md`，不接受目录扫描或任意文件路径。原文留在 Workplace 本地，不放入代码仓库。先在已配置 PostgreSQL 和授权用户工作区的环境运行：

```powershell
npm.cmd run import:experience -- --workspace-id=<目标 Workspace ID>
npm.cmd run import:experience -- --workspace-id=<目标 Workspace ID> --execute
```

第一条只预览 ID、标题、来源摘要和状态，不写库；第二条明确执行。工具要求数据库中已存在目标 Workspace，导入前不创建用户或绕过登录。导入状态固定为“待审核 / 历史现场反馈”；本机源码复核只记录在证据详情，不把它变成当次实车复测。重复执行时用稳定 ID 检查并返回 `already_exists`；如果来源文件已修改，返回 `sourceChanged=true`，仍不会覆盖。

本仓库不包含该真实案例的正文或数据库凭据。正式导入前须核对目标 `Workspace` 属于预期个人账号；合成测试记录不能当作个人案例已正式入库。

## 本机验收记录（2026-10-08）

适用分支 `codex/engineering-experience`，验收前 HEAD `7ca934b9044d45a1b7ddaef7c1149491589aefb0`；这是本机验收，不代表部署或实车复测。`npm ci` 在本 worktree 独立完成，随后 `db:generate` 生成本 worktree 的 Prisma Client。隔离的 PostgreSQL 16.14 测试集群位于本 worktree 的 Git 忽略目录，监听本机地址；对测试库执行 `db:deploy`，5 个现有迁移均成功。测试连接只存于本地忽略配置。

- `npm run lint`、`npm run typecheck`、`npm test`（42/42）、`npm run test:db`（14/14）、`npm run build` 均通过。第一次 `typecheck` 因 `npm ci` 后尚未生成 Prisma Client 失败，执行 `db:generate` 后重跑通过。
- 数据库用例使用合成自瞄案例和临时用户/Workspace：导入创建、另一 Prisma 连接读取、结构化字段编辑后重读、标题与内容搜索、项目/标签/证据状态筛选、已审核但证据仍为“历史现场反馈”、旧版本更新返回 409、重复导入只保留一条、源文件摘要改变也不覆盖服务器编辑，均通过；测试结束删除临时记录。
- 构建后启动本机 HTTP 服务，`npm run test:api` 2/2 通过。匿名访问 `/experiences` 重定向到登录，私有读写 API 返回 401；现有测试通过**合成数据库会话**验证私有页面和工程经验 API 创建、编辑、刷新读取、证据状态不随审核提升及旧版本 409。该测试没有走真实 GitHub OAuth，也没有给生产代码增加认证绕过。
- 真实共享案例的预览此前成功，**未执行正式 `--execute`**；个人 Workspace 归属未核对，首案例尚未正式入库。测试库里的合成案例不是个人数据。

上述记录形成时本机尚无真实 GitHub OAuth 配置；2026-10-08 后续验收见下文。凭据仅保存在本机忽略的 `.env`，未写入仓库或聊天。

## 真实 GitHub OAuth 与首案例预览（2026-10-08）

适用分支 `codex/engineering-experience@0980943800ffbddaf00d57929dcdd2f6aaae8ace` 加当时尚未提交的修复，环境为 `localhost:3000`、本 worktree 独立 PostgreSQL 16.14 开发库及本机 GitHub OAuth App；未部署、未推送。Prisma Client 已生成，第 6 个迁移 `20261008110000_github_oauth_refresh_expiry` 在此开发库应用成功；`prisma migrate status` 显示 schema 已更新。`lint`、`typecheck`、42 条常规测试和 `build` 在修复后通过。

- 首次真实回调已获得允许的 GitHub 数字账号，但 Prisma `Account` 不接受提供者返回的 `refresh_token_expires_in`，未建立账户和会话。修复为 Account 新增可空字段，并在 NextAuth 的账户关联路径显式投影持久化字段，避免未知提供者字段直接进入 Prisma。失败回调的 NextAuth 错误日志曾包含 OAuth 令牌；用户反馈已撤销该次 GitHub 授权，随后重新授权。文档和提交均不含令牌值。
- 第二阶段服务端日志记录 OAuth 请求 `ECONNRESET` 及默认 3.5 秒、调整后 15 秒超时；无凭据的 Node.js 直连 GitHub OAuth 端点连续失败，经本机现有 Windows 代理约 1 秒返回。仅本地开发进程启用 Node.js `--use-env-proxy` 后，回调成功；该机器的代理地址不写入仓库配置。
- 成功回调后的数据库核对：允许的 GitHub 数字 ID 对应账户存在，`User.githubId` 与其相等，Workspace 的 `userId` 与账户用户一致，且有有效会话。用户在 Chrome 反馈已进入工作台、刷新后仍保持登录，`/experiences` 页面可显示。此为真实 OAuth，不是合成测试会话；页面布局细节尚未由自动化工具验收。
- 对已核对归属的目标 Workspace 运行首条自瞄案例的**只读预览**：返回固定来源路径、来源 SHA-256、稳定记录 ID、“待审核 / 历史现场反馈”，标题/项目/标签/证据状态联合检索命中 1 条。预览后开发库 Knowledge 记录为 0；未运行 `--execute`，个人案例尚未正式入库。
- 用户在 Chrome 点击退出后，再访问 `/experiences` 被带回 `/login`；数据库有效会话数由 4 降为 3，独立无 Cookie 请求 `/api/private/reviews` 返回 401。此前多次尝试产生多个数据库会话，单个浏览器退出只撤销当前会话，不能用会话总数为零作为退出判据。本轮验收结束后仅清理该账号在隔离开发库残留的 3 条测试会话，现为 0；用户、GitHub 账户与 Workspace 保留。

## PR #7 衔接修复验收（2026-10-08）

适用分支 `codex/engineering-experience`，修复前 HEAD `2069e872c3af2f0b33ceda156ca7ae7ee5f2d937`。本轮仅改工程经验的项目清除与详情导航，测试使用隔离 PostgreSQL 和现有合成数据库会话；不代表真实 GitHub OAuth 登录。

- **取消项目关联：** 修复前浏览器编辑表单选择“不关联”后，PATCH JSON 省略 `projectId`，旧关联仍留在服务器。修复后，`undefined` 表示不修改，表单空选项以 `""` 明确请求清除；服务端在合并旧值后规范化空值，单次写入把 Knowledge 索引列设为 `NULL`、从 payload 移除 `projectId`，并清空对应 `relationRefs`。浏览器回归通过实际请求和数据库行核对：关联项目 → 取消 → 刷新重读后仍不关联，旧项目可删除；另核对省略字段的 PATCH 仍保留关联。
- **搜索详情导航：** 修复前打开经验 A、关闭弹窗再从全局搜索进入 B 时，URL 指向 B 而详情未打开。详情现在以 URL 的 `record` 参数为准，打开与关闭都会更新路由。浏览器回归覆盖弹窗打开时同页 A→B、关闭后搜索 B、再次搜索 A、前进/后退，以及不存在的 ID 显示明确提示；桌面和 390px 窄屏稳定布局无水平溢出。
- 修复后本机 `lint`、`typecheck`、`build`、`test`（42/42）、`test:db`（14/14）、`test:api`（2/2）、`test:browser`（3/3）通过。浏览器测试使用本机 Chrome 和合成会话；真实 OAuth、个人案例正式入库仍待完成。

## 下一轮单向同步准备

比较 `sourceKey`、`sourceRevision`、服务器 `Knowledge.id/version` 与独立的 `reviewStatus/evidenceStatus`，生成差异预览。只有明确指定来源到服务器的一次性更新，且人工检查证据等级后才写入；服务器编辑和本地共享目录互不自动覆盖。

## 真实会话页面与日志脱敏复验（2026-10-08）

适用分支 `codex/engineering-experience@0980943800ffbddaf00d57929dcdd2f6aaae8ace` 上的本轮修复。本机个人开发库用于真实登录和界面验收；同一 PostgreSQL 集群内的独立 `oauth_acceptance_regression` 数据库仅用于自动化迁移、数据库和 API 测试。两者都不是生产数据源。

- **日志边界：** NextAuth 自定义 logger 只输出受限的错误代码与 `timeout`、`connection_reset` 或 `unspecified` 类别，不转储错误对象、提供者响应、访问/刷新令牌及客户端密钥。单测用哨兵值构造含令牌和完整响应的失败元数据，确认输出不含这些值；数据库集成测试确认 `authOptions` 实际使用该 logger，账户关联只持久化列出的字段并接受 `refresh_token_expires_in`。这些测试覆盖 NextAuth 认证日志路径，不声称其他第三方日志绝无敏感信息。
- **真实浏览器会话：** 用户在可见的独立 Chrome 窗口亲自完成 GitHub 授权；Playwright 没有注入测试 Cookie。私有 Workspace API 返回 200，本机数据库核对允许的 GitHub 数字 ID、用户与 Workspace 关系。仅在该 Workspace 原有 Knowledge 数量为 0 时，创建一条标题含“临时验收”的记录。新增后详情可读；搜索命中及不命中正确；刷新后字段仍在；编辑后再次刷新，数据库版本递增且新内容一致。退出后再访私有页回到登录页。临时记录仅按本轮 ID 清理，Knowledge 数量回到 0；验收浏览器配置已从本机忽略目录移除。
- **390px：** 真实会话的经验详情在 390px 视口没有水平溢出，弹窗边界、标题、证据状态和底部按钮经本机截图目视检查未重叠。列表在该视口的完整视觉细节仍以先前合成会话浏览器测试为补充，不能把截图误称为本轮实车或生产页面验收。
- **自动化：** 第 6 个迁移在两个本地开发/回归数据库应用成功；独立回归库的原 14 条数据库测试、1 条认证配置/字段投影测试、2 条 HTTP API 测试通过。常规测试 43/43、`lint`、`typecheck`、`build` 通过。HTTP API 测试使用合成会话，与上述真实浏览器会话分开记录。

真实自瞄案例仍只做过只读导入预览，未运行 `--execute`；正式入库、生产部署及 GitHub API 令牌续期均未完成。
