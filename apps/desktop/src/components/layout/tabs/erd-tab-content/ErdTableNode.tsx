import type { ErdColumn } from '@anko/desktop-domain'
import {
  IconChevronDown,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconKey,
  IconLink,
  IconTable,
} from '@tabler/icons-react'
import { Handle, type NodeProps, Position } from '@xyflow/react'
import { memo } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import { ERD_COLORS, type ErdTableNodeData, HEADER_HEIGHT, NODE_WIDTH, ROW_HEIGHT } from './lib'
import { sourceHandleId, targetHandleId } from './lib/utils/erd-graph'

/** A small uppercase modifier chip (PK / AI / U). */
function Badge({ label, title, className }: { label: string; title: string; className?: string }) {
  return (
    <span
      title={title}
      className={cn('rounded px-1 text-[8px] font-bold leading-[14px] tracking-wide', className)}
    >
      {label}
    </span>
  )
}

function ColumnRow({
  col,
  showColumnTypes,
  fkTarget,
  onHide,
}: {
  col: ErdColumn
  showColumnTypes: boolean
  fkTarget?: string
  onHide: () => void
}) {
  // Full column detail on hover — everything that doesn't fit as a chip.
  const tooltip = [
    `${col.name} ${col.data_type}`,
    col.nullable ? 'NULL' : 'NOT NULL',
    col.isPrimaryKey && 'PRIMARY KEY',
    col.isUnique && !col.isPrimaryKey && 'UNIQUE',
    col.isAutoIncrement && 'AUTO_INCREMENT',
    col.defaultValue != null && `DEFAULT ${col.defaultValue}`,
    fkTarget && `→ ${fkTarget}`,
  ]
    .filter(Boolean)
    .join('  ·  ')

  return (
    <div
      title={tooltip}
      className="group/col relative flex items-center gap-1.5 px-2 hover:bg-accent/40"
      style={{ height: ROW_HEIGHT }}
    >
      <Handle
        type="target"
        id={targetHandleId(col.name)}
        position={Position.Left}
        className="!size-2 !bg-muted-foreground/50 !border-0"
      />

      <span className="w-3.5 shrink-0 flex justify-center">
        {col.isPrimaryKey ? (
          <IconKey className="size-3 text-amber-500" />
        ) : col.isForeignKey ? (
          <IconLink className="size-3 text-sky-400" />
        ) : null}
      </span>

      <span
        className={cn(
          'truncate text-[11px]',
          col.isPrimaryKey ? 'font-semibold text-foreground' : 'text-foreground/90',
          !col.nullable && 'after:content-["*"] after:text-rose-400/80 after:ml-0.5',
        )}
      >
        {col.name}
      </span>

      {/* Modifier chips */}
      <span className="flex items-center gap-0.5 shrink-0">
        {col.isUnique && !col.isPrimaryKey && (
          <Badge label="U" title="Unique" className="bg-violet-500/15 text-violet-400" />
        )}
        {col.isAutoIncrement && (
          <Badge label="AI" title="Auto-increment" className="bg-emerald-500/15 text-emerald-400" />
        )}
      </span>

      {showColumnTypes && (
        <span className="ml-auto whitespace-nowrap font-mono text-[10px] text-muted-foreground group-hover/col:opacity-0">
          {col.data_type}
        </span>
      )}

      <button
        type="button"
        title="Hide column"
        onClick={(e) => {
          e.stopPropagation()
          onHide()
        }}
        className="absolute right-1 hidden group-hover/col:flex items-center justify-center size-4 rounded bg-card text-muted-foreground hover:text-foreground"
      >
        <IconEyeOff className="size-3" />
      </button>

      <Handle
        type="source"
        id={sourceHandleId(col.name)}
        position={Position.Right}
        className="!size-2 !bg-muted-foreground/50 !border-0"
      />
    </div>
  )
}

/**
 * A table card in the ERD: a colored header (name + collapse + context menu) and
 * a list of column rows annotated with key/FK icons and PK/unique/auto-increment
 * chips, a not-null marker (*), and the column type. Hidden default handles on
 * the header are the fall-back endpoints for edges whose column is hidden or
 * whose table is collapsed.
 */
function ErdTableNodeComponent({ data, selected }: NodeProps) {
  const { table, color, collapsed, hiddenColumns, showColumnTypes, fkTargets, actions } =
    data as ErdTableNodeData
  const accent = color ?? 'var(--color-primary, #6366f1)'
  const hidden = new Set(hiddenColumns)
  const visibleColumns = table.columns.filter((c) => !hidden.has(c.name))
  const hiddenCols = table.columns.filter((c) => hidden.has(c.name))
  const pkCount = table.columns.filter((c) => c.isPrimaryKey).length

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className={cn(
            'rounded-lg border bg-white dark:bg-[#1d1d22] shadow-md overflow-hidden transition-shadow',
            selected
              ? 'border-primary ring-2 ring-primary/40'
              : 'border-border dark:border-white/10',
          )}
          style={{ width: NODE_WIDTH }}
        >
          <Handle
            type="target"
            position={Position.Left}
            className="!opacity-0 !pointer-events-none"
            style={{ top: HEADER_HEIGHT / 2 }}
          />
          <Handle
            type="source"
            position={Position.Right}
            className="!opacity-0 !pointer-events-none"
            style={{ top: HEADER_HEIGHT / 2 }}
          />

          {/* Header */}
          <button
            type="button"
            onClick={() => actions.onToggleCollapse(table.name)}
            className="flex items-center gap-1.5 w-full px-2 text-left text-white"
            style={{
              height: HEADER_HEIGHT,
              background: `linear-gradient(180deg, ${accent}, color-mix(in srgb, ${accent} 82%, black))`,
            }}
          >
            {collapsed ? (
              <IconChevronRight className="size-3.5 shrink-0 opacity-90" />
            ) : (
              <IconChevronDown className="size-3.5 shrink-0 opacity-90" />
            )}
            <IconTable className="size-3.5 shrink-0 opacity-90" />
            <span className="truncate text-xs font-semibold tracking-tight">{table.name}</span>
            <span className="ml-auto rounded bg-white/20 px-1 text-[9px] font-medium leading-[14px]">
              {pkCount > 0 ? `${table.columns.length} · ${pkCount}pk` : table.columns.length}
            </span>
          </button>

          {/* Columns */}
          {!collapsed && (
            <div className="divide-y divide-border/50">
              {visibleColumns.map((col) => (
                <ColumnRow
                  key={col.name}
                  col={col}
                  showColumnTypes={showColumnTypes}
                  fkTarget={fkTargets[col.name]}
                  onHide={() => actions.onHideColumn(table.name, col.name)}
                />
              ))}
              {visibleColumns.length === 0 && (
                <div
                  className="px-2 text-[10px] text-muted-foreground italic flex items-center"
                  style={{ height: ROW_HEIGHT }}
                >
                  all columns hidden
                </div>
              )}
              {hiddenCols.length > 0 && (
                <button
                  type="button"
                  onClick={() => actions.onUnhideAllColumns(table.name)}
                  title="Show hidden columns"
                  className="flex items-center gap-1 w-full px-2 text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/40"
                  style={{ height: ROW_HEIGHT }}
                >
                  <IconEye className="size-3" />+{hiddenCols.length} hidden
                </button>
              )}
            </div>
          )}
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent className="w-44">
        <ContextMenuItem onClick={() => actions.onToggleCollapse(table.name)}>
          {collapsed ? 'Expand' : 'Collapse'}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => actions.onHideTable(table.name)}>
          <IconEyeOff className="size-4 mr-2" />
          Hide table
        </ContextMenuItem>
        {hiddenCols.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <IconEye className="size-4 mr-2" />
              Show columns ({hiddenCols.length})
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="max-h-72 overflow-auto">
              {hiddenCols.map((c) => (
                <ContextMenuItem
                  key={c.name}
                  onClick={() => actions.onUnhideColumn(table.name, c.name)}
                >
                  {c.name}
                </ContextMenuItem>
              ))}
              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => actions.onUnhideAllColumns(table.name)}>
                Show all
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
        <ContextMenuSeparator />
        <div className="flex flex-wrap gap-1 px-2 py-1.5">
          {ERD_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={c}
              onClick={() => actions.onSetColor(table.name, c)}
              className="size-4 rounded-full border border-border/50 hover:scale-110 transition-transform"
              style={{ background: c }}
            />
          ))}
          <button
            type="button"
            title="Reset color"
            onClick={() => actions.onSetColor(table.name, undefined)}
            className="size-4 rounded-full border border-border bg-transparent text-[9px] leading-none text-muted-foreground"
          >
            ✕
          </button>
        </div>
      </ContextMenuContent>
    </ContextMenu>
  )
}

export const ErdTableNode = memo(ErdTableNodeComponent)
