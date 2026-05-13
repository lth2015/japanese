import type { Token } from "@/lib/db/schema"
import { cn } from "@/lib/utils"
import { FuriganaText } from "./furigana-text"

type Size = "sm" | "md" | "lg" | "display"

const SIZE_JP: Record<Size, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-hero",
  display: "text-display",
}

const SIZE_KANA: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  display: "text-xl",
}

const SIZE_CN: Record<Size, string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-lg",
  display: "text-xl",
}

const SIZE_GAP: Record<Size, string> = {
  sm: "gap-1",
  md: "gap-1.5",
  lg: "gap-3",
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
   * "none" — hide kana entirely (used once user reaches Stage 2+ to force kanji recall).
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
          "font-jp-serif text-text-primary tracking-wide",
          SIZE_JP[size],
          size === "display" && "font-medium",
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
            "font-mono text-text-muted tabular tracking-widest",
            SIZE_KANA[size],
          )}
          lang="ja"
        >
          {sentence.kana}
        </p>
      )}
      {showChinese && (
        <p className={cn("font-sans text-text-secondary", SIZE_CN[size])} lang="zh-CN">
          {sentence.chinese}
        </p>
      )}
    </div>
  )
}
