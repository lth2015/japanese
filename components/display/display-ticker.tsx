"use client"

import { FuriganaText } from "@/components/furigana-text"
import { Button } from "@/components/ui/button"
import type { Sentence } from "@/lib/db/schema"
import { loadTickerState, reconcileOrder, saveTickerState } from "@/lib/display-order"
import { ensureVoicesLoaded, speakJapanese } from "@/lib/speech"
import { cn } from "@/lib/utils"
import { FONT_SIZE_CLASS, useDisplaySettings } from "@/store/display-settings"
import { ChevronLeft, ChevronRight, Keyboard, Pause, Play } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { DisplaySettingsSheet } from "./display-settings"

type Props = {
  sentences: Sentence[]
  ignoreSourceFilter?: boolean
}

export function DisplayTicker({ sentences, ignoreSourceFilter = false }: Props) {
  const [settings, setDisplaySettings] = useDisplaySettings()
  const [index, setIndex] = useState(0)
  const [order, setOrder] = useState<string[] | null>(null)
  const [paused, setPaused] = useState(false)
  const [showChrome, setShowChrome] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const byId = useMemo(() => new Map(sentences.map((s) => [s.id, s])), [sentences])

  // Hydrate the persisted shuffle once on mount: reconcile it with the
  // current sentence set so progress survives a reload and freshly-imported
  // packs splice into the upcoming tail instead of waiting a full cycle.
  useEffect(() => {
    const persisted = loadTickerState()
    const currentIds = sentences.map((s) => s.id)
    const reconciled = reconcileOrder(
      persisted?.shuffledIds ?? [],
      currentIds,
      persisted?.cursor ?? 0,
    )
    const startCursor = Math.min(
      Math.max(persisted?.cursor ?? 0, 0),
      Math.max(reconciled.length - 1, 0),
    )
    setOrder(reconciled)
    setIndex(startCursor)
    saveTickerState({ shuffledIds: reconciled, cursor: startCursor })
  }, [sentences])

  const ordered = useMemo(() => {
    if (!order) return sentences
    return order.map((id) => byId.get(id)).filter((s): s is Sentence => s !== undefined)
  }, [order, byId, sentences])

  const queue = useMemo(() => {
    if (ignoreSourceFilter) return ordered
    if (settings.source === "all") return ordered
    return ordered.filter((s) => s.category === settings.source)
  }, [ignoreSourceFilter, ordered, settings.source])

  // Persist the cursor as we advance — only for the unfiltered queue, since a
  // category filter walks a subset whose index is not a valid full-order cursor.
  useEffect(() => {
    if (!order) return
    if (settings.source !== "all") return
    saveTickerState({ shuffledIds: order, cursor: index })
  }, [index, order, settings.source])

  const current = queue[index % Math.max(queue.length, 1)]

  // Apply ambient-dark class on the html element when in dark theme
  useEffect(() => {
    if (typeof document === "undefined") return
    document.documentElement.classList.toggle("ambient-dark", settings.theme === "ambient-dark")
    return () => {
      document.documentElement.classList.remove("ambient-dark")
    }
  }, [settings.theme])

  useEffect(() => {
    if (paused || queue.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % queue.length)
    }, settings.intervalSec * 1000)
    return () => clearInterval(timer)
  }, [paused, settings.intervalSec, queue.length])

  useEffect(() => {
    if (index >= queue.length) setIndex(0)
  }, [queue.length, index])

  useEffect(() => {
    if (!settings.autoPlayTTS) return
    if (paused) return
    if (!current) return
    let cancelled = false
    ensureVoicesLoaded().then(() => {
      if (cancelled) return
      speakJapanese(current.japanese, { rate: 0.95 }).catch(() => {})
    })
    return () => {
      cancelled = true
      if (typeof window !== "undefined") window.speechSynthesis.cancel()
    }
  }, [settings.autoPlayTTS, paused, current])

  // Wake lock
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const request = async () => {
      try {
        if ("wakeLock" in navigator) {
          // biome-ignore lint/suspicious/noExplicitAny: wakeLock typing
          lock = await (navigator as any).wakeLock.request("screen")
        }
      } catch {
        // silent
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

  const bumpChrome = useCallback(() => {
    if (settings.focusMode) {
      setShowChrome(false)
      return
    }
    setShowChrome(true)
    if (chromeTimer.current) clearTimeout(chromeTimer.current)
    chromeTimer.current = setTimeout(() => setShowChrome(false), 3000)
  }, [settings.focusMode])

  useEffect(() => {
    bumpChrome()
    return () => {
      if (chromeTimer.current) clearTimeout(chromeTimer.current)
    }
  }, [bumpChrome])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Overlay open: only close keys
      if (showShortcuts) {
        if (e.key === "Escape" || e.key === "?") {
          e.preventDefault()
          setShowShortcuts(false)
        }
        return
      }

      const next = () => {
        setIndex((i) => (i + 1) % queue.length)
        bumpChrome()
      }
      const prev = () => {
        setIndex((i) => (i - 1 + queue.length) % queue.length)
        bumpChrome()
      }

      // Vim-style + arrow: h/k/← prev, j/l/→ next
      if (e.key === "ArrowRight" || e.key === "l" || e.key === "j") {
        next()
      } else if (e.key === "ArrowLeft" || e.key === "h" || e.key === "k") {
        prev()
      } else if (e.code === "Space") {
        e.preventDefault()
        setPaused((p) => !p)
        bumpChrome()
      } else if (e.key === "r") {
        // Random jump
        setIndex(Math.floor(Math.random() * queue.length))
        bumpChrome()
      } else if (e.key === "f") {
        setDisplaySettings({ focusMode: !settings.focusMode })
      } else if (e.key === "?") {
        setShowShortcuts(true)
      } else if (e.key === "q") {
        window.location.href = "/"
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [queue.length, bumpChrome, showShortcuts, settings.focusMode, setDisplaySettings])

  if (queue.length === 0) {
    return (
      <main className="fixed inset-0 grid place-items-center bg-bg">
        <p className="text-fg-secondary">这个分类还没有句子。换一个分类或添加几句。</p>
      </main>
    )
  }

  return (
    <main
      className="fixed inset-0 bg-bg text-fg overflow-hidden"
      onMouseMove={bumpChrome}
      onTouchStart={bumpChrome}
    >
      {/* Top-right chrome: settings + exit */}
      <div
        className={cn(
          "absolute top-5 right-5 z-10 flex items-center gap-2 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowShortcuts(true)}
          aria-label="キーボードショートカット"
          title="キーボードショートカット (?)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
        <DisplaySettingsSheet />
        <Button asChild variant="ghost" size="sm">
          <a href="/">退出</a>
        </Button>
      </div>

      {/* Content — JP dominant, CN tiny helper. The wrapper uses
       * `absolute inset-0 flex` to fill the parent `fixed inset-0`
       * main directly, avoiding any height-inheritance ambiguity. */}
      <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-12 lg:px-20">
        <div
          key={current.id}
          className="flex flex-col items-center gap-[clamp(1.25rem,2.5vw,2.5rem)] animate-fade-in text-center w-full max-w-[94vw]"
        >
          <p
            lang="ja"
            className={cn(
              "font-jp-serif text-fg tracking-wide font-semibold leading-[1.1] text-balance",
              FONT_SIZE_CLASS[settings.fontSize],
            )}
          >
            <FuriganaText
              text={current.japanese}
              tokens={current.tokens}
              showRuby={settings.showKana}
            />
          </p>
          {settings.showKana && !current.tokens?.length && current.kana && (
            <p
              lang="ja"
              className="font-mono text-fg-ruby text-[clamp(0.875rem,1.5vw,1.375rem)] tracking-widest"
            >
              {current.kana}
            </p>
          )}
          {settings.showChinese && (
            <p
              lang="zh-CN"
              className="text-fg-cn text-[clamp(1rem,1.8vw,1.625rem)] font-normal tracking-wide text-balance"
            >
              {current.chinese}
            </p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div
        className={cn(
          "absolute bottom-6 inset-x-0 z-10 flex items-center justify-between px-6 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="hidden sm:flex items-center gap-1.5 max-w-[40vw] overflow-hidden">
          {queue.slice(0, 24).map((s, i) => (
            <span
              key={s.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === index % queue.length ? "bg-fg" : "bg-fg-tertiary/30",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 mx-auto sm:mx-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIndex((i) => (i - 1 + queue.length) % queue.length)}
            aria-label="上一句"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "播放" : "暂停"}
          >
            {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIndex((i) => (i + 1) % queue.length)}
            aria-label="下一句"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden sm:block text-xs text-fg-tertiary tabular font-mono">
          {(index % queue.length) + 1} / {queue.length}
        </div>
      </div>

      {/* Keyboard shortcuts overlay */}
      {showShortcuts && (
        <dialog
          open
          className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-transparent p-0 animate-fade-in"
          aria-labelledby="shortcuts-title"
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
                id="shortcuts-title"
                className="text-lg font-semibold mb-5 text-fg flex items-center gap-2"
              >
                <Keyboard className="h-4 w-4" />
                キーボードショートカット
              </h2>
              <dl className="space-y-2.5 text-sm">
                <ShortcutRow keys={["j", "l", "→"]} desc="次の文へ" />
                <ShortcutRow keys={["k", "h", "←"]} desc="前の文へ" />
                <ShortcutRow keys={["Space"]} desc="一時停止 / 再生" />
                <ShortcutRow keys={["r"]} desc="ランダムにジャンプ" />
                <ShortcutRow keys={["f"]} desc="フォーカスモード切替" />
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
