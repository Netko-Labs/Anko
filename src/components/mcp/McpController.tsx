import { useEffect } from 'react'
import { listActiveConnections, listPendingMcpApprovals, mcpEvents } from '@/lib/rpc'
import { useConnectionStore } from '@/stores/connection'
import { useMcpStore } from '@/stores/mcp'
import { useQueryHistoryStore } from '@/stores/query-history'
import { McpApprovalDialog } from './McpApprovalDialog'
import { McpSettingsDialog } from './McpSettingsDialog'

export function McpController() {
  useEffect(() => {
    const reconcileConnections = async () => {
      const active = await listActiveConnections()
      useConnectionStore.getState().setActiveConnections(active)
    }

    void Promise.all([listPendingMcpApprovals(), listActiveConnections()]).then(
      ([pending, active]) => {
        useMcpStore.getState().setPending(pending)
        useConnectionStore.getState().setActiveConnections(active)
      },
    )

    const unsubscribe = [
      mcpEvents.onApprovalRequested((request) => useMcpStore.getState().addPending(request)),
      mcpEvents.onStatusChanged((settings) => {
        useMcpStore.getState().setSettings(settings)
        void listPendingMcpApprovals().then(useMcpStore.getState().setPending)
      }),
      mcpEvents.onConnectionChanged(() => void reconcileConnections()),
      mcpEvents.onHistoryAdded((entry) => useQueryHistoryStore.getState().addEntry(entry)),
    ]
    return () => {
      for (const off of unsubscribe) off()
    }
  }, [])

  return (
    <>
      <McpSettingsDialog />
      <McpApprovalDialog />
    </>
  )
}
