import type { Metadata } from "next"; import { RobomasterDashboard } from "@/components/robomaster/robomaster-dashboard";
export const metadata: Metadata = { title: "RoboMaster" };
export default function RobomasterPage() { return <RobomasterDashboard />; }

