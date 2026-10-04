"use client";

import { useContext } from "react";

import { ServerWorkspaceContext } from "@/components/providers/server-workspace-provider";

export function useWorkspaceData() {
  const context = useContext(ServerWorkspaceContext);
  if (!context) {
    throw new Error("useWorkspaceData must be used inside ServerWorkspaceProvider");
  }
  return context;
}

