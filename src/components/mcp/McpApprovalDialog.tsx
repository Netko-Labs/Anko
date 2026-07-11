import { IconAlertTriangle, IconDatabase } from '@tabler/icons-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block/CodeBlock'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { resolveMcpApproval } from '@/lib/rpc'
import { useMcpStore } from '@/stores/mcp'

export function McpApprovalDialog() {
  const request = useMcpStore((state) => state.pending[0])
  const removePending = useMcpStore((state) => state.removePending)
  const [deciding, setDeciding] = useState(false)

  const decide = async (approved: boolean) => {
    if (!request) return
    setDeciding(true)
    try {
      await resolveMcpApproval(request.id, approved)
      removePending(request.id)
    } finally {
      setDeciding(false)
    }
  }

  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && void decide(false)}>
      <DialogContent className="sm:max-w-xl" showCloseButton={!deciding}>
        {request && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <IconAlertTriangle className="size-4 text-amber-500" />
                MCP approval required
              </DialogTitle>
              <DialogDescription>
                {request.clientName} requested an action that requires your approval.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-2">
              <span className="text-muted-foreground">Connection</span>
              <span className="flex min-w-0 items-center gap-1.5 font-medium">
                <IconDatabase className="size-3.5 shrink-0" />
                <span className="truncate">{request.connectionName}</span>
              </span>
              {request.database && (
                <>
                  <span className="text-muted-foreground">Database</span>
                  <span className="truncate font-mono">{request.database}</span>
                </>
              )}
              <span className="text-muted-foreground">Risk</span>
              <ul className="space-y-1">
                {request.riskReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </div>

            {request.sql && (
              <div className="max-h-64 overflow-auto rounded-md border border-border bg-muted/50 p-3">
                <CodeBlock code={request.sql} language="sql" className="text-[11px]" />
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" disabled={deciding} onClick={() => void decide(false)}>
                Reject
              </Button>
              <Button disabled={deciding} onClick={() => void decide(true)}>
                {request.kind === 'open_connection' ? 'Open connection' : 'Run query'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
