// conventions: >300 lines — typed RPC wrappers for every backend command; split by domain (connections, schema, queries, workspaces) re-exported from here when next touched
import { client } from 'mirinjs/client'
import type { McpApprovalRequest, McpSettings } from '@/bun/mcp/types'
import type { Router } from '@/bun/rpc/router'
import type { CreateTableInput, CreateTableResult } from '@/shared/create-table'
import type { UpdateCheckResult, UpdateDownloadStatus } from '@/shared/rpc-types'
import type {
  ActiveConnection,
  AddQueryHistoryInput,
  ColumnDetail,
  ConnectionConfig,
  ConnectionInfo,
  CreateSavedQueryInput,
  ErdSchema,
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

// Typed client over mirin's RPC transport (window.mirin WebSocket to the worker).
const api = client<Router>()

export const mcpEvents = {
  onApprovalRequested: (listener: (request: McpApprovalRequest) => void) =>
    api.mcpApprovalRequested.on(listener),
  onStatusChanged: (listener: (settings: McpSettings) => void) => api.mcpStatusChanged.on(listener),
  onConnectionChanged: (listener: () => void) => api.mcpConnectionChanged.on(listener),
  onHistoryAdded: (listener: (entry: QueryHistoryEntry) => void) =>
    api.mcpHistoryAdded.on(listener),
}

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
export async function connectSavedConnection(id: string): Promise<ActiveConnection> {
  return trackedRequest('connectSavedConnection', () => api.connectSavedConnection({ id }))
}

export async function listActiveConnections(): Promise<ActiveConnection[]> {
  return trackedRequest('listActiveConnections', () => api.listActiveConnections({}))
}

export async function getMcpSettings(): Promise<McpSettings> {
  return trackedRequest('getMcpSettings', () => api.getMcpSettings({}))
}

export async function setMcpEnabled(enabled: boolean): Promise<McpSettings> {
  return trackedRequest('setMcpEnabled', () => api.setMcpEnabled({ enabled }))
}

export async function setMcpBypassPermissions(bypassPermissions: boolean): Promise<McpSettings> {
  return trackedRequest('setMcpBypassPermissions', () =>
    api.setMcpBypassPermissions({ bypassPermissions }),
  )
}

export async function setMcpPort(port: number): Promise<McpSettings> {
  return trackedRequest('setMcpPort', () => api.setMcpPort({ port }))
}

export async function rotateMcpToken(): Promise<McpSettings> {
  return trackedRequest('rotateMcpToken', () => api.rotateMcpToken({}))
}

export async function listPendingMcpApprovals(): Promise<McpApprovalRequest[]> {
  return trackedRequest('listPendingMcpApprovals', () => api.listPendingMcpApprovals({}))
}

export async function resolveMcpApproval(id: string, approved: boolean): Promise<boolean> {
  return trackedRequest('resolveMcpApproval', () => api.resolveMcpApproval({ id, approved }))
}

export async function installMcpBridge(): Promise<McpSettings> {
  return trackedRequest('installMcpBridge', () => api.installMcpBridge({}))
}

export async function disconnect(connectionId: string): Promise<void> {
  return trackedRequest('disconnect', () => api.disconnect({ connectionId }))
}

export async function testConnection(config: ConnectionConfig): Promise<boolean> {
  return trackedRequest('testConnection', () => api.testConnection({ config }))
}

// Query commands
export async function executeQuery(
  connectionId: string,
  query: string,
  database?: string,
  context?: string,
): Promise<QueryResult> {
  return trackedRequest('executeQuery', () =>
    api.executeQuery({ connectionId, query, database, context }),
  )
}

export async function createTable(input: CreateTableInput): Promise<CreateTableResult> {
  return trackedRequest('createTable', () => api.createTable({ input }))
}

// Schema commands
export async function getDatabases(connectionId: string): Promise<SchemaInfo[]> {
  const result = await trackedRequest('getDatabases', () => api.getDatabases({ connectionId }))
  rpcLogger.debug(
    `getDatabases returned ${result.length} databases:`,
    result.map((d: SchemaInfo) => d.name),
  )
  return result
}

export async function getSchemas(connectionId: string, database: string): Promise<SchemaInfo[]> {
  const result = await trackedRequest('getSchemas', () =>
    api.getSchemas({ connectionId, database }),
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
    api.getTables({ connectionId, database, schema }),
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
    api.getColumns({ connectionId, database, schema, table }),
  )
  rpcLogger.debug(
    `getColumns returned ${result.length} columns for ${database}.${schema}.${table}:`,
    result.map((c: ColumnDetail) => c.name),
  )
  return result
}

export async function getErdSchema(
  connectionId: string,
  database: string,
  schema?: string,
): Promise<ErdSchema> {
  return trackedRequest('getErdSchema', () => api.getErdSchema({ connectionId, database, schema }))
}

// Storage commands
export async function saveConnection(config: ConnectionConfig): Promise<ConnectionInfo> {
  return trackedRequest('saveConnection', () => api.saveConnection({ config }))
}

export async function updateConnection(id: string, config: ConnectionConfig): Promise<void> {
  return trackedRequest('updateConnection', () => api.updateConnection({ id, config }))
}

export async function listConnections(): Promise<ConnectionInfo[]> {
  return trackedRequest('listConnections', () => api.listConnections({}))
}

export async function deleteConnection(id: string): Promise<void> {
  return trackedRequest('deleteConnection', () => api.deleteConnection({ id }))
}

// Workspace commands
export async function listWorkspaces(): Promise<Workspace[]> {
  return trackedRequest('listWorkspaces', () => api.listWorkspaces({}))
}

export async function createWorkspace(config: WorkspaceConfig): Promise<Workspace> {
  return trackedRequest('createWorkspace', () => api.createWorkspace({ config }))
}

export async function updateWorkspace(id: string, config: WorkspaceConfig): Promise<Workspace> {
  return trackedRequest('updateWorkspace', () => api.updateWorkspace({ id, config }))
}

export async function deleteWorkspace(id: string): Promise<void> {
  return trackedRequest('deleteWorkspace', () => api.deleteWorkspace({ id }))
}

export async function addConnectionToWorkspace(
  workspaceId: string,
  connectionId: string,
): Promise<void> {
  return trackedRequest('addConnectionToWorkspace', () =>
    api.addConnectionToWorkspace({ workspaceId, connectionId }),
  )
}

export async function removeConnectionFromWorkspace(
  workspaceId: string,
  connectionId: string,
): Promise<void> {
  return trackedRequest('removeConnectionFromWorkspace', () =>
    api.removeConnectionFromWorkspace({ workspaceId, connectionId }),
  )
}

export async function moveConnectionBetweenWorkspaces(
  connectionId: string,
  fromWorkspaceId: string,
  toWorkspaceId: string,
): Promise<void> {
  return trackedRequest('moveConnectionBetweenWorkspaces', () =>
    api.moveConnectionBetweenWorkspaces({ connectionId, fromWorkspaceId, toWorkspaceId }),
  )
}

// Workspace session commands (persisted tabs + snapshot results)
export async function getWorkspaceSession(workspaceId: string): Promise<string | null> {
  return trackedRequest('getWorkspaceSession', () => api.getWorkspaceSession({ workspaceId }))
}

export async function saveWorkspaceSession(workspaceId: string, data: string): Promise<void> {
  return trackedRequest('saveWorkspaceSession', () =>
    api.saveWorkspaceSession({ workspaceId, data }),
  )
}

export async function getActiveWorkspaceId(): Promise<string | null> {
  return trackedRequest('getActiveWorkspaceId', () => api.getActiveWorkspaceId({}))
}

export async function setActiveWorkspaceId(workspaceId: string): Promise<void> {
  return trackedRequest('setActiveWorkspaceId', () => api.setActiveWorkspaceId({ workspaceId }))
}

// Query History commands
export async function addQueryHistory(input: AddQueryHistoryInput): Promise<QueryHistoryEntry> {
  return trackedRequest('addQueryHistory', () => api.addQueryHistory({ input }))
}

export async function listQueryHistory(
  connectionId?: string,
  limit?: number,
): Promise<QueryHistoryEntry[]> {
  return trackedRequest('listQueryHistory', () => api.listQueryHistory({ connectionId, limit }))
}

export async function deleteQueryHistory(id: string): Promise<void> {
  return trackedRequest('deleteQueryHistory', () => api.deleteQueryHistory({ id }))
}

export async function clearQueryHistory(): Promise<void> {
  return trackedRequest('clearQueryHistory', () => api.clearQueryHistory({}))
}

// Saved Queries commands
export async function createSavedQuery(input: CreateSavedQueryInput): Promise<SavedQuery> {
  return trackedRequest('createSavedQuery', () => api.createSavedQuery({ input }))
}

export async function listSavedQueries(workspaceId?: string): Promise<SavedQuery[]> {
  return trackedRequest('listSavedQueries', () => api.listSavedQueries({ workspaceId }))
}

export async function updateSavedQuery(
  id: string,
  input: UpdateSavedQueryInput,
): Promise<SavedQuery> {
  return trackedRequest('updateSavedQuery', () => api.updateSavedQuery({ id, input }))
}

export async function deleteSavedQuery(id: string): Promise<void> {
  return trackedRequest('deleteSavedQuery', () => api.deleteSavedQuery({ id }))
}

// Update commands
export async function checkForUpdate(): Promise<UpdateCheckResult> {
  return trackedRequest('checkForUpdate', () => api.checkForUpdate({}))
}

export async function downloadUpdate(): Promise<void> {
  return trackedRequest('downloadUpdate', () => api.downloadUpdate({}))
}

export async function getUpdateStatus(): Promise<UpdateDownloadStatus> {
  return api.getUpdateStatus({})
}

export async function applyUpdate(): Promise<void> {
  return trackedRequest('applyUpdate', () => api.applyUpdate({}))
}

// Dev tools commands
export async function clearAllData(): Promise<void> {
  return trackedRequest('clearAllData', () => api.clearAllData({}))
}

// Utility commands
export async function getAppVersion(): Promise<string> {
  return trackedRequest('getAppVersion', () => api.getAppVersion({}))
}

export async function showSaveDialog(
  defaultPath?: string,
  filters?: Array<{ name: string; extensions: string[] }>,
): Promise<string | null> {
  return trackedRequest('showSaveDialog', () => api.showSaveDialog({ defaultPath, filters }))
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  return trackedRequest('writeTextFile', () => api.writeTextFile({ path, content }))
}

export async function saveImageFile(base64: string, defaultName?: string): Promise<string | null> {
  return trackedRequest('saveImageFile', () => api.saveImageFile({ defaultName, base64 }))
}

export async function closeWindow(): Promise<void> {
  return trackedRequest('closeWindow', () => api.closeWindow({}))
}

export async function minimizeWindow(): Promise<void> {
  return trackedRequest('minimizeWindow', () => api.minimizeWindow({}))
}

export async function maximizeWindow(): Promise<void> {
  return trackedRequest('maximizeWindow', () => api.maximizeWindow({}))
}

export async function unmaximizeWindow(): Promise<void> {
  return trackedRequest('unmaximizeWindow', () => api.unmaximizeWindow({}))
}

export async function isWindowMaximized(): Promise<boolean> {
  return trackedRequest('isWindowMaximized', () => api.isWindowMaximized({}))
}

export async function getWindowFrame(): Promise<{
  x: number
  y: number
  width: number
  height: number
}> {
  return trackedRequest('getWindowFrame', () => api.getWindowFrame({}))
}

export async function setWindowPosition(x: number, y: number): Promise<void> {
  return trackedRequest('setWindowPosition', () => api.setWindowPosition({ x, y }))
}

export async function openDevToolsWindow(): Promise<void> {
  return trackedRequest('openDevToolsWindow', () => api.openDevToolsWindow({}))
}
