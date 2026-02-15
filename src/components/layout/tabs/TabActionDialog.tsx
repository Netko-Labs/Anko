import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDatabaseHierarchyLoader } from '@/hooks/useDatabaseHierarchyLoader'
import { useConnectionStore } from '@/stores/connection'

interface TabActionDialogProps {
  open: boolean
  mode: 'query' | 'table'
  onOpenChange: (open: boolean) => void
}

const TABLE_MODE_LABELS = {
  query: {
    title: 'New Query',
    description: 'Choose a connection and database for the new query tab.',
    action: 'Create Query',
  },
  table: {
    title: 'Open Table',
    description: 'Choose a connection, database, and table to browse.',
    action: 'Open Table',
  },
} as const

export function TabActionDialog({ open, mode, onOpenChange }: TabActionDialogProps) {
  const {
    activeConnections,
    selectedConnectionId,
    setSelectedConnectionId,
    selectedConnection,
    selectedDatabase,
    setSelectedDatabaseState,
    selectedSchema,
    setSelectedSchema,
    selectedTable,
    setSelectedTable,
    databases,
    schemas,
    tables,
    driver,
    isLoadingDatabases,
    isLoadingSchemas,
    isLoadingTables,
  } = useDatabaseHierarchyLoader({ open, mode })

  const canCreateQuery = Boolean(selectedConnection && selectedDatabase)
  const canOpenTable =
    Boolean(selectedConnection && selectedDatabase && selectedTable) &&
    (driver !== 'postgresql' || Boolean(selectedSchema))

  const handleConfirm = () => {
    if (!selectedConnection) return

    const store = useConnectionStore.getState()

    if (mode === 'query') {
      if (!selectedDatabase) return
      store.setSelectedDatabase(selectedConnection.id, selectedDatabase)
      store.addQueryTab({
        id: crypto.randomUUID(),
        connectionId: selectedConnection.id,
        query: '',
        isExecuting: false,
      })
      onOpenChange(false)
      return
    }

    if (!selectedDatabase || !selectedTable) return
    const schema = driver === 'postgresql' ? selectedSchema || undefined : undefined
    store.addTableTab(
      selectedConnection.id,
      selectedConnection.connectionId,
      selectedDatabase,
      schema,
      selectedTable,
    )
    onOpenChange(false)
  }

  const labels = TABLE_MODE_LABELS[mode]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
          <DialogDescription>{labels.description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tab-action-connection">Connection</Label>
            <Select
              value={selectedConnectionId}
              onValueChange={(v) => setSelectedConnectionId(v ?? '')}
            >
              <SelectTrigger id="tab-action-connection" className="h-8">
                <SelectValue>{selectedConnection?.info.name}</SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                {activeConnections.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No active connections
                  </div>
                ) : (
                  activeConnections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id} className="text-xs">
                      {connection.info.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tab-action-database">Database</Label>
            <Select
              value={selectedDatabase}
              onValueChange={(v) => setSelectedDatabaseState(v ?? '')}
              disabled={!selectedConnectionId || isLoadingDatabases}
            >
              <SelectTrigger id="tab-action-database" className="h-8">
                <SelectValue>
                  {selectedDatabase || (
                    <span className="text-muted-foreground">
                      {isLoadingDatabases ? 'Loading...' : 'Select database'}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-zinc-950 border-zinc-800">
                {databases.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    No databases available
                  </div>
                ) : (
                  databases.map((database) => (
                    <SelectItem key={database.name} value={database.name} className="text-xs">
                      {database.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {mode === 'table' && driver === 'postgresql' && (
            <div className="grid gap-2">
              <Label htmlFor="tab-action-schema">Schema</Label>
              <Select
                value={selectedSchema}
                onValueChange={(v) => setSelectedSchema(v ?? '')}
                disabled={!selectedDatabase || isLoadingSchemas}
              >
                <SelectTrigger id="tab-action-schema" className="h-8">
                  <SelectValue>
                    {selectedSchema || (
                      <span className="text-muted-foreground">
                        {isLoadingSchemas ? 'Loading...' : 'Select schema'}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  {schemas.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No schemas available
                    </div>
                  ) : (
                    schemas.map((schema) => (
                      <SelectItem key={schema.name} value={schema.name} className="text-xs">
                        {schema.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {mode === 'table' && (
            <div className="grid gap-2">
              <Label htmlFor="tab-action-table">Table</Label>
              <Select
                value={selectedTable}
                onValueChange={(v) => setSelectedTable(v ?? '')}
                disabled={
                  !selectedDatabase ||
                  isLoadingTables ||
                  (driver === 'postgresql' && !selectedSchema)
                }
              >
                <SelectTrigger id="tab-action-table" className="h-8">
                  <SelectValue>
                    {selectedTable || (
                      <span className="text-muted-foreground">
                        {isLoadingTables ? 'Loading...' : 'Select table'}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800">
                  {tables.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No tables available
                    </div>
                  ) : (
                    tables.map((table) => (
                      <SelectItem key={table.name} value={table.name} className="text-xs">
                        {table.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mode === 'query' ? !canCreateQuery : !canOpenTable}
          >
            {labels.action}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
