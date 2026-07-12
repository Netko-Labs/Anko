import { createHash, timingSafeEqual } from 'node:crypto'

export function authorizeMcpRequest(
  request: Request,
  port: number,
  token: string,
): Response | null {
  const host = request.headers.get('host')
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
    return new Response('Forbidden', { status: 403 })
  }

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      const url = new URL(origin)
      if (
        url.protocol !== 'http:' ||
        !['127.0.0.1', 'localhost'].includes(url.hostname) ||
        url.port !== String(port) ||
        url.username ||
        url.password
      ) {
        return new Response('Forbidden', { status: 403 })
      }
    } catch {
      return new Response('Forbidden', { status: 403 })
    }
  }

  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const expectedDigest = createHash('sha256').update(token).digest()
  const suppliedDigest = createHash('sha256').update(supplied).digest()
  if (!timingSafeEqual(expectedDigest, suppliedDigest)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Bearer' },
    })
  }
  return null
}
