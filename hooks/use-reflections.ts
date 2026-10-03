"use client";

import { useContext } from "react";
import { ReflectionsContext } from "@/components/providers/reflections-provider";

export function useReflections() {
  const context = useContext(ReflectionsContext);
  if (!context) throw new Error("useReflections 必须在 ReflectionsProvider 中使用。");
  return context;
}
