import { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '@/components/theme/theme-provider'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import { useConnectionStore } from '@/stores/connection'
import { useLeftSidebarStore } from '@/stores/left-sidebar'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import { MainPage } from './command-menu-main-page'
import { NewTabPage } from './command-menu-new-tab-page'
import type { CommandMenuProps, Page } from './lib'
import { useCommandActions } from './lib/hooks/useCommandActions'
import { useCommandItems } from './lib/hooks/useCommandItems'
import { priorityFilter } from './lib/utils'

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const { theme, setTheme } = useTheme()
  const [page, setPage] = useState<Page>('main')
  const inputRef = useRef<HTMLInputElement>(null)

  const setActiveTabId = useConnectionStore((s) => s.setActiveTabId)
  const toggleLeftSidebar = useLeftSidebarStore((s) => s.toggle)
  const toggleRightSidebar = useRightSidebarStore((s) => s.toggle)

  const items = useCommandItems(open, page)
  const { handleConnect, handleOpenQuery, handleOpenTable, handleNewTabQuery, handleNewTabTable } =
    useCommandActions(onOpenChange)

  // Reset page when dialog closes
  useEffect(() => {
    if (!open) setPage('main')
  }, [open])

  // Keyboard shortcuts: Cmd+K (main), Cmd+T (new-tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) {
          onOpenChange(false)
        } else {
          setPage('main')
          onOpenChange(true)
        }
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 't') {
        e.preventDefault()
        setPage('new-tab')
        onOpenChange(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  const runAndClose = useCallback(
    (fn: () => void) => {
      fn()
      onOpenChange(false)
    },
    [onOpenChange],
  )

  const navigateToPage = useCallback((target: Page) => {
    setPage(target)
    // Reset input focus when navigating
    setTimeout(() => inputRef.current?.focus(), 0)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-xl">
      <Command filter={priorityFilter}>
        <CommandInput
          ref={inputRef}
          placeholder={
            page === 'new-tab' ? 'Search databases and tables...' : 'Type a command or search...'
          }
        />
        <CommandList className="max-h-96">
          <CommandEmpty>No results found.</CommandEmpty>

          {page === 'main' && (
            <MainPage
              tabItems={items.tabItems}
              activeItems={items.activeItems}
              disconnectedItems={items.disconnectedItems}
              tableItems={items.tableItems}
              savedQueryItems={items.savedQueryItems}
              historyItems={items.historyItems}
              theme={theme}
              setTheme={setTheme}
              setActiveTabId={setActiveTabId}
              toggleLeftSidebar={toggleLeftSidebar}
              toggleRightSidebar={toggleRightSidebar}
              runAndClose={runAndClose}
              onOpenChange={onOpenChange}
              onConnect={handleConnect}
              onOpenQuery={handleOpenQuery}
              onOpenTable={handleOpenTable}
              onNavigateNewTab={() => navigateToPage('new-tab')}
            />
          )}

          {page === 'new-tab' && (
            <NewTabPage
              databaseItems={items.newTabDatabaseItems}
              tableItems={items.newTabTableItems}
              onBack={() => navigateToPage('main')}
              onNewQuery={handleNewTabQuery}
              onOpenTable={handleNewTabTable}
            />
          )}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}
