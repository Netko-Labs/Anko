import type { QueryResult } from '@anko/desktop-domain'
import { ScrollView, Text, View } from '@mirinjs/metal'
import type { RunState } from '../App'
import { theme } from '../theme'

const MAX_ROWS = 200
const CELL_WIDTH = 180

export function Results({ run }: { run: RunState }) {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        borderWidth: 1,
        borderColor: theme.panelBorder,
        backgroundColor: theme.bg,
      }}
    >
      {run.status === 'done' && run.result ? (
        <Table result={run.result} />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: run.status === 'error' ? theme.error : theme.faint, fontSize: 13 }}>
            {run.status === 'error'
              ? (run.error ?? 'Query failed')
              : run.status === 'running'
                ? 'Running…'
                : 'No Data'}
          </Text>
        </View>
      )}
      <Footer run={run} />
    </View>
  )
}

function Table({ result }: { result: QueryResult }) {
  const rows = result.rows.slice(0, MAX_ROWS)
  return (
    <ScrollView style={{ flex: 1, flexDirection: 'column' }}>
      <View style={{ flexDirection: 'row', backgroundColor: theme.panel, flexShrink: 0 }}>
        <Cell width={56} text="#" muted />
        {result.columns.map((column) => (
          <View
            key={column.name}
            style={{
              width: CELL_WIDTH,
              flexDirection: 'row',
              gap: 6,
              padding: 10,
              alignItems: 'flex-end',
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: theme.text,
                fontSize: 12,
                fontWeight: 'semibold',
                fontFamily: 'monospace',
              }}
            >
              {column.name}
            </Text>
            <Text
              numberOfLines={1}
              style={{ color: theme.accent, fontSize: 10, fontFamily: 'monospace' }}
            >
              {column.data_type}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            flexShrink: 0,
            borderWidth: 1,
            borderColor: theme.panelBorder,
            hoverBackgroundColor: theme.hover,
          }}
        >
          <Cell width={56} text={String(index + 1)} muted />
          {row.map((value, column) => (
            <Cell key={column} width={CELL_WIDTH} text={formatCell(value)} />
          ))}
        </View>
      ))}
    </ScrollView>
  )
}

function Cell({ width, text, muted = false }: { width: number; text: string; muted?: boolean }) {
  return (
    <View style={{ width, padding: 10 }}>
      <Text
        numberOfLines={1}
        style={{ color: muted ? theme.faint : theme.text, fontSize: 12, fontFamily: 'monospace' }}
      >
        {text}
      </Text>
    </View>
  )
}

function Footer({ run }: { run: RunState }) {
  const result = run.status === 'done' ? run.result : undefined
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: theme.panel,
        borderWidth: 1,
        borderColor: theme.panelBorder,
        flexShrink: 0,
      }}
    >
      <Text style={{ color: theme.muted, fontSize: 12, fontFamily: 'monospace' }}>
        {result
          ? `${result.rows.length} row(s)${result.rows.length > MAX_ROWS ? ` (showing ${MAX_ROWS})` : ''}`
          : '—'}
      </Text>
      {result ? (
        <Text style={{ color: theme.success, fontSize: 11, fontFamily: 'monospace' }}>
          {`${result.execution_time_ms}ms`}
        </Text>
      ) : null}
    </View>
  )
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
