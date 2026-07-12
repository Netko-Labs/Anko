import { rpc } from 'mirinjs/rpc'
import type { CreateTableInput } from '@anko/desktop-domain'
import { buildCreateTableSql } from '@anko/desktop-repository'
import type { AppState } from '@anko/desktop-service'

/** Query execution and schema-browsing commands against a live connection. */
export function dataRoutes(state: AppState) {
  return {
    executeQuery: rpc.mutation(
      async ({
        connectionId,
        query,
        database,
        context,
      }: {
        connectionId: string
        query: string
        database?: string
        context?: string
      }) => {
        const conn = state.getConnection(connectionId)
        return conn.executeWithContext(query, database, context)
      },
    ),

    createTable: rpc.mutation(async ({ input }: { input: CreateTableInput }) => {
      const info = state.getConnectionInfo(input.connectionId)
      const { connectionId, ...definition } = input
      const result = buildCreateTableSql(info.driver, definition)
      await state
        .getConnection(connectionId)
        .executeWithContext(result.sql, input.database, input.schema)
      return { tableName: result.tableName }
    }),

    getDatabases: rpc.query(async ({ connectionId }: { connectionId: string }) => {
      return state.getConnection(connectionId).getDatabases()
    }),
    // Whole-database/schema graph (tables + columns + FKs) for the ERD view.
    getErdSchema: rpc.query(
      async ({
        connectionId,
        database,
        schema,
      }: {
        connectionId: string
        database: string
        schema?: string
      }) => {
        return state.getConnection(connectionId).getErdSchema(database, schema)
      },
    ),
    getSchemas: rpc.query(
      async ({ connectionId, database }: { connectionId: string; database: string }) => {
        return state.getConnection(connectionId).getSchemas(database)
      },
    ),
    getTables: rpc.query(
      async ({
        connectionId,
        database,
        schema,
      }: {
        connectionId: string
        database: string
        schema: string
      }) => {
        return state.getConnection(connectionId).getTables(database, schema)
      },
    ),
    getColumns: rpc.query(
      async ({
        connectionId,
        database,
        schema,
        table,
      }: {
        connectionId: string
        database: string
        schema: string
        table: string
      }) => {
        return state.getConnection(connectionId).getColumns(database, schema, table)
      },
    ),
  }
}
