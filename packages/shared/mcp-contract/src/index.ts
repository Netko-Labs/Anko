export interface McpBridgeConfig {
  enabled: boolean
  port: number
  token: string
}

export function mcpEndpoint(config: Pick<McpBridgeConfig, 'port'>): string {
  return `http://127.0.0.1:${config.port}/mcp`
}
