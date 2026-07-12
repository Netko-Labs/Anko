import { IconPlus, IconTrash } from '@tabler/icons-react'
import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatErrorMessage } from '@/lib/error-utils'
import { genId } from '@/lib/id'
import { createTable } from '@/lib/rpc'
import {
  CREATE_TABLE_DATA_TYPES,
  type CreateTableColumnInput,
  type CreateTableDriver,
  defaultCreateTableType,
  supportsAutoIncrement,
} from '@/shared/create-table'
import type { ActiveConnection } from '@/types'

interface DraftColumn extends CreateTableColumnInput {
  id: string
}

interface CreateTableDialogProps {
  open: boolean
  connection: ActiveConnection
  database: string
  schema?: string
  onOpenChange(open: boolean): void
  onCreated(tableName: string): void | Promise<void>
}

export function CreateTableDialog({
  open,
  connection,
  database,
  schema,
  onOpenChange,
  onCreated,
}: CreateTableDialogProps) {
  const driver = connection.info.driver as CreateTableDriver
  const [tableName, setTableName] = useState('')
  const [columns, setColumns] = useState<DraftColumn[]>(() => [newColumn(driver, true)])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!open) return
    setTableName('')
    setColumns([newColumn(driver, true)])
  }, [open, driver])

  const validationError = useMemo(() => {
    if (!tableName.trim()) return 'Enter a table name.'
    if (columns.length === 0) return 'Add at least one column.'
    if (columns.some((column) => !column.name.trim())) return 'Every column needs a name.'
    const names = columns.map((column) => column.name.trim().toLocaleLowerCase())
    if (new Set(names).size !== names.length) return 'Column names must be unique.'
    const primaryKeys = columns.filter((column) => column.primaryKey)
    const autoIncrement = columns.filter((column) => column.autoIncrement)
    if (autoIncrement.length > 1) return 'Only one column can use auto increment.'
    if (autoIncrement.length === 1 && primaryKeys.length !== 1) {
      return 'An auto-increment column must be the only primary key.'
    }
    return null
  }, [columns, tableName])

  const updateColumn = (id: string, update: Partial<DraftColumn>) => {
    setColumns((current) =>
      current.map((column) => {
        if (column.id !== id) return column
        const next = { ...column, ...update }
        if (!next.primaryKey) next.autoIncrement = false
        if (next.primaryKey) next.nullable = false
        if (!supportsAutoIncrement(driver, next.dataType)) next.autoIncrement = false
        return next
      }),
    )
  }

  const setPrimaryKey = (id: string, checked: boolean) => {
    setColumns((current) =>
      current.map((column) => {
        if (column.id === id) {
          return {
            ...column,
            primaryKey: checked,
            nullable: checked ? false : column.nullable,
            autoIncrement: checked ? column.autoIncrement : false,
          }
        }
        return checked && column.autoIncrement ? { ...column, autoIncrement: false } : column
      }),
    )
  }

  const setAutoIncrement = (id: string, checked: boolean) => {
    setColumns((current) =>
      current.map((column) =>
        column.id === id
          ? {
              ...column,
              autoIncrement: checked,
              primaryKey: checked || column.primaryKey,
              nullable: checked ? false : column.nullable,
            }
          : checked
            ? { ...column, autoIncrement: false, primaryKey: false }
            : column,
      ),
    )
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (validationError) return
    setIsCreating(true)
    try {
      const result = await createTable({
        connectionId: connection.connectionId,
        database,
        schema,
        tableName,
        columns: columns.map(({ id: _id, ...column }) => column),
      })
      await onCreated(result.tableName)
      toast.success(`Table ${result.tableName} created`)
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to create table', { description: formatErrorMessage(error) })
    } finally {
      setIsCreating(false)
    }
  }

  const location = schema ? `${database} / ${schema}` : database

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Create table</DialogTitle>
            <DialogDescription>
              {connection.info.name} / {location}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="create-table-name">Table name</Label>
            <Input
              id="create-table-name"
              value={tableName}
              onChange={(event) => setTableName(event.target.value)}
              placeholder="users"
              autoFocus
            />
          </div>

          <div className="flex min-h-0 flex-col gap-2">
            <div className="grid grid-cols-[minmax(9rem,1.4fr)_minmax(8rem,1fr)_3.5rem_3rem_3.5rem_2rem] items-center gap-2 px-1 text-[10px] text-muted-foreground">
              <span>Name</span>
              <span>Type</span>
              <span className="text-center">Null</span>
              <span className="text-center">PK</span>
              <span className="text-center">Auto</span>
              <span />
            </div>

            <div className="max-h-72 overflow-y-auto border-y border-border">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="grid grid-cols-[minmax(9rem,1.4fr)_minmax(8rem,1fr)_3.5rem_3rem_3.5rem_2rem] items-center gap-2 border-b border-border/60 px-1 py-1.5 last:border-b-0"
                >
                  <Input
                    value={column.name}
                    onChange={(event) => updateColumn(column.id, { name: event.target.value })}
                    placeholder="column_name"
                    aria-label="Column name"
                  />
                  <Select
                    value={column.dataType}
                    onValueChange={(value) => value && updateColumn(column.id, { dataType: value })}
                  >
                    <SelectTrigger
                      className="w-full"
                      aria-label={`Type for ${column.name || 'column'}`}
                    >
                      <SelectValue>{column.dataType}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CREATE_TABLE_DATA_TYPES[driver].map((dataType) => (
                          <SelectItem key={dataType} value={dataType}>
                            {dataType}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={column.nullable}
                      disabled={column.primaryKey}
                      onCheckedChange={(checked) =>
                        updateColumn(column.id, { nullable: checked === true })
                      }
                      aria-label={`${column.name || 'Column'} nullable`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={column.primaryKey}
                      onCheckedChange={(checked) => setPrimaryKey(column.id, checked === true)}
                      aria-label={`${column.name || 'Column'} primary key`}
                    />
                  </div>
                  <div className="flex justify-center">
                    <Checkbox
                      checked={column.autoIncrement}
                      disabled={!supportsAutoIncrement(driver, column.dataType)}
                      onCheckedChange={(checked) => setAutoIncrement(column.id, checked === true)}
                      aria-label={`${column.name || 'Column'} auto increment`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={columns.length === 1}
                    onClick={() =>
                      setColumns((current) => current.filter((item) => item.id !== column.id))
                    }
                    title="Remove column"
                    aria-label="Remove column"
                  >
                    <IconTrash />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="self-start"
              onClick={() => setColumns((current) => [...current, newColumn(driver)])}
            >
              <IconPlus data-icon="inline-start" />
              Add column
            </Button>
          </div>

          <div className="min-h-4 text-xs text-destructive">
            {tableName.trim() ? validationError : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={Boolean(validationError) || isCreating}>
              {isCreating ? 'Creating...' : 'Create table'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function newColumn(driver: CreateTableDriver, primary = false): DraftColumn {
  return {
    id: genId(),
    name: primary ? 'id' : '',
    dataType: defaultCreateTableType(driver),
    nullable: !primary,
    primaryKey: primary,
    autoIncrement: primary,
  }
}
