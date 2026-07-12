export type DatabaseDriver = 'mysql' | 'postgresql' | 'sqlite'

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

// ── ERD schema graph ────────────────────────────────────────────────
// A whole-database (or whole-schema) snapshot used to render an entity-
// relationship diagram: every table with its columns, plus the foreign-key
// relationships between them. Fetched in a few batched catalog queries.

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
  /** Stable id `fromTable.fromColumn->toTable.toColumn` for React Flow edges. */
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

export interface DatabaseConnector {
  execute(query: string): Promise<QueryResult>
  executeWithContext(
    query: string,
    database?: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<QueryResult>
  executeReadOnlyWithContext(
    query: string,
    database?: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<QueryResult>
  getDatabases(): Promise<SchemaInfo[]>
  getSchemas(database: string): Promise<SchemaInfo[]>
  getTables(database: string, schema: string): Promise<TableInfo[]>
  getColumns(database: string, schema: string, table: string): Promise<ColumnDetail[]>
  /** Whole-database/schema graph (tables + columns + FKs) for the ERD view. */
  getErdSchema(database: string, schema?: string): Promise<ErdSchema>
  close(): Promise<void>
}
