"use client"

import type * as React from "react"
import { Panel } from "react-resizable-panels"

export function ResizablePanel({
  ...props
}: React.ComponentProps<typeof Panel>) {
  return <Panel data-slot="resizable-panel" {...props} />
}
