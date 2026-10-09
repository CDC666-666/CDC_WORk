# 本机 PostgreSQL 备份与隔离恢复演练

适用代码基线：`origin/main@f4c173a`，演练分支 `codex/personal-db-backup`，核对日期 2026-10-09。本说明只记录可复用步骤与验证口径；实际归档、基线清单、恢复比较结果和认证数据只保存在本机受限目录，不进入代码仓库。

## 先确认源库

1. 从原工作区的既有 `.env` 读取 `DATABASE_URL` 和 `ALLOWED_GITHUB_USER_ID`，不要在命令输出、日志或提交中打印连接串。确认 URL 仅指向 `localhost:5432/cdc_workspace`。
2. 找到此前实际使用的数据目录，检查 `PG_VERSION`、`global/pg_control` 和已有 `base/`，再用对应版本的 `pg_ctl -D <原数据目录> status` / `start` 启动。**不要运行 `initdb` 或创建同名空库。**连接后只读查询 `current_database()`、`current_setting('data_directory')`、服务端版本、编码和排序规则，并与目录核对。
3. 在独立 worktree 运行 `npm ci`、`npm run db:generate`。下面的验证脚本从原 `.env` 取连接配置，但所有查询使用可重复读、只读事务；它核对 GitHub Account → User → Workspace 关系。归属检查只投影所需标识；整行摘要计算涵盖认证表字段，哈希在 PostgreSQL 内完成，脚本只接收主键和摘要。令牌明文不返回给脚本、不输出，经验正文也不输出。

```powershell
node --env-file=<原工作区的.env> --conditions=react-server --import tsx scripts/verify-db-backup.ts baseline <受限私人目录\baseline.json>
```

脚本以 `wx` 新建清单，拒绝写入代码 worktree；清单含实体 ID、归属关系、各表主键和整行 SHA-256 指纹、Prisma 迁移记录、工程经验版本与正文摘要，必须留在私人目录。`VerificationToken` 没有声明主键，脚本明确记录空主键列，并用整行摘要比较。

## 归档与恢复

使用 PostgreSQL 16 或更新且兼容源库的客户端。先在私人目录设置仅当前账户与 SYSTEM 可访问的 ACL，并用 `git check-ignore` 确认被忽略。把密码仅暂时放在当前进程的 `PGPASSWORD` 环境变量，操作后立即清除；不要把密码放进命令参数或输出。实际命令形式：

```powershell
pg_dump -h localhost -p 5432 -U <源库角色> -d cdc_workspace -Fc -b -f <受限私人目录\备份.dump>
pg_restore --list <受限私人目录\备份.dump>
```

记录归档的 UTC 时间、字节数、SHA-256、服务端及客户端版本和应用提交。`pg_dump -Fc` 包含该数据库的表结构、数据、大对象与 `_prisma_migrations`，包括认证数据；归档必须继续留在受限私人目录。PostgreSQL 的集群级角色、角色密码和服务器配置不在单库归档中，未来服务器迁移需另行准备。

先查询 `pg_database` 确认演练库名不存在，并验证它与 `cdc_workspace` 不同；按源库的编码和排序规则从 `template0` 建立新库。连接新库再次检查 `current_database()`，然后只对新库执行：

```powershell
pg_restore --exit-on-error --single-transaction -h localhost -p 5432 -U <源库角色> -d <全新演练库名> <受限私人目录\备份.dump>
node --env-file=<原工作区的.env> --conditions=react-server --import tsx scripts/verify-db-backup.ts verify <受限私人目录\baseline.json> <全新演练库名> <受限私人目录\restore-result.json>
```

验证脚本只接受形如 `cdc_workspace_restore_drill_YYYYMMDD_HHMMSS` 的目标名，派生临时连接 URL，不修改原 `.env` 或快照脚本的数据库限制。它重新只读检查源库与恢复库：全部 public 表的数量、主键与整行指纹、GitHub 归属、工程经验内容及状态、Prisma 迁移，并通过工作台现有 `readWorkspaceExperiences` 数据访问函数读取经验。恢复失败不能改向源库重试；保留故障目标与原完整归档供排查。

## 2026-10-09 演练结论与边界

原 PostgreSQL 16.14 数据目录重新启动后，使用 16.15 客户端完成自定义归档与全新数据库的单事务恢复。私人基线与恢复结果显示 37 张表的数量、主键和整行摘要一致，6 条已完成迁移一致，Workspace 归属与现有工程经验的版本、状态和内容摘要一致；恢复后再读源库，整库业务指纹与备份前相同。验证结果属于**本机备份与恢复演练**，不表示服务器环境已配置、生产迁移已执行，也不修正历史时间字段。实际归档路径与 SHA-256 仅见本机私人元数据和交付报告。
