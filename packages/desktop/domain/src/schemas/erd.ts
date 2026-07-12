// Entity-relationship diagram types. The schema-graph types mirror the RPC
// shapes (src/shared/rpc-types.ts); the ErdTabState types capture the editable,
// persisted diagram (layout + customization) stored on a query tab so it
// survives reloads and workspace swaps via the session feature.

export interface ErdColumn {
  name: string
  data_type: string
  nullable: boolean
  isPrimaryKey: boolean
  isForeignKey: boolean
  isUnique: boolean
  isAutoIncrement: boolean
  defaultValue?: string
}

export interface ErdTable {
  name: string
  columns: ErdColumn[]
}

export interface ErdRelation {
  id: string
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  constraintName?: string
}

export interface ErdSchema {
  tables: ErdTable[]
  relations: ErdRelation[]
}

/** Per-table layout + appearance overrides, keyed by table name. */
export interface ErdNodeState {
  table: string
  x: number
  y: number
  /** Header accent color (CSS hex). Undefined = default theme color. */
  color?: string
  /** Collapsed shows only the table header (no columns). */
  collapsed?: boolean
  /** Columns hidden from this table's card (column names). */
  hiddenColumns?: string[]
}

/** A free-text sticky note placed on the canvas. */
export interface ErdNote {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  text: string
  color?: string
}

/** A user-drawn relation beyond the detected FKs. */
export interface ErdCustomRelation extends ErdRelation {
  custom: true
}

export type ErdLayoutDirection = 'LR' | 'TB' | 'grid'

/**
 * The full editable ERD stored on a tab. `schemaSnapshot` lets the diagram
 * render instantly (and offline) after a restore; it's refreshed from the live
 * connection when available.
 */
export interface ErdTabState {
  database: string
  schema?: string
  schemaSnapshot?: ErdSchema
  nodes: ErdNodeState[]
  hiddenTables: string[]
  notes: ErdNote[]
  customRelations: ErdCustomRelation[]
  theme: 'light' | 'dark'
  /** Whether column type text is shown on cards. */
  showColumnTypes: boolean
  layoutDirection: ErdLayoutDirection
}
