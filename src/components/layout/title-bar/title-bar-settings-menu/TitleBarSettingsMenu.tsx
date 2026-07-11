import {
  IconCode,
  IconDeviceDesktop,
  IconMoon,
  IconRefresh,
  IconSettings,
  IconSun,
} from '@tabler/icons-react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { useTheme } from '@/components/theme/theme-provider'
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
import { openDevToolsWindow } from '@/lib/rpc'
import { resolveToast } from '@/lib/toast-utils'
import { checkForUpdate, fetchChangelogForVersion } from '@/lib/updater'
import { cn } from '@/lib/utils'
import { useUpdateStore } from '@/stores/update'

export function TitleBarSettingsMenu() {
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
          body: result.info.body ?? changelogBody,
        }

        setUpdateAvailable(true, enrichedInfo, result.update)

        resolveToast.success(toastId, 'Update available!', {
          description: `Version ${result.info.version} is ready to download`,
          duration: 10000,
          action: {
            label: 'View Details',
            onClick: () => setModalOpen(true),
          },
        })
      } else {
        resolveToast.success(toastId, "You're up to date!", {
          description: 'No new updates available',
          duration: 3000,
        })
      }
    } catch {
      resolveToast.error(toastId, 'Failed to check for updates', {
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
