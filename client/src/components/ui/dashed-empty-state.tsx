import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6",
        className,
      )}
    >
      {icon && <div className="mb-3 text-neutral-300 dark:text-neutral-600">{icon}</div>}
      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-[200px]">
        {title}
      </p>
      {description && (
        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 max-w-[240px]">
          {description}
        </p>
      )}
      {children}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { EmptyState as DashedEmptyState };
