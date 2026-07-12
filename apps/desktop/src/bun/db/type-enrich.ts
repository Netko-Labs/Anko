/**
 * Result-column type enrichment shared by the connectors.
 *
 * Bun.SQL returns plain row objects with no column-type metadata, so a bare
 * result only knows each value's JS runtime type (number/boolean/string). To
 * surface the *exact* database type (e.g. `varchar(255)`, `timestamptz`,
 * `decimal(10,2)`, `json`), each connector looks the column up in the catalog
 * (information_schema / PRAGMA) for the table the query targets and merges those
 * types in by column name. Columns that don't map to a real table column
 * (aliases, expressions, joins to other tables) fall back to the JS type.
 */

import type { ColumnInfo } from './connector'

/** Catalog-derived type info for a single column. */
export interface ColumnTypeInfo {
  dataType: string
  nullable: boolean
}

/** Coarse fallback type from a JS value, used when the catalog has no match. */
export function jsTypeOf(val: unknown): string {
  if (typeof val === 'number' || typeof val === 'bigint') return 'number'
  if (typeof val === 'boolean') return 'boolean'
  return 'string'
}

/**
 * Build result columns from the first row, preferring exact catalog types and
 * falling back to the value's JS type for unmapped columns. Preserves the
 * SELECT's column order (the row's key order).
 */
export function buildColumnsFromRow(
  firstRow: Record<string, unknown>,
  typeMap: Map<string, ColumnTypeInfo>,
): ColumnInfo[] {
  return Object.keys(firstRow).map((name) => {
    const info = typeMap.get(name)
    return {
      name,
      data_type: info?.dataType ?? jsTypeOf(firstRow[name]),
      nullable: info?.nullable ?? true,
    }
  })
}

/** Build columns for an empty result set straight from the catalog type map. */
export function buildColumnsFromTypeMap(typeMap: Map<string, ColumnTypeInfo>): ColumnInfo[] {
  return [...typeMap.entries()].map(([name, info]) => ({
    name,
    data_type: info.dataType,
    nullable: info.nullable,
  }))
}

/**
 * Tiny TTL cache for per-table column type maps, so paging through a table
 * doesn't re-hit the catalog on every page. Short TTL keeps it roughly current
 * if a column's type changes mid-session.
 */
export class TypeMapCache {
  private cache = new Map<string, { map: Map<string, ColumnTypeInfo>; expires: number }>()
  private readonly ttlMs: number

  constructor(ttlMs = 10_000) {
    this.ttlMs = ttlMs
  }

  get(key: string): Map<string, ColumnTypeInfo> | undefined {
    const entry = this.cache.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expires) {
      this.cache.delete(key)
      return undefined
    }
    return entry.map
  }

  set(key: string, map: Map<string, ColumnTypeInfo>): void {
    this.cache.set(key, { map, expires: Date.now() + this.ttlMs })
  }

  clear(): void {
    this.cache.clear()
  }
}
