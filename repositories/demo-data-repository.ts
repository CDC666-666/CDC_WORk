import { mockContentItems, technicalTags } from "@/data/mock-content";
import { mockDashboardData } from "@/data/mock-dashboard";
import { getModule, projectModules, workLogs } from "@/data/mock-data";

/** Read-only source for the remaining demonstration views. */
export const demoDataRepository = {
  readContentItems: () => mockContentItems,
  readTechnicalTags: () => technicalTags,
  readDashboard: () => mockDashboardData,
  readFocusModules: () => projectModules,
  readRecentWorkLogs: () => workLogs,
  readModule: getModule,
};
