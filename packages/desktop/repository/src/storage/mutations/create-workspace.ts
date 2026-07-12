import type { Workspace, WorkspaceConfig } from '@anko/desktop-domain'
import { AppError } from '@anko/desktop-domain'
import { workspaceTable } from '@anko/desktop-domain/db'
import { getDb } from '../client'
import { getWorkspaceById } from '../queries/get-workspace'

export function createWorkspace(config: WorkspaceConfig): Workspace {
  const id = crypto.randomUUID()

  getDb()
    .insert(workspaceTable)
    .values({ id, name: config.name, icon: config.icon, isDefault: false })
    .run()

  const workspace = getWorkspaceById(id)
  if (!workspace) throw AppError.notFound('Workspace not found')
  return workspace
}
