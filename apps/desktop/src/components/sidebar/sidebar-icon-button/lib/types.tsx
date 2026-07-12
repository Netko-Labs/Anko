import type * as React from 'react'

export interface SidebarIconButtonProps {
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
  isActive?: boolean
  onClick?: () => void
}
