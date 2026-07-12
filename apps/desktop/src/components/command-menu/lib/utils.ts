/**
 * Custom filter with group-based search priorities.
 * Item values are prefixed with `group:` so the filter can
 * assign higher scores to more relevant categories.
 *
 * Priority (highest first):
 *   tab=4, table=3, conn=3, action=3, saved=2, theme=2, history=1, newtab=3
 */
export function priorityFilter(value: string, search: string): number {
  const colonIdx = value.indexOf(':')
  const group = colonIdx >= 0 ? value.slice(0, colonIdx) : ''
  const text = colonIdx >= 0 ? value.slice(colonIdx + 1) : value

  if (!text.toLowerCase().includes(search.toLowerCase())) return 0

  const priorities: Record<string, number> = {
    tab: 4,
    table: 3,
    conn: 3,
    action: 3,
    newtab: 3,
    saved: 2,
    theme: 2,
    history: 1,
  }
  return priorities[group] ?? 1
}

export function truncateQuery(query: string, maxLen: number): string {
  const trimmed = query.trim().replace(/\s+/g, ' ')
  return trimmed.length > maxLen ? `${trimmed.slice(0, maxLen)}...` : trimmed
}
