"use client"

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"
import { cn } from "@/lib/utils"

function PreviewCard({ ...props }: PreviewCardPrimitive.Root.Props) {
  return <PreviewCardPrimitive.Root {...props} />
}

function PreviewCardTrigger({ ...props }: PreviewCardPrimitive.Trigger.Props) {
  return <PreviewCardPrimitive.Trigger {...props} />
}

function PreviewCardPortal({ ...props }: PreviewCardPrimitive.Portal.Props) {
  return <PreviewCardPrimitive.Portal {...props} />
}

function PreviewCardPositioner({ className, ...props }: PreviewCardPrimitive.Positioner.Props) {
  return (
    <PreviewCardPrimitive.Positioner
      className={cn("z-50 outline-none", className)}
      {...props}
    />
  )
}

function PreviewCardPopup({
  className,
  children,
  side,
  align,
  sideOffset = 8,
  ...props
}: PreviewCardPrimitive.Popup.Props & {
  side?: PreviewCardPrimitive.Positioner.Props["side"];
  align?: PreviewCardPrimitive.Positioner.Props["align"];
  sideOffset?: PreviewCardPrimitive.Positioner.Props["sideOffset"];
}) {
  return (
    <PreviewCardPortal>
      <PreviewCardPositioner side={side} align={align} sideOffset={sideOffset}>
        <PreviewCardPrimitive.Popup
          className={cn(
            "bg-background data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 ring-foreground/5 rounded-xl p-0 text-sm ring-1 duration-100 outline-none overflow-hidden",
            className
          )}
          {...props}
        >
          {children}
        </PreviewCardPrimitive.Popup>
      </PreviewCardPositioner>
    </PreviewCardPortal>
  )
}

export { PreviewCard, PreviewCardTrigger, PreviewCardPopup }
