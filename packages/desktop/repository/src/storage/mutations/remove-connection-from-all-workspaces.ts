import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { workspaceConnectionTable } from '@anko/desktop-domain/db'

export function removeConnectionFromAllWorkspaces(connectionId: string): void {
  getDb()
    .delete(workspaceConnectionTable)
    .where(eq(workspaceConnectionTable.connectionId, connectionId))
    .run()
}
