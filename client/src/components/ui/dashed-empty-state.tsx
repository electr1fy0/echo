import { cn } from "@/lib/utils";

interface DashedEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function DashedEmptyState({
  icon,
  title,
  description,
  action,
  className,
  children,
}: DashedEmptyStateProps) {
  return (
    <div
      className={cn(
        "border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-neutral-50/50 dark:bg-neutral-900/50",
        className,
      )}
    >
      {icon && <div className="mb-4 text-neutral-400">{icon}</div>}
      <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs text-neutral-500 max-w-xs mx-auto mb-4">
          {description}
        </p>
      )}
      {children}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
