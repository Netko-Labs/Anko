import type { QueryResult } from '@/types'

/**
 * Escapes a value for CSV format.
 * Handles quotes, commas, and newlines.
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) return ''

  const str = String(value)
  // If the value contains quotes, commas, or newlines, wrap in quotes and escape existing quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Triggers a browser download for the given content.
 */
function downloadFile(content: string, filename: string, mimeType: string): boolean {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return true
}

/**
 * Exports query results to CSV format and saves to file.
 */
export async function exportToCSV(
  result: QueryResult,
  defaultFilename = 'export',
): Promise<boolean> {
  if (!result || result.columns.length === 0 || result.rows.length === 0) {
    throw new Error('No data to export')
  }

  // Build CSV content
  const headers = result.columns.map((col) => escapeCSVValue(col.name)).join(',')
  const rows = result.rows.map((row) => row.map((cell) => escapeCSVValue(cell)).join(','))
  const csvContent = [headers, ...rows].join('\n')

  return downloadFile(csvContent, `${defaultFilename}.csv`, 'text/csv')
}

/**
 * Exports query results to JSON format and saves to file.
 */
export async function exportToJSON(
  result: QueryResult,
  defaultFilename = 'export',
): Promise<boolean> {
  if (!result || result.columns.length === 0 || result.rows.length === 0) {
    throw new Error('No data to export')
  }

  // Convert rows to array of objects
  const data = result.rows.map((row) => {
    const obj: Record<string, unknown> = {}
    result.columns.forEach((col, index) => {
      obj[col.name] = row[index]
    })
    return obj
  })

  const jsonContent = JSON.stringify(data, null, 2)

  return downloadFile(jsonContent, `${defaultFilename}.json`, 'application/json')
}

/**
 * Escapes a value for SQL INSERT statement.
 */
function escapeSQLValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'

  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? '1' : '0'

  // Escape single quotes for strings
  const str = String(value)
  return `'${str.replace(/'/g, "''")}'`
}

/**
 * Exports query results to SQL INSERT statements and saves to file.
 */
export async function exportToSQL(
  result: QueryResult,
  tableName = 'table_name',
  defaultFilename = 'export',
): Promise<boolean> {
  if (!result || result.columns.length === 0 || result.rows.length === 0) {
    throw new Error('No data to export')
  }

  const columnNames = result.columns.map((col) => `\`${col.name}\``).join(', ')

  // Generate INSERT statements
  const insertStatements = result.rows.map((row) => {
    const values = row.map((cell) => escapeSQLValue(cell)).join(', ')
    return `INSERT INTO \`${tableName}\` (${columnNames}) VALUES (${values});`
  })

  const sqlContent = insertStatements.join('\n')

  return downloadFile(sqlContent, `${defaultFilename}.sql`, 'application/sql')
}
