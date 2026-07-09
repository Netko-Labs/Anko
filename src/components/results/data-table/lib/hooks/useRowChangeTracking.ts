import { useCallback, useMemo } from 'react'
import { createPrimaryKeyHash } from '@/lib/table-utils'
import type { PendingRowChange } from '@/types'

export function useRowChangeTracking(
  pendingChanges: PendingRowChange[],
  primaryKeyColumns: string[],
) {
  const getPrimaryKeyValues = useCallback(
    (row: Record<string, unknown>): Record<string, unknown> => {
      const pkValues: Record<string, unknown> = {}
      for (const pkCol of primaryKeyColumns) {
        pkValues[pkCol] = row[pkCol]
      }
      return pkValues
    },
    [primaryKeyColumns],
  )

  // Pre-compute deletion map: pkHash -> changeId
  const deletionMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const change of pendingChanges) {
      if (change.type === 'delete') {
        const pkHash = createPrimaryKeyHash(change.primaryKeyValues)
        map.set(pkHash, change.id)
      }
    }
    return map
  }, [pendingChanges])

  // Pre-compute modification map: pkHash -> Set of modified column names
  const modificationMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const change of pendingChanges) {
      if (change.type === 'update') {
        const pkHash = createPrimaryKeyHash(change.primaryKeyValues)
        const columns = new Set(change.edits.map((e) => e.columnName))
        map.set(pkHash, columns)
      }
    }
    return map
  }, [pendingChanges])

  // O(1) lookup instead of O(N) iteration per row
  const getRowDeletionChangeId = useCallback(
    (row: Record<string, unknown>): string | undefined => {
      const pkValues = getPrimaryKeyValues(row)
      const pkHash = createPrimaryKeyHash(pkValues)
      return deletionMap.get(pkHash)
    },
    [deletionMap, getPrimaryKeyValues],
  )

  // O(1) lookup instead of O(N) iteration per cell
  const isCellModified = useCallback(
    (row: Record<string, unknown>, columnName: string): boolean => {
      const pkValues = getPrimaryKeyValues(row)
      const pkHash = createPrimaryKeyHash(pkValues)
      return modificationMap.get(pkHash)?.has(columnName) ?? false
    },
    [modificationMap, getPrimaryKeyValues],
  )

  return {
    getPrimaryKeyValues,
    getRowDeletionChangeId,
    isCellModified,
  }
}
