# CDC AI Workspace

面向大学生和工程学习者的个人 AI 工作台，统一管理课程学习、任务、阅读、技术内容、工程项目、测试复盘、知识沉淀、技能成长、报告素材、日历与个人收支。

当前正在进行 **Sprint 4.3: 数据持久化架构准备**。Sprint 3 的工程成长闭环仍是现有产品功能；RoboMaster 是一级业务模块之一，不是产品的唯一定位。

## 技术栈

- Next.js 15 App Router、React 19、TypeScript
- Tailwind CSS、shadcn/ui 风格组件、Lucide Icons
- React Context + useReducer
- Repository + LocalStorage Adapter、版本化迁移、校验和 JSON 备份
- ESLint、TypeScript typecheck、GitHub Actions CI

## Sprint 3 完成内容

- Workspace schema v3，覆盖计划、工程、成长、输出和个人管理共 19 类数据
- 项目组合、项目详情、模块和里程碑管理
- RoboMaster 专属项目视图，但与普通项目共用同一数据源
- 工程日志、测试记录、技术问题、解决方案和知识沉淀闭环
- 知识库、技能树、成长证据、报告中心和简历素材
- 日历月视图、周视图和列表视图，自动派生任务、学习、阅读与里程碑
- 个人收支 CRUD、月度统计和分类占比，不提供投资建议
- 全局搜索覆盖功能、任务、项目、日志、问题、知识和阅读
- 顶部快速新建可进入任务、项目、日志、测试、问题、知识和收支入口
- 首页从统一 Workspace 读取项目、技能、工程日志、问题、知识和财务数据
- 视频内容与阅读笔记可进入知识库，内容可加入任务计划

## 数据闭环

```text
项目 -> 模块 -> 任务 -> 工程日志 -> 测试 -> 技术问题 -> 解决方案
                                                    |
                                                    v
知识条目 -> 技能证据 -> 技能成长 -> 报告 -> 简历素材
```

删除项目时只级联删除项目专属工程数据，不删除学习、阅读和财务记录。删除模块会保留关联实体并清空模块引用；删除问题会删除其解决方案，已生成知识仅清空来源引用。

## 完整页面

- `/` 工作台
- `/today` 今日任务
- `/learning` 学习中心
- `/reading` 阅读计划
- `/content` 视频与技术内容
- `/projects` 我的项目
- `/projects/[projectId]` 项目详情
- `/robomaster` RoboMaster 项目视图
- `/logs` 工程日志
- `/reviews` 测试与复盘
- `/knowledge` 知识库
- `/skills` 技能树
- `/reports` 报告中心
- `/resume` 简历素材
- `/calendar` 日历计划
- `/finance` 理财记录
- `/settings` 本地数据管理

`/assistant` 和 `/automation` 继续显示明确的功能建设中页面，不返回 404。

## 本地数据与迁移

Sprint 4.1 的持久化路径为 `Component → Hook → Service → Repository → LocalStorage Adapter`。Repository 方法采用 Promise 接口，客户端组件不直接调用 localStorage。当前仍只在本机浏览器保存数据；尚未接入 Prisma、PostgreSQL、GitHub 登录或跨设备同步。Repository 的具体契约与存储键见 [`repositories/README.md`](repositories/README.md)。

Sprint 4.3 将 `WorkspaceDomainState` v4 作为本地持久化源；现有页面继续使用 `WorkspaceData` v3 投影。Review、Academic、Timeline、Attachment 等新领域记录可随 v4 数据保存和备份；详见 [`types/README.md`](types/README.md) 与 [`lib/storage/README.md`](lib/storage/README.md)。未创建 Prisma Schema。

- 当前统一存储键：`cdc-workspace-data-v4`
- 内容中心兼容键：`cdc-content-state-v1`
- 旧键：`cdc-workspace-data-v3`、`cdc-workspace-data-v2`、`cdc-dashboard-task-state-v1`
- 加载时优先验证 v4；随后按 v3、v2、旧任务状态顺序迁移
- v3 全部集合保留；v4 项目默认私有，未知结构化字段保持空白
- v3 旧键保留作恢复副本；v2 只有在 v4 保存成功后才删除
- JSON 始终先按 `unknown` 解析，再由类型守卫验证
- 数据损坏时回退演示数据并显示恢复提示，不让页面崩溃
- localStorage 只在客户端 repository/provider 层访问，避免 hydration mismatch

设置页支持导出完整 schema v4 JSON、导入 v2/v3/v4 备份时先验证并预览数量、二次确认覆盖，以及恢复演示数据。文件名格式为 `cdc-workspace-backup-YYYY-MM-DD.json`。

## 目录结构

```text
app/                 页面与路由
components/          按 dashboard、projects、engineering、knowledge 等领域拆分
data/                独立演示数据
hooks/               Workspace 数据 Hook
lib/storage/         迁移、规范化和类型验证
repositories/        本地存储 Adapter、Repository 契约及演示数据读取
services/            领域服务、迁移、选择器和未来 API 边界
types/               独立领域类型
.github/workflows/   CI 工作流
```

## 安装与运行

要求 Node.js 20.9 或更高版本。

```powershell
npm.cmd install
npm.cmd run dev
```

访问 `http://127.0.0.1:3000`。PowerShell 禁止执行 `npm.ps1` 时直接使用 `npm.cmd`，无需修改系统执行策略。

质量检查和生产运行：

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run start
```

## CI

`.github/workflows/ci.yml` 在推送到 `main`、针对 `main` 的 Pull Request 和手动触发时执行 `npm ci`、lint、typecheck 和 production build。Workflow 使用 Node.js 20、`contents: read` 最小权限和分支 concurrency，不包含 secret 或部署步骤。

## 演示与安全说明

- 当前数据保存在浏览器本地，没有后端、数据库、账号或云同步
- 当前没有真实 AI API；报告和简历素材使用确定性本地规则生成
- 视频与技术内容为明确标识的演示数据，没有真实平台搜索、字幕下载或爬虫
- 不抓取需要登录、验证码或绕过反爬机制的平台
- 不读取或分析 `StandardRobotpp`
- 财务模块只做个人记录，不提供投资建议、交易或支付能力

## 版本记录

- Sprint 1：信息架构、全局布局、综合首页和技术内容中心
- Sprint 2：任务、学习、阅读 CRUD，统一本地计划数据和备份
- Sprint 3：统一工程与成长闭环、schema v3、日历、财务和全局检索

## 当前限制与 Sprint 4

- 全局搜索为本地内存检索，没有全文索引和结果定位高亮
- 日历当前不支持拖拽、重复规则和系统提醒
- 报告与简历素材不是 AI 生成，仍需人工校对
- 附件仅记录名称，没有二进制文件存储
- Sprint 4 可优先实现关系详情跳转、日历拖期与提醒、备份历史，并评估合规公开数据源和真实 AI 接入前的隐私、成本及失败降级方案
