export interface UpdateCheckResult {
  currentVersion: string
  version: string
  updateAvailable: boolean
  body?: string
  date?: string
  error: string
}

export interface UpdateDownloadStatus {
  status: string
  message: string
  progress?: number
  bytesDownloaded?: number
  totalBytes?: number
  isComplete: boolean
  isError: boolean
  errorMessage?: string
}
