import { rpc } from 'mirinjs/rpc'
import type { AppState } from '../state'
import { connectionRoutes } from './routes/connections'
import { dataRoutes } from './routes/data'
import { libraryRoutes } from './routes/library'
import { systemRoutes } from './routes/system'
import { workspaceRoutes } from './routes/workspaces'

/**
 * Anko's RPC surface as a mirin router. The frontend imports only the `Router`
 * type (see src/lib/rpc.ts); handlers run in the Bun worker. Handlers are
 * grouped by concern under `./routes/` and composed here — this file stays a
 * thin composition root.
 */
export function createRouter(state: AppState) {
  return rpc.router({
    ...connectionRoutes(state),
    ...dataRoutes(state),
    ...workspaceRoutes(),
    ...libraryRoutes(),
    ...systemRoutes(),
  })
}

export type Router = ReturnType<typeof createRouter>
