#!/usr/bin/env bun

/**
 * Dev runner — orchestrates Vite HMR + Electrobun dev with proper
 * sequential setup and concurrent execution.
 */

import { $ } from 'bun'

const PORT = 5173
const children: Array<ReturnType<typeof Bun.spawn>> = []

function cleanup() {
  for (const child of children) {
    try {
      child.kill()
    } catch {}
  }
}

process.on('SIGINT', () => {
  cleanup()
  process.exit(0)
})
process.on('SIGTERM', () => {
  cleanup()
  process.exit(0)
})

// 1. Kill stale Vite process on port
async function killPort(port: number) {
  try {
    const result = await $`lsof -ti:${port}`.text()
    const pids = result.trim().split('\n').filter(Boolean)
    for (const pid of pids) {
      try {
        process.kill(Number(pid), 9)
      } catch {}
    }
    if (pids.length) console.log(`[dev] Killed stale process on port ${port}`)
  } catch {
    // No process on port
  }
}

// 2. Clean build artifacts
async function cleanBuild() {
  await $`rm -rf build`.quiet()
  await $`mkdir -p dist`.quiet()
  console.log('[dev] Cleaned build directory')
}

// 3. Wait for port to be ready
async function waitForPort(port: number, timeoutMs = 15_000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${port}`)
      if (res.ok) return true
    } catch {}
    await Bun.sleep(200)
  }
  return false
}

// Main
async function main() {
  await killPort(PORT)
  await cleanBuild()

  // 4. Start Vite HMR
  console.log('[dev] Starting Vite HMR...')
  const vite = Bun.spawn(['bunx', 'vite', '--port', String(PORT)], {
    stdio: ['inherit', 'inherit', 'inherit'],
  })
  children.push(vite)

  // 5. Wait for Vite to be ready before starting Electrobun
  const ready = await waitForPort(PORT)
  if (!ready) {
    console.error('[dev] Vite failed to start within timeout')
    cleanup()
    process.exit(1)
  }
  console.log('[dev] Vite ready on port', PORT)

  // 6. Start Electrobun dev
  console.log('[dev] Starting Electrobun...')
  const electrobun = Bun.spawn(['bunx', 'electrobun', 'dev'], {
    stdio: ['inherit', 'inherit', 'inherit'],
  })
  children.push(electrobun)

  // 7. Wait for Electrobun to exit, then clean up Vite
  await electrobun.exited
  console.log('[dev] Electrobun exited')
  cleanup()
}

main().catch((err) => {
  console.error('[dev]', err)
  cleanup()
  process.exit(1)
})
