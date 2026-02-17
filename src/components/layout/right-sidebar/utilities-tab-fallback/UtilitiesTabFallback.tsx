import { RIGHT_SIDEBAR_VALUES } from '../definitions'

export function UtilitiesTabFallback() {
  return (
    <div className="h-full flex items-center justify-center p-4">
      <p className="text-xs text-muted-foreground text-center">{RIGHT_SIDEBAR_VALUES.loadingUtilities}</p>
    </div>
  )
}
