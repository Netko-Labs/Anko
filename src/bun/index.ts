import { dlopen, FFIType } from 'bun:ffi'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { BrowserWindow } from 'electrobun/bun'
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
  'com.anko.sql',
)

// Initialize storage
state.initializeStorage(appDataDir)
console.log(`[Anko] Storage initialized at: ${appDataDir}`)

// Window reference for closeWindow RPC
let mainWindow: BrowserWindow | null = null

// Create RPC handler
const rpc = createRpcHandler(state, () => mainWindow)

// Determine URL based on environment
// Read the build channel from version.json to detect production vs dev.
// Electrobun writes this file into the app bundle during build with the --env flag value.
let isDev = true
try {
  const versionInfo = await Bun.file('../Resources/version.json').json()
  isDev = versionInfo.channel === 'dev'
} catch {
  // version.json doesn't exist — running outside an app bundle (raw dev)
}
const url = isDev ? 'http://localhost:5173' : 'views://mainview/index.html'

// Create main window
mainWindow = new BrowserWindow({
  title: 'Anko',
  frame: {
    x: 200,
    y: 200,
    width: 1200,
    height: 800,
  },
  titleBarStyle: 'hiddenInset',
  url,
  rpc,
})

console.log(`[Anko] Window created, loading: ${url}`)

// Install native drag monitor (uses performWindowDragWithEvent: for proper macOS tiling support)
if (process.platform === 'darwin') {
  try {
    const libPath = join(import.meta.dir, '../native/libWindowDrag.dylib')
    const lib = dlopen(libPath, {
      installNativeDragMonitor: { args: [], returns: FFIType.void },
    })
    lib.symbols.installNativeDragMonitor()
    console.log('[Anko] Native drag monitor installed')
  } catch (e) {
    console.warn('[Anko] Native drag monitor not available:', e)
  }
}
