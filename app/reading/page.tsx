import type { Metadata } from "next";

import { ReadingCenter } from "@/components/reading/reading-center";

export const metadata: Metadata = { title: "阅读计划", description: "个人书架、阅读进度与笔记" };

export default function ReadingPage() { return <ReadingCenter />; }

