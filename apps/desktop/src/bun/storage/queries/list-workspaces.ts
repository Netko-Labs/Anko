import { asc, desc } from 'drizzle-orm'
import { getDb } from '../client'
import type { Workspace } from '../entities'
import { workspaceTable } from '../schema'
import { getWorkspaceConnections } from './get-workspace-connections'

export function listWorkspaces(): Workspace[] {
  const rows = getDb()
    .select()
    .from(workspaceTable)
    .orderBy(desc(workspaceTable.isDefault), asc(workspaceTable.name))
    .all()

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    is_default: row.isDefault,
    connection_ids: getWorkspaceConnections(row.id),
    created_at: row.createdAt ?? '',
    updated_at: row.updatedAt ?? '',
  }))
}
