import { cn } from "@/lib/utils"

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
  kana?: string | null
  chinese: string
}

interface Props {
  sentence: SentenceLike
  size?: Size
  showKana?: boolean
  showChinese?: boolean
  className?: string
}

export function SentenceCard({
  sentence,
  size = "md",
  showKana = true,
  showChinese = true,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col items-center text-center", SIZE_GAP[size], className)}>
      <p
        className={cn(
          "font-jp-serif text-text-primary tracking-wide",
          SIZE_JP[size],
          size === "display" && "font-medium",
        )}
        lang="ja"
      >
        {sentence.japanese}
      </p>
      {showKana && sentence.kana && (
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
