import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '../client'
import { workspaceConnectionTable, workspaceTable } from '../schema'

export function removeWorkspaceConnection(workspaceId: string, connectionId: string): void {
  const db = getDb()

  db.delete(workspaceConnectionTable)
    .where(
      and(
        eq(workspaceConnectionTable.workspaceId, workspaceId),
        eq(workspaceConnectionTable.connectionId, connectionId),
      ),
    )
    .run()

  db.update(workspaceTable)
    .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(workspaceTable.id, workspaceId))
    .run()
}
