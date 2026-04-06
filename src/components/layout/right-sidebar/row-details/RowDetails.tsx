import { IconChevronDown, IconChevronRight, IconClipboard } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { formatValue, isJsonLike, prettyPrintJson } from '@/lib/zod-generator'
import type { FieldRowProps, RowDetailsProps } from './definitions'

export function RowDetails({ row, columns }: RowDetailsProps) {
  const handleCopyValue = (value: unknown) => {
    navigator.clipboard.writeText(formatValue(value))
    toast.success('Copied to clipboard')
  }

  const handleCopyRow = () => {
    navigator.clipboard.writeText(JSON.stringify(row, null, 2))
    toast.success('Row copied to clipboard')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-3 h-8 border-b border-border shrink-0">
        <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Row Details</span>
        <button
          type="button"
          onClick={handleCopyRow}
          className="size-5 rounded flex items-center justify-center text-primary/70 hover:text-primary transition-colors"
          title="Copy entire row as JSON"
        >
          <IconClipboard className="size-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="py-1">
          {columns.map((col) => (
            <FieldRow
              key={col.name}
              column={col}
              value={row[col.name]}
              onCopy={() => handleCopyValue(row[col.name])}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function FieldRow({ column, value, onCopy }: FieldRowProps) {
  const [isOpen, setIsOpen] = useState(true)

  const formattedValue = useMemo(() => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'

    const strValue = formatValue(value)

    if (isJsonLike(strValue)) {
      return prettyPrintJson(strValue)
    }

    return strValue
  }, [value])

  const isNull = value === null || value === undefined
  const isJson = isJsonLike(formattedValue)
  const isLongValue = formattedValue.length > 50 || formattedValue.includes('\n')

  // Short values — inline display
  if (!isLongValue) {
    return (
      <div className="group/field hover:bg-primary/5 transition-colors">
        <div className="flex items-center justify-between w-full px-3 py-1.5">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-xs font-medium text-foreground truncate">{column.name}</span>
            <span className="text-[10px] text-primary/50 font-mono shrink-0">{column.data_type}</span>
            {column.key && (
              <span className="text-[9px] px-1 py-px rounded bg-primary/10 text-primary shrink-0">
                {column.key}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="invisible group-hover/field:visible size-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary transition-all shrink-0"
            title="Copy value"
          >
            <IconClipboard className="size-3" />
          </button>
        </div>
        <div className={`px-3 pb-1.5 text-xs font-mono ${isNull ? 'text-primary/40 italic' : 'text-foreground/80'}`}>
          {formattedValue}
        </div>
      </div>
    )
  }

  // Long values — collapsible
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="group/field hover:bg-primary/5 transition-colors">
        <div className="flex items-center justify-between w-full px-3 py-1.5">
          <CollapsibleTrigger className="flex items-center gap-1.5 min-w-0 flex-1 text-left">
            {isOpen ? (
              <IconChevronDown className="size-3 text-primary/60 shrink-0" />
            ) : (
              <IconChevronRight className="size-3 text-muted-foreground shrink-0" />
            )}
            <span className="text-xs font-medium text-foreground truncate">{column.name}</span>
            <span className="text-[10px] text-primary/50 font-mono shrink-0">{column.data_type}</span>
            {column.key && (
              <span className="text-[9px] px-1 py-px rounded bg-primary/10 text-primary shrink-0">
                {column.key}
              </span>
            )}
          </CollapsibleTrigger>
          <button
            type="button"
            onClick={onCopy}
            className="invisible group-hover/field:visible size-5 rounded flex items-center justify-center text-muted-foreground hover:text-primary transition-all shrink-0"
            title="Copy value"
          >
            <IconClipboard className="size-3" />
          </button>
        </div>

        {/* Collapsed preview */}
        {!isOpen && (
          <div className="px-3 pb-1.5 pl-7 text-[10px] text-muted-foreground truncate font-mono">
            {formattedValue.split('\n')[0].slice(0, 40)}
            {formattedValue.length > 40 && '...'}
          </div>
        )}

        {/* Full content */}
        <CollapsibleContent>
          <div
            className={`px-3 pb-1.5 pl-7 text-xs font-mono ${isNull ? 'text-primary/40 italic' : 'text-foreground/80'} ${
              isJson ? 'text-[10px] whitespace-pre-wrap break-all' : ''
            }`}
          >
            {formattedValue}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
