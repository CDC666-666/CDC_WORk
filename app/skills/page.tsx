import type { Metadata } from "next"; import { SkillCenter } from "@/components/skills/skill-center";
export const metadata: Metadata = { title: "技能树" }; export default function SkillsPage() { return <SkillCenter />; }

