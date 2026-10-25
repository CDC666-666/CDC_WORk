# 理财双层环形图与弹窗滚动修复：生产发布（2026-10-25）

## 版本与发布范围

- 正式地址：`https://work.cdc666.cn`；公开作品集：`https://cdc666.cn/portfolio`。
- 发布分支：`codex/finance-calendar-release`。实际 Web 构建提交：`87af4b10789939976d8af428acac1dec70140994`，推送后核对远端 SHA 一致。该提交从上一生产版本 `5f806265394b9e62bcdd0a0211b6c627ac4ca8bd` 增量开发，保留其已上线功能。
- 新镜像标签 `cdc-work-release:87af4b1`，ID `sha256:a773b7e0c8ffd48005c57d24106225a88e53c40b00a8b8cf62d9dcb6ad01e96d`；运行容器 revision 标签为上述完整提交。旧镜像 `sha256:227701ac0a0952fc0d8a0aabe666d62f9bab764238be950c116d1a40dffefc38`，另保留为 `cdc-work-rollback:pre-finance-donut-20261025`。
- 服务器 `main` checkout 保持原状；从已推送提交生成并校验的 Git bundle 创建独立 release worktree `/opt/cdc-work/releases/87af4b10789939976d8af428acac1dec70140994`。候选与原活动 Compose 覆盖文件的唯一差异为 Web 镜像标签；仅重建 Web 容器，DB 卷、OAuth、Caddy 和域名配置未改。

## 备份与数据库

- 切换前新备份：`/var/backups/cdc-work/automatic/cdc_workspace_20261025T014113Z_165514.dump`，119456 字节，SHA-256 `eb9cdca8280690b7e17038b45bfb301f5624bd48ab18eae1d3d89b9be5fc67e2`；同目录有备份 manifest。归档目录可读、全量解码通过；恢复到独立演练库并比较 40 个业务表、9 条迁移、主键与行摘要全部 MATCH，演练库已删除。备份不在 Git 或公开目录。
- 原环境与活动 Compose、Caddy 配置、镜像标识保存在 root-only `/var/backups/cdc-work/pre-finance-donut-20261025T014238Z/`。回退镜像 ID 已复核。
- 本轮**无 Prisma schema 或迁移文件变化**。切换前候选镜像的 `prisma migrate status` 显示 9 条迁移且结构最新；新 Web 启动的 `migrate deploy` 显示无待执行迁移。未运行数据库重置或结构覆盖。
- 切换前后账单笔数及整行摘要同为 `7|5a252760983e0876650297ecd8ef5ffc`；类别同为 `18|75fcb64633ccb34e6247327635165fd8`；有标签账单 4 笔，多标签 0 笔，已有 `primaryTag` 的账单 0 笔。生产旧数据未被迁移或改写。现有数据无法只读验证生产多标签的实际呈现，隔离环境已覆盖。

## 验证结果与边界

- 最终代码本地 `npm run lint`、`npm run typecheck`、`npm test`（58/58）、`npm run build` 通过；隔离 PostgreSQL 的完整浏览器回归 10/10，聚焦手机触摸用例 1/1。隔离数据测试后清除，详见 `docs/finance-donut-scroll-acceptance-20261025.md`。
- 生产 Web 和 DB 均 healthy，Caddy active；Web 日志显示 Next.js 就绪、无待执行迁移，最近十分钟 `error|exception|fatal` 匹配数 0。生产镜像 ID 与 revision 均核对。根分区发布后剩余约 3.6 GB（使用率 93%），后续发布前需处理容量，不删除本轮保留的回退镜像和备份。
- 实际 HTTPS：公开作品集主页、项目、关于、联系、统计，工作台入口和登录页均为 200；未登录访问私人 workspace、finance、search 接口均为 401。无登录浏览器访问 `/finance` 跳转登录。
- 独立无登录 Chrome 在 1440px 和 390px 加载公开主页、登录页，页面脚本错误与控制台错误为 0，`scrollWidth` 等于视口宽度。为避免产生验收 PV，浏览器中将公开访问统计请求本地应答 204。无敏感信息截图在本机 Git 忽略目录 `D:/Workplace/.private-db-backups/finance-donut-release-20261025/`（`portfolio-1440.png`、`portfolio-390.png`、`login-1440.png`、`login-390.png`）。
- **尚未完成真实 OAuth 登录后的生产 UI 验收：**旧账单详情、类别和标签双环占比及空标签归类、类别/标签点击筛选、全局搜索直达、编辑时标签选择与取消/保存后的滚动、其他共享弹窗和私人页面手机布局。当前无可用的真实 OAuth 会话，浏览器会话控制接口启动失败；没有使用合成会话冒充生产验收，也没有向生产写入测试账单。用户真实登录后按上述流程只读查看，并以现有真实账单核对金额；编辑滚动流程如需操作真实账单，先选择可安全修改的账单并恢复原值。

## 回退

本轮数据库无迁移，旧应用与当前结构兼容。应用异常时仅回退 Web，保留 DB 与所有持久化文件：

```sh
cd /opt/cdc-work/app
cp -p /var/backups/cdc-work/pre-finance-donut-20261025T014238Z/compose.active.yaml /opt/cdc-work/ops/compose.active.yaml
docker compose -f compose.yaml -f /opt/cdc-work/ops/compose.server.yaml -f /opt/cdc-work/ops/compose.active.yaml up -d --no-deps web
docker compose -f compose.yaml -f /opt/cdc-work/ops/compose.server.yaml -f /opt/cdc-work/ops/compose.active.yaml ps web db
```

回退后核对旧镜像 `sha256:227701ac0a0952fc0d8a0aabe666d62f9bab764238be950c116d1a40dffefc38`、服务健康、登录页和匿名私人接口 401，并再次核对账单/类别笔数与摘要。生产备份仅用于数据库实际损坏的单独恢复流程；先保护故障时点和备份后的新写入，不能直接用旧备份覆盖生产。
