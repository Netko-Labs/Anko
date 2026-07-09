import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import type { QueryHistoryEntry } from '../entities'
import { queryHistoryTable } from '../schema'

export function getQueryHistoryEntry(id: string): QueryHistoryEntry | null {
  const [row] = getDb().select().from(queryHistoryTable).where(eq(queryHistoryTable.id, id)).all()

  if (!row) return null

  return {
    id: row.id,
    query: row.query,
    connectionId: row.connectionId,
    connectionName: row.connectionName,
    databaseName: row.databaseName ?? null,
    executedAt: row.executedAt ?? '',
    executionTimeMs: row.executionTimeMs ?? null,
    rowCount: row.rowCount ?? null,
    success: row.success,
    errorMessage: row.errorMessage ?? null,
  }
}
