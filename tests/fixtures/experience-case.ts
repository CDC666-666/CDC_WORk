/** Synthetic fixture: the private shared-memory case body is never copied into Git. */
export const syntheticCase = `# 测试案例

**关键词：** 初始化、机械对齐。
**来源项目：** \`auto_aim\`。**历史事件：** 2026-10-06。

## 现象
切换模式后转动。
## 环境
测试环境。StandardRobotpp 当前 master@${"a".repeat(40)}；上位机 sp_vision_25/main@${"b".repeat(40)}。
## 排查过程
核对模式。
## 失败尝试
未记录。
## 原因
历史现场反馈。
## 解决办法
纠正机械对齐。
## 验证结果
- 历史反馈：故障消失。
- **待确认：** 部署固件与同步日志。
## 适用条件
存在初始化模式。
## 不适用条件与不可照搬项
稳定自瞄时不适用。
## 来源
- 维护手册。
`;
