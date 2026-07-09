import type { UpdateInfo } from '@/lib/updater'

export interface UpdateStore {
  updateAvailable: boolean
  updateInfo: UpdateInfo | null
  update: unknown | null
  isDownloading: boolean
  downloadProgress: number
  downloadTotal: number
  isModalOpen: boolean
  isInstalled: boolean

  setUpdateAvailable: (available: boolean, info: UpdateInfo | null, update: unknown | null) => void
  setDownloading: (downloading: boolean) => void
  setDownloadProgress: (progress: number, total: number) => void
  setModalOpen: (open: boolean) => void
  setInstalled: (installed: boolean) => void
  reset: () => void
}
