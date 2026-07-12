import { quoteIdentifier } from '@/lib/sql-generator'
import type { DatabaseDriver, FilterCondition } from '@/types'

/**
 * Validates and sanitizes a column name to prevent SQL injection.
 * Only allows alphanumeric characters, underscores, and dollar signs.
 * Rejects backticks, quotes, or other special SQL characters.
 */
export function sanitizeColumnName(column: string): string | null {
  // Column names should only contain alphanumeric, underscore, or $ (for some DBs)
  // This prevents SQL injection via malicious column names
  const validPattern = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/
  if (!validPattern.test(column)) {
    console.warn(`[SQL] Invalid column name rejected: ${column}`)
    return null
  }
  return column
}

export function buildWhereClause(filters: FilterCondition[], driver?: DatabaseDriver): string {
  if (filters.length === 0) return ''

  const conditions = filters
    .map((f): string | null => {
      const sanitizedColumn = sanitizeColumnName(f.column)
      if (!sanitizedColumn) {
        return null // Skip invalid column names
      }
      const quotedColumn = quoteIdentifier(sanitizedColumn, driver)
      const escapedValue = f.value.replace(/'/g, "''")
      switch (f.operator) {
        case 'equals':
          return `${quotedColumn} = '${escapedValue}'`
        case 'not_equals':
          return `${quotedColumn} != '${escapedValue}'`
        case 'like':
          return `${quotedColumn} LIKE '%${escapedValue}%'`
        case 'not_like':
          return `${quotedColumn} NOT LIKE '%${escapedValue}%'`
        case 'gt':
          return `${quotedColumn} > '${escapedValue}'`
        case 'gte':
          return `${quotedColumn} >= '${escapedValue}'`
        case 'lt':
          return `${quotedColumn} < '${escapedValue}'`
        case 'lte':
          return `${quotedColumn} <= '${escapedValue}'`
        case 'is_null':
          return `${quotedColumn} IS NULL`
        case 'is_not_null':
          return `${quotedColumn} IS NOT NULL`
        default:
          return null
      }
    })
    .filter((c): c is string => c !== null)

  if (conditions.length === 0) return ''
  return `WHERE ${conditions.join(' AND ')}`
}
