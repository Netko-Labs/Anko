import { useEffect, useState } from 'react'
import type { Theme, ThemeProviderProps } from './definitions'
import { THEME_PROVIDER_VALUES } from './definitions'
import { ThemeProviderContext } from './ThemeContext'

const getSystemTheme = (): 'light' | 'dark' =>
  window.matchMedia(THEME_PROVIDER_VALUES.mediaQuery).matches ? 'dark' : 'light'

const isTheme = (value: string | null): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system'

export function ThemeProvider({
  children,
  defaultTheme = THEME_PROVIDER_VALUES.defaultTheme,
  storageKey = THEME_PROVIDER_VALUES.defaultStorageKey,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(storageKey)
    return isTheme(stored) ? stored : defaultTheme
  })

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = getSystemTheme()
      root.classList.add(systemTheme)
      setResolvedTheme(systemTheme)
      return
    }

    root.classList.add(theme)
    setResolvedTheme(theme)
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia(THEME_PROVIDER_VALUES.mediaQuery)
    const onSystemThemeChange = (event: MediaQueryListEvent) => {
      const nextTheme: 'light' | 'dark' = event.matches ? 'dark' : 'light'
      const root = window.document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(nextTheme)
      setResolvedTheme(nextTheme)
    }

    mediaQuery.addEventListener('change', onSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', onSystemThemeChange)
  }, [theme])

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}
