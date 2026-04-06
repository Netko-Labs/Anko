import { IconClipboard } from '@tabler/icons-react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatValue, isJsonLike, prettyPrintJson } from '@/lib/zod-generator'
import type { CellDetailsProps } from './definitions'

export function CellDetails({ value, columnName, columnType }: CellDetailsProps) {
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

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedValue)
    toast.success('Copied to clipboard')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-8 border-b border-border shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-medium text-foreground truncate">{columnName}</span>
          <span className="text-[10px] text-primary/60 font-mono shrink-0">{columnType}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="size-5 rounded flex items-center justify-center text-primary/70 hover:text-primary transition-colors"
          title="Copy value"
        >
          <IconClipboard className="size-3.5" />
        </button>
      </div>

      {/* Value */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          <div
            className={`text-xs font-mono leading-relaxed ${isNull ? 'text-primary/40 italic' : 'text-foreground/90'} ${
              isJson ? 'text-[11px] whitespace-pre-wrap break-all' : 'whitespace-pre-wrap break-words'
            }`}
          >
            {formattedValue}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
