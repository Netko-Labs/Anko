import type { UpdateDownloadStatus } from '@anko/desktop-domain'
import {
  clearConnections,
  clearQueryHistory,
  clearSavedQueries,
  clearWorkspaces,
} from '@anko/desktop-repository'
import { app, dialog } from 'mirinjs'
import { rpc } from 'mirinjs/rpc'
import pkg from '../../package.json'

const APP_VERSION = (pkg as { version?: string }).version ?? '0.0.0'

// Live snapshot of the in-flight update download, polled by `getUpdateStatus`.
// app.updater.download() runs in the background; we mirror its progress here so
// the existing poll-based frontend (src/lib/updater.ts) works unchanged.
let downloadStatus: UpdateDownloadStatus = {
  status: 'idle',
  message: '',
  isComplete: false,
  isError: false,
}

/** The live main window handle, or null if it isn't open yet. */
function mainWindow() {
  try {
    return app.windows.get('main')
  } catch {
    return null
  }
}

/** Updater orchestration, misc utilities, and native window controls. */
export function systemRoutes() {
  return {
    // ---- Update commands (mirin app.updater) ----
    checkForUpdate: rpc.query(async () => {
      try {
        const info = await app.updater.checkForUpdate()
        return {
          currentVersion: app.updater.currentVersion || APP_VERSION,
          version: info?.version ?? '',
          updateAvailable: !!info,
          body: readOptionalString(info, 'body'),
          date: readOptionalString(info, 'date'),
          error: '',
        }
      } catch (e) {
        return {
          currentVersion: app.updater.currentVersion || APP_VERSION,
          version: '',
          updateAvailable: false,
          error: e instanceof Error ? e.message : String(e),
        }
      }
    }),
    // Start the download in the background; getUpdateStatus is polled for progress.
    downloadUpdate: rpc.mutation(() => {
      downloadStatus = { status: 'downloading', message: '', isComplete: false, isError: false }
      app.updater
        .download((p) => {
          downloadStatus.bytesDownloaded = p.received
          downloadStatus.totalBytes = p.total
          downloadStatus.progress = p.fraction
        })
        .then(() => {
          downloadStatus = { ...downloadStatus, status: 'ready', isComplete: true }
        })
        .catch((e) => {
          downloadStatus = {
            ...downloadStatus,
            status: 'error',
            isError: true,
            errorMessage: e instanceof Error ? e.message : String(e),
          }
        })
    }),
    getUpdateStatus: rpc.query((): UpdateDownloadStatus => downloadStatus),
    applyUpdate: rpc.mutation(async () => {
      await app.updater.applyAndRelaunch()
    }),

    // ---- Utility commands ----
    clearAllData: rpc.mutation(() => {
      clearSavedQueries()
      clearWorkspaces()
      clearConnections()
      clearQueryHistory()
    }),
    getAppVersion: rpc.query(() => APP_VERSION),
    showSaveDialog: rpc.mutation(
      async ({
        defaultPath,
      }: {
        defaultPath?: string
        filters?: Array<{ name: string; extensions: string[] }>
      }): Promise<string | null> => {
        return dialog.saveFile({ defaultName: defaultPath?.split('/').pop() })
      },
    ),
    writeTextFile: rpc.mutation(async ({ path, content }: { path: string; content: string }) => {
      await Bun.write(path, content)
    }),
    // Save a binary image (e.g. an exported ERD PNG). The frontend passes a
    // base64 payload; a native save dialog picks the path. Returns it, or null
    // if cancelled.
    saveImageFile: rpc.mutation(
      async ({
        defaultName,
        base64,
      }: {
        defaultName?: string
        base64: string
      }): Promise<string | null> => {
        let path = await dialog.saveFile({ defaultName })
        if (!path) return null
        // Ensure the saved file keeps the intended extension even if the dialog
        // dropped it or the user typed a bare name.
        const dot = defaultName?.lastIndexOf('.') ?? -1
        const ext = dot > 0 ? defaultName!.slice(dot) : ''
        if (ext && !path.toLowerCase().endsWith(ext.toLowerCase())) path += ext
        await Bun.write(path, Buffer.from(base64, 'base64'))
        return path
      },
    ),

    // ---- Window controls ----
    closeWindow: rpc.mutation(() => {
      mainWindow()?.close()
    }),
    minimizeWindow: rpc.mutation(() => {
      mainWindow()?.minimize()
    }),
    maximizeWindow: rpc.mutation(() => {
      mainWindow()?.maximize()
    }),
    unmaximizeWindow: rpc.mutation(() => {
      mainWindow()?.restore()
    }),
    isWindowMaximized: rpc.query(() => mainWindow()?.isMaximized() ?? false),
    getWindowFrame: rpc.query(
      () => mainWindow()?.getFrame() ?? { x: 0, y: 0, width: 0, height: 0 },
    ),
    setWindowPosition: rpc.mutation(({ x, y }: { x: number; y: number }) => {
      mainWindow()?.setPosition(x, y)
    }),
    // Open (or focus) the in-app DevTools panel — the same UI bundle loaded at
    // the `#devtools` route (see src/main.tsx) in a separate floating window.
    openDevToolsWindow: rpc.mutation(async () => {
      const existing = (() => {
        try {
          return app.windows.get('devtools')
        } catch {
          return null
        }
      })()
      if (existing) {
        await existing.focus()
        return
      }
      const win = await app.windows.open({
        name: 'devtools',
        title: 'Anko Dev Tools',
        titleBarStyle: 'hiddenInset',
        url: 'app://ui/index.html#devtools',
        width: 560,
        height: 700,
        x: 300,
        y: 250,
        alwaysOnTop: true,
        show: 'ready',
      })
      await win.setAlwaysOnTop(true)
    }),
  }
}

function readOptionalString(value: unknown, key: string): string | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const field = (value as Record<string, unknown>)[key]
  return typeof field === 'string' && field.length > 0 ? field : undefined
}
