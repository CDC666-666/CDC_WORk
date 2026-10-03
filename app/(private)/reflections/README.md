# 总结与复盘

`/reflections` 管理每日、每周、每月和项目复盘。它使用 `Review` 集合，与工程测试页 `/reviews` 及报告中心的数据分离。页面通过 `useReflections` → `ReviewService` → `WorkspaceRepository` 访问 localStorage v4。导入备份和重置演示数据后，Provider 根据 `domainRevision` 重新加载。

周总结存周一，月总结存每月一日；所有日期为本地 `YYYY-MM-DD`，不转换为 UTC。项目复盘必须关联现有项目。正常备份导入继续检查关联，删除复盘时保留附件约束。
