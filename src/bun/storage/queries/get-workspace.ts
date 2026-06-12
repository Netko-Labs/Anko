import { eq } from 'drizzle-orm'
import type { Workspace } from '../entities'
import { getDb } from '../client'
import { workspaceTable } from '../schema'
import { getWorkspaceConnections } from './get-workspace-connections'

export function getWorkspaceById(id: string): Workspace | null {
  const [row] = getDb()
    .select()
    .from(workspaceTable)
    .where(eq(workspaceTable.id, id))
    .all()

  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    is_default: row.isDefault,
    connection_ids: getWorkspaceConnections(row.id),
    created_at: row.createdAt ?? '',
    updated_at: row.updatedAt ?? '',
  }
}
