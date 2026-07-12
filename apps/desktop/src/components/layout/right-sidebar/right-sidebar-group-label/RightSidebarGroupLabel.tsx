import type * as React from 'react'
import { cn } from '@/lib/utils'

export function RightSidebarGroupLabel({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex h-8 shrink-0 items-center rounded-md px-2 text-xs text-sidebar-foreground/70',
        className,
      )}
      {...props}
    />
  )
}
