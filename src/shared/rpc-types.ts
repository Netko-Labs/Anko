import type { RPCSchema } from 'electrobun/view'

// Re-export entity-compatible types for the RPC layer
// These match the frontend entity types exactly

export interface ConnectionConfig {
  name: string
  host: string
  port: number
  username: string
  password: string
  database?: string
  driver: 'mysql' | 'postgresql'
}

export interface ConnectionInfo {
  id: string
  name: string
  host: string
  port: number
  username: string
  database?: string
  driver: 'mysql' | 'postgresql'
}

export interface SchemaInfo {
  name: string
}

export interface TableInfo {
  name: string
  schema: string
  table_type: string
  row_count?: number
}

export interface ColumnDetail {
  name: string
  data_type: string
  nullable: boolean
  key?: string
  default_value?: string
  extra?: string
}

export interface ColumnInfo {
  name: string
  data_type: string
  nullable: boolean
}

export interface QueryResult {
  columns: ColumnInfo[]
  rows: unknown[][]
  affected_rows: number
  execution_time_ms: number
  original_query?: string
  executed_query?: string
}

export interface WorkspaceConfig {
  name: string
  icon: string
}

export interface Workspace {
  id: string
  name: string
  icon: string
  is_default: boolean
  connection_ids: string[]
  created_at: string
  updated_at: string
}

export interface AddQueryHistoryInput {
  query: string
  connectionId: string
  connectionName: string
  databaseName: string | null
  executionTimeMs: number | null
  rowCount: number | null
  success: boolean
  errorMessage: string | null
}

export interface QueryHistoryEntry {
  id: string
  query: string
  connectionId: string
  connectionName: string
  databaseName: string | null
  executedAt: string
  executionTimeMs: number | null
  rowCount: number | null
  success: boolean
  errorMessage: string | null
}

export interface CreateSavedQueryInput {
  name: string
  query: string
  description: string | null
  workspaceId: string | null
  connectionId: string | null
  databaseName: string | null
}

export interface UpdateSavedQueryInput {
  name?: string
  query?: string
  description?: string | null
  workspaceId?: string | null
  connectionId?: string | null
  databaseName?: string | null
}

export interface SavedQuery {
  id: string
  name: string
  query: string
  description: string | null
  workspaceId: string | null
  connectionId: string | null
  databaseName: string | null
  createdAt: string
  updatedAt: string
}

export type AnkoRPC = {
  bun: RPCSchema<{
    requests: {
      // Connection commands
      connect: { params: { config: ConnectionConfig }; response: string }
      disconnect: { params: { connectionId: string }; response: undefined }
      testConnection: { params: { config: ConnectionConfig }; response: boolean }

      // Query commands
      executeQuery: {
        params: { connectionId: string; query: string; database?: string; context?: string }
        response: QueryResult
      }

      // Schema commands
      getDatabases: { params: { connectionId: string }; response: SchemaInfo[] }
      getSchemas: { params: { connectionId: string; database: string }; response: SchemaInfo[] }
      getTables: {
        params: { connectionId: string; database: string; schema: string }
        response: TableInfo[]
      }
      getColumns: {
        params: { connectionId: string; database: string; schema: string; table: string }
        response: ColumnDetail[]
      }

      // Connection storage
      saveConnection: { params: { config: ConnectionConfig }; response: ConnectionInfo }
      updateConnection: { params: { id: string; config: ConnectionConfig }; response: undefined }
      listConnections: { params: {}; response: ConnectionInfo[] }
      deleteConnection: { params: { id: string }; response: undefined }
      getConnectionConfig: { params: { id: string }; response: ConnectionConfig }

      // Workspace commands
      listWorkspaces: { params: {}; response: Workspace[] }
      createWorkspace: { params: { config: WorkspaceConfig }; response: Workspace }
      updateWorkspace: { params: { id: string; config: WorkspaceConfig }; response: Workspace }
      deleteWorkspace: { params: { id: string }; response: undefined }
      addConnectionToWorkspace: {
        params: { workspaceId: string; connectionId: string }
        response: undefined
      }
      removeConnectionFromWorkspace: {
        params: { workspaceId: string; connectionId: string }
        response: undefined
      }
      moveConnectionBetweenWorkspaces: {
        params: { connectionId: string; fromWorkspaceId: string; toWorkspaceId: string }
        response: undefined
      }

      // Query history
      addQueryHistory: { params: { input: AddQueryHistoryInput }; response: QueryHistoryEntry }
      listQueryHistory: {
        params: { connectionId?: string; limit?: number }
        response: QueryHistoryEntry[]
      }
      deleteQueryHistory: { params: { id: string }; response: undefined }
      clearQueryHistory: { params: {}; response: undefined }

      // Saved queries
      createSavedQuery: { params: { input: CreateSavedQueryInput }; response: SavedQuery }
      listSavedQueries: { params: { workspaceId?: string }; response: SavedQuery[] }
      updateSavedQuery: {
        params: { id: string; input: UpdateSavedQueryInput }
        response: SavedQuery
      }
      deleteSavedQuery: { params: { id: string }; response: undefined }

      // Utility commands
      clearAllData: { params: {}; response: undefined }
      getAppVersion: { params: {}; response: string }
      showSaveDialog: {
        params: { defaultPath?: string; filters?: Array<{ name: string; extensions: string[] }> }
        response: string | null
      }
      writeTextFile: { params: { path: string; content: string }; response: undefined }
      closeWindow: { params: {}; response: undefined }
      minimizeWindow: { params: {}; response: undefined }
      maximizeWindow: { params: {}; response: undefined }
      unmaximizeWindow: { params: {}; response: undefined }
      isWindowMaximized: { params: {}; response: boolean }
      getWindowFrame: {
        params: {}
        response: { x: number; y: number; width: number; height: number }
      }
      setWindowPosition: { params: { x: number; y: number }; response: undefined }
    }
    messages: {}
  }>
  webview: RPCSchema<{
    requests: {}
    messages: {}
  }>
}
