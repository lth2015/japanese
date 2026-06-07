"use client"

import { FuriganaText } from "@/components/furigana-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ensureVoicesLoaded, speakJapanese } from "@/lib/speech"
import { cn } from "@/lib/utils"
import type { ConjugationType, Scene, VerbCard, VerbGroup } from "@/lib/verbs/types"
import {
  filterVerbCards,
  getConjugationLabel,
  getSceneLabel,
  getVerbGroupLabel,
} from "@/lib/verbs/utils"
import { useVerbSettings } from "@/store/verb-settings"
import { ChevronLeft, ChevronRight, Keyboard, Pause, Play, Volume2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type Props = {
  cards: VerbCard[]
}

export function VerbTicker({ cards }: Props) {
  const [settings, setVerbSettings] = useVerbSettings()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showChrome, setShowChrome] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const queue = useMemo(
    () =>
      filterVerbCards(cards, {
        conjugationType: settings.filterConjugation,
        scene: settings.filterScene,
        verbGroup: settings.filterGroup,
      }),
    [cards, settings.filterConjugation, settings.filterScene, settings.filterGroup],
  )

  // Clamp index when filters change
  useEffect(() => {
    if (queue.length > 0 && index >= queue.length) setIndex(0)
  }, [queue.length, index])

  const current = queue.length > 0 ? queue[index % Math.max(queue.length, 1)] : null

  // Auto-rotate
  useEffect(() => {
    if (paused || queue.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % queue.length)
    }, settings.intervalSec * 1000)
    return () => clearInterval(timer)
  }, [paused, settings.intervalSec, queue.length])

  // Auto-play TTS
  useEffect(() => {
    if (!settings.autoPlayTTS || paused || !current) return
    let cancelled = false
    ensureVoicesLoaded().then(() => {
      if (cancelled) return
      speakJapanese(current.example.japanese, { rate: 0.9 }).catch(() => {})
    })
    return () => {
      cancelled = true
      if (typeof window !== "undefined") window.speechSynthesis.cancel()
    }
  }, [settings.autoPlayTTS, paused, current])

  const bumpChrome = useCallback(() => {
    setShowChrome(true)
    if (chromeTimer.current) clearTimeout(chromeTimer.current)
    chromeTimer.current = setTimeout(() => setShowChrome(false), 3500)
  }, [])

  useEffect(() => {
    bumpChrome()
    return () => {
      if (chromeTimer.current) clearTimeout(chromeTimer.current)
    }
  }, [bumpChrome])

  // Wake lock — keeps screen on during ambient study
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const request = async () => {
      try {
        if ("wakeLock" in navigator) {
          // biome-ignore lint/suspicious/noExplicitAny: wakeLock typing
          lock = await (navigator as any).wakeLock.request("screen")
        }
      } catch {
        // silent — not critical
      }
    }
    request()
    const onVisibility = () => {
      if (document.visibilityState === "visible") request()
    }
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      lock?.release().catch(() => {})
    }
  }, [])

  const speakCurrent = useCallback(() => {
    if (!current) return
    ensureVoicesLoaded().then(() =>
      speakJapanese(current.example.japanese, { rate: 0.9 }).catch(() => {}),
    )
  }, [current])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showShortcuts) {
        if (e.key === "Escape" || e.key === "?") {
          e.preventDefault()
          setShowShortcuts(false)
        }
        return
      }

      const safeLen = Math.max(queue.length, 1)
      const next = () => {
        setIndex((i) => (i + 1) % safeLen)
        bumpChrome()
      }
      const prev = () => {
        setIndex((i) => (i - 1 + safeLen) % safeLen)
        bumpChrome()
      }

      if (e.key === "ArrowRight" || e.key === "l" || e.key === "j") {
        next()
      } else if (e.key === "ArrowLeft" || e.key === "h" || e.key === "k") {
        prev()
      } else if (e.code === "Space") {
        e.preventDefault()
        setPaused((p) => !p)
        bumpChrome()
      } else if (e.key === "r") {
        setIndex(Math.floor(Math.random() * safeLen))
        bumpChrome()
      } else if (e.key === "s") {
        speakCurrent()
      } else if (e.key === "?") {
        setShowShortcuts(true)
      } else if (e.key === "q") {
        window.location.href = "/"
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [queue.length, bumpChrome, showShortcuts, speakCurrent])

  if (queue.length === 0) {
    return (
      <main className="fixed inset-0 grid place-items-center bg-bg px-6">
        <div className="text-center space-y-3">
          <p className="text-fg font-semibold">没有符合条件的卡片</p>
          <p className="text-fg-secondary text-sm">请在上方筛选区取消部分过滤条件。</p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="fixed inset-0 bg-bg text-fg overflow-hidden"
      onMouseMove={bumpChrome}
      onTouchStart={bumpChrome}
    >
      {/* ── Top chrome ── */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 z-10 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          {/* Conjugation filter */}
          <FilterGroup
            value={settings.filterConjugation}
            onChange={(v) => setVerbSettings({ filterConjugation: v as ConjugationType | "all" })}
            options={[
              { value: "all", label: "全部" },
              { value: "passive", label: "受身" },
              { value: "causative", label: "使役" },
              { value: "causativePassive", label: "使役受身" },
            ]}
          />
          {/* Scene filter */}
          <FilterGroup
            value={settings.filterScene}
            onChange={(v) => setVerbSettings({ filterScene: v as Scene | "all" })}
            options={[
              { value: "all", label: "全部" },
              { value: "work", label: "職場" },
              { value: "life", label: "日常" },
            ]}
          />
          {/* Verb group filter */}
          <FilterGroup
            value={settings.filterGroup}
            onChange={(v) => setVerbSettings({ filterGroup: v as VerbGroup | "all" })}
            options={[
              { value: "all", label: "全部" },
              { value: "group1", label: "グループ1" },
              { value: "group2", label: "グループ2" },
              { value: "group3", label: "グループ3" },
            ]}
          />

          {/* Spacer */}
          <div className="flex-1" />

          {/* Toggle buttons */}
          <ToggleButton
            active={settings.showKana}
            onClick={() => setVerbSettings({ showKana: !settings.showKana })}
            title="假名标注 (furigana)"
          >
            仮
          </ToggleButton>
          <ToggleButton
            active={settings.showChinese}
            onClick={() => setVerbSettings({ showChinese: !settings.showChinese })}
            title="中文翻译"
          >
            中
          </ToggleButton>
          <ToggleButton
            active={settings.autoPlayTTS}
            onClick={() => setVerbSettings({ autoPlayTTS: !settings.autoPlayTTS })}
            title="自动朗读"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </ToggleButton>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowShortcuts(true)}
            aria-label="キーボードショートカット"
            title="ショートカット (?)"
            className="h-7 w-7"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <a href="/">退出</a>
          </Button>
        </div>
      </div>

      {/* ── Main card content ── */}
      {current && (
        <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-12 lg:px-20 pt-16 pb-20">
          <div
            key={current.cardId}
            className="flex flex-col items-center gap-[clamp(0.9rem,2vw,2rem)] animate-fade-in text-center w-full max-w-[90vw]"
          >
            {/* Context badge row */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="font-jp-serif font-semibold text-fg text-base sm:text-lg">
                {current.dictionaryForm}
              </span>
              <span className="text-fg-tertiary text-sm">→</span>
              <Badge variant="accent" className="text-xs">
                {getConjugationLabel(current.conjugationType)}
              </Badge>
              <Badge variant="default" className="text-xs font-mono">
                {getVerbGroupLabel(current.verbGroup)}
              </Badge>
            </div>

            {/* Example sentence — visual hero */}
            <div className="space-y-2">
              <p
                lang="ja"
                className="font-jp-serif text-fg tracking-wide font-semibold leading-snug text-balance text-[length:clamp(1.5rem,3.5vw,3.5rem)]"
              >
                <FuriganaText
                  text={current.example.japanese}
                  tokens={current.example.tokens}
                  showRuby={settings.showKana}
                />
              </p>
              {settings.showKana && !current.example.tokens.length && current.example.kana && (
                <p
                  lang="ja"
                  className="font-mono text-fg-ruby text-[clamp(0.75rem,1.2vw,1rem)] tracking-widest"
                >
                  {current.example.kana}
                </p>
              )}
              {settings.showChinese && (
                <p
                  lang="zh-CN"
                  className="text-fg-cn text-[length:clamp(0.875rem,1.5vw,1.375rem)] font-normal tracking-wide text-balance"
                >
                  {current.example.chinese}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 pt-1">
                <Badge variant="default" className="text-xs">
                  {getSceneLabel(current.example.scene)}
                </Badge>
                <Badge variant="outline" className="text-xs font-jp">
                  {current.example.register}
                </Badge>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full max-w-sm h-px bg-border/60" />

            {/* Conjugated form */}
            <div className="space-y-1.5">
              <p
                lang="ja"
                className="font-jp-serif text-fg tracking-wide font-bold leading-none text-[length:clamp(1.75rem,4.5vw,4.5rem)]"
              >
                {current.conjugatedForm}
              </p>
              <p className="text-fg-cn text-[length:clamp(0.75rem,1.3vw,1.1rem)] font-normal">
                {current.explanationZh}
              </p>
              {settings.showPatternHint && (
                <p className="font-mono text-fg-tertiary text-[clamp(0.65rem,1.1vw,0.85rem)] tracking-wide">
                  {current.patternHint}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom chrome ── */}
      <div
        className={cn(
          "absolute bottom-6 inset-x-0 z-10 flex items-center justify-between px-6 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        {/* Progress dots */}
        <div className="hidden sm:flex items-center gap-1.5 max-w-[40vw] overflow-hidden">
          {queue.slice(0, 24).map((c, i) => (
            <span
              key={c.cardId}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === index % queue.length ? "bg-fg" : "bg-fg-tertiary/30",
              )}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 mx-auto sm:mx-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIndex((i) => (i - 1 + queue.length) % queue.length)}
            aria-label="前のカード"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={speakCurrent}
            aria-label="朗読"
            title="朗読 (s)"
          >
            <Volume2 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "再生" : "一時停止"}
          >
            {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIndex((i) => (i + 1) % queue.length)}
            aria-label="次のカード"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Counter */}
        <div className="hidden sm:block text-xs text-fg-tertiary tabular font-mono">
          {(index % queue.length) + 1} / {queue.length}
        </div>
      </div>

      {/* ── Keyboard shortcuts overlay ── */}
      {showShortcuts && (
        <dialog
          open
          className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-transparent p-0 animate-fade-in"
          aria-labelledby="verb-shortcuts-title"
          onCancel={(e) => {
            e.preventDefault()
            setShowShortcuts(false)
          }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
            aria-label="ショートカットを閉じる"
          />
          <div className="relative z-10 flex min-h-dvh items-center justify-center p-6 pointer-events-none">
            <div className="bg-surface border border-border rounded-2xl shadow-lg-token p-8 max-w-md w-full text-left pointer-events-auto">
              <h2
                id="verb-shortcuts-title"
                className="text-lg font-semibold mb-5 text-fg flex items-center gap-2"
              >
                <Keyboard className="h-4 w-4" />
                キーボードショートカット
              </h2>
              <dl className="space-y-2.5 text-sm">
                <ShortcutRow keys={["j", "l", "→"]} desc="次のカードへ" />
                <ShortcutRow keys={["k", "h", "←"]} desc="前のカードへ" />
                <ShortcutRow keys={["Space"]} desc="一時停止 / 再生" />
                <ShortcutRow keys={["r"]} desc="ランダムにジャンプ" />
                <ShortcutRow keys={["s"]} desc="例文を朗読" />
                <ShortcutRow keys={["?"]} desc="このヘルプを表示" />
                <ShortcutRow keys={["Esc"]} desc="閉じる" />
                <ShortcutRow keys={["q"]} desc="ホームへ戻る" />
              </dl>
              <p className="mt-5 text-xs text-fg-tertiary">Esc または ? でこのパネルを閉じます</p>
            </div>
          </div>
        </dialog>
      )}
    </main>
  )
}

// ── Sub-components ──

type FilterGroupProps = {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function FilterGroup({ value, onChange, options }: FilterGroupProps) {
  return (
    <div className="flex rounded border border-border overflow-hidden bg-surface shadow-xs">
      {options.map(({ value: v, label }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "px-2.5 py-1 text-[11px] font-medium transition-colors border-r border-border last:border-r-0",
            value === v
              ? "bg-accent text-fg-on-accent"
              : "bg-transparent hover:bg-bg-subtle text-fg-secondary hover:text-fg",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

type ToggleButtonProps = {
  active: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}

function ToggleButton({ active, onClick, title, children }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-7 min-w-7 px-2 rounded border text-[11px] font-medium transition-colors",
        active
          ? "bg-accent text-fg-on-accent border-accent"
          : "bg-surface text-fg-secondary border-border hover:bg-bg-subtle hover:text-fg",
      )}
    >
      {children}
    </button>
  )
}

function ShortcutRow({ keys, desc }: { keys: string[]; desc: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex gap-1.5 shrink-0">
        {keys.map((k) => (
          <kbd
            key={k}
            className="min-w-[1.75rem] px-2 py-0.5 text-xs font-mono bg-bg-subtle border border-border rounded text-center text-fg"
          >
            {k}
          </kbd>
        ))}
      </div>
      <span className="text-fg-secondary text-right">{desc}</span>
    </div>
  )
}
