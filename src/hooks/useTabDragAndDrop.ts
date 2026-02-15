import React, { useCallback, useRef, useState } from 'react'
import { useConnectionStore } from '@/stores/connection'
import type { QueryTab } from '@/types'

interface DragState {
  isDragging: boolean
  draggedIndex: number | null
  overIndex: number | null
  startX: number
}

export function useTabDragAndDrop(queryTabs: QueryTab[], editingTabId: string | null) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedIndex: null,
    overIndex: null,
    startX: 0,
  })
  const tabRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const reorderQueryTabsRef = useRef(useConnectionStore.getState().reorderQueryTabs)

  const handleMouseDown = (e: React.MouseEvent, index: number) => {
    if (e.button !== 0) return
    if (editingTabId === queryTabs[index]?.id) return

    setDragState({
      isDragging: false,
      draggedIndex: index,
      overIndex: null,
      startX: e.clientX,
    })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.draggedIndex === null) return

      if (!dragState.isDragging && Math.abs(e.clientX - dragState.startX) > 5) {
        setDragState((prev) => ({ ...prev, isDragging: true }))
      }

      if (!dragState.isDragging) return

      let overIndex: number | null = null
      tabRefs.current.forEach((element, idx) => {
        if (element && idx !== dragState.draggedIndex) {
          const rect = element.getBoundingClientRect()
          if (e.clientX >= rect.left && e.clientX <= rect.right) {
            overIndex = idx
          }
        }
      })

      if (overIndex !== dragState.overIndex) {
        setDragState((prev) => ({ ...prev, overIndex }))
      }
    },
    [dragState.draggedIndex, dragState.isDragging, dragState.startX, dragState.overIndex],
  )

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.draggedIndex !== null && dragState.overIndex !== null) {
      console.log('[Reorder]', { from: dragState.draggedIndex, to: dragState.overIndex })
      reorderQueryTabsRef.current(dragState.draggedIndex, dragState.overIndex)
    }
    setDragState({ isDragging: false, draggedIndex: null, overIndex: null, startX: 0 })
  }, [dragState.isDragging, dragState.draggedIndex, dragState.overIndex])

  // Global mouse event listeners for drag
  React.useEffect(() => {
    if (dragState.draggedIndex !== null) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.draggedIndex, handleMouseMove, handleMouseUp])

  return {
    dragState,
    tabRefs,
    handleMouseDown,
  }
}
