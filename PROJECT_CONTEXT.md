# 项目背景与版本边界

核对日期：2026-10-31。此次清理起点为远端 `main@8dc9128d6f3a683adc8b07d5f615bcd051648639`；证据为 GitHub PR API、提交比较及独立 checkout 的源码。这里仅记录公开工程状态，不记录私人 Workspace 的内容、数量、状态、时间、ID 或指纹。

## 主线与未整合分支

| 对象 | 核对结果 |
| --- | --- |
| PR #3～#9 | 已通过 [整合 PR #10](https://github.com/CDC666-666/CDC_WORk/pull/10) 进入 main；#4～#9 因 head 已被包含而关闭，无需重复合并 |
| PR #11～#14 | 已合并；#14 的合并提交是本次 main 基线 |
| `codex/private-workspace-release@1ae8a58` | 相对上述 main 分叉，ahead 2 / behind 2，未建立独立 PR；私人界面、资料与搜索改动尚未全数进入 main |
| `codex/finance-calendar-release@c997822` | 相对上述 main 分叉，ahead 5 / behind 2，未建立独立 PR；包含后续日历、理财及界面改动 |

上述 ahead/behind 是核对时的提交关系，不能直接当成功能差异数量。后续业务整合需单独审查；此次不合入发布分支。核对时现有 PR 均已关闭，随后创建的隐私清理 PR 单独交付。

## 当前实现

main 包含服务器 Workspace、GitHub 数字 ID 准入、私有页面/API、完整领域模型、显式旧数据迁移、工程经验和手动只读快照。公开作品集与私人工作台的数据来源分开，公开统计仅返回聚合。模块范围见 [服务器覆盖](docs/sprint-5-2b-server-workspace.md)。

工程经验复用 `Knowledge`，审核与证据状态独立。日常实体使用版本化事务和工作区关系检查；日期和时间戳的协议见 [接口说明](app/api/private/README.md)。

## 部署与本机边界

main 合并不等于生产版本切换。历史发布分支包含生产发布记录，但本轮未连接服务器，不能据此宣布当前镜像、数据库或真实登录已复验。部署与恢复的一般流程见 [部署说明](docs/public-deployment.md) 和 [备份操作](docs/server-backup-operations.md)。

本次从远端 main 创建独立清理 checkout，保留原开发目录及未提交内容。不使用原工作区的环境文件、数据库、浏览器会话或快照运行清理检查。

## 公开文档规则

公开仓库保留源码、通用说明、合成测试和获准公开的展示资料。私人运行记录及验收清单留在受限、被忽略的位置；去除正文后仍可能泄露内容的标题、标签、计数和指纹同样不能公开。

本次修改 Markdown、Git/Docker 忽略规则、可编辑 PR 描述，并将既有测试材料改为独立虚构的标记回读场景，同步调整搜索及来源漂移断言；不修改业务逻辑。历史提交、旧分支、旧 PR 差异与已有克隆不会因此消失，残留范围见 [隐私说明](docs/privacy-boundary.md)。
