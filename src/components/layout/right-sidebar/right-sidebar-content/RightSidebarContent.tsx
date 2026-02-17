import { IconBraces, IconDatabase, IconTable } from '@tabler/icons-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import type { TableInfo } from '@/stores/right-sidebar/definitions/types'
import { DataTabContent } from '../data-tab-content/DataTabContent'
import { RIGHT_SIDEBAR_VALUES, type TabId } from '../definitions'
import { TableSchemaView } from '../table-schema-view/TableSchemaView'
import { TabButton } from '../tab-button/TabButton'
import { UtilitiesTabFallback } from '../utilities-tab-fallback/UtilitiesTabFallback'

const ZodGeneratorView = lazy(() =>
  import('../zod-generator-view/ZodGeneratorView').then((module) => ({
    default: module.ZodGeneratorView,
  })),
)

export function RightSidebarContent() {
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
      <div className="flex flex-col h-full">
        <div className="flex items-center px-3 py-2 border-b">
          <span className="text-xs font-medium text-foreground">{RIGHT_SIDEBAR_VALUES.detailsTitle}</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">{RIGHT_SIDEBAR_VALUES.emptyState}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Custom Tab List */}
      <div className="border-b px-2 pt-2 pb-2">
        <div className="flex items-center bg-muted rounded-lg p-[3px]">
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
          <Suspense fallback={<UtilitiesTabFallback />}>
            <ZodGeneratorView tableName={tableInfo.tableName} columns={tableInfo.columns} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
