import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import { RIGHT_SIDEBAR_MAX_WIDTH, RIGHT_SIDEBAR_MIN_WIDTH } from '../definitions'
import {
  type RightSidebarProps,
} from '../definitions/types'

export function RightSidebar({ children, className }: RightSidebarProps) {
  const open = useRightSidebarStore((s) => s.open)
  const width = useRightSidebarStore((s) => s.width)
  const setWidth = useRightSidebarStore((s) => s.setWidth)

  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return
      const newWidth = window.innerWidth - e.clientX
      setWidth(Math.max(RIGHT_SIDEBAR_MIN_WIDTH, Math.min(RIGHT_SIDEBAR_MAX_WIDTH, newWidth)))
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, setWidth])

  return (
    <div
      data-state={open ? 'expanded' : 'collapsed'}
      data-side="right"
      className="group peer text-sidebar-foreground hidden md:block"
    >
      <div
        className={cn(
          'relative bg-transparent transition-[width] duration-200 ease-linear',
          !open && 'w-0',
        )}
        style={{ width: open ? width : 0 }}
      />
      <div
        ref={sidebarRef}
        className={cn(
          'fixed top-9 bottom-0 right-0 z-10 hidden border-l bg-sidebar transition-[right] duration-200 ease-linear md:flex flex-col',
          !open && 'right-[-500px]',
          isResizing && 'select-none',
          className,
        )}
        style={{ width: open ? width : 0 }}
      >
        <div
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-valuenow={width}
          onMouseDown={handleMouseDown}
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 hover:bg-primary/50 transition-colors',
            isResizing && 'bg-primary/50',
          )}
        />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
