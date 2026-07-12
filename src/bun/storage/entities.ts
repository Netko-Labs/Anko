import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  connectionTable,
  queryHistoryTable,
  savedQueryTable,
  windowStateTable,
  workspaceConnectionTable,
  workspaceTable,
} from './schema'

// ── Connections ──────────────────────────────────────────────────────

export const ConnectionSelectSchema = createSelectSchema(connectionTable)
export type ConnectionRow = z.infer<typeof ConnectionSelectSchema>

export const ConnectionInsertSchema = createInsertSchema(connectionTable, {
  id: z.string().uuid(),
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
})
export type ConnectionInsert = z.infer<typeof ConnectionInsertSchema>

/** User-facing input with plaintext password (not stored directly) */
export const ConnectionConfigSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().positive(),
  username: z.string().min(1),
  password: z.string(),
  database: z.string().optional(),
  driver: z.enum(['mysql', 'postgresql', 'sqlite']),
})
export type ConnectionConfig = z.infer<typeof ConnectionConfigSchema>

/** Public connection info (no password, no encrypted_password) */
export const ConnectionInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  host: z.string(),
  port: z.number().int(),
  username: z.string(),
  database: z.string().optional(),
  driver: z.enum(['mysql', 'postgresql', 'sqlite']),
})
export type ConnectionInfo = z.infer<typeof ConnectionInfoSchema>

// ── Workspaces ──────────────────────────────────────────────────────

export const WorkspaceSelectSchema = createSelectSchema(workspaceTable)
export type WorkspaceRow = z.infer<typeof WorkspaceSelectSchema>

export const WorkspaceInsertSchema = createInsertSchema(workspaceTable, {
  id: z.string(),
  name: z.string().min(1),
})
export type WorkspaceInsert = z.infer<typeof WorkspaceInsertSchema>

export const WorkspaceConfigSchema = z.object({
  name: z.string().min(1),
  icon: z.string().min(1),
})
export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>

/** Full workspace with resolved connection IDs */
export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  is_default: z.boolean(),
  connection_ids: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
})
export type Workspace = z.infer<typeof WorkspaceSchema>

// ── Workspace Connections ───────────────────────────────────────────

export const WorkspaceConnectionSelectSchema = createSelectSchema(workspaceConnectionTable)
export type WorkspaceConnectionRow = z.infer<typeof WorkspaceConnectionSelectSchema>

export const WorkspaceConnectionInsertSchema = createInsertSchema(workspaceConnectionTable)
export type WorkspaceConnectionInsert = z.infer<typeof WorkspaceConnectionInsertSchema>

// ── Query History ───────────────────────────────────────────────────

export const QueryHistorySelectSchema = createSelectSchema(queryHistoryTable)
export type QueryHistoryRow = z.infer<typeof QueryHistorySelectSchema>

export const QueryHistoryInsertSchema = createInsertSchema(queryHistoryTable, {
  id: z.string().uuid(),
  query: z.string().min(1),
  connectionId: z.string().min(1),
  connectionName: z.string().min(1),
})
export type QueryHistoryInsert = z.infer<typeof QueryHistoryInsertSchema>

/** Public query history entry */
export const QueryHistoryEntrySchema = z.object({
  id: z.string(),
  query: z.string(),
  connectionId: z.string(),
  connectionName: z.string(),
  databaseName: z.string().nullable(),
  executedAt: z.string(),
  executionTimeMs: z.number().nullable(),
  rowCount: z.number().nullable(),
  success: z.boolean(),
  errorMessage: z.string().nullable(),
  source: z.enum(['ui', 'mcp']),
  approvalStatus: z
    .enum(['not_required', 'approved', 'rejected', 'timed_out', 'bypassed'])
    .nullable(),
})
export type QueryHistoryEntry = z.infer<typeof QueryHistoryEntrySchema>

export const AddQueryHistoryInputSchema = z.object({
  query: z.string().min(1),
  connectionId: z.string().min(1),
  connectionName: z.string().min(1),
  databaseName: z.string().nullable(),
  executionTimeMs: z.number().nullable(),
  rowCount: z.number().nullable(),
  success: z.boolean(),
  errorMessage: z.string().nullable(),
  source: z.enum(['ui', 'mcp']).optional(),
  approvalStatus: z
    .enum(['not_required', 'approved', 'rejected', 'timed_out', 'bypassed'])
    .nullable()
    .optional(),
})
export type AddQueryHistoryInput = z.infer<typeof AddQueryHistoryInputSchema>

// ── Saved Queries ───────────────────────────────────────────────────

export const SavedQuerySelectSchema = createSelectSchema(savedQueryTable)
export type SavedQueryRow = z.infer<typeof SavedQuerySelectSchema>

export const SavedQueryInsertSchema = createInsertSchema(savedQueryTable, {
  id: z.string().uuid(),
  name: z.string().min(1),
  query: z.string().min(1),
})
export type SavedQueryInsert = z.infer<typeof SavedQueryInsertSchema>

/** Public saved query */
export const SavedQuerySchema = z.object({
  id: z.string(),
  name: z.string(),
  query: z.string(),
  description: z.string().nullable(),
  workspaceId: z.string().nullable(),
  connectionId: z.string().nullable(),
  databaseName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type SavedQuery = z.infer<typeof SavedQuerySchema>

export const CreateSavedQueryInputSchema = z.object({
  name: z.string().min(1),
  query: z.string().min(1),
  description: z.string().nullable(),
  workspaceId: z.string().nullable(),
  connectionId: z.string().nullable(),
  databaseName: z.string().nullable(),
})
export type CreateSavedQueryInput = z.infer<typeof CreateSavedQueryInputSchema>

export const UpdateSavedQueryInputSchema = z.object({
  name: z.string().min(1).optional(),
  query: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  workspaceId: z.string().nullable().optional(),
  connectionId: z.string().nullable().optional(),
  databaseName: z.string().nullable().optional(),
})
export type UpdateSavedQueryInput = z.infer<typeof UpdateSavedQueryInputSchema>

// ── Window State ────────────────────────────────────────────────────

export const WindowStateSelectSchema = createSelectSchema(windowStateTable)
export type WindowStateRow = z.infer<typeof WindowStateSelectSchema>

export const WindowStateSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  isMaximized: z.boolean(),
})
export type WindowState = z.infer<typeof WindowStateSchema>
