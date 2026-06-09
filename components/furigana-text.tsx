import type { Token } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

type Props = {
  text: string
  tokens?: Token[] | null
  showRuby?: boolean
  alignRuby?: boolean
  className?: string
}

/**
 * Render Japanese text with optional per-token furigana via <ruby>.
 *
 * - If `tokens` is missing and `showRuby` is true, falls back to plain `text`.
 * - If `showRuby` is false, renders the surface forms only (no ruby annotations).
 * - Token `{text, kana?}`: when `kana` is set, wraps `text` in <ruby>; otherwise plain.
 */
export function FuriganaText({
  text,
  tokens,
  showRuby = true,
  alignRuby = false,
  className,
}: Props) {
  if (!tokens || tokens.length === 0 || !showRuby) {
    return (
      <span lang="ja" className={className}>
        {text}
      </span>
    )
  }

  const keyedTokens = tokens.map((tok) => {
    const keyBase = `${tok.text}\u0000${tok.kana ?? ""}`
    return { tok, keyBase }
  })
  const keyCounts = new Map<string, number>()
  const keyedTokenRuns = keyedTokens.map(({ tok, keyBase }) => {
    const count = (keyCounts.get(keyBase) ?? 0) + 1
    keyCounts.set(keyBase, count)
    return { tok, key: `${keyBase}\u0000${count}` }
  })

  if (alignRuby) {
    return (
      <span
        lang="ja"
        className={cn(
          "inline-flex max-w-full flex-wrap items-end justify-center gap-x-[0.04em] gap-y-[0.22em]",
          className,
        )}
      >
        {keyedTokenRuns.map(({ tok, key }) =>
          tok.kana ? (
            <span
              key={key}
              className="inline-grid grid-rows-[0.92em_auto] justify-items-center align-bottom leading-none"
            >
              <span
                aria-hidden="true"
                className="font-jp text-[0.42em] font-normal leading-none tracking-normal text-fg-ruby"
              >
                {tok.kana}
              </span>
              <span>{tok.text}</span>
            </span>
          ) : (
            <span
              key={key}
              className="inline-grid grid-rows-[0.92em_auto] justify-items-center align-bottom leading-none"
            >
              <span aria-hidden="true" />
              <span>{tok.text}</span>
            </span>
          ),
        )}
      </span>
    )
  }

  return (
    <span lang="ja" className={cn(className)}>
      {keyedTokenRuns.map(({ tok, key }) =>
        tok.kana ? (
          <ruby key={key}>
            {tok.text}
            <rt>{tok.kana}</rt>
          </ruby>
        ) : (
          <span key={key}>{tok.text}</span>
        ),
      )}
    </span>
  )
}
