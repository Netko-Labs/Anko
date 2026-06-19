/**
 * Renderer-side platform detection. On macOS the window uses native traffic
 * lights (no app-drawn controls); on Windows mirin renders a frameless custom
 * title bar, so the app draws its own minimize/maximize/close buttons.
 */
export const isWindows =
  typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)

export const isMac =
  typeof navigator !== 'undefined' && /Mac OS X|Macintosh/i.test(navigator.userAgent)
