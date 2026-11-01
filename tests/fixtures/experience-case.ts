/** Invented marker round-trip fixture. Its date, narrative and tags describe no real incident. */
export const syntheticCase = `# 合成案例：测试标记回读

**关键词：** 合成标记、回读校验。
**来源项目：** \`auto_aim\`。**历史事件：** 2000-01-01。

## 现象
合成测试界面未显示约定标记。
## 环境
仅供解析器测试的虚构环境。StandardRobotpp 当前 master@${"a".repeat(40)}；上位机 sp_vision_25/main@${"b".repeat(40)}。
## 排查过程
核对合成标记。
## 失败尝试
合成输入未补齐时直接重读，标记仍未出现。
## 原因
合成输入缺少约定标记。
## 解决办法
补齐合成标记并重新读取。
## 验证结果
- 合成反馈：标记按预期显示。
- **待确认：** 合成运行环境与标记映射。
## 适用条件
仅用于隔离合成测试。
## 不适用条件与不可照搬项
不得作为真实硬件排查结论。
## 来源
- 合成测试计划。
`;
