import { eq, sql } from 'drizzle-orm'
import { AppError } from '@anko/desktop-domain'
import { getDb } from '../client'
import type { SavedQuery, UpdateSavedQueryInput } from '@anko/desktop-domain'
import { getSavedQueryById } from '../queries/get-saved-query'
import { savedQueryTable } from '@anko/desktop-domain/db'

export function updateSavedQuery(id: string, input: UpdateSavedQueryInput): SavedQuery {
  const existing = getSavedQueryById(id)
  if (!existing) throw AppError.storage(`Saved query not found: ${id}`)

  getDb()
    .update(savedQueryTable)
    .set({
      name: input.name ?? existing.name,
      query: input.query ?? existing.query,
      description: input.description ?? existing.description,
      workspaceId: input.workspaceId ?? existing.workspaceId,
      connectionId: input.connectionId ?? existing.connectionId,
      databaseName: input.databaseName ?? existing.databaseName,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(savedQueryTable.id, id))
    .run()

  const result = getSavedQueryById(id)
  if (!result) throw AppError.storage('Failed to retrieve updated saved query')
  return result
}
