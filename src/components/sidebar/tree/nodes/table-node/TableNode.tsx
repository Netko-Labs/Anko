import { IconCopy, IconEye, IconPlayerPlay, IconRefresh, IconTable } from '@tabler/icons-react'
import { memo } from 'react'
import { toast } from 'sonner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { TableNodeProps } from '../../../definitions'
import { TreeNode } from '../../TreeNode'
import { ColumnNode } from '../column-node/ColumnNode'

export const TableNode = memo(
  function TableNode({
    table,
    schemaOrDbName,
    columns,
    isExpanded,
    isLoading,
    onClick,
    onInsertText,
    onRefreshColumns,
    onOpenTable,
    level = 2,
  }: TableNodeProps) {
    const isView = table.table_type === 'VIEW'

    const handleCopyName = () => {
      navigator.clipboard.writeText(table.name)
      toast.success('Copied to clipboard')
    }

    const handleCopyFullName = () => {
      navigator.clipboard.writeText(`${schemaOrDbName}.${table.name}`)
      toast.success('Copied to clipboard')
    }

    const handleCopySelectQuery = () => {
      navigator.clipboard.writeText(`SELECT * FROM ${schemaOrDbName}.${table.name} LIMIT 100;`)
      toast.success('Copied SELECT query')
    }

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <TreeNode
            label={table.name}
            secondaryLabel={table.row_count != null ? table.row_count.toLocaleString() : undefined}
            icon={
              isView ? (
                <IconEye className="size-3.5 text-primary/70" />
              ) : (
                <IconTable className="size-3.5 text-primary/80" />
              )
            }
            isExpanded={isExpanded}
            isExpandable
            isLoading={isLoading}
            onClick={onClick}
            onDoubleClick={onOpenTable}
            level={level}
          >
            {columns.map((col) => (
              <ColumnNode
                key={col.name}
                column={col}
                onClick={() => onInsertText?.(col.name)}
                level={level + 1}
              />
            ))}
          </TreeNode>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={onOpenTable}>
            <IconTable className="size-4 mr-2" />
            Open Table
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopySelectQuery}>
            <IconPlayerPlay className="size-4 mr-2" />
            Copy SELECT Query
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleCopyName}>
            <IconCopy className="size-4 mr-2" />
            Copy Name
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyFullName}>
            <IconCopy className="size-4 mr-2" />
            Copy Full Name
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={onRefreshColumns}>
            <IconRefresh className="size-4 mr-2" />
            Refresh Columns
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  },
  (prev, next) => {
    return (
      prev.table.name === next.table.name &&
      prev.table.table_type === next.table.table_type &&
      prev.table.row_count === next.table.row_count &&
      prev.schemaOrDbName === next.schemaOrDbName &&
      prev.isExpanded === next.isExpanded &&
      prev.isLoading === next.isLoading &&
      prev.level === next.level &&
      prev.columns === next.columns &&
      prev.onClick === next.onClick &&
      prev.onInsertText === next.onInsertText &&
      prev.onRefreshColumns === next.onRefreshColumns &&
      prev.onOpenTable === next.onOpenTable
    )
  },
)
