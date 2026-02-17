import type { ThemeProviderTheme } from './types'

export const THEME_PROVIDER_VALUES = {
  defaultStorageKey: 'anko-theme',
  defaultTheme: 'system' as ThemeProviderTheme,
  mediaQuery: '(prefers-color-scheme: dark)',
} as const
