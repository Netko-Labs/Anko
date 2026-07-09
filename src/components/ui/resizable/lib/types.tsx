import type * as React from 'react'
import type { Separator } from 'react-resizable-panels'

export type ResizableHandleProps = React.ComponentProps<typeof Separator> & {
  withHandle?: boolean
}
