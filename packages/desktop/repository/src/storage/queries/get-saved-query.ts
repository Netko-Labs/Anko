import type { SavedQuery } from '@anko/desktop-domain'
import { savedQueryTable } from '@anko/desktop-domain/db'
import { eq } from 'drizzle-orm'
import { getDb } from '../client'

export function getSavedQueryById(id: string): SavedQuery | null {
  const [row] = getDb().select().from(savedQueryTable).where(eq(savedQueryTable.id, id)).all()

  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    query: row.query,
    description: row.description ?? null,
    workspaceId: row.workspaceId ?? null,
    connectionId: row.connectionId ?? null,
    databaseName: row.databaseName ?? null,
    createdAt: row.createdAt ?? '',
    updatedAt: row.updatedAt ?? '',
  }
}
