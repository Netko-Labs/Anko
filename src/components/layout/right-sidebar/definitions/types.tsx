import type { ReactNode } from 'react'

export type TabId = 'data' | 'table' | 'utilities'

export interface TabButtonProps {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

export interface RightSidebarProps {
  children?: ReactNode
  className?: string
}
