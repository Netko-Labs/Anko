// conventions: >300 lines — one DatabaseConnector with pooled per-database SQL,
// catalog queries, and ERD assembly; no clean seam without live-DB verification;
// split when next touched.

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

const POOL_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Formats a Postgres `information_schema.columns` row (unaliased) into a concise
 * exact type (e.g. `varchar(255)`, `numeric(10,2)`, `int4`, `timestamptz`).
 * Mirrors getColumns' formatting so result types match the schema browser.
 */
const PG_FORMATTED_TYPE = `
  CASE
    WHEN data_type = 'character varying' THEN 'varchar(' || COALESCE(character_maximum_length::text, 'max') || ')'
    WHEN data_type = 'character' THEN 'char(' || COALESCE(character_maximum_length::text, '1') || ')'
    WHEN data_type = 'numeric' THEN 'numeric(' || COALESCE(numeric_precision::text, '') || ',' || COALESCE(numeric_scale::text, '') || ')'
    WHEN data_type = 'timestamp without time zone' THEN 'timestamp'
    WHEN data_type = 'timestamp with time zone' THEN 'timestamptz'
    WHEN data_type = 'time without time zone' THEN 'time'
    WHEN data_type = 'time with time zone' THEN 'timetz'
    WHEN data_type = 'double precision' THEN 'float8'
    WHEN data_type = 'real' THEN 'float4'
    WHEN data_type = 'integer' THEN 'int4'
    WHEN data_type = 'smallint' THEN 'int2'
    WHEN data_type = 'bigint' THEN 'int8'
    WHEN data_type = 'boolean' THEN 'bool'
    WHEN data_type = 'ARRAY' THEN udt_name
    ELSE data_type
  END`
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
  private typeCache = new TypeMapCache()

  private constructor(
    config: ConnectionConfig,
    defaultSql: InstanceType<typeof SQL>,
    defaultDatabase: string,
  ) {
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
        adapter: 'postgres',
      })

      // Test the connection
      await sql`SELECT 1`

      return new PostgresConnector(config, sql, defaultDatabase)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw AppError.database(
        `Failed to connect to PostgreSQL at ${config.host}:${config.port} - ${msg}`,
      )
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
        adapter: 'postgres',
      })

      await sql`SELECT 1`

      this.pools.set(database, { sql, lastUsed: Date.now() })
      console.log(`[PostgreSQL] Pool created for database: ${database}`)
      return sql
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw AppError.database(
        `Failed to connect to PostgreSQL database '${database}' at ${this.config.host}:${this.config.port} - ${msg}`,
      )
    }
  }

  private async getDefaultPool(): Promise<InstanceType<typeof SQL>> {
    return this.getPool(this.defaultDatabase)
  }

  async executeWithContext(
    query: string,
    database?: string,
    schema?: string,
    signal?: AbortSignal,
  ): Promise<QueryResult> {
    const pool = database ? await this.getPool(database) : await this.getDefaultPool()

    // Set search_path if schema specified
    let executedQuery: string
    if (schema) {
      const quotedSchema = `"${schema.replace(/"/g, '""')}"`
      await pool.unsafe(`SET search_path TO ${quotedSchema}`)
      executedQuery = `SET search_path TO ${quotedSchema};\n${query}`
    } else {
      executedQuery = query
    }

    const result = await this.executeOnPool(pool, query, signal)
    result.original_query = query
    result.executed_query = executedQuery
    return result
  }

  async executeReadOnlyWithContext(
    query: string,
    database?: string,
    schema?: string,
    signal?: AbortSignal,
  ): Promise<QueryResult> {
    const pool = database ? await this.getPool(database) : await this.getDefaultPool()
    return pool.begin('read only', async (transaction) => {
      if (schema) {
        const quotedSchema = `"${schema.replace(/"/g, '""')}"`
        await transaction.unsafe(`SET LOCAL search_path TO ${quotedSchema}`)
      }
      return this.executeOnPool(transaction as unknown as InstanceType<typeof SQL>, query, signal)
    })
  }

  async execute(query: string): Promise<QueryResult> {
    const pool = await this.getDefaultPool()
    return this.executeOnPool(pool, query)
  }

  private async executeOnPool(
    pool: InstanceType<typeof SQL>,
    query: string,
    signal?: AbortSignal,
  ): Promise<QueryResult> {
    const start = performance.now()

    try {
      const pending = pool.unsafe(query)
      const cancel = () => pending.cancel()
      signal?.addEventListener('abort', cancel, { once: true })
      if (signal?.aborted) pending.cancel()
      const rows = await pending.finally(() => signal?.removeEventListener('abort', cancel))
      const executionTimeMs = Math.round(performance.now() - start)

      if (Array.isArray(rows)) {
        // Exact column types from the catalog for the queried table; falls back
        // to the value's JS type for aliases/expressions/joined columns.
        const table = extractTableFromSelect(query)
        const typeMap = table ? await this.getColumnTypeMap(pool, table) : new Map()
        const columns: ColumnInfo[] =
          rows.length > 0 ? buildColumnsFromRow(rows[0], typeMap) : buildColumnsFromTypeMap(typeMap)

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

  /**
   * Exact column types for a table, keyed by column name, formatted like
   * getColumns (`varchar(255)`, `int4`, `timestamptz`, …). Scoped to the first
   * schema on the pool's search_path (set by executeWithContext). Cached.
   */
  private async getColumnTypeMap(
    pool: InstanceType<typeof SQL>,
    table: string,
  ): Promise<Map<string, ColumnTypeInfo>> {
    const cached = this.typeCache.get(table)
    if (cached) return cached

    const map = new Map<string, ColumnTypeInfo>()
    try {
      const rows = await pool.unsafe(
        `SELECT column_name, ${PG_FORMATTED_TYPE} AS data_type, is_nullable
         FROM information_schema.columns
         WHERE table_name = $1 AND table_schema = current_schema()
         ORDER BY ordinal_position`,
        [table],
      )
      if (Array.isArray(rows)) {
        for (const row of rows as Record<string, unknown>[]) {
          const name = String(row.column_name ?? '')
          if (!name) continue
          map.set(name, {
            dataType: String(row.data_type ?? ''),
            nullable: String(row.is_nullable ?? '') === 'YES',
          })
        }
      }
    } catch {
      // Unresolvable (cross-schema table, permissions, etc.) — caller falls back.
    }
    this.typeCache.set(table, map)
    return map
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
        t.table_name, t.table_schema, t.table_type,
        c.reltuples::bigint as row_count
       FROM information_schema.tables t
       LEFT JOIN pg_namespace n ON n.nspname = t.table_schema
       LEFT JOIN pg_class c ON c.relname = t.table_name AND c.relnamespace = n.oid
       WHERE t.table_schema = $1
       ORDER BY t.table_name`,
      [schemaName],
    )

    if (!Array.isArray(rows)) return []
    return rows.map((row: Record<string, unknown>) => {
      // Postgres uses reltuples = -1 to mean "never analyzed / unknown" (PG 14+),
      // so treat any negative estimate as no count rather than showing -1.
      const estimate = row.row_count != null ? Number(row.row_count) : undefined
      return {
        name: String(row.table_name ?? ''),
        schema: String(row.table_schema ?? ''),
        table_type: String(row.table_type ?? ''),
        row_count: estimate != null && estimate >= 0 ? estimate : undefined,
      }
    })
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

  async getErdSchema(database: string, schema?: string): Promise<ErdSchema> {
    const pool = await this.getPool(database)
    const schemaName = schema || 'public'

    const tableRows = await pool.unsafe(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      [schemaName],
    )
    const colRows = await pool.unsafe(
      `SELECT table_name, column_name, ${PG_FORMATTED_TYPE} AS data_type, is_nullable,
              is_identity, column_default
       FROM information_schema.columns
       WHERE table_schema = $1
       ORDER BY table_name, ordinal_position`,
      [schemaName],
    )
    const pkRows = await pool.unsafe(
      `SELECT kcu.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1`,
      [schemaName],
    )
    const uniqueRows = await pool.unsafe(
      `SELECT kcu.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = $1`,
      [schemaName],
    )
    const fkRows = await pool.unsafe(
      `SELECT tc.table_name AS from_table, kcu.column_name AS from_column,
              ccu.table_name AS to_table, ccu.column_name AS to_column, tc.constraint_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1`,
      [schemaName],
    )

    const tableNames = (Array.isArray(tableRows) ? tableRows : []).map(
      (r: Record<string, unknown>) => String(r.table_name ?? ''),
    )
    const pkSet = new Set(
      (Array.isArray(pkRows) ? pkRows : []).map(
        (r: Record<string, unknown>) =>
          `${String(r.table_name ?? '')}.${String(r.column_name ?? '')}`,
      ),
    )
    const uniqueSet = new Set(
      (Array.isArray(uniqueRows) ? uniqueRows : []).map(
        (r: Record<string, unknown>) =>
          `${String(r.table_name ?? '')}.${String(r.column_name ?? '')}`,
      ),
    )
    const columns: RawErdColumn[] = (Array.isArray(colRows) ? colRows : []).map(
      (r: Record<string, unknown>) => {
        const table = String(r.table_name ?? '')
        const name = String(r.column_name ?? '')
        const def = r.column_default != null ? String(r.column_default) : undefined
        const isIdentity = String(r.is_identity ?? '') === 'YES'
        return {
          table,
          name,
          data_type: String(r.data_type ?? ''),
          nullable: String(r.is_nullable ?? '') === 'YES',
          isPrimaryKey: pkSet.has(`${table}.${name}`),
          isUnique: uniqueSet.has(`${table}.${name}`),
          isAutoIncrement: isIdentity || (def?.startsWith('nextval(') ?? false),
          defaultValue: def,
        }
      },
    )
    const fks: RawErdForeignKey[] = (Array.isArray(fkRows) ? fkRows : []).map(
      (r: Record<string, unknown>) => ({
        fromTable: String(r.from_table ?? ''),
        fromColumn: String(r.from_column ?? ''),
        toTable: String(r.to_table ?? ''),
        toColumn: String(r.to_column ?? ''),
        constraintName: String(r.constraint_name ?? '') || undefined,
      }),
    )

    return assembleErdSchema(tableNames, columns, fks)
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
