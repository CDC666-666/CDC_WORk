export type AnalyticsStatus = "ok" | "not_configured" | "error";
export type AnalyticsPeriod = 7 | 30 | 90;

export interface PortfolioAnalytics {
  status: "ok";
  period: AnalyticsPeriod;
  totals: { visitors: number; views: number; todayVisitors: number; todayViews: number };
  trend: { date: string; visitors: number; views: number }[];
  popular: { path: string; title: string; views: number }[];
  devices: { label: string; count: number }[];
  browsers: { label: string; count: number }[];
  sources: { label: string; count: number }[];
  heatmap: { weekday: number; hour: number; views: number }[];
  refreshedAt: string;
  lastVisitAt: string | null;
}

export type PortfolioAnalyticsResponse = PortfolioAnalytics | { status: "not_configured" | "error"; message: string };
