# 个人工作台开发分支背景（2026-10-07）

**文档归属（2026-10-08）：** 本背景与本分支的 `AGENTS.md` 由 `CDC_WORK` 仓库的 `codex/engineering-experience` 分支管理。`6b3e20d` 是工程经验功能开发前的代码基线；本轮验收前本地 HEAD 为 `7ca934b`。验收记录只适用于本机功能分支源码和隔离测试库，不构成生产部署或实车验证。

## 位置、版本与职责

本目录 `D:/Workplace/CDC_WORK_ENGINEERING_EXPERIENCE/` 是从远端 `origin/codex/sprint-5-2b-server-workspace@6b3e20d2c082f37555ad1b08c662f45d9d606f71` 建立的独立 worktree，当前开发分支为 `codex/engineering-experience`。原 `D:/Workplace/CDC_WORK/` 仍在 `codex/sprint-4-3-domain-persistence@d45f199`，含原有未提交和未跟踪工作；不得把两处工作区混同。2026-10-07 `git fetch --prune origin` 后，远端 `main@a9de174`，Sprint 5.2B head 仍为 `6b3e20d`。这些是 Git 引用，不是生产部署证明；PR 状态和实际登录仍待复核。

工作台面向学习、工程实践、知识与个人管理，RoboMaster 只是一个模块。Next.js/React/TypeScript 私有页面通过 NextAuth/GitHub 准入；Sprint 5.2B 服务器工作区以 Prisma/PostgreSQL 存储日常实体。项目整体版本与旧工作区的详细差异见 [Workplace 背景](../WORKSPACE_CONTEXT.md)。跨项目案例由 [共享经验索引](../shared-memory/INDEX.md)进入；当前自瞄案例在 [切入突转案例](../shared-memory/cases/auto-aim-init-alignment.md)。

## 本分支：工程经验最小可用版本

工程经验是从日志、测试或技术问题中提炼的可复用结论，复用现有 `Knowledge` 私有数据库实体和服务端 Workspace API，新增结构化 `experience` 内容与 `/experiences` 页面。审核状态和证据状态是两个独立字段；历史现场反馈不会因为审核或导入自动变成实车验证。字段、访问路径和限定范围导入见 [实现与导入说明](docs/engineering-experience.md)。本分支中的工具只读取 `../shared-memory/cases/auto-aim-init-alignment.md`；案例正文仍在 Workplace 本地文件，不进入公开代码仓库。

**验证口径（2026-10-08，本机 `codex/engineering-experience`，验收前 HEAD `7ca934b`）：** 本 worktree 独立 `npm ci` 后生成 Prisma Client，`lint`、`typecheck`、`test`（42/42）、`build` 通过；构建路由表包含 `/experiences`。隔离 PostgreSQL 16.14 测试库应用现有 5 个迁移，`test:db` 14/14 通过。合成案例的写入、另一个数据库连接读取、编辑后重读、搜索及三类筛选、审核与证据状态独立、重复导入及不覆盖服务器编辑、版本 409 均通过。构建后的本机 HTTP 测试 2/2 通过：未登录无法访问私有页面及 API；使用合成数据库会话验证私有 API 创建、编辑及刷新读取。证据和限制详见[工程经验验收记录](docs/engineering-experience.md)。真实 GitHub OAuth 配置缺失，实际登录后的桌面/窄屏页面未验收；首条真实自瞄案例只预览，目标个人 Workspace 归属未核对，尚未正式入库。测试数据不代表个人数据。上述结果不代表部署。

**PR #7 修复核对（2026-10-08，`codex/engineering-experience`，修复前 HEAD `2069e87`）：** 项目关联的清除请求现明确发送空值，服务端在合并后清理 payload、索引列与 `relationRefs`；详情弹窗改由 URL `record` 参数驱动。使用隔离 PostgreSQL、合成会话及本机 Chrome 验证了关联→取消→刷新→删除旧项目，搜索 A/B、同页参数切换、关闭后再打开、历史前进/后退、缺失 ID 和 390px 布局。修复后的 `lint`、`typecheck`、`build`、42 条常规测试、14 条数据库测试、2 条 HTTP 测试和 3 条浏览器测试均通过。详见[验收记录](docs/engineering-experience.md)；真实 OAuth 与首案例正式入库状态不变。

**真实 OAuth 本地验收（2026-10-08，`codex/engineering-experience@0980943` 加当时尚未提交的修复）：** 在独立 PostgreSQL 开发库应用第 6 个迁移后，GitHub 授权回调成功建立数据库账户、Workspace 与会话；只核对数字账号与准入值相等、Workspace 用户关系一致，不记录个人资料。用户在 Chrome 确认进入工作台、刷新后仍保持登录，能打开 `/experiences`，退出后再次访问该页面被带回登录页。第一次回调暴露了 Account 模型缺少 GitHub 返回的刷新令牌过期字段；后续回调暴露了 Node.js 直连 GitHub 的超时/连接重置，改用本机现有代理后成功。失败回调的错误日志曾包含 OAuth 令牌；用户反馈已在 GitHub 撤销该次授权，之后重新授权。首条共享案例只做目标 Workspace 的只读预览，库中 Knowledge 记录仍为 0，未正式导入。详细证据和限制见[OAuth 与工程经验验收记录](docs/engineering-experience.md)。

**真实会话页面复验（2026-10-08，同一分支、基于 `0980943` 的本轮修复）：** NextAuth 错误日志改为只输出受限错误代码和类别，丢弃可能含令牌的元数据；日志脱敏单测及数据库层配置/字段投影测试通过。用户在隔离 Chrome 窗口亲自完成 GitHub 登录后，本机 Playwright 沿该真实会话验证一条明确标记的临时经验：新增、详情、搜索、刷新读取、编辑后数据库重读、390px 详情布局无水平溢出、退出后私有页跳转；记录已仅按本轮 ID 删除，Knowledge 数量回到 0。窄屏截图由本机检查，未包含真实案例。独立回归库应用 6 个迁移，14 条原数据库测试、1 条认证字段投影测试及 2 条 HTTP API 测试通过；43 条常规测试、lint、typecheck、build 通过。上述均不代表生产部署或自瞄实车验证。

**首条真实案例入库（2026-10-08，`codex/engineering-experience@fa6291f`，本机个人开发库）：** 重新确认本地 `cdc_workspace` 是此前真实 OAuth 验收使用的开发库，不是自动化回归库；配置的 GitHub 数字 ID 与 Account、User 和唯一 Workspace 的用户关联一致。限定脚本对 `../shared-memory/cases/auto-aim-init-alignment.md` 的只读预览通过，随后正式导入一条 Knowledge，版本 1；解析出的章节和证据边界与原文件逐字段一致。再次执行同源导入返回 `already_exists`，数量、版本、正文摘要及更新时间未变。审核仍为“待审核”，证据仍为“历史现场反馈”；2026-10-07 的源码静态复核不等于当次固件或本轮实车验证。应用重启后数据库与服务层重读仍一致，匿名私有 API 返回 401；真实浏览器列表、详情、全局搜索和窄屏验收因未取得本轮手动登录会话而待完成，见[验收记录](docs/engineering-experience.md)。案例正文只保留在共享文件和本机数据库，不写入代码仓库。

**实际案例真实页面验收（2026-10-08，`codex/engineering-experience` 基于 `6feb6b4`）：** 恢复此前的本机个人开发库并再次核对 OAuth 用户、Workspace 和案例基线；用户在持续打开的独立 Chrome 窗口亲自完成 GitHub 登录。沿同一真实会话只读核对实际案例的列表、完整详情、全局搜索进入详情和刷新；桌面 1280px、窄屏 390px（844px 与 600px 高）均可滚动到长文末尾，按钮可见且无水平溢出。发现共享 Dialog 被父容器间距下移并产生外层第二滚动条，已修正根页面滚动锁、弹窗边距和响应式高度；构建及应用重启后复验通过。数据库数量仍为 1、版本仍为 1，正文摘要与更新时间、审核“待审核”和证据“历史现场反馈”均未变化。本轮只是软件页面验收，未复测实车或核实历史 C 板/Ubuntu 二进制版本；详见[验收记录](docs/engineering-experience.md)。

## 下一轮边界

服务器数据库是新模块唯一运行时数据源；`shared-memory` 原文件保持原样。未来单向同步应按来源稳定 ID、SHA-256 来源摘要、数据库实体版本和证据状态比较差异，先人工审阅，再显式写入；禁止自动双向覆盖。真实 QQ 群接入、部署与 PR 合并均不属于本分支当前任务。

## 独立快照分支（2026-10-09）

`D:/Workplace/CDC_WORK_ENGINEERING_SNAPSHOT` 在 `codex/engineering-experience-snapshot`，从 PR #7 最新的 `c3737a1` 建立；原 `codex/engineering-experience` worktree 保持不变。本分支提供手动 `npm.cmd run snapshot:experience`，只读核对本机个人开发库、允许的 GitHub 数字 ID 和 Workspace 归属，将唯一已入库自瞄经验写为 `../shared-memory/server-snapshots/` 的本机派生 Markdown 与索引。快照目录被根文档仓库忽略，不包含在公开代码提交；原共享案例不修改。重复运行、失败保留、归档/删除失效和本机真实数据库内容/版本未变化的证据见[快照说明](docs/engineering-experience-snapshot.md)。待审核与历史现场反馈继续分开；快照并未增加实车证据。

**2026-10-09 本轮核查（本地 `codex/engineering-experience-snapshot@1c75f37` 加待提交修复）：** Windows/Node/PostgreSQL 当前 UTC 时钟一致；个人库 `Knowledge.updatedAt` 为无时区列，旧原生写入路径受 PostgreSQL 上海时区转换影响，使该历史索引值比正文 UTC 时间约晚八小时。修正了后续原生写入及浏览器数据迁移的 UTC 口径，不改历史案例；快照将生成、最近成功核对及原始数据库更新时间分开记录。隔离库 15 条数据库检查、47 条常规测试、lint、typecheck、build 通过；个人库快照重读一致，重复执行无重复、失败保留原内容，个人案例数量/版本/正文摘要不变。独立只读会话已实际读取根规则、索引和快照并给出有边界的排查建议，**检索验收通过**；默认文件执行器仍故障，经授权的只读重试可用。详情与具体错误见[快照说明](docs/engineering-experience-snapshot.md)。

## 多项目只读快照分支（2026-10-09）

本 worktree D:/Workplace/CDC_WORK_ENGINEERING_MULTI_SNAPSHOT 位于 codex/engineering-experience-multi-snapshot，从 PR #8 最新提交 3c8d408 建立；原工程经验和快照 worktree 未切换。手动命令 npm.cmd run snapshot:experiences 在只读可重复读事务中核对本机个人开发库、允许的 GitHub 数字 ID、Account/User/Workspace 关联，选择本人 Workspace 下全部未归档工程经验（手动及 sharedMemory）。它不查询其他知识类型、账户令牌或会话。输出按来源项目分组，按实体 ID 哈希命名独立 Markdown；来源标识和来源摘要缺失时明确为“未提供”。文件批量生成完成后才切换索引，重复读取只更新最近成功核对时间；删改/归档/改类型在成功刷新后撤下旧入口。详细命令、元数据及边界见[多项目快照说明](docs/engineering-experience-multi-snapshot.md)。

2026-10-09 本机隔离 PostgreSQL 16.14 的合成测试：两个项目、手动和共享来源、错误数据库/归属、非经验和其他 Workspace 排除、版本编辑、归档删除、重复运行、内容漂移修复、批量失败恢复均通过；另显式设置会话时区 Asia/Shanghai 验证 UTC 写入回读。单元测试 47/47，数据库测试 17/17，lint 与 typecheck 通过。个人开发库只读生成格式 4 快照，当前真实记录仍仅一条自瞄经验，版本 1，审核“待审核”、证据“历史现场反馈”；升级前后与入库基线比对，数量、版本、正文摘要和更新时间未变。错误允许账号预检失败时索引哈希不变，恢复后返回 unchanged。合成的两项目案例不能当作个人 Workspace 已有跨项目经验，也不代表实车验证。独立新会话 01a11f49-9561-7ba3-9b4f-ef15b3f18aec 已实际打开根规则、共享索引、快照状态/索引/案例，正确引用版本 1 与审核/证据边界；首个文件执行器调用失败，重试成功。build 通过；Draft PR #9 以 codex/engineering-experience-snapshot 为 base，功能提交 24cb050 的 GitHub Actions quality 与 compose 于 2026-10-09 均通过。PR 保持未合并、未部署。
