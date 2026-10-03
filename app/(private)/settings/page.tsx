import type { Metadata } from "next";

import { LocalDataSettings } from "@/components/settings/local-data-settings";

export const metadata: Metadata = { title: "设置", description: "本地数据导入、导出与恢复" };

export default function SettingsPage() { return <LocalDataSettings />; }

