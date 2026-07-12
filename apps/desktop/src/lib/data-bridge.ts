const CHANNEL_NAME = 'anko-data-bridge'

export type InvalidationTarget = 'connections' | 'workspaces' | 'all'

/**
 * Broadcast a data invalidation signal to other windows.
 * The main window will re-fetch the specified data from the backend.
 */
export function broadcastInvalidation(...targets: InvalidationTarget[]) {
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.postMessage({ targets })
  channel.close()
}

/**
 * Listen for data invalidation signals from other windows.
 * Returns a cleanup function.
 */
export function listenForInvalidation(onInvalidate: (targets: InvalidationTarget[]) => void) {
  const channel = new BroadcastChannel(CHANNEL_NAME)
  channel.onmessage = (event: MessageEvent<{ targets: InvalidationTarget[] }>) => {
    onInvalidate(event.data.targets)
  }
  return () => channel.close()
}
