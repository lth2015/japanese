"use client"

import { FuriganaText } from "@/components/furigana-text"
import { TtsVoiceHint } from "@/components/tts-voice-hint"
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
import { Check, ChevronLeft, ChevronRight, Keyboard, Pause, Play, Volume2 } from "lucide-react"
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

  // 三层筛选：
  // 1. 受筛选条件影响的全部卡片（索引条要列出这些动词，含已会的）
  // 2. 排除「我会了」后的实际轮播队列
  const visibleByFilters = useMemo(
    () =>
      filterVerbCards(cards, {
        conjugationType: settings.filterConjugation,
        scene: settings.filterScene,
        verbGroup: settings.filterGroup,
      }),
    [cards, settings.filterConjugation, settings.filterScene, settings.filterGroup],
  )

  const knownSet = useMemo(() => new Set(settings.knownVerbIds), [settings.knownVerbIds])

  const queue = useMemo(
    () =>
      knownSet.size === 0
        ? visibleByFilters
        : visibleByFilters.filter((c) => !knownSet.has(c.verbId)),
    [visibleByFilters, knownSet],
  )

  // 索引条上要列出的动词：当前筛选条件下出现过的所有动词（保留出现顺序、去重）。
  const verbsInIndex = useMemo(() => {
    const seen = new Map<
      string,
      { id: string; dictionaryForm: string; meaningZh: string; verbGroup: VerbGroup }
    >()
    for (const c of visibleByFilters) {
      if (!seen.has(c.verbId)) {
        seen.set(c.verbId, {
          id: c.verbId,
          dictionaryForm: c.dictionaryForm,
          meaningZh: c.meaningZh,
          verbGroup: c.verbGroup,
        })
      }
    }
    return [...seen.values()]
  }, [visibleByFilters])

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: 语速变化只对下一张卡生效，刻意不重启当前播放
  useEffect(() => {
    if (!settings.autoPlayTTS || paused || !current) return
    let cancelled = false
    ensureVoicesLoaded().then(() => {
      if (cancelled) return
      speakJapanese(current.example.japanese, { rate: settings.ttsRate }).catch(() => {})
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
      speakJapanese(current.example.japanese, { rate: settings.ttsRate }).catch(() => {}),
    )
  }, [current, settings.ttsRate])

  // 索引条交互：点击芯片跳到该动词的第一张卡；点 ✓ 切换「我会了」。
  // 跳转时若动词被标记为「会了」，先取消标记再跳，避免跳到空集合。
  const toggleKnown = useCallback(
    (verbId: string) => {
      const set = new Set(settings.knownVerbIds)
      if (set.has(verbId)) set.delete(verbId)
      else set.add(verbId)
      setVerbSettings({ knownVerbIds: [...set] })
    },
    [settings.knownVerbIds, setVerbSettings],
  )

  const jumpToVerb = useCallback(
    (verbId: string) => {
      // 若目标动词被标记为「会了」，先取消标记，然后在新的队列里定位。
      let nextKnown = settings.knownVerbIds
      if (nextKnown.includes(verbId)) {
        nextKnown = nextKnown.filter((id) => id !== verbId)
        setVerbSettings({ knownVerbIds: nextKnown })
      }
      const nextKnownSet = new Set(nextKnown)
      const nextQueue = visibleByFilters.filter((c) => !nextKnownSet.has(c.verbId))
      const idx = nextQueue.findIndex((c) => c.verbId === verbId)
      if (idx >= 0) {
        setIndex(idx)
        bumpChrome()
      }
    },
    [settings.knownVerbIds, setVerbSettings, visibleByFilters, bumpChrome],
  )

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
      <TtsVoiceHint active={settings.autoPlayTTS && !paused} />

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
              { value: "polite", label: "ます" },
              { value: "potential", label: "可能" },
              { value: "negative", label: "ない" },
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
              { value: "group1", label: "一类" },
              { value: "group2", label: "二类" },
              { value: "group3", label: "三类" },
            ]}
          />

          {/* 轮播停顿 / TTS 语速 调节 */}
          <StepperGroup
            label="间隔"
            value={settings.intervalSec}
            suffix="s"
            onDecrement={() =>
              setVerbSettings({ intervalSec: Math.max(2, settings.intervalSec - 1) })
            }
            onIncrement={() =>
              setVerbSettings({ intervalSec: Math.min(30, settings.intervalSec + 1) })
            }
          />
          <StepperGroup
            label="语速"
            value={settings.ttsRate.toFixed(1)}
            suffix="×"
            onDecrement={() =>
              setVerbSettings({
                ttsRate: Math.max(0.5, Math.round((settings.ttsRate - 0.1) * 10) / 10),
              })
            }
            onIncrement={() =>
              setVerbSettings({
                ttsRate: Math.min(1.5, Math.round((settings.ttsRate + 0.1) * 10) / 10),
              })
            }
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

        {/* 动词索引条：点击芯片跳到该动词的第一张卡；点 ✓ 标记「我会了」以隐藏。 */}
        {verbsInIndex.length > 0 && (
          <VerbIndex
            verbs={verbsInIndex}
            currentVerbId={current?.verbId}
            knownSet={knownSet}
            onJump={jumpToVerb}
            onToggleKnown={toggleKnown}
          />
        )}
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
                className="flex justify-center font-jp-serif text-fg tracking-wide font-semibold leading-[1.35] text-balance text-[length:clamp(1.5rem,3.5vw,3.5rem)]"
              >
                <FuriganaText
                  text={current.example.japanese}
                  tokens={current.example.tokens}
                  showRuby={settings.showKana}
                  alignRuby
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
                i === index % queue.length ? "bg-fg" : "bg-fg-tertiary opacity-25",
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

// 内联数字调节：「间隔」「语速」共用，紧凑、不抢眼。
type StepperGroupProps = {
  label: string
  value: number | string
  suffix?: string
  onDecrement: () => void
  onIncrement: () => void
}

function StepperGroup({ label, value, suffix, onDecrement, onIncrement }: StepperGroupProps) {
  return (
    <div className="flex h-7 items-stretch overflow-hidden rounded border border-border bg-surface shadow-xs">
      <button
        type="button"
        onClick={onDecrement}
        className="px-2 text-sm leading-none text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
        aria-label={`${label}を減らす`}
      >
        −
      </button>
      <span className="flex items-center gap-1 border-x border-border px-2 font-mono text-[11px] tabular text-fg">
        <span className="text-fg-tertiary">{label}</span>
        <span className="font-medium">
          {value}
          {suffix}
        </span>
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="px-2 text-sm leading-none text-fg-secondary transition-colors hover:bg-bg-subtle hover:text-fg"
        aria-label={`${label}を増やす`}
      >
        +
      </button>
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

// 动词索引条：横向滚动的芯片，左侧 chip body 点击跳转，右侧 ✓ 切换「我会了」。
type VerbIndexItem = {
  id: string
  dictionaryForm: string
  meaningZh: string
  verbGroup: VerbGroup
}

function VerbIndex({
  verbs,
  currentVerbId,
  knownSet,
  onJump,
  onToggleKnown,
}: {
  verbs: VerbIndexItem[]
  currentVerbId?: string
  knownSet: Set<string>
  onJump: (verbId: string) => void
  onToggleKnown: (verbId: string) => void
}) {
  const knownCount = verbs.filter((v) => knownSet.has(v.id)).length
  return (
    <div className="px-4 pb-2 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-fg-tertiary">
          动词 {verbs.length - knownCount}/{verbs.length}
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5">
          {verbs.map((v) => (
            <VerbChip
              key={v.id}
              verb={v}
              active={v.id === currentVerbId}
              known={knownSet.has(v.id)}
              onJump={() => onJump(v.id)}
              onToggleKnown={() => onToggleKnown(v.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function VerbChip({
  verb,
  active,
  known,
  onJump,
  onToggleKnown,
}: {
  verb: VerbIndexItem
  active: boolean
  known: boolean
  onJump: () => void
  onToggleKnown: () => void
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-stretch overflow-hidden rounded-md border text-xs transition-colors",
        active
          ? "border-accent bg-accent text-fg-on-accent shadow-sm"
          : known
            ? "border-border bg-bg-subtle text-fg-tertiary opacity-70"
            : "border-border bg-surface text-fg hover:bg-bg-subtle",
      )}
    >
      <button
        type="button"
        onClick={onJump}
        className="flex items-baseline gap-1.5 px-2.5 py-1 text-left"
        title={known ? "已会，点击仍可跳过去（取消标记）" : "跳到这个动词"}
      >
        <span className="font-jp-serif text-sm font-semibold leading-none">
          {verb.dictionaryForm}
        </span>
        <span
          className={cn(
            "text-[10px] leading-none",
            active ? "text-fg-on-accent/85" : "text-fg-tertiary",
          )}
        >
          {verb.meaningZh}
        </span>
      </button>
      <button
        type="button"
        onClick={onToggleKnown}
        title={known ? "标记为未会" : "我会了（从轮播里隐藏）"}
        aria-label={known ? "标记为未会" : "我会了"}
        className={cn(
          "grid place-items-center border-l px-1.5 transition-colors",
          active
            ? "border-accent text-fg-on-accent hover:bg-accent-hover"
            : known
              ? "border-border bg-success-soft text-success"
              : "border-border text-fg-tertiary hover:bg-success-soft hover:text-success",
        )}
      >
        <Check className="h-3 w-3" />
      </button>
    </div>
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
