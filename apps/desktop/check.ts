/**
 * `mirin check` scenario for Anko: boot, create a SQLite connection, run a
 * query, and read the results back. Exercises the renderer, the typed RPC
 * plane, the Bun.SQL/bun:sqlite connector, and encrypted connection storage.
 * Run: `bunx mirin check --scenario ./check.ts`
 */

import { defineCheck } from 'mirinjs/check'

const bodyText = async (app: { evaluate<T>(code: string): Promise<T> }): Promise<string> =>
  app.evaluate<string>('document.body.innerText')

export default defineCheck(async (app) => {
  app.step('the shell renders its first screen')
  await app.waitUntil(
    async () => (await bodyText(app)).includes('CONNECTIONS'),
    'the sidebar never rendered',
  )
  await app.screenshot('first-screen')

  app.step('create a SQLite connection')
  if ((await bodyText(app)).includes('Check SQLite')) {
    app.step('reuse the saved SQLite connection from a previous run')
  } else {
    await app.click('text=New Connection')
    await app.expectText('Database Type')
    await app.click('[data-slot=select-trigger]')
    await app.waitFor('[role=option]')
    await app.click('text=SQLite')
    await app.click('text=My Database')
    await app.type('Check SQLite')
    await app.click('text=/path/to/database.db or :memory:')
    await app.type('/tmp/anko-check.db')
    await app.screenshot('connection-form')
    await app.click('text=Save')
    await app.waitUntil(
      async () => (await bodyText(app)).includes('Check SQLite'),
      'the saved connection never appeared in the sidebar',
    )

    await app.waitUntil(
      async () =>
        !(await app.evaluate<boolean>("Boolean(document.querySelector('[role=dialog]'))")),
      'the connection dialog never closed',
    )
  }

  app.step('connect and run a query')
  await app.click('text=Check SQLite')
  await app.screenshot('after-connect-click')
  // Restored sessions keep earlier tabs mounted but hidden; tag the visible editor.
  await app.waitUntil(
    async () =>
      app.evaluate<boolean>(`(() => {
        const editor = [...document.querySelectorAll('.cm-content')].find((el) => el.getClientRects().length > 0)
        if (editor) editor.setAttribute('data-check-editor', '')
        return Boolean(editor)
      })()`),
    'no visible query editor',
    { timeoutMs: 15000 },
  )
  await app.click('[data-check-editor]')
  await app.type("select 42 as answer, 'fedora' as distro")
  await app.click('text=Run')
  await app.waitUntil(async () => {
    const text = await bodyText(app)
    return text.includes('answer') && text.includes('fedora')
  }, 'the query result never rendered')
  await app.screenshot('query-results')

  app.step('export the results as CSV')
  // The export is a browser download; the core routes it to a native save
  // dialog. The toast fires as soon as the download is handed to the engine, so
  // the dialog itself is left to the person (or driver) running the check.
  // Toasts stack over the footer; let them clear so the click reaches the menu.
  await app.waitUntil(
    async () =>
      !(await app.evaluate<boolean>("Boolean(document.querySelector('[data-sonner-toast]'))")),
    'toasts never cleared',
    { timeoutMs: 15000 },
  )
  const tagged = await app.evaluate<boolean>(`(() => {
    const trigger = [...document.querySelectorAll('[data-slot=dropdown-menu-trigger]')]
      .find((el) => el.textContent?.includes('Download') && el.getClientRects().length > 0)
    if (trigger) trigger.setAttribute('data-check-download', '')
    return Boolean(trigger)
  })()`)
  app.assert(tagged, 'no Download menu in the results footer')
  await app.click('[data-check-download]')
  await app.waitUntil(
    async () =>
      app.evaluate<boolean>(`(() => {
        const item = [...document.querySelectorAll('[data-slot=dropdown-menu-item]')]
          .find((el) => el.textContent?.includes('Export as CSV') && el.getClientRects().length > 0)
        if (item) item.setAttribute('data-check-export-csv', '')
        return Boolean(item)
      })()`),
    'the Download menu never opened',
  )
  await app.click('[data-check-export-csv]')
  await app.waitUntil(
    async () => (await bodyText(app)).includes('Exported to CSV'),
    'the CSV export never started',
    { timeoutMs: 10000 },
  )

  app.step('no RPC call failed along the way')
  const failed = await app.logs({ type: 'rpc.error' })
  app.assert(
    failed.length === 0,
    `${failed.length} RPC call(s) failed: ${failed.map((event) => event.msg).join('; ')}`,
  )
})
