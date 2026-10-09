# 工程经验数据库只读快照（2026-10-09）

适用分支 `codex/engineering-experience-snapshot`，从 PR #7 的 `codex/engineering-experience@c3737a1` 建立。本命令只把本机个人开发库中已入库的一条自瞄经验派生为 Workplace 可检索 Markdown；数据库仍是主数据源。它不导入、不回写、不同步原始 `shared-memory/cases/`，也没有页面按钮或定时任务。

## 手动运行

在 `D:/Workplace/CDC_WORK_ENGINEERING_SNAPSHOT` 的独立 worktree 中完成 `npm ci` 和 `npm run db:generate`，将本机有效的个人开发库 `.env` 放在该目录（Git 忽略），再执行：

```powershell
npm.cmd run snapshot:experience
```

命令固定输出到 `../shared-memory/server-snapshots/`，不接受任意记录、Workspace 或输出路径参数。启动前要求 `ALLOWED_GITHUB_USER_ID` 为预期数字 ID，`DATABASE_URL` 指向本机 `localhost:5432/cdc_workspace`；在 PostgreSQL 可重复读、只读事务内核对 `current_database()`、GitHub Account/User 与唯一 Workspace 的所属关系，然后只按稳定 ID 读取 `shared-memory/cases/auto-aim-init-alignment.md` 对应的 Knowledge 行。没有查询 Account 的令牌列或 Session 表；渲染器只选择经验字段并拒绝常见凭据文本。自动化回归库不能通过目标库预检。

`INDEX.md` 是当前入口，`STATUS.md` 分别报告**最近成功核对时间**、**当前快照生成时间**和**数据库更新时间**；当前案例文件在隐藏的 `.versions/` 下。`unchanged` 只更新最近成功核对时间，不重写案例或索引。先写完整案例，再原子切换索引；刷新失败保留上次完整索引和案例，并将状态标为“现状未知”，同时保留最近成功核对时间。数据库行被删除、归档或不再是工程经验时，成功刷新发布无当前记录的索引，旧内容不再作为有效经验。索引切换后清理不再被引用的隐藏版本。工作区根仓库忽略整个 `server-snapshots/`；公开代码仓库只提交命令、合成测试和不含案例正文的说明。

快照写出标题、现象、环境和版本、排查过程、失败尝试、原因、解决办法、验证结果、证据来源、适用条件、限制、待确认项、审核与证据状态，以及实体 ID、数据库版本、来源标识/摘要、数据库更新时间和生成时间。原共享案例与数据库快照是同一来源的两个版本，不能累加为独立证据。待审核、历史现场反馈可以引导排查，不等于本轮实车验证。

## 本机验收与边界

2026-10-09 在上述个人开发库执行首轮生成，重复执行返回 `unchanged`；真实案例索引仅 1 个当前入口，隐藏版本目录仅 1 个。独立 Prisma 重读后按相同字段渲染，Markdown 与数据库逐字节一致；与首次入库基线比较，Knowledge 数量 1、版本 1、规范化 payload SHA-256、更新时间、审核“待审核”及证据“历史现场反馈”均不变。合成测试覆盖幂等、生成失败保留旧索引和正文、刷新失败保留最后成功时间、归档撤下当前入口、凭据形态文本拒绝；另用错误的允许账号配置实际运行，返回 `GITHUB_ALLOWLIST_MISMATCH`，旧索引和案例 SHA-256 不变，恢复正确配置后仍返回 `unchanged`。这些是数据库和文件验证，不是实车复测。

### 时间异常核查与修复（2026-10-09）

Windows 本地时区为 `China Standard Time`（UTC+8）；同一时刻 Windows UTC、Node `Date.toISOString()` 与 PostgreSQL `clock_timestamp()` 的 UTC 值一致，数据库会话时区为 `Asia/Shanghai`。`Knowledge.updatedAt` 是 `timestamp(3) without time zone`。个人开发库这条记录的正文时间为 `2026-10-08T12:10:58.080Z`，索引列存储为无时区墙上时间 `2026-10-08 20:10:58.089`，Prisma 读回为 `2026-10-08T20:10:58.089Z`；差约八小时。原快照在 `2026-10-08T16:10:57.141Z` 生成，因此索引列看似比快照晚约四小时。对照 `repositories/server/entity-repository.ts` 的原写入路径，带时区的 JS `Date` 参数直接赋给无时区列，受数据库会话时区影响；这是时间口径差异，不是当前 Windows/Node/PostgreSQL 时钟相差四小时。历史列值和正文均未改。

本分支将后续原生实体和浏览器数据迁移的写入显式转换为 UTC 墙上时间，再赋给无时区列。隔离 `experience_acceptance` 库在上海时区的真实创建和更新回归中，经验数据库列与正文时间差均小于 10 秒；迁移记录的列时间也接近本轮执行时间，完整数据库测试 15/15 通过。快照格式升级后仍保留原始历史列值，并提示它与正文时间不一致；不能凭旧列值判断事件先后。首次新版快照生成于 `2026-10-09T03:55:14.404Z`，随后只读核对返回 `unchanged`、索引 SHA-256 不变且目录仍只有一个当前版本，`STATUS.md` 的最近核对时间前进。错误允许账号的实际运行返回 `GITHUB_ALLOWLIST_MISMATCH`，索引和案例哈希不变，之后有效读取恢复。独立 Prisma 重读确认 Markdown 与数据库逐字节一致，原案例数量 1、版本 1、正文摘要、审核“待审核”和证据“历史现场反馈”与原入库基线一致。

### 独立检索验收（2026-10-09）

独立新会话 `01a11f27-7ce3-73e2-ba6e-aacfdd489dda` 的工作目录是 `D:/Workplace`，仅收到“自瞄切入时云台突然转动，应先检查什么？”一句。默认文件执行器仍在进程创建前报 `helper_unknown_error: setup refresh had errors`；按 Workplace 规则经授权重试只读文件命令后，它实际打开了 `AGENTS.md`、`shared-memory/INDEX.md`、`shared-memory/server-snapshots/STATUS.md`、同目录 `INDEX.md`、索引指向的 `.versions/f3-v1-7cc64852bec42575-20261008201058089-20261009035514404/auto-aim-init-alignment.md` 和原案例。工具输出显示实体版本 `1`、审核“待审核”、证据“历史现场反馈”。独立回答指出初始化回机械中位只适用于该状态路径，当前车辆仍需模式、参考/反馈、机械对齐和实际固件版本；没有把历史原因认定为本次原因。**独立文件检索及应用判断通过；默认执行器本身尚未恢复，只读提权重试是当前可用办法。**第一轮因执行器错误而中断的新会话不计入通过。正式部署、其他案例、双向同步和自动任务均未验收或实现。
