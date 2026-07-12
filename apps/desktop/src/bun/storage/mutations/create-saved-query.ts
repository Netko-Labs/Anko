import { AppError } from '../../error'
import { getDb } from '../client'
import type { CreateSavedQueryInput, SavedQuery } from '../entities'
import { getSavedQueryById } from '../queries/get-saved-query'
import { savedQueryTable } from '../schema'

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
