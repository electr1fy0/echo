"use client"
import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

function parseDateTime(val: string): Date | null {
  if (!val) return null
  const d = new Date(val)
  return isValid(d) ? d : null
}

function formatDateTimeIndian(date: Date): string {
  return format(date, "dd/MM/yyyy, h:mm a")
}

function strToTime(val: string): { hours: number; minutes: number } | null {
  const parsed = parse(val, "h:mm a", new Date())
  if (!isValid(parsed)) return null
  return {
    hours: parsed.getHours(),
    minutes: parsed.getMinutes(),
  }
}

export function DateTimePicker({ value, onChange, placeholder, className }: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const date = parseDateTime(value)

  const [timeStr, setTimeStr] = React.useState(date ? format(date, "h:mm a") : "")

  React.useEffect(() => {
    if (date) {
      setTimeStr(format(date, "h:mm a"))
    }
  }, [value])

  const handleDateSelect = (selected: Date | undefined) => {
    if (!selected) return
    const existing = parseDateTime(value)
    const hours = existing ? existing.getHours() : 12
    const minutes = existing ? existing.getMinutes() : 0
    selected.setHours(hours, minutes, 0, 0)
    onChange(selected.toISOString())
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeStr(newTime)
  }

  const applyTime = () => {
    const existing = parseDateTime(value)
    if (!existing) {
      const now = new Date()
      const parsed = strToTime(timeStr)
      if (parsed) {
        now.setHours(parsed.hours, parsed.minutes, 0, 0)
        onChange(now.toISOString())
      }
      return
    }
    const parsed = strToTime(timeStr)
    if (parsed) {
      existing.setHours(parsed.hours, parsed.minutes, 0, 0)
      onChange(existing.toISOString())
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "h-7 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background px-2 text-neutral-700 dark:text-neutral-300 focus:outline-none cursor-pointer flex items-center gap-1.5",
          !date && "text-neutral-400",
          className,
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-3.5 shrink-0">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="truncate">
          {date ? formatDateTimeIndian(date) : (placeholder || "Pick a date & time")}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-fit p-3 space-y-3">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={handleDateSelect}
        />
        <div className="flex items-center gap-2 border-t border-neutral-200 dark:border-neutral-800 pt-3">
          <input
            type="text"
            placeholder="h:mm AM/PM"
            value={timeStr}
            onChange={handleTimeChange}
            onBlur={applyTime}
            onKeyDown={(e) => { if (e.key === "Enter") applyTime(); }}
            className="h-7 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-background px-2 text-neutral-700 dark:text-neutral-300 focus:outline-none w-24"
          />
          <span className="text-[10px] text-neutral-400">(e.g. 4:48 PM)</span>
        </div>
        <div className="flex justify-end">
          <PopoverClose
            className="h-7 px-3 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Done
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  )
}
