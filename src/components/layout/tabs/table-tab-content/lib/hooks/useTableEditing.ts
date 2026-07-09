import { useCallback, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { tableLogger } from '@/lib/debug'
import { useConnectionStore } from '@/stores/connection'
import type { QueryResult } from '@/types'

export function useTableEditing(tabId: string, tabResult: QueryResult | undefined) {
  // Store actions - use refs to stabilize dependencies
  const setEditModeRef = useRef(useConnectionStore.getState().setEditMode)
  const addCellEditRef = useRef(useConnectionStore.getState().addCellEdit)
  const addNewRowRef = useRef(useConnectionStore.getState().addNewRow)
  const markRowForDeletionRef = useRef(useConnectionStore.getState().markRowForDeletion)
  const removeChangeRef = useRef(useConnectionStore.getState().removeChange)
  const updateNewRowCellRef = useRef(useConnectionStore.getState().updateNewRowCell)

  const tabColumns = useMemo(() => tabResult?.columns ?? [], [tabResult?.columns])

  const handleToggleEditMode = useCallback(
    (isEditMode: boolean) => {
      tableLogger.debug('edit mode toggled', { tabId, newMode: !isEditMode })
      setEditModeRef.current(tabId, !isEditMode)
    },
    [tabId],
  )

  const handleAddRow = useCallback(() => {
    if (tabColumns.length === 0) {
      toast.error('Cannot add row: no column information available')
      return
    }
    const newRow: Record<string, unknown> = {}
    for (const col of tabColumns) {
      newRow[col.name] = null
    }
    tableLogger.debug('new row added', { tabId, columnCount: tabColumns.length })
    addNewRowRef.current(tabId, newRow)
    toast.success('Row added')
  }, [tabColumns, tabId])

  const handleCellEdit = useCallback(
    (
      rowIndex: number,
      primaryKeyValues: Record<string, unknown>,
      columnName: string,
      originalValue: unknown,
      newValue: unknown,
      originalRow: Record<string, unknown>,
    ) => {
      addCellEditRef.current(
        tabId,
        rowIndex,
        primaryKeyValues,
        columnName,
        originalValue,
        newValue,
        originalRow,
      )
    },
    [tabId],
  )

  const handleRowDelete = useCallback(
    (
      rowIndex: number,
      primaryKeyValues: Record<string, unknown>,
      originalRow: Record<string, unknown>,
    ) => {
      markRowForDeletionRef.current(tabId, rowIndex, primaryKeyValues, originalRow)
    },
    [tabId],
  )

  const handleUndoRowDelete = useCallback(
    (changeId: string) => {
      removeChangeRef.current(tabId, changeId)
    },
    [tabId],
  )

  const handleRemoveNewRow = useCallback(
    (changeId: string) => {
      removeChangeRef.current(tabId, changeId)
    },
    [tabId],
  )

  const handleUpdateNewRowCell = useCallback(
    (changeId: string, columnName: string, newValue: unknown) => {
      updateNewRowCellRef.current(tabId, changeId, columnName, newValue)
    },
    [tabId],
  )

  return {
    tabColumns,
    handleToggleEditMode,
    handleAddRow,
    handleCellEdit,
    handleRowDelete,
    handleUndoRowDelete,
    handleRemoveNewRow,
    handleUpdateNewRowCell,
  }
}
