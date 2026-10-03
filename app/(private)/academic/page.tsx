import type { Metadata } from "next";
import { AcademicCenter } from "@/components/academic/academic-center";

export const metadata: Metadata = { title: "课程管理", description: "学期、课程与作业管理" };
export default function AcademicPage() { return <AcademicCenter />; }
