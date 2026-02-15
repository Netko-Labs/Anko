import { IconDatabase as DatabaseIcon, IconCopy, IconRefresh } from '@tabler/icons-react'
import { memo } from 'react'
import { toast } from 'sonner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { setsEqual } from '@/lib/utils'
import type { DatabaseNodeProps } from '../../definitions'
import { TreeNode } from '../TreeNode'
import { SchemaNode } from './SchemaNode'
import { TableNode } from './TableNode'

export const DatabaseNode = memo(
  function DatabaseNode({
    database,
    isPostgreSQL,
    schemas,
    tablesCache,
    columnsCache,
    isExpanded,
    isLoadingSchemas,
    isLoadingTables,
    loadingColumns,
    expandedSchemas,
    expandedTables,
    onDatabaseClick,
    onSchemaClick,
    onTableClick,
    onInsertText,
    onRefreshTables,
    onRefreshColumns,
    onOpenTable,
  }: DatabaseNodeProps) {
    const handleCopyName = () => {
      navigator.clipboard.writeText(database.name)
      toast.success('Copied to clipboard')
    }

    const isLoading = isPostgreSQL ? isLoadingSchemas : isLoadingTables.has(database.name)

    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <TreeNode
            label={database.name}
            icon={<DatabaseIcon className="size-3.5 text-primary" />}
            isExpanded={isExpanded}
            isExpandable
            isLoading={isLoading}
            onClick={onDatabaseClick}
            onDoubleClick={() => onInsertText?.(database.name)}
            level={1}
          >
            {isPostgreSQL ? (
              schemas.length === 0 && !isLoadingSchemas ? (
                <div
                  className="py-1 text-[10px] text-muted-foreground"
                  style={{ paddingLeft: 2 * 12 + 8 }}
                >
                  No schemas found
                </div>
              ) : (
                schemas.map((schema) => {
                  const tablesKey = `${database.name}.${schema.name}`
                  const schemaExpandedKey = `${database.name}.${schema.name}`
                  return (
                    <SchemaNode
                      key={schema.name}
                      schema={schema}
                      databaseName={database.name}
                      tables={tablesCache[tablesKey] || []}
                      columnsCache={columnsCache}
                      isExpanded={expandedSchemas.has(schemaExpandedKey)}
                      isLoadingTables={isLoadingTables.has(tablesKey)}
                      loadingColumns={loadingColumns}
                      expandedTables={expandedTables}
                      onSchemaClick={() => onSchemaClick(schema.name)}
                      onTableClick={(table) => onTableClick(schema.name, table)}
                      onInsertText={onInsertText}
                      onRefreshColumns={(table) => onRefreshColumns?.(schema.name, table)}
                      onOpenTable={(table) => onOpenTable?.(schema.name, table)}
                    />
                  )
                })
              )
            ) : (tablesCache[database.name] || []).length === 0 &&
              !isLoadingTables.has(database.name) ? (
              <div
                className="py-1 text-[10px] text-muted-foreground"
                style={{ paddingLeft: 2 * 12 + 8 }}
              >
                No tables found
              </div>
            ) : (
              (tablesCache[database.name] || []).map((table) => (
                <TableNode
                  key={table.name}
                  table={table}
                  schemaOrDbName={database.name}
                  columns={columnsCache[`${database.name}.${table.name}`] || []}
                  isExpanded={expandedTables.has(`${database.name}.${table.name}`)}
                  isLoading={loadingColumns.has(`${database.name}.${table.name}`)}
                  onClick={() => onTableClick('', table.name)}
                  onInsertText={onInsertText}
                  onRefreshColumns={() => onRefreshColumns?.('', table.name)}
                  onOpenTable={() => onOpenTable?.('', table.name)}
                  level={2}
                />
              ))
            )}
          </TreeNode>
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-zinc-950 border-zinc-800">
          <ContextMenuItem onClick={handleCopyName}>
            <IconCopy className="size-4 mr-2" />
            Copy Name
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onRefreshTables?.('')}>
            <IconRefresh className="size-4 mr-2" />
            Refresh Tables
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    )
  },
  (prev, next) => {
    return (
      prev.database.name === next.database.name &&
      prev.isPostgreSQL === next.isPostgreSQL &&
      prev.isExpanded === next.isExpanded &&
      prev.isLoadingSchemas === next.isLoadingSchemas &&
      prev.schemas === next.schemas &&
      prev.tablesCache === next.tablesCache &&
      prev.columnsCache === next.columnsCache &&
      setsEqual(prev.isLoadingTables, next.isLoadingTables) &&
      setsEqual(prev.loadingColumns, next.loadingColumns) &&
      setsEqual(prev.expandedSchemas, next.expandedSchemas) &&
      setsEqual(prev.expandedTables, next.expandedTables) &&
      prev.onDatabaseClick === next.onDatabaseClick &&
      prev.onSchemaClick === next.onSchemaClick &&
      prev.onTableClick === next.onTableClick &&
      prev.onInsertText === next.onInsertText &&
      prev.onRefreshTables === next.onRefreshTables &&
      prev.onRefreshColumns === next.onRefreshColumns &&
      prev.onOpenTable === next.onOpenTable
    )
  },
)
