import { AppError } from '../../error'
import type { Workspace, WorkspaceConfig } from '../entities'
import { getDb } from '../client'
import { workspaceTable } from '../schema'
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
