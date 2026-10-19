# 迁移页浏览器回归

`npm run test:browser` 使用 Playwright Chromium 和隔离数据库会话。旧迁移路由用例现在检查认证后跳转到设置页，并确认浏览器存储不被改写。测试仅用合成账户与记录，不读取用户真实业务数据。CI 使用固定 Playwright Chromium；本机已有 Chrome 时可设置 `TEST_BROWSER_CHANNEL=chrome` 运行。

工程经验新增两个合成会话回归：项目关联从浏览器表单清除后，检查 PATCH JSON、PostgreSQL 索引列、payload、关系引用、刷新和原项目删除；详情导航检查全局搜索、同页 A/B 参数切换、关闭后重开、前进/后退、缺失 ID 与 390px 布局。测试会话不表示真实 GitHub OAuth 登录通过。
