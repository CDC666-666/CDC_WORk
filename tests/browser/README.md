# 迁移页浏览器回归

`npm run test:browser` 使用 Playwright Chromium 和临时数据库会话，直接打开独立迁移页。测试在 v2、v3、无效 v4、空存储四种原始来源下比较六个 localStorage 键的原文，并记录是否有 set/remove/clear 调用；检查读取、服务器预览、未登录回跳以及 390px 和桌面宽度。所有数据均为测试夹具，不会读取或上传用户真实浏览器数据。CI 使用固定 Playwright Chromium；本机已有 Chrome 时可设置 `TEST_BROWSER_CHANNEL=chrome` 运行同一测试。

工程经验新增两个合成会话回归：项目关联从浏览器表单清除后，检查 PATCH JSON、PostgreSQL 索引列、payload、关系引用、刷新和原项目删除；详情导航检查全局搜索、同页 A/B 参数切换、关闭后重开、前进/后退、缺失 ID 与 390px 布局。测试会话不表示真实 GitHub OAuth 登录通过。
