import { asc, count, eq, lt, sql } from 'drizzle-orm'
import { AppError } from '../../error'
import type { AddQueryHistoryInput, QueryHistoryEntry } from '../entities'
import { getDb } from '../client'
import { queryHistoryTable } from '../schema'
import { getQueryHistoryEntry } from '../queries/get-query-history-entry'

const MAX_HISTORY_ENTRIES = 1000
const HISTORY_RETENTION_DAYS = 30

export function addQueryHistory(input: AddQueryHistoryInput): QueryHistoryEntry {
  cleanup()

  const id = crypto.randomUUID()

  getDb()
    .insert(queryHistoryTable)
    .values({
      id,
      query: input.query,
      connectionId: input.connectionId,
      connectionName: input.connectionName,
      databaseName: input.databaseName ?? null,
      executionTimeMs: input.executionTimeMs ?? null,
      rowCount: input.rowCount ?? null,
      success: input.success,
      errorMessage: input.errorMessage ?? null,
    })
    .run()

  const entry = getQueryHistoryEntry(id)
  if (!entry) throw AppError.storage('Failed to retrieve created history entry')
  return entry
}

function cleanup() {
  const db = getDb()

  // Delete entries older than retention period
  db.delete(queryHistoryTable)
    .where(
      lt(
        queryHistoryTable.executedAt,
        sql`datetime('now', '-${sql.raw(String(HISTORY_RETENTION_DAYS))} days')`,
      ),
    )
    .run()

  // Enforce max entry count
  const [result] = db.select({ total: count() }).from(queryHistoryTable).all()
  const total = result?.total ?? 0

  if (total >= MAX_HISTORY_ENTRIES) {
    const toDelete = total - MAX_HISTORY_ENTRIES + 1
    const oldestIds = db
      .select({ id: queryHistoryTable.id })
      .from(queryHistoryTable)
      .orderBy(asc(queryHistoryTable.executedAt))
      .limit(toDelete)
      .all()
      .map((r) => r.id)

    for (const oldId of oldestIds) {
      db.delete(queryHistoryTable).where(eq(queryHistoryTable.id, oldId)).run()
    }
  }
}
