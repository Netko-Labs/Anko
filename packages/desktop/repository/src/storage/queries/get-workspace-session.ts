import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { workspaceSessionTable } from '@anko/desktop-domain/db'

/** Raw JSON session blob for a workspace, or null if none saved yet. */
export function getWorkspaceSession(workspaceId: string): string | null {
  const [row] = getDb()
    .select({ data: workspaceSessionTable.data })
    .from(workspaceSessionTable)
    .where(eq(workspaceSessionTable.workspaceId, workspaceId))
    .all()

  return row?.data ?? null
}
