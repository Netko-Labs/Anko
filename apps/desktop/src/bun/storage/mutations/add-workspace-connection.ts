import { eq, sql } from 'drizzle-orm'
import { getDb } from '../client'
import { workspaceConnectionTable, workspaceTable } from '../schema'

export function addWorkspaceConnection(workspaceId: string, connectionId: string): void {
  const db = getDb()

  db.insert(workspaceConnectionTable)
    .values({ workspaceId, connectionId })
    .onConflictDoNothing()
    .run()

  db.update(workspaceTable)
    .set({ updatedAt: sql`CURRENT_TIMESTAMP` })
    .where(eq(workspaceTable.id, workspaceId))
    .run()
}
