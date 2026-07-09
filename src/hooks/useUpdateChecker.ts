import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  checkForUpdate,
  fetchChangelogForVersion,
  isPatchOnlyUpdate,
  isVersionSkipped,
  shouldRemindLater,
} from '@/lib/updater'
import { useUpdateStore } from '@/stores/update'

const UPDATE_CHECK_DELAY = 3000 // 3 seconds after app startup

export function useUpdateChecker() {
  const hasChecked = useRef(false)
  const setUpdateAvailable = useUpdateStore((s) => s.setUpdateAvailable)
  const setModalOpen = useUpdateStore((s) => s.setModalOpen)

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    const timeoutId = setTimeout(async () => {
      const result = await checkForUpdate()
      if (!result.available || !result.info || !result.update) return

      // Fetch changelog from CHANGELOG.md for the new version
      const changelogBody = await fetchChangelogForVersion(result.info.version)
      const enrichedInfo = {
        ...result.info,
        body: changelogBody ?? result.info.body,
      }

      // Always surface availability so the title-bar update button appears;
      // the toast below is the only interrupting surface and stays gated.
      setUpdateAvailable(true, enrichedInfo, result.update)

      // Patch releases stay quiet — the title-bar button is enough.
      if (isPatchOnlyUpdate(result.info.currentVersion, result.info.version)) return
      // Respect "skip this version" and a recent "remind later" for the toast.
      if (isVersionSkipped(result.info.version)) return
      if (shouldRemindLater()) return

      toast('Update Recommended', {
        description: `Version ${result.info.version} is available`,
        duration: 10000,
        action: {
          label: 'View Details',
          onClick: () => setModalOpen(true),
        },
      })
    }, UPDATE_CHECK_DELAY)

    return () => clearTimeout(timeoutId)
  }, [setUpdateAvailable, setModalOpen])
}
