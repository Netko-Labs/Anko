import type { ErdLayoutDirection, ErdTable } from '@anko/desktop-domain'
import dagre from '@dagrejs/dagre'
import type { LayoutEdge, LayoutInput, Positioned } from '..'
import { COLLAPSED_HEIGHT, HEADER_HEIGHT, NODE_WIDTH, ROW_HEIGHT } from '..'

/** Estimated rendered height of a table card given its visible column count. */
export function nodeHeight(visibleColumns: number, collapsed: boolean): number {
  if (collapsed) return COLLAPSED_HEIGHT
  return HEADER_HEIGHT + Math.max(1, visibleColumns) * ROW_HEIGHT + 8
}

/** Hierarchical layout via dagre (LR = left→right, TB = top→bottom). */
function layoutWithDagre(
  nodes: LayoutInput[],
  edges: LayoutEdge[],
  direction: 'LR' | 'TB',
): Positioned[] {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: direction, nodesep: 50, ranksep: 90, marginx: 40, marginy: 40 })

  for (const n of nodes) g.setNode(n.id, { width: n.width, height: n.height })
  for (const e of edges) {
    // dagre needs both endpoints registered; skip dangling edges.
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target)
  }

  dagre.layout(g)

  return nodes.map((n) => {
    const pos = g.node(n.id)
    // dagre centers nodes; React Flow positions by top-left corner.
    return { id: n.id, x: pos.x - n.width / 2, y: pos.y - n.height / 2 }
  })
}

/** Simple left-to-right grid, ~square aspect. Used for the "grid" layout option. */
function layoutGrid(nodes: LayoutInput[]): Positioned[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)))
  const gapX = 60
  const gapY = 60
  // Row heights vary, so track a running y per column band by row.
  const colWidth = NODE_WIDTH + gapX
  let x = 0
  let y = 0
  let rowMaxHeight = 0
  const out: Positioned[] = []
  nodes.forEach((n, i) => {
    const col = i % cols
    if (col === 0 && i > 0) {
      x = 0
      y += rowMaxHeight + gapY
      rowMaxHeight = 0
    }
    out.push({ id: n.id, x, y })
    x += colWidth
    rowMaxHeight = Math.max(rowMaxHeight, n.height)
  })
  return out
}

/**
 * Compute positions for the given tables under a layout direction. Returns a map
 * of table name → {x, y} (top-left), sized from each table's visible columns.
 */
export function computeLayout(
  tables: ErdTable[],
  edges: LayoutEdge[],
  direction: ErdLayoutDirection,
  sizing: (table: string) => { visibleColumns: number; collapsed: boolean },
): Map<string, { x: number; y: number }> {
  const inputs: LayoutInput[] = tables.map((t) => {
    const { visibleColumns, collapsed } = sizing(t.name)
    return { id: t.name, width: NODE_WIDTH, height: nodeHeight(visibleColumns, collapsed) }
  })

  const positioned =
    direction === 'grid' ? layoutGrid(inputs) : layoutWithDagre(inputs, edges, direction)

  return new Map(positioned.map((p) => [p.id, { x: p.x, y: p.y }]))
}
