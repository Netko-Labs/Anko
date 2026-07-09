import { rpc } from 'mirinjs/rpc'
import type { AppState } from '../../state'

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
