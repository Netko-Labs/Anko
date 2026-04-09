import type { DatabaseIconProps } from '../definitions/types'

export function SQLiteIcon({ className }: DatabaseIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text
        x="12"
        y="13"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="6.5"
        fontWeight="bold"
        fontFamily="system-ui, sans-serif"
        fill="currentColor"
      >
        SQ
      </text>
    </svg>
  )
}
