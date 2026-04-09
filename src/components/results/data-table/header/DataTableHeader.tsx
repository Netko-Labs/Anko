import { IconKey } from '@tabler/icons-react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColumnMeta } from '../../definitions'
import type { DataTableHeaderProps } from '../definitions'
import { getDisplayType } from '../utils'

export function DataTableHeader({ header }: DataTableHeaderProps) {
  const meta = header.column.columnDef.meta as ColumnMeta | undefined
  const canSort = header.column.getCanSort()
  const sortDirection = header.column.getIsSorted()

  if (meta?.isRowNumber) {
    return <span className="text-primary/80">#</span>
  }

  const handleKeyDown = canSort
    ? (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          header.column.getToggleSortingHandler()?.(e)
        }
      }
    : undefined

  const sortableProps = canSort
    ? {
        onClick: header.column.getToggleSortingHandler(),
        onKeyDown: handleKeyDown,
        role: 'button' as const,
        tabIndex: 0,
      }
    : {}

  return (
    <div
      className={cn('flex items-center gap-1.5', canSort && 'cursor-pointer select-none')}
      {...sortableProps}
    >
      {meta?.isPrimaryKey && <IconKey className="size-3 text-primary shrink-0" />}
      <span>{header.column.columnDef.header as string}</span>
      <span className="text-primary/70 font-normal">{getDisplayType(meta?.dataType || '')}</span>
      {canSort && (
        <span className="ml-1">
          {sortDirection === 'asc' ? (
            <ArrowUp className="size-3 text-primary" />
          ) : sortDirection === 'desc' ? (
            <ArrowDown className="size-3 text-primary" />
          ) : (
            <ArrowUpDown className="size-3 opacity-30" />
          )}
        </span>
      )}
    </div>
  )
}
