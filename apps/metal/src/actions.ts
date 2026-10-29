/**
 * Side effects behind the store: connectors through `AppState`, persistence
 * through the repository package. Every action dispatches its outcome.
 */

import type { ConnectionConfig, ConnectionInfo, TableInfo } from '@anko/desktop-domain'
import {
  addQueryHistory,
  createSavedQuery,
  deleteConnection,
  deleteSavedQuery,
  listConnections,
  listQueryHistory,
  listSavedQueries,
  saveConnection,
  updateConnection,
} from '@anko/desktop-repository'
import type { AppState } from '@anko/desktop-service'
import type { Action, Store } from './store'

export type Dispatch = (action: Action) => void

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

export function createActions(state: AppState, get: () => Store, dispatch: Dispatch) {
  const refreshLibrary = () => {
    dispatch({ type: 'history', history: listQueryHistory(undefined, 100) })
    dispatch({ type: 'saved', saved: listSavedQueries() })
  }

  async function loadSchema(): Promise<void> {
    const { active } = get()
    if (!active) return
    try {
      const connector = state.getConnection(active.connectionId)
      const databases = await connector.getDatabases()
      const tables: TableInfo[] = []
      for (const database of databases) {
        const schemas = await connector.getSchemas(database.name)
        const names = schemas.length > 0 ? schemas.map((schema) => schema.name) : [database.name]
        for (const schema of names) {
          tables.push(...(await connector.getTables(database.name, schema)))
        }
      }
      dispatch({ type: 'schema', schema: { tables } })
    } catch (error) {
      dispatch({ type: 'schema', schema: { tables: [] } })
      dispatch({ type: 'connectError', error: message(error) })
    }
  }

  async function loadColumns(table: TableInfo): Promise<void> {
    const { active, schema } = get()
    if (!active || schema.columns[table.name]) return
    try {
      const columns = await state
        .getConnection(active.connectionId)
        .getColumns(active.selectedDatabase ?? table.schema, table.schema, table.name)
      dispatch({
        type: 'schema',
        schema: { columns: { ...get().schema.columns, [table.name]: columns } },
      })
    } catch (error) {
      dispatch({ type: 'connectError', error: message(error) })
    }
  }

  return {
    refreshLibrary,
    loadSchema,
    loadColumns,

    async connect(connection: ConnectionInfo): Promise<void> {
      dispatch({ type: 'connectError', error: null })
      dispatch({ type: 'connecting', id: connection.id })
      try {
        const previous = get().active
        if (previous && previous.id !== connection.id) await state.disconnect(previous.connectionId)
        const active = await state.connectSaved(connection.id)
        dispatch({ type: 'active', active })
        await loadSchema()
      } catch (error) {
        dispatch({ type: 'connectError', error: message(error) })
      } finally {
        dispatch({ type: 'connecting', id: null })
      }
    },

    async disconnect(): Promise<void> {
      const { active } = get()
      if (!active) return
      await state.disconnect(active.connectionId)
      dispatch({ type: 'active', active: null })
    },

    async testConnection(config: ConnectionConfig): Promise<string> {
      try {
        await state.testConnection(config)
        return 'Connection successful'
      } catch (error) {
        return message(error)
      }
    },

    async saveConnectionConfig(
      config: ConnectionConfig,
      editing: ConnectionInfo | null,
    ): Promise<void> {
      let saved: ConnectionInfo
      if (editing) {
        updateConnection(editing.id, config)
        saved = { ...editing, ...config, id: editing.id }
      } else {
        saved = saveConnection(config)
      }
      dispatch({ type: 'connections', connections: listConnections() })
      dispatch({ type: 'form', open: false })
      await this.connect(saved)
    },

    async removeConnection(connection: ConnectionInfo): Promise<void> {
      const { active } = get()
      if (active?.id === connection.id) await this.disconnect()
      deleteConnection(connection.id)
      dispatch({ type: 'connections', connections: listConnections() })
    },

    async run(tabId: string, sql: string): Promise<void> {
      const { active } = get()
      const trimmed = sql.trim()
      if (!active || trimmed.length === 0) return
      dispatch({ type: 'tab', id: tabId, patch: { status: 'running', error: undefined } })
      const started = performance.now()
      try {
        const result = await state
          .getConnection(active.connectionId)
          .executeWithContext(trimmed, active.selectedDatabase)
        dispatch({
          type: 'tab',
          id: tabId,
          patch: { status: 'done', result, page: 0, selectedRow: null },
        })
        addQueryHistory({
          query: trimmed,
          connectionId: active.id,
          connectionName: active.info.name,
          databaseName: active.selectedDatabase ?? null,
          executionTimeMs: result.execution_time_ms,
          rowCount: result.rows.length,
          success: true,
          errorMessage: null,
          source: 'ui',
        })
        void loadSchema()
      } catch (error) {
        const text = message(error)
        dispatch({ type: 'tab', id: tabId, patch: { status: 'error', error: text } })
        addQueryHistory({
          query: trimmed,
          connectionId: active.id,
          connectionName: active.info.name,
          databaseName: active.selectedDatabase ?? null,
          executionTimeMs: Math.round(performance.now() - started),
          rowCount: null,
          success: false,
          errorMessage: text,
          source: 'ui',
        })
      }
      refreshLibrary()
    },

    saveQuery(name: string, sql: string): void {
      const { active } = get()
      createSavedQuery({
        name,
        query: sql,
        description: null,
        workspaceId: null,
        connectionId: active?.id ?? null,
        databaseName: active?.selectedDatabase ?? null,
      })
      dispatch({ type: 'savingName', name: null })
      refreshLibrary()
    },

    removeSavedQuery(id: string): void {
      deleteSavedQuery(id)
      refreshLibrary()
    },
  }
}

export type Actions = ReturnType<typeof createActions>
