import type { ErdTable } from '@/types'

/** Callbacks a table node uses to mutate the diagram (handled in ErdTabContent). */
export interface ErdNodeActions {
  onToggleCollapse: (table: string) => void
  onSetColor: (table: string, color?: string) => void
  onHideTable: (table: string) => void
  onHideColumn: (table: string, column: string) => void
  onUnhideColumn: (table: string, column: string) => void
  onUnhideAllColumns: (table: string) => void
}

/** Data carried by a React Flow `erdTable` node. */
export interface ErdTableNodeData {
  table: ErdTable
  color?: string
  collapsed: boolean
  hiddenColumns: string[]
  showColumnTypes: boolean
  /** Column name → "table.column" it references (from FK + custom relations). */
  fkTargets: Record<string, string>
  actions: ErdNodeActions
  [key: string]: unknown
}

/** Data carried by a React Flow `erdNote` node. */
export interface ErdNoteNodeData {
  id: string
  text: string
  color?: string
  onChange: (id: string, text: string) => void
  onColor: (id: string, color: string) => void
  onDelete: (id: string) => void
  [key: string]: unknown
}

/** Sticky-note background swatches. */
export const ERD_NOTE_COLORS = [
  '#fef9c3', // yellow
  '#dcfce7', // green
  '#dbeafe', // blue
  '#fce7f3', // pink
  '#ffedd5', // orange
  '#ede9fe', // violet
  '#e2e8f0', // slate
]

/** Header accent swatches offered in the table context menu. */
export const ERD_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#64748b', // slate
]

/** Handle ids for a column's right (source) and left (target) connection points. */
export const sourceHandleId = (column: string) => `${column}__source`
export const targetHandleId = (column: string) => `${column}__target`
