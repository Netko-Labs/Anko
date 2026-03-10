import { Electroview } from 'electrobun/view'
import type {
  AddQueryHistoryInput,
  ColumnDetail,
  ConnectionConfig,
  ConnectionInfo,
  CreateSavedQueryInput,
  QueryHistoryEntry,
  QueryResult,
  SavedQuery,
  SchemaInfo,
  TableInfo,
  UpdateSavedQueryInput,
  Workspace,
  WorkspaceConfig,
} from '@/types'
import { rpcLogger } from './debug'
import type { AnkoRPC } from '@/shared/rpc-types'

const rpc = Electroview.defineRPC<AnkoRPC>({
  maxRequestTime: 60_000,
  handlers: {
    requests: {},
    messages: {},
  },
})

// Initialize the transport (WebSocket connection to bun process)
new Electroview({ rpc })

/**
 * Tracked request wrapper that logs command name, params, and duration.
 */
async function trackedRequest<T>(command: string, fn: () => Promise<T> | T): Promise<T> {
  const startTime = performance.now()
  rpcLogger.debug(`Invoking: ${command}`)

  try {
    const result = await fn()
    const duration = Math.round(performance.now() - startTime)
    rpcLogger.info(`${command} completed in ${duration}ms`)
    return result
  } catch (error) {
    const duration = Math.round(performance.now() - startTime)
    rpcLogger.error(`${command} failed after ${duration}ms:`, error)
    throw error
  }
}

// Connection commands
export async function connect(config: ConnectionConfig): Promise<string> {
  return trackedRequest('connect', () => rpc.request.connect({ config }))
}

export async function disconnect(connectionId: string): Promise<void> {
  return trackedRequest('disconnect', () => rpc.request.disconnect({ connectionId }))
}

export async function testConnection(config: ConnectionConfig): Promise<boolean> {
  return trackedRequest('testConnection', () => rpc.request.testConnection({ config }))
}

// Query commands
export async function executeQuery(
  connectionId: string,
  query: string,
  database?: string,
  context?: string,
): Promise<QueryResult> {
  return trackedRequest('executeQuery', () =>
    rpc.request.executeQuery({ connectionId, query, database, context }),
  )
}

// Schema commands
export async function getDatabases(connectionId: string): Promise<SchemaInfo[]> {
  const result = await trackedRequest('getDatabases', () =>
    rpc.request.getDatabases({ connectionId }),
  )
  rpcLogger.debug(
    `getDatabases returned ${result.length} databases:`,
    result.map((d: SchemaInfo) => d.name),
  )
  return result
}

export async function getSchemas(connectionId: string, database: string): Promise<SchemaInfo[]> {
  const result = await trackedRequest('getSchemas', () =>
    rpc.request.getSchemas({ connectionId, database }),
  )
  rpcLogger.debug(
    `getSchemas returned ${result.length} schemas for ${database}:`,
    result.map((s: SchemaInfo) => s.name),
  )
  return result
}

export async function getTables(
  connectionId: string,
  database: string,
  schema: string,
): Promise<TableInfo[]> {
  const result = await trackedRequest('getTables', () =>
    rpc.request.getTables({ connectionId, database, schema }),
  )
  rpcLogger.debug(
    `getTables returned ${result.length} tables for ${database}.${schema}:`,
    result.map((t: TableInfo) => t.name),
  )
  return result
}

export async function getColumns(
  connectionId: string,
  database: string,
  schema: string,
  table: string,
): Promise<ColumnDetail[]> {
  const result = await trackedRequest('getColumns', () =>
    rpc.request.getColumns({ connectionId, database, schema, table }),
  )
  rpcLogger.debug(
    `getColumns returned ${result.length} columns for ${database}.${schema}.${table}:`,
    result.map((c: ColumnDetail) => c.name),
  )
  return result
}

// Storage commands
export async function saveConnection(config: ConnectionConfig): Promise<ConnectionInfo> {
  return trackedRequest('saveConnection', () => rpc.request.saveConnection({ config }))
}

export async function updateConnection(id: string, config: ConnectionConfig): Promise<void> {
  return trackedRequest('updateConnection', () => rpc.request.updateConnection({ id, config }))
}

export async function listConnections(): Promise<ConnectionInfo[]> {
  return trackedRequest('listConnections', () => rpc.request.listConnections({}))
}

export async function deleteConnection(id: string): Promise<void> {
  return trackedRequest('deleteConnection', () => rpc.request.deleteConnection({ id }))
}

export async function getConnectionConfig(id: string): Promise<ConnectionConfig> {
  return trackedRequest('getConnectionConfig', () => rpc.request.getConnectionConfig({ id }))
}

// Workspace commands
export async function listWorkspaces(): Promise<Workspace[]> {
  return trackedRequest('listWorkspaces', () => rpc.request.listWorkspaces({}))
}

export async function createWorkspace(config: WorkspaceConfig): Promise<Workspace> {
  return trackedRequest('createWorkspace', () => rpc.request.createWorkspace({ config }))
}

export async function updateWorkspace(id: string, config: WorkspaceConfig): Promise<Workspace> {
  return trackedRequest('updateWorkspace', () => rpc.request.updateWorkspace({ id, config }))
}

export async function deleteWorkspace(id: string): Promise<void> {
  return trackedRequest('deleteWorkspace', () => rpc.request.deleteWorkspace({ id }))
}

export async function addConnectionToWorkspace(
  workspaceId: string,
  connectionId: string,
): Promise<void> {
  return trackedRequest('addConnectionToWorkspace', () =>
    rpc.request.addConnectionToWorkspace({ workspaceId, connectionId }),
  )
}

export async function removeConnectionFromWorkspace(
  workspaceId: string,
  connectionId: string,
): Promise<void> {
  return trackedRequest('removeConnectionFromWorkspace', () =>
    rpc.request.removeConnectionFromWorkspace({ workspaceId, connectionId }),
  )
}

export async function moveConnectionBetweenWorkspaces(
  connectionId: string,
  fromWorkspaceId: string,
  toWorkspaceId: string,
): Promise<void> {
  return trackedRequest('moveConnectionBetweenWorkspaces', () =>
    rpc.request.moveConnectionBetweenWorkspaces({ connectionId, fromWorkspaceId, toWorkspaceId }),
  )
}

// Query History commands
export async function addQueryHistory(input: AddQueryHistoryInput): Promise<QueryHistoryEntry> {
  return trackedRequest('addQueryHistory', () => rpc.request.addQueryHistory({ input }))
}

export async function listQueryHistory(
  connectionId?: string,
  limit?: number,
): Promise<QueryHistoryEntry[]> {
  return trackedRequest('listQueryHistory', () =>
    rpc.request.listQueryHistory({ connectionId, limit }),
  )
}

export async function deleteQueryHistory(id: string): Promise<void> {
  return trackedRequest('deleteQueryHistory', () => rpc.request.deleteQueryHistory({ id }))
}

export async function clearQueryHistory(): Promise<void> {
  return trackedRequest('clearQueryHistory', () => rpc.request.clearQueryHistory({}))
}

// Saved Queries commands
export async function createSavedQuery(input: CreateSavedQueryInput): Promise<SavedQuery> {
  return trackedRequest('createSavedQuery', () => rpc.request.createSavedQuery({ input }))
}

export async function listSavedQueries(workspaceId?: string): Promise<SavedQuery[]> {
  return trackedRequest('listSavedQueries', () =>
    rpc.request.listSavedQueries({ workspaceId }),
  )
}

export async function updateSavedQuery(
  id: string,
  input: UpdateSavedQueryInput,
): Promise<SavedQuery> {
  return trackedRequest('updateSavedQuery', () =>
    rpc.request.updateSavedQuery({ id, input }),
  )
}

export async function deleteSavedQuery(id: string): Promise<void> {
  return trackedRequest('deleteSavedQuery', () => rpc.request.deleteSavedQuery({ id }))
}

// Dev tools commands
export async function clearAllData(): Promise<void> {
  return trackedRequest('clearAllData', () => rpc.request.clearAllData({}))
}

// Utility commands
export async function getAppVersion(): Promise<string> {
  return trackedRequest('getAppVersion', () => rpc.request.getAppVersion({}))
}

export async function showSaveDialog(
  defaultPath?: string,
  filters?: Array<{ name: string; extensions: string[] }>,
): Promise<string | null> {
  return trackedRequest('showSaveDialog', () =>
    rpc.request.showSaveDialog({ defaultPath, filters }),
  )
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  return trackedRequest('writeTextFile', () => rpc.request.writeTextFile({ path, content }))
}

export async function closeWindow(): Promise<void> {
  return trackedRequest('closeWindow', () => rpc.request.closeWindow({}))
}

export async function minimizeWindow(): Promise<void> {
  return trackedRequest('minimizeWindow', () => rpc.request.minimizeWindow({}))
}

export async function maximizeWindow(): Promise<void> {
  return trackedRequest('maximizeWindow', () => rpc.request.maximizeWindow({}))
}

export async function unmaximizeWindow(): Promise<void> {
  return trackedRequest('unmaximizeWindow', () => rpc.request.unmaximizeWindow({}))
}

export async function isWindowMaximized(): Promise<boolean> {
  return trackedRequest('isWindowMaximized', () => rpc.request.isWindowMaximized({}))
}

export async function getWindowFrame(): Promise<{ x: number; y: number; width: number; height: number }> {
  return trackedRequest('getWindowFrame', () => rpc.request.getWindowFrame({}))
}

export async function setWindowPosition(x: number, y: number): Promise<void> {
  return trackedRequest('setWindowPosition', () => rpc.request.setWindowPosition({ x, y }))
}
