# 工程经验数据库只读快照（2026-10-09）

适用分支 `codex/engineering-experience-snapshot`，从 PR #7 的 `codex/engineering-experience@c3737a1` 建立。本命令只把本机个人开发库中已入库的一条自瞄经验派生为 Workplace 可检索 Markdown；数据库仍是主数据源。它不导入、不回写、不同步原始 `shared-memory/cases/`，也没有页面按钮或定时任务。

## 手动运行

在 `D:/Workplace/CDC_WORK_ENGINEERING_SNAPSHOT` 的独立 worktree 中完成 `npm ci` 和 `npm run db:generate`，将本机有效的个人开发库 `.env` 放在该目录（Git 忽略），再执行：

```powershell
npm.cmd run snapshot:experience
```

命令固定输出到 `../shared-memory/server-snapshots/`，不接受任意记录、Workspace 或输出路径参数。启动前要求 `ALLOWED_GITHUB_USER_ID` 为预期数字 ID，`DATABASE_URL` 指向本机 `localhost:5432/cdc_workspace`；在 PostgreSQL 可重复读、只读事务内核对 `current_database()`、GitHub Account/User 与唯一 Workspace 的所属关系，然后只按稳定 ID 读取 `shared-memory/cases/auto-aim-init-alignment.md` 对应的 Knowledge 行。没有查询 Account 的令牌列或 Session 表；渲染器只选择经验字段并拒绝常见凭据文本。自动化回归库不能通过目标库预检。

`INDEX.md` 是当前入口，`STATUS.md` 报告最近刷新和最后成功时间；当前案例文件在隐藏的 `.versions/` 下。先写完整案例，再原子切换索引；刷新失败保留上次完整索引和案例，并将状态标为“现状未知”。同一版本、摘要和更新时间再次运行返回 `unchanged`，不会新增案例。数据库行被删除、归档或不再是工程经验时，成功刷新发布无当前记录的索引，旧内容不再作为有效经验。索引切换后清理不再被引用的隐藏版本。工作区根仓库忽略整个 `server-snapshots/`；公开代码仓库只提交命令、合成测试和不含案例正文的说明。

快照写出标题、现象、环境和版本、排查过程、失败尝试、原因、解决办法、验证结果、证据来源、适用条件、限制、待确认项、审核与证据状态，以及实体 ID、数据库版本、来源标识/摘要、数据库更新时间和生成时间。原共享案例与数据库快照是同一来源的两个版本，不能累加为独立证据。待审核、历史现场反馈可以引导排查，不等于本轮实车验证。

## 本机验收与边界

2026-10-09 在上述个人开发库执行首轮生成，重复执行返回 `unchanged`；真实案例索引仅 1 个当前入口，隐藏版本目录仅 1 个。独立 Prisma 重读后按相同字段渲染，Markdown 与数据库逐字节一致；与首次入库基线比较，Knowledge 数量 1、版本 1、规范化 payload SHA-256、更新时间、审核“待审核”及证据“历史现场反馈”均不变。合成测试覆盖幂等、生成失败保留旧索引和正文、刷新失败保留最后成功时间、归档撤下当前入口、凭据形态文本拒绝；另用错误的允许账号配置实际运行，返回 `GITHUB_ALLOWLIST_MISMATCH`，旧索引和案例 SHA-256 不变，恢复正确配置后仍返回 `unchanged`。这些是数据库和文件验证，不是实车复测。

本机记录的数据库 `updatedAt`（`2026-10-08T20:10:58.089Z`）晚于本轮快照生成时间（`2026-10-08T16:10:57.141Z`）；时钟或时区口径尚待核实。快照已提示不要据此推断时间先后，以版本和摘要判断内容一致性。正式部署、其他案例、双向同步和自动任务均未验收或实现。
