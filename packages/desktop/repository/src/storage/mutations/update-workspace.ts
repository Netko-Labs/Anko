import type { Workspace, WorkspaceConfig } from '@anko/desktop-domain'
import { AppError } from '@anko/desktop-domain'
import { workspaceTable } from '@anko/desktop-domain/db'
import { eq, sql } from 'drizzle-orm'
import { getDb } from '../client'
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
