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

截至上一节记录时，真实自瞄案例仍只做过只读导入预览；随后本机正式入库结果见下节。生产部署及 GitHub API 令牌续期仍未完成。

## 首条真实案例一次性入库（2026-10-08）

适用 `codex/engineering-experience@fa6291f` 的本机个人 PostgreSQL 开发库 `cdc_workspace`。本节是后于上文只读预览的新增结果；自动化回归库 `oauth_acceptance_regression` 未用于正式导入，生产环境未部署。

- **归属与来源：** 重新核对本机连接指向 `localhost:5432/cdc_workspace`、OAuth 本地地址及配置的 GitHub 数字 ID；数据库中的 GitHub Account 标识、User 标识和唯一 Workspace 的 `userId` 对应同一用户。导入前该 Workspace 的 Knowledge 数为 0，目标稳定 ID 未被占用。原文件仍是唯一允许来源 `shared-memory/cases/auto-aim-init-alignment.md`，SHA-256 为 `77c56564a4e9dceebd46614f81c3aff6466dbd0c88ad9cbd4fe1af6641d3dfdf`；导入后原文件哈希保持不变。
- **写入与证据边界：** 限定脚本只读预览先通过标题、项目、标签和证据状态联合检索，然后 `--execute` 返回 `created`。Knowledge 版本 1，数量变为 1。数据库 payload 的标题、现象、来源项目、环境、历史日期、本机源码提交、排查、失败尝试、原因、解决、验证结果、证据来源、适用条件、限制、待确认项与解析原文逐字段一致。审核为“待审核”，证据为“历史现场反馈”；历史用户现场反馈、本机源码静态核对和缺失的固件/Ubuntu 运行证据继续分开。此结果仅验证内容入库，不提高原案例的实车验证等级。
- **幂等：** 不改原文再次运行同一 `--execute`，返回 `already_exists`、`sourceChanged=false`；同一 Workspace 仍只有 1 条 Knowledge，版本仍为 1，规范化 payload SHA-256 和更新时间均与首次写入后的本机基线相同。未执行编辑、覆盖或其他案例导入。

- **应用重启后：** 停止并重启本轮启动的本机应用进程，`localhost:3000/login` 恢复 HTTP 200；随后用当前服务层 `get` 和独立 Prisma 连接重读该案例，仍与原文解析字段一致，数量 1、版本 1、payload SHA-256 和更新时间均与首次写入后的基线相同。匿名请求私有 Workspace API 仍返回 401。这证明本机数据库持久化与服务层读取，不等同于已登录浏览器在重启后的页面验收。
- **真实浏览器待验收：** 本轮两次打开隔离的可见 Chrome 窗口等待用户亲自完成 GitHub 登录，分别在 5 分钟和 15 分钟后超时；未取得本轮真实登录会话。因此列表、详情、全局搜索、刷新及桌面/390px 实际案例长文本布局尚未在真实会话中验收。此前临时记录的真实会话页面结果不能代替这条长文本案例的检查。没有注入合成 Cookie，也没有修改真实案例以满足测试。

本节不包含案例正文、账号资料、数据库凭据或登录令牌；首次正式入库已完成，但真实页面验收仍待用户在验收窗口登录后继续。

## 已入库实际案例的真实页面验收（2026-10-08）

适用 `codex/engineering-experience` 基于 `6feb6b4` 的本机代码、个人开发库 `cdc_workspace` 和 `localhost:3000`。本节补充了上节尚未完成的浏览器验收；使用用户亲自在一个持续打开的独立 Chrome 窗口建立的真实 GitHub 会话，未注入合成 Cookie、未再次导入，也未编辑、审核或删除实际案例。浏览器窗口与会话在验收脚本退出后保留。

- **归属与读取：** 验收开始前再次核对数据库名、允许的 GitHub 数字 ID、Account/User 与 Workspace 的用户关联，以及已入库案例的数量、版本和正文摘要。真实会话的私有 Workspace API 返回 200。经验列表显示唯一实际案例及 `auto_aim`、待审核、历史现场反馈和标签；详情逐项显示来源版本、排查过程、失败尝试、原因、处理、验证结果、证据来源、适用条件、限制、待确认信息、来源标识与摘要。刷新后内容一致；全局搜索命中该案例并打开相同记录 ID。
- **布局与滚动：** 使用同一会话检查桌面 `1280×844`、窄屏 `390×844` 和较矮的 `390×600`。实际长文在详情内部可滚到末尾，关闭与编辑按钮始终可见，列表卡片和详情均无水平溢出。修复前视觉检查发现固定弹窗受到父容器 `space-y-5` 的 20px 上边距影响，根页面与弹窗同时出现滚动条；直接隐藏外层滚动会裁切桌面弹窗。共享 Dialog 现锁定 `html` 与 `body` 背景滚动、清除遮罩继承的边距、按断点匹配内边距与最大高度，并由详情内部承担长文滚动。修复后遮罩从视口原点开始，详情框完整落在视口内；390px 详情文档宽度为 390px，内部长文滚动高度 3049px，844px/600px 视口下可用内容高度分别为 669px/425px。截图保存在本机 Git 忽略目录，已目视检查标题、末尾来源信息和底部按钮；原文件的 Markdown 标记当前按纯文本显示，未在本轮加入富文本解析。
- **构建与重启：** 共享 Dialog 修改后，`lint`、`typecheck`、`build` 通过。持续 Chrome 配置位于 Git 忽略的 `.local-test-tools/`；为避免它的浏览器扩展脚本进入 `eslint .`，该目录加入 ESLint 忽略。构建前短暂停止本轮启动的开发服务，构建后恢复 3000 端口；保留的真实会话在同一窗口重新读取列表、详情、全局搜索及窄屏页面均通过。一次重复截图在开发服务首次编译时超时，随后不依赖截图的 DOM、滚动和几何复验通过；前次截图已用于视觉核对。
- **数据未变：** 页面检查前后均用独立 Prisma 连接和服务层读取，与首次入库后的本机基线比较：Knowledge 数量 1、版本 1、规范化 payload SHA-256、更新时间、审核“待审核”和证据“历史现场反馈”均不变。页面验收不代表历史自瞄案例获得新的实车证据，C 板固件和 Ubuntu 实际运行程序的提交身份仍待现场确认。

本轮公开提交仅包含 Dialog 与 ESLint 配置修正、项目背景和不含个人案例正文的验收说明；个人数据库、浏览器配置、截图、凭据和原共享案例文件保持在本机。
