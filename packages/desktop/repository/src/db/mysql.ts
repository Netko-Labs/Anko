// conventions: >300 lines — one DatabaseConnector with catalog queries and ERD
// assembly; no clean seam without live-DB verification; split when next touched.

import { AppError } from '@anko/desktop-domain'
import { SQL } from 'bun'
import type {
  ColumnDetail,
  ColumnInfo,
  ConnectionConfig,
  DatabaseConnector,
  ErdSchema,
  QueryResult,
  SchemaInfo,
  TableInfo,
} from './connector'
import { assembleErdSchema, type RawErdColumn, type RawErdForeignKey } from './erd-utils'
import { extractTableFromSelect } from './query-utils'
import {
  buildColumnsFromRow,
  buildColumnsFromTypeMap,
  type ColumnTypeInfo,
  TypeMapCache,
} from './type-enrich'

const HIDDEN_DATABASES = ['information_schema', 'performance_schema']

export class MySqlConnector implements DatabaseConnector {
  private sql: InstanceType<typeof SQL>
  private typeCache = new TypeMapCache()

  private constructor(sql: InstanceType<typeof SQL>) {
    this.sql = sql
  }

  static async connect(config: ConnectionConfig): Promise<MySqlConnector> {
    try {
      const database = config.database || undefined
      const sql = new SQL({
        hostname: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database,
        adapter: 'mysql',
      })

      // Test the connection
      await sql`SELECT 1`

      return new MySqlConnector(sql)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw AppError.database(
        `Failed to connect to MySQL at ${config.host}:${config.port} - ${msg}`,
      )
    }
  }

  async executeWithContext(
    query: string,
    database?: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<QueryResult> {
    let executedQuery: string
    const targetDatabase = database ?? context

    if (targetDatabase) {
      // Execute USE database first
      try {
        await this.sql.unsafe(`USE \`${targetDatabase.replace(/`/g, '``')}\``)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        throw AppError.database(`Failed to switch to database '${targetDatabase}': ${msg}`)
      }
      executedQuery = `USE \`${targetDatabase.replace(/`/g, '``')}\`;\n${query}`
    } else {
      executedQuery = query
    }

    const result = await this.executeOnSql(this.sql, query, signal)
    result.original_query = query
    result.executed_query = executedQuery
    return result
  }

  async executeReadOnlyWithContext(
    query: string,
    database?: string,
    context?: string,
    signal?: AbortSignal,
  ): Promise<QueryResult> {
    const targetDatabase = database ?? context
    return this.sql.begin('read only', async (transaction) => {
      if (targetDatabase) {
        await transaction.unsafe(`USE \`${targetDatabase.replace(/`/g, '``')}\``)
      }
      return this.executeOnSql(transaction as unknown as InstanceType<typeof SQL>, query, signal)
    })
  }

  async execute(query: string): Promise<QueryResult> {
    return this.executeOnSql(this.sql, query)
  }

  private async executeOnSql(
    sql: InstanceType<typeof SQL>,
    query: string,
    signal?: AbortSignal,
  ): Promise<QueryResult> {
    const start = performance.now()

    try {
      // Try executing as a query that returns rows
      const pending = sql.unsafe(query)
      const cancel = () => pending.cancel()
      signal?.addEventListener('abort', cancel, { once: true })
      if (signal?.aborted) pending.cancel()
      const rows = await pending.finally(() => signal?.removeEventListener('abort', cancel))
      const executionTimeMs = Math.round(performance.now() - start)

      // Check if this is a result set (SELECT) or an execute result (INSERT/UPDATE/DELETE)
      if (Array.isArray(rows)) {
        // Exact column types from the catalog for the queried table; falls back
        // to the value's JS type for aliases/expressions/joined columns.
        const table = extractTableFromSelect(query)
        const typeMap = table ? await this.getColumnTypeMap(table) : new Map()
        const columns: ColumnInfo[] =
          rows.length > 0 ? buildColumnsFromRow(rows[0], typeMap) : buildColumnsFromTypeMap(typeMap)

        const jsonRows: unknown[][] = rows.map((row: Record<string, unknown>) =>
          columns.map((col) => {
            const val = row[col.name]
            if (val === null || val === undefined) return null
            if (val instanceof Date)
              return val
                .toISOString()
                .replace('T', ' ')
                .replace(/\.\d{3}Z$/, '')
            if (typeof val === 'bigint') return Number(val)
            if (Buffer.isBuffer(val)) {
              // Try to parse as string
              const str = val.toString('utf-8')
              try {
                return JSON.parse(str)
              } catch {
                return str
              }
            }
            return val
          }),
        )

        return {
          columns,
          rows: jsonRows,
          affected_rows: 0,
          execution_time_ms: executionTimeMs,
        }
      }

      // Non-array result (affected rows from INSERT/UPDATE/DELETE)
      const executionTimeMs2 = Math.round(performance.now() - start)
      return {
        columns: [],
        rows: [],
        affected_rows: (rows as unknown as { affectedRows?: number })?.affectedRows ?? 0,
        execution_time_ms: executionTimeMs2,
      }
    } catch (e: unknown) {
      // If the first attempt fails, try as a non-query (for statements like CREATE, DROP, etc.)
      try {
        const result = await sql.unsafe(query)
        const executionTimeMs = Math.round(performance.now() - start)
        return {
          columns: [],
          rows: [],
          affected_rows: (result as unknown as { affectedRows?: number })?.affectedRows ?? 0,
          execution_time_ms: executionTimeMs,
        }
      } catch {
        const msg = e instanceof Error ? e.message : String(e)
        throw AppError.database(msg)
      }
    }
  }

  /**
   * Exact column types for a table, keyed by column name. Uses COLUMN_TYPE for
   * the full declared type (e.g. `varchar(255)`, `bigint unsigned`,
   * `decimal(10,2)`, `enum('a','b')`). Scoped to the current database. Cached.
   */
  private async getColumnTypeMap(table: string): Promise<Map<string, ColumnTypeInfo>> {
    const cached = this.typeCache.get(table)
    if (cached) return cached

    const map = new Map<string, ColumnTypeInfo>()
    try {
      const rows = await this.sql`
        SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
        FROM information_schema.COLUMNS
        WHERE TABLE_NAME = ${table} AND TABLE_SCHEMA = DATABASE()
        ORDER BY ORDINAL_POSITION
      `
      if (Array.isArray(rows)) {
        for (const row of rows as Record<string, unknown>[]) {
          const name = String(row.COLUMN_NAME ?? row.column_name ?? '')
          if (!name) continue
          map.set(name, {
            dataType: String(row.COLUMN_TYPE ?? row.column_type ?? ''),
            nullable: String(row.IS_NULLABLE ?? row.is_nullable ?? '') === 'YES',
          })
        }
      }
    } catch {
      // Unresolvable (cross-db table, permissions, etc.) — caller falls back.
    }
    this.typeCache.set(table, map)
    return map
  }

  async getDatabases(): Promise<SchemaInfo[]> {
    const rows = await this.sql`SHOW DATABASES`
    if (!Array.isArray(rows)) return []

    return rows
      .map((row: Record<string, unknown>) => {
        const name = String(Object.values(row)[0] ?? '')
        return { name }
      })
      .filter((db) => !HIDDEN_DATABASES.includes(db.name))
  }

  async getSchemas(_database: string): Promise<SchemaInfo[]> {
    // MySQL doesn't have schemas separate from databases
    return []
  }

  async getTables(database: string, _schema: string): Promise<TableInfo[]> {
    const rows = await this.sql`
      SELECT TABLE_NAME, TABLE_SCHEMA, TABLE_TYPE, TABLE_ROWS
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ${database}
      ORDER BY TABLE_NAME
    `

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => ({
      name: String(row.TABLE_NAME ?? row.table_name ?? ''),
      schema: String(row.TABLE_SCHEMA ?? row.table_schema ?? ''),
      table_type: String(row.TABLE_TYPE ?? row.table_type ?? ''),
      row_count: row.TABLE_ROWS != null ? Number(row.TABLE_ROWS ?? row.table_rows) : undefined,
    }))
  }

  async getColumns(database: string, _schema: string, table: string): Promise<ColumnDetail[]> {
    const rows = await this.sql`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ${database} AND TABLE_NAME = ${table}
      ORDER BY ORDINAL_POSITION
    `

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => ({
      name: String(row.COLUMN_NAME ?? row.column_name ?? ''),
      data_type: String(row.DATA_TYPE ?? row.data_type ?? ''),
      nullable: String(row.IS_NULLABLE ?? row.is_nullable ?? '') === 'YES',
      key:
        row.COLUMN_KEY || row.column_key
          ? String(row.COLUMN_KEY ?? row.column_key) || undefined
          : undefined,
      default_value:
        row.COLUMN_DEFAULT != null ? String(row.COLUMN_DEFAULT ?? row.column_default) : undefined,
      extra: row.EXTRA || row.extra ? String(row.EXTRA ?? row.extra) || undefined : undefined,
    }))
  }

  async getErdSchema(database: string): Promise<ErdSchema> {
    // Base tables only (skip views) — the ERD is about real entities + FKs.
    const tableRows = await this.sql`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ${database} AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `
    const colRows = await this.sql`
      SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, EXTRA,
             COLUMN_DEFAULT, ORDINAL_POSITION
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ${database}
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `
    const fkRows = await this.sql`
      SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME, CONSTRAINT_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ${database} AND REFERENCED_TABLE_NAME IS NOT NULL
    `

    const tableNames = (Array.isArray(tableRows) ? tableRows : []).map(
      (r: Record<string, unknown>) => String(r.TABLE_NAME ?? r.table_name ?? ''),
    )
    const columns: RawErdColumn[] = (Array.isArray(colRows) ? colRows : []).map(
      (r: Record<string, unknown>) => {
        const key = String(r.COLUMN_KEY ?? r.column_key ?? '')
        const extra = String(r.EXTRA ?? r.extra ?? '').toLowerCase()
        const def = r.COLUMN_DEFAULT ?? r.column_default
        return {
          table: String(r.TABLE_NAME ?? r.table_name ?? ''),
          name: String(r.COLUMN_NAME ?? r.column_name ?? ''),
          data_type: String(r.COLUMN_TYPE ?? r.column_type ?? ''),
          nullable: String(r.IS_NULLABLE ?? r.is_nullable ?? '') === 'YES',
          isPrimaryKey: key === 'PRI',
          isUnique: key === 'UNI',
          isAutoIncrement: extra.includes('auto_increment'),
          defaultValue: def != null ? String(def) : undefined,
        }
      },
    )
    const fks: RawErdForeignKey[] = (Array.isArray(fkRows) ? fkRows : []).map(
      (r: Record<string, unknown>) => ({
        fromTable: String(r.TABLE_NAME ?? r.table_name ?? ''),
        fromColumn: String(r.COLUMN_NAME ?? r.column_name ?? ''),
        toTable: String(r.REFERENCED_TABLE_NAME ?? r.referenced_table_name ?? ''),
        toColumn: String(r.REFERENCED_COLUMN_NAME ?? r.referenced_column_name ?? ''),
        constraintName: String(r.CONSTRAINT_NAME ?? r.constraint_name ?? '') || undefined,
      }),
    )

    return assembleErdSchema(tableNames, columns, fks)
  }

  async close(): Promise<void> {
    await this.sql.close()
  }
}
