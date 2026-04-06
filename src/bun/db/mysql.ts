import { SQL } from 'bun'
import { AppError } from '../error'
import type {
  ColumnDetail,
  ColumnInfo,
  ConnectionConfig,
  DatabaseConnector,
  QueryResult,
  SchemaInfo,
  TableInfo,
} from './connector'
import { extractTableFromSelect } from './query-utils'

const HIDDEN_DATABASES = ['information_schema', 'performance_schema']

export class MySqlConnector implements DatabaseConnector {
  private sql: InstanceType<typeof SQL>

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
    _database?: string,
    context?: string,
  ): Promise<QueryResult> {
    let executedQuery: string

    if (context) {
      // Execute USE database first
      try {
        await this.sql.unsafe(`USE \`${context}\``)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        throw AppError.database(`Failed to switch to database '${context}': ${msg}`)
      }
      executedQuery = `USE \`${context}\`;\n${query}`
    } else {
      executedQuery = query
    }

    const result = await this.execute(query)
    result.original_query = query
    result.executed_query = executedQuery
    return result
  }

  async execute(query: string): Promise<QueryResult> {
    const start = performance.now()

    try {
      // Try executing as a query that returns rows
      const rows = await this.sql.unsafe(query)
      const executionTimeMs = Math.round(performance.now() - start)

      // Check if this is a result set (SELECT) or an execute result (INSERT/UPDATE/DELETE)
      if (Array.isArray(rows)) {
        const columns: ColumnInfo[] =
          rows.length > 0
            ? Object.keys(rows[0]).map((key) => ({
                name: key,
                data_type:
                  typeof rows[0][key] === 'number'
                    ? 'number'
                    : typeof rows[0][key] === 'boolean'
                      ? 'boolean'
                      : 'string',
                nullable: true,
              }))
            : await this.getColumnsForEmptySelect(query)

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
        const result = await this.sql.unsafe(query)
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

  private async getColumnsForEmptySelect(query: string): Promise<ColumnInfo[]> {
    const trimmed = query.trim().toUpperCase()
    if (!trimmed.startsWith('SELECT')) return []

    const tableName = extractTableFromSelect(query)
    if (!tableName) return []

    try {
      const rows = await this.sql`
        SELECT COLUMN_NAME, DATA_TYPE
        FROM information_schema.COLUMNS
        WHERE TABLE_NAME = ${tableName}
        ORDER BY ORDINAL_POSITION
      `

      if (!Array.isArray(rows)) return []
      return rows.map((row: Record<string, unknown>) => ({
        name: String(row.COLUMN_NAME ?? row.column_name ?? ''),
        data_type: String(row.DATA_TYPE ?? row.data_type ?? ''),
        nullable: true,
      }))
    } catch {
      return []
    }
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

  async close(): Promise<void> {
    await this.sql.close()
  }
}
