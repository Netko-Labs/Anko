import { eq, sql } from 'drizzle-orm'
import { AppError } from '../../error'
import type { Workspace, WorkspaceConfig } from '../entities'
import { getDb } from '../client'
import { workspaceTable } from '../schema'
import { getWorkspaceById } from '../queries/get-workspace'

export function updateWorkspace(id: string, config: WorkspaceConfig): Workspace {
  getDb()
    .update(workspaceTable)
    .set({
      name: config.name,
      icon: config.icon,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(workspaceTable.id, id))
    .run()

  const workspace = getWorkspaceById(id)
  if (!workspace) throw AppError.notFound('Workspace not found')
  return workspace
}
