/**
 * Automated check for Anko on Metal. Boots the real app against a throwaway
 * data directory, drives it through the renderer's simulated input (no desktop
 * interaction), and asserts on the tree the app sends to the renderer.
 * Run from this directory: `bun check.ts`
 */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { boot } from './src/boot'

const dataDir = mkdtempSync(join(tmpdir(), 'anko-metal-check-'))
const dbPath = join(dataDir, 'check.db')
const { root, transport } = boot({ dataDir })

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitUntil(predicate: () => boolean, what: string, timeoutMs = 10000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (predicate()) return
    await sleep(50)
  }
  throw new Error(`timed out: ${what}`)
}

/** Raw substring search over the JSON tree the app last sent to the renderer. */
const treeHas = (text: string) => (root.lastTree() ?? '').includes(text)

function click(testID: string): void {
  const id = root.nodeId(testID)
  if (!id) throw new Error(`no mounted node with testID ${testID}`)
  transport.simulate({ kind: 'click', id })
}

async function step(name: string, run: () => Promise<void>): Promise<void> {
  const started = performance.now()
  await run()
  console.log(`  ✓ ${name} (${Math.round(performance.now() - started)}ms)`)
}

let failed = false
try {
  await step('the shell renders', async () => {
    await waitUntil(() => treeHas('No connections yet'), 'first tree')
    // Give the host a moment to open the window and paint before clicking.
    await sleep(1500)
  })

  await step('create and connect a SQLite database', async () => {
    click('new-sqlite-name')
    transport.simulate({ kind: 'type', text: 'Check SQLite' })
    await waitUntil(() => treeHas('"value":"Check SQLite"'), 'name typed')
    click('new-sqlite-path')
    transport.simulate({ kind: 'type', text: dbPath })
    await waitUntil(() => treeHas(dbPath), 'path typed')
    click('new-sqlite-save')
    await waitUntil(() => treeHas('TABLES (0)'), 'connected with an empty schema')
  })

  await step('run DDL, DML, and a query through the editor', async () => {
    click('editor')
    transport.simulate({
      kind: 'type',
      text: 'create table distros(name text, family text, year int)',
    })
    transport.simulate({ kind: 'key', keystroke: 'ctrl-enter' })
    await waitUntil(() => treeHas('table:distros') || treeHas('TABLES (1)'), 'table created')
    transport.simulate({ kind: 'key', keystroke: 'ctrl-a' })
    transport.simulate({
      kind: 'type',
      text: "insert into distros values ('Fedora','rpm',2003),('Nobara','rpm',2022),('Debian','deb',1993)",
    })
    transport.simulate({ kind: 'key', keystroke: 'ctrl-enter' })
    await waitUntil(() => treeHas('3 row(s)') || treeHas('0 row(s)'), 'insert ran')
    transport.simulate({ kind: 'key', keystroke: 'ctrl-a' })
    transport.simulate({ kind: 'type', text: 'select * from distros order by year' })
    transport.simulate({ kind: 'key', keystroke: 'ctrl-enter' })
    await waitUntil(() => treeHas('Nobara') && treeHas('3 row(s)'), 'select rendered three rows')
  })

  await step('browse a table from the sidebar', async () => {
    click('table:distros')
    await waitUntil(() => treeHas('select * from \\"distros\\" limit 100'), 'table browse query')
  })

  await step('the layout query reports painted nodes', async () => {
    let nodes = 0
    transport.onEvent((event) => {
      if (event.type === 'layout') nodes = event.nodes.length
    })
    transport.simulate({ kind: 'layout' })
    await waitUntil(() => nodes > 10, 'layout snapshot')
  })
  console.log('✓ anko metal check passed')
} catch (error) {
  failed = true
  console.error(
    `✗ anko metal check failed: ${error instanceof Error ? error.message : String(error)}`,
  )
} finally {
  root.unmount()
  rmSync(dataDir, { recursive: true, force: true })
  process.exit(failed ? 1 : 0)
}
