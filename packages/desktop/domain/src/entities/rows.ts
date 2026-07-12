import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'
import {
  connectionTable,
  queryHistoryTable,
  savedQueryTable,
  windowStateTable,
  workspaceConnectionTable,
  workspaceTable,
} from '../db/schema'

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

// ── Workspaces ──────────────────────────────────────────────────────

export const WorkspaceSelectSchema = createSelectSchema(workspaceTable)
export type WorkspaceRow = z.infer<typeof WorkspaceSelectSchema>

export const WorkspaceInsertSchema = createInsertSchema(workspaceTable, {
  id: z.string(),
  name: z.string().min(1),
})
export type WorkspaceInsert = z.infer<typeof WorkspaceInsertSchema>

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

// ── Saved Queries ───────────────────────────────────────────────────

export const SavedQuerySelectSchema = createSelectSchema(savedQueryTable)
export type SavedQueryRow = z.infer<typeof SavedQuerySelectSchema>

export const SavedQueryInsertSchema = createInsertSchema(savedQueryTable, {
  id: z.string().uuid(),
  name: z.string().min(1),
  query: z.string().min(1),
})
export type SavedQueryInsert = z.infer<typeof SavedQueryInsertSchema>

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
