import { chmodSync, copyFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { resolveSidecar } from 'mirinjs'
import { z } from 'zod'
import type { AppState } from '../state'
import { addQueryHistory, listConnections } from '../storage'
import { McpApprovalManager } from './approval-manager'
import {
  getBridgeStatus,
  isBridgeInstalled,
  loadMcpConfig,
  mcpBridgePath,
  newMcpToken,
  saveMcpConfig,
} from './config'
import { authorizeMcpRequest } from './security'
import { classifySql, wrapReadOnlyQuery } from './sql-safety'
import {
  DEFAULT_MCP_MAX_ROWS,
  MAX_MCP_ROWS,
  MCP_BRIDGE_VERSION,
  MCP_QUERY_TIMEOUT_MS,
  type McpApprovalRequest,
  type McpEvents,
  type McpSettings,
  type StoredMcpConfig,
} from './types'

interface McpSession {
  server: McpServer
  transport: WebStandardStreamableHTTPServerTransport
}

const NOOP_EVENTS: McpEvents = {
  approvalRequested: () => {},
  statusChanged: () => {},
  connectionChanged: () => {},
  historyAdded: () => {},
  notifyApproval: () => {},
}

export class AnkoMcpService {
  private readonly state: AppState
  private readonly appDataDir: string
  private config: StoredMcpConfig
  private httpServer?: ReturnType<typeof Bun.serve>
  private sessions = new Map<string, McpSession>()
  private events: McpEvents = NOOP_EVENTS
  private focused = true
  private status: McpSettings['status'] = 'disabled'
  private error?: string
  private approvalManager: McpApprovalManager

  constructor(state: AppState, appDataDir: string) {
    this.state = state
    this.appDataDir = appDataDir
    this.config = loadMcpConfig(appDataDir)
    this.approvalManager = new McpApprovalManager(
      (request) => this.onApprovalRequest(request),
      () => this.emitStatus(),
    )
  }

  setEvents(events: McpEvents): void {
    this.events = events
  }

  setWindowFocused(focused: boolean): void {
    this.focused = focused
  }

  async initialize(): Promise<void> {
    if (this.config.enabled) await this.start()
  }

  getSettings(): McpSettings {
    return {
      enabled: this.config.enabled,
      port: this.config.port,
      endpoint: `http://127.0.0.1:${this.config.port}/mcp`,
      token: this.config.token,
      status: this.status,
      error: this.error,
      pendingApprovals: this.approvalManager.list().length,
      bridgePath: mcpBridgePath(this.appDataDir),
      bridgeInstalled: isBridgeInstalled(this.appDataDir, this.config),
      bridgeStatus: getBridgeStatus(this.appDataDir, this.config),
    }
  }

  listPendingApprovals(): McpApprovalRequest[] {
    return this.approvalManager.list()
  }

  resolveApproval(id: string, approved: boolean): boolean {
    return this.approvalManager.resolve(id, approved)
  }

  async setEnabled(enabled: boolean): Promise<McpSettings> {
    this.config.enabled = enabled
    saveMcpConfig(this.appDataDir, this.config)
    if (enabled) await this.start()
    else await this.stop()
    return this.getSettings()
  }

  async setPort(port: number): Promise<McpSettings> {
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      throw new Error('MCP port must be between 1024 and 65535')
    }
    const wasEnabled = this.config.enabled
    await this.stop()
    this.config.port = port
    this.config.enabled = wasEnabled
    saveMcpConfig(this.appDataDir, this.config)
    if (wasEnabled) await this.start()
    return this.getSettings()
  }

  async rotateToken(): Promise<McpSettings> {
    const wasEnabled = this.config.enabled
    await this.stop()
    this.config.token = newMcpToken()
    this.config.enabled = wasEnabled
    saveMcpConfig(this.appDataDir, this.config)
    if (wasEnabled) await this.start()
    return this.getSettings()
  }

  installBridge(): McpSettings {
    const destination = mcpBridgePath(this.appDataDir)
    mkdirSync(dirname(destination), { recursive: true })
    copyFileSync(resolveSidecar('anko-mcp'), destination)
    if (process.platform !== 'win32') chmodSync(destination, 0o700)
    this.config.bridgeVersion = MCP_BRIDGE_VERSION
    saveMcpConfig(this.appDataDir, this.config)
    return this.getSettings()
  }

  async stop(): Promise<void> {
    this.approvalManager.rejectAll()
    for (const session of this.sessions.values()) await session.server.close().catch(() => {})
    this.sessions.clear()
    this.httpServer?.stop(true)
    this.httpServer = undefined
    this.status = 'disabled'
    this.error = undefined
    this.emitStatus()
  }

  private async start(): Promise<void> {
    await this.stop()
    this.config.enabled = true
    saveMcpConfig(this.appDataDir, this.config)
    try {
      this.httpServer = Bun.serve({
        hostname: '127.0.0.1',
        port: this.config.port,
        fetch: (request) => this.handleHttpRequest(request),
      })
      this.status = 'running'
      this.error = undefined
    } catch (error) {
      this.status = 'error'
      this.error = error instanceof Error ? error.message : String(error)
    }
    this.emitStatus()
  }

  private async handleHttpRequest(request: Request): Promise<Response> {
    if (new URL(request.url).pathname !== '/mcp') return new Response('Not found', { status: 404 })
    const denied = authorizeMcpRequest(request, this.config.port, this.config.token)
    if (denied) return denied

    const sessionId = request.headers.get('mcp-session-id')
    const existing = sessionId ? this.sessions.get(sessionId) : undefined
    if (existing) return existing.transport.handleRequest(request)
    if (sessionId) return new Response('Unknown MCP session', { status: 404 })

    let session: McpSession
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      enableJsonResponse: true,
      allowedHosts: [`127.0.0.1:${this.config.port}`, `localhost:${this.config.port}`],
      allowedOrigins: [
        `http://127.0.0.1:${this.config.port}`,
        `http://localhost:${this.config.port}`,
      ],
      enableDnsRebindingProtection: true,
      onsessioninitialized: (id) => {
        this.sessions.set(id, session)
      },
      onsessionclosed: (id) => {
        this.sessions.delete(id)
      },
    })
    const server = this.createProtocolServer()
    session = { server, transport }
    await server.connect(transport)
    return transport.handleRequest(request)
  }

  private createProtocolServer(): McpServer {
    const server = new McpServer(
      { name: 'anko', version: '0.8.1' },
      {
        instructions:
          'Use list_connections before schema tools. Open a saved connection before querying it. Read results are capped at 1000 rows.',
      },
    )
    const clientName = () => server.server.getClientVersion()?.name ?? 'MCP client'

    server.registerTool(
      'list_connections',
      {
        title: 'List Anko connections',
        description: 'List saved database connections and whether each is open in Anko.',
        annotations: { readOnlyHint: true },
      },
      async () => this.toolResult(this.listConnectionSummaries()),
    )

    server.registerTool(
      'open_connection',
      {
        title: 'Open an Anko connection',
        description: 'Ask the user in Anko before opening a saved database connection.',
        inputSchema: z.object({ connectionId: z.string().min(1) }),
        annotations: { readOnlyHint: false, destructiveHint: false },
      },
      async ({ connectionId }, extra) => {
        const info = this.savedConnection(connectionId)
        const active = this.state.getActiveConnection(connectionId)
        if (active) return this.toolResult(this.connectionSummary(connectionId))
        const status = await this.approvalManager.request(
          {
            kind: 'open_connection',
            clientName: clientName(),
            connectionId,
            connectionName: info.name,
            database: info.database,
            riskReasons: [
              'This opens a saved database connection using credentials stored in Anko',
            ],
          },
          extra.signal,
        )
        if (status !== 'approved') return this.toolError(`Connection request ${status}`)
        try {
          await this.state.connectSaved(connectionId)
          this.events.connectionChanged()
          return this.toolResult(this.connectionSummary(connectionId))
        } catch {
          return this.toolError('Anko could not open the saved connection')
        }
      },
    )

    const connectionInput = z.object({ connectionId: z.string().min(1) })
    server.registerTool(
      'list_databases',
      {
        description: 'List databases on an open Anko connection.',
        inputSchema: connectionInput,
        annotations: { readOnlyHint: true },
      },
      async ({ connectionId }) =>
        this.toolResult(await this.state.getConnectionBySavedId(connectionId).getDatabases()),
    )
    server.registerTool(
      'list_schemas',
      {
        description: 'List schemas in a database on an open Anko connection.',
        inputSchema: z.object({ connectionId: z.string().min(1), database: z.string().min(1) }),
        annotations: { readOnlyHint: true },
      },
      async ({ connectionId, database }) =>
        this.toolResult(await this.state.getConnectionBySavedId(connectionId).getSchemas(database)),
    )
    server.registerTool(
      'list_tables',
      {
        description: 'List tables and views in a database schema.',
        inputSchema: z.object({
          connectionId: z.string().min(1),
          database: z.string().min(1),
          schema: z.string().default(''),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ connectionId, database, schema }) =>
        this.toolResult(
          await this.state.getConnectionBySavedId(connectionId).getTables(database, schema),
        ),
    )
    server.registerTool(
      'describe_table',
      {
        description: 'Describe columns, keys, defaults, and nullability for a table.',
        inputSchema: z.object({
          connectionId: z.string().min(1),
          database: z.string().min(1),
          schema: z.string().default(''),
          table: z.string().min(1),
        }),
        annotations: { readOnlyHint: true },
      },
      async ({ connectionId, database, schema, table }) =>
        this.toolResult(
          await this.state.getConnectionBySavedId(connectionId).getColumns(database, schema, table),
        ),
    )
    server.registerTool(
      'execute_query',
      {
        title: 'Execute SQL in Anko',
        description:
          'Execute SQL on an open Anko connection. Mutations and unclassifiable SQL require approval in Anko.',
        inputSchema: z.object({
          connectionId: z.string().min(1),
          sql: z.string().min(1),
          database: z.string().optional(),
          schema: z.string().optional(),
          maxRows: z.number().int().min(1).max(MAX_MCP_ROWS).default(DEFAULT_MCP_MAX_ROWS),
        }),
        annotations: { readOnlyHint: false, destructiveHint: true },
      },
      async (input, extra) => this.executeQuery(input, clientName(), extra.signal),
    )
    return server
  }

  private listConnectionSummaries() {
    return listConnections().map((connection) => this.connectionSummary(connection.id))
  }

  private connectionSummary(id: string) {
    const connection = this.savedConnection(id)
    return {
      id: connection.id,
      name: connection.name,
      driver: connection.driver,
      defaultDatabase: connection.database,
      active: this.state.getActiveConnection(connection.id) !== undefined,
    }
  }

  private savedConnection(id: string) {
    const connection = listConnections().find((item) => item.id === id)
    if (!connection) throw new Error(`Saved connection not found: ${id}`)
    return connection
  }

  private async executeQuery(
    input: {
      connectionId: string
      sql: string
      database?: string
      schema?: string
      maxRows: number
    },
    clientName: string,
    signal: AbortSignal,
  ) {
    const active = this.state.getActiveConnection(input.connectionId)
    if (!active) return this.toolError('Connection is not open. Call open_connection first.')
    const safety = classifySql(input.sql, active.info.driver)
    let approvalStatus: 'not_required' | 'approved' | 'rejected' | 'timed_out' = 'not_required'

    if (!safety.safe) {
      const decision = await this.approvalManager.request(
        {
          kind: 'execute_query',
          clientName,
          connectionId: input.connectionId,
          connectionName: active.info.name,
          database: input.database,
          schema: input.schema,
          sql: input.sql,
          riskReasons: safety.reasons,
        },
        signal,
      )
      approvalStatus = decision
      if (decision !== 'approved') {
        this.recordHistory(input, active.info.name, 0, null, false, `Query ${decision}`, decision)
        return this.toolError(`Query ${decision}`)
      }
    }

    const connector = this.state.getConnectionBySavedId(input.connectionId)
    const sql = safety.safe ? wrapReadOnlyQuery(input.sql, input.maxRows) : input.sql
    const startedAt = performance.now()
    const controller = new AbortController()
    const abortFromClient = () => controller.abort(new Error('MCP client cancelled the query'))
    signal.addEventListener('abort', abortFromClient, { once: true })
    const timeout = setTimeout(
      () => controller.abort(new Error('Query timed out after 60 seconds')),
      MCP_QUERY_TIMEOUT_MS,
    )
    try {
      const result = await (safety.safe
        ? connector.executeReadOnlyWithContext(sql, input.database, input.schema, controller.signal)
        : connector.executeWithContext(sql, input.database, input.schema, controller.signal))
      const truncated = result.rows.length > input.maxRows
      const rows = result.rows.slice(0, input.maxRows)
      const duration = Math.round(performance.now() - startedAt)
      this.recordHistory(input, active.info.name, duration, rows.length, true, null, approvalStatus)
      return this.toolResult({ ...result, rows, truncated })
    } catch (error) {
      const duration = Math.round(performance.now() - startedAt)
      const message = error instanceof Error ? error.message : String(error)
      this.recordHistory(input, active.info.name, duration, null, false, message, approvalStatus)
      return this.toolError(
        redactConnectionDetails(message, active.info.host, active.info.username),
      )
    } finally {
      clearTimeout(timeout)
      signal.removeEventListener('abort', abortFromClient)
    }
  }

  private recordHistory(
    input: { connectionId: string; sql: string; database?: string },
    connectionName: string,
    executionTimeMs: number,
    rowCount: number | null,
    success: boolean,
    errorMessage: string | null,
    approvalStatus: 'not_required' | 'approved' | 'rejected' | 'timed_out',
  ): void {
    const entry = addQueryHistory({
      query: input.sql.trim(),
      connectionId: input.connectionId,
      connectionName,
      databaseName: input.database ?? null,
      executionTimeMs,
      rowCount,
      success,
      errorMessage,
      source: 'mcp',
      approvalStatus,
    })
    this.events.historyAdded(entry)
  }

  private toolResult(value: unknown) {
    const structuredContent = asStructuredContent(value)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(value) }],
      ...(structuredContent ? { structuredContent } : {}),
    }
  }

  private toolError(message: string) {
    return { content: [{ type: 'text' as const, text: message }], isError: true }
  }

  private onApprovalRequest(request: McpApprovalRequest): void {
    this.events.approvalRequested(request)
    if (!this.focused) this.events.notifyApproval(request)
  }

  private emitStatus(): void {
    this.events.statusChanged(this.getSettings())
  }
}

function asStructuredContent(value: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(value)) return { items: value }
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined
}

function redactConnectionDetails(message: string, host: string, username: string): string {
  let redacted = message
  for (const secret of [host, username]) {
    if (secret) redacted = redacted.replaceAll(secret, '[redacted]')
  }
  return redacted
}
