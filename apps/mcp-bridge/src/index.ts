import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { type McpBridgeConfig, mcpEndpoint } from '@anko/mcp-contract'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import pkg from '../package.json'

const VERSION = (pkg as { version?: string }).version ?? '0.0.0'

function loadConfig(): McpBridgeConfig {
  const appDataDir = dirname(dirname(process.execPath))
  try {
    const path = process.env.ANKO_MCP_CONFIG ?? join(appDataDir, 'mcp.json')
    return JSON.parse(readFileSync(path, 'utf8')) as McpBridgeConfig
  } catch {
    throw new Error(
      'Anko MCP configuration is unavailable. Open Anko and install the bridge again.',
    )
  }
}

let upstream: Client | undefined

async function getUpstream(clientName: string): Promise<Client> {
  if (upstream) return upstream
  const config = loadConfig()
  if (!config.enabled) throw new Error('Anko MCP is disabled. Enable it in Anko Settings.')

  const client = new Client({ name: clientName, version: VERSION })
  const transport = new StreamableHTTPClientTransport(new URL(mcpEndpoint(config)), {
    requestInit: { headers: { Authorization: `Bearer ${config.token}` } },
  })
  try {
    await client.connect(transport)
  } catch (error) {
    await client.close().catch(() => {})
    throw new Error(
      `Anko MCP is unavailable. Make sure Anko is open and MCP is running. ${error instanceof Error ? error.message : String(error)}`,
    )
  }
  transport.onclose = () => {
    upstream = undefined
  }
  upstream = client
  return client
}

const server = new Server(
  { name: 'anko-mcp-bridge', version: VERSION },
  { capabilities: { tools: {} } },
)

server.setRequestHandler(ListToolsRequestSchema, async (request) => {
  const client = await getUpstream(server.getClientVersion()?.name ?? 'anko-stdio-bridge')
  return client.listTools(request.params)
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const client = await getUpstream(server.getClientVersion()?.name ?? 'anko-stdio-bridge')
  return client.callTool(request.params)
})

await server.connect(new StdioServerTransport())
