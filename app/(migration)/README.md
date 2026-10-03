# 独立迁移布局

`/migration` 只继承无数据副作用的根布局，并在服务端调用 `getPrivateWorkspace` 校验身份。它不挂载 WorkspaceDataProvider、AcademicProvider、ReflectionsProvider 或 AppShell。未登录时跳转到带 `callbackUrl=/migration` 的登录页；中间件对无 Cookie 的请求也保留这个回跳地址。迁移页由用户点击后才读取六个原始键。
