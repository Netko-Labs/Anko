import { SQL } from 'bun'
import type { ConnectionConfig, DatabaseConnector, QueryResult, SchemaInfo, TableInfo, ColumnDetail, ColumnInfo } from './connector'
import { extractTableFromSelect } from './query-utils'
import { AppError } from '../error'

const POOL_TTL_MS = 5 * 60 * 1000 // 5 minutes
const EVICTION_INTERVAL_MS = 60 * 1000 // 60 seconds

interface PoolEntry {
  sql: InstanceType<typeof SQL>
  lastUsed: number
}

export class PostgresConnector implements DatabaseConnector {
  private config: ConnectionConfig
  private pools: Map<string, PoolEntry> = new Map()
  private defaultDatabase: string
  private evictionTimer: ReturnType<typeof setInterval> | null = null

  private constructor(config: ConnectionConfig, defaultSql: InstanceType<typeof SQL>, defaultDatabase: string) {
    this.config = config
    this.defaultDatabase = defaultDatabase
    this.pools.set(defaultDatabase, { sql: defaultSql, lastUsed: Date.now() })
    this.startPoolEvictor()
  }

  static async connect(config: ConnectionConfig): Promise<PostgresConnector> {
    const defaultDatabase = config.database || 'postgres'

    try {
      const sql = new SQL({
        hostname: config.host,
        port: config.port,
        username: config.username,
        password: config.password,
        database: defaultDatabase,
        dialect: 'postgres',
      })

      // Test the connection
      await sql`SELECT 1`

      return new PostgresConnector(config, sql, defaultDatabase)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw AppError.database(`Failed to connect to PostgreSQL at ${config.host}:${config.port} - ${msg}`)
    }
  }

  private startPoolEvictor() {
    this.evictionTimer = setInterval(() => {
      const now = Date.now()
      for (const [database, entry] of this.pools.entries()) {
        if (database === this.defaultDatabase) continue
        if (now - entry.lastUsed > POOL_TTL_MS) {
          entry.sql.close().catch(() => {})
          this.pools.delete(database)
          console.log(`[PostgreSQL] Evicted pool for database '${database}'`)
        }
      }
    }, EVICTION_INTERVAL_MS)
  }

  private async getPool(database: string): Promise<InstanceType<typeof SQL>> {
    const existing = this.pools.get(database)
    if (existing) {
      existing.lastUsed = Date.now()
      return existing.sql
    }

    // Create new pool for this database
    try {
      const sql = new SQL({
        hostname: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password,
        database,
        dialect: 'postgres',
      })

      await sql`SELECT 1`

      this.pools.set(database, { sql, lastUsed: Date.now() })
      console.log(`[PostgreSQL] Pool created for database: ${database}`)
      return sql
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw AppError.database(`Failed to connect to PostgreSQL database '${database}' at ${this.config.host}:${this.config.port} - ${msg}`)
    }
  }

  private async getDefaultPool(): Promise<InstanceType<typeof SQL>> {
    return this.getPool(this.defaultDatabase)
  }

  async executeWithContext(query: string, database?: string, schema?: string): Promise<QueryResult> {
    const pool = database ? await this.getPool(database) : await this.getDefaultPool()
    const start = performance.now()

    // Set search_path if schema specified
    let executedQuery: string
    if (schema) {
      const quotedSchema = `"${schema.replace(/"/g, '""')}"`
      await pool.unsafe(`SET search_path TO ${quotedSchema}`)
      executedQuery = `SET search_path TO ${quotedSchema};\n${query}`
    } else {
      executedQuery = query
    }

    const result = await this.executeOnPool(pool, query)
    result.original_query = query
    result.executed_query = executedQuery
    return result
  }

  async execute(query: string): Promise<QueryResult> {
    const pool = await this.getDefaultPool()
    return this.executeOnPool(pool, query)
  }

  private async executeOnPool(pool: InstanceType<typeof SQL>, query: string): Promise<QueryResult> {
    const start = performance.now()

    try {
      const rows = await pool.unsafe(query)
      const executionTimeMs = Math.round(performance.now() - start)

      if (Array.isArray(rows)) {
        const columns: ColumnInfo[] =
          rows.length > 0
            ? Object.keys(rows[0]).map((key) => ({
                name: key,
                data_type: typeof rows[0][key] === 'number' ? 'number' : typeof rows[0][key] === 'boolean' ? 'boolean' : 'string',
                nullable: true,
              }))
            : await this.getColumnsForEmptySelect(pool, query)

        const jsonRows: unknown[][] = rows.map((row: Record<string, unknown>) =>
          columns.map((col) => {
            const val = row[col.name]
            if (val === null || val === undefined) return null
            if (val instanceof Date) return val.toISOString()
            if (typeof val === 'bigint') return Number(val)
            if (typeof val === 'object') return val // JSON/JSONB
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

      const executionTimeMs2 = Math.round(performance.now() - start)
      return {
        columns: [],
        rows: [],
        affected_rows: (rows as unknown as { affectedRows?: number })?.affectedRows ?? 0,
        execution_time_ms: executionTimeMs2,
      }
    } catch (e: unknown) {
      try {
        const result = await pool.unsafe(query)
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

  private async getColumnsForEmptySelect(pool: InstanceType<typeof SQL>, query: string): Promise<ColumnInfo[]> {
    const trimmed = query.trim().toUpperCase()
    if (!trimmed.startsWith('SELECT')) return []

    const tableName = extractTableFromSelect(query)
    if (!tableName) return []

    try {
      const rows = await pool.unsafe(
        'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position',
        [tableName],
      )

      if (!Array.isArray(rows)) return []
      return rows.map((row: Record<string, unknown>) => ({
        name: String(row.column_name ?? ''),
        data_type: String(row.data_type ?? ''),
        nullable: true,
      }))
    } catch {
      return []
    }
  }

  async getDatabases(): Promise<SchemaInfo[]> {
    const pool = await this.getDefaultPool()
    const rows = await pool.unsafe(`
      SELECT datname FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname
    `)

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => ({
      name: String(row.datname ?? ''),
    }))
  }

  async getSchemas(database: string): Promise<SchemaInfo[]> {
    const pool = await this.getPool(database)
    const rows = await pool.unsafe(`
      SELECT schema_name FROM information_schema.schemata
      ORDER BY
        CASE WHEN schema_name = 'public' THEN 0 ELSE 1 END,
        schema_name
    `)

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => ({
      name: String(row.schema_name ?? ''),
    }))
  }

  async getTables(database: string, schema: string): Promise<TableInfo[]> {
    const pool = await this.getPool(database)
    const schemaName = schema || 'public'

    const rows = await pool.unsafe(
      `SELECT
        table_name, table_schema, table_type,
        (SELECT reltuples::bigint FROM pg_class WHERE relname = tables.table_name LIMIT 1) as row_count
       FROM information_schema.tables
       WHERE table_schema = $1
       ORDER BY table_name`,
      [schemaName],
    )

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => ({
      name: String(row.table_name ?? ''),
      schema: String(row.table_schema ?? ''),
      table_type: String(row.table_type ?? ''),
      row_count: row.row_count != null ? Number(row.row_count) : undefined,
    }))
  }

  async getColumns(database: string, schema: string, table: string): Promise<ColumnDetail[]> {
    const pool = await this.getPool(database)
    const schemaName = schema || 'public'

    const rows = await pool.unsafe(
      `SELECT
        c.column_name,
        CASE
          WHEN c.data_type = 'character varying' THEN 'varchar(' || COALESCE(c.character_maximum_length::text, 'max') || ')'
          WHEN c.data_type = 'character' THEN 'char(' || COALESCE(c.character_maximum_length::text, '1') || ')'
          WHEN c.data_type = 'numeric' THEN 'numeric(' || COALESCE(c.numeric_precision::text, '') || ',' || COALESCE(c.numeric_scale::text, '') || ')'
          WHEN c.data_type = 'timestamp without time zone' THEN 'timestamp'
          WHEN c.data_type = 'timestamp with time zone' THEN 'timestamptz'
          WHEN c.data_type = 'time without time zone' THEN 'time'
          WHEN c.data_type = 'time with time zone' THEN 'timetz'
          WHEN c.data_type = 'double precision' THEN 'float8'
          WHEN c.data_type = 'real' THEN 'float4'
          WHEN c.data_type = 'integer' THEN 'int4'
          WHEN c.data_type = 'smallint' THEN 'int2'
          WHEN c.data_type = 'bigint' THEN 'int8'
          WHEN c.data_type = 'boolean' THEN 'bool'
          WHEN c.data_type = 'ARRAY' THEN c.udt_name
          ELSE c.data_type
        END as data_type,
        c.is_nullable,
        CASE
          WHEN pk.column_name IS NOT NULL THEN 'PRI'
          WHEN u.column_name IS NOT NULL THEN 'UNI'
          ELSE NULL
        END as column_key,
        c.column_default,
        CASE WHEN c.column_default LIKE 'nextval%' THEN 'auto_increment' ELSE NULL END as extra
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.column_name = pk.column_name
      LEFT JOIN (
        SELECT ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'UNIQUE'
      ) u ON c.column_name = u.column_name
      WHERE c.table_schema = $1 AND c.table_name = $2
      ORDER BY c.ordinal_position`,
      [schemaName, table],
    )

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => ({
      name: String(row.column_name ?? ''),
      data_type: String(row.data_type ?? ''),
      nullable: String(row.is_nullable ?? '') === 'YES',
      key: row.column_key ? String(row.column_key) : undefined,
      default_value: row.column_default != null ? String(row.column_default) : undefined,
      extra: row.extra ? String(row.extra) : undefined,
    }))
  }

  async close(): Promise<void> {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer)
      this.evictionTimer = null
    }
    for (const entry of this.pools.values()) {
      await entry.sql.close()
    }
    this.pools.clear()
  }
}
