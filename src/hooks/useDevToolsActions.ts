import { getVersion } from '@tauri-apps/api/app'
import { useState } from 'react'
import { toast } from 'sonner'
import { TEST_DATABASES } from '@/components/sidebar/dialogs/devtools/test-databases'
import { formatErrorMessage } from '@/lib/error-utils'
import {
  addConnectionToWorkspace as addConnectionToWorkspaceBackend,
  clearAllData,
  deleteWorkspace,
  listConnections,
  listWorkspaces,
  saveConnection,
} from '@/lib/tauri'
import { fetchLatestChangelog } from '@/lib/updater'
import { useConnectionStore } from '@/stores/connection'
import { useUpdateStore } from '@/stores/update'
import { createDefaultWorkspace, DEFAULT_WORKSPACE_ID, useWorkspaceStore } from '@/stores/workspace'

interface ConfirmDialogState {
  open: boolean
  title: string
  description: string
  onConfirm: () => Promise<void>
  variant: 'default' | 'destructive'
}

export function useDevToolsActions(onOpenChange: (open: boolean) => void) {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Store access
  const schemaCache = useConnectionStore((s) => s.schemaCache)
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const savedConnections = useConnectionStore((s) => s.savedConnections)
  const clearAllSchemaCache = useConnectionStore((s) => s.clearAllSchemaCache)
  const setSavedConnections = useConnectionStore((s) => s.setSavedConnections)

  // Workspace store access
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)
  const addConnectionToWorkspace = useWorkspaceStore((s) => s.addConnectionToWorkspace)

  // Debug mode state
  const [enabledNamespaces, setEnabledNamespaces] = useState<Set<string>>(() => {
    const value = localStorage.getItem('anko-debug')
    if (!value || value === 'false') return new Set()
    if (value === '*' || value === 'true') return new Set(['tauri', 'store', 'app'])
    return new Set(
      value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    )
  })

  const debugMode = enabledNamespaces.size > 0

  const toggleNamespace = (namespace: string) => {
    setEnabledNamespaces((prev) => {
      const next = new Set(prev)
      if (next.has(namespace)) {
        next.delete(namespace)
      } else {
        next.add(namespace)
      }
      if (next.size === 0) {
        localStorage.removeItem('anko-debug')
      } else {
        localStorage.setItem('anko-debug', Array.from(next).join(','))
      }
      return next
    })
  }

  const handleClearSchemaCache = async () => {
    clearAllSchemaCache()
    toast.success('Schema cache cleared')
  }

  const handleResetWorkspaces = async () => {
    setIsLoading(true)
    try {
      const allWorkspaces = await listWorkspaces()
      for (const ws of allWorkspaces) {
        if (ws.id !== DEFAULT_WORKSPACE_ID) {
          try {
            await deleteWorkspace(ws.id)
          } catch (e) {
            console.warn(`Failed to delete workspace ${ws.id}:`, e)
          }
        }
      }

      const defaultWorkspace = createDefaultWorkspace()
      setWorkspaces([defaultWorkspace])
      setActiveWorkspace(defaultWorkspace.id)
      toast.success('Workspaces reset', {
        description: 'All workspaces deleted, default workspace recreated',
      })
    } catch (e) {
      toast.error('Failed to reset workspaces', {
        description: formatErrorMessage(e),
      })
    } finally {
      setIsLoading(false)
      setConfirmDialog(null)
    }
  }

  const handleClearAllData = async () => {
    setIsLoading(true)
    try {
      await clearAllData()
      const connections = await listConnections()
      setSavedConnections(connections)
      toast.success('All data cleared', {
        description: 'Connections and workspaces have been deleted',
      })
      setConfirmDialog(null)
    } catch (e) {
      toast.error('Failed to clear data', {
        description: formatErrorMessage(e),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewSchemaCache = () => {
    console.log('[DevTools] Schema Cache:', schemaCache)
    toast.info('Schema cache logged to console', {
      description: `${Object.keys(schemaCache).length} connection(s) cached`,
    })
  }

  const handleViewActiveConnections = () => {
    console.log('[DevTools] Active Connections:', activeConnections)
    toast.info('Active connections logged to console', {
      description: `${activeConnections.length} active connection(s)`,
    })
  }

  const handleViewStoreState = () => {
    const state = useConnectionStore.getState()
    console.log('[DevTools] Full Store State:', state)
    toast.info('Store state logged to console')
  }

  const handleToggleDebug = () => {
    if (debugMode) {
      setEnabledNamespaces(new Set())
      localStorage.removeItem('anko-debug')
      toast.success('Debug mode disabled')
    } else {
      const allNamespaces = new Set(['tauri', 'store', 'app'])
      setEnabledNamespaces(allNamespaces)
      localStorage.setItem('anko-debug', '*')
      toast.success('Debug mode enabled (all namespaces)')
    }
  }

  const handleClearLocalStorage = () => {
    localStorage.clear()
    toast.success('Local storage cleared')
  }

  const handleLoadTestDatabases = async () => {
    setIsLoading(true)
    let savedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (const config of TEST_DATABASES) {
      try {
        const existing = savedConnections.find(
          (c) => c.host === config.host && c.port === config.port && c.name === config.name,
        )

        if (existing) {
          skippedCount++
          continue
        }

        const connectionInfo = await saveConnection(config)
        savedCount++

        await addConnectionToWorkspaceBackend(DEFAULT_WORKSPACE_ID, connectionInfo.id)
        addConnectionToWorkspace(DEFAULT_WORKSPACE_ID, connectionInfo.id)
      } catch (e) {
        errors.push(`${config.name}: ${formatErrorMessage(e)}`)
      }
    }

    const connections = await listConnections()
    setSavedConnections(connections)

    setIsLoading(false)

    if (errors.length > 0) {
      console.error('[DevTools] Test database errors:', errors)
      toast.warning('Test databases partially saved', {
        description: `Saved: ${savedCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`,
      })
    } else {
      toast.success('Test databases saved', {
        description: `Saved: ${savedCount} new, Skipped: ${skippedCount} existing`,
      })
    }
  }

  const handleExportConnections = () => {
    const exportData = savedConnections.map((conn) => ({
      name: conn.name,
      host: conn.host,
      port: conn.port,
      username: conn.username,
      database: conn.database,
      driver: conn.driver,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'anko-connections.json'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Connections exported', {
      description: `${exportData.length} connection(s) exported (passwords excluded)`,
    })
  }

  const handleImportConnections = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const data = JSON.parse(text)
        console.log('[DevTools] Import data:', data)
        toast.info('Import data logged to console', {
          description: 'Manual import via Tauri commands required for security',
        })
      } catch {
        toast.error('Failed to parse import file')
      }
    }
    input.click()
  }

  // Update store actions
  const setUpdateAvailable = useUpdateStore((s) => s.setUpdateAvailable)
  const setModalOpen = useUpdateStore((s) => s.setModalOpen)

  const handleTestUpdateModal = async () => {
    setIsLoading(true)
    try {
      const parsed = await fetchLatestChangelog()
      if (!parsed) throw new Error('Failed to fetch changelog')

      const currentVersion = await getVersion()

      setUpdateAvailable(
        true,
        {
          version: parsed.version,
          currentVersion: currentVersion,
          body: parsed.body,
          date: parsed.date,
        },
        null,
      )
      setModalOpen(true)
      onOpenChange(false)

      toast.success('Update modal opened', {
        description: `Testing with changelog v${parsed.version}`,
      })
    } catch (e) {
      toast.error('Failed to test update modal', {
        description: formatErrorMessage(e),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const stats = {
    activeConnections: activeConnections.length,
    savedConnections: savedConnections.length,
    workspaces: workspaces.length,
    cachedSchemas: Object.keys(schemaCache).length,
  }

  return {
    confirmDialog,
    setConfirmDialog,
    isLoading,
    debugMode,
    enabledNamespaces,
    toggleNamespace,
    stats,
    handleClearSchemaCache,
    handleResetWorkspaces,
    handleClearAllData,
    handleViewSchemaCache,
    handleViewActiveConnections,
    handleViewStoreState,
    handleToggleDebug,
    handleClearLocalStorage,
    handleLoadTestDatabases,
    handleExportConnections,
    handleImportConnections,
    handleTestUpdateModal,
    handleViewSavedConnections: () => {
      console.log('[DevTools] Saved Connections:', savedConnections)
      toast.info(`${savedConnections.length} saved connection(s) logged`)
    },
  }
}
