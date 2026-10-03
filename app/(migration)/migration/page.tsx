import type { Metadata } from "next";

import { BrowserMigrationTool } from "@/components/migration/browser-migration-tool";

export const metadata: Metadata = { title: "浏览器数据迁移", description: "预检查并核对浏览器数据迁入服务器的结果" };

export default function MigrationPage() {
  return <BrowserMigrationTool />;
}
