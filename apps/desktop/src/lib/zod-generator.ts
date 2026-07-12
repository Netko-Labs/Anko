/** Format JSON value for display */
export function formatValue(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** Check if value looks like JSON */
export function isJsonLike(value: unknown): boolean {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  )
}

/** Try to parse and pretty-print JSON */
export function prettyPrintJson(value: string): string {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value
  }
}
