import { rpc } from 'mirinjs/rpc'
import type { WorkspaceConfig } from '../../../shared/rpc-types'
import {
  addWorkspaceConnection,
  createWorkspace,
  deleteWorkspace,
  getAppMeta,
  getWorkspaceSession,
  listWorkspaces,
  moveWorkspaceConnection,
  removeWorkspaceConnection,
  saveWorkspaceSession,
  setAppMeta,
  updateWorkspace,
} from '../../storage'

const ACTIVE_WORKSPACE_KEY = 'activeWorkspaceId'

/** Workspace CRUD, connection membership, and persisted session state. */
export function workspaceRoutes() {
  return {
    listWorkspaces: rpc.query(() => listWorkspaces()),
    createWorkspace: rpc.mutation(({ config }: { config: WorkspaceConfig }) =>
      createWorkspace(config),
    ),
    updateWorkspace: rpc.mutation(({ id, config }: { id: string; config: WorkspaceConfig }) =>
      updateWorkspace(id, config),
    ),
    deleteWorkspace: rpc.mutation(({ id }: { id: string }) => {
      deleteWorkspace(id)
    }),
    addConnectionToWorkspace: rpc.mutation(
      ({ workspaceId, connectionId }: { workspaceId: string; connectionId: string }) => {
        addWorkspaceConnection(workspaceId, connectionId)
      },
    ),
    removeConnectionFromWorkspace: rpc.mutation(
      ({ workspaceId, connectionId }: { workspaceId: string; connectionId: string }) => {
        removeWorkspaceConnection(workspaceId, connectionId)
      },
    ),
    moveConnectionBetweenWorkspaces: rpc.mutation(
      ({
        connectionId,
        fromWorkspaceId,
        toWorkspaceId,
      }: {
        connectionId: string
        fromWorkspaceId: string
        toWorkspaceId: string
      }) => {
        moveWorkspaceConnection(connectionId, fromWorkspaceId, toWorkspaceId)
      },
    ),

    // ---- Workspace sessions (persisted tabs + snapshot results) ----
    getWorkspaceSession: rpc.query(({ workspaceId }: { workspaceId: string }): string | null =>
      getWorkspaceSession(workspaceId),
    ),
    saveWorkspaceSession: rpc.mutation(
      ({ workspaceId, data }: { workspaceId: string; data: string }) => {
        saveWorkspaceSession(workspaceId, data)
      },
    ),
    getActiveWorkspaceId: rpc.query((): string | null => getAppMeta(ACTIVE_WORKSPACE_KEY)),
    setActiveWorkspaceId: rpc.mutation(({ workspaceId }: { workspaceId: string }) => {
      setAppMeta(ACTIVE_WORKSPACE_KEY, workspaceId)
    }),
  }
}
