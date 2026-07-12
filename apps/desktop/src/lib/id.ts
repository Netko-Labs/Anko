/**
 * Unique id generation that works inside mirin's webview.
 *
 * mirin serves the UI from the `app://` scheme, which is deliberately NOT a
 * secure context (so the RPC WebSocket to localhost is allowed). `crypto
 * .randomUUID()` is gated to secure contexts in Chromium, so it's undefined in
 * the built app — calling it throws and silently kills the click handler (e.g.
 * "Open Table" did nothing). `crypto.getRandomValues`, by contrast, is available
 * everywhere, so we build a proper UUIDv4 from it, falling back to randomUUID
 * when it exists (dev/Vite on localhost) and to Math.random as a last resort.
 */
export function genId(): string {
  const c = globalThis.crypto as Crypto | undefined

  if (typeof c?.randomUUID === 'function') return c.randomUUID()

  if (typeof c?.getRandomValues === 'function') {
    const b = c.getRandomValues(new Uint8Array(16))
    b[6] = (b[6] & 0x0f) | 0x40 // version 4
    b[8] = (b[8] & 0x3f) | 0x80 // variant 10
    const h = Array.from(b, (x) => x.toString(16).padStart(2, '0'))
    return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h.slice(8, 10).join('')}-${h.slice(10, 16).join('')}`
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 14)}`
}
