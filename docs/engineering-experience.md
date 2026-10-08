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

本机没有真实 GitHub OAuth 配置，因此实际登录后的桌面和窄屏页面验收仍受阻。须仅在本机配置 `DATABASE_URL`、`NEXTAUTH_URL`、`NEXTAUTH_SECRET`、`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`ALLOWED_GITHUB_USER_ID`；不要把值写入仓库或聊天。完成 OAuth 登录并核对目标 Workspace 归属后，再做真实页面验收和明确授权的一次性导入。

## 下一轮单向同步准备

比较 `sourceKey`、`sourceRevision`、服务器 `Knowledge.id/version` 与独立的 `reviewStatus/evidenceStatus`，生成差异预览。只有明确指定来源到服务器的一次性更新，且人工检查证据等级后才写入；服务器编辑和本地共享目录互不自动覆盖。
