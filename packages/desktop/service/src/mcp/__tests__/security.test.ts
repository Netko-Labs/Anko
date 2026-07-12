import { describe, expect, test } from 'bun:test'
import { authorizeMcpRequest } from '../security'

const port = 43821
const token = 'test-token-that-is-long-enough-for-comparison'

function request(headers: Record<string, string>) {
  return new Request(`http://127.0.0.1:${port}/mcp`, { method: 'POST', headers })
}

describe('authorizeMcpRequest', () => {
  test('accepts an authenticated loopback request', () => {
    expect(
      authorizeMcpRequest(
        request({ host: `127.0.0.1:${port}`, authorization: `Bearer ${token}` }),
        port,
        token,
      ),
    ).toBeNull()
  })

  test('rejects a missing or incorrect bearer token', () => {
    const missing = authorizeMcpRequest(request({ host: `127.0.0.1:${port}` }), port, token)
    const incorrect = authorizeMcpRequest(
      request({ host: `127.0.0.1:${port}`, authorization: 'Bearer wrong' }),
      port,
      token,
    )
    expect(missing?.status).toBe(401)
    expect(incorrect?.status).toBe(401)
  })

  test('rejects non-loopback hosts', () => {
    const response = authorizeMcpRequest(
      request({ host: `example.com:${port}`, authorization: `Bearer ${token}` }),
      port,
      token,
    )
    expect(response?.status).toBe(403)
  })

  test('rejects foreign, secure, and wrong-port origins', () => {
    for (const origin of [
      `https://127.0.0.1:${port}`,
      `http://127.0.0.1:${port + 1}`,
      'http://example.com:43821',
    ]) {
      const response = authorizeMcpRequest(
        request({
          host: `127.0.0.1:${port}`,
          origin,
          authorization: `Bearer ${token}`,
        }),
        port,
        token,
      )
      expect(response?.status).toBe(403)
    }
  })
})
