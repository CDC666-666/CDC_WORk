"use client";

import { useContext } from "react";

import { WorkspaceDataContext } from "@/components/providers/workspace-data-provider";

export function useWorkspaceData() {
  const context = useContext(WorkspaceDataContext);
  if (!context) {
    throw new Error("useWorkspaceData must be used inside WorkspaceDataProvider");
  }
  return context;
}

