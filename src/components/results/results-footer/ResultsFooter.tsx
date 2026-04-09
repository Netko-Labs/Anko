import { ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import type { ResultsFooterProps } from '@/components/results/definitions'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportToCSV, exportToJSON, exportToSQL } from '@/lib/export-utils'
import { cn } from '@/lib/utils'

/**
 * Returns performance badge color based on execution time.
 * Green: <100ms, Yellow: 100-500ms, Red: >500ms
 */
function getPerformanceBadgeColor(ms: number): string {
  if (ms < 100)
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
  if (ms < 500) return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
  return 'bg-red-500/15 text-red-700 dark:text-red-300 hover:bg-red-500/25'
}

export function ResultsFooter({ result, isExecuting, tableName }: ResultsFooterProps) {
  const getStatusText = () => {
    if (isExecuting) return 'Executing...'
    if (!result) return 'No Data'
    if (result.columns.length === 0) {
      return result.affected_rows > 0 ? `${result.affected_rows} row(s) affected` : 'Query executed'
    }
    return `${result.rows.length} row(s)`
  }

  const executionTime = result?.execution_time_ms
  const hasData = result && result.columns.length > 0 && result.rows.length > 0
  const defaultFilename = tableName || 'query_results'

  const handleExportCSV = async () => {
    if (!result) return
    try {
      const exported = await exportToCSV(result, defaultFilename)
      if (exported) {
        toast.success('Exported to CSV')
      }
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleExportJSON = async () => {
    if (!result) return
    try {
      const exported = await exportToJSON(result, defaultFilename)
      if (exported) {
        toast.success('Exported to JSON')
      }
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const handleExportSQL = async () => {
    if (!result) return
    try {
      const exported = await exportToSQL(result, tableName || 'table_name', defaultFilename)
      if (exported) {
        toast.success('Exported to SQL')
      }
    } catch (error) {
      toast.error('Export failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-card text-xs">
      {/* Left: Status */}
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{getStatusText()}</span>
        {executionTime !== undefined && (
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] px-1.5 py-0 h-4 font-mono',
              getPerformanceBadgeColor(executionTime),
            )}
          >
            {executionTime}ms
          </Badge>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded transition-colors',
              hasData
                ? 'text-primary/70 hover:text-primary hover:bg-primary/10'
                : 'text-muted-foreground/60 cursor-not-allowed',
            )}
            disabled={!hasData}
            render={<button type="button" />}
          >
            Download
            <ChevronDown className="size-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV} className="text-xs text-foreground/90">
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJSON} className="text-xs text-foreground/90">
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportSQL} className="text-xs text-foreground/90">
              Export as SQL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
