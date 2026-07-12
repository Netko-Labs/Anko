import { connectionTable } from '@anko/desktop-domain/db'
import { eq } from 'drizzle-orm'
import { getDb } from '../client'

/** Returns the raw connection row (includes encrypted_password). Internal use. */
export function getConnection(id: string) {
  const [row] = getDb().select().from(connectionTable).where(eq(connectionTable.id, id)).all()

  return row ?? null
}
