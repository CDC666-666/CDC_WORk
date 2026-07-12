# CDC AI Workspace

面向大学生和工程学习者的个人 AI 工作台，用于统一管理课程学习、每日任务、阅读计划、技术内容、个人项目、技能成长、知识沉淀、报告素材和简单收支记录。

当前版本为 **Sprint 1**。RoboMaster 是项目研发中的一级业务模块之一，不是整个产品的唯一定位。

## 技术栈

- Next.js 15（App Router）
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui 风格基础组件
- Lucide Icons
- ESLint
- 本地模拟数据与 localStorage 状态

## Sprint 1 已完成

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
│  └─ ui/                      # 基础 UI 组件
├─ data/                       # 独立模拟数据
├─ services/                   # 未来 API 接入边界
├─ types/                      # 领域 TypeScript 类型
├─ lib/                        # 导航、筛选和通用工具
└─ AGENTS.md                   # 长期开发规则
```

## 页面路由

完整页面：

- `/`：工作台
- `/content`：视频与技术内容

Sprint 1 建设中页面：

- `/assistant`
- `/today`
- `/learning`
- `/reading`
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
- `/settings`

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
npm run build
npm run start
```

Windows PowerShell 如果拦截 `npm.ps1`，使用：

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

无需修改系统执行策略。

## 当前限制

- 没有真实 AI API
- 没有真实平台内容搜索或抓取
- 没有登录、后端或数据库
- 没有读取 `StandardRobotpp`
- 财务模块仅预留简单收支记录，不提供投资建议
- 除首页和内容中心外，其余业务页面暂为建设中状态

## Sprint 2 建议

1. 完成今日任务、学习中心和阅读计划的本地 CRUD。
2. 建立知识条目、来源引用和内容摘要之间的数据关系。
3. 实现项目详情、工程日志和测试复盘闭环。
4. 增加数据导入导出与本地备份。
5. 评估公开 API、RSS、用户主动提交链接等合规数据源。
6. 设计真实 AI 接入前的隐私、成本、提示词和失败降级方案。
