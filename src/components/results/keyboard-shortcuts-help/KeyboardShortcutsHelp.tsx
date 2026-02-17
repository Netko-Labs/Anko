import { KEYBOARD_SHORTCUT_VALUES } from '@/components/results/definitions'

export function KeyboardShortcutsHelp() {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  const mod = isMac ? '\u2318' : 'Ctrl'
  const shift = isMac ? '\u21E7' : 'Shift'
  const shortcuts = KEYBOARD_SHORTCUT_VALUES.map((shortcut) => ({
    action: shortcut.action,
    keys: shortcut.keys.map((key) => {
      if (key === 'MOD') return mod
      if (key === 'SHIFT') return shift
      return key
    }),
  }))

  return (
    <div className="flex flex-col items-center justify-center h-full bg-background">
      <div className="space-y-2">
        {shortcuts.map(({ action, keys }) => (
          <div key={action} className="flex items-center gap-8">
            <span className="text-muted-foreground text-sm text-right w-40">{action}</span>
            <div className="flex gap-1">
              {keys.map((key, i) => (
                <kbd
                  key={`${action}-${key}-${i}`}
                  className="px-2 py-0.5 bg-card border border-border rounded text-xs text-foreground/80 font-medium min-w-6 text-center"
                >
                  {key}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
