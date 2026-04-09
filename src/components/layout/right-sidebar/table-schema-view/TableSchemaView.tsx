import { IconKey, IconTable } from '@tabler/icons-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { ColumnRowProps, TableSchemaViewProps } from './definitions'

export function TableSchemaView({ tableName, columns, database, schema }: TableSchemaViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 h-8 border-b border-border shrink-0">
        <IconTable className="size-3.5 text-primary" />
        <span className="text-[11px] font-medium text-foreground truncate">{tableName}</span>
        <span className="text-[10px] text-muted-foreground truncate ml-auto">
          {database}
          {schema && `.${schema}`}
        </span>
      </div>

      {/* Column list */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {columns.map((col) => (
            <ColumnRow key={col.name} column={col} />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

function ColumnRow({ column }: ColumnRowProps) {
  const isPrimaryKey = column.key === 'PRI' || column.key === 'PRIMARY KEY'
  const isForeignKey = column.key === 'MUL' || column.key === 'FOREIGN KEY'
  const isUniqueKey = column.key === 'UNI' || column.key === 'UNIQUE'

  return (
    <div className="flex items-start gap-2 px-3 py-1.5 hover:bg-primary/5 transition-colors">
      {/* Column name + key icon */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        {isPrimaryKey && <IconKey className="size-3 text-primary shrink-0" />}
        <span
          className={cn(
            'text-xs font-medium truncate',
            isPrimaryKey ? 'text-primary' : 'text-foreground',
            isForeignKey && 'text-blue-400',
            isUniqueKey && 'text-purple-400',
          )}
        >
          {column.name}
        </span>
      </div>

      {/* Type + metadata */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-[10px] text-primary/60 font-mono">{column.data_type}</span>
        {column.nullable && <span className="text-[9px] text-muted-foreground/50">null</span>}
        {column.key && !isPrimaryKey && (
          <span className="text-[9px] px-1 py-px rounded bg-primary/10 text-primary">
            {column.key}
          </span>
        )}
      </div>
    </div>
  )
}
