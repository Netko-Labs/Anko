import { app, dialog } from 'mirinjs'
import { rpc } from 'mirinjs/rpc'
import pkg from '../../../package.json'
import type {
  AddQueryHistoryInput,
  ConnectionConfig,
  CreateSavedQueryInput,
  UpdateDownloadStatus,
  UpdateSavedQueryInput,
  WorkspaceConfig,
} from '../../shared/rpc-types'
import { MySqlConnector } from '../db/mysql'
import { PostgresConnector } from '../db/postgres'
import { SqliteConnector } from '../db/sqlite'
import type { AppState } from '../state'
import {
  addQueryHistory,
  addWorkspaceConnection,
  clearConnections,
  clearQueryHistory,
  clearSavedQueries,
  clearWorkspaces,
  createSavedQuery,
  createWorkspace,
  deleteConnection,
  deleteQueryHistory,
  deleteSavedQuery,
  deleteWorkspace,
  getConnectionConfig,
  listConnections,
  listQueryHistory,
  listSavedQueries,
  listWorkspaces,
  moveWorkspaceConnection,
  removeConnectionFromAllWorkspaces,
  removeWorkspaceConnection,
  saveConnection,
  updateConnection,
  updateSavedQuery,
  updateWorkspace,
} from '../storage'

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

/**
 * Anko's RPC surface as a mirin router. The frontend imports only the `Router`
 * type (see src/lib/rpc.ts); handlers run in the Bun worker.
 */
export function createRouter(state: AppState) {
  return rpc.router({
    // ---- Connection commands ----
    connect: rpc.mutation(async ({ config }: { config: ConnectionConfig }) =>
      state.connect(config),
    ),
    disconnect: rpc.mutation(async ({ connectionId }: { connectionId: string }) => {
      await state.disconnect(connectionId)
    }),
    // Let the connector's error propagate (it throws a descriptive AppError).
    // Swallowing it into `false` made every failed test look like a success:
    // the caller (useConnectionForm.handleTest) only treats a *thrown* error as
    // a failure and ignores the return value, so `false` silently showed
    // "Connected". On success we resolve (the `true` is unused but harmless).
    testConnection: rpc.mutation(async ({ config }: { config: ConnectionConfig }) => {
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
    }),

    // ---- Query commands ----
    executeQuery: rpc.mutation(
      async ({
        connectionId,
        query,
        database,
        context,
      }: {
        connectionId: string
        query: string
        database?: string
        context?: string
      }) => {
        const conn = state.getConnection(connectionId)
        return conn.executeWithContext(query, database, context)
      },
    ),

    // ---- Schema commands ----
    getDatabases: rpc.query(async ({ connectionId }: { connectionId: string }) => {
      return state.getConnection(connectionId).getDatabases()
    }),
    getSchemas: rpc.query(
      async ({ connectionId, database }: { connectionId: string; database: string }) => {
        return state.getConnection(connectionId).getSchemas(database)
      },
    ),
    getTables: rpc.query(
      async ({
        connectionId,
        database,
        schema,
      }: {
        connectionId: string
        database: string
        schema: string
      }) => {
        return state.getConnection(connectionId).getTables(database, schema)
      },
    ),
    getColumns: rpc.query(
      async ({
        connectionId,
        database,
        schema,
        table,
      }: {
        connectionId: string
        database: string
        schema: string
        table: string
      }) => {
        return state.getConnection(connectionId).getColumns(database, schema, table)
      },
    ),

    // ---- Connection storage ----
    saveConnection: rpc.mutation(({ config }: { config: ConnectionConfig }) =>
      saveConnection(config),
    ),
    updateConnection: rpc.mutation(({ id, config }: { id: string; config: ConnectionConfig }) => {
      updateConnection(id, config)
    }),
    listConnections: rpc.query(() => listConnections()),
    deleteConnection: rpc.mutation(({ id }: { id: string }) => {
      removeConnectionFromAllWorkspaces(id)
      deleteConnection(id)
    }),
    getConnectionConfig: rpc.query(({ id }: { id: string }) => getConnectionConfig(id)),

    // ---- Workspace commands ----
    listWorkspaces: rpc.query(() => listWorkspaces()),
    createWorkspace: rpc.mutation(({ config }: { config: WorkspaceConfig }) =>
      createWorkspace(config),
    ),
    updateWorkspace: rpc.mutation(({ id, config }: { id: string; config: WorkspaceConfig }) =>
      updateWorkspace(id, config),
    ),
    deleteWorkspace: rpc.mutation(({ id }: { id: string }) => {
      deleteWorkspace(id)
    }),
    addConnectionToWorkspace: rpc.mutation(
      ({ workspaceId, connectionId }: { workspaceId: string; connectionId: string }) => {
        addWorkspaceConnection(workspaceId, connectionId)
      },
    ),
    removeConnectionFromWorkspace: rpc.mutation(
      ({ workspaceId, connectionId }: { workspaceId: string; connectionId: string }) => {
        removeWorkspaceConnection(workspaceId, connectionId)
      },
    ),
    moveConnectionBetweenWorkspaces: rpc.mutation(
      ({
        connectionId,
        fromWorkspaceId,
        toWorkspaceId,
      }: {
        connectionId: string
        fromWorkspaceId: string
        toWorkspaceId: string
      }) => {
        moveWorkspaceConnection(connectionId, fromWorkspaceId, toWorkspaceId)
      },
    ),

    // ---- Query history ----
    addQueryHistory: rpc.mutation(({ input }: { input: AddQueryHistoryInput }) =>
      addQueryHistory(input),
    ),
    listQueryHistory: rpc.query(
      ({ connectionId, limit }: { connectionId?: string; limit?: number }) =>
        listQueryHistory(connectionId, limit),
    ),
    deleteQueryHistory: rpc.mutation(({ id }: { id: string }) => {
      deleteQueryHistory(id)
    }),
    clearQueryHistory: rpc.mutation(() => {
      clearQueryHistory()
    }),

    // ---- Saved queries ----
    createSavedQuery: rpc.mutation(({ input }: { input: CreateSavedQueryInput }) =>
      createSavedQuery(input),
    ),
    listSavedQueries: rpc.query(({ workspaceId }: { workspaceId?: string }) =>
      listSavedQueries(workspaceId),
    ),
    updateSavedQuery: rpc.mutation(({ id, input }: { id: string; input: UpdateSavedQueryInput }) =>
      updateSavedQuery(id, input),
    ),
    deleteSavedQuery: rpc.mutation(({ id }: { id: string }) => {
      deleteSavedQuery(id)
    }),

    // ---- Update commands (mirin app.updater) ----
    checkForUpdate: rpc.query(async () => {
      try {
        const info = await app.updater.checkForUpdate()
        return {
          currentVersion: app.updater.currentVersion || APP_VERSION,
          version: info?.version ?? '',
          updateAvailable: !!info,
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
  })
}

export type Router = ReturnType<typeof createRouter>
