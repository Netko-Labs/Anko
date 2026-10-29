import type { ConnectionInfo, TableInfo } from '@anko/desktop-domain'
import { ScrollView, Text, TextInput, View } from '@mirinjs/metal'
import { useState } from 'react'
import { theme } from '../theme'

interface SidebarProps {
  connections: ConnectionInfo[]
  activeId: string | null
  tables: TableInfo[]
  error: string | null
  onConnect: (connection: ConnectionInfo) => void
  onAddSqlite: (name: string, path: string) => void
  onBrowseTable: (table: TableInfo) => void
}

export function Sidebar({
  connections,
  activeId,
  tables,
  error,
  onConnect,
  onAddSqlite,
  onBrowseTable,
}: SidebarProps) {
  return (
    <View
      style={{
        width: 260,
        flexDirection: 'column',
        backgroundColor: theme.panel,
        borderWidth: 1,
        borderColor: theme.panelBorder,
        flexShrink: 0,
      }}
    >
      <View style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <Text style={{ color: theme.muted, fontSize: 11, fontWeight: 'semibold' }}>
          CONNECTIONS
        </Text>
      </View>
      <ScrollView style={{ flex: 1, paddingHorizontal: 8, gap: 2 }}>
        {connections.length === 0 ? (
          <View style={{ padding: 12, alignItems: 'center' }}>
            <Text style={{ color: theme.faint, fontSize: 13 }}>No connections yet</Text>
          </View>
        ) : (
          connections.map((connection) => (
            <ConnectionRow
              key={connection.id}
              connection={connection}
              active={connection.id === activeId}
              onPress={() => onConnect(connection)}
            />
          ))
        )}
        {activeId !== null ? <TableList tables={tables} onBrowse={onBrowseTable} /> : null}
      </ScrollView>
      {error ? (
        <View style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
          <Text style={{ color: theme.error, fontSize: 12 }}>{error}</Text>
        </View>
      ) : null}
      <AddSqlite onAdd={onAddSqlite} />
    </View>
  )
}

function ConnectionRow({
  connection,
  active,
  onPress,
}: {
  connection: ConnectionInfo
  active: boolean
  onPress: () => void
}) {
  return (
    <View
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: 6,
        backgroundColor: active ? theme.raised : undefined,
        hoverBackgroundColor: theme.hover,
      }}
    >
      <Text style={{ color: active ? theme.success : theme.faint, fontSize: 10 }}>●</Text>
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
    </View>
  )
}

function TableList({
  tables,
  onBrowse,
}: {
  tables: TableInfo[]
  onBrowse: (table: TableInfo) => void
}) {
  return (
    <View style={{ flexDirection: 'column', gap: 2, paddingVertical: 10 }}>
      <View style={{ paddingHorizontal: 6, paddingVertical: 6 }}>
        <Text style={{ color: theme.muted, fontSize: 11, fontWeight: 'semibold' }}>
          {`TABLES (${tables.length})`}
        </Text>
      </View>
      {tables.length === 0 ? (
        <View style={{ paddingHorizontal: 10 }}>
          <Text style={{ color: theme.faint, fontSize: 12 }}>No tables</Text>
        </View>
      ) : (
        tables.map((table) => (
          <View
            key={`${table.schema}.${table.name}`}
            onPress={() => onBrowse(table)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 6,
              hoverBackgroundColor: theme.hover,
            }}
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
        ))
      )}
    </View>
  )
}

function AddSqlite({ onAdd }: { onAdd: (name: string, path: string) => void }) {
  const [name, setName] = useState('')
  const [path, setPath] = useState('')
  const ready = name.trim().length > 0 && path.trim().length > 0
  const submit = () => {
    if (!ready) return
    onAdd(name.trim(), path.trim())
    setName('')
    setPath('')
  }
  const field = {
    color: theme.text,
    placeholderColor: theme.faint,
    backgroundColor: theme.input,
    borderColor: theme.panelBorder,
    focusBorderColor: theme.accent,
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
  } as const
  return (
    <View
      style={{
        flexDirection: 'column',
        gap: 6,
        padding: 10,
        borderWidth: 1,
        borderColor: theme.panelBorder,
      }}
    >
      <Text style={{ color: theme.muted, fontSize: 11, fontWeight: 'semibold' }}>NEW SQLITE</Text>
      <TextInput value={name} placeholder="Name" onChangeText={setName} style={field} />
      <TextInput
        value={path}
        placeholder="/path/to/database.db or :memory:"
        onChangeText={setPath}
        onSubmitEditing={submit}
        style={{ ...field, fontFamily: 'monospace' }}
      />
      <View
        onPress={submit}
        style={{
          alignItems: 'center',
          paddingVertical: 7,
          borderRadius: 6,
          backgroundColor: ready ? theme.accent : theme.raised,
        }}
      >
        <Text
          style={{
            color: ready ? theme.accentText : theme.faint,
            fontSize: 12,
            fontWeight: 'semibold',
          }}
        >
          Save & connect
        </Text>
      </View>
    </View>
  )
}
