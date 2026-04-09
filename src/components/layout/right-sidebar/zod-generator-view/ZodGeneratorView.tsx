import { IconClipboard } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ValidatorLib, VALIDATOR_OPTIONS, generateSchema } from '@/lib/schema-generators'
import type { ZodGeneratorViewProps } from './definitions'

export function ZodGeneratorView({ tableName, columns }: ZodGeneratorViewProps) {
  const [validator, setValidator] = useState<ValidatorLib>('zod')

  const schemaCode = useMemo(
    () => generateSchema(validator, tableName, columns),
    [validator, tableName, columns],
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(schemaCode)
    toast.success('Schema copied to clipboard')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 h-8 border-b border-border">
        <Select value={validator} onValueChange={(v) => setValidator(v as ValidatorLib)}>
          <SelectTrigger className="h-6 w-28 text-[11px] border-0 bg-transparent px-0 shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VALIDATOR_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={handleCopy}
          className="size-5 rounded flex items-center justify-center text-primary/70 hover:text-primary transition-colors"
          title="Copy schema to clipboard"
        >
          <IconClipboard className="size-3.5" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-3 text-[11px] leading-relaxed font-mono text-foreground/90 whitespace-pre overflow-x-auto">
          {schemaCode}
        </pre>
      </ScrollArea>
    </div>
  )
}
