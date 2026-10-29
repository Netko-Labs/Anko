import type {
  ActiveConnectionInfo,
  ConnectionInfo,
  QueryResult,
  TableInfo,
} from '@anko/desktop-domain'
import { listConnections, saveConnection } from '@anko/desktop-repository'
import type { AppState } from '@anko/desktop-service'
import { Text, View } from '@mirinjs/metal'
import { useCallback, useState } from 'react'
import { Editor } from './components/Editor'
import { Results } from './components/Results'
import { Sidebar } from './components/Sidebar'
import { theme } from './theme'

export interface RunState {
  status: 'idle' | 'running' | 'done' | 'error'
  result?: QueryResult
  error?: string
}

export function App({ state }: { state: AppState }) {
  const [connections, setConnections] = useState<ConnectionInfo[]>(() => listConnections())
  const [active, setActive] = useState<ActiveConnectionInfo | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [tables, setTables] = useState<TableInfo[]>([])
  const [sql, setSql] = useState('')
  const [run, setRun] = useState<RunState>({ status: 'idle' })

  const loadTables = useCallback(
    async (info: ActiveConnectionInfo) => {
      try {
        const connector = state.getConnection(info.connectionId)
        const databases = await connector.getDatabases()
        const found: TableInfo[] = []
        for (const database of databases) {
          const schemas = await connector.getSchemas(database.name)
          const names = schemas.length > 0 ? schemas.map((schema) => schema.name) : [database.name]
          for (const schema of names) {
            found.push(...(await connector.getTables(database.name, schema)))
          }
        }
        setTables(found)
      } catch {
        setTables([])
      }
    },
    [state],
  )

  const connect = useCallback(
    async (connection: ConnectionInfo) => {
      setConnectError(null)
      try {
        const info = await state.connectSaved(connection.id)
        setActive(info)
        setRun({ status: 'idle' })
        void loadTables(info)
      } catch (error) {
        setConnectError(error instanceof Error ? error.message : String(error))
      }
    },
    [state, loadTables],
  )

  const addSqlite = useCallback(
    (name: string, path: string) => {
      const saved = saveConnection({
        name,
        host: path,
        port: 0,
        username: '',
        password: '',
        driver: 'sqlite',
      })
      setConnections(listConnections())
      void connect(saved)
    },
    [connect],
  )

  const execute = useCallback(
    async (query: string) => {
      const trimmed = query.trim()
      if (!active || trimmed.length === 0) return
      setRun({ status: 'running' })
      try {
        const result = await state
          .getConnection(active.connectionId)
          .executeWithContext(trimmed, active.selectedDatabase)
        setRun({ status: 'done', result })
        void loadTables(active)
      } catch (error) {
        setRun({ status: 'error', error: error instanceof Error ? error.message : String(error) })
      }
    },
    [active, state, loadTables],
  )

  const browseTable = useCallback(
    (table: TableInfo) => {
      const query = `select * from "${table.name}" limit 100`
      setSql(query)
      void execute(query)
    },
    [execute],
  )

  return (
    <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme.bg }}>
      <TitleBar active={active} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Sidebar
          connections={connections}
          activeId={active?.id ?? null}
          tables={tables}
          error={connectError}
          onConnect={connect}
          onAddSqlite={addSqlite}
          onBrowseTable={browseTable}
        />
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <Editor
            sql={sql}
            canRun={active !== null && run.status !== 'running'}
            onChange={setSql}
            onRun={execute}
          />
          <Results run={run} />
        </View>
      </View>
    </View>
  )
}

function TitleBar({ active }: { active: ActiveConnectionInfo | null }) {
  return (
    <View
      style={{
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.panel,
        borderWidth: 1,
        borderColor: theme.panelBorder,
        flexShrink: 0,
      }}
    >
      <Text style={{ color: theme.muted, fontSize: 12, fontFamily: 'monospace' }}>
        {active ? `● ${active.info.name} / ${active.selectedDatabase ?? 'main'}` : 'Anko · metal'}
      </Text>
    </View>
  )
}
