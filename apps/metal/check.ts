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

/** What the check did last, printed when a step fails. */
const trail: string[] = []

async function click(testID: string): Promise<void> {
  await waitUntil(() => root.nodeId(testID) !== undefined, `node ${testID} mounted`)
  const id = root.nodeId(testID)
  if (!id) throw new Error(`no mounted node with testID ${testID}`)
  trail.push(`click ${testID} (#${id})`)
  const before = root.lastTree()
  transport.simulate({ kind: 'click', id })
  // A press round-trips through the host and React before the next action can
  // target the resulting tree; a focus click changes nothing, so cap the wait.
  const settled = Date.now() + 250
  while (Date.now() < settled && root.lastTree() === before) await sleep(10)
}

const type = (text: string) => {
  trail.push(`type ${JSON.stringify(text)}`)
  transport.simulate({ kind: 'type', text })
}
const key = (keystroke: string) => {
  trail.push(`key ${keystroke}`)
  transport.simulate({ kind: 'key', keystroke })
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
    await sleep(1500)
  })

  await step('create and connect a SQLite database through the form', async () => {
    await click('new-connection')
    await click('driver:sqlite')
    await click('form:name')
    type('Check SQLite')
    await waitUntil(() => treeHas('"value":"Check SQLite"'), 'name typed')
    await click('form:host')
    type(dbPath)
    await waitUntil(() => treeHas(dbPath), 'path typed')
    await click('form:save')
    await waitUntil(() => treeHas('TABLES (0)'), 'connected with an empty schema')
  })

  await step('run DDL, DML, and a query; history records them', async () => {
    await click('editor')
    type('create table distros(name text, family text, year int)')
    key('ctrl-enter')
    await waitUntil(() => treeHas('TABLES (1)'), 'table created')
    key('ctrl-a')
    type(
      "insert into distros values ('Fedora','rpm',2003),('Nobara','rpm',2022),('Debian','deb',1993)",
    )
    key('ctrl-enter')
    await waitUntil(() => treeHas('row(s) affected') || treeHas('0 row(s)'), 'insert ran')
    key('ctrl-a')
    type('select * from distros order by year')
    key('ctrl-enter')
    await waitUntil(() => treeHas('Nobara') && treeHas('3 row(s)'), 'select rendered three rows')
    await click('panel:history')
    await waitUntil(
      () => treeHas('select * from distros order by year') && treeHas('3 rows'),
      'history lists the select',
    )
    await click('panel:connections')
  })

  await step('expand a table to see its columns, then browse it in a new tab', async () => {
    await click('expand:distros')
    await waitUntil(() => treeHas('family') && treeHas('year'), 'columns listed')
    await click('table:distros')
    await waitUntil(
      () =>
        treeHas('select * from \\"distros\\" limit 100') && root.nodeId('tab:tab-2') !== undefined,
      'table browse opened a second tab',
    )
    key('ctrl-enter')
    await waitUntil(() => treeHas('3 row(s)'), 'browse query ran')
  })

  await step('select a row to see its details', async () => {
    await click('row:1')
    await waitUntil(
      () => treeHas('DETAILS') && treeHas('name · text'),
      'details panel shows the row',
    )
  })

  await step('save the query and find it in the saved panel', async () => {
    await click('save-query')
    await click('save-query-name')
    type('All distros')
    key('enter')
    await click('panel:saved')
    await waitUntil(() => treeHas('All distros'), 'saved query listed')
  })

  await step('close a tab and fall back to the previous one', async () => {
    await click('close:tab-2')
    await waitUntil(
      () => root.nodeId('tab:tab-2') === undefined && root.nodeId('tab:tab-1') !== undefined,
      'tab closed',
    )
  })

  // Optional: ANKO_CHECK_POSTGRES=host:port:user:password:db drives the same
  // flow against a real PostgreSQL (e.g. a throwaway container).
  const postgres = process.env.ANKO_CHECK_POSTGRES?.split(':')
  if (postgres && postgres.length === 5) {
    const [host, port, user, password, database] = postgres
    await step('connect to PostgreSQL through the form and query it', async () => {
      await click('panel:connections')
      await click('new-connection')
      await click('driver:postgresql')
      await click('form:name')
      type('Check Postgres')
      await click('form:host')
      key('ctrl-a')
      type(host)
      await click('form:port')
      key('ctrl-a')
      type(port)
      await click('form:username')
      key('ctrl-a')
      type(user)
      await click('form:password')
      type(password)
      await click('form:database')
      type(database)
      await waitUntil(
        () => treeHas('"value":"Check Postgres"') && treeHas(`"value":"${database}"`),
        'form filled',
      )
      await click('form:test')
      await waitUntil(() => treeHas('Connection successful'), 'test connection', 20000)
      await click('form:save')
      await waitUntil(
        () => treeHas('TABLES (') && treeHas('Check Postgres / '),
        'connected to postgres',
        20000,
      )
      await click('new-tab')
      await click('editor')
      type("select 1 as one, 'pg' as who, now()::date as today")
      key('ctrl-enter')
      await waitUntil(
        () => treeHas('"pg"') && treeHas('1 row(s)'),
        'postgres query rendered',
        20000,
      )
    })
  }

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
  // Surface whatever the shell was showing in its error colour at the time.
  console.error(`  trail: ${trail.slice(-8).join(' → ')}`)
  const tree = root.lastTree() ?? ''
  const shown = [...tree.matchAll(/"color":"#f87171"[^\]]*"children":\["((?:[^"\\]|\\.)*)"/g)].map(
    (m) => m[1],
  )
  if (shown.length > 0) console.error(`  shell errors: ${shown.join(' | ')}`)
  console.error(`  tree length ${tree.length}, running: ${tree.includes('Running…')}`)
} finally {
  root.unmount()
  rmSync(dataDir, { recursive: true, force: true })
  process.exit(failed ? 1 : 0)
}
