/**
 * Boot the Anko Metal app: storage, the native host, and the React root.
 * Shared by `main.tsx` (the app) and `check.ts` (the automated check).
 */

import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { AppState } from '@anko/desktop-service'
import { type NativeRoot, type NativeTransport, render, spawnNativeHost } from '@mirinjs/metal'
import { App } from './App'

const appId = 'dev.netko.anko'

export interface BootOptions {
  /** Override the data directory (checks use a throwaway one). */
  dataDir?: string
}

export interface BootedApp {
  state: AppState
  transport: NativeTransport
  root: NativeRoot
  dataDir: string
}

export function defaultDataDir(): string {
  const dataRoot =
    process.platform === 'darwin'
      ? join(homedir(), 'Library', 'Application Support')
      : (process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'))
  // Separate from the CEF app's data so both can run side by side while Metal is alpha.
  return join(dataRoot, `${appId}-metal`)
}

export function resolveHost(): string {
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

export function boot(options: BootOptions = {}): BootedApp {
  const dataDir = options.dataDir ?? defaultDataDir()
  const state = new AppState()
  state.initializeStorage(dataDir)
  process.env.MIRIN_METAL_TITLE ??= 'Anko'
  process.env.MIRIN_METAL_SIZE ??= '1280x820'
  const transport = spawnNativeHost(resolveHost())
  const root = render(<App state={state} />, transport)
  return { state, transport, root, dataDir }
}
