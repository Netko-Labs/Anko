import type {
  ColumnDetail,
  ErdSchema,
  QueryResult,
  SchemaInfo,
  TableInfo,
} from '@anko/desktop-domain'

export type {
  ColumnDetail,
  ColumnInfo,
  ConnectionConfig,
  ConnectionInfo,
  DatabaseDriver,
  ErdColumn,
  ErdRelation,
  ErdSchema,
  ErdTable,
  QueryResult,
  SchemaInfo,
  TableInfo,
} from '@anko/desktop-domain'

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
