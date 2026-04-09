import {
  IconChevronDown,
  IconCode,
  IconDatabase,
  IconDeviceDesktop,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconMoon,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconSettings,
  IconSun,
  IconTable,
} from '@tabler/icons-react'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CommandMenu } from '@/components/command-menu/CommandMenu'
import { WorkspaceIcon } from '@/components/sidebar/menus/workspace-icon/WorkspaceIcon'
import { useTheme } from '@/components/theme/ThemeProvider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { WorkspaceDialog } from '@/components/workspace/WorkspaceDialog'
import { listWorkspaces, openDevToolsWindow } from '@/lib/rpc'
import { checkForUpdate, fetchChangelogForVersion } from '@/lib/updater'
import { cn } from '@/lib/utils'
import { useConnectionStore } from '@/stores/connection'
import { useUpdateStore } from '@/stores/update'
import { useWorkspaceStore } from '@/stores/workspace'
import type { Workspace } from '@/types'
import type { TitleBarProps } from './definitions'

export function TitleBar({ onToggleLeftSidebar, onToggleRightSidebar }: TitleBarProps) {
  const [commandOpen, setCommandOpen] = useState(false)
  const activeTabId = useConnectionStore((s) => s.activeTabId)
  const queryTabs = useConnectionStore((s) => s.queryTabs)
  const activeConnections = useConnectionStore((s) => s.activeConnections)

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
      {/* Left section — sidebar toggle + workspace switcher */}
      <div className="flex items-center h-full pl-19.5 gap-0.5">
        <TitleBarButton onClick={onToggleLeftSidebar} tooltip="Toggle sidebar">
          <IconLayoutSidebar className="size-3.5" />
        </TitleBarButton>
        <TitleBarWorkspaceSwitcher />
      </div>

      {/* Spacer / drag region */}
      <div className="titlebar-drag flex-1 h-full" />

      {/* Right section — search, settings, toggle right sidebar */}
      <div className="flex items-center h-full pr-1.5 gap-0">
        <TitleBarButton onClick={() => setCommandOpen(true)} tooltip="Search (⌘K)">
          <IconSearch className="size-3.5" />
        </TitleBarButton>
        <TitleBarSettingsMenu />
        <TitleBarButton onClick={onToggleRightSidebar} tooltip="Toggle inspector">
          <IconLayoutSidebarRight className="size-3.5" />
        </TitleBarButton>
      </div>

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

function TitleBarSettingsMenu() {
  const { theme, setTheme } = useTheme()
  const setUpdateAvailable = useUpdateStore((s) => s.setUpdateAvailable)
  const setModalOpen = useUpdateStore((s) => s.setModalOpen)

  const handleCheckForUpdates = useCallback(async () => {
    const toastId = toast.loading('Checking for updates...')

    try {
      const result = await checkForUpdate()

      if (result.available && result.info) {
        const changelogBody = await fetchChangelogForVersion(result.info.version)
        const enrichedInfo = {
          ...result.info,
          body: changelogBody ?? result.info.body,
        }

        setUpdateAvailable(true, enrichedInfo, result.update)

        toast.success('Update available!', {
          id: toastId,
          description: `Version ${result.info.version} is ready to download`,
          duration: 10000,
          action: {
            label: 'View Details',
            onClick: () => setModalOpen(true),
          },
        })
      } else {
        toast.success("You're up to date!", {
          id: toastId,
          description: 'No new updates available',
          duration: 3000,
        })
      }
    } catch {
      toast.error('Failed to check for updates', {
        id: toastId,
        duration: 5000,
      })
    }
  }, [setUpdateAvailable, setModalOpen])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'h-7 w-7 inline-flex items-center justify-center rounded-md',
          'text-muted-foreground hover:text-foreground/80',
          'hover:bg-muted/60 active:bg-muted',
          'transition-colors duration-100 outline-none',
        )}
      >
        <IconSettings className="size-3.5" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={4} className="min-w-44 z-100">
        <DropdownMenuItem onClick={() => toast.info('Settings coming soon')}>
          <IconSettings className="size-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === 'dark' ? (
              <IconMoon className="size-4 mr-2" />
            ) : theme === 'light' ? (
              <IconSun className="size-4 mr-2" />
            ) : (
              <IconDeviceDesktop className="size-4 mr-2" />
            )}
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <IconSun className="size-4 mr-2" />
              Light
              {theme === 'light' && (
                <span className="ml-auto text-xs text-muted-foreground">Active</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <IconMoon className="size-4 mr-2" />
              Dark
              {theme === 'dark' && (
                <span className="ml-auto text-xs text-muted-foreground">Active</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <IconDeviceDesktop className="size-4 mr-2" />
              System
              {theme === 'system' && (
                <span className="ml-auto text-xs text-muted-foreground">Active</span>
              )}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleCheckForUpdates}>
          <IconRefresh className="size-4 mr-2" />
          Check for updates
        </DropdownMenuItem>
        {import.meta.env.DEV && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openDevToolsWindow()}>
              <IconCode className="size-4 mr-2" />
              Dev Tools
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function TitleBarWorkspaceSwitcher() {
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace)
  const setWorkspaces = useWorkspaceStore((s) => s.setWorkspaces)

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editWorkspace, setEditWorkspace] = useState<Workspace | undefined>()

  const handleNewWorkspace = () => {
    setEditWorkspace(undefined)
    setDialogOpen(true)
  }

  const handleDialogChange = async (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      try {
        const ws = await listWorkspaces()
        setWorkspaces(ws)
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            'h-7 px-2 inline-flex items-center gap-1.5 rounded-md',
            'text-muted-foreground hover:text-foreground/80',
            'hover:bg-muted/60 active:bg-muted',
            'transition-colors duration-100 outline-none',
            'text-[11px] w-32',
          )}
        >
          {activeWorkspace ? (
            <WorkspaceIcon icon={activeWorkspace.icon} className="size-3.5 shrink-0" />
          ) : (
            <IconDatabase className="size-3.5 shrink-0" />
          )}
          <span className="truncate flex-1 text-left">
            {activeWorkspace?.name ?? 'All Connections'}
          </span>
          <IconChevronDown className="size-2.5 opacity-70 shrink-0" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" sideOffset={4} className="min-w-48 z-100">
          {workspaces.map((workspace) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => setActiveWorkspace(workspace.id)}
              className="gap-2"
            >
              <div className="flex size-5 items-center justify-center rounded border text-xs shrink-0">
                <WorkspaceIcon icon={workspace.icon} className="size-3" />
              </div>
              <span className="flex-1 truncate text-xs">{workspace.name}</span>
              {workspace.id === activeWorkspaceId && (
                <span className="text-[10px] text-primary shrink-0">Active</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleNewWorkspace}>
            <IconPlus className="size-4 mr-2" />
            New Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WorkspaceDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        editWorkspace={editWorkspace}
      />
    </>
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
