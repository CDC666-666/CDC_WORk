import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PortfolioShell } from "@/components/portfolio/portfolio-shell";

import "./portfolio.css";

export const metadata: Metadata = {
  title: { default: "Caider / CDC666", template: "%s" },
};

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PortfolioShell>{children}</PortfolioShell>;
}
