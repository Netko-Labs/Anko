import { useCallback, useEffect, useState } from 'react'
import { ErrorBoundary } from '@/components/errors/error-boundary'
import { CloseAppDialog, getCloseAppPreference } from '@/components/layout/close-app-dialog'
import { RightSidebar } from '@/components/layout/right-sidebar'
import { TabContainer } from '@/components/layout/tabs'
import { TitleBar } from '@/components/layout/title-bar'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { UpdateModal } from '@/components/update/update-modal'
import { useUpdateChecker } from '@/hooks/useUpdateChecker'
import { useWorkspaceSession } from '@/hooks/useWorkspaceSession'
import { listenForInvalidation } from '@/lib/data-bridge'
import { closeWindow, listConnections, listWorkspaces } from '@/lib/rpc'
import { listenForRemoteToasts } from '@/lib/toast-bridge'
import { useConnectionStore } from '@/stores/connection'
import { useLeftSidebarStore } from '@/stores/left-sidebar'
import { useRightSidebarStore } from '@/stores/right-sidebar'
import { useWorkspaceStore } from '@/stores/workspace'
import type { ActiveConnection } from '@/types'

function App() {
  const setSavedConnections = useConnectionStore((s) => s.setSavedConnections)
  const addQueryTab = useConnectionStore((s) => s.addQueryTab)
  const queryTabs = useConnectionStore((s) => s.queryTabs)
  const activeTabId = useConnectionStore((s) => s.activeTabId)
  const removeQueryTab = useConnectionStore((s) => s.removeQueryTab)

  // Sidebar stores
  const toggleLeftSidebar = useLeftSidebarStore((s) => s.toggle)
  const toggleRightSidebar = useRightSidebarStore((s) => s.toggle)

  // Close app dialog state
  const [showCloseDialog, setShowCloseDialog] = useState(false)

  // Check for updates on startup
  useUpdateChecker()

  // Restore per-workspace session (tabs + snapshot data) and keep it saved.
  useWorkspaceSession()

  // Listen for toast messages from other windows (e.g. DevTools)
  useEffect(() => {
    return listenForRemoteToasts()
  }, [])

  // Listen for data invalidation from other windows (e.g. DevTools)
  useEffect(() => {
    return listenForInvalidation(async (targets) => {
      const shouldRefreshAll = targets.includes('all')
      if (shouldRefreshAll || targets.includes('connections')) {
        try {
          const connections = await listConnections()
          useConnectionStore.getState().setSavedConnections(connections)
        } catch (e) {
          console.error('Failed to refresh connections:', e)
        }
      }
      if (shouldRefreshAll || targets.includes('workspaces')) {
        try {
          const ws = await listWorkspaces()
          useWorkspaceStore.getState().setWorkspaces(ws)
        } catch (e) {
          console.error('Failed to refresh workspaces:', e)
        }
      }
    })
  }, [])

  // Load saved connections on mount
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const connections = await listConnections()
        setSavedConnections(connections)
      } catch (e) {
        console.error('Failed to load connections:', e)
      }
    }
    loadConnections()
  }, [setSavedConnections])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey

      // Cmd/Ctrl+Shift+B — Toggle right sidebar
      if (mod && e.shiftKey && e.key === 'b') {
        e.preventDefault()
        toggleRightSidebar()
        return
      }

      // Cmd/Ctrl+T — New tab (prevent browser default, CommandMenu handles it)
      if (mod && !e.shiftKey && e.key === 't') {
        e.preventDefault()
        return
      }

      // Cmd/Ctrl+W — Close active tab or app
      if (mod && e.key === 'w') {
        e.preventDefault()

        if (queryTabs.length > 0 && activeTabId) {
          removeQueryTab(activeTabId)
          return
        }

        const preference = getCloseAppPreference()

        if (preference === 'always-close') {
          closeWindow()
        } else if (preference === 'never-close') {
          // Do nothing
        } else {
          setShowCloseDialog(true)
        }
      }
    }

    // conventions §5: window-level keydown is the unavoidable browser API for app-global shortcuts
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [queryTabs.length, activeTabId, removeQueryTab, toggleRightSidebar])

  // Disable right-click and browser reload shortcuts in production
  useEffect(() => {
    if (import.meta.env.DEV) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F5, Cmd+R, Ctrl+R (reload)
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key === 'r')) {
        e.preventDefault()
      }
    }

    // conventions §5: window-level listeners are the unavoidable browser API for suppressing native context-menu/reload
    window.addEventListener('contextmenu', handleContextMenu)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // Handle connection selection - create a new query tab
  const handleConnectionSelect = useCallback(
    (connection: ActiveConnection) => {
      const tabId = `${connection.id}-${Date.now()}`
      addQueryTab({
        id: tabId,
        connectionId: connection.id,
        query: '',
        isExecuting: false,
      })
    },
    [addQueryTab],
  )

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="anko-theme">
        {/* Toast notifications - rendered at root level for maximum z-index */}
        <Toaster />

        {/* Title bar fixed at top */}
        <TitleBar
          onToggleLeftSidebar={toggleLeftSidebar}
          onToggleRightSidebar={toggleRightSidebar}
        />

        {/* Main content area below title bar */}
        <div className="h-screen pt-9 flex overflow-hidden">
          <AppSidebar onConnectionSelect={handleConnectionSelect} />

          {/* Main content */}
          <main className="flex-1 overflow-hidden bg-background">
            <TabContainer />
          </main>

          <RightSidebar />
        </div>

        {/* Dialogs */}
        <CloseAppDialog
          open={showCloseDialog}
          onOpenChange={setShowCloseDialog}
          onConfirm={() => {
            setShowCloseDialog(false)
            closeWindow()
          }}
          onCancel={() => setShowCloseDialog(false)}
        />
        <UpdateModal />
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
