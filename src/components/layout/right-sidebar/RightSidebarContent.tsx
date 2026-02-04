import { IconBraces, IconDatabase, IconTable } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import type { TableInfo } from '@/stores/right-sidebar/definitions/types'
import { CellDetails } from './CellDetails'
import { RowDetails } from './RowDetails'
import { TableSchemaView } from './TableSchemaView'
import { ZodGeneratorView } from './ZodGeneratorView'

type TabId = 'data' | 'table' | 'utilities'

export function RightSidebarContextContent() {
  const context = useRightSidebarStore((s) => s.context)
  const currentTableInfo = useRightSidebarStore((s) => s.currentTableInfo)
  const [activeTab, setActiveTab] = useState<TabId>('data')

  // Get table info from context or current table info
  const tableInfo: TableInfo | null = useMemo(() => {
    if (context.type === 'table') {
      return {
        tableName: context.tableName,
        columns: context.columns,
        database: context.database,
        schema: context.schema,
      }
    }
    if (context.type === 'row' || context.type === 'cell') {
      return context.tableInfo
    }
    return currentTableInfo
  }, [context, currentTableInfo])

  // Table and Utils tabs are available if we have table info
  const hasTableContent = tableInfo !== null && tableInfo.tableName !== ''

  // If no context, show empty state
  if (context.type === 'none') {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center px-4 py-3 border-b border-border/50">
          <span className="text-sm font-semibold text-foreground tracking-tight">Details</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="size-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3 border border-border/50">
              <IconDatabase className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">No selection</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Select a row or cell to view details
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      {/* Custom Tab List */}
      <div className="border-b border-border/50 px-3 pt-3 pb-3">
        <div className="flex items-center bg-muted/30 rounded-xl p-1 border border-border/30">
          <TabButton active={activeTab === 'data'} onClick={() => setActiveTab('data')}>
            <IconDatabase className="size-3.5" />
            Data
          </TabButton>
          <TabButton
            active={activeTab === 'table'}
            onClick={() => setActiveTab('table')}
            disabled={!hasTableContent}
          >
            <IconTable className="size-3.5" />
            Table
          </TabButton>
          <TabButton
            active={activeTab === 'utilities'}
            onClick={() => setActiveTab('utilities')}
            disabled={!hasTableContent}
          >
            <IconBraces className="size-3.5" />
            Utils
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'data' && <DataTabContent />}
        {activeTab === 'table' && hasTableContent && tableInfo && (
          <TableSchemaView
            tableName={tableInfo.tableName}
            columns={tableInfo.columns}
            database={tableInfo.database}
            schema={tableInfo.schema}
          />
        )}
        {activeTab === 'utilities' && hasTableContent && tableInfo && (
          <ZodGeneratorView tableName={tableInfo.tableName} columns={tableInfo.columns} />
        )}
      </div>
    </div>
  )
}

interface TabButtonProps {
  active: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

function TabButton({ active, onClick, disabled, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200',
        active 
          ? 'bg-background text-foreground shadow-sm border border-border/30' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

function DataTabContent() {
  const context = useRightSidebarStore((s) => s.context)

  switch (context.type) {
    case 'row':
      return (
        <div className="h-full overflow-hidden">
          <RowDetails row={context.row} columns={context.columns} />
        </div>
      )
    case 'cell':
      return (
        <div className="h-full overflow-hidden">
          <CellDetails
            value={context.value}
            columnName={context.columnName}
            columnType={context.columnType}
          />
        </div>
      )
    case 'table':
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center">
            <div className="size-10 rounded-lg bg-muted/30 flex items-center justify-center mx-auto mb-3 border border-border/50">
              <IconTable className="size-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">Table loaded</p>
            <p className="text-xs text-muted-foreground/60 mt-1 max-w-[180px]">
              Click a row to see its data, or double-click a cell to inspect
            </p>
          </div>
        </div>
      )
    default:
      return (
        <div className="h-full flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Select a row or cell</p>
          </div>
        </div>
      )
  }
}
