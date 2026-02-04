import { ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TreeNodeProps {
  label: string
  secondaryLabel?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  isExpanded?: boolean
  isExpandable?: boolean
  isLoading?: boolean
  isActive?: boolean
  level?: number
  onClick?: () => void
  onDoubleClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  children?: React.ReactNode
  className?: string
}

export function TreeNode({
  label,
  secondaryLabel,
  icon,
  rightIcon,
  isExpanded = false,
  isExpandable = false,
  isLoading = false,
  isActive = false,
  level = 0,
  onClick,
  onDoubleClick,
  onContextMenu,
  children,
  className,
}: TreeNodeProps) {
  const paddingLeft = level * 12 + 8

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={onContextMenu}
        className={cn(
          'w-full flex items-center gap-2 py-1 pr-2 text-left text-xs rounded-lg transition-all duration-200 group',
          'hover:bg-accent/50',
          isActive && 'bg-primary/10 text-foreground border-l-2 border-primary',
        )}
        style={{ paddingLeft }}
      >
        {/* Expand/Collapse chevron */}
        {isExpandable ? (
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
            {isLoading ? (
              <Loader2 className="size-3 animate-spin text-primary" />
            ) : (
              <ChevronRight
                className={cn(
                  'size-3.5 text-muted-foreground transition-transform duration-200',
                  isExpanded && 'rotate-90 text-foreground',
                )}
              />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}

        {/* Icon */}
        {icon && <span className="flex-shrink-0 transition-transform duration-200 group-hover:scale-110">{icon}</span>}

        {/* Label */}
        <span className="flex-1 truncate font-medium">{label}</span>

        {/* Secondary label */}
        {secondaryLabel && (
          <span className="text-[10px] text-muted-foreground/60 tabular-nums font-normal">
            {secondaryLabel}
          </span>
        )}

        {/* Right icon (e.g., status indicator) */}
        {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>

      {/* Children (expanded content) */}
      {isExpanded && children && (
        <div className="relative animate-fade-in">
          {/* Vertical line indicator */}
          <div
            className="absolute top-0 bottom-0 w-px bg-border/50"
            style={{ left: paddingLeft + 8 }}
          />
          {children}
        </div>
      )}
    </div>
  )
}
