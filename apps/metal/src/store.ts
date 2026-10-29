/**
 * App state for the Metal shell. One reducer-backed store keeps the shell
 * predictable; side effects (connectors, storage) live in `actions.ts`.
 */

import type {
  ActiveConnectionInfo,
  ColumnDetail,
  ConnectionInfo,
  QueryHistoryEntry,
  QueryResult,
  SavedQuery,
  TableInfo,
} from '@anko/desktop-domain'
import { useReducer } from 'react'

export type SidebarPanel = 'connections' | 'saved' | 'history'

export interface QueryTab {
  id: string
  title: string
  sql: string
  status: 'idle' | 'running' | 'done' | 'error'
  result?: QueryResult
  error?: string
  page: number
  selectedRow: number | null
}

export interface SchemaState {
  tables: TableInfo[]
  columns: Record<string, ColumnDetail[]>
  expanded: Record<string, boolean>
}

export interface Store {
  connections: ConnectionInfo[]
  active: ActiveConnectionInfo | null
  connecting: string | null
  connectError: string | null
  schema: SchemaState
  panel: SidebarPanel
  formOpen: boolean
  editing: ConnectionInfo | null
  tabs: QueryTab[]
  activeTabId: string
  history: QueryHistoryEntry[]
  saved: SavedQuery[]
  detailsOpen: boolean
  savingName: string | null
}

export type Action =
  | { type: 'connections'; connections: ConnectionInfo[] }
  | { type: 'connecting'; id: string | null }
  | { type: 'active'; active: ActiveConnectionInfo | null }
  | { type: 'connectError'; error: string | null }
  | { type: 'schema'; schema: Partial<SchemaState> }
  | { type: 'toggleTable'; table: string }
  | { type: 'panel'; panel: SidebarPanel }
  | { type: 'form'; open: boolean; editing?: ConnectionInfo | null }
  | { type: 'newTab'; sql?: string; title?: string }
  | { type: 'closeTab'; id: string }
  | { type: 'selectTab'; id: string }
  | { type: 'tab'; id: string; patch: Partial<QueryTab> }
  | { type: 'history'; history: QueryHistoryEntry[] }
  | { type: 'saved'; saved: SavedQuery[] }
  | { type: 'details'; open: boolean }
  | { type: 'savingName'; name: string | null }

let nextTab = 1

export function newTab(sql = '', title?: string): QueryTab {
  const id = `tab-${nextTab++}`
  return {
    id,
    title: title ?? `Query #${nextTab - 1}`,
    sql,
    status: 'idle',
    page: 0,
    selectedRow: null,
  }
}

export function initialStore(connections: ConnectionInfo[]): Store {
  const first = newTab()
  return {
    connections,
    active: null,
    connecting: null,
    connectError: null,
    schema: { tables: [], columns: {}, expanded: {} },
    panel: 'connections',
    formOpen: false,
    editing: null,
    tabs: [first],
    activeTabId: first.id,
    history: [],
    saved: [],
    detailsOpen: false,
    savingName: null,
  }
}

export function reduce(store: Store, action: Action): Store {
  switch (action.type) {
    case 'connections':
      return { ...store, connections: action.connections }
    case 'connecting':
      return { ...store, connecting: action.id }
    case 'active':
      return {
        ...store,
        active: action.active,
        schema: action.active ? store.schema : { tables: [], columns: {}, expanded: {} },
      }
    case 'connectError':
      return { ...store, connectError: action.error }
    case 'schema':
      return { ...store, schema: { ...store.schema, ...action.schema } }
    case 'toggleTable':
      return {
        ...store,
        schema: {
          ...store.schema,
          expanded: {
            ...store.schema.expanded,
            [action.table]: !store.schema.expanded[action.table],
          },
        },
      }
    case 'panel':
      return { ...store, panel: action.panel }
    case 'form':
      return { ...store, formOpen: action.open, editing: action.editing ?? null }
    case 'newTab': {
      const tab = newTab(action.sql, action.title)
      return { ...store, tabs: [...store.tabs, tab], activeTabId: tab.id }
    }
    case 'closeTab': {
      const remaining = store.tabs.filter((tab) => tab.id !== action.id)
      if (remaining.length === 0) {
        const tab = newTab()
        return { ...store, tabs: [tab], activeTabId: tab.id }
      }
      const activeTabId =
        store.activeTabId === action.id
          ? (remaining.at(-1)?.id ?? remaining[0].id)
          : store.activeTabId
      return { ...store, tabs: remaining, activeTabId }
    }
    case 'selectTab':
      return { ...store, activeTabId: action.id }
    case 'tab':
      return {
        ...store,
        tabs: store.tabs.map((tab) => (tab.id === action.id ? { ...tab, ...action.patch } : tab)),
      }
    case 'history':
      return { ...store, history: action.history }
    case 'saved':
      return { ...store, saved: action.saved }
    case 'details':
      return { ...store, detailsOpen: action.open }
    case 'savingName':
      return { ...store, savingName: action.name }
  }
}

export function useStore(connections: ConnectionInfo[]): [Store, (action: Action) => void] {
  return useReducer(reduce, connections, initialStore)
}

export function activeTab(store: Store): QueryTab {
  return store.tabs.find((tab) => tab.id === store.activeTabId) ?? store.tabs[0]
}
