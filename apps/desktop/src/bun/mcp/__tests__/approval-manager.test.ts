import { describe, expect, test } from 'bun:test'
import { createHash } from 'node:crypto'
import { McpApprovalManager } from '../approval-manager'

const input = {
  kind: 'execute_query' as const,
  clientName: 'test-client',
  connectionId: 'connection-1',
  connectionName: 'Local',
  sql: 'DELETE FROM users',
  riskReasons: ['delete'],
}

describe('McpApprovalManager', () => {
  test('resolves only the stored request', async () => {
    let changed = 0
    const manager = new McpApprovalManager(
      () => {},
      () => changed++,
    )
    const result = manager.request(input)
    const [pending] = manager.list()
    expect(pending.sqlHash).toBe(createHash('sha256').update(input.sql).digest('hex'))
    expect(manager.resolve(pending.id, true)).toBe(true)
    expect(await result).toBe('approved')
    expect(changed).toBe(2)
  })

  test('times out and removes the request', async () => {
    const manager = new McpApprovalManager(
      () => {},
      () => {},
      5,
    )
    expect(await manager.request(input)).toBe('timed_out')
    expect(manager.list()).toEqual([])
  })

  test('cancellation rejects and cannot execute later', async () => {
    const controller = new AbortController()
    const manager = new McpApprovalManager(
      () => {},
      () => {},
    )
    const result = manager.request(input, controller.signal)
    const id = manager.list()[0].id
    controller.abort()
    expect(await result).toBe('rejected')
    expect(manager.resolve(id, true)).toBe(false)
  })
})
