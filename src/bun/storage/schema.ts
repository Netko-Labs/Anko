import { sql } from 'drizzle-orm'
import { blob, check, index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const connectionTable = sqliteTable('connections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  host: text('host').notNull(),
  port: integer('port').notNull(),
  username: text('username').notNull(),
  encryptedPassword: blob('encrypted_password', { mode: 'buffer' }).notNull(),
  databaseName: text('database_name'),
  driver: text('driver', { enum: ['mysql', 'postgresql', 'sqlite'] })
    .notNull()
    .default('mysql'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const workspaceTable = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('database'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

export const workspaceConnectionTable = sqliteTable(
  'workspace_connections',
  {
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaceTable.id, { onDelete: 'cascade' }),
    connectionId: text('connection_id').notNull(),
    addedAt: text('added_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [primaryKey({ columns: [table.workspaceId, table.connectionId] })],
)

export const queryHistoryTable = sqliteTable(
  'query_history',
  {
    id: text('id').primaryKey(),
    query: text('query').notNull(),
    connectionId: text('connection_id').notNull(),
    connectionName: text('connection_name').notNull(),
    databaseName: text('database_name'),
    executedAt: text('executed_at').default(sql`CURRENT_TIMESTAMP`),
    executionTimeMs: integer('execution_time_ms'),
    rowCount: integer('row_count'),
    success: integer('success', { mode: 'boolean' }).notNull().default(true),
    errorMessage: text('error_message'),
  },
  (table) => [index('idx_query_history_executed_at').on(table.executedAt)],
)

export const savedQueryTable = sqliteTable(
  'saved_queries',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    query: text('query').notNull(),
    description: text('description'),
    workspaceId: text('workspace_id').references(() => workspaceTable.id, {
      onDelete: 'set null',
    }),
    connectionId: text('connection_id'),
    databaseName: text('database_name'),
    createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('idx_saved_queries_workspace').on(table.workspaceId)],
)

export const windowStateTable = sqliteTable(
  'window_state',
  {
    id: integer('id').primaryKey(),
    x: integer('x').notNull(),
    y: integer('y').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    isMaximized: integer('is_maximized', { mode: 'boolean' }).notNull().default(false),
  },
  (table) => [check('single_row', sql`${table.id} = 1`)],
)

// Persisted per-workspace UI session (open tabs + snapshot results + which
// connections were connected). `data` is a JSON blob (see SessionData on the
// frontend). One row per workspace; cascades when the workspace is deleted.
export const workspaceSessionTable = sqliteTable('workspace_sessions', {
  workspaceId: text('workspace_id')
    .primaryKey()
    .references(() => workspaceTable.id, { onDelete: 'cascade' }),
  data: text('data').notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
})

// Small key/value store for app-wide UI state (e.g. the last active workspace id).
export const appMetaTable = sqliteTable('app_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})
