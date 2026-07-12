import { describe, expect, test } from 'bun:test'
import { mkdtempSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { loadMcpConfig, mcpConfigPath, saveMcpConfig } from '../config'

describe('MCP config', () => {
  test('defaults to disabled with a 256-bit token and private permissions', () => {
    const directory = mkdtempSync(join(tmpdir(), 'anko-mcp-config-'))
    const config = loadMcpConfig(directory)
    expect(config.enabled).toBe(false)
    expect(config.bypassPermissions).toBe(false)
    expect(Buffer.from(config.token, 'base64url')).toHaveLength(32)
    if (process.platform !== 'win32') {
      expect(statSync(mcpConfigPath(directory)).mode & 0o777).toBe(0o600)
    }
  })

  test('persists bypass permissions only when explicitly enabled', () => {
    const directory = mkdtempSync(join(tmpdir(), 'anko-mcp-config-'))
    const config = loadMcpConfig(directory)
    saveMcpConfig(directory, { ...config, bypassPermissions: true })
    expect(loadMcpConfig(directory).bypassPermissions).toBe(true)
  })
})
