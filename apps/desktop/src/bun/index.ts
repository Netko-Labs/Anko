import { homedir } from 'node:os'
import { join } from 'node:path'
import { app, menu, notification } from 'mirinjs'
import { AnkoMcpService } from './mcp/service'
import { createRouter } from './rpc/router'
import { AppState } from './state'
import { getWindowState, saveWindowState } from './storage'

// ---- App state + storage ----
const state = new AppState()

// App data dir keyed on the bundle id (from mirin, falling back to the literal so
// installed builds keep their existing path). `mirin dev` gets a `-dev` suffix so
// development never reads or writes the installed app's connections/history.
const appId = app.id ?? 'dev.netko.anko'
const appDataDir = join(
  process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support')
    : process.platform === 'win32'
      ? (process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'))
      : (process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')),
  app.isDev ? `${appId}-dev` : appId,
)

state.initializeStorage(appDataDir)
console.log(`[Anko] Storage initialized at: ${appDataDir}`)

// ---- RPC ----
const mcp = new AnkoMcpService(state, appDataDir)
const served = app.serve(createRouter(state, mcp))
mcp.setEvents({
  approvalRequested: (request) => served.rpc.mcpApprovalRequested.broadcast(request),
  statusChanged: (settings) => served.rpc.mcpStatusChanged.broadcast(settings),
  connectionChanged: () => served.rpc.mcpConnectionChanged.broadcast(),
  historyAdded: (entry) => served.rpc.mcpHistoryAdded.broadcast(entry),
  notifyApproval: (request) => {
    notification.show({
      title: 'Anko approval required',
      body:
        request.kind === 'open_connection'
          ? `${request.clientName} wants to open ${request.connectionName}`
          : `${request.clientName} wants to run SQL on ${request.connectionName}`,
    })
  },
})

// ---- Main window (manual open so we can restore the saved frame) ----
app.on('ready', async () => {
  const saved = getWindowState()

  const win = await app.windows.open({
    name: 'main',
    url: 'app://ui/index.html',
    title: 'Anko',
    titleBarStyle: 'hiddenInset',
    // Center the traffic lights in Anko's 36px (h-9) title bar.
    trafficLightPosition: { x: 13, y: 13 },
    show: 'ready',
    minWidth: 880,
    minHeight: 600,
    x: saved.x,
    y: saved.y,
    width: saved.width,
    height: saved.height,
  })
  console.log(`[Anko] Main window opened at ${saved.x},${saved.y} ${saved.width}x${saved.height}`)
  mcp.setWindowFocused(true)
  win.on('focus', () => mcp.setWindowFocused(true))
  win.on('blur', () => mcp.setWindowFocused(false))

  // Restore maximized state once the window has settled.
  if (saved.isMaximized) {
    setTimeout(() => void win.maximize(), 150)
  }

  // Persist the frame periodically. While maximized, keep the last normal frame
  // and only flip the flag, so un-maximizing returns to a sensible size.
  const saveInterval = setInterval(() => {
    try {
      if (win.isMaximized()) {
        const current = getWindowState()
        if (!current.isMaximized) saveWindowState({ ...current, isMaximized: true })
        return
      }
      const frame = win.getFrame()
      if (frame.width > 0 && frame.height > 0) {
        saveWindowState({
          x: Math.round(frame.x),
          y: Math.round(frame.y),
          width: Math.round(frame.width),
          height: Math.round(frame.height),
          isMaximized: false,
        })
      }
    } catch {
      // Window may be closing; ignore.
    }
  }, 2000)

  win.on('closed', () => clearInterval(saveInterval))
})

app.on('ready', () => {
  void mcp.initialize()
})

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
  void mcp.stop()
  app.quit()
})
