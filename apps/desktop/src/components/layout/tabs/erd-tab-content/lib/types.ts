import type { ErdTable } from '@anko/desktop-domain'

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

/** Full set of diagram callbacks (table node actions plus note actions). */
export interface GraphActions extends ErdNodeActions {
  onNoteChange: (id: string, text: string) => void
  onNoteColor: (id: string, color: string) => void
  onNoteDelete: (id: string) => void
}

/** A node handed to the layout engine, sized from its rendered card. */
export interface LayoutInput {
  id: string
  width: number
  height: number
}

/** A directed edge between two layout nodes. */
export interface LayoutEdge {
  source: string
  target: string
}

/** A node's computed top-left position. */
export interface Positioned {
  id: string
  x: number
  y: number
}
