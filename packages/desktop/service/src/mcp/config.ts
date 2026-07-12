import { randomBytes } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { StoredMcpConfig } from '@anko/desktop-domain'
import { DEFAULT_MCP_PORT, MCP_BRIDGE_VERSION } from './constants'

export function mcpConfigPath(appDataDir: string): string {
  return join(appDataDir, 'mcp.json')
}

export function mcpBridgePath(appDataDir: string): string {
  return join(appDataDir, 'bin', process.platform === 'win32' ? 'anko-mcp.exe' : 'anko-mcp')
}

export function loadMcpConfig(appDataDir: string): StoredMcpConfig {
  const path = mcpConfigPath(appDataDir)
  try {
    const value = JSON.parse(readFileSync(path, 'utf8')) as Partial<StoredMcpConfig>
    return normalizeConfig(value)
  } catch {
    const config = normalizeConfig({})
    saveMcpConfig(appDataDir, config)
    return config
  }
}

export function saveMcpConfig(appDataDir: string, config: StoredMcpConfig): void {
  const path = mcpConfigPath(appDataDir)
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 })
  if (process.platform !== 'win32') chmodSync(path, 0o600)
}

export function isBridgeInstalled(appDataDir: string, config: StoredMcpConfig): boolean {
  return existsSync(mcpBridgePath(appDataDir)) && config.bridgeVersion === MCP_BRIDGE_VERSION
}

export function getBridgeStatus(
  appDataDir: string,
  config: StoredMcpConfig,
): 'missing' | 'outdated' | 'installed' {
  if (!existsSync(mcpBridgePath(appDataDir))) return 'missing'
  return config.bridgeVersion === MCP_BRIDGE_VERSION ? 'installed' : 'outdated'
}

export function newMcpToken(): string {
  return randomBytes(32).toString('base64url')
}

function normalizeConfig(value: Partial<StoredMcpConfig>): StoredMcpConfig {
  return {
    enabled: value.enabled === true,
    bypassPermissions: value.bypassPermissions === true,
    port:
      Number.isInteger(value.port) && Number(value.port) >= 1024 && Number(value.port) <= 65535
        ? Number(value.port)
        : DEFAULT_MCP_PORT,
    token:
      typeof value.token === 'string' && value.token.length >= 32 ? value.token : newMcpToken(),
    bridgeVersion: value.bridgeVersion,
  }
}
