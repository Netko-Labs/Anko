import { IconClipboard, IconCode, IconEye, IconRowInsertBottom } from '@tabler/icons-react'
import {
  type ColumnSizingState,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDataTableContextMenu } from '@/hooks/useDataTableContextMenu'
import { useRowChangeTracking } from '@/hooks/useRowChangeTracking'
import { tableLogger } from '@/lib/debug'
import { cn } from '@/lib/utils'
import type { PendingRowChange } from '@/types'
import { DataTableCell } from '../data-table/cell/DataTableCell'
import { createDynamicColumns } from '../data-table/columns'
import {
  CHANGE_ID_MARKER,
  DATA_TABLE_VALUES,
  EMPTY_CHANGES,
  EMPTY_PK_COLUMNS,
  NEW_ROW_MARKER,
} from '../data-table/definitions'
import { EditableCell } from '../data-table/editable-cell/EditableCell'
import { DataTableHeader } from '../data-table/header/DataTableHeader'
import { RowActions } from '../data-table/row-actions/RowActions'
import { convertRowsToObjects } from '../data-table/utils'
import type { ColumnMeta, DataTableProps } from '../definitions'

export const DataTable = memo(function DataTable({
  result,
  enableSorting = true,
  isEditMode = false,
  pendingChanges = EMPTY_CHANGES,
  primaryKeyColumns = EMPTY_PK_COLUMNS,
  onCellEdit,
  onRowDelete,
  onUndoRowDelete,
  onRemoveNewRow,
  onUpdateNewRowCell,
  onTableReady,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  // Row change tracking hook
  const { getPrimaryKeyValues, getRowDeletionChangeId, isCellModified } = useRowChangeTracking(
    pendingChanges,
    primaryKeyColumns,
  )

  // Context menu hook
  const {
    contextMenuCellRef,
    handleRowClick,
    handleCellDoubleClick,
    handleCopyCellValue,
    handleCopyRowAsJson,
    handleViewRowDetails,
    handleViewCellDetails,
  } = useDataTableContextMenu(result)

  // Memoize data conversion for existing rows
  const existingData = useMemo(
    () => convertRowsToObjects(result.rows, result.columns),
    [result.rows, result.columns],
  )

  // Extract insert changes and create new row data
  const insertChanges = useMemo(
    () => pendingChanges.filter((c: PendingRowChange) => c.type === 'insert'),
    [pendingChanges],
  )

  const newRowsData = useMemo(
    () =>
      insertChanges.map((c: PendingRowChange) => ({
        ...(c.newRow ?? {}),
        [NEW_ROW_MARKER]: true,
        [CHANGE_ID_MARKER]: c.id,
      })),
    [insertChanges],
  )

  // Combine new rows (at top) with existing data
  const data = useMemo(() => [...newRowsData, ...existingData], [newRowsData, existingData])

  // Memoize column definitions
  const columns = useMemo(() => createDynamicColumns(result.columns), [result.columns])

  // Memoize row model getters
  const coreRowModel = useMemo(() => getCoreRowModel(), [])
  const sortedRowModel = useMemo(
    () => (enableSorting ? getSortedRowModel() : undefined),
    [enableSorting],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: coreRowModel,
    getSortedRowModel: sortedRowModel,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnVisibility,
      columnSizing,
    },
  })

  // Expose table instance to parent
  useEffect(() => {
    onTableReady?.(table)
  }, [table, onTableReady])

  // Handle cell value change
  const handleCellValueChange = useCallback(
    (
      rowIndex: number,
      row: Record<string, unknown>,
      columnName: string,
      originalValue: unknown,
      newValue: unknown,
    ) => {
      if (!onCellEdit) return
      const pkValues = getPrimaryKeyValues(row)
      tableLogger.debug('cell value changed', {
        rowIndex,
        columnName,
        oldValue: originalValue,
        newValue,
      })
      onCellEdit(rowIndex, pkValues, columnName, originalValue, newValue, row)
    },
    [onCellEdit, getPrimaryKeyValues],
  )

  // Handle row deletion
  const handleRowDelete = useCallback(
    (rowIndex: number, row: Record<string, unknown>) => {
      if (!onRowDelete) return
      const pkValues = getPrimaryKeyValues(row)
      tableLogger.debug('row marked for deletion', { rowIndex, primaryKeyValues: pkValues })
      onRowDelete(rowIndex, pkValues, row)
    },
    [onRowDelete, getPrimaryKeyValues],
  )

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      <ContextMenu>
        <ContextMenuTrigger className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            <Table className="w-full text-xs border-collapse">
              <TableHeader className="sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-card border-b border-border">
                    {isEditMode && (
                      <TableHead className="w-10 px-2 py-1.5 text-center text-muted-foreground border-r border-border" />
                    )}
                    {headerGroup.headers.map((header) => {
                      const meta = header.column.columnDef.meta as ColumnMeta | undefined
                      return (
                        <TableHead
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className={cn(
                            'text-left font-medium px-3 py-1.5 border-r border-border last:border-r-0 whitespace-nowrap relative',
                            meta?.sticky && 'sticky left-0 bg-card z-20',
                            meta?.isRowNumber ? 'text-muted-foreground w-12' : 'text-foreground',
                          )}
                        >
                          <DataTableHeader header={header} />
                          {header.column.getCanResize() && (
                            <div
                              role="slider"
                              aria-label={`Resize ${header.column.id} column`}
                              aria-valuenow={header.getSize()}
                              aria-valuemin={header.column.columnDef.minSize ?? 50}
                              aria-valuemax={500}
                              tabIndex={0}
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-primary opacity-0 hover:opacity-100 focus:opacity-100"
                            />
                          )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (isEditMode ? 1 : 0)}
                      className="px-3 py-8 text-center text-muted-foreground text-xs"
                    >
                      {DATA_TABLE_VALUES.noRowsReturned}
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row, rowIndex) => {
                    const rowData = row.original
                    const isNewRow = rowData[NEW_ROW_MARKER] === true
                    const changeId = rowData[CHANGE_ID_MARKER] as string | undefined
                    const deleteChangeId = isNewRow ? undefined : getRowDeletionChangeId(rowData)
                    const isDeleted = !!deleteChangeId

                    return (
                      <TableRow
                        key={row.id}
                        onClick={() => handleRowClick(rowData)}
                        className={cn(
                          'border-b border-border/50 hover:bg-primary/10 transition-colors cursor-pointer',
                          rowIndex % 2 === 1 ? 'bg-muted/20' : 'bg-background',
                          isDeleted && 'bg-red-500/10 line-through opacity-60',
                          isNewRow && 'bg-emerald-500/10 border-l-2 border-l-emerald-500',
                        )}
                      >
                        {isEditMode && (
                          <TableCell className="w-10 px-2 py-1 text-center border-r border-border/40">
                            <RowActions
                              isNewRow={isNewRow}
                              isMarkedForDeletion={isDeleted}
                              onDelete={() => handleRowDelete(rowIndex, rowData)}
                              onUndoDelete={() =>
                                deleteChangeId && onUndoRowDelete?.(deleteChangeId)
                              }
                              onRemoveNewRow={() => changeId && onRemoveNewRow?.(changeId)}
                            />
                          </TableCell>
                        )}
                        {row.getVisibleCells().map((cell) => {
                          const meta = cell.column.columnDef.meta as ColumnMeta | undefined
                          const value = cell.getValue()
                          const columnName = cell.column.id
                          const isPrimaryKey = !isNewRow && primaryKeyColumns.includes(columnName)
                          const isModified = isNewRow ? false : isCellModified(rowData, columnName)

                          return (
                            <TableCell
                              key={cell.id}
                              style={{ width: cell.column.getSize() }}
                              onContextMenu={() => {
                                if (!meta?.isRowNumber) {
                                  contextMenuCellRef.current = {
                                    value,
                                    columnName,
                                    dataType: meta?.dataType ?? 'unknown',
                                    row: rowData,
                                  }
                                }
                              }}
                              onDoubleClick={(e) => {
                                if (!meta?.isRowNumber) {
                                  e.stopPropagation()
                                  handleCellDoubleClick(
                                    value,
                                    columnName,
                                    meta?.dataType ?? 'unknown',
                                  )
                                }
                              }}
                              className={cn(
                                'px-3 py-1 font-mono border-r border-border/40 last:border-r-0',
                                meta?.sticky && 'sticky left-0 z-10',
                                meta?.isRowNumber
                                  ? cn(
                                      'text-muted-foreground w-12',
                                      rowIndex % 2 === 1 ? 'bg-muted' : 'bg-background',
                                    )
                                  : 'text-foreground max-w-xs truncate',
                                isModified && 'bg-amber-500/10 border-l-2 border-l-amber-500',
                              )}
                              title={value !== null ? String(value) : 'NULL'}
                            >
                              {meta?.isRowNumber ? (
                                isNewRow ? (
                                  DATA_TABLE_VALUES.newRowLabel
                                ) : (
                                  row.index + 1 - newRowsData.length
                                )
                              ) : isEditMode && !meta?.isRowNumber ? (
                                <EditableCell
                                  cell={cell}
                                  isModified={isModified}
                                  isPrimaryKey={isPrimaryKey}
                                  isNewRow={isNewRow}
                                  onValueChange={(newValue: unknown) => {
                                    if (isNewRow && changeId) {
                                      onUpdateNewRowCell?.(changeId, columnName, newValue)
                                    } else {
                                      handleCellValueChange(
                                        rowIndex,
                                        rowData,
                                        columnName,
                                        value,
                                        newValue,
                                      )
                                    }
                                  }}
                                />
                              ) : (
                                <DataTableCell cell={cell} />
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleCopyCellValue}>
            <IconClipboard className="size-3.5" />
            Copy Cell Value
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyRowAsJson}>
            <IconCode className="size-3.5" />
            Copy Row as JSON
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleViewCellDetails}>
            <IconEye className="size-3.5" />
            View Cell Details
          </ContextMenuItem>
          <ContextMenuItem onClick={handleViewRowDetails}>
            <IconRowInsertBottom className="size-3.5" />
            View Row Details
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  )
})
