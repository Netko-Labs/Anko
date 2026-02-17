import type * as React from 'react'
import { cn } from '@/lib/utils'

export function RightSidebarGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div className={cn('relative flex w-full min-w-0 flex-col px-2 py-1', className)} {...props} />
  )
}
