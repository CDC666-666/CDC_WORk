# 工程经验管理与受限导入

## 数据位置与接口

`/experiences` 使用私人 `Knowledge` 记录，`itemType=工程经验`，结构化字段放在 `payload.experience`。私有页面和 `/api/private/*` 均检查 GitHub 准入、会话与 Workspace 归属。读取使用 `/api/private/workspace`，写入使用 `/api/private/entities/knowledge`。

结构化字段包括现象、环境、版本、排查过程、失败尝试、原因、处理、验证、来源、适用条件、限制及待确认项。`reviewStatus` 与 `evidenceStatus` 独立；审核通过不会提高证据等级。

`Knowledge.id` 是稳定实体标识，`version` 用于并发检查。共享来源的 `sourceKey` 与 `sourceRevision` 用于幂等和来源漂移识别，不能把来源原文或指纹作为公开验收资料。

## 受限导入

现有工具只接受代码预配置的单个本地来源，不支持任意路径或目录扫描。本说明不包含该来源的内容或其实际入库情况。

```powershell
npm.cmd run import:experience -- --workspace-id=<目标工作区ID>
npm.cmd run import:experience -- --workspace-id=<目标工作区ID> --execute
```

第一条为预览，第二条才写入配置的数据库。执行前必须独立确认目标库和 Workspace 归属，不能把配置或测试用户当作生产授权。该命令不属于文档清理流程。

导入按稳定 ID 检查重复，已存在记录返回 `already_exists`；来源改变时报告 `sourceChanged`，不会覆盖服务器编辑。导入的默认审核/证据值由代码定义，不表示任何私人记录当前的状态。

预览也可能输出标题、实体 ID、来源摘要和状态；原始输出只能保存在私人目录，不能复制到 GitHub。

## 编辑、关系与导航

- PATCH 省略项目字段表示保留；明确空值表示清除项目索引、payload 与 `relationRefs`。
- 详情由 URL `record` 驱动，支持搜索直达、同页切换及浏览器前进/后退；不存在的 ID 显示明确提示。
- 过期版本返回 409；界面要求重读，不静默覆盖。
- 长文弹窗使用受限高度与正文滚动，桌面和窄屏都需验证关闭、编辑按钮可见。

## 合成测试与验证边界

测试样例见 `tests/fixtures/experience-case.ts`，明确为合成材料。数据库和浏览器套件应使用独立测试库及临时用户，不加载私人快照。

应覆盖创建/编辑/重读、搜索筛选、审核与证据独立、重复导入、来源改变不覆盖、项目清除、版本冲突、详情导航和窄屏长文。合成会话验证不等于真实 OAuth 或生产验收；公开报告只记录测试类别和通过情况。

NextAuth logger 仅输出受限代码和网络类别；不要复制原始提供者响应或回调日志。认证配置见 [OAuth 说明](oauth-local.md)，派生检索见 [多项目快照](engineering-experience-multi-snapshot.md)。
