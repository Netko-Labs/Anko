import { createContext } from 'react'
import type { ThemeProviderState } from './definitions'

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)
