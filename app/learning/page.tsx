import type { Metadata } from "next";

import { LearningCenter } from "@/components/learning/learning-center";

export const metadata: Metadata = { title: "学习中心", description: "课程、技术与项目学习计划" };

export default function LearningPage() { return <LearningCenter />; }

