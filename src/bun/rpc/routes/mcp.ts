import { rpc } from 'mirinjs/rpc'
import type { QueryHistoryEntry } from '../../../shared/rpc-types'
import type { AnkoMcpService } from '../../mcp/service'
import type { McpApprovalRequest, McpSettings } from '../../mcp/types'

/** Local MCP lifecycle, approval decisions, and renderer push events. */
export function mcpRoutes(service: AnkoMcpService) {
  return {
    getMcpSettings: rpc.query(() => service.getSettings()),
    setMcpEnabled: rpc.mutation(({ enabled }: { enabled: boolean }) => service.setEnabled(enabled)),
    setMcpBypassPermissions: rpc.mutation(({ bypassPermissions }: { bypassPermissions: boolean }) =>
      service.setBypassPermissions(bypassPermissions),
    ),
    setMcpPort: rpc.mutation(({ port }: { port: number }) => service.setPort(port)),
    rotateMcpToken: rpc.mutation(() => service.rotateToken()),
    listPendingMcpApprovals: rpc.query(() => service.listPendingApprovals()),
    resolveMcpApproval: rpc.mutation(({ id, approved }: { id: string; approved: boolean }) =>
      service.resolveApproval(id, approved),
    ),
    installMcpBridge: rpc.mutation(() => service.installBridge()),

    mcpApprovalRequested: rpc.event<McpApprovalRequest>(),
    mcpStatusChanged: rpc.event<McpSettings>(),
    mcpConnectionChanged: rpc.event<void>(),
    mcpHistoryAdded: rpc.event<QueryHistoryEntry>(),
  }
}
