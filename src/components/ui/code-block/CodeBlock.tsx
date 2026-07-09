import ShikiHighlighter, { createJavaScriptRegexEngine } from 'react-shiki'
import { useTheme } from '@/components/theme/theme-provider'
import { cn } from '@/lib/utils'

// Pure-JS regex engine (no oniguruma WASM) so highlighting works in the offline
// app:// bundle without fetching a .wasm asset. Created once, module-level.
const engine = createJavaScriptRegexEngine()

interface CodeBlockProps {
  code: string
  /** Shiki language id, e.g. 'json', 'typescript', 'sql'. */
  language: string
  /** Wrap long lines (good for narrow detail panels) instead of scrolling. */
  wrap?: boolean
  className?: string
}

/**
 * Syntax-highlighted code via Shiki (react-shiki), themed to match the SQL editor
 * (VS Code Dark+/Light+). Background is transparent so it blends into the host
 * panel; the caller controls padding.
 */
export function CodeBlock({ code, language, wrap = true, className }: CodeBlockProps) {
  const { resolvedTheme } = useTheme()
  return (
    <ShikiHighlighter
      language={language}
      theme={resolvedTheme === 'dark' ? 'dark-plus' : 'light-plus'}
      engine={engine}
      addDefaultStyles={false}
      showLanguage={false}
      className={cn(
        'font-mono [&_pre]:!bg-transparent [&_pre]:m-0 [&_pre]:p-0 [&_code]:!bg-transparent',
        wrap
          ? '[&_pre]:whitespace-pre-wrap [&_pre]:break-words'
          : '[&_pre]:overflow-x-auto',
        className,
      )}
    >
      {code}
    </ShikiHighlighter>
  )
}
