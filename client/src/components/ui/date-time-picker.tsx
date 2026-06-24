"use client";
import * as React from "react";
import { format, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverPopup,
  PopoverTrigger,
  PopoverClose,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  WheelPicker,
  WheelPickerWrapper,
  type WheelPickerOption,
} from "@/components/wheel-picker";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

function parseDateTime(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isValid(d) ? d : null;
}

function hasTime(val: string): boolean {
  if (!val) return false;
  const d = new Date(val);
  return (
    isValid(d) &&
    !(
      d.getHours() === 0 &&
      d.getMinutes() === 0 &&
      d.getSeconds() === 0 &&
      d.getMilliseconds() === 0
    )
  );
}

const createArray = (length: number, add = 0): WheelPickerOption<number>[] =>
  Array.from({ length }, (_, i) => {
    const value = i + add;
    return {
      label: value.toString().padStart(2, "0"),
      value,
    };
  });

const hourOptions = createArray(12, 1);
const minuteOptions = createArray(60);
const meridiemOptions: WheelPickerOption[] = [
  { label: "AM", value: "AM" },
  { label: "PM", value: "PM" },
];

function formatDisplay(date: Date, includeTime: boolean): string {
  if (includeTime) return format(date, "dd/MM/yyyy, h:mm a");
  return format(date, "dd/MM/yyyy");
}

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const date = parseDateTime(value);
  const includeTime = hasTime(value);

  const hour12 = date ? date.getHours() % 12 || 12 : 9;
  const minuteVal = date ? date.getMinutes() : 0;
  const meridiemVal = date ? (date.getHours() >= 12 ? "PM" : "AM") : "AM";

  const [selHour, setSelHour] = React.useState(hour12);
  const [selMin, setSelMin] = React.useState(minuteVal);
  const [selMer, setSelMer] = React.useState<string>(meridiemVal);

  const [viewMode, setViewMode] = React.useState<"date" | "time">("date");

  const lastCommittedRef = React.useRef(value);
  React.useEffect(() => {
    if (value !== lastCommittedRef.current && date) {
      setSelHour(date.getHours() % 12 || 12);
      setSelMin(date.getMinutes());
      setSelMer(date.getHours() >= 12 ? "PM" : "AM");
    }
  }, [value]);

  const commitTime = React.useCallback(
    (h: number, m: number, mer: string) => {
      if (!includeTime) return;
      const base = parseDateTime(value) || new Date();
      let h24 = h;
      if (mer === "PM" && h !== 12) h24 += 12;
      if (mer === "AM" && h === 12) h24 = 0;
      base.setHours(h24, m, 0, 0);
      const result = base.toISOString();
      lastCommittedRef.current = result;
      onChange(result);
    },
    [value, onChange, includeTime],
  );

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return;
    const existing = parseDateTime(value);
    if (existing && includeTime) {
      selected.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
    } else {
      selected.setHours(0, 0, 0, 0);
    }
    const result = selected.toISOString();
    lastCommittedRef.current = result;
    onChange(result);
  };

  const toggleTimeEnabled = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (includeTime) {
      const existing = parseDateTime(value);
      if (!existing) return;
      existing.setHours(0, 0, 0, 0);
      const result = existing.toISOString();
      lastCommittedRef.current = result;
      onChange(result);
    } else {
      const base = parseDateTime(value) || new Date();
      let h24 = selHour;
      if (selMer === "PM" && selHour !== 12) h24 += 12;
      if (selMer === "AM" && selHour === 12) h24 = 0;
      base.setHours(h24, selMin, 0, 0);
      const result = base.toISOString();
      lastCommittedRef.current = result;
      onChange(result);
    }
  };

  const currentView = includeTime ? viewMode : "date";

  const displayText = date ? formatDisplay(date, includeTime) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "h-7 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background px-2 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer flex items-center gap-1.5",
          !date && "text-neutral-400",
          className,
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5 shrink-0"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="truncate">
          {displayText || placeholder || "Pick a date & time"}
        </span>
      </PopoverTrigger>
      <PopoverPopup className="w-[300px] p-3 space-y-3">
        <div className="h-[290px] flex items-center justify-center">
          {currentView === "date" ? (
            <Calendar
              mode="single"
              selected={date || undefined}
              onSelect={handleDateSelect}
            />
          ) : (
            <WheelPickerWrapper className="w-56">
              <WheelPicker
                options={hourOptions}
                value={selHour}
                onValueChange={(v) => {
                  setSelHour(v);
                  commitTime(v, selMin, selMer);
                }}
                infinite
              />
              <WheelPicker
                options={minuteOptions}
                value={selMin}
                onValueChange={(v) => {
                  setSelMin(v);
                  commitTime(selHour, v, selMer);
                }}
                infinite
              />
              <WheelPicker
                options={meridiemOptions}
                value={selMer}
                onValueChange={(v) => {
                  setSelMer(v);
                  commitTime(selHour, selMin, v);
                }}
              />
            </WheelPickerWrapper>
          )}
        </div>
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 flex items-center justify-between">
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setViewMode(currentView === "date" ? "time" : "date");
            }}
            className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer select-none"
          >
            {currentView === "date" ? "Pick time" : "Pick date"}
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-400">
              <span className="text-[11px] font-semibold text-neutral-400">
                Time
              </span>
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={toggleTimeEnabled}
              className={cn(
                "relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                includeTime
                  ? "bg-[var(--brand)]"
                  : "bg-neutral-300 dark:bg-neutral-600",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-3 rounded-full bg-white shadow ring-0 transition-transform",
                  includeTime ? "translate-x-3" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <PopoverClose className="h-7 px-3 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer">
            Done
          </PopoverClose>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
