import type { CreateSavedQueryInput, SavedQuery } from '@anko/desktop-domain'
import { AppError } from '@anko/desktop-domain'
import { savedQueryTable } from '@anko/desktop-domain/db'
import { getDb } from '../client'
import { getSavedQueryById } from '../queries/get-saved-query'

export function createSavedQuery(input: CreateSavedQueryInput): SavedQuery {
  const id = crypto.randomUUID()

  getDb()
    .insert(savedQueryTable)
    .values({
      id,
      name: input.name,
      query: input.query,
      description: input.description ?? null,
      workspaceId: input.workspaceId ?? null,
      connectionId: input.connectionId ?? null,
      databaseName: input.databaseName ?? null,
    })
    .run()

  const result = getSavedQueryById(id)
  if (!result) throw AppError.storage('Failed to retrieve created saved query')
  return result
}
