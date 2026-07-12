import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { UnderConstruction } from "@/components/shared/under-construction";
import {
  getNavigationItemBySection,
  placeholderSections,
} from "@/lib/navigation";

interface SectionPageProps {
  params: Promise<{ section: string }>;
}

export function generateStaticParams() {
  return placeholderSections.map((section) => ({ section }));
}

export async function generateMetadata({ params }: SectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const item = getNavigationItemBySection(section);

  return {
    title: item?.label ?? "功能建设中",
    description: item?.description ?? "CDC AI Workspace 功能模块",
  };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const item = getNavigationItemBySection(section);

  if (!item || !placeholderSections.includes(section)) {
    notFound();
  }

  return <UnderConstruction item={item} />;
}
