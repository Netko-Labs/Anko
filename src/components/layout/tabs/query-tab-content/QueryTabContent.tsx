import { QueryEditor } from '@/components/editor/query-editor'
import { ResultsFooter } from '@/components/results/results-footer/ResultsFooter'
import { ResultsTable } from '@/components/results/results-table/ResultsTable'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { useConnectionStore } from '@/stores/connection'
import type { QueryTabContentProps } from '../lib'

export function QueryTabContent({ tabId }: QueryTabContentProps) {
  const tab = useConnectionStore((s) => s.queryTabs.find((t) => t.id === tabId))

  if (!tab) return null

  return (
    <div className="flex flex-col h-full">
      <ResizablePanelGroup orientation="vertical" className="flex-1 min-h-0">
        <ResizablePanel defaultSize={40} minSize={10}>
          <QueryEditor tabId={tabId} />
        </ResizablePanel>

        <ResizableHandle className="h-px w-full cursor-row-resize" />

        <ResizablePanel defaultSize={60} minSize={10}>
          <div className="flex flex-col h-full">
            {tab.isStale && tab.result && (
              <div className="flex items-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-muted-foreground">
                <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
                Snapshot from your last session — re-run the query to refresh.
              </div>
            )}
            <div className="flex-1 min-h-0">
              <ResultsTable result={tab.result} error={tab.error} isExecuting={tab.isExecuting} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Footer Status Bar */}
      <ResultsFooter result={tab.result} isExecuting={tab.isExecuting} />
    </div>
  )
}
