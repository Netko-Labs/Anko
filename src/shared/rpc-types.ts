// Re-export entity-compatible types for the RPC layer
// These match the frontend entity types exactly

export interface ConnectionConfig {
  name: string
  host: string
  port: number
  username: string
  password: string
  database?: string
  driver: 'mysql' | 'postgresql' | 'sqlite'
}

export interface ConnectionInfo {
  id: string
  name: string
  host: string
  port: number
  username: string
  database?: string
  driver: 'mysql' | 'postgresql' | 'sqlite'
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

export interface ErdColumn {
  name: string
  data_type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  isUnique: boolean
  isAutoIncrement: boolean
  defaultValue?: string
}

export interface ErdTable {
  name: string
  columns: ErdColumn[]
}

export interface ErdRelation {
  id: string
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  constraintName?: string
}

export interface ErdSchema {
  tables: ErdTable[]
  relations: ErdRelation[]
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

export interface UpdateCheckResult {
  currentVersion: string
  version: string
  updateAvailable: boolean
  error: string
}

export interface UpdateDownloadStatus {
  status: string
  message: string
  progress?: number
  bytesDownloaded?: number
  totalBytes?: number
  isComplete: boolean
  isError: boolean
  errorMessage?: string
}
