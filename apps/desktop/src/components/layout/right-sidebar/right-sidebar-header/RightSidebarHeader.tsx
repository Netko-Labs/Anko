import type * as React from 'react'
import { cn } from '@/lib/utils'

export function RightSidebarHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex flex-col gap-2 p-2', className)} {...props} />
}
