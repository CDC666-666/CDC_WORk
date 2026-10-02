import type { Metadata } from "next";
import { AcademicCourseDetail } from "@/components/academic/academic-course-detail";

export const metadata: Metadata = { title: "课程详情", description: "章节、课堂、作业和考试记录" };
export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  return <AcademicCourseDetail courseId={courseId} />;
}
