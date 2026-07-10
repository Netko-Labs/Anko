import ShikiHighlighter, {
  createHighlighterCore,
  createJavaScriptRegexEngine,
} from 'react-shiki/core'
import { useTheme } from '@/components/theme/theme-provider'
import { cn } from '@/lib/utils'

// Keep the offline highlighter limited to the languages and themes Anko uses.
const highlighter = await createHighlighterCore({
  langs: [import('@shikijs/langs/json'), import('@shikijs/langs/typescript')],
  themes: [import('@shikijs/themes/dark-plus'), import('@shikijs/themes/light-plus')],
  engine: createJavaScriptRegexEngine(),
})

type CodeLanguage = 'json' | 'typescript'

interface CodeBlockProps {
  code: string
  language: CodeLanguage
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
      highlighter={highlighter}
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
