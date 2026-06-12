import { toast, type ExternalToast } from 'sonner'

/** Default auto-dismiss duration when resolving a loading toast (ms). */
const TOAST_DURATION = 4000

/**
 * Ensures a minimum display time for toast notifications to prevent visual glitches
 * when operations complete very quickly.
 *
 * @param startTime - The timestamp when the operation started (from Date.now())
 * @param minDuration - Minimum duration in milliseconds (default: 300ms)
 * @returns Promise that resolves after the minimum duration has elapsed
 *
 * @example
 * const startTime = Date.now()
 * const toastId = toast.loading('Processing...')
 * try {
 *   await someOperation()
 *   await ensureMinimumToastDuration(startTime)
 *   resolveToast.success(toastId, 'Done!')
 * } catch (e) {
 *   resolveToast.error(toastId, 'Failed')
 * }
 */
export async function ensureMinimumToastDuration(
  startTime: number,
  minDuration = 300,
): Promise<void> {
  const elapsed = Date.now() - startTime
  if (elapsed < minDuration) {
    await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed))
  }
}

/**
 * Resolve a loading toast into a success/error/info/warning toast.
 *
 * Sonner loading toasts use `duration: Infinity` and updating by `id` does not
 * reliably replace the loading state in Sonner v2. Instead, dismiss the loading
 * toast and fire a fresh one.
 */
export const resolveToast = {
  success(id: string | number, message: string, options?: ExternalToast) {
    toast.dismiss(id)
    toast.success(message, { duration: TOAST_DURATION, ...options })
  },
  error(id: string | number, message: string, options?: ExternalToast) {
    toast.dismiss(id)
    toast.error(message, { duration: TOAST_DURATION, ...options })
  },
  info(id: string | number, message: string, options?: ExternalToast) {
    toast.dismiss(id)
    toast.info(message, { duration: TOAST_DURATION, ...options })
  },
  warning(id: string | number, message: string, options?: ExternalToast) {
    toast.dismiss(id)
    toast.warning(message, { duration: TOAST_DURATION, ...options })
  },
}
