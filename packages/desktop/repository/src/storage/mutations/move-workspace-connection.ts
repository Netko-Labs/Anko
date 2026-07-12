import { addWorkspaceConnection } from './add-workspace-connection'
import { removeWorkspaceConnection } from './remove-workspace-connection'

export function moveWorkspaceConnection(
  connectionId: string,
  fromWorkspaceId: string,
  toWorkspaceId: string,
): void {
  removeWorkspaceConnection(fromWorkspaceId, connectionId)
  addWorkspaceConnection(toWorkspaceId, connectionId)
}
