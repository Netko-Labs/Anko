import { toast } from 'sonner'

const CHANNEL_NAME = 'anko-toast-bridge'

interface ToastMessage {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  options?: { description?: string; duration?: number }
}

/**
 * Call in the main window to receive and display toasts from other windows.
 */
export function listenForRemoteToasts() {
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (event: MessageEvent<ToastMessage>) => {
    const { type, message, options } = event.data
    toast[type](message, options)
  }
  return () => channel.close()
}

/**
 * Call in secondary windows (like DevTools) to relay toasts to the main window
 * instead of displaying them locally.
 */
export function setupToastRelay() {
  const channel = new BroadcastChannel(CHANNEL_NAME)

  for (const method of ['success', 'error', 'info', 'warning'] as const) {
    // biome-ignore lint: intentional override of toast methods for cross-window relay
    ;(toast as any)[method] = (message: string, options?: Record<string, unknown>) => {
      const msg: ToastMessage = { type: method, message }
      if (options) {
        msg.options = {
          description: options.description as string | undefined,
          duration: options.duration as number | undefined,
        }
      }
      channel.postMessage(msg)
    }
  }
}
