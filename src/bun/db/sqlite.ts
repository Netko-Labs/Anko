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

export class SqliteConnector implements DatabaseConnector {
  private sql: InstanceType<typeof SQL>

  private constructor(sql: InstanceType<typeof SQL>) {
    this.sql = sql
  }

  static async connect(config: ConnectionConfig): Promise<SqliteConnector> {
    try {
      // For SQLite, `host` holds the file path — resolve relative paths from CWD
      const raw = config.host || ':memory:'
      const filename =
        raw === ':memory:' || raw.startsWith('/') ? raw : `${process.cwd()}/${raw}`
      const sql = new SQL({
        adapter: 'sqlite',
        filename,
      })

      // Test the connection
      await sql`SELECT 1`

      return new SqliteConnector(sql)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw AppError.database(`Failed to open SQLite database "${config.host}" - ${msg}`)
    }
  }

  async executeWithContext(
    query: string,
    _database?: string,
    _context?: string,
  ): Promise<QueryResult> {
    // SQLite has no database/schema switching
    const result = await this.execute(query)
    result.original_query = query
    result.executed_query = query
    return result
  }

  async execute(query: string): Promise<QueryResult> {
    const start = performance.now()

    try {
      const rows = await this.sql.unsafe(query)
      const executionTimeMs = Math.round(performance.now() - start)

      if (Array.isArray(rows) && rows.length > 0) {
        const columns: ColumnInfo[] = Object.keys(rows[0]).map((key) => ({
          name: key,
          data_type:
            typeof rows[0][key] === 'number'
              ? 'number'
              : typeof rows[0][key] === 'boolean'
                ? 'boolean'
                : 'string',
          nullable: true,
        }))

        const jsonRows: unknown[][] = rows.map((row: Record<string, unknown>) =>
          columns.map((col) => {
            const val = row[col.name]
            if (val === null || val === undefined) return null
            if (typeof val === 'bigint') return Number(val)
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

      if (Array.isArray(rows) && rows.length === 0) {
        return {
          columns: [],
          rows: [],
          affected_rows: 0,
          execution_time_ms: executionTimeMs,
        }
      }

      // Non-SELECT result
      return {
        columns: [],
        rows: [],
        affected_rows: (rows as unknown as { changes?: number })?.changes ?? 0,
        execution_time_ms: executionTimeMs,
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw AppError.database(msg)
    }
  }

  async getDatabases(): Promise<SchemaInfo[]> {
    // SQLite is single-database; return "main"
    return [{ name: 'main' }]
  }

  async getSchemas(_database: string): Promise<SchemaInfo[]> {
    // SQLite has no schemas
    return []
  }

  async getTables(_database: string, _schema: string): Promise<TableInfo[]> {
    const rows = await this.sql`
      SELECT name, type
      FROM sqlite_master
      WHERE type IN ('table', 'view')
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => ({
      name: String(row.name ?? ''),
      schema: 'main',
      table_type: String(row.type ?? 'table') === 'view' ? 'VIEW' : 'BASE TABLE',
    }))
  }

  async getColumns(
    _database: string,
    _schema: string,
    table: string,
  ): Promise<ColumnDetail[]> {
    const rows = await this.sql.unsafe(`PRAGMA table_info("${table.replace(/"/g, '""')}")`)

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => ({
      name: String(row.name ?? ''),
      data_type: String(row.type ?? '').toLowerCase() || 'text',
      nullable: Number(row.notnull ?? 0) === 0,
      key: Number(row.pk ?? 0) > 0 ? 'PRI' : undefined,
      default_value: row.dflt_value != null ? String(row.dflt_value) : undefined,
    }))
  }

  async close(): Promise<void> {
    await this.sql.close()
  }
}
