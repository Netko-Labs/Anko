"use client"

import { Separator } from "react-resizable-panels"
import { cn } from "@/lib/utils"
import type { ResizableHandleProps } from "./definitions"

export function ResizableHandle({
  withHandle: _withHandle,
  className,
  ...props
}: ResizableHandleProps) {
  return (
    <Separator
      data-slot="resizable-handle"
      className={cn(
        "bg-border shrink-0 focus-visible:ring-ring focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden hover:bg-muted transition-colors",
        className
      )}
      {...props}
    />
  )
}
