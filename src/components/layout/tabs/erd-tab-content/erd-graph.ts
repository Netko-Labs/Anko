import { type Edge, MarkerType, type Node } from '@xyflow/react'
import type { ErdNote, ErdRelation, ErdSchema, ErdTabState } from '@/types'
import type { ErdNodeActions, ErdNoteNodeData, ErdTableNodeData } from './definitions'
import { sourceHandleId, targetHandleId } from './definitions'

export interface GraphActions extends ErdNodeActions {
  onNoteChange: (id: string, text: string) => void
  onNoteColor: (id: string, color: string) => void
  onNoteDelete: (id: string) => void
}

/** Map each FK column to the "table.column" it references (detected + custom). */
function fkTargetsByTable(
  schema: ErdSchema,
  erd: ErdTabState,
): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>()
  for (const rel of [...schema.relations, ...erd.customRelations]) {
    const forTable = map.get(rel.fromTable) ?? {}
    forTable[rel.fromColumn] = `${rel.toTable}.${rel.toColumn}`
    map.set(rel.fromTable, forTable)
  }
  return map
}

/** Index the per-table layout/appearance overrides by table name. */
function nodeStateMap(erd: ErdTabState) {
  return new Map(erd.nodes.map((n) => [n.table, n]))
}

/** Build React Flow table + note nodes from the schema snapshot and tab state. */
export function buildNodes(
  schema: ErdSchema,
  erd: ErdTabState,
  positions: Map<string, { x: number; y: number }>,
  actions: GraphActions,
): Node[] {
  const overrides = nodeStateMap(erd)
  const hiddenTables = new Set(erd.hiddenTables)
  const fkTargets = fkTargetsByTable(schema, erd)

  const tableNodes: Node[] = schema.tables
    .filter((t) => !hiddenTables.has(t.name))
    .map((table) => {
      const ov = overrides.get(table.name)
      const pos = positions.get(table.name) ?? { x: 0, y: 0 }
      const data: ErdTableNodeData = {
        table,
        color: ov?.color,
        collapsed: ov?.collapsed ?? false,
        hiddenColumns: ov?.hiddenColumns ?? [],
        showColumnTypes: erd.showColumnTypes,
        fkTargets: fkTargets.get(table.name) ?? {},
        actions,
      }
      return { id: table.name, type: 'erdTable', position: pos, data }
    })

  const noteNodes: Node[] = erd.notes.map((note: ErdNote) => {
    const data: ErdNoteNodeData = {
      id: note.id,
      text: note.text,
      color: note.color,
      onChange: actions.onNoteChange,
      onColor: actions.onNoteColor,
      onDelete: actions.onNoteDelete,
    }
    return {
      id: `note-${note.id}`,
      type: 'erdNote',
      position: { x: note.x, y: note.y },
      width: note.width ?? 200,
      height: note.height ?? 120,
      data,
    }
  })

  return [...tableNodes, ...noteNodes]
}

/** Build FK + custom-relation edges, routing to column handles (or the table when hidden/collapsed). */
export function buildEdges(schema: ErdSchema, erd: ErdTabState): Edge[] {
  const overrides = nodeStateMap(erd)
  const hiddenTables = new Set(erd.hiddenTables)
  const allRelations: ErdRelation[] = [...schema.relations, ...erd.customRelations]

  const isColumnVisible = (table: string, column: string) => {
    if (hiddenTables.has(table)) return false
    const ov = overrides.get(table)
    if (ov?.collapsed) return false
    return !(ov?.hiddenColumns ?? []).includes(column)
  }

  return allRelations
    .filter((rel) => !hiddenTables.has(rel.fromTable) && !hiddenTables.has(rel.toTable))
    .map((rel) => ({
      id: rel.id,
      source: rel.fromTable,
      target: rel.toTable,
      sourceHandle: isColumnVisible(rel.fromTable, rel.fromColumn)
        ? sourceHandleId(rel.fromColumn)
        : undefined,
      targetHandle: isColumnVisible(rel.toTable, rel.toColumn)
        ? targetHandleId(rel.toColumn)
        : undefined,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
      style: { stroke: 'var(--color-muted-foreground)', strokeWidth: 1.5 },
      data: { relation: rel },
    }))
}
