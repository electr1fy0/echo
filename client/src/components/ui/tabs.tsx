import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  selected: string;
  onSelect: (id: string) => void;
}

export function Tabs({ tabs, selected, onSelect }: TabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl overflow-x-auto scrollbar-none">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer",
            selected === tab.id
              ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-sm"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded-full",
              selected === tab.id
                ? "bg-neutral-200 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300"
                : "bg-neutral-200/60 dark:bg-neutral-700/60 text-neutral-500 dark:text-neutral-400"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
