/**
 * Anko on mirin metal. Normal React runs in Bun with direct access to Anko's
 * backend layer packages (no RPC hop), and the UI is drawn by GPUI through the
 * `mirin-metal-host` renderer instead of a webview.
 *
 * Run from this directory: `bun run dev` (needs the host binary built from
 * `crates/mirin-metal` in the mirin checkout, or `ANKO_METAL_HOST=<path>`).
 */

import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { AppState } from '@anko/desktop-service'
import { render, spawnNativeHost } from '@mirinjs/metal'
import { App } from './App'

const appId = 'dev.netko.anko'
const dataRoot =
  process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support')
    : (process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'))
// Separate from the CEF app's data so both can run side by side while Metal is alpha.
const appDataDir = join(dataRoot, `${appId}-metal`)

const state = new AppState()
state.initializeStorage(appDataDir)
console.log(`[anko metal] storage at ${appDataDir}`)

function resolveHost(): string {
  const fromEnv = process.env.ANKO_METAL_HOST
  if (fromEnv) return fromEnv
  const candidates = [
    new URL(
      '../../../../mirin/crates/mirin-metal/target/release/mirin-metal-host',
      import.meta.url,
    ),
    new URL('../../../../mirin/crates/mirin-metal/target/debug/mirin-metal-host', import.meta.url),
  ].map((url) => url.pathname)
  const found = candidates.find((path) => existsSync(path))
  if (!found) {
    throw new Error(
      `mirin-metal-host not found; build it (cargo build --bin mirin-metal-host in crates/mirin-metal) or set ANKO_METAL_HOST. Looked in: ${candidates.join(', ')}`,
    )
  }
  return found
}

process.env.MIRIN_METAL_TITLE = 'Anko'
process.env.MIRIN_METAL_SIZE ??= '1280x820'
const transport = spawnNativeHost(resolveHost())
const root = render(<App state={state} />, transport)

const shutdown = () => {
  root.unmount()
  process.exit(0)
}
transport.onClose(shutdown)
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
