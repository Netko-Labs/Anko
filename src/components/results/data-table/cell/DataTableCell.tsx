import type { DataTableCellProps } from '../lib'
import { formatCellValue } from '../lib/utils'

export function DataTableCell({ cell }: DataTableCellProps) {
  return formatCellValue(cell.getValue())
}
