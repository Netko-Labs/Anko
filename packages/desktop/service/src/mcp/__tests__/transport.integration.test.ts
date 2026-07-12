import { Database } from 'bun:sqlite'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { QueryResult } from '@anko/desktop-domain'
import type { DatabaseConnector } from '@anko/desktop-repository'
import type { AppState } from '../../state'
import {
  getConnectionConfig,
  initializeDb,
  listQueryHistory,
  saveConnection,
  updateConnection,
} from '@anko/desktop-repository'
import { mcpConfigPath } from '../config'
import { AnkoMcpService } from '../service'
import type { McpApprovalRequest } from '@anko/desktop-domain'

const appDataDir = mkdtempSync(join(tmpdir(), 'anko-mcp-test-'))
const port = 46_000 + Math.floor(Math.random() * 1_000)
const approvals: McpApprovalRequest[] = []
const executed: string[] = []
let connectionChanges = 0
let savedConnectionId = ''

const result: QueryResult = {
  columns: [{ name: 'id', data_type: 'number', nullable: false }],
  rows: [[1], [2], [3]],
  affected_rows: 0,
  execution_time_ms: 1,
}

const connector: DatabaseConnector = {
  execute: async (sql) => {
    executed.push(sql)
    return result
  },
  executeWithContext: async (sql) => {
    executed.push(sql)
    return result
  },
  executeReadOnlyWithContext: async (sql) => {
    executed.push(sql)
    return result
  },
  getDatabases: async () => [{ name: 'test' }],
  getSchemas: async () => [{ name: 'public' }],
  getTables: async () => [],
  getColumns: async () => [],
  getErdSchema: async () => ({ tables: [], relations: [] }),
  close: async () => {},
}

const active = {
  id: 'saved-1',
  connectionId: 'runtime-1',
  info: {
    id: 'saved-1',
    name: 'Integration database',
    host: 'secret.example',
    port: 5432,
    username: 'secret-user',
    driver: 'postgresql' as const,
  },
}

const state = {
  getActiveConnection: (id: string) => (id === active.id ? active : undefined),
  getActiveConnections: () => [active],
  getConnectionBySavedId: () => connector,
  connectSaved: async (id: string) => ({
    ...active,
    id,
    info: { ...active.info, id, name: 'Saved secret connection' },
  }),
} as unknown as AppState

let service: AnkoMcpService
let httpClient: Client
let stdioClient: Client

beforeAll(async () => {
  const legacy = new Database(join(appDataDir, 'connections.db'), { create: true })
  legacy.exec(`
    CREATE TABLE query_history (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      connection_name TEXT NOT NULL,
      database_name TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER,
      row_count INTEGER,
      success INTEGER NOT NULL DEFAULT 1,
      error_message TEXT
    );
    INSERT INTO query_history (id, query, connection_id, connection_name)
    VALUES ('legacy', 'SELECT 1', 'old', 'Old connection');
  `)
  legacy.close()
  initializeDb(appDataDir)
  savedConnectionId = saveConnection({
    name: 'Saved secret connection',
    host: 'private.internal',
    port: 5432,
    username: 'database-owner',
    password: 'do-not-expose',
    database: 'app',
    driver: 'postgresql',
  }).id
  service = new AnkoMcpService(state, appDataDir)
  service.setEvents({
    approvalRequested: (request) => approvals.push(request),
    statusChanged: () => {},
    connectionChanged: () => {
      connectionChanges++
    },
    historyAdded: () => {},
    notifyApproval: () => {},
  })
  await service.setPort(port)
  const settings = await service.setEnabled(true)
  expect(settings.status).toBe('running')

  httpClient = new Client({ name: 'http-integration', version: '1.0.0' })
  await httpClient.connect(
    new StreamableHTTPClientTransport(new URL(settings.endpoint), {
      requestInit: { headers: { Authorization: `Bearer ${settings.token}` } },
    }),
  )

  stdioClient = new Client({ name: 'stdio-integration', version: '1.0.0' })
  await stdioClient.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: ['run', resolve(import.meta.dir, '../../../../../../apps/mcp-bridge/src/index.ts')],
      cwd: process.cwd(),
      env: { ...process.env, ANKO_MCP_CONFIG: mcpConfigPath(appDataDir) },
      stderr: 'pipe',
    }),
  )
})

afterAll(async () => {
  await httpClient?.close()
  await stdioClient?.close()
  await service?.stop()
})

describe('MCP transports', () => {
  test('migrates existing history entries to the UI source', () => {
    expect(listQueryHistory().find((entry) => entry.id === 'legacy')).toMatchObject({
      source: 'ui',
      approvalStatus: null,
    })
  })

  test('preserves saved credentials when an edit leaves the password blank', () => {
    updateConnection(savedConnectionId, {
      name: 'Saved secret connection',
      host: 'private.internal',
      port: 5432,
      username: 'database-owner',
      password: '',
      database: 'app',
      driver: 'postgresql',
    })
    expect(getConnectionConfig(savedConnectionId).password).toBe('do-not-expose')
  })

  test('lists the same tools over HTTP and stdio', async () => {
    const [http, stdio] = await Promise.all([httpClient.listTools(), stdioClient.listTools()])
    expect(http.tools.map((tool) => tool.name)).toEqual(stdio.tools.map((tool) => tool.name))
    expect(http.tools.map((tool) => tool.name)).toContain('execute_query')
  })

  test('lists only public connection metadata', async () => {
    const response = await httpClient.callTool({ name: 'list_connections' })
    const text = JSON.stringify(response)
    expect(text).toContain('Saved secret connection')
    expect(text).not.toContain('private.internal')
    expect(text).not.toContain('database-owner')
    expect(text).not.toContain('do-not-expose')
  })

  test('does not open inactive connections implicitly for queries', async () => {
    const beforeApprovals = approvals.length
    const response = await httpClient.callTool({
      name: 'execute_query',
      arguments: { connectionId: savedConnectionId, sql: 'SELECT 1' },
    })
    expect(response.isError).toBe(true)
    expect(approvals).toHaveLength(beforeApprovals)
  })

  test('opens an inactive saved connection only after approval', async () => {
    const pending = httpClient.callTool({
      name: 'open_connection',
      arguments: { connectionId: savedConnectionId },
    })
    await waitForApproval()
    expect(connectionChanges).toBe(0)
    service.resolveApproval(approvals.at(-1)!.id, true)
    const response = await pending
    expect(connectionChanges).toBe(1)
    expect(JSON.stringify(response)).not.toContain('secret.example')
    expect(JSON.stringify(response)).not.toContain('secret-user')
  })

  test('executes a capped safe read immediately', async () => {
    const before = executed.length
    const response = await httpClient.callTool({
      name: 'execute_query',
      arguments: { connectionId: active.id, sql: 'SELECT id FROM users', maxRows: 2 },
    })
    expect(executed.length).toBe(before + 1)
    expect(executed.at(-1)).toContain('LIMIT 3')
    expect(response.structuredContent).toMatchObject({ truncated: true, rows: [[1], [2]] })
  })

  test('rejects row limits above the hard maximum', async () => {
    const before = executed.length
    const response = await httpClient.callTool({
      name: 'execute_query',
      arguments: { connectionId: active.id, sql: 'SELECT 1', maxRows: 1_001 },
    })
    expect(response.isError).toBe(true)
    expect(executed).toHaveLength(before)
  })

  test('never executes a rejected write', async () => {
    const before = executed.length
    const pending = stdioClient.callTool({
      name: 'execute_query',
      arguments: { connectionId: active.id, sql: 'DELETE FROM users' },
    })
    await waitForApproval()
    expect(executed.length).toBe(before)
    service.resolveApproval(approvals.at(-1)!.id, false)
    const response = await pending
    expect(executed.length).toBe(before)
    expect(response.isError).toBe(true)
    expect(listQueryHistory().find((entry) => entry.query === 'DELETE FROM users')).toMatchObject({
      source: 'mcp',
      approvalStatus: 'rejected',
      success: false,
    })
  })

  test('executes the stored write only after approval', async () => {
    const before = executed.length
    const pending = httpClient.callTool({
      name: 'execute_query',
      arguments: { connectionId: active.id, sql: 'UPDATE users SET active = false' },
    })
    await waitForApproval()
    expect(executed.length).toBe(before)
    service.resolveApproval(approvals.at(-1)!.id, true)
    await pending
    expect(executed.length).toBe(before + 1)
    expect(executed.at(-1)).toBe('UPDATE users SET active = false')
  })

  test('rejects pending requests when the bypass policy changes', async () => {
    const before = executed.length
    const pending = httpClient.callTool({
      name: 'execute_query',
      arguments: { connectionId: active.id, sql: 'DELETE FROM pending_users' },
    })
    await waitForApproval()

    service.setBypassPermissions(true)
    const response = await pending

    expect(response.isError).toBe(true)
    expect(executed).toHaveLength(before)
    service.setBypassPermissions(false)
  })

  test('bypasses connection and dangerous-query approvals when explicitly enabled', async () => {
    const beforeApprovals = approvals.length
    const beforeExecutions = executed.length
    const settings = service.setBypassPermissions(true)
    expect(settings.bypassPermissions).toBe(true)

    const opened = await httpClient.callTool({
      name: 'open_connection',
      arguments: { connectionId: savedConnectionId },
    })
    const queried = await stdioClient.callTool({
      name: 'execute_query',
      arguments: { connectionId: active.id, sql: 'DELETE FROM bypassed_users' },
    })

    expect(opened.isError).not.toBe(true)
    expect(queried.isError).not.toBe(true)
    expect(approvals).toHaveLength(beforeApprovals)
    expect(executed).toHaveLength(beforeExecutions + 1)
    expect(executed.at(-1)).toBe('DELETE FROM bypassed_users')
    expect(
      listQueryHistory().find((entry) => entry.query === 'DELETE FROM bypassed_users'),
    ).toMatchObject({
      source: 'mcp',
      approvalStatus: 'bypassed',
      success: true,
    })

    expect(service.setBypassPermissions(false).bypassPermissions).toBe(false)
  })
})

async function waitForApproval(): Promise<void> {
  const count = approvals.length
  for (let attempt = 0; attempt < 100 && approvals.length === count; attempt++) {
    await Bun.sleep(5)
  }
  expect(approvals.length).toBe(count + 1)
}
