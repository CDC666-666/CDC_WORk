import type { LucideIcon } from "lucide-react";

import { CardHeader, CardTitle } from "@/components/ui/card";

interface PanelHeaderProps {
  index: string;
  title: string;
  icon: LucideIcon;
  trailing?: React.ReactNode;
}

export function PanelHeader({
  index,
  title,
  icon: Icon,
  trailing,
}: PanelHeaderProps) {
  return (
    <CardHeader className="flex-row items-center justify-between gap-3 border-b border-border px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-cyan-300" />
        <div className="min-w-0">
          <p className="font-mono text-[9px] text-muted-foreground">{index}</p>
          <CardTitle className="truncate">{title}</CardTitle>
        </div>
      </div>
      {trailing}
    </CardHeader>
  );
}
