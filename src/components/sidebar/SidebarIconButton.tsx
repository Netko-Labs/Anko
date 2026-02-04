import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SidebarIconButtonProps {
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
  isActive?: boolean
  onClick?: () => void
}

export function SidebarIconButton({
  icon: Icon,
  tooltip,
  isActive,
  onClick,
}: SidebarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        onClick={onClick}
        className={cn(
          'flex size-9 items-center justify-center rounded-lg transition-all duration-200',
          isActive
            ? 'bg-primary/15 text-primary shadow-sm border border-primary/20'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <Icon className={cn('size-4 transition-transform duration-200', isActive && 'scale-110')} />
      </TooltipTrigger>
      <TooltipContent side="right" className="font-medium">{tooltip}</TooltipContent>
    </Tooltip>
  )
}
