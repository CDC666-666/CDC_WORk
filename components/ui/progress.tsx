import * as React from "react";

import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  indicatorClassName?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => {
    const normalizedValue = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalizedValue}
        className={cn(
          "relative h-1.5 w-full overflow-hidden rounded-sm bg-secondary",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full bg-primary transition-[width] duration-500",
            indicatorClassName,
          )}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
