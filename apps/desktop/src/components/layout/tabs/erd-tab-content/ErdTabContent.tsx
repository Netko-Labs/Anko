// conventions: >300 lines — single React Flow canvas whose node/edge state, persistence,
// layout, and export callbacks are tightly coupled through shared RF hooks; graph/layout
// helpers already extracted to utils/. Split remaining canvas hooks when next touched.
import '@xyflow/react/dist/style.css'
import type {
  ErdCustomRelation,
  ErdLayoutDirection,
  ErdNodeState,
  ErdTabState,
} from '@anko/desktop-domain'
import { IconDatabaseOff, IconPlugConnected } from '@tabler/icons-react'
import {
  Background,
  type Connection,
  Controls,
  type Edge,
  getNodesBounds,
  MiniMap,
  type Node,
  type NodeChange,
  type NodeTypes,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import { toBlob, toJpeg, toSvg } from 'html-to-image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useTheme } from '@/components/theme/theme-provider'
import { connectSaved } from '@/lib/connect'
import { erdLogger } from '@/lib/debug'
import { formatErrorMessage } from '@/lib/error-utils'
import { genId } from '@/lib/id'
import { getErdSchema, saveImageFile, showSaveDialog, writeTextFile } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import { ErdNoteNode } from './ErdNoteNode'
import { ErdTableNode } from './ErdTableNode'
import { ErdToolbar } from './ErdToolbar'
import type { GraphActions } from './lib'
import { buildEdges, buildNodes } from './lib/utils/erd-graph'
import { computeLayout } from './lib/utils/erd-layout'

const nodeTypes: NodeTypes = { erdTable: ErdTableNode, erdNote: ErdNoteNode }

export function ErdTabContent({ tabId }: { tabId: string }) {
  return (
    <ReactFlowProvider>
      <ErdCanvas tabId={tabId} />
    </ReactFlowProvider>
  )
}

function ErdCanvas({ tabId }: { tabId: string }) {
  const tab = useConnectionStore((s) => s.queryTabs.find((t) => t.id === tabId))
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const savedConnections = useConnectionStore((s) => s.savedConnections)
  // The diagram follows the app's light/dark theme.
  const { resolvedTheme } = useTheme()

  const erd = tab?.erd
  const connectionId = tab?.connectionId
  const connection = useMemo(
    () => (connectionId ? activeConnections.find((c) => c.id === connectionId) : undefined),
    [connectionId, activeConnections],
  )
  const runtimeConnectionId = connection?.connectionId

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [layoutVersion, setLayoutVersion] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { getNodes } = useReactFlow()

  // ── persist helpers ────────────────────────────────────────────────
  // Always read the latest tab from the store so concurrent patches compose.
  const patchErd = useCallback(
    (updater: (prev: ErdTabState) => ErdTabState) => {
      const store = useConnectionStore.getState()
      const current = store.queryTabs.find((t) => t.id === tabId)?.erd
      if (!current) return
      store.updateQueryTab(tabId, { erd: updater(current) })
    },
    [tabId],
  )

  const updateNodeState = useCallback(
    (table: string, patch: Partial<ErdNodeState>) => {
      patchErd((prev) => {
        const exists = prev.nodes.some((n) => n.table === table)
        const nodes = exists
          ? prev.nodes.map((n) => (n.table === table ? { ...n, ...patch } : n))
          : [...prev.nodes, { table, x: 0, y: 0, ...patch }]
        return { ...prev, nodes }
      })
    },
    [patchErd],
  )

  // ── node/diagram actions ───────────────────────────────────────────
  const actions: GraphActions = useMemo(
    () => ({
      onToggleCollapse: (table) =>
        patchErd((prev) => ({
          ...prev,
          nodes: prev.nodes.some((n) => n.table === table)
            ? prev.nodes.map((n) => (n.table === table ? { ...n, collapsed: !n.collapsed } : n))
            : [...prev.nodes, { table, x: 0, y: 0, collapsed: true }],
        })),
      onSetColor: (table, color) => updateNodeState(table, { color }),
      onHideTable: (table) =>
        patchErd((prev) => ({
          ...prev,
          hiddenTables: [...new Set([...prev.hiddenTables, table])],
        })),
      onHideColumn: (table, column) =>
        patchErd((prev) => {
          const node = prev.nodes.find((n) => n.table === table)
          const hiddenColumns = [...new Set([...(node?.hiddenColumns ?? []), column])]
          return {
            ...prev,
            nodes: node
              ? prev.nodes.map((n) => (n.table === table ? { ...n, hiddenColumns } : n))
              : [...prev.nodes, { table, x: 0, y: 0, hiddenColumns }],
          }
        }),
      onUnhideColumn: (table, column) =>
        patchErd((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.table === table
              ? { ...n, hiddenColumns: (n.hiddenColumns ?? []).filter((c) => c !== column) }
              : n,
          ),
        })),
      onUnhideAllColumns: (table) =>
        patchErd((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => (n.table === table ? { ...n, hiddenColumns: [] } : n)),
        })),
      onNoteChange: (id, text) =>
        patchErd((prev) => ({
          ...prev,
          notes: prev.notes.map((n) => (n.id === id ? { ...n, text } : n)),
        })),
      onNoteColor: (id, color) =>
        patchErd((prev) => ({
          ...prev,
          notes: prev.notes.map((n) => (n.id === id ? { ...n, color } : n)),
        })),
      onNoteDelete: (id) =>
        patchErd((prev) => ({ ...prev, notes: prev.notes.filter((n) => n.id !== id) })),
    }),
    [patchErd, updateNodeState],
  )

  // ── schema fetch ───────────────────────────────────────────────────
  const schema = erd?.schemaSnapshot
  const fetchSchema = useCallback(
    async (showToast: boolean) => {
      if (!runtimeConnectionId || !erd) return
      setIsRefreshing(true)
      try {
        const fresh = await getErdSchema(runtimeConnectionId, erd.database, erd.schema)
        patchErd((prev) => ({ ...prev, schemaSnapshot: fresh }))
        if (showToast) toast.success('Schema refreshed')
      } catch (e) {
        erdLogger.error('getErdSchema failed', e)
        toast.error('Failed to load schema', { description: formatErrorMessage(e) })
      } finally {
        setIsRefreshing(false)
      }
    },
    [runtimeConnectionId, erd, patchErd],
  )

  // Auto-fetch once when connected and we have no snapshot yet.
  const hasSnapshot = !!schema
  useEffect(() => {
    if (runtimeConnectionId && !hasSnapshot) void fetchSchema(false)
  }, [runtimeConnectionId, hasSnapshot, fetchSchema])

  // ── auto-layout: fill positions for any table missing one ──────────
  const ensureLayout = useCallback(
    (force: boolean) => {
      patchErd((prev) => {
        if (!prev.schemaSnapshot) return prev
        const visible = prev.schemaSnapshot.tables.filter(
          (t) => !prev.hiddenTables.includes(t.name),
        )
        const have = new Map(prev.nodes.map((n) => [n.table, n]))
        const missing = visible.some((t) => !have.has(t.name) || force)
        if (!missing) return prev

        const overrides = new Map(prev.nodes.map((n) => [n.table, n]))
        const edgesForLayout = [...prev.schemaSnapshot.relations, ...prev.customRelations].map(
          (r) => ({ source: r.fromTable, target: r.toTable }),
        )
        const positions = computeLayout(visible, edgesForLayout, prev.layoutDirection, (name) => {
          const ov = overrides.get(name)
          const table = prev.schemaSnapshot?.tables.find((t) => t.name === name)
          const total = table?.columns.length ?? 0
          const hidden = ov?.hiddenColumns?.length ?? 0
          return { visibleColumns: total - hidden, collapsed: ov?.collapsed ?? false }
        })

        const nextNodes: ErdNodeState[] = visible.map((t) => {
          const ov = overrides.get(t.name)
          const pos = positions.get(t.name) ?? { x: 0, y: 0 }
          // On force (re-layout) overwrite positions; otherwise keep existing.
          return ov && !force ? ov : { ...(ov ?? { table: t.name }), table: t.name, ...pos }
        })
        return { ...prev, nodes: nextNodes }
      })
      setLayoutVersion((v) => v + 1)
    },
    [patchErd],
  )

  // Run an initial layout once the snapshot arrives without positions.
  useEffect(() => {
    if (schema && erd && erd.nodes.length === 0 && schema.tables.length > 0) {
      ensureLayout(false)
    }
  }, [schema, erd, ensureLayout])

  // ── rebuild RF nodes/edges on structural changes (not on drag) ─────
  const structuralSignature = useMemo(() => {
    if (!erd || !schema) return ''
    return JSON.stringify({
      t: schema.tables.map((t) => `${t.name}:${t.columns.length}`),
      r: schema.relations.length,
      cr: erd.customRelations.map((c) => c.id),
      h: erd.hiddenTables,
      n: erd.nodes.map(
        (n) =>
          `${n.table}:${n.color ?? ''}:${n.collapsed ?? false}:${(n.hiddenColumns ?? []).join('|')}`,
      ),
      notes: erd.notes.map((n) => `${n.id}:${n.color ?? ''}:${n.width ?? 0}:${n.height ?? 0}`),
      types: erd.showColumnTypes,
      v: layoutVersion,
    })
  }, [erd, schema, layoutVersion])

  useEffect(() => {
    if (!erd || !schema) return
    const positions = new Map(erd.nodes.map((n) => [n.table, { x: n.x, y: n.y }]))
    setNodes(buildNodes(schema, erd, positions, actions))
    setEdges(buildEdges(schema, erd))
  }, [structuralSignature, actions, setNodes, setEdges])

  // ── persistence of drags / resizes ─────────────────────────────────
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
      for (const change of changes) {
        if (change.type === 'dimensions' && change.resizing === false) {
          const id = change.id
          if (id.startsWith('note-')) {
            const noteId = id.slice('note-'.length)
            const dims = change.dimensions
            if (dims)
              patchErd((prev) => ({
                ...prev,
                notes: prev.notes.map((n) =>
                  n.id === noteId ? { ...n, width: dims.width, height: dims.height } : n,
                ),
              }))
          }
        }
      }
    },
    [onNodesChange, patchErd],
  )

  const handleNodeDragStop = useCallback(
    (_e: unknown, node: Node) => {
      if (node.id.startsWith('note-')) {
        const noteId = node.id.slice('note-'.length)
        patchErd((prev) => ({
          ...prev,
          notes: prev.notes.map((n) =>
            n.id === noteId ? { ...n, x: node.position.x, y: node.position.y } : n,
          ),
        }))
      } else {
        updateNodeState(node.id, { x: node.position.x, y: node.position.y })
      }
    },
    [patchErd, updateNodeState],
  )

  const handleConnect = useCallback(
    (conn: Connection) => {
      if (!conn.source || !conn.target) return
      const fromColumn = conn.sourceHandle?.replace(/__source$/, '') ?? ''
      const toColumn = conn.targetHandle?.replace(/__target$/, '') ?? ''
      if (!fromColumn || !toColumn) {
        toast.error('Connect from a column handle to another column handle')
        return
      }
      const relation: ErdCustomRelation = {
        id: `custom-${genId()}`,
        fromTable: conn.source,
        fromColumn,
        toTable: conn.target,
        toColumn,
        custom: true,
      }
      patchErd((prev) => ({ ...prev, customRelations: [...prev.customRelations, relation] }))
    },
    [patchErd],
  )

  // ── toolbar actions ────────────────────────────────────────────────
  const setLayout = useCallback(
    (dir: ErdLayoutDirection) => {
      patchErd((prev) => ({ ...prev, layoutDirection: dir }))
      // ensureLayout reads the just-patched direction on the next microtask.
      setTimeout(() => ensureLayout(true), 0)
    },
    [patchErd, ensureLayout],
  )
  const tidyUp = useCallback(() => ensureLayout(true), [ensureLayout])
  const toggleColumnTypes = useCallback(
    () => patchErd((prev) => ({ ...prev, showColumnTypes: !prev.showColumnTypes })),
    [patchErd],
  )
  const addNote = useCallback(() => {
    patchErd((prev) => ({
      ...prev,
      notes: [...prev.notes, { id: genId(), x: 40, y: 40, width: 200, height: 120, text: '' }],
    }))
  }, [patchErd])
  const unhideTable = useCallback(
    (table: string) =>
      patchErd((prev) => ({ ...prev, hiddenTables: prev.hiddenTables.filter((t) => t !== table) })),
    [patchErd],
  )

  // ── export ─────────────────────────────────────────────────────────
  const captureOptions = useCallback(() => {
    const flowNodes = getNodes()
    const bounds = getNodesBounds(flowNodes)
    // Tight crop: size the image to the content's bounding box plus a small
    // uniform margin, and translate the viewport so the content sits at (pad,pad)
    // at 1:1 scale. No fit-to-viewport math → no empty padding.
    const pad = 24
    const width = Math.max(1, Math.ceil(bounds.width + pad * 2))
    const height = Math.max(1, Math.ceil(bounds.height + pad * 2))
    const viewport = wrapperRef.current?.querySelector<HTMLElement>('.react-flow__viewport')
    const bg = resolvedTheme === 'light' ? '#ffffff' : '#000000'
    return {
      viewport,
      hasNodes: flowNodes.length > 0,
      params: {
        backgroundColor: bg,
        quality: 0.95,
        pixelRatio: 2,
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${pad - bounds.x}px, ${pad - bounds.y}px) scale(1)`,
        },
      },
    }
  }, [getNodes, resolvedTheme])

  const exportImage = useCallback(
    async (mode: 'jpeg' | 'svg' | 'clipboard') => {
      const { viewport, hasNodes, params } = captureOptions()
      if (!viewport || !hasNodes) {
        toast.error('Nothing to export')
        return
      }
      setIsExporting(true)
      const baseName = `${erd?.database ?? 'schema'}${erd?.schema ? `.${erd.schema}` : ''}-erd`
      try {
        if (mode === 'jpeg') {
          const dataUrl = await toJpeg(viewport, params)
          const base64 = dataUrl.split(',')[1]
          const path = await saveImageFile(base64, `${baseName}.jpg`)
          if (path) toast.success('Saved JPEG', { description: path })
        } else if (mode === 'svg') {
          const dataUrl = await toSvg(viewport, params)
          const svg = decodeURIComponent(
            dataUrl.replace(/^data:image\/svg\+xml;charset=utf-8,/, ''),
          )
          let path = await showSaveDialog(`${baseName}.svg`)
          if (path) {
            if (!path.toLowerCase().endsWith('.svg')) path += '.svg'
            await writeTextFile(path, svg)
            toast.success('Saved SVG', { description: path })
          }
        } else {
          // Clipboard images are only reliably accepted as PNG.
          const blob = await toBlob(viewport, params)
          if (!blob) throw new Error('Could not render image')
          await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })])
          toast.success('Copied diagram to clipboard')
        }
      } catch (e) {
        erdLogger.error('ERD export failed', e)
        toast.error('Export failed', { description: formatErrorMessage(e) })
      } finally {
        setIsExporting(false)
      }
    },
    [captureOptions, erd?.database, erd?.schema],
  )

  // ── reconnect (disconnected, no snapshot) ──────────────────────────
  const [connecting, setConnecting] = useState(false)
  const reconnect = useCallback(async () => {
    const info = savedConnections.find((c) => c.id === connectionId)
    if (!info) return
    setConnecting(true)
    try {
      await connectSaved(info)
    } catch (e) {
      toast.error('Connection failed', { description: formatErrorMessage(e) })
    } finally {
      setConnecting(false)
    }
  }, [savedConnections, connectionId])

  if (!tab || !erd) return null

  // Disconnected and nothing cached → offer reconnect.
  if (!schema && !runtimeConnectionId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 bg-background text-muted-foreground">
        <IconDatabaseOff className="size-8 opacity-40" />
        <span className="text-sm">
          Connect to generate the ERD for “{erd.schema ?? erd.database}”.
        </span>
        <button
          type="button"
          onClick={reconnect}
          disabled={connecting}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent disabled:opacity-50"
        >
          <IconPlugConnected className="size-4" />
          {connecting ? 'Connecting…' : 'Reconnect'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ErdToolbar
        showColumnTypes={erd.showColumnTypes}
        layoutDirection={erd.layoutDirection}
        hiddenTables={erd.hiddenTables}
        isRefreshing={isRefreshing}
        isExporting={isExporting}
        onSetLayout={setLayout}
        onTidyUp={tidyUp}
        onToggleColumnTypes={toggleColumnTypes}
        onAddNote={addNote}
        onRefresh={() => void fetchSchema(true)}
        onUnhideTable={unhideTable}
        onExportJpeg={() => void exportImage('jpeg')}
        onExportSvg={() => void exportImage('svg')}
        onCopyImage={() => void exportImage('clipboard')}
      />
      <div ref={wrapperRef} className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          nodeTypes={nodeTypes}
          colorMode={resolvedTheme}
          fitView
          minZoom={0.1}
          proOptions={{ hideAttribution: true }}
          style={{ background: resolvedTheme === 'dark' ? '#000000' : '#ffffff' }}
        >
          <Background
            bgColor={resolvedTheme === 'dark' ? '#000000' : undefined}
            color={resolvedTheme === 'dark' ? '#2a2a30' : undefined}
          />
          <Controls />
          <MiniMap
            pannable
            zoomable
            maskColor={resolvedTheme === 'dark' ? 'rgba(0,0,0,0.6)' : undefined}
            className="!bg-[#1d1d22]"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
