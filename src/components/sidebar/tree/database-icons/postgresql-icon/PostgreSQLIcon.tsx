import type { DatabaseIconProps } from '../definitions/types'

export function PostgreSQLIcon({ className }: DatabaseIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C7.58 3 4 5.69 4 9c0 1.54.81 2.94 2.11 4.04-.31.87-.81 1.94-1.5 2.72-.25.28-.07.71.29.75 1.87.19 3.58-.48 4.76-1.23.78.15 1.55.22 2.34.22 4.42 0 8-2.69 8-6s-3.58-6-8-6z" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
