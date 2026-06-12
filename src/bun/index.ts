import { homedir } from 'node:os'
import { join } from 'node:path'
import { app, menu } from 'mirinjs'
import { createRouter } from './rpc/router'
import { AppState } from './state'

// ---- App state + storage ----
const state = new AppState()

const appDataDir = join(
  process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support')
    : process.platform === 'win32'
      ? (process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'))
      : (process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')),
  'dev.netko.anko',
)

state.initializeStorage(appDataDir)
console.log(`[Anko] Storage initialized at: ${appDataDir}`)

// ---- RPC ----
app.serve(createRouter(state))

// The "main" window opens automatically from mirin.config.ts.

// ---- Application menu ----
app.on('ready', () => {
  menu.setApplicationMenu([
    {
      label: 'Anko',
      submenu: [
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', accelerator: 'Cmd+Q' },
      ],
    },
    {
      label: 'File',
      submenu: [{ role: 'close' }],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [{ role: 'togglefullscreen' }],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }],
    },
  ])
  console.log('[Anko] Application menu set')
})

app.on('window-all-closed', () => {
  app.quit()
})
