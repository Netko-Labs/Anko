import { IconLayoutSidebar, IconLayoutSidebarRight } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getAppVersion } from '@/lib/rpc'
import { type TitleBarProps } from './definitions'

export function TitleBar({ onToggleLeftSidebar, onToggleRightSidebar }: TitleBarProps) {
  const [version, setVersion] = useState<string>('')

  useEffect(() => {
    getAppVersion()
      .then(setVersion)
      .catch(() => setVersion('unknown'))
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 h-9 flex items-center bg-background border-b z-50 select-none">
      {/* Left section - Space for native traffic lights */}
      <div className="flex items-center h-full pl-20 w-20" />

      {/* Center section - Draggable region (only this section triggers JS drag) */}
      <div className="titlebar-drag flex-1 flex items-center justify-center h-full gap-2">
        <span className="text-xs text-muted-foreground">Anko</span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0 h-4 font-normal text-muted-foreground"
        >
          {version ? `v${version}` : ''}
        </Badge>
      </div>

      {/* Right section - Sidebar toggles (outside drag region) */}
      <div className="flex items-center h-full gap-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleLeftSidebar}
          className="h-9 w-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <IconLayoutSidebar className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleRightSidebar}
          className="h-9 w-9 rounded-none text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <IconLayoutSidebarRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
