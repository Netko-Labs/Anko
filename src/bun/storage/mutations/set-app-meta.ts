import { getDb } from '../client'
import { appMetaTable } from '../schema'

/** Upsert an app-meta key/value pair. */
export function setAppMeta(key: string, value: string): void {
  getDb()
    .insert(appMetaTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: appMetaTable.key, set: { value } })
    .run()
}
