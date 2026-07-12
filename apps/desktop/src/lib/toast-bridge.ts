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
    const relay: typeof toast.success = (message, options) => {
      const msg: ToastMessage = {
        type: method,
        message: typeof message === 'string' ? message : String(message ?? ''),
      }
      const description = typeof options?.description === 'string' ? options.description : undefined
      const duration = typeof options?.duration === 'number' ? options.duration : undefined
      if (description !== undefined || duration !== undefined) {
        msg.options = {
          description,
          duration,
        }
      }
      channel.postMessage(msg)
      return options?.id ?? crypto.randomUUID()
    }
    toast[method] = relay
  }
}
