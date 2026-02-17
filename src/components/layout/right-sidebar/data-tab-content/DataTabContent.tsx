import { useRightSidebarStore } from '@/stores/right-sidebar'
import { RIGHT_SIDEBAR_VALUES } from '../definitions'
import { CellDetails } from '../right-sidebar-cell-details/CellDetails'
import { RowDetails } from '../row-details/RowDetails'

export function DataTabContent() {
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
        <div className="h-full flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">{RIGHT_SIDEBAR_VALUES.tableHint}</p>
        </div>
      )
    default:
      return (
        <div className="h-full flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">{RIGHT_SIDEBAR_VALUES.dataHint}</p>
        </div>
      )
  }
}
