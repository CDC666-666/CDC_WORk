# 总结与复盘

`/reflections` 管理每日、每周、每月和项目复盘。它使用 `Review` 集合，与工程测试页 `/reviews` 及报告中心的数据分离。日常页面通过 `useReflections` → 共享服务器 Workspace Provider → 私有 API 访问 PostgreSQL；写入完成后重新读取聚合状态。旧浏览器记录仅通过独立迁移入口处理。

周总结存周一，月总结存每月一日；所有日期为本地 `YYYY-MM-DD`，不转换为 UTC。项目复盘必须关联现有项目；删除复盘时保留附件约束。
