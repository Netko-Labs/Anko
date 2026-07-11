import {
  IconDatabase,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconMinus,
  IconSearch,
  IconSquare,
  IconTable,
  IconX,
} from '@tabler/icons-react'
import { windowControls } from 'mirinjs/client'
import { useMemo, useState } from 'react'
import { CommandMenu } from '@/components/command-menu'
import { hasCustomControls } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connection'
import { useMcpStore } from '@/stores/mcp'
import type { TitleBarProps } from './lib'
import { TitleBarSettingsMenu } from './title-bar-settings-menu/TitleBarSettingsMenu'
import { TitleBarUpdateButton } from './title-bar-update-button/TitleBarUpdateButton'
import { TitleBarWorkspaceSwitcher } from './title-bar-workspace-switcher/TitleBarWorkspaceSwitcher'

export function TitleBar({ onToggleLeftSidebar, onToggleRightSidebar }: TitleBarProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const activeTabId = useConnectionStore((s) => s.activeTabId)
  const queryTabs = useConnectionStore((s) => s.queryTabs)
  const activeConnections = useConnectionStore((s) => s.activeConnections)
  const pendingApprovals = useMcpStore((s) => s.pending.length)

  const context = useMemo(() => {
    if (!activeTabId) return null
    const tab = queryTabs.find((t) => t.id === activeTabId)
    if (!tab) return null

    const connection = activeConnections.find((c) => c.id === tab.connectionId)
    const connectionName = connection?.info.name ?? 'Unknown'
    const driver = connection?.info.driver
    const database = tab.databaseName ?? connection?.selectedDatabase
    const table = tab.tableName
    const schema = tab.schemaName
    const isTableTab = !!table

    return { connectionName, driver, database, table, schema, isTableTab }
  }, [activeTabId, queryTabs, activeConnections])

  return (
    <div className="fixed top-0 left-0 right-0 h-9 flex items-center bg-background border-b border-border/50 z-50 select-none">
      {/* Left section — sidebar toggle + workspace switcher. macOS reserves room
          for the native traffic lights; Windows has none, so start flush. */}
      <div
        className={cn('flex items-center h-full gap-0.5', hasCustomControls ? 'pl-2' : 'pl-19.5')}
      >
        <TitleBarButton onClick={onToggleLeftSidebar} tooltip="Toggle sidebar">
          <IconLayoutSidebar className="size-3.5" />
        </TitleBarButton>
        <TitleBarWorkspaceSwitcher />
      </div>

      {/* Spacer / drag region */}
      <div className="titlebar-drag flex-1 h-full" />

      {/* Right section — search, settings, toggle right sidebar */}
      <div className="flex items-center h-full pr-1.5 gap-0">
        <TitleBarUpdateButton />
        {pendingApprovals > 0 && (
          <span
            className="mx-1 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-amber-500/15 px-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
            title={`${pendingApprovals} MCP approval${pendingApprovals === 1 ? '' : 's'} pending`}
          >
            {pendingApprovals}
          </span>
        )}
        <TitleBarButton onClick={() => setCommandOpen(true)} tooltip="Search (⌘K)">
          <IconSearch className="size-3.5" />
        </TitleBarButton>
        <TitleBarSettingsMenu />
        <TitleBarButton onClick={onToggleRightSidebar} tooltip="Toggle inspector">
          <IconLayoutSidebarRight className="size-3.5" />
        </TitleBarButton>
      </div>

      {/* Windows window controls (Windows has no native caption buttons). */}
      {hasCustomControls && <WindowControls />}

      {/* Center breadcrumb — absolutely positioned for true centering */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {context ? (
          <div className="flex items-center gap-1.5 text-[11px] min-w-0 max-w-[50%]">
            <span
              className="text-muted-foreground flex items-center gap-1 min-w-0 max-w-40"
              title={context.connectionName}
            >
              <DriverDot driver={context.driver} />
              <span className="truncate">{context.connectionName}</span>
            </span>

            {context.database && (
              <>
                <Chevron />
                <span
                  className="text-muted-foreground flex items-center gap-1 min-w-0 max-w-40"
                  title={context.database}
                >
                  <IconDatabase className="size-3 opacity-70 shrink-0" />
                  <span className="truncate">{context.database}</span>
                </span>
              </>
            )}

            {context.schema && (
              <>
                <Chevron />
                <span
                  className="text-muted-foreground min-w-0 max-w-32 truncate"
                  title={context.schema}
                >
                  {context.schema}
                </span>
              </>
            )}

            {context.table && (
              <>
                <Chevron />
                <span className="text-foreground font-medium flex items-center gap-1 truncate">
                  <IconTable className="size-3 opacity-80 shrink-0" />
                  <span className="truncate">{context.table}</span>
                </span>
              </>
            )}

            {!context.isTableTab && (
              <>
                <Chevron />
                <span className="text-muted-foreground/80 italic truncate">query</span>
              </>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/70 tracking-wide">Anko</span>
        )}
      </div>

      <CommandMenu open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  )
}

function TitleBarButton({
  children,
  onClick,
  tooltip,
}: {
  children: React.ReactNode
  onClick?: () => void
  tooltip?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={cn(
        'h-7 w-7 inline-flex items-center justify-center rounded-md',
        'text-muted-foreground hover:text-foreground/80',
        'hover:bg-muted/60 active:bg-muted',
        'transition-colors duration-100',
      )}
    >
      {children}
    </button>
  )
}

function WindowControls() {
  return (
    <div className="flex items-center h-full ml-1">
      <WindowControlButton onClick={() => windowControls.minimize()} label="Minimize">
        <IconMinus className="size-3.5" />
      </WindowControlButton>
      <WindowControlButton onClick={() => windowControls.maximize()} label="Maximize">
        <IconSquare className="size-3" />
      </WindowControlButton>
      <WindowControlButton onClick={() => windowControls.close()} label="Close" danger>
        <IconX className="size-3.5" />
      </WindowControlButton>
    </div>
  )
}

function WindowControlButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  label: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'h-9 w-11 inline-flex items-center justify-center',
        'text-muted-foreground transition-colors duration-100',
        danger ? 'hover:bg-red-600 hover:text-white' : 'hover:bg-muted/70 hover:text-foreground/90',
      )}
    >
      {children}
    </button>
  )
}

function Chevron() {
  return <span className="text-muted-foreground/50 text-[10px] shrink-0 select-none">/</span>
}

function DriverDot({ driver }: { driver?: string }) {
  const color =
    driver === 'mysql'
      ? 'bg-sky-400/80'
      : driver === 'postgresql'
        ? 'bg-indigo-400/80'
        : driver === 'sqlite'
          ? 'bg-emerald-400/80'
          : 'bg-muted-foreground/40'

  return <span className={cn('size-1.5 rounded-full shrink-0', color)} />
}
