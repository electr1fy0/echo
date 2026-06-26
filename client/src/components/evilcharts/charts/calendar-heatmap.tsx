"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";

type CalendarHeatmapProps = {
  data: { date: string; count: number }[];
  months?: number;
};

function getIntensity(count: number, maxCount: number): number {
  if (count <= 0 || maxCount <= 0) return 0;
  const normalized = count / maxCount;
  if (normalized <= 0.25) return 1;
  if (normalized <= 0.5) return 2;
  if (normalized <= 0.75) return 3;
  return 4;
}

export function CalendarHeatmap({ data, months = 12 }: CalendarHeatmapProps) {
  const weeks = useMemo(() => {
    const countByDate = new Map(data.map((d) => [d.date, d.count]));
    const allCounts = data.map((d) => d.count);
    const maxCount = Math.max(...allCounts, 1);

    const today = new Date();
    const start = new Date(today);
    start.setMonth(start.getMonth() - months);
    start.setDate(start.getDate() - start.getDay());

    const result: { date: string; count: number; intensity: number }[][] = [];
    let week: { date: string; count: number; intensity: number }[] = [];
    const cursor = new Date(start);
    while (cursor <= today || week.length > 0) {
      const dateStr = cursor.toISOString().split("T")[0];
      const count = cursor <= today ? (countByDate.get(dateStr) ?? 0) : 0;
      week.push({ date: dateStr, count, intensity: getIntensity(count, maxCount) });
      if (week.length === 7) {
        result.push(week);
        week = [];
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [data, months]);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                className={cn(
                  "size-3 rounded-sm",
                  day.intensity === 0 && "bg-neutral-100 dark:bg-neutral-800",
                  day.intensity === 1 && "bg-blue-200 dark:bg-blue-900/40",
                  day.intensity === 2 && "bg-blue-400 dark:bg-blue-700/60",
                  day.intensity === 3 && "bg-blue-600 dark:bg-blue-500/80",
                  day.intensity === 4 && "bg-blue-800 dark:bg-blue-400",
                )}
                title={`${day.date}: ${day.count} events`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
