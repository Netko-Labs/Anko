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

export class SqliteConnector implements DatabaseConnector {
  private sql: InstanceType<typeof SQL>
  private readOnlySql: InstanceType<typeof SQL>
  private typeCache = new TypeMapCache()

  private constructor(sql: InstanceType<typeof SQL>, readOnlySql: InstanceType<typeof SQL>) {
    this.sql = sql
    this.readOnlySql = readOnlySql
  }

  static async connect(config: ConnectionConfig): Promise<SqliteConnector> {
    try {
      // For SQLite, `host` holds the file path — resolve relative paths from CWD
      const raw = config.host || ':memory:'
      const filename = raw === ':memory:' || raw.startsWith('/') ? raw : `${process.cwd()}/${raw}`
      const sql = new SQL({
        adapter: 'sqlite',
        filename,
      })
      const readOnlySql =
        filename === ':memory:'
          ? sql
          : new SQL({
              adapter: 'sqlite',
              filename,
              readonly: true,
            })

      // Test the connection
      await sql`SELECT 1`

      return new SqliteConnector(sql, readOnlySql)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      throw AppError.database(`Failed to open SQLite database "${config.host}" - ${msg}`)
    }
  }

  async executeWithContext(
    query: string,
    _database?: string,
    _context?: string,
    signal?: AbortSignal,
  ): Promise<QueryResult> {
    // SQLite has no database/schema switching
    const result = await this.executeOnSql(this.sql, query, signal)
    result.original_query = query
    result.executed_query = query
    return result
  }

  async executeReadOnlyWithContext(
    query: string,
    _database?: string,
    _context?: string,
    signal?: AbortSignal,
  ): Promise<QueryResult> {
    if (this.readOnlySql === this.sql) {
      return this.sql.begin(async (transaction) => {
        await transaction.unsafe('PRAGMA query_only = ON')
        try {
          return this.executeOnSql(
            transaction as unknown as InstanceType<typeof SQL>,
            query,
            signal,
          )
        } finally {
          await transaction.unsafe('PRAGMA query_only = OFF')
        }
      })
    }
    return this.readOnlySql.begin(async (transaction) =>
      this.executeOnSql(transaction as unknown as InstanceType<typeof SQL>, query, signal),
    )
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
      const pending = sql.unsafe(query)
      const cancel = () => pending.cancel()
      signal?.addEventListener('abort', cancel, { once: true })
      if (signal?.aborted) pending.cancel()
      const rows = await pending.finally(() => signal?.removeEventListener('abort', cancel))
      const executionTimeMs = Math.round(performance.now() - start)

      if (Array.isArray(rows)) {
        // Exact column types from the table's schema (PRAGMA); falls back to the
        // value's JS type for aliases/expressions/joined columns.
        const table = extractTableFromSelect(query)
        const typeMap = table ? await this.getColumnTypeMap(table) : new Map()
        const columns: ColumnInfo[] =
          rows.length > 0 ? buildColumnsFromRow(rows[0], typeMap) : buildColumnsFromTypeMap(typeMap)

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

  /**
   * Exact column types for a table, keyed by column name, from the declared
   * schema (PRAGMA table_info → e.g. `integer`, `text`, `varchar(50)`). Mirrors
   * getColumns so result types match the schema browser. Cached.
   */
  private async getColumnTypeMap(table: string): Promise<Map<string, ColumnTypeInfo>> {
    const cached = this.typeCache.get(table)
    if (cached) return cached

    const map = new Map<string, ColumnTypeInfo>()
    try {
      const rows = await this.sql.unsafe(`PRAGMA table_info("${table.replace(/"/g, '""')}")`)
      if (Array.isArray(rows)) {
        for (const row of rows as Record<string, unknown>[]) {
          const name = String(row.name ?? '')
          if (!name) continue
          map.set(name, {
            dataType: String(row.type ?? '').toLowerCase() || 'text',
            nullable: Number(row.notnull ?? 0) === 0,
          })
        }
      }
    } catch {
      // Not a real table (expression/pragma result) — caller falls back.
    }
    this.typeCache.set(table, map)
    return map
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

  async getColumns(_database: string, _schema: string, table: string): Promise<ColumnDetail[]> {
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

  async getErdSchema(): Promise<ErdSchema> {
    const tableRows = await this.sql`
      SELECT name FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
    const tableNames = (Array.isArray(tableRows) ? tableRows : []).map(
      (r: Record<string, unknown>) => String(r.name ?? ''),
    )

    const columns: RawErdColumn[] = []
    const fks: RawErdForeignKey[] = []

    // SQLite has no batch catalog query; PRAGMA is per-table (DBs are small).
    for (const table of tableNames) {
      const quoted = `"${table.replace(/"/g, '""')}"`

      // Columns participating in a UNIQUE index (for the unique modifier badge).
      const uniqueColumns = new Set<string>()
      const indexList = await this.sql.unsafe(`PRAGMA index_list(${quoted})`)
      if (Array.isArray(indexList)) {
        for (const idx of indexList as Record<string, unknown>[]) {
          if (Number(idx.unique ?? 0) !== 1) continue
          const idxName = String(idx.name ?? '')
          if (!idxName) continue
          const info = await this.sql.unsafe(`PRAGMA index_info("${idxName.replace(/"/g, '""')}")`)
          if (Array.isArray(info)) {
            for (const ic of info as Record<string, unknown>[]) {
              uniqueColumns.add(String(ic.name ?? ''))
            }
          }
        }
      }

      const colRows = await this.sql.unsafe(`PRAGMA table_info(${quoted})`)
      if (Array.isArray(colRows)) {
        for (const r of colRows as Record<string, unknown>[]) {
          const name = String(r.name ?? '')
          const type = String(r.type ?? '').toLowerCase() || 'text'
          const isPk = Number(r.pk ?? 0) > 0
          const def = r.dflt_value
          columns.push({
            table,
            name,
            data_type: type,
            nullable: Number(r.notnull ?? 0) === 0,
            isPrimaryKey: isPk,
            isUnique: uniqueColumns.has(name),
            // INTEGER PRIMARY KEY is SQLite's rowid alias (auto-incrementing).
            isAutoIncrement: isPk && type === 'integer',
            defaultValue: def != null ? String(def) : undefined,
          })
        }
      }

      const fkList = await this.sql.unsafe(`PRAGMA foreign_key_list(${quoted})`)
      if (Array.isArray(fkList)) {
        for (const r of fkList as Record<string, unknown>[]) {
          fks.push({
            fromTable: table,
            fromColumn: String(r.from ?? ''),
            toTable: String(r.table ?? ''),
            toColumn: String(r.to ?? ''),
            constraintName: undefined,
          })
        }
      }
    }

    return assembleErdSchema(tableNames, columns, fks)
  }

  async close(): Promise<void> {
    if (this.readOnlySql !== this.sql) await this.readOnlySql.close()
    await this.sql.close()
  }
}
