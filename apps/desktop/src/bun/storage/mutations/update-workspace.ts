import { eq, sql } from 'drizzle-orm'
import { AppError } from '../../error'
import { getDb } from '../client'
import type { Workspace, WorkspaceConfig } from '../entities'
import { getWorkspaceById } from '../queries/get-workspace'
import { workspaceTable } from '../schema'

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
