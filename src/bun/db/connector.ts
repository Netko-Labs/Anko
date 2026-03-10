export type DatabaseDriver = 'mysql' | 'postgresql'

export interface ColumnInfo {
  name: string
  data_type: string
  nullable: boolean
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

export interface QueryResult {
  columns: ColumnInfo[]
  rows: unknown[][]
  affected_rows: number
  execution_time_ms: number
  original_query?: string
  executed_query?: string
}

export interface ConnectionConfig {
  name: string
  host: string
  port: number
  username: string
  password: string
  database?: string
  driver: DatabaseDriver
}

export interface DatabaseConnector {
  execute(query: string): Promise<QueryResult>
  executeWithContext(query: string, database?: string, context?: string): Promise<QueryResult>
  getDatabases(): Promise<SchemaInfo[]>
  getSchemas(database: string): Promise<SchemaInfo[]>
  getTables(database: string, schema: string): Promise<TableInfo[]>
  getColumns(database: string, schema: string, table: string): Promise<ColumnDetail[]>
  close(): Promise<void>
}
