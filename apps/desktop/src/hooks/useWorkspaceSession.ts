import { useEffect, useRef } from 'react'
import { bootSession, saveSessionDebounced, saveSessionNow } from '@/lib/session'
import { useConnectionStore } from '@/stores/connection'
import { useWorkspaceStore } from '@/stores/workspace'

/**
 * Drives per-workspace session persistence (see src/lib/session.ts):
 *  - on app open, restores the last-active workspace's tabs + snapshot results
 *  - auto-saves (debounced) whenever the open tabs / connections change
 *  - flushes a final save when the window is closing
 *
 * Mounted once at the app root.
 */
export function useWorkspaceSession() {
  const bootedRef = useRef(false)

  // Boot once. The ref guards against React Strict Mode's double-invoke in dev.
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    void bootSession()
  }, [])

  // Auto-save on any session-relevant store change (tabs, active tab, active
  // connections, pending reconnect). Debounced; suspended during boot/swap.
  useEffect(() => {
    const trigger = () => {
      const workspaceId = useWorkspaceStore.getState().activeWorkspaceId
      saveSessionDebounced(workspaceId)
    }
    return useConnectionStore.subscribe(trigger)
  }, [])

  // conventions §5: beforeunload/pagehide are real browser lifecycle events
  // (allowed window usage) for a best-effort final session flush on close/hide.
  useEffect(() => {
    const flush = () => {
      void saveSessionNow(useWorkspaceStore.getState().activeWorkspaceId)
    }
    window.addEventListener('beforeunload', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      window.removeEventListener('pagehide', flush)
    }
  }, [])
}
