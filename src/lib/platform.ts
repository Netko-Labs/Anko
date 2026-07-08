/**
 * Renderer-side platform detection. On macOS the window uses native traffic
 * lights (no app-drawn controls); on Windows and Linux mirin renders a frameless
 * custom title bar, so the app draws its own minimize/maximize/close buttons.
 */
export const isWindows =
  typeof navigator !== 'undefined' && /Windows/i.test(navigator.userAgent)

export const isMac =
  typeof navigator !== 'undefined' && /Mac OS X|Macintosh/i.test(navigator.userAgent)

export const isLinux =
  typeof navigator !== 'undefined' &&
  /Linux|X11/i.test(navigator.userAgent) &&
  !/Android/i.test(navigator.userAgent)

/** Platforms where the app draws its own window-control buttons (frameless). */
export const hasCustomControls = isWindows || isLinux
