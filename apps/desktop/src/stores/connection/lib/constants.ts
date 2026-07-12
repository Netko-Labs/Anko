import type { SchemaCache } from './types'

/** Empty schema cache used to initialize a connection's cache slot. */
export const DEFAULT_SCHEMA_CACHE: SchemaCache = {
  databases: [],
  schemas: {},
  tables: {},
  columns: {},
}
