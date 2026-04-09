import { dlopen, FFIType } from 'bun:ffi'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { ApplicationMenu, BrowserWindow } from 'electrobun/bun'
import { createRpcHandler } from './rpc/handlers'
import { AppState } from './state'

// Initialize state
const state = new AppState()

// Determine app data directory
const appDataDir = join(
  process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support')
    : process.platform === 'win32'
      ? (process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'))
      : (process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')),
  'dev.netko.anko',
)

// Initialize storage
state.initializeStorage(appDataDir)
console.log(`[Anko] Storage initialized at: ${appDataDir}`)

// Determine URL based on environment
let isDev = true
try {
  const versionInfo = await Bun.file('../Resources/version.json').json()
  isDev = versionInfo.channel === 'dev'
} catch {
  // version.json doesn't exist — running outside an app bundle (raw dev)
}
const url = isDev ? 'http://localhost:5173' : 'views://mainview/index.html'

// Window reference for closeWindow RPC
let mainWindow: BrowserWindow | null = null

// Restore saved window state
const storage = state.getStorage()
const savedWindowState = storage.windowState.get()

// Create RPC handler
const rpc = createRpcHandler(state, () => mainWindow, url)

// Create main window with restored frame
mainWindow = new BrowserWindow({
  title: 'Anko',
  frame: {
    x: savedWindowState.x,
    y: savedWindowState.y,
    width: savedWindowState.width,
    height: savedWindowState.height,
  },
  titleBarStyle: 'hiddenInset',
  renderer: 'cef',
  url,
  rpc,
})

// Restore maximized state after window creation
if (savedWindowState.isMaximized) {
  setTimeout(() => mainWindow?.maximize(), 150)
}

console.log(`[Anko] Window created, loading: ${url}`)

// Periodically save window state (every 2s, only when not maximized to preserve normal frame)
const windowStateSaveInterval = setInterval(() => {
  if (!mainWindow) return
  try {
    const maximized = mainWindow.isMaximized()
    if (!maximized) {
      const frame = mainWindow.getFrame()
      storage.windowState.save({ ...frame, isMaximized: false })
    } else {
      // Only update the maximized flag, keep the last normal frame
      const current = storage.windowState.get()
      if (!current.isMaximized) {
        storage.windowState.save({ ...current, isMaximized: true })
      }
    }
  } catch {
    // Window may be closing
  }
}, 2000)

// Clear window state interval on exit
process.on('beforeExit', () => clearInterval(windowStateSaveInterval))

// Set up application menu (delayed to ensure window is fully initialized)
setTimeout(() => {
  ApplicationMenu.setApplicationMenu([
    {
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'showAll' },
        { type: 'separator' },
        { role: 'quit' },
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
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [{ role: 'toggleFullScreen' }],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'bringAllToFront' },
      ],
    },
    {
      label: 'Help',
      submenu: [{ role: 'showHelp' }],
    },
  ])
  console.log('[Anko] Application menu set')
}, 100)

// Install native drag monitor (uses performWindowDragWithEvent: for proper macOS tiling support)
if (process.platform === 'darwin') {
  try {
    const libPath = join(import.meta.dir, '../native/libWindowDrag.dylib')
    const lib = dlopen(libPath, {
      installNativeDragMonitor: { args: [], returns: FFIType.void },
      repositionTrafficLights: { args: [], returns: FFIType.void },
    })
    lib.symbols.installNativeDragMonitor()
    lib.symbols.repositionTrafficLights()
    console.log('[Anko] Native drag monitor + traffic lights positioned')
  } catch (e) {
    console.warn('[Anko] Native drag monitor not available:', e)
  }
}
