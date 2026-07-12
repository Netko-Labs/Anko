import { AppError } from '../../error'
import { getDb } from '../client'
import type { Workspace, WorkspaceConfig } from '../entities'
import { getWorkspaceById } from '../queries/get-workspace'
import { workspaceTable } from '../schema'

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
