# 个人工作台开发分支背景（2026-10-07）

**文档归属（2026-10-08）：** 本背景与本分支的 `AGENTS.md` 由 `CDC_WORK` 仓库的 `codex/engineering-experience` 分支管理。`6b3e20d` 是工程经验功能开发前的代码基线；本轮验收前本地 HEAD 为 `7ca934b`。验收记录只适用于本机功能分支源码和隔离测试库，不构成生产部署或实车验证。

## 位置、版本与职责

本目录 `D:/Workplace/CDC_WORK_ENGINEERING_EXPERIENCE/` 是从远端 `origin/codex/sprint-5-2b-server-workspace@6b3e20d2c082f37555ad1b08c662f45d9d606f71` 建立的独立 worktree，当前开发分支为 `codex/engineering-experience`。原 `D:/Workplace/CDC_WORK/` 仍在 `codex/sprint-4-3-domain-persistence@d45f199`，含原有未提交和未跟踪工作；不得把两处工作区混同。2026-10-07 `git fetch --prune origin` 后，远端 `main@a9de174`，Sprint 5.2B head 仍为 `6b3e20d`。这些是 Git 引用，不是生产部署证明；PR 状态和实际登录仍待复核。

工作台面向学习、工程实践、知识与个人管理，RoboMaster 只是一个模块。Next.js/React/TypeScript 私有页面通过 NextAuth/GitHub 准入；Sprint 5.2B 服务器工作区以 Prisma/PostgreSQL 存储日常实体。项目整体版本与旧工作区的详细差异见 [Workplace 背景](../WORKSPACE_CONTEXT.md)。跨项目案例由 [共享经验索引](../shared-memory/INDEX.md)进入；当前自瞄案例在 [切入突转案例](../shared-memory/cases/auto-aim-init-alignment.md)。

## 本分支：工程经验最小可用版本

工程经验是从日志、测试或技术问题中提炼的可复用结论，复用现有 `Knowledge` 私有数据库实体和服务端 Workspace API，新增结构化 `experience` 内容与 `/experiences` 页面。审核状态和证据状态是两个独立字段；历史现场反馈不会因为审核或导入自动变成实车验证。字段、访问路径和限定范围导入见 [实现与导入说明](docs/engineering-experience.md)。本分支中的工具只读取 `../shared-memory/cases/auto-aim-init-alignment.md`；案例正文仍在 Workplace 本地文件，不进入公开代码仓库。

**验证口径（2026-10-08，本机 `codex/engineering-experience`，验收前 HEAD `7ca934b`）：** 本 worktree 独立 `npm ci` 后生成 Prisma Client，`lint`、`typecheck`、`test`（42/42）、`build` 通过；构建路由表包含 `/experiences`。隔离 PostgreSQL 16.14 测试库应用现有 5 个迁移，`test:db` 14/14 通过。合成案例的写入、另一个数据库连接读取、编辑后重读、搜索及三类筛选、审核与证据状态独立、重复导入及不覆盖服务器编辑、版本 409 均通过。构建后的本机 HTTP 测试 2/2 通过：未登录无法访问私有页面及 API；使用合成数据库会话验证私有 API 创建、编辑及刷新读取。证据和限制详见[工程经验验收记录](docs/engineering-experience.md)。真实 GitHub OAuth 配置缺失，实际登录后的桌面/窄屏页面未验收；首条真实自瞄案例只预览，目标个人 Workspace 归属未核对，尚未正式入库。测试数据不代表个人数据。上述结果不代表部署。

## 下一轮边界

服务器数据库是新模块唯一运行时数据源；`shared-memory` 原文件保持原样。未来单向同步应按来源稳定 ID、SHA-256 来源摘要、数据库实体版本和证据状态比较差异，先人工审阅，再显式写入；禁止自动双向覆盖。真实 QQ 群接入、部署与 PR 合并均不属于本分支当前任务。
