"use client"
import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { cn } from "@/lib/utils"

interface CheckboxProps extends CheckboxPrimitive.Root.Props {
  variant?: "default" | "destructive"
}

function Checkbox({
  className,
  variant = "default",
  ...props
}: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-variant={variant}
      className={cn(
        "peer group/checkbox inline-flex items-center justify-center size-4 shrink-0 rounded border transition-all duration-150 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring",
        "data-disabled:cursor-not-allowed data-disabled:opacity-50",
        "border-input data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground",
        variant === "destructive" &&
          "data-checked:border-destructive data-checked:bg-destructive data-checked:text-destructive-foreground",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center size-full data-unchecked:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          className="size-3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
