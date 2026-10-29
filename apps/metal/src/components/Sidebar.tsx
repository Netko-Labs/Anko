import type { ConnectionInfo, QueryHistoryEntry, SavedQuery, TableInfo } from '@anko/desktop-domain'
import { ScrollView, Text, View } from '@mirinjs/metal'
import type { Actions, Dispatch } from '../actions'
import type { SidebarPanel, Store } from '../store'
import { theme } from '../theme'
import { ConnectionForm } from './ConnectionForm'
import { Button, Empty, IconButton, SectionHeader } from './ui'

interface SidebarProps {
  store: Store
  actions: Actions
  dispatch: Dispatch
  onOpenQuery: (sql: string, title?: string) => void
}

const PANELS: { id: SidebarPanel; glyph: string }[] = [
  { id: 'connections', glyph: '◫' },
  { id: 'saved', glyph: '☆' },
  { id: 'history', glyph: '↺' },
]

export function Sidebar({ store, actions, dispatch, onOpenQuery }: SidebarProps) {
  return (
    <View
      style={{
        width: 280,
        flexDirection: 'column',
        backgroundColor: theme.panel,
        borderWidth: 1,
        borderColor: theme.panelBorder,
        flexShrink: 0,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: theme.panelBorder,
        }}
      >
        {PANELS.map((panel) => (
          <IconButton
            key={panel.id}
            glyph={panel.glyph}
            active={store.panel === panel.id}
            onPress={() => dispatch({ type: 'panel', panel: panel.id })}
            testID={`panel:${panel.id}`}
          />
        ))}
      </View>
      {store.panel === 'connections' ? (
        <ConnectionsPanel
          store={store}
          actions={actions}
          dispatch={dispatch}
          onOpenQuery={onOpenQuery}
        />
      ) : store.panel === 'saved' ? (
        <SavedPanel saved={store.saved} actions={actions} onOpenQuery={onOpenQuery} />
      ) : (
        <HistoryPanel history={store.history} onOpenQuery={onOpenQuery} />
      )}
    </View>
  )
}

function ConnectionsPanel({ store, actions, dispatch, onOpenQuery }: SidebarProps) {
  if (store.formOpen) {
    return (
      <ScrollView style={{ flex: 1 }}>
        <ConnectionForm
          editing={store.editing}
          onTest={actions.testConnection}
          onSave={(config) => actions.saveConnectionConfig(config, store.editing)}
          onCancel={() => dispatch({ type: 'form', open: false })}
        />
      </ScrollView>
    )
  }
  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <SectionHeader
        right={
          <IconButton
            glyph="+"
            onPress={() => dispatch({ type: 'form', open: true })}
            testID="new-connection"
          />
        }
      >
        CONNECTIONS
      </SectionHeader>
      <ScrollView style={{ flex: 1, paddingHorizontal: 8, gap: 2 }}>
        {store.connections.length === 0 ? <Empty>No connections yet</Empty> : null}
        {store.connections.map((connection) => (
          <ConnectionRow
            key={connection.id}
            connection={connection}
            active={store.active?.id === connection.id}
            connecting={store.connecting === connection.id}
            onPress={() => actions.connect(connection)}
            onEdit={() => dispatch({ type: 'form', open: true, editing: connection })}
            onDelete={() => actions.removeConnection(connection)}
          />
        ))}
        {store.active ? (
          <SchemaTree
            tables={store.schema.tables}
            expanded={store.schema.expanded}
            columns={store.schema.columns}
            onToggle={(table) => {
              dispatch({ type: 'toggleTable', table: table.name })
              void actions.loadColumns(table)
            }}
            onBrowse={(table) => onOpenQuery(`select * from "${table.name}" limit 100`, table.name)}
          />
        ) : null}
      </ScrollView>
      {store.connectError ? (
        <View style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: theme.error, fontSize: 11 }}>{store.connectError}</Text>
        </View>
      ) : null}
      {store.active ? (
        <View style={{ padding: 10, borderWidth: 1, borderColor: theme.panelBorder }}>
          <Button
            label="Disconnect"
            onPress={() => actions.disconnect()}
            small
            testID="disconnect"
          />
        </View>
      ) : null}
    </View>
  )
}

function ConnectionRow({
  connection,
  active,
  connecting,
  onPress,
  onEdit,
  onDelete,
}: {
  connection: ConnectionInfo
  active: boolean
  connecting: boolean
  onPress: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const dot = active ? theme.success : connecting ? theme.accent : theme.faint
  return (
    <View
      onPress={onPress}
      testID={`connection:${connection.name}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 6,
        backgroundColor: active ? theme.raised : undefined,
        hoverBackgroundColor: theme.hover,
      }}
    >
      <Text style={{ color: dot, fontSize: 10 }}>●</Text>
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <Text numberOfLines={1} style={{ color: theme.text, fontSize: 13, fontWeight: 'medium' }}>
          {connection.name}
        </Text>
        <Text
          numberOfLines={1}
          style={{ color: theme.muted, fontSize: 11, fontFamily: 'monospace' }}
        >
          {connection.driver === 'sqlite'
            ? connection.host
            : `${connection.driver}://${connection.host}:${connection.port}`}
        </Text>
      </View>
      <IconButton glyph="✎" onPress={onEdit} testID={`edit:${connection.name}`} />
      <IconButton glyph="✕" onPress={onDelete} testID={`delete:${connection.name}`} />
    </View>
  )
}

function SchemaTree({
  tables,
  expanded,
  columns,
  onToggle,
  onBrowse,
}: {
  tables: TableInfo[]
  expanded: Record<string, boolean>
  columns: Store['schema']['columns']
  onToggle: (table: TableInfo) => void
  onBrowse: (table: TableInfo) => void
}) {
  return (
    <View style={{ flexDirection: 'column', gap: 1, paddingVertical: 10 }}>
      <View style={{ paddingHorizontal: 6, paddingVertical: 6 }}>
        <Text style={{ color: theme.muted, fontSize: 11, fontWeight: 'semibold' }}>
          {`TABLES (${tables.length})`}
        </Text>
      </View>
      {tables.length === 0 ? <Empty>No tables</Empty> : null}
      {tables.map((table) => {
        const open = expanded[table.name] === true
        return (
          <View key={`${table.schema}.${table.name}`} style={{ flexDirection: 'column' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 6,
                hoverBackgroundColor: theme.hover,
              }}
            >
              <IconButton
                glyph={open ? '▾' : '▸'}
                onPress={() => onToggle(table)}
                testID={`expand:${table.name}`}
              />
              <View
                onPress={() => onBrowse(table)}
                testID={`table:${table.name}`}
                style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center' }}
              >
                <Text style={{ color: theme.accent, fontSize: 11 }}>▦</Text>
                <Text
                  numberOfLines={1}
                  style={{ color: theme.text, fontSize: 12, fontFamily: 'monospace' }}
                >
                  {table.name}
                </Text>
                {table.table_type === 'VIEW' ? (
                  <Text style={{ color: theme.faint, fontSize: 10 }}>view</Text>
                ) : null}
              </View>
            </View>
            {open
              ? (columns[table.name] ?? []).map((column) => (
                  <View
                    key={column.name}
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      paddingVertical: 2,
                      paddingHorizontal: 40,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.text, fontSize: 11, fontFamily: 'monospace' }}
                    >
                      {column.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ color: theme.faint, fontSize: 10, fontFamily: 'monospace' }}
                    >
                      {`${column.data_type}${column.nullable ? '' : ' not null'}${column.key ? ` ${column.key}` : ''}`}
                    </Text>
                  </View>
                ))
              : null}
          </View>
        )
      })}
    </View>
  )
}

function SavedPanel({
  saved,
  actions,
  onOpenQuery,
}: {
  saved: SavedQuery[]
  actions: Actions
  onOpenQuery: (sql: string, title?: string) => void
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <SectionHeader>SAVED QUERIES</SectionHeader>
      <ScrollView style={{ flex: 1, paddingHorizontal: 8, gap: 2 }}>
        {saved.length === 0 ? <Empty>No saved queries</Empty> : null}
        {saved.map((entry) => (
          <View
            key={entry.id}
            onPress={() => onOpenQuery(entry.query, entry.name)}
            testID={`saved:${entry.name}`}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 10,
              paddingVertical: 7,
              borderRadius: 6,
              hoverBackgroundColor: theme.hover,
            }}
          >
            <View style={{ flex: 1, flexDirection: 'column' }}>
              <Text
                numberOfLines={1}
                style={{ color: theme.text, fontSize: 12, fontWeight: 'medium' }}
              >
                {entry.name}
              </Text>
              <Text
                numberOfLines={1}
                style={{ color: theme.muted, fontSize: 11, fontFamily: 'monospace' }}
              >
                {entry.query}
              </Text>
            </View>
            <IconButton
              glyph="✕"
              onPress={() => actions.removeSavedQuery(entry.id)}
              testID={`delete-saved:${entry.name}`}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function HistoryPanel({
  history,
  onOpenQuery,
}: {
  history: QueryHistoryEntry[]
  onOpenQuery: (sql: string, title?: string) => void
}) {
  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <SectionHeader>HISTORY</SectionHeader>
      <ScrollView style={{ flex: 1, paddingHorizontal: 8, gap: 2 }}>
        {history.length === 0 ? <Empty>No queries yet</Empty> : null}
        {history.map((entry) => (
          <View
            key={entry.id}
            onPress={() => onOpenQuery(entry.query)}
            testID={`history:${entry.id}`}
            style={{
              flexDirection: 'column',
              gap: 2,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              hoverBackgroundColor: theme.hover,
            }}
          >
            <Text
              numberOfLines={1}
              style={{ color: theme.text, fontSize: 11, fontFamily: 'monospace' }}
            >
              {entry.query}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: entry.success ? theme.muted : theme.error, fontSize: 10 }}
            >
              {`${entry.connectionName} · ${entry.success ? `${entry.rowCount ?? 0} rows` : 'failed'} · ${entry.executedAt.slice(11, 19)}`}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
