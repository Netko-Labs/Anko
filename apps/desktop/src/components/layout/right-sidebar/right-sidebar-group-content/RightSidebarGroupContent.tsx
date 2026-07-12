import type * as React from 'react'
import { cn } from '@/lib/utils'

export function RightSidebarGroupContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('w-full text-xs', className)} {...props} />
}
