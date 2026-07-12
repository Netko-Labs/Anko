import pkg from '../../../package.json'

export type {
  McpApprovalKind,
  McpApprovalStatus,
  McpApprovalRequest,
  McpSettings,
  McpEvents,
  StoredMcpConfig,
} from '@anko/desktop-domain'

export const DEFAULT_MCP_PORT = 43821
export const MCP_APPROVAL_TIMEOUT_MS = 120_000
export const MCP_QUERY_TIMEOUT_MS = 60_000
export const DEFAULT_MCP_MAX_ROWS = 200
export const MAX_MCP_ROWS = 1_000
export const MCP_BRIDGE_VERSION = (pkg as { version?: string }).version ?? '0.0.0'
