import { Columns } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DataTableToolbarProps } from '../definitions'
import type { Column } from '@tanstack/react-table'

export function DataTableToolbar({ table }: DataTableToolbarProps) {
  const hidableColumns = table.getAllColumns().filter((col) => col.getCanHide()) as Column<
    Record<string, unknown>,
    unknown
  >[]

  if (hidableColumns.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card">
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex items-center justify-center gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          render={<button type="button" />}
        >
          <Columns className="size-3" />
          Columns
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {hidableColumns.map((column: Column<Record<string, unknown>, unknown>) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value: boolean | string) => column.toggleVisibility(!!value)}
              className="text-xs"
            >
              {column.id}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
