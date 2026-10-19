export interface WorkspaceBranding {
  displayName: string;
  bio: string;
  avatar: string | null;
  workspaceName: string;
  workspaceSubtitle: string;
  workspaceIcon: string | null;
}

export const defaultBranding: WorkspaceBranding = {
  displayName: "CDC",
  bio: "个人学习与工程实践",
  avatar: null,
  workspaceName: "CDC AI Workspace",
  workspaceSubtitle: "个人学习与工程工作台",
  workspaceIcon: null,
};
