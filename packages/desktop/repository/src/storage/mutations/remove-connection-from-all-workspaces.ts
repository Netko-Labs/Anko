import { workspaceConnectionTable } from '@anko/desktop-domain/db'
import { eq } from 'drizzle-orm'
import { getDb } from '../client'

export function removeConnectionFromAllWorkspaces(connectionId: string): void {
  getDb()
    .delete(workspaceConnectionTable)
    .where(eq(workspaceConnectionTable.connectionId, connectionId))
    .run()
}
