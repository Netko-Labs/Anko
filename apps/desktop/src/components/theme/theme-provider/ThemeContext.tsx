import { createContext } from 'react'
import type { ThemeProviderState } from './lib'

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)
