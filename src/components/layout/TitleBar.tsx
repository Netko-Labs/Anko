import { IconLayoutSidebar, IconLayoutSidebarRight } from '@tabler/icons-react'
import { getVersion } from '@tauri-apps/api/app'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface TitleBarProps {
  onToggleLeftSidebar?: () => void
  onToggleRightSidebar?: () => void
}

export function TitleBar({ onToggleLeftSidebar, onToggleRightSidebar }: TitleBarProps) {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion('unknown'))
  }, [])

  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-10 flex items-center glass border-b border-border/50 z-50 select-none"
    >
      {/* Left section - Space for traffic lights */}
      <div data-tauri-drag-region className="flex items-center h-full pl-20 w-20" />

      {/* Center section - App name with status */}
      <div
        data-tauri-drag-region
        className="flex-1 flex items-center justify-center h-full gap-2.5 pointer-events-none"
      >
        <div className="flex items-center gap-1.5">
          <div className="size-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-medium text-foreground/80 tracking-wide">Anko</span>
        </div>
        <Badge
          variant="secondary"
          className="text-[10px] px-2 py-0.5 h-5 font-medium bg-muted/50 text-muted-foreground border-0"
        >
          {version ? `v${version}` : ''}
        </Badge>
      </div>

      {/* Right section - Sidebar toggles */}
      <div className="flex items-center h-full gap-1 pr-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleLeftSidebar}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
            >
              <IconLayoutSidebar className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Toggle left sidebar</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleRightSidebar}
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
            >
              <IconLayoutSidebarRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Toggle right sidebar</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
