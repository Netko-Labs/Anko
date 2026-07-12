import type { ConnectionConfig } from '@anko/desktop-domain'
import {
  deleteConnection,
  listConnections,
  removeConnectionFromAllWorkspaces,
  saveConnection,
  updateConnection,
} from '@anko/desktop-repository'
import type { AppState } from '@anko/desktop-service'
import { rpc } from 'mirinjs/rpc'

/** Live-connection lifecycle plus persisted connection CRUD. */
export function connectionRoutes(state: AppState) {
  return {
    connectSavedConnection: rpc.mutation(async ({ id }: { id: string }) => state.connectSaved(id)),
    listActiveConnections: rpc.query(() => state.getActiveConnections()),
    disconnect: rpc.mutation(async ({ connectionId }: { connectionId: string }) => {
      await state.disconnect(connectionId)
    }),
    // Let the connector's error propagate (it throws a descriptive AppError).
    // Swallowing it into `false` made every failed test look like a success:
    // the caller (useConnectionForm.handleTest) only treats a *thrown* error as
    // a failure and ignores the return value, so `false` silently showed
    // "Connected". On success we resolve (the `true` is unused but harmless).
    testConnection: rpc.mutation(async ({ config }: { config: ConnectionConfig }) => {
      await state.testConnection(config)
      return true
    }),

    saveConnection: rpc.mutation(({ config }: { config: ConnectionConfig }) =>
      saveConnection(config),
    ),
    updateConnection: rpc.mutation(({ id, config }: { id: string; config: ConnectionConfig }) => {
      updateConnection(id, config)
    }),
    listConnections: rpc.query(() => listConnections()),
    deleteConnection: rpc.mutation(({ id }: { id: string }) => {
      removeConnectionFromAllWorkspaces(id)
      deleteConnection(id)
    }),
  }
}
