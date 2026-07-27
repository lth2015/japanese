"use client"

import { ensureVoicesLoaded, hasJapaneseVoice } from "@/lib/speech"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

/**
 * Ambient hint shown when auto-play TTS is on but the browser exposes no
 * Japanese voice. Without one, Web Speech falls back to a Chinese voice that
 * reads the kanji in Chinese — so audio is either wrong or (now) suppressed.
 * The fix lives in the OS/browser, not the app, hence the actionable copy.
 */
export function TtsVoiceHint({ active }: { active: boolean }) {
  const [missing, setMissing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    ensureVoicesLoaded().then(() => {
      if (!cancelled) setMissing(!hasJapaneseVoice())
    })
    return () => {
      cancelled = true
    }
  }, [active])

  if (!active || !missing || dismissed) return null

  return (
    <div
      className={cn(
        "absolute top-16 left-1/2 z-20 -translate-x-1/2",
        "max-w-md rounded-lg border border-border bg-surface px-4 py-3 shadow-lg-token",
        "animate-fade-in",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="text-sm text-fg space-y-1">
          <p className="font-semibold">检测不到日语语音，暂时静音</p>
          <p className="text-fg-secondary text-xs leading-relaxed">
            浏览器没有安装日语 (ja-JP) 语音，否则会用中文语音把汉字读成中文。请安装后刷新：
          </p>
          <ul className="text-fg-secondary text-xs leading-relaxed list-disc pl-4">
            <li>macOS：系统设置 → 辅助功能 → 朗读内容 → 系统声音 → 管理声音 → 添加「Kyoko / Otoya」</li>
            <li>Chrome：优先使用「Google 日本語」网络语音（需联网）</li>
            <li>Windows：设置 → 时间和语言 → 语言 → 添加「日本語」语音包</li>
          </ul>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="关闭提示"
          className="shrink-0 text-fg-tertiary hover:text-fg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
