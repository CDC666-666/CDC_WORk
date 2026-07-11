# RM 工程工作台

面向 RoboMaster 机器人竞赛学生的个人 AI 工程工作台。项目用于集中管理机器人项目、任务、工程日志、测试记录、问题复盘、技术栈与报告素材。

当前版本为 **Sprint 0：项目初始化**。本阶段只提供工作台首页、响应式导航、类型定义与本地模拟数据，不包含真实 AI、登录、后端服务或数据库。

## 技术栈

- Next.js 15（App Router）
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui 组件结构
- Lucide React 图标
- ESLint
- 本地 TypeScript 模拟数据

## 目录结构

```text
CDC_WORK/
├─ app/
│  ├─ globals.css              # 全局主题、Tailwind 与工程化视觉样式
│  ├─ layout.tsx               # App Router 根布局与页面元信息
│  └─ page.tsx                 # 工作台首页入口
├─ components/
│  ├─ dashboard/               # 首页各独立业务区域
│  ├─ layout/                  # 应用外壳、左侧导航与顶部状态栏
│  └─ ui/                      # shadcn/ui 风格基础组件
├─ data/
│  └─ mock-data.ts             # RoboMaster 场景模拟数据
├─ lib/
│  └─ utils.ts                 # 通用样式合并工具
├─ types/
│  └─ index.ts                 # 项目领域 TypeScript 类型
├─ components.json             # shadcn/ui 配置
├─ tailwind.config.ts          # Tailwind 配置
├─ eslint.config.mjs           # ESLint 配置
└─ package.json                # 依赖与脚本
```

## 安装与运行

环境要求：Node.js 20.9 或更高版本、npm。

```bash
npm install
npm run dev
```

开发服务器默认地址：`http://localhost:3000`。

代码检查和生产构建：

```bash
npm run lint
npm run build
npm run start
```

如果 Windows PowerShell 因执行策略拦截 `npm.ps1`，可使用等价命令 `npm.cmd install`、`npm.cmd run dev`、`npm.cmd run lint` 和 `npm.cmd run build`，无需修改系统执行策略。

## 当前已完成功能

- 深色、桌面优先且支持基本移动端适配的工程 Dashboard
- 可折叠移动端侧栏与桌面固定导航
- 顶部本地模式、模拟数据、日期与时间状态栏
- 用户欢迎信息与当前项目总览
- 今日任务与完成进度
- 本周开发时长、任务、测试与问题闭环数据
- 电机控制、超级电容、力控底盘、自瞄算法、测试复盘模块进度
- 最近工程日志与技能成长视图
- AI 工程助手快捷输入界面占位，不接入真实模型
- `UserProfile`、`Project`、`ProjectModule`、`Task`、`WorkLog`、`TechnicalIssue`、`Skill` 类型及对应模拟数据

## 下一阶段计划

- 建立项目、任务、日志、测试记录和问题复盘的独立页面
- 增加本地数据编辑与持久化方案
- 完善模块详情、测试数据曲线和故障闭环流程
- 增加日报、周报、项目报告与简历素材模板
- 评估只读接入机器人代码仓库的索引与分析边界
- 在明确数据安全与调用配置后，再规划真实 AI 能力

## Sprint 0 边界

- 未接入 `StandardRobotpp` 或任何本地代码仓库
- 未写死仓库绝对路径
- 未接入 AI API
- 未实现登录、数据库服务器或后端接口
- 未实现导航中后续模块的业务页面
