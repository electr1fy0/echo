"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import type React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  className,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & {
  size?: "default" | "sm" | "lg";
}): React.ReactElement {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-background align-middle font-medium text-xs",
        "size-8 data-[size=lg]:size-10 data-[size=sm]:size-6",
        className,
      )}
      data-size={size}
      data-slot="avatar"
      {...props}
    />
  );
}

export function AvatarImage({
  className,
  ...props
}: AvatarPrimitive.Image.Props): React.ReactElement {
  return (
    <AvatarPrimitive.Image
      className={cn("size-full object-cover", className)}
      data-slot="avatar-image"
      {...props}
    />
  );
}

export function AvatarFallback({
  className,
  ...props
}: AvatarPrimitive.Fallback.Props): React.ReactElement {
  return (
    <AvatarPrimitive.Fallback
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted",
        className,
      )}
      data-slot="avatar-fallback"
      {...props}
    />
  );
}

export function AvatarBadge({
  className,
  ...props
}: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full ring-2 select-none",
        "size-2.5 [&>svg]:size-2",
        className,
      )}
      data-slot="avatar-badge"
      {...props}
    />
  );
}

export function AvatarGroup({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "flex -space-x-2 *:data-[slot=avatar]:ring-background *:data-[slot=avatar]:ring-2 group/avatar-group",
        className,
      )}
      data-slot="avatar-group"
      {...props}
    />
  );
}

export function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground ring-background size-8 rounded-full text-sm relative flex shrink-0 items-center justify-center ring-2",
        className,
      )}
      data-slot="avatar-group-count"
      {...props}
    />
  );
}

export { AvatarPrimitive };
