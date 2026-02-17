import { IconEggs } from '@tabler/icons-react'
import { DEFAULT_WORKSPACE_ICON, WORKSPACE_ICONS } from '@/components/workspace/definitions'
import { type WorkspaceIconProps } from '../definitions'

export function WorkspaceIcon({ icon, className }: WorkspaceIconProps) {
  const IconComponent = WORKSPACE_ICONS[icon] || WORKSPACE_ICONS[DEFAULT_WORKSPACE_ICON] || IconEggs

  return <IconComponent className={className ?? 'size-4'} />
}
