import { IconCopy, IconSchema } from '@tabler/icons-react'
import { memo } from 'react'
import { toast } from 'sonner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { setsEqual } from '@/lib/utils'
import type { SchemaNodeProps } from '../../definitions'
import { TreeNode } from '../TreeNode'
import { TableNode } from './TableNode'

export const SchemaNode = memo(
  function SchemaNode({
    schema,
    databaseName,
    tables,
    columnsCache,
    isExpanded,
    isLoadingTables,
    loadingColumns,
    expandedTables,
    onSchemaClick,
    onTableClick,
    onInsertText,
    onRefreshColumns,
    onOpenTable,
  }: SchemaNodeProps) {
    const handleCopyName = () => {
      navigator.clipboard.writeText(schema.name)
      toast.success('Copied to clipboard')
    }

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <TreeNode
            label={schema.name}
            icon={<IconSchema className="size-3.5 text-primary/80" />}
            isExpanded={isExpanded}
            isExpandable
            isLoading={isLoadingTables}
            onClick={onSchemaClick}
            onDoubleClick={() => onInsertText?.(schema.name)}
            level={2}
          >
            {tables.length === 0 && !isLoadingTables ? (
              <div
                className="py-1 text-[10px] text-muted-foreground"
                style={{ paddingLeft: 3 * 12 + 8 }}
              >
                No tables found
              </div>
            ) : (
              tables.map((table) => {
                const tableKey = `${databaseName}.${schema.name}.${table.name}`
                return (
                  <TableNode
                    key={table.name}
                    table={table}
                    schemaOrDbName={schema.name}
                    columns={columnsCache[`${databaseName}.${schema.name}.${table.name}`] || []}
                    isExpanded={expandedTables.has(tableKey)}
                    isLoading={loadingColumns.has(`${databaseName}.${schema.name}.${table.name}`)}
                    onClick={() => onTableClick(table.name)}
                    onInsertText={onInsertText}
                    onRefreshColumns={() => onRefreshColumns?.(table.name)}
                    onOpenTable={() => onOpenTable?.(table.name)}
                    level={3}
                  />
                )
              })
            )}
          </TreeNode>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-zinc-950 border-zinc-800">
          <ContextMenuItem onClick={handleCopyName}>
            <IconCopy className="size-4 mr-2" />
            Copy Name
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  },
  (prev, next) => {
    return (
      prev.schema.name === next.schema.name &&
      prev.databaseName === next.databaseName &&
      prev.isExpanded === next.isExpanded &&
      prev.isLoadingTables === next.isLoadingTables &&
      prev.tables === next.tables &&
      prev.columnsCache === next.columnsCache &&
      setsEqual(prev.loadingColumns, next.loadingColumns) &&
      setsEqual(prev.expandedTables, next.expandedTables) &&
      prev.onSchemaClick === next.onSchemaClick &&
      prev.onTableClick === next.onTableClick &&
      prev.onInsertText === next.onInsertText &&
      prev.onRefreshColumns === next.onRefreshColumns &&
      prev.onOpenTable === next.onOpenTable
    )
  },
)
