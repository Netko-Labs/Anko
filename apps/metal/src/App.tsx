import { listConnections } from '@anko/desktop-repository'
import type { AppState } from '@anko/desktop-service'
import { Text, View } from '@mirinjs/metal'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createActions } from './actions'
import { Editor } from './components/Editor'
import { Results } from './components/Results'
import { Sidebar } from './components/Sidebar'
import { Tabs } from './components/Tabs'
import { activeTab, type Store, useStore } from './store'
import { theme } from './theme'

export function App({ state }: { state: AppState }) {
  const [store, dispatch] = useStore(listConnections())
  const latest = useRef<Store>(store)
  latest.current = store
  const actions = useMemo(
    () => createActions(state, () => latest.current, dispatch),
    [state, dispatch],
  )

  useEffect(() => {
    actions.refreshLibrary()
  }, [actions])

  const tab = activeTab(store)
  const canRun = store.active !== null && tab.status !== 'running'

  const openQuery = useCallback(
    (sql: string, title?: string) => {
      dispatch({ type: 'newTab', sql, title })
    },
    [dispatch],
  )

  const connectionLabel = store.active
    ? `● ${store.active.info.name} / ${store.active.selectedDatabase ?? 'main'}`
    : null

  return (
    <View style={{ flex: 1, flexDirection: 'column', backgroundColor: theme.bg }}>
      <TitleBar label={connectionLabel} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Sidebar store={store} actions={actions} dispatch={dispatch} onOpenQuery={openQuery} />
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <Tabs
            tabs={store.tabs}
            activeId={store.activeTabId}
            onSelect={(id) => dispatch({ type: 'selectTab', id })}
            onClose={(id) => dispatch({ type: 'closeTab', id })}
            onNew={() => dispatch({ type: 'newTab' })}
          />
          <Editor
            tab={tab}
            connectionLabel={connectionLabel}
            canRun={canRun}
            savingName={store.savingName}
            onChange={(sql) => dispatch({ type: 'tab', id: tab.id, patch: { sql } })}
            onRun={(sql) => {
              dispatch({ type: 'tab', id: tab.id, patch: { sql } })
              void actions.run(tab.id, sql)
            }}
            onStartSave={() => dispatch({ type: 'savingName', name: '' })}
            onSavingName={(name) => dispatch({ type: 'savingName', name })}
            onSave={(name) => actions.saveQuery(name, tab.sql)}
          />
          <Results
            tab={tab}
            detailsOpen={store.detailsOpen}
            onPage={(page) => dispatch({ type: 'tab', id: tab.id, patch: { page } })}
            onSelectRow={(row) => {
              dispatch({ type: 'tab', id: tab.id, patch: { selectedRow: row } })
              if (row !== null && !store.detailsOpen) dispatch({ type: 'details', open: true })
            }}
            onToggleDetails={() => dispatch({ type: 'details', open: !store.detailsOpen })}
          />
        </View>
      </View>
    </View>
  )
}

function TitleBar({ label }: { label: string | null }) {
  return (
    <View
      style={{
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.panel,
        borderWidth: 1,
        borderColor: theme.panelBorder,
        flexShrink: 0,
      }}
    >
      <Text style={{ color: theme.muted, fontSize: 12, fontFamily: 'monospace' }}>
        {label ?? 'Anko · metal'}
      </Text>
    </View>
  )
}
