import type { Metadata } from "next";

import { PersonalSettings } from "@/components/settings/personal-settings";

export const metadata: Metadata = { title: "设置", description: "个人资料与工作台标识" };

export default function SettingsPage() { return <PersonalSettings />; }

