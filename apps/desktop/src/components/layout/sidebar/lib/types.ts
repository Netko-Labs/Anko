import type { ActiveConnection } from '@anko/desktop-domain'

export interface SidebarProps {
  onConnectionSelect: (connection: ActiveConnection) => void
}
