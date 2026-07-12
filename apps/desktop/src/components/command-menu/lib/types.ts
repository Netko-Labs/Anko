import type { ActiveConnection, ConnectionInfo } from '@/types'

export type Page = 'main' | 'new-tab'

export interface CommandMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface CommandTabItem {
  id: string
  label: string
  isTable: boolean
  connectionName: string
  database?: string
  isActive: boolean
  value: string
}

export interface CommandTableItem {
  key: string
  connectionId: string
  runtimeConnectionId: string
  connectionName: string
  database: string
  schema?: string
  tableName: string
  value: string
}

export interface CommandDatabaseItem {
  key: string
  connectionId: string
  runtimeConnectionId: string
  connectionName: string
  database: string
  value: string
}

export interface CommandSavedQueryItem {
  id: string
  name: string
  query: string
  connectionId: string | null
  preview: string
  value: string
}

export interface CommandHistoryItem {
  id: string
  query: string
  connectionId: string
  connectionName: string
  databaseName: string | null
  executionTimeMs: number | null
  success: boolean
  preview: string
  value: string
}

export type CommandActiveConnItem = ActiveConnection & { value: string }
export type CommandSavedConnItem = ConnectionInfo & { value: string }

export interface CommandItems {
  tabItems: CommandTabItem[]
  activeItems: CommandActiveConnItem[]
  disconnectedItems: CommandSavedConnItem[]
  tableItems: CommandTableItem[]
  newTabDatabaseItems: CommandDatabaseItem[]
  newTabTableItems: CommandTableItem[]
  savedQueryItems: CommandSavedQueryItem[]
  historyItems: CommandHistoryItem[]
}

export interface CommandActions {
  handleConnect: (info: ConnectionInfo) => void
  handleOpenQuery: (query: string, label: string, connectionId?: string | null) => void
  handleOpenTable: (item: CommandTableItem) => void
  handleNewTabQuery: (item: CommandDatabaseItem) => void
  handleNewTabTable: (dbItem: CommandDatabaseItem, tableName: string, schema?: string) => void
}

export interface MainPageProps {
  tabItems: CommandTabItem[]
  activeItems: CommandActiveConnItem[]
  disconnectedItems: CommandSavedConnItem[]
  tableItems: CommandTableItem[]
  savedQueryItems: CommandSavedQueryItem[]
  historyItems: CommandHistoryItem[]
  theme: string
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setActiveTabId: (id: string) => void
  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  runAndClose: (fn: () => void) => void
  onOpenChange: (open: boolean) => void
  onConnect: (info: ConnectionInfo) => void
  onOpenQuery: (query: string, label: string, connectionId?: string | null) => void
  onOpenTable: (item: CommandTableItem) => void
  onNavigateNewTab: () => void
}

export interface NewTabPageProps {
  databaseItems: CommandDatabaseItem[]
  tableItems: CommandTableItem[]
  onBack: () => void
  onNewQuery: (item: CommandDatabaseItem) => void
  onOpenTable: (dbItem: CommandDatabaseItem, tableName: string, schema?: string) => void
}
