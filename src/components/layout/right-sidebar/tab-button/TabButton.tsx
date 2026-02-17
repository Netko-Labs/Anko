import { cn } from '@/lib/utils'
import type { TabButtonProps } from '../definitions'

export function TabButton({ active, onClick, disabled, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors',
        active ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}
