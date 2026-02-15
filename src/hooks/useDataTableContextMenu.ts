import { useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import type { QueryResult } from '@/types'

// Special markers for new rows
const NEW_ROW_MARKER = '__isNewRow'
const CHANGE_ID_MARKER = '__changeId'

export function useDataTableContextMenu(result: QueryResult) {
  const contextMenuCellRef = useRef<{
    value: unknown
    columnName: string
    dataType: string
    row: Record<string, unknown>
  } | null>(null)

  const showRowDetails = useRightSidebarStore((s) => s.showRowDetails)
  const showCellDetails = useRightSidebarStore((s) => s.showCellDetails)

  const columnDetails = useMemo(
    () =>
      result.columns.map((col) => ({
        name: col.name,
        data_type: col.data_type,
        nullable: col.nullable,
        key: (col as { key?: string }).key,
        default_value: (col as { default_value?: string }).default_value,
        extra: (col as { extra?: string }).extra,
      })),
    [result.columns],
  )

  const handleRowClick = useCallback(
    (row: Record<string, unknown>) => {
      const cleanRow = { ...row }
      delete cleanRow[NEW_ROW_MARKER]
      delete cleanRow[CHANGE_ID_MARKER]
      showRowDetails(cleanRow, columnDetails)
    },
    [showRowDetails, columnDetails],
  )

  const handleCellDoubleClick = useCallback(
    (value: unknown, columnName: string, dataType: string) => {
      showCellDetails(value, columnName, dataType)
    },
    [showCellDetails],
  )

  const handleCopyCellValue = useCallback(() => {
    const cellInfo = contextMenuCellRef.current
    if (!cellInfo) return

    const valueStr = cellInfo.value === null ? 'NULL' : String(cellInfo.value)
    navigator.clipboard.writeText(valueStr)
    toast.success('Cell value copied to clipboard')
  }, [])

  const handleCopyRowAsJson = useCallback(() => {
    const cellInfo = contextMenuCellRef.current
    if (!cellInfo) return

    const cleanRow = { ...cellInfo.row }
    delete cleanRow[NEW_ROW_MARKER]
    delete cleanRow[CHANGE_ID_MARKER]

    navigator.clipboard.writeText(JSON.stringify(cleanRow, null, 2))
    toast.success('Row copied as JSON')
  }, [])

  const handleViewRowDetails = useCallback(() => {
    const cellInfo = contextMenuCellRef.current
    if (!cellInfo) return

    const cleanRow = { ...cellInfo.row }
    delete cleanRow[NEW_ROW_MARKER]
    delete cleanRow[CHANGE_ID_MARKER]
    showRowDetails(cleanRow, columnDetails)
  }, [showRowDetails, columnDetails])

  const handleViewCellDetails = useCallback(() => {
    const cellInfo = contextMenuCellRef.current
    if (!cellInfo) return

    showCellDetails(cellInfo.value, cellInfo.columnName, cellInfo.dataType)
  }, [showCellDetails])

  return {
    contextMenuCellRef,
    handleRowClick,
    handleCellDoubleClick,
    handleCopyCellValue,
    handleCopyRowAsJson,
    handleViewRowDetails,
    handleViewCellDetails,
  }
}
