# 迁移页浏览器回归

`npm run test:browser` 使用 Playwright Chromium 和临时数据库会话，直接打开独立迁移页。测试在 v2、v3、无效 v4、空存储四种原始来源下比较六个 localStorage 键的原文，并记录是否有 set/remove/clear 调用；检查读取、服务器预览、未登录回跳以及 390px 和桌面宽度。所有数据均为测试夹具，不会读取或上传用户真实浏览器数据。CI 使用固定 Playwright Chromium；本机已有 Chrome 时可设置 `TEST_BROWSER_CHANNEL=chrome` 运行同一测试。
