# 迁移服务

`preflight.ts` 是无副作用的原始来源解析器；`registry.ts` 是 28 个集合到数据库表和结构化字段的白名单；`migration-service.ts` 执行服务器预览、幂等写入、冲突检测和事务核对；`request.ts` 限制请求体为 20 MiB。服务器 API 负责校验会话和 Origin。

金额在 PostgreSQL 中使用 Decimal(20,2)，来源 JSON 中只接受最多两位小数且绝对分值不超过 JavaScript 安全整数上限的有限数字；日期字段以本地 `YYYY-MM-DD` 写入 SQL `date`，时间戳保留原文或使用 UTC ISO 8601。完整原始负载仍在 `payload` 中。
