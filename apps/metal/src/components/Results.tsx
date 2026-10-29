import type { QueryResult } from '@anko/desktop-domain'
import { ScrollView, Text, View } from '@mirinjs/metal'
import type { QueryTab } from '../store'
import { theme } from '../theme'
import { Button, IconButton, SectionHeader } from './ui'

const PAGE_SIZE = 100
const CELL_WIDTH = 180

interface ResultsProps {
  tab: QueryTab
  detailsOpen: boolean
  onPage: (page: number) => void
  onSelectRow: (row: number | null) => void
  onToggleDetails: () => void
}

export function Results({ tab, detailsOpen, onPage, onSelectRow, onToggleDetails }: ResultsProps) {
  const result = tab.status === 'done' ? tab.result : undefined
  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View
        style={{
          flex: 1,
          flexDirection: 'column',
          borderWidth: 1,
          borderColor: theme.panelBorder,
          backgroundColor: theme.bg,
        }}
      >
        {result && result.columns.length > 0 ? (
          <Table
            result={result}
            page={tab.page}
            selectedRow={tab.selectedRow}
            onSelectRow={onSelectRow}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Text
              style={{ color: tab.status === 'error' ? theme.error : theme.faint, fontSize: 13 }}
            >
              {tab.status === 'error'
                ? (tab.error ?? 'Query failed')
                : tab.status === 'running'
                  ? 'Running…'
                  : result
                    ? `${result.affected_rows} row(s) affected`
                    : 'No Data'}
            </Text>
          </View>
        )}
        <Footer
          tab={tab}
          onPage={onPage}
          detailsOpen={detailsOpen}
          onToggleDetails={onToggleDetails}
        />
      </View>
      {detailsOpen ? <Details result={result} row={tab.selectedRow} /> : null}
    </View>
  )
}

function Table({
  result,
  page,
  selectedRow,
  onSelectRow,
}: {
  result: QueryResult
  page: number
  selectedRow: number | null
  onSelectRow: (row: number | null) => void
}) {
  const start = page * PAGE_SIZE
  const rows = result.rows.slice(start, start + PAGE_SIZE)
  return (
    <ScrollView style={{ flex: 1, flexDirection: 'column', overflow: 'scroll-both' }}>
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
      {rows.map((row, offset) => {
        const index = start + offset
        const selected = selectedRow === index
        return (
          <View
            key={index}
            onPress={() => onSelectRow(selected ? null : index)}
            testID={`row:${index}`}
            style={{
              flexDirection: 'row',
              flexShrink: 0,
              borderWidth: 1,
              borderColor: theme.panelBorder,
              backgroundColor: selected ? '#2a1420' : undefined,
              hoverBackgroundColor: selected ? undefined : theme.hover,
            }}
          >
            <Cell width={56} text={String(index + 1)} muted />
            {row.map((value, column) => (
              <Cell key={column} width={CELL_WIDTH} text={formatCell(value)} />
            ))}
          </View>
        )
      })}
    </ScrollView>
  )
}

function Cell({ width, text, muted = false }: { width: number; text: string; muted?: boolean }) {
  return (
    <View style={{ width, padding: 10 }}>
      <Text
        numberOfLines={1}
        style={{
          color: muted ? theme.faint : text === 'NULL' ? theme.faint : theme.text,
          fontSize: 12,
          fontFamily: 'monospace',
        }}
      >
        {text}
      </Text>
    </View>
  )
}

function Footer({
  tab,
  onPage,
  detailsOpen,
  onToggleDetails,
}: {
  tab: QueryTab
  onPage: (page: number) => void
  detailsOpen: boolean
  onToggleDetails: () => void
}) {
  const result = tab.status === 'done' ? tab.result : undefined
  const pages = result ? Math.max(1, Math.ceil(result.rows.length / PAGE_SIZE)) : 1
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.panel,
        borderWidth: 1,
        borderColor: theme.panelBorder,
        flexShrink: 0,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Text style={{ color: theme.muted, fontSize: 12, fontFamily: 'monospace' }}>
          {result ? `${result.rows.length} row(s)` : '—'}
        </Text>
        {result ? (
          <Text style={{ color: theme.success, fontSize: 11, fontFamily: 'monospace' }}>
            {`${result.execution_time_ms}ms`}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {pages > 1 ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Button
              label="‹"
              small
              onPress={() => onPage(Math.max(0, tab.page - 1))}
              disabled={tab.page === 0}
              testID="page-prev"
            />
            <Text style={{ color: theme.muted, fontSize: 11, fontFamily: 'monospace' }}>
              {`${tab.page + 1} / ${pages}`}
            </Text>
            <Button
              label="›"
              small
              onPress={() => onPage(Math.min(pages - 1, tab.page + 1))}
              disabled={tab.page >= pages - 1}
              testID="page-next"
            />
          </View>
        ) : null}
        <IconButton
          glyph="▥"
          active={detailsOpen}
          onPress={onToggleDetails}
          testID="toggle-details"
        />
      </View>
    </View>
  )
}

function Details({ result, row }: { result: QueryResult | undefined; row: number | null }) {
  const values = result && row !== null ? result.rows[row] : undefined
  return (
    <View
      style={{
        width: 300,
        flexDirection: 'column',
        backgroundColor: theme.panel,
        borderWidth: 1,
        borderColor: theme.panelBorder,
        flexShrink: 0,
      }}
    >
      <SectionHeader>DETAILS</SectionHeader>
      {result && values ? (
        <ScrollView style={{ flex: 1, paddingHorizontal: 12, gap: 8 }}>
          {result.columns.map((column, index) => (
            <View key={column.name} style={{ flexDirection: 'column', gap: 2 }}>
              <Text style={{ color: theme.muted, fontSize: 10, fontFamily: 'monospace' }}>
                {`${column.name} · ${column.data_type}`}
              </Text>
              <Text style={{ color: theme.text, fontSize: 12, fontFamily: 'monospace' }}>
                {formatCell(values[index])}
              </Text>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={{ color: theme.faint, fontSize: 12 }}>Select a row to view details</Text>
        </View>
      )}
    </View>
  )
}

export function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
