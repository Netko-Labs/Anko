import type { MouseEvent, ReactNode } from 'react'

export interface TreeNodeProps {
  label: string
  secondaryLabel?: string
  icon?: ReactNode
  rightIcon?: ReactNode
  isExpanded?: boolean
  isExpandable?: boolean
  isLoading?: boolean
  isActive?: boolean
  level?: number
  onClick?: () => void
  onDoubleClick?: () => void
  onContextMenu?: (e: MouseEvent) => void
  children?: ReactNode
  className?: string
}
