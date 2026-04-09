import { IconBraces, IconDatabase, IconTable } from '@tabler/icons-react'
import { lazy, Suspense, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import type { TabId, TableInfo } from '@/stores/right-sidebar/definitions/types'
import { DataTabContent } from '../data-tab-content/DataTabContent'
import { RIGHT_SIDEBAR_VALUES } from '../definitions'
import { TableSchemaView } from '../table-schema-view/TableSchemaView'
import { UtilitiesTabFallback } from '../utilities-tab-fallback/UtilitiesTabFallback'

const ZodGeneratorView = lazy(() =>
  import('../zod-generator-view/ZodGeneratorView').then((module) => ({
    default: module.ZodGeneratorView,
  })),
)

const TABS: { id: TabId; icon: typeof IconDatabase; label: string }[] = [
  { id: 'data', icon: IconDatabase, label: 'Data' },
  { id: 'table', icon: IconTable, label: 'Table' },
  { id: 'utilities', icon: IconBraces, label: 'Utils' },
]

export function RightSidebarContent() {
  const context = useRightSidebarStore((s) => s.context)
  const currentTableInfo = useRightSidebarStore((s) => s.currentTableInfo)
  const activeTab = useRightSidebarStore((s) => s.activeTab)
  const setActiveTab = useRightSidebarStore((s) => s.setActiveTab)

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

  const hasTableContent = tableInfo !== null && tableInfo.tableName !== ''

  if (context.type === 'none') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center px-3 h-8 border-b border-border">
          <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
            {RIGHT_SIDEBAR_VALUES.detailsTitle}
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            {RIGHT_SIDEBAR_VALUES.emptyState}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Icon tab strip */}
      <div className="relative flex items-center gap-0.5 px-2.5 pt-2 pb-1.5">
        {TABS.map(({ id, icon: Icon }) => {
          const isActive = activeTab === id
          const isDisabled = id !== 'data' && !hasTableContent

          return (
            <button
              key={id}
              type="button"
              title={id}
              disabled={isDisabled}
              onClick={() => setActiveTab(id)}
              className={cn(
                'relative h-7 w-7 flex items-center justify-center rounded-[5px] transition-all duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-sidebar-foreground/40 hover:text-sidebar-foreground/80',
                isDisabled && 'opacity-35 cursor-not-allowed hover:text-sidebar-foreground/35',
              )}
            >
              <Icon className="size-4" />
              {isActive && (
                <span className="absolute -bottom-1.5 left-1 right-1 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          )
        })}

        {/* Bottom rule */}
        <div className="absolute bottom-0 left-2.5 right-2.5 h-px bg-border" />
      </div>

      {/* Tab content */}
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
