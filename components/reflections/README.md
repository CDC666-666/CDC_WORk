# Reflections components

`ReflectionsCenter` 只处理交互和展示。读写经 `useReflections` 进入共享 Provider，再调用 `ReviewService` 和 `WorkspaceRepository`。编辑失败保留草稿，删除需要确认。项目详情与首页从同一 Provider 读取记录；导入和重置通过 Workspace 的 `domainRevision` 触发重新加载。
