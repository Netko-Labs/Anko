import type { DataTableCellProps } from '../definitions'
import { formatCellValue } from '../utils'

export function DataTableCell({ cell }: DataTableCellProps) {
  return formatCellValue(cell.getValue())
}
