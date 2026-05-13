import type { Token } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

type Props = {
  text: string
  tokens?: Token[] | null
  showRuby?: boolean
  className?: string
}

/**
 * Render Japanese text with optional per-token furigana via <ruby>.
 *
 * - If `tokens` is missing and `showRuby` is true, falls back to plain `text`.
 * - If `showRuby` is false, renders the surface forms only (no ruby annotations).
 * - Token `{text, kana?}`: when `kana` is set, wraps `text` in <ruby>; otherwise plain.
 */
export function FuriganaText({ text, tokens, showRuby = true, className }: Props) {
  if (!tokens || tokens.length === 0 || !showRuby) {
    return (
      <span lang="ja" className={className}>
        {text}
      </span>
    )
  }

  return (
    <span lang="ja" className={cn(className)}>
      {tokens.map((tok, i) =>
        tok.kana ? (
          <ruby key={i}>
            {tok.text}
            <rt>{tok.kana}</rt>
          </ruby>
        ) : (
          <span key={i}>{tok.text}</span>
        ),
      )}
    </span>
  )
}
