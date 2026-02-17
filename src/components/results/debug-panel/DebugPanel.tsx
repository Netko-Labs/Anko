import { Bug, ChevronDown, ChevronRight } from 'lucide-react'
import { memo, useState } from 'react'
import type { DebugPanelProps } from '@/components/results/definitions'

export const DebugPanel = memo(function DebugPanel({
  originalQuery,
  executedQuery,
}: DebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!originalQuery && !executedQuery) return null

  const hasQueryDiff = originalQuery !== executedQuery

  return (
    <div className="border-b border-border">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
      >
        {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        <Bug className="size-3" />
        <span>Debug Info</span>
        {hasQueryDiff && (
          <span className="ml-1 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded text-[10px]">
            Query Modified
          </span>
        )}
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {originalQuery && (
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Original Query (Frontend)
              </div>
              <pre className="text-xs font-mono text-foreground/85 bg-muted/40 p-2 rounded border border-border whitespace-pre-wrap overflow-x-auto">
                {originalQuery}
              </pre>
            </div>
          )}
          {executedQuery && (
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Executed Query (Backend)
              </div>
              <pre className="text-xs font-mono text-foreground/85 bg-muted/40 p-2 rounded border border-border whitespace-pre-wrap overflow-x-auto">
                {executedQuery}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
})
