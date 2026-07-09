import { IconArrowLeft, IconCode, IconTable } from '@tabler/icons-react'
import { CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command'
import type { NewTabPageProps } from '../lib'

export function NewTabPage({
  databaseItems,
  tableItems,
  onBack,
  onNewQuery,
  onOpenTable,
}: NewTabPageProps) {
  return (
    <>
      <CommandGroup heading="New Tab">
        <CommandItem value="newtab:back go back" onSelect={onBack}>
          <IconArrowLeft className="size-4 text-muted-foreground" />
          Back
        </CommandItem>
      </CommandGroup>

      {databaseItems.length === 0 && tableItems.length === 0 && (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          No databases loaded. Connect and expand a connection in the sidebar first.
        </div>
      )}

      {/* ── New Query (per database) ──────────────────── */}
      {databaseItems.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="New Query">
            {databaseItems.map((item) => (
              <CommandItem key={item.key} value={item.value} onSelect={() => onNewQuery(item)}>
                <IconCode className="size-4 text-muted-foreground" />
                <span>{item.database}</span>
                <span className="text-muted-foreground truncate">{item.connectionName}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}

      {/* ── Open Table ────────────────────────────────── */}
      {tableItems.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Open Table">
            {tableItems.map((item) => {
              const dbItem = databaseItems.find(
                (d) => d.connectionId === item.connectionId && d.database === item.database,
              ) ?? {
                key: item.key,
                connectionId: item.connectionId,
                runtimeConnectionId: item.runtimeConnectionId,
                connectionName: item.connectionName,
                database: item.database,
                value: '',
              }
              return (
                <CommandItem
                  key={item.key}
                  value={item.value}
                  onSelect={() => onOpenTable(dbItem, item.tableName, item.schema)}
                >
                  <IconTable className="size-4 text-muted-foreground" />
                  <span>{item.tableName}</span>
                  <span className="text-muted-foreground truncate">
                    {item.connectionName} / {item.database}
                    {item.schema && ` / ${item.schema}`}
                  </span>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </>
      )}
    </>
  )
}
