import { asc, eq, isNull, or } from 'drizzle-orm'
import { getDb } from '../client'
import type { SavedQuery } from '../entities'
import { savedQueryTable } from '../schema'

export function listSavedQueries(workspaceId?: string): SavedQuery[] {
  const query = workspaceId
    ? getDb()
        .select()
        .from(savedQueryTable)
        .where(
          or(eq(savedQueryTable.workspaceId, workspaceId), isNull(savedQueryTable.workspaceId)),
        )
        .orderBy(asc(savedQueryTable.name))
    : getDb().select().from(savedQueryTable).orderBy(asc(savedQueryTable.name))

  return query.all().map((row) => ({
    id: row.id,
    name: row.name,
    query: row.query,
    description: row.description ?? null,
    workspaceId: row.workspaceId ?? null,
    connectionId: row.connectionId ?? null,
    databaseName: row.databaseName ?? null,
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  }))
}
