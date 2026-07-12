export function extractTableFromSelect(query: string): string | undefined {
  const upper = query.toUpperCase()
  const fromPos = upper.indexOf(' FROM ')
  if (fromPos === -1) return undefined

  const afterFrom = query.slice(fromPos + 6).trimStart()

  const endKeywords = [
    ' WHERE ',
    ' ORDER ',
    ' LIMIT ',
    ' GROUP ',
    ' HAVING ',
    ' JOIN ',
    ' LEFT ',
    ' RIGHT ',
    ' INNER ',
    ' OUTER ',
    ';',
  ]
  const upperAfter = afterFrom.toUpperCase()

  let endPos = afterFrom.length
  for (const kw of endKeywords) {
    const pos = upperAfter.indexOf(kw)
    if (pos !== -1 && pos < endPos) {
      endPos = pos
    }
  }

  const tablePart = afterFrom.slice(0, endPos).trim()

  // Handle schema.table format - extract just the table name
  const tableName = tablePart.includes('.') ? tablePart.split('.').pop()! : tablePart

  // Remove quotes (backticks, double quotes, single quotes)
  const cleaned = tableName.replace(/^[`"']|[`"']$/g, '')

  return cleaned || undefined
}
