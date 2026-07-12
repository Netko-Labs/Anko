import { IconDownload, IconRefresh } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { useUpdateStore } from '@/stores/update'

export function TitleBarUpdateButton() {
  const updateAvailable = useUpdateStore((s) => s.updateAvailable)
  const version = useUpdateStore((s) => s.updateInfo?.version)
  const isInstalled = useUpdateStore((s) => s.isInstalled)

  if (!updateAvailable) return null

  const label = isInstalled
    ? 'Restart to finish updating'
    : `Update available${version ? ` (v${version})` : ''}`

  return (
    <button
      type="button"
      onClick={() => useUpdateStore.getState().setModalOpen(true)}
      title={label}
      aria-label={label}
      className={cn(
        'relative h-7 w-7 inline-flex items-center justify-center rounded-md',
        'text-muted-foreground hover:text-foreground/80',
        'hover:bg-muted/60 active:bg-muted',
        'transition-colors duration-100',
      )}
    >
      {isInstalled ? <IconRefresh className="size-3.5" /> : <IconDownload className="size-3.5" />}
      <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary" aria-hidden />
    </button>
  )
}
