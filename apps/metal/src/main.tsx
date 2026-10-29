/**
 * Anko on mirin metal. Normal React runs in Bun with direct access to Anko's
 * backend layer packages (no RPC hop), and the UI is drawn by GPUI through the
 * `mirin-metal-host` renderer instead of a webview.
 *
 * Run from this directory: `bun run dev` (needs the host binary built from
 * `crates/mirin-metal` in the mirin checkout, or `ANKO_METAL_HOST=<path>`).
 */

import { boot } from './boot'

const { root, transport, dataDir } = boot()
console.log(`[anko metal] storage at ${dataDir}`)

const shutdown = () => {
  root.unmount()
  process.exit(0)
}
transport.onClose(shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
