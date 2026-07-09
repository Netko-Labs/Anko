import { rpc } from 'mirinjs/rpc'
import type { ConnectionConfig } from '../../../shared/rpc-types'
import type { AppState } from '../../state'
import {
  deleteConnection,
  getConnectionConfig,
  listConnections,
  removeConnectionFromAllWorkspaces,
  saveConnection,
  updateConnection,
} from '../../storage'

/** Live-connection lifecycle plus persisted connection CRUD. */
export function connectionRoutes(state: AppState) {
  return {
    connect: rpc.mutation(async ({ config }: { config: ConnectionConfig }) =>
      state.connect(config),
    ),
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
    getConnectionConfig: rpc.query(({ id }: { id: string }) => getConnectionConfig(id)),
  }
}
