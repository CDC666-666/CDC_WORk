# 个人展示站第一版（本地预览）

核对日期：2026-10-11。开发目录：`D:/Workplace/CDC_WORK_PORTFOLIO`，分支 `codex/portfolio-v1`，从 Draft PR #12 的 `c4d00deb1d88dc20d1c18884a1fbc4ec8f95c627` 建立。该提交的 `quality`、`compose` 均通过；它包含服务器备份与依赖修复，但服务器当前 Web 镜像实际由更早的 `795f7cdab1c539a4c633cf915c73dd0f9f34d56c` 构建。此展示站分支未部署。`CDC_WORK_MAIN` 的既有本地修改保持不动。

## 路由与公开边界

- 本地入口：`http://localhost:3100/portfolio`，项目 `/portfolio/projects`、详情 `/portfolio/projects/[slug]`、时间线 `/portfolio/timeline`、关于 `/portfolio/about`。端口 3100 避开当前 3000 的 SSH 隧道。
- `/`、`/login` 和已有私人路由仍属工作台；`middleware.ts` 仅放行 `/portfolio` 路径，私人 layout 和 API 继续做数据库会话校验。公开路由不读取 Workspace、个人数据库、共享调试案例原文、账号或会话。
- 公开内容仅从 [`data/public-portfolio.ts`](../data/public-portfolio.ts) 中人工整理的结构化字段读取；类型在 [`types/public-portfolio.ts`](../types/public-portfolio.ts)。第一版没有 CMS 或从私人工作台自动发布。未来发布功能须经过字段白名单、内容审核和显式批准。
- GitHub 主页是 `https://github.com/CDC666-666`。工作台源码仓库已核对为公开，可在该项目详情放链接；自瞄上位机仓库为私有，机械臂公开仓库未核实，因此不生成这两个项目的仓库链接。

## 内容证据与待补

| 项目或节点 | 当前表述依据 | 公开边界 |
|---|---|---|
| RoboMaster 全向轮步兵电控 | `D:/Workplace/auto_aim/PROJECT_CONTEXT.md` 与维护手册的系统架构、2026-10-07 版本核对 | 只给概要和排查方法，不展示原始日志、硬件参数、截图或实车性能结论；运行版本仍需核对 |
| 三轴机械臂与达妙电机控制 | 用户本轮提供的项目名称及方向 | 职责、方案、日期、实验结果、图片与仓库链接均标为待补，不放入时间线 |
| 个人工作台 | 本仓库源码及项目背景，2026-10-09 主分支整合与 2026-10-11 隧道验收记录 | 只描述功能范围和验证边界，不读取或展示私人记录、真实案例正文、服务器地址与账号资料 |
| 成长节点 | 上述项目背景中的 2026-10-07、09、11 记录 | 是有文档日期的技术节点，不代表比赛成绩或学历时间线 |

双螺旋管道及热泵 Fluent 仿真不属于本版公开展示范围。真实照片、机械臂测试资料、学校/学历细节、简历、邮箱均未提供；页面使用自绘示意图，未放置无效附件或下载入口。

## GitHub 贡献图

GitHub 官方 GraphQL `user.contributionsCollection.contributionCalendar` 返回逐日数据。服务端可选 `PORTFOLIO_GITHUB_PUBLIC_TOKEN`，只用于调用官方 API，按小时缓存；浏览器只收到渲染后的数据，不收到令牌。读取前要求 `restrictedContributionsCount === 0`，响应结构异常、超时或无凭据时只显示 GitHub 链接及简短状态，不制造贡献数。配置时使用独立、仅可读取公开资料且没有 `read:user`/私有仓库权限的凭据，不复用私人工作台 OAuth 会话或数据库里的 Account 令牌。

2026-10-11 本机曾使用当前 GitHub CLI 的已登录会话只读查询该字段，返回 365 天与 0 条受限贡献；这验证 API 可达，不表示未来服务器已经配置专用凭据。日历最多每小时刷新一次，是准实时而非逐秒更新。GitHub 文档：[GraphQL 认证](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql)、[贡献日历字段](https://docs.github.com/en/graphql/reference/users#contributioncalendar)、[速率限制](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)。

## 域名预案（未启用）

未来 `cdc666.cn` 对应公开展示站首页与项目路由，`work.cdc666.cn` 对应已有私人工作台及其登录和私有 API。当前同一 Next.js 应用只在 `/portfolio` 暴露公开内容；公网切换时还需在反向代理或独立站点配置主域名的公开根路径映射，并拒绝主域名访问私人页面与 API。必须先完成备案、DNS、HTTPS、专用 OAuth 与公网安全验收。本轮不配置 Caddy、不更改 OAuth、不开放 80/443。

## 本地验收

2026-10-11 在本 worktree 独立运行 `npm ci`、`npm run db:generate`、`npm run lint`、`npm run typecheck`、`npm test`（47/47）和 `npm run build`，均通过。构建路由表含四类公开页面与三个项目详情；原有私人页面和 API 路由仍在。浏览器通过本机 Chrome 检查 1440px 与 390px 两种视口共 14 次公开路由加载，均为 200、无横向溢出；项目方向/状态筛选、时间线筛选与空状态、详情打开和浏览器返回均通过。未登录访问 `/experiences` 跳转登录，私人 Workspace API 返回 401。页面 HTML 未出现已排除项目；实测在有本机临时服务端凭据时显示 GitHub 官方真实日历，生产构建的截图不含开发角标。

本地截图留在 Git 忽略的 `.local-preview/`：`home-1440.png`、`home-390.png`、`detail-390.png`，另有首屏视口截图。没有任何真实个人案例或令牌进入截图。另以独立 3101 端口、**无 GitHub 凭据**启动同一生产构建：首页返回 200，显示明确降级文案、不显示伪造贡献数；该临时进程已停止。远端错误注入未专项验收。真实私人 OAuth 登录及服务器数据库增删改查已在 PR #12 的提交版隧道验收中通过，但展示站本地进程尚未再次以真实 OAuth 验收；不要把旧镜像的验收算作本分支完整认证回归。
