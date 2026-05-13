import type { Token } from "@/lib/db/schema"
import { cn } from "@/lib/utils"
import { FuriganaText } from "./furigana-text"

type Size = "sm" | "md" | "lg" | "display"

// Japanese is the primary content — significantly larger than Chinese (which
// is a helper translation). Ratio target ~2.5x for cards, ~8x for Display.
const SIZE_JP: Record<Size, string> = {
  sm: "text-3xl",
  md: "text-4xl",
  lg: "text-sentence",
  display: "text-ambient",
}

const SIZE_CN: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  display: "text-lg",
}

const SIZE_KANA: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  display: "text-xl",
}

const SIZE_GAP: Record<Size, string> = {
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-5",
  display: "gap-12",
}

export type SentenceLike = {
  japanese: string
  tokens?: Token[] | null
  kana?: string | null
  chinese: string
}

interface Props {
  sentence: SentenceLike
  size?: Size
  /**
   * "ruby" — show per-token furigana ruby above kanji (preferred).
   * "line" — show a separate kana line below Japanese (legacy fallback).
   * "none" — hide kana entirely (Stage 2+ to force kanji recall).
   */
  kanaDisplay?: "ruby" | "line" | "none"
  showChinese?: boolean
  className?: string
}

export function SentenceCard({
  sentence,
  size = "md",
  kanaDisplay = "ruby",
  showChinese = true,
  className,
}: Props) {
  const hasTokens = !!sentence.tokens && sentence.tokens.length > 0
  const useRuby = kanaDisplay === "ruby" && hasTokens

  return (
    <div className={cn("flex flex-col items-center text-center", SIZE_GAP[size], className)}>
      <p
        className={cn(
          // Japanese: dark ink, medium weight, biggest. The thing you actually learn.
          "font-jp-serif text-fg tracking-wide leading-snug font-medium",
          SIZE_JP[size],
        )}
      >
        <FuriganaText
          text={sentence.japanese}
          tokens={sentence.tokens}
          showRuby={useRuby}
        />
      </p>
      {/* Fallback kana line when tokens unavailable but kana exists */}
      {kanaDisplay === "line" && sentence.kana && !useRuby && (
        <p
          className={cn(
            "font-mono text-fg-tertiary tabular tracking-widest",
            SIZE_KANA[size],
          )}
          lang="ja"
        >
          {sentence.kana}
        </p>
      )}
      {showChinese && (
        <p
          className={cn(
            // Chinese: helper translation. Warm muted cocoa tone (fg-cn) —
            // distinct from cool mist furigana so the two helpers don't blur.
            "font-sans text-fg-cn",
            SIZE_CN[size],
          )}
          lang="zh-CN"
        >
          {sentence.chinese}
        </p>
      )}
    </div>
  )
}
