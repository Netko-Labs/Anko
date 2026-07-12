import { createHash } from 'node:crypto'
import { MCP_APPROVAL_TIMEOUT_MS, type McpApprovalRequest, type McpApprovalStatus } from './types'

interface ApprovalInput {
  kind: McpApprovalRequest['kind']
  clientName: string
  connectionId: string
  connectionName: string
  database?: string
  schema?: string
  sql?: string
  riskReasons: string[]
}

interface PendingApproval {
  request: McpApprovalRequest
  resolve(status: McpApprovalStatus): void
  timer: ReturnType<typeof setTimeout>
  signal?: AbortSignal
  abortHandler?: () => void
}

export class McpApprovalManager {
  private pending = new Map<string, PendingApproval>()
  private readonly onRequest: (request: McpApprovalRequest) => void
  private readonly onChange: () => void
  private readonly timeoutMs: number

  constructor(
    onRequest: (request: McpApprovalRequest) => void,
    onChange: () => void,
    timeoutMs = MCP_APPROVAL_TIMEOUT_MS,
  ) {
    this.onRequest = onRequest
    this.onChange = onChange
    this.timeoutMs = timeoutMs
  }

  request(input: ApprovalInput, signal?: AbortSignal): Promise<McpApprovalStatus> {
    if (signal?.aborted) return Promise.resolve('rejected')

    const now = Date.now()
    const request: McpApprovalRequest = {
      ...input,
      id: crypto.randomUUID(),
      sqlHash: input.sql ? createHash('sha256').update(input.sql).digest('hex') : undefined,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.timeoutMs).toISOString(),
    }

    return new Promise<McpApprovalStatus>((resolve) => {
      const timer = setTimeout(() => this.finish(request.id, 'timed_out'), this.timeoutMs)
      const abortHandler = signal ? () => this.finish(request.id, 'rejected') : undefined
      if (signal && abortHandler) signal.addEventListener('abort', abortHandler, { once: true })

      this.pending.set(request.id, { request, resolve, timer, signal, abortHandler })
      this.onRequest(request)
      this.onChange()
    })
  }

  list(): McpApprovalRequest[] {
    return [...this.pending.values()]
      .map((item) => item.request)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  resolve(id: string, approved: boolean): boolean {
    if (!this.pending.has(id)) return false
    this.finish(id, approved ? 'approved' : 'rejected')
    return true
  }

  rejectAll(): void {
    for (const id of [...this.pending.keys()]) this.finish(id, 'rejected')
  }

  private finish(id: string, status: McpApprovalStatus): void {
    const pending = this.pending.get(id)
    if (!pending) return
    this.pending.delete(id)
    clearTimeout(pending.timer)
    if (pending.signal && pending.abortHandler) {
      pending.signal.removeEventListener('abort', pending.abortHandler)
    }
    pending.resolve(status)
    this.onChange()
  }
}
