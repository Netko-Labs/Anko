import { desc, eq } from 'drizzle-orm'
import type { QueryHistoryEntry } from '../entities'
import { getDb } from '../client'
import { queryHistoryTable } from '../schema'

export function listQueryHistory(connectionId?: string, limit?: number): QueryHistoryEntry[] {
  const lim = limit ?? 100

  const query = connectionId
    ? getDb()
        .select()
        .from(queryHistoryTable)
        .where(eq(queryHistoryTable.connectionId, connectionId))
        .orderBy(desc(queryHistoryTable.executedAt))
        .limit(lim)
    : getDb()
        .select()
        .from(queryHistoryTable)
        .orderBy(desc(queryHistoryTable.executedAt))
        .limit(lim)

  return query.all().map((row) => ({
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
  }))
}
