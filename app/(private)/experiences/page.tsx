import type { Metadata } from "next";
import { EngineeringExperienceCenter } from "@/components/knowledge/engineering-experience-center";

export const metadata: Metadata = { title: "工程经验" };

export default function ExperiencesPage() {
  return <EngineeringExperienceCenter />;
}
