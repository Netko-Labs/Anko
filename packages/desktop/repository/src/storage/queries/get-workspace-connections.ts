import { asc, eq } from 'drizzle-orm'
import { getDb } from '../client'
import { workspaceConnectionTable } from '@anko/desktop-domain/db'

/** Returns connection IDs for a given workspace, ordered by added_at. */
export function getWorkspaceConnections(workspaceId: string): string[] {
  const rows = getDb()
    .select({ connectionId: workspaceConnectionTable.connectionId })
    .from(workspaceConnectionTable)
    .where(eq(workspaceConnectionTable.workspaceId, workspaceId))
    .orderBy(asc(workspaceConnectionTable.addedAt))
    .all()

  return rows.map((r) => r.connectionId)
}
