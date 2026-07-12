import type { QueryHistoryEntry } from '../../shared/rpc-types'

export const DEFAULT_MCP_PORT = 43821
export const MCP_APPROVAL_TIMEOUT_MS = 120_000
export const MCP_QUERY_TIMEOUT_MS = 60_000
export const DEFAULT_MCP_MAX_ROWS = 200
export const MAX_MCP_ROWS = 1_000
export const MCP_BRIDGE_VERSION = '0.8.4'

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

export interface StoredMcpConfig {
  enabled: boolean
  bypassPermissions: boolean
  port: number
  token: string
  bridgeVersion?: string
}
