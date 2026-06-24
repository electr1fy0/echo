"use client"
import * as React from "react"
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"
import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit]"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        data-slot="scroll-area-scrollbar"
        orientation="vertical"
        className={cn(
          "flex touch-none select-none transition-opacity duration-300",
          "h-full w-1.5",
          "data-hovering:opacity-100 data-scrolling:opacity-100",
          "opacity-0"
        )}
      >
        <ScrollAreaPrimitive.Thumb
          data-slot="scroll-area-thumb"
          className="relative flex-1 rounded-full bg-neutral-400/50 dark:bg-neutral-500/50"
        />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar
        data-slot="scroll-area-scrollbar"
        orientation="horizontal"
        className={cn(
          "flex touch-none select-none transition-opacity duration-300",
          "w-full h-1.5",
          "data-hovering:opacity-100 data-scrolling:opacity-100",
          "opacity-0"
        )}
      >
        <ScrollAreaPrimitive.Thumb
          data-slot="scroll-area-thumb"
          className="relative flex-1 rounded-full bg-neutral-400/50 dark:bg-neutral-500/50"
        />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner
        data-slot="scroll-area-corner"
        className="bg-neutral-400/50 dark:bg-neutral-500/50"
      />
    </ScrollAreaPrimitive.Root>
  )
}

export { ScrollArea }
