import { appMetaTable } from '@anko/desktop-domain/db'
import { eq } from 'drizzle-orm'
import { getDb } from '../client'

/** Value for an app-meta key, or null if unset. */
export function getAppMeta(key: string): string | null {
  const [row] = getDb()
    .select({ value: appMetaTable.value })
    .from(appMetaTable)
    .where(eq(appMetaTable.key, key))
    .all()

  return row?.value ?? null
}
