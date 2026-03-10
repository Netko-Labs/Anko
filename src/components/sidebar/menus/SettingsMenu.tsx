import {
  IconCode,
  IconDeviceDesktop,
  IconMoon,
  IconRefresh,
  IconSettings,
  IconSun,
} from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
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
import { checkForUpdate, fetchChangelogForVersion } from '@/lib/updater'
import { cn } from '@/lib/utils'
import { useUpdateStore } from '@/stores/update'
import { DevToolsDialog } from '../dialogs/DevToolsDialog'
import type { SettingsMenuProps } from './definitions'

export function SettingsMenu({ theme, onThemeChange }: SettingsMenuProps) {
  const [devToolsOpen, setDevToolsOpen] = useState(false)
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
    <>
      <div className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex size-8 items-center justify-center rounded-md transition-colors',
              'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            )}
          >
            <IconSettings className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" sideOffset={8}>
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
                <DropdownMenuItem onClick={() => onThemeChange('light')}>
                  <IconSun className="size-4 mr-2" />
                  Light
                  {theme === 'light' && (
                    <span className="ml-auto text-xs text-muted-foreground">Active</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onThemeChange('dark')}>
                  <IconMoon className="size-4 mr-2" />
                  Dark
                  {theme === 'dark' && (
                    <span className="ml-auto text-xs text-muted-foreground">Active</span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onThemeChange('system')}>
                  <IconDeviceDesktop className="size-4 mr-2" />
                  System
                  {theme === 'system' && (
                    <span className="ml-auto text-xs text-muted-foreground">Active</span>
                  )}
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            {import.meta.env.DEV && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDevToolsOpen(true)}>
                  <IconCode className="size-4 mr-2" />
                  Dev Tools
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCheckForUpdates}>
              <IconRefresh className="size-4 mr-2" />
              Check for updates
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DevToolsDialog open={devToolsOpen} onOpenChange={setDevToolsOpen} />
    </>
  )
}
