import type { Workspace } from '@/types'

export interface SettingsMenuProps {
  theme: 'light' | 'dark' | 'system'
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void
}

export interface WorkspaceSwitcherProps {
  workspaces: Workspace[]
  activeWorkspace?: Workspace
  activeWorkspaceId?: string | null
  onWorkspaceSelect: (workspaceId: string) => void
  onNewWorkspace: () => void
  onEditWorkspace?: (workspace: Workspace) => void
  onDeleteWorkspace?: (workspace: Workspace) => void
}

export interface WorkspaceIconProps {
  icon: string
  className?: string
}
