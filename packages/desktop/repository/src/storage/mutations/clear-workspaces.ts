import { eq } from 'drizzle-orm'
import { getDb } from '../client'
import { workspaceConnectionTable, workspaceTable } from '@anko/desktop-domain/db'

export function clearWorkspaces(): void {
  const db = getDb()
  db.delete(workspaceConnectionTable).run()
  db.delete(workspaceTable).where(eq(workspaceTable.isDefault, false)).run()
}
