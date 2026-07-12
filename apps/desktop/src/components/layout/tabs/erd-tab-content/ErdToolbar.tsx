import type { ErdLayoutDirection } from '@anko/desktop-domain'
import {
  IconArrowsHorizontal,
  IconArrowsVertical,
  IconCamera,
  IconLayoutGrid,
  IconNote,
  IconRefresh,
  IconTextSize,
} from '@tabler/icons-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface ErdToolbarProps {
  showColumnTypes: boolean
  layoutDirection: ErdLayoutDirection
  hiddenTables: string[]
  isRefreshing: boolean
  isExporting: boolean
  onSetLayout: (dir: ErdLayoutDirection) => void
  onTidyUp: () => void
  onToggleColumnTypes: () => void
  onAddNote: () => void
  onRefresh: () => void
  onUnhideTable: (table: string) => void
  onExportJpeg: () => void
  onExportSvg: () => void
  onCopyImage: () => void
}

const iconBtn =
  'inline-flex items-center justify-center gap-1 h-7 px-2 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0'

export function ErdToolbar(props: ErdToolbarProps) {
  return (
    <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1">
      {/* Layout */}
      <DropdownMenu>
        <DropdownMenuTrigger className={iconBtn} render={<button type="button" />}>
          <IconLayoutGrid className="size-3.5" />
          Layout
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={() => props.onSetLayout('LR')}>
            <IconArrowsHorizontal className="size-4" />
            Left → Right
            {props.layoutDirection === 'LR' && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => props.onSetLayout('TB')}>
            <IconArrowsVertical className="size-4" />
            Top → Bottom
            {props.layoutDirection === 'TB' && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => props.onSetLayout('grid')}>
            <IconLayoutGrid className="size-4" />
            Grid
            {props.layoutDirection === 'grid' && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={props.onTidyUp}>
            <IconRefresh className="size-4" />
            Tidy up
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        type="button"
        className={cn(iconBtn, props.showColumnTypes && 'text-foreground')}
        onClick={props.onToggleColumnTypes}
        title="Toggle column types"
      >
        <IconTextSize className="size-3.5" />
        Types
      </button>

      <button type="button" className={iconBtn} onClick={props.onAddNote} title="Add note">
        <IconNote className="size-3.5" />
        Note
      </button>

      {props.hiddenTables.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger className={iconBtn} render={<button type="button" />}>
            Hidden ({props.hiddenTables.length})
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 overflow-auto">
            {props.hiddenTables.map((t) => (
              <DropdownMenuItem key={t} onClick={() => props.onUnhideTable(t)}>
                Show “{t}”
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          className={iconBtn}
          onClick={props.onRefresh}
          disabled={props.isRefreshing}
          title="Refresh schema"
        >
          <IconRefresh className={cn('size-3.5', props.isRefreshing && 'animate-spin')} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className={iconBtn} render={<button type="button" />}>
            <IconCamera className="size-3.5" />
            Export
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={props.onExportJpeg} disabled={props.isExporting}>
              JPEG image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onExportSvg} disabled={props.isExporting}>
              SVG vector
            </DropdownMenuItem>
            <DropdownMenuItem onClick={props.onCopyImage} disabled={props.isExporting}>
              Copy to clipboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
