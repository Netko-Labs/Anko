import type { McpBridgeConfig } from '@anko/mcp-contract'
import type { QueryHistoryEntry } from './query-history'

export type McpApprovalKind = 'open_connection' | 'execute_query'
export type McpApprovalStatus = 'approved' | 'rejected' | 'timed_out'

export interface McpApprovalRequest {
  id: string
  kind: McpApprovalKind
  clientName: string
  connectionId: string
  connectionName: string
  database?: string
  schema?: string
  sql?: string
  sqlHash?: string
  riskReasons: string[]
  createdAt: string
  expiresAt: string
}

export interface McpSettings {
  enabled: boolean
  bypassPermissions: boolean
  port: number
  endpoint: string
  token: string
  status: 'disabled' | 'running' | 'error'
  error?: string
  pendingApprovals: number
  bridgePath: string
  bridgeInstalled: boolean
  bridgeStatus: 'missing' | 'outdated' | 'installed'
}

export interface McpEvents {
  approvalRequested(request: McpApprovalRequest): void
  statusChanged(settings: McpSettings): void
  connectionChanged(): void
  historyAdded(entry: QueryHistoryEntry): void
  notifyApproval(request: McpApprovalRequest): void
}

export interface StoredMcpConfig extends McpBridgeConfig {
  bypassPermissions: boolean
  bridgeVersion?: string
}
