# 多项目工程经验只读快照（2026-10-09）

适用分支：codex/engineering-experience-multi-snapshot，基线为 PR #8 的 codex/engineering-experience-snapshot@3c8d408。数据库仍是主数据源；此命令没有页面按钮、定时任务、回写或双向覆盖。旧单案例命令保留为同一实现的别名。

## 手动运行与边界

在 D:/Workplace/CDC_WORK_ENGINEERING_MULTI_SNAPSHOT 独立执行 npm ci、npm run db:generate，使用本机被 Git 忽略的 .env，然后运行：

    npm.cmd run snapshot:experiences

命令不接受任意 Workspace、数据库或输出路径参数。预检限定 ALLOWED_GITHUB_USER_ID 为 248133835，DATABASE_URL 为本机 localhost:5432/cdc_workspace；在 PostgreSQL 可重复读、只读事务中再次核对 current_database()、GitHub 数字 ID、GitHub Account、User 和唯一 Workspace 的所属关系。Account 仅投影 providerAccountId；不查询令牌或 Session。仅查询本人 Workspace 下 payload.itemType 为“工程经验”且未归档的 Knowledge，包含手动录入与 sharedMemory 来源；其他知识类型和其他 Workspace 不纳入。

输出为 ../shared-memory/server-snapshots/INDEX.md、STATUS.md 及 .versions/ 下按实体 ID SHA-256 命名的独立 Markdown。索引按来源项目分组，列标题、标签、审核、证据、版本、稳定实体 ID、来源标识和摘要以及数据库内容摘要。缺失来源标识或来源摘要显示“未提供”。同一来源的多个版本不是独立证据。正文包含完整经验字段及适用限制。生成器拒绝常见凭据形态文本；实际快照正文被 Workplace 根 Git 仓库忽略，不能提交到公开代码仓库。

先渲染整批、写入隐藏版本目录，再一次性切换当前 INDEX.md；中途失败保留旧完整索引和案例，STATUS.md 标记现状未知。成功刷新会撤下已删除、归档或改为其他知识类型的记录，清理旧版本目录。重复读取同一内容返回 unchanged，不复制记录；STATUS.md 的最近成功核对时间仍前进，当前快照生成时间与数据库原始更新时间保持独立。历史个人案例的数据库索引时间存在已知时区偏差，保留原值，不以该时间单独判断事件顺序。

## 验证证据与局限

2026-10-09 在隔离 PostgreSQL 的合成记录上验证了两项目、手动和 sharedMemory 来源、账号归属失败、其他知识类型/其他 Workspace 排除、编辑版本更新、归档与删除撤下；只读事务不写入个人库。批量文件测试验证重复运行、内容漂移重建、失败时旧完整批次保留、凭据形态文本拒绝。显式在 PostgreSQL 会话执行 SET LOCAL TIME ZONE 'Asia/Shanghai' 后，原生实体写入/重读的 UTC 时间一致；该测试列入 test:db，CI 的 quality 与 compose 作业均运行此脚本。

本机个人开发库在升级前后由原始入库基线工具比对：仍只有一条自瞄工程经验，版本 1，规范化正文摘要与更新时间未变，审核“待审核”，证据“历史现场反馈”。新格式 4 快照实际输出一条当前记录；再次运行返回 unchanged，错误允许账号返回 GITHUB_ALLOWLIST_MISMATCH 且索引哈希不变，恢复后仍返回 unchanged。两项目合成测试不表示真实个人 Workspace 已有底盘或其他项目经验。该案例未做本轮实车验证，具体应用仍需核对车辆模式、参考/反馈及运行版本。独立新会话 01a11f49-9561-7ba3-9b4f-ef15b3f18aec 仅收到“自瞄切入时云台突然转动，应先检查什么？”一句，工作目录 D:/Workplace。首个文件执行器调用在进程创建前报 setup refresh had errors；只读重试后实际打开根 AGENTS.md、共享索引、STATUS.md、格式 4 快照索引及索引指向的独立案例文件。读取输出显示实体版本 1、审核“待审核”、证据“历史现场反馈”；回答区分历史机械对齐案例与当前车辆尚需确认的模式、参考/反馈、实际固件及 Ubuntu 程序版本。该独立检索验收通过；默认执行器仍有间歇性环境错误，重试可用。
