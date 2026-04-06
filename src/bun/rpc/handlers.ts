import { BrowserView, BrowserWindow, Updater } from 'electrobun/bun'
import type { AnkoRPC, UpdateDownloadStatus } from '../../shared/rpc-types'
import { MySqlConnector } from '../db/mysql'
import { PostgresConnector } from '../db/postgres'
import { SqliteConnector } from '../db/sqlite'
import type { AppState } from '../state'

export function createRpcHandler(
  state: AppState,
  getWindow: () => {
    close: () => void
    minimize: () => void
    maximize: () => void
    unmaximize: () => void
    isMaximized: () => boolean
    getFrame: () => { x: number; y: number; width: number; height: number }
    setPosition: (x: number, y: number) => void
  } | null,
  baseUrl: string,
) {
  let latestDownloadStatus: UpdateDownloadStatus = {
    status: 'idle',
    message: '',
    isComplete: false,
    isError: false,
  }

  Updater.onStatusChange((entry) => {
    latestDownloadStatus = {
      status: entry.status,
      message: entry.message,
      progress: entry.details?.progress,
      bytesDownloaded: entry.details?.bytesDownloaded,
      totalBytes: entry.details?.totalBytes,
      isComplete: entry.status === 'download-complete',
      isError: entry.status === 'error',
      errorMessage: entry.details?.errorMessage,
    }
  })

  return BrowserView.defineRPC<AnkoRPC>({
    maxRequestTime: 60_000,
    handlers: {
      requests: {
        // Connection commands
        connect: async ({ config }) => {
          return state.connect(config)
        },
        disconnect: async ({ connectionId }) => {
          await state.disconnect(connectionId)
        },
        testConnection: async ({ config }) => {
          try {
            let connector: import('../db/connector').DatabaseConnector
            if (config.driver === 'mysql') {
              connector = await MySqlConnector.connect(config)
            } else if (config.driver === 'sqlite') {
              connector = await SqliteConnector.connect(config)
            } else {
              connector = await PostgresConnector.connect(config)
            }
            await connector.close()
            return true
          } catch {
            return false
          }
        },

        // Query commands
        executeQuery: async ({ connectionId, query, database, context }) => {
          const conn = state.getConnection(connectionId)
          return conn.executeWithContext(query, database, context)
        },

        // Schema commands
        getDatabases: async ({ connectionId }) => {
          const conn = state.getConnection(connectionId)
          return conn.getDatabases()
        },
        getSchemas: async ({ connectionId, database }) => {
          const conn = state.getConnection(connectionId)
          return conn.getSchemas(database)
        },
        getTables: async ({ connectionId, database, schema }) => {
          const conn = state.getConnection(connectionId)
          return conn.getTables(database, schema)
        },
        getColumns: async ({ connectionId, database, schema, table }) => {
          const conn = state.getConnection(connectionId)
          return conn.getColumns(database, schema, table)
        },

        // Connection storage
        saveConnection: ({ config }) => {
          const storage = state.getStorage()
          return storage.connections.save(config)
        },
        updateConnection: ({ id, config }) => {
          const storage = state.getStorage()
          storage.connections.update(id, config)
        },
        listConnections: () => {
          const storage = state.getStorage()
          return storage.connections.list()
        },
        deleteConnection: ({ id }) => {
          const storage = state.getStorage()
          storage.workspaces.removeConnectionFromAll(id)
          storage.connections.delete(id)
        },
        getConnectionConfig: ({ id }) => {
          const storage = state.getStorage()
          return storage.connections.getConnectionConfig(id)
        },

        // Workspace commands
        listWorkspaces: () => {
          const storage = state.getStorage()
          return storage.workspaces.list()
        },
        createWorkspace: ({ config }) => {
          const storage = state.getStorage()
          return storage.workspaces.create(config)
        },
        updateWorkspace: ({ id, config }) => {
          const storage = state.getStorage()
          return storage.workspaces.update(id, config)
        },
        deleteWorkspace: ({ id }) => {
          const storage = state.getStorage()
          storage.workspaces.delete(id)
        },
        addConnectionToWorkspace: ({ workspaceId, connectionId }) => {
          const storage = state.getStorage()
          storage.workspaces.addConnection(workspaceId, connectionId)
        },
        removeConnectionFromWorkspace: ({ workspaceId, connectionId }) => {
          const storage = state.getStorage()
          storage.workspaces.removeConnection(workspaceId, connectionId)
        },
        moveConnectionBetweenWorkspaces: ({ connectionId, fromWorkspaceId, toWorkspaceId }) => {
          const storage = state.getStorage()
          storage.workspaces.moveConnection(connectionId, fromWorkspaceId, toWorkspaceId)
        },

        // Query history
        addQueryHistory: ({ input }) => {
          const storage = state.getStorage()
          return storage.queryHistory.add(input)
        },
        listQueryHistory: ({ connectionId, limit }) => {
          const storage = state.getStorage()
          return storage.queryHistory.list(connectionId, limit)
        },
        deleteQueryHistory: ({ id }) => {
          const storage = state.getStorage()
          storage.queryHistory.delete(id)
        },
        clearQueryHistory: () => {
          const storage = state.getStorage()
          storage.queryHistory.clearAll()
        },

        // Saved queries
        createSavedQuery: ({ input }) => {
          const storage = state.getStorage()
          return storage.savedQueries.create(input)
        },
        listSavedQueries: ({ workspaceId }) => {
          const storage = state.getStorage()
          return storage.savedQueries.list(workspaceId)
        },
        updateSavedQuery: ({ id, input }) => {
          const storage = state.getStorage()
          return storage.savedQueries.update(id, input)
        },
        deleteSavedQuery: ({ id }) => {
          const storage = state.getStorage()
          storage.savedQueries.delete(id)
        },

        // Update commands
        checkForUpdate: async () => {
          try {
            const result = await Updater.checkForUpdate()
            let currentVersion: string
            try {
              currentVersion = await Updater.localInfo.version()
            } catch {
              const pkg = require('../../../package.json')
              currentVersion = pkg.version ?? '0.0.0'
            }
            return {
              currentVersion,
              version: result.version || '',
              updateAvailable: result.updateAvailable || false,
              error: result.error || '',
            }
          } catch {
            const pkg = require('../../../package.json')
            return {
              currentVersion: pkg.version ?? '0.0.0',
              version: '',
              updateAvailable: false,
              error: 'Failed to check for updates',
            }
          }
        },
        downloadUpdate: async () => {
          latestDownloadStatus = {
            status: 'downloading',
            message: 'Starting download...',
            isComplete: false,
            isError: false,
          }
          Updater.downloadUpdate().catch((err: Error) => {
            latestDownloadStatus = {
              status: 'error',
              message: err?.message || 'Download failed',
              isComplete: false,
              isError: true,
              errorMessage: err?.message,
            }
          })
        },
        getUpdateStatus: () => {
          return latestDownloadStatus
        },
        applyUpdate: async () => {
          await Updater.applyUpdate()
        },

        // Utility commands
        clearAllData: () => {
          const storage = state.getStorage()
          storage.savedQueries.clearAll()
          storage.workspaces.clearAll()
          storage.connections.clearAll()
          storage.queryHistory.clearAll()
        },
        getAppVersion: () => {
          // Read from package.json or electrobun config
          try {
            const pkg = require('../../../package.json')
            return pkg.version ?? '0.0.0'
          } catch {
            return '0.0.0'
          }
        },
        showSaveDialog: async (_params) => {
          // Electrobun has openFileDialog but no native save dialog
          // Use a workaround: prompt for directory + use defaultPath filename
          // For now, return null to indicate no native save dialog
          // The frontend will handle this via browser download fallback
          return null
        },
        writeTextFile: async ({ path, content }) => {
          await Bun.write(path, content)
        },
        closeWindow: () => {
          const win = getWindow()
          if (win) {
            // Persist window state before closing
            try {
              const ws = state.getStorage().windowState
              const maximized = win.isMaximized()
              if (!maximized) {
                const frame = win.getFrame()
                ws.save({ ...frame, isMaximized: false })
              } else {
                const current = ws.get()
                ws.save({ ...current, isMaximized: true })
              }
            } catch {
              // Ignore — storage may already be closed
            }
            win.close()
          }
        },
        minimizeWindow: () => {
          const win = getWindow()
          if (win) win.minimize()
        },
        maximizeWindow: () => {
          const win = getWindow()
          if (win) win.maximize()
        },
        unmaximizeWindow: () => {
          const win = getWindow()
          if (win) win.unmaximize()
        },
        isWindowMaximized: () => {
          const win = getWindow()
          return win ? win.isMaximized() : false
        },
        getWindowFrame: () => {
          const win = getWindow()
          return win ? win.getFrame() : { x: 0, y: 0, width: 0, height: 0 }
        },
        setWindowPosition: ({ x, y }) => {
          const win = getWindow()
          if (win) win.setPosition(x, y)
        },
        openDevToolsWindow: () => {
          let devWindow: BrowserWindow | null = null
          const devRpc = createRpcHandler(state, () => devWindow, baseUrl)
          devWindow = new BrowserWindow({
            title: 'Anko Dev Tools',
            titleBarStyle: 'hiddenInset',
            frame: {
              width: 560,
              height: 700,
              x: 300,
              y: 250,
            },
            renderer: 'cef',
            url: `${baseUrl}#devtools`,
            rpc: devRpc,
          })
        },
      },
      messages: {},
    },
  })
}
