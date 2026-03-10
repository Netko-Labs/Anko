import { IconPencil, IconPlugConnected, IconTrash } from '@tabler/icons-react'
import { useReducer } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useTreeDataLoading } from '@/hooks/useTreeDataLoading'
import { useTreeEventHandlers } from '@/hooks/useTreeEventHandlers'
import { initialTreeState, treeReducer } from '@/reducers/tree-reducer'
import { useConnectionStore } from '@/stores/connection'
import type { DatabaseTreeProps } from '../definitions'
import { DatabaseTypeIcon } from './database-icons'
import { DatabaseNode } from './nodes'
import { TreeNode } from './TreeNode'

export function DatabaseTree({ connection, onEdit, onDelete, onInsertText }: DatabaseTreeProps) {
  const { connectionId, info } = connection

  const schemaCache = useConnectionStore((s) => s.schemaCache[connectionId])
  const isPostgreSQL = info.driver === 'postgresql'

  const [state, dispatch] = useReducer(treeReducer, initialTreeState)

  // Get cached data
  const databases = schemaCache?.databases || []
  const schemasCache = schemaCache?.schemas || {}
  const tablesCache = schemaCache?.tables || {}
  const columnsCache = schemaCache?.columns || {}

  // Data loading hooks
  const dataLoaders = useTreeDataLoading(connectionId, state, dispatch)

  // Event handlers
  const {
    handleConnectionClick,
    handleDatabaseClick,
    handleSchemaClick,
    handleTableClick,
    handleDisconnect,
    handleOpenTable,
    handleRefreshTables,
    handleRefreshColumns,
  } = useTreeEventHandlers({ connection, isPostgreSQL, state, dispatch, dataLoaders })

  return (
    <div>
      {/* Connection node */}
      <ContextMenu>
        <ContextMenuTrigger>
          <TreeNode
            label={info.name}
            secondaryLabel={`${info.host}:${info.port}`}
            icon={
              <DatabaseTypeIcon driver={info.driver} className="size-4 text-muted-foreground" />
            }
            rightIcon={<span className="size-2 rounded-full bg-green-500" title="Connected" />}
            isExpanded={state.isExpanded}
            isExpandable
            isLoading={state.loadingDatabases}
            onClick={handleConnectionClick}
            level={0}
          />
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleDisconnect}>
            <IconPlugConnected className="size-4 mr-2" />
            Disconnect
          </ContextMenuItem>
          {onEdit && (
            <ContextMenuItem onClick={onEdit}>
              <IconPencil className="size-4 mr-2" />
              Edit Connection
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          {onDelete && (
            <ContextMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
              <IconTrash className="size-4 mr-2" />
              Delete Connection
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Databases */}
      {state.isExpanded && (
        <div>
          {databases.map((db) => (
            <DatabaseNode
              key={db.name}
              database={db}
              isPostgreSQL={isPostgreSQL}
              schemas={schemasCache[db.name] || []}
              tablesCache={tablesCache}
              columnsCache={columnsCache}
              isExpanded={state.expandedDatabases.has(db.name)}
              isLoadingSchemas={state.loadingSchemas.has(db.name)}
              isLoadingTables={state.loadingTables}
              loadingColumns={state.loadingColumns}
              expandedSchemas={state.expandedSchemas}
              expandedTables={state.expandedTables}
              onDatabaseClick={() => handleDatabaseClick(db.name)}
              onSchemaClick={(schema) => handleSchemaClick(db.name, schema)}
              onTableClick={(schema, table) => handleTableClick(db.name, schema, table)}
              onInsertText={onInsertText}
              onRefreshTables={(schema) => handleRefreshTables(db.name, schema)}
              onRefreshColumns={(schema, table) => handleRefreshColumns(db.name, schema, table)}
              onOpenTable={(schema, table) => handleOpenTable(db.name, schema, table)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
