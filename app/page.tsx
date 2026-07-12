import { Dashboard } from "@/components/dashboard/dashboard";
import { getDashboardData } from "@/services/dashboard-service";

export default async function Home() {
  const data = await getDashboardData();
  return <Dashboard data={data} />;
}
