import { SearchX, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  icon?: LucideIcon;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  icon: Icon = SearchX,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-500">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">{description}</p>
      {actionLabel && onAction && (
        <Button type="button" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
