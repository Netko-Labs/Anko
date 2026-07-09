import {
  IconCheck,
  IconClock,
  IconCode,
  IconDatabase,
  IconDeviceDesktop,
  IconLayoutSidebar,
  IconLayoutSidebarRight,
  IconMoon,
  IconPlug,
  IconPlugConnected,
  IconPlus,
  IconSun,
  IconTable,
  IconX,
} from '@tabler/icons-react'
import {
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { MainPageProps } from '../lib'

export function MainPage({
  tabItems,
  activeItems,
  disconnectedItems,
  tableItems,
  savedQueryItems,
  historyItems,
  theme,
  setTheme,
  setActiveTabId,
  toggleLeftSidebar,
  toggleRightSidebar,
  runAndClose,
  onOpenChange,
  onConnect,
  onOpenQuery,
  onOpenTable,
  onNavigateNewTab,
}: MainPageProps) {
  return (
    <>
      {/* ── Open Tabs ─────────────────────────────────── */}
      {tabItems.length > 0 && (
        <CommandGroup heading="Open Tabs">
          {tabItems.map((tab) => (
            <CommandItem
              key={tab.id}
              value={tab.value}
              onSelect={() => runAndClose(() => setActiveTabId(tab.id))}
            >
              {tab.isTable ? (
                <IconTable className="size-4 text-muted-foreground" />
              ) : (
                <IconDatabase className="size-4 text-muted-foreground" />
              )}
              <span className={cn(tab.isActive && 'font-medium')}>{tab.label}</span>
              <span className="text-muted-foreground truncate">
                {tab.connectionName}
                {tab.database && ` / ${tab.database}`}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      )}

      {/* ── Connections ────────────────────────────────── */}
      {(activeItems.length > 0 || disconnectedItems.length > 0) && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Connections">
            {activeItems.map((conn) => (
              <CommandItem key={conn.id} value={conn.value} onSelect={() => onOpenChange(false)}>
                <IconPlugConnected className="size-4 text-green-500" />
                <span>{conn.info.name}</span>
                <span className="text-muted-foreground truncate">
                  {conn.info.host}:{conn.info.port}
                </span>
                <CommandShortcut className="text-green-500/80">Connected</CommandShortcut>
              </CommandItem>
            ))}
            {disconnectedItems.map((conn) => (
              <CommandItem key={conn.id} value={conn.value} onSelect={() => onConnect(conn)}>
                <IconPlug className="size-4 text-muted-foreground" />
                <span>{conn.name}</span>
                <span className="text-muted-foreground truncate">
                  {conn.host}:{conn.port}
                </span>
                <CommandShortcut>Connect</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}

      {/* ── Tables ─────────────────────────────────────── */}
      {tableItems.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Tables">
            {tableItems.map((item) => (
              <CommandItem key={item.key} value={item.value} onSelect={() => onOpenTable(item)}>
                <IconTable className="size-4 text-muted-foreground" />
                <span>{item.tableName}</span>
                <span className="text-muted-foreground truncate">
                  {item.connectionName} / {item.database}
                  {item.schema && ` / ${item.schema}`}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}

      {/* ── Saved Queries ──────────────────────────────── */}
      {savedQueryItems.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Saved Queries">
            {savedQueryItems.map((q) => (
              <CommandItem
                key={q.id}
                value={q.value}
                onSelect={() => onOpenQuery(q.query, q.name, q.connectionId)}
              >
                <IconCode className="size-4 text-primary/70" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">{q.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono truncate">
                    {q.preview}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}

      {/* ── History ────────────────────────────────────── */}
      {historyItems.length > 0 && (
        <>
          <CommandSeparator />
          <CommandGroup heading="Recent History">
            {historyItems.map((entry) => (
              <CommandItem
                key={entry.id}
                value={entry.value}
                onSelect={() => onOpenQuery(entry.query, 'History query', entry.connectionId)}
              >
                {entry.success ? (
                  <IconCheck className="size-4 text-green-500" />
                ) : (
                  <IconX className="size-4 text-destructive" />
                )}
                <div className="flex flex-col min-w-0">
                  <span className="font-mono truncate text-[11px]">{entry.preview}</span>
                  <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <IconClock className="size-2.5" />
                    {entry.connectionName}
                    {entry.databaseName && ` / ${entry.databaseName}`}
                    {entry.executionTimeMs != null && ` · ${entry.executionTimeMs}ms`}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </>
      )}

      <CommandSeparator />

      {/* ── Actions ────────────────────────────────────── */}
      <CommandGroup heading="Actions">
        <CommandItem value="action:new tab query table" onSelect={onNavigateNewTab}>
          <IconPlus className="size-4 text-muted-foreground" />
          New Tab
          <CommandShortcut>⌘T</CommandShortcut>
        </CommandItem>
        <CommandItem
          value="action:toggle left sidebar"
          onSelect={() => runAndClose(toggleLeftSidebar)}
        >
          <IconLayoutSidebar className="size-4 text-muted-foreground" />
          Toggle Left Sidebar
          <CommandShortcut>⌘B</CommandShortcut>
        </CommandItem>
        <CommandItem
          value="action:toggle right sidebar inspector"
          onSelect={() => runAndClose(toggleRightSidebar)}
        >
          <IconLayoutSidebarRight className="size-4 text-muted-foreground" />
          Toggle Right Sidebar
          <CommandShortcut>⌘⇧B</CommandShortcut>
        </CommandItem>
      </CommandGroup>

      <CommandSeparator />

      {/* ── Theme ──────────────────────────────────────── */}
      <CommandGroup heading="Theme">
        <CommandItem
          value="theme:light"
          data-checked={theme === 'light' || undefined}
          onSelect={() => runAndClose(() => setTheme('light'))}
        >
          <IconSun className="size-4 text-muted-foreground" />
          Light
        </CommandItem>
        <CommandItem
          value="theme:dark"
          data-checked={theme === 'dark' || undefined}
          onSelect={() => runAndClose(() => setTheme('dark'))}
        >
          <IconMoon className="size-4 text-muted-foreground" />
          Dark
        </CommandItem>
        <CommandItem
          value="theme:system auto"
          data-checked={theme === 'system' || undefined}
          onSelect={() => runAndClose(() => setTheme('system'))}
        >
          <IconDeviceDesktop className="size-4 text-muted-foreground" />
          System
        </CommandItem>
      </CommandGroup>
    </>
  )
}
