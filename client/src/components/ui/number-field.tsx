"use client";

import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field";
import { Minus, Plus } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

function NumberField({
  className,
  ...props
}: NumberFieldPrimitive.Root.Props): React.ReactElement {
  return (
    <NumberFieldPrimitive.Root
      className={cn("group/number-field", className)}
      {...props}
    />
  );
}

const NumberFieldGroup = React.forwardRef<
  HTMLDivElement,
  NumberFieldPrimitive.Group.Props
>(function NumberFieldGroup({ className, ...props }, ref) {
  return (
    <NumberFieldPrimitive.Group
      ref={ref}
      className={cn(
        "relative inline-flex h-9 w-full items-center overflow-hidden rounded-lg border border-input bg-background text-base shadow-xs ring-ring/24 transition-shadow has-focus-visible:border-ring has-focus-visible:ring-[3px] sm:text-sm dark:bg-input/32",
        "has-data-[slot=number-field-increment]:pe-9 has-data-[slot=number-field-decrement]:ps-9",
        className,
      )}
      data-slot="number-field-group"
      {...props}
    />
  );
});

const NumberFieldInput = React.forwardRef<
  HTMLInputElement,
  NumberFieldPrimitive.Input.Props
>(function NumberFieldInput({ className, ...props }, ref) {
  return (
    <NumberFieldPrimitive.Input
      ref={ref}
      className={cn(
        "h-full w-full min-w-0 appearance-none bg-transparent px-3 text-center text-base outline-none [transition:background-color_5000000s_ease-in-out_0s] placeholder:text-muted-foreground/72 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none sm:text-sm",
        className,
      )}
      data-slot="number-field-input"
      {...props}
    />
  );
});

const NumberFieldDecrement = React.forwardRef<
  HTMLButtonElement,
  NumberFieldPrimitive.Decrement.Props
>(function NumberFieldDecrement({ className, ...props }, ref) {
  return (
    <NumberFieldPrimitive.Decrement
      ref={ref}
      className={cn(
        "absolute start-0 top-0 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-s-lg border-e border-input text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground has-focus-visible:z-10 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24 disabled:pointer-events-none disabled:opacity-64",
        className,
      )}
      data-slot="number-field-decrement"
      {...props}
    >
      <Minus className="size-4" />
    </NumberFieldPrimitive.Decrement>
  );
});

const NumberFieldIncrement = React.forwardRef<
  HTMLButtonElement,
  NumberFieldPrimitive.Increment.Props
>(function NumberFieldIncrement({ className, ...props }, ref) {
  return (
    <NumberFieldPrimitive.Increment
      ref={ref}
      className={cn(
        "absolute end-0 top-0 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-e-lg border-s border-input text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground has-focus-visible:z-10 has-focus-visible:ring-[3px] has-focus-visible:ring-ring/24 disabled:pointer-events-none disabled:opacity-64",
        className,
      )}
      data-slot="number-field-increment"
      {...props}
    >
      <Plus className="size-4" />
    </NumberFieldPrimitive.Increment>
  );
});

const NumberFieldScrubArea = React.forwardRef<
  HTMLDivElement,
  NumberFieldPrimitive.ScrubArea.Props & { label?: string }
>(function NumberFieldScrubArea({ className, label, ...props }, ref) {
  return (
    <NumberFieldPrimitive.ScrubArea
      ref={ref}
      className={cn(
        "mb-1 flex h-6 cursor-ew-resize select-none items-center justify-center gap-1 rounded-md bg-accent/40 px-2 text-[11px] text-muted-foreground transition-colors hover:bg-accent/60 active:bg-accent",
        className,
      )}
      data-slot="number-field-scrub-area"
      {...props}
    >
      {label && <span>{label}</span>}
    </NumberFieldPrimitive.ScrubArea>
  );
});

const NumberFieldScrubAreaCursor = NumberFieldPrimitive.ScrubAreaCursor;

NumberField.Group = NumberFieldGroup;
NumberField.Input = NumberFieldInput;
NumberField.Decrement = NumberFieldDecrement;
NumberField.Increment = NumberFieldIncrement;
NumberField.ScrubArea = NumberFieldScrubArea;
NumberField.ScrubAreaCursor = NumberFieldScrubAreaCursor;

export {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldScrubArea,
  NumberFieldScrubAreaCursor,
  NumberFieldPrimitive,
};
