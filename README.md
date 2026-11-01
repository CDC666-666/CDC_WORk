# CDC AI Workspace

面向大学生和工程学习者的个人工作台，管理课程、项目、工程实践、知识、技能、总结、日历和个人收支。RoboMaster 是业务模块之一。

## 当前源码状态

2026-10-31 核对基线：`main@8dc9128`。PR #10 已整合 #3～#9，#4～#9 的 head 均为 main 的祖先；#11～#14 已合并。核对时没有开放 PR。

- 日常数据使用 GitHub OAuth 保护的 PostgreSQL/Prisma Workspace，支持逐实体读写、版本冲突检测及工作区归属校验。
- 公开作品集、项目媒体和公开联系方式由独立内容模型维护，不从私人工作台自动发布。
- `codex/private-workspace-release` 和 `codex/finance-calendar-release` 仍有 main 未包含的实现。本分支的文档不能把它们描述为 main 功能。
- 源码、发布分支和生产运行版本分别核对。本次仅整理公开文档与忽略规则，不部署或操作数据库。

分支依据和限制见 [项目背景](PROJECT_CONTEXT.md)，数据公开边界见 [隐私说明](docs/privacy-boundary.md)。

## 技术栈与页面

Next.js 15 App Router、React 19、TypeScript、Tailwind CSS、Prisma、PostgreSQL、NextAuth/GitHub OAuth。日常页面经过服务层读写服务器数据；演示内容集中在 `data/`。

| 领域 | main 中的主要入口 |
| --- | --- |
| 工作台与计划 | `/`、`/today`、`/learning`、`/reading`、`/content` |
| 工程与成长 | `/projects`、`/robomaster`、`/logs`、`/reviews`、`/knowledge`、`/experiences`、`/skills` |
| 输出与个人管理 | `/reflections`、`/reports`、`/resume`、`/calendar`、`/finance`、`/settings` |
| 公开展示 | `/portfolio` 及其项目、关于、联系、统计页面 |

`/assistant`、`/automation` 是明确标注的建设中页面。正式站点的域名路径限制见 [部署说明](docs/public-deployment.md)。

## 安装与运行

要求 Node.js 20.9 或更高版本。先复制 `.env.example` 为被忽略的 `.env`，配置独立开发数据库、随机会话密钥、GitHub OAuth App 和授权账号数字 ID；不要将生产配置复制到测试目录。详见 [OAuth 配置](docs/oauth-local.md)。

```powershell
npm.cmd ci
npm.cmd run db:generate
npm.cmd run db:deploy
npm.cmd run dev
```

`db:deploy` 会修改所配置数据库的结构，只能在确认目标库与备份后执行。默认开发地址为 `http://localhost:3000`。也可按 `compose.yaml` 配置独立开发环境后运行 `docker compose up --build --wait -d`。

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

数据库、API、浏览器套件只在独立测试环境执行；合成会话测试不能代替真实 OAuth 验收。CI 的 `quality`、`compose` 作业使用临时数据库，不包含部署步骤。

## 数据与接口

- `/api/private/workspace` 读取所属工作区；逐实体写入使用 `/api/private/entities/:collection`，不会替换整个 Workspace 快照。
- 创建、更新、删除均校验会话和归属；写请求校验同源，陈旧版本返回 409，失败事务回滚。
- 日常业务来自服务器。main 的设置页仍有旧浏览器数据工具，操作范围是旧浏览器数据；迁移须经过预览和明确执行。
- 数据库记录、备份、导出、浏览器配置、原始消息及派生快照均是私人运行数据，不能放入 GitHub 文档、PR 或附件。

参考：[实体 API](app/api/private/entities/README.md)、[迁移覆盖](docs/migration-coverage.md)、[服务器模块覆盖](docs/sprint-5-2b-server-workspace.md)、[工程经验](docs/engineering-experience.md)、[备份恢复](docs/database-backup-restore.md)。

## 当前边界

报告与简历素材使用确定性规则，尚未接入真实 AI；视频内容目录包含明确标注的演示内容，不提供真实平台爬虫。财务模块只做收支记录，不提供投资建议。测试样例为合成数据；公开作品集资料是经授权公开的独立内容，不代表私人数据库记录。
