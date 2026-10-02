"use client";

import { useContext } from "react";
import { AcademicContext } from "@/components/providers/academic-provider";

export function useAcademic() {
  const context = useContext(AcademicContext);
  if (!context) throw new Error("useAcademic 必须在 AcademicProvider 中使用。");
  return context;
}
