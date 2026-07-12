import type {
  ActiveConnection,
  ColumnDetail,
  DatabaseDriver,
  SchemaInfo,
  TableInfo,
} from '@anko/desktop-domain'

export interface SchemaContext {
  databases: SchemaInfo[]
  tables: Record<string, TableInfo[]> // database -> tables
  columns: Record<string, ColumnDetail[]> // "database.table" -> columns
}

// Keyword categories
export type KeywordCategory = 'DQL' | 'DML' | 'DDL' | 'DCL' | 'TCL' | 'type' | 'clause' | 'operator'

export interface SqlKeyword {
  name: string
  category: KeywordCategory
}

// Function categories
export type FunctionCategory =
  | 'aggregate'
  | 'string'
  | 'numeric'
  | 'date'
  | 'conditional'
  | 'json'
  | 'window'

export interface SqlFunction {
  name: string
  signature: string
  description: string
  category: FunctionCategory
}

// Snippet interface
export interface SqlSnippet {
  label: string
  template: string
  description: string
}

export interface QueryEditorProps {
  tabId: string
  connectionId: string
  connectionInfoId: string
  connectionName: string
  connectionHost: string
  connectionPort: number
  workspaceName?: string
  driver?: DatabaseDriver
  selectedDatabase?: string
  databases?: SchemaInfo[]
  schema?: SchemaContext
  activeConnections?: ActiveConnection[]
  onDatabaseChange?: (database: string) => void
  onConnectionChange?: (connectionInfoId: string) => void
}

export interface SQLEditorProps {
  value: string
  onChange: (value: string) => void
  onExecute?: () => void
  /** Fired with the currently selected text (empty string when nothing selected). */
  onSelectionChange?: (selectedText: string) => void
  driver?: DatabaseDriver
  selectedDatabase?: string
  schema?: SchemaContext
  placeholder?: string
  readOnly?: boolean
}

export interface QueryEditorTabProps {
  tabId: string
}
