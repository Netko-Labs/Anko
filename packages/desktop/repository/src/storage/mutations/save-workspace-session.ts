import { workspaceSessionTable } from '@anko/desktop-domain/db'
import { sql } from 'drizzle-orm'
import { getDb } from '../client'

/** Upsert the JSON session blob for a workspace. */
export function saveWorkspaceSession(workspaceId: string, data: string): void {
  getDb()
    .insert(workspaceSessionTable)
    .values({ workspaceId, data, updatedAt: sql`CURRENT_TIMESTAMP` })
    .onConflictDoUpdate({
      target: workspaceSessionTable.workspaceId,
      set: { data, updatedAt: sql`CURRENT_TIMESTAMP` },
    })
    .run()
}
