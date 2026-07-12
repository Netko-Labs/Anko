import type { ActiveConnection, ConnectionInfo, Workspace } from '@anko/desktop-domain'

export interface DatabasesPanelProps {
  workspaces: Workspace[]
  activeWorkspace?: Workspace
  onNewConnection: () => void
  onEditConnection: (connection: ConnectionInfo) => void
  onConnectionSelect?: (connection: ActiveConnection) => void
}

export interface DisconnectedConnectionProps {
  connection: ConnectionInfo
  isConnecting: boolean
  onConnect: () => void
  onEdit: () => void
  onDelete: () => void
}
