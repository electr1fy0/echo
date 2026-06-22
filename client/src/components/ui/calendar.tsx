"use client"
import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      data-slot="calendar"
      className={cn("w-fit", className)}
      classNames={{
        month: "space-y-3",
        nav: "flex items-center justify-between",
        button_previous:
          "flex items-center justify-center size-7 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer [&_svg]:size-4 [&_svg]:text-current",
        button_next:
          "flex items-center justify-center size-7 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer [&_svg]:size-4 [&_svg]:text-current",
        weekday: "text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 w-9 text-center",
        day: "size-9 text-sm rounded-lg text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer",
        day_button: "size-full flex items-center justify-center",
        selected:
          "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-900 dark:hover:bg-neutral-100 font-semibold",
        today: "after:content-[''] after:block after:h-0.5 after:w-3 after:mx-auto after:rounded-full after:bg-neutral-900 dark:after:bg-neutral-100 mt-0.5",
        outside: "text-neutral-300 dark:text-neutral-600",
        disabled: "opacity-40 pointer-events-none",
        ...classNames,
      }}
      {...props}
    />
  )
}

export { Calendar }
