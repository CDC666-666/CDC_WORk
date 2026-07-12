# CDC AI Workspace

面向大学生和工程学习者的个人 AI 工作台，用于统一管理课程学习、每日任务、阅读计划、技术内容、个人项目、技能成长、知识沉淀、报告素材和简单收支记录。

当前版本为 **Sprint 2: Personal Planning Data Loop**。RoboMaster 是项目研发中的一级业务模块之一，不是整个产品的唯一定位。

## 技术栈

- Next.js 15（App Router）
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui 风格基础组件
- Lucide Icons
- ESLint
- React Context + useReducer 统一状态
- 带版本验证、迁移与备份的 localStorage 数据层

## Sprint 2 已完成

Sprint 2 将今日任务、学习中心和阅读计划从展示页面升级为可持续使用的本地个人管理系统：

- 统一 Workspace 数据模型：任务、学习计划、学习记录、阅读条目和版本元数据
- `/today`：任务新增、编辑、删除、复制、完成恢复、筛选、排序和快速新增
- `/learning`：学习计划 CRUD、进度更新、学习记录与时长自动累计
- `/reading`：书架/列表视图、书籍 CRUD、页数快捷更新、笔记、搜索筛选和完成建议
- 首页任务、学习时长、阅读数量与三个业务页面实时同步
- 视频内容“加入学习计划”会创建可追踪、可去重的内容学习任务
- `/settings`：JSON 导出、导入预览与验证、二次确认恢复演示数据
- 从 `cdc-dashboard-task-state-v1` 自动迁移已完成任务 ID
- 统一 loading、空状态、错误反馈、Dialog 与删除确认交互
- GitHub Actions CI：lint、typecheck 和 production build

## Sprint 1 版本记录

- 默认浅色个人 AI Dashboard 与预留深色主题变量
- 固定、可折叠的桌面侧栏和移动端抽屉导航
- 顶部全局搜索、日期状态、快速新建和用户入口
- 分组信息架构：总览、学习成长、项目研发、个人管理、系统
- 综合工作台首页：
  - 欢迎区与三个今日重点
  - 今日概览指标
  - 可勾选并持久化的今日任务
  - 课程、阅读和阶段目标
  - RoboMaster 与 CDC AI Workspace 项目进度
  - 最近内容与技能成长
  - 不连接真实模型的 AI 快捷输入
- “视频与技术内容”中心：
  - 10 条覆盖机器人、嵌入式、控制、视觉和软件方向的演示内容
  - 搜索、来源、类型、时间、方向、标签和状态筛选
  - 相关度、发布时间、推荐指数和学习时长排序
  - 卡片与列表视图
  - 收藏、待看、完成、知识库和学习计划状态
  - localStorage 持久化收藏和处理状态
  - AI 技术总结详情 Dialog
  - 筛选空状态和一键清除
- 其余导航均有“功能建设中”路由，不会进入 404
- 全局 loading、error 和 not-found 状态
- 项目长期开发规则 `AGENTS.md`

## 演示数据说明

- 视频与技术内容当前全部使用模拟数据。
- 作者名称明确标记为“演示作者”或“演示维护者”。
- 原始链接使用 `example.com` 安全占位地址。
- 当前尚未实现 Bilibili、抖音、CSDN、GitHub 或技术博客的真实平台搜索。
- 当前没有字幕下载、爬虫、登录、数据库或真实 AI 模型调用。
- 后续只会接入合规、无需绕过登录/验证码/反爬机制的数据源，并在完成隐私和调用配置后接入 AI 总结能力。

## 目录结构

```text
CDC_WORK/
├─ app/
│  ├─ page.tsx                 # 综合工作台首页
│  ├─ content/page.tsx         # 视频与技术内容中心
│  ├─ today/page.tsx           # 今日任务 CRUD
│  ├─ learning/page.tsx        # 学习计划与学习记录
│  ├─ reading/page.tsx         # 阅读计划与书架
│  ├─ settings/page.tsx        # 本地数据管理
│  ├─ [section]/page.tsx       # 统一建设中页面
│  ├─ layout.tsx               # 全局应用壳层
│  ├─ loading.tsx              # 全局加载状态
│  ├─ error.tsx                # 全局错误状态
│  └─ not-found.tsx            # 404 状态
├─ components/
│  ├─ content/                 # 内容中心筛选、卡片、Dialog 和交互
│  ├─ dashboard/               # 综合首页业务组件
│  ├─ layout/                  # 侧栏、顶部栏和全局反馈
│  ├─ shared/                  # 页面标题、空状态和建设中页面
│  ├─ providers/               # 统一 Workspace Provider
│  └─ ui/                      # 基础 UI 组件
├─ data/                       # 独立模拟数据
├─ hooks/                      # Workspace 数据 hook
├─ services/                   # 未来 API 接入边界
├─ types/                      # 领域 TypeScript 类型
├─ lib/storage/                # 存储、迁移和 unknown 类型验证
├─ .github/workflows/ci.yml    # GitHub Actions 质量检查
└─ AGENTS.md                   # 长期开发规则
```

## 页面路由

完整页面：

- `/`：工作台
- `/content`：视频与技术内容
- `/today`：今日任务
- `/learning`：学习中心
- `/reading`：阅读计划
- `/settings`：本地数据管理

建设中页面：

- `/assistant`
- `/knowledge`
- `/skills`
- `/projects`
- `/robomaster`
- `/logs`
- `/reviews`
- `/calendar`
- `/reports`
- `/resume`
- `/finance`
- `/automation`

## 本地数据与迁移

- 统一存储键：`cdc-workspace-data-v2`
- 内容中心独立状态键：`cdc-content-state-v1`，Sprint 2 保持兼容
- 首次加载优先验证 Workspace v2；无数据时使用演示数据初始化
- 检测到旧键 `cdc-dashboard-task-state-v1` 时，会把对应任务迁移为“已完成”
- 只有新结构成功写入后才删除旧键
- JSON 损坏或结构不受支持时不会导致页面崩溃，而是恢复演示数据并显示提示
- localStorage 仅在客户端 Provider 和 repository 层访问，避免 hydration mismatch

在“设置”页面可以导出 `cdc-workspace-backup-YYYY-MM-DD.json`。导入时先按 `unknown` 解析并通过类型守卫验证，展示任务、学习计划和书籍数量，用户确认后才覆盖本地数据。

## 安装与运行

环境要求：Node.js 20.9 或更高版本、npm。

```bash
npm install
npm run dev
```

浏览器访问：`http://127.0.0.1:3000`

检查与生产构建：

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

Windows PowerShell 如果拦截 `npm.ps1`，使用：

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

无需修改系统执行策略。

## 当前限制

- 没有真实 AI API
- 没有真实平台内容搜索或抓取
- 没有登录、后端或数据库
- 没有读取 `StandardRobotpp`
- 财务模块仅预留简单收支记录，不提供投资建议
- 本地数据仅保存在当前浏览器，没有账号、后端或云同步
- 视频内容仍为演示数据，没有真实平台搜索
- AI 快捷输入仍为前端模拟响应，没有真实 AI API
- 除首页、内容中心、今日任务、学习中心、阅读计划和设置外，其余业务页面暂为建设中状态

## GitHub Actions CI

`.github/workflows/ci.yml` 在推送到 `main`、针对 `main` 的 Pull Request 和手动触发时运行：

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`

Workflow 使用 Node.js 20、最小 `contents: read` 权限和按分支取消旧运行的 concurrency，不包含 secret 或部署步骤。

## Sprint 3 建议

1. 实现日历计划与任务拖期、重复任务和提醒规则。
2. 建立知识条目、来源引用和内容摘要之间的数据关系。
3. 实现项目详情、工程日志和测试复盘的最小闭环。
4. 为本地数据增加 schema v3 增量迁移和备份历史。
5. 评估公开 API、RSS、用户主动提交链接等合规数据源。
6. 设计真实 AI 接入前的隐私、成本、提示词和失败降级方案。
