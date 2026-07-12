import { and, eq } from 'drizzle-orm'
import { AppError } from '@anko/desktop-domain'
import { getDb } from '../client'
import { getWorkspaceById } from '../queries/get-workspace'
import { workspaceTable } from '@anko/desktop-domain/db'

export function deleteWorkspace(id: string): void {
  const workspace = getWorkspaceById(id)
  if (workspace?.is_default) {
    throw AppError.validation('Cannot delete the default workspace')
  }

  getDb()
    .delete(workspaceTable)
    .where(and(eq(workspaceTable.id, id), eq(workspaceTable.isDefault, false)))
    .run()
}
