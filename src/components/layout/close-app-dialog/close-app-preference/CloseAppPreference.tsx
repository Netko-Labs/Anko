import type { CloseAppPreference } from '../definitions'
import { CLOSE_APP_PREFERENCE_KEY } from '../definitions'

export function getCloseAppPreference(): CloseAppPreference {
  const stored = localStorage.getItem(CLOSE_APP_PREFERENCE_KEY)
  if (stored === 'always-close' || stored === 'never-close') {
    return stored
  }
  return 'ask'
}

export function setCloseAppPreference(preference: CloseAppPreference) {
  if (preference === 'ask') {
    localStorage.removeItem(CLOSE_APP_PREFERENCE_KEY)
  } else {
    localStorage.setItem(CLOSE_APP_PREFERENCE_KEY, preference)
  }
}
