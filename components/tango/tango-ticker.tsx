"use client"

import { FuriganaText } from "@/components/furigana-text"
import { TtsVoiceHint } from "@/components/tts-voice-hint"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ADJECTIVE_FORM_LABEL,
  type AdjectiveFormKey,
  VERB_FORM_LABEL,
  VERB_GROUP_LABEL,
  type VerbFormKey,
} from "@/lib/conjugation"
import { ensureVoicesLoaded, speakJapanese } from "@/lib/speech"
import { TANGO_GROUPS } from "@/lib/tango/groups"
import { POS_LABEL_ZH, POS_LIST, type Pos, type TangoCard } from "@/lib/tango/types"
import { filterTangoCards, getSurface } from "@/lib/tango/utils"
import { cn } from "@/lib/utils"
import { useTangoSettings } from "@/store/tango-settings"
import { Check, ChevronLeft, ChevronRight, Keyboard, Pause, Play, Volume2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

/** 卡片上展示的活用形——只挑最常用的，全表放不下也没必要 */
const VERB_FORMS_ON_CARD: VerbFormKey[] = ["masu", "te", "ta", "nai", "potential", "volitional"]
const ADJ_FORMS_ON_CARD: AdjectiveFormKey[] = ["negative", "past", "adverb", "te"]

/** 索引条一次最多渲染多少个芯片。语料满 800 词时全渲染会拖慢首屏。 */
const MAX_INDEX_CHIPS = 60

type Props = {
  cards: TangoCard[]
}

export function TangoTicker({ cards }: Props) {
  const [settings, setTangoSettings] = useTangoSettings()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [showChrome, setShowChrome] = useState(true)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 两层筛选：筛选结果用于索引条（含已会的），去掉「我会了」之后才是播放队列。
  const visibleByFilters = useMemo(
    () =>
      filterTangoCards(cards, {
        groupId: settings.filterGroup,
        pos: settings.filterPos,
        onlyConjugatable: settings.onlyConjugatable,
      }),
    [cards, settings.filterGroup, settings.filterPos, settings.onlyConjugatable],
  )

  const knownSet = useMemo(() => new Set(settings.knownIds), [settings.knownIds])

  // 分组切换条上的计数。必须在 early return 之前算，否则违反 hooks 规则。
  const groupCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of cards) m.set(c.groupId, (m.get(c.groupId) ?? 0) + 1)
    return m
  }, [cards])

  const queue = useMemo(
    () =>
      knownSet.size === 0 ? visibleByFilters : visibleByFilters.filter((c) => !knownSet.has(c.id)),
    [visibleByFilters, knownSet],
  )

  useEffect(() => {
    if (queue.length > 0 && index >= queue.length) setIndex(0)
  }, [queue.length, index])

  const current = queue.length > 0 ? queue[index % Math.max(queue.length, 1)] : null

  // 自动轮播
  useEffect(() => {
    if (paused || queue.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % queue.length)
    }, settings.intervalSec * 1000)
    return () => clearInterval(timer)
  }, [paused, settings.intervalSec, queue.length])

  // 自动朗读：读「词 + 例句」，比只读词更有语境
  // biome-ignore lint/correctness/useExhaustiveDependencies: 语速变化只对下一张卡生效，刻意不重启当前播放
  useEffect(() => {
    if (!settings.autoPlayTTS || paused || !current) return
    let cancelled = false
    const text = settings.showExample
      ? `${getSurface(current)}。${current.example.japanese}`
      : getSurface(current)
    ensureVoicesLoaded().then(() => {
      if (cancelled) return
      speakJapanese(text, { rate: settings.ttsRate }).catch(() => {})
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

  // 挂机学习时不让屏幕熄灭
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
      speakJapanese(`${getSurface(current)}。${current.example.japanese}`, {
        rate: settings.ttsRate,
      }).catch(() => {}),
    )
  }, [current, settings.ttsRate])

  const toggleKnown = useCallback(
    (id: string) => {
      const set = new Set(settings.knownIds)
      if (set.has(id)) set.delete(id)
      else set.add(id)
      setTangoSettings({ knownIds: [...set] })
    },
    [settings.knownIds, setTangoSettings],
  )

  const jumpTo = useCallback(
    (id: string) => {
      // 目标词若被标记「会了」，先取消标记，否则跳过去会落空
      let nextKnown = settings.knownIds
      if (nextKnown.includes(id)) {
        nextKnown = nextKnown.filter((x) => x !== id)
        setTangoSettings({ knownIds: nextKnown })
      }
      const nextKnownSet = new Set(nextKnown)
      const nextQueue = visibleByFilters.filter((c) => !nextKnownSet.has(c.id))
      const idx = nextQueue.findIndex((c) => c.id === id)
      if (idx >= 0) {
        setIndex(idx)
        bumpChrome()
      }
    },
    [settings.knownIds, setTangoSettings, visibleByFilters, bumpChrome],
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
      } else if (e.key === "m" && current) {
        // m = 我会了，比翻到索引条上点 ✓ 快
        toggleKnown(current.id)
        bumpChrome()
      } else if (e.key === "?") {
        setShowShortcuts(true)
      } else if (e.key === "q") {
        window.location.href = "/"
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [queue.length, bumpChrome, showShortcuts, speakCurrent, current, toggleKnown])

  if (queue.length === 0) {
    return (
      <main className="fixed inset-0 grid place-items-center bg-bg px-6">
        <div className="text-center space-y-3">
          <p className="text-fg font-semibold">没有符合条件的词</p>
          <p className="text-fg-secondary text-sm">
            {visibleByFilters.length > 0
              ? "这一组都被标记「我会了」——在索引条上再点一次 ✓ 可以放回来。"
              : "请在上方筛选区取消部分过滤条件。"}
          </p>
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

      {/* -- 顶部工具条 -- */}
      <div
        className={cn(
          "absolute top-0 inset-x-0 z-10 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          {/* 词性筛选 */}
          <select
            value={settings.filterPos}
            onChange={(e) => setTangoSettings({ filterPos: e.target.value as Pos | "all" })}
            className="h-7 rounded border border-border bg-surface px-2 text-[11px] text-fg shadow-xs"
            aria-label="词性筛选"
          >
            <option value="all">全部词性</option>
            {POS_LIST.map((p) => (
              <option key={p} value={p}>
                {p} {POS_LABEL_ZH[p]}
              </option>
            ))}
          </select>

          <ToggleButton
            active={settings.onlyConjugatable}
            onClick={() => setTangoSettings({ onlyConjugatable: !settings.onlyConjugatable })}
            title="只看有变形的词（动词 + 形容词）"
          >
            変
          </ToggleButton>

          <StepperGroup
            label="间隔"
            value={settings.intervalSec}
            suffix="s"
            onDecrement={() =>
              setTangoSettings({ intervalSec: Math.max(2, settings.intervalSec - 1) })
            }
            onIncrement={() =>
              setTangoSettings({ intervalSec: Math.min(30, settings.intervalSec + 1) })
            }
          />
          <StepperGroup
            label="语速"
            value={settings.ttsRate.toFixed(1)}
            suffix="x"
            onDecrement={() =>
              setTangoSettings({
                ttsRate: Math.max(0.5, Math.round((settings.ttsRate - 0.1) * 10) / 10),
              })
            }
            onIncrement={() =>
              setTangoSettings({
                ttsRate: Math.min(1.5, Math.round((settings.ttsRate + 0.1) * 10) / 10),
              })
            }
          />

          <div className="flex-1" />

          <ToggleButton
            active={settings.showKana}
            onClick={() => setTangoSettings({ showKana: !settings.showKana })}
            title="假名标注 (furigana)"
          >
            仮
          </ToggleButton>
          <ToggleButton
            active={settings.showChinese}
            onClick={() => setTangoSettings({ showChinese: !settings.showChinese })}
            title="中文释义"
          >
            中
          </ToggleButton>
          <ToggleButton
            active={settings.showExample}
            onClick={() => setTangoSettings({ showExample: !settings.showExample })}
            title="例句"
          >
            例
          </ToggleButton>
          <ToggleButton
            active={settings.showForms}
            onClick={() => setTangoSettings({ showForms: !settings.showForms })}
            title="活用变形表"
          >
            活
          </ToggleButton>
          <ToggleButton
            active={settings.autoPlayTTS}
            onClick={() => setTangoSettings({ autoPlayTTS: !settings.autoPlayTTS })}
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

        {/* 分组切换：22 组横向滚动 */}
        <GroupBar
          value={settings.filterGroup}
          counts={groupCounts}
          onChange={(v) => {
            setTangoSettings({ filterGroup: v })
            setIndex(0)
          }}
        />

        {/* 词索引条 */}
        {visibleByFilters.length > 0 && (
          <WordIndex
            words={visibleByFilters}
            currentId={current?.id}
            knownSet={knownSet}
            onJump={jumpTo}
            onToggleKnown={toggleKnown}
          />
        )}
      </div>

      {/* -- 卡片主体 -- */}
      {current && (
        <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-12 lg:px-20 pt-40 pb-20">
          <div
            key={current.id}
            className="flex flex-col items-center gap-[clamp(0.7rem,1.6vw,1.5rem)] animate-fade-in text-center w-full max-w-[90vw]"
          >
            {/* 分组 / 词性 */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <Badge variant="default" className="text-xs">
                {current.group.no}. {current.group.nameZh}
              </Badge>
              <Badge variant="accent" className="text-xs font-jp">
                {current.pos}
              </Badge>
              {current.verbGroup && (
                <Badge variant="outline" className="text-xs font-mono">
                  {VERB_GROUP_LABEL[current.verbGroup]}
                </Badge>
              )}
            </div>

            {/* 词本体 —— 视觉主角 */}
            <p
              lang="ja"
              className="flex justify-center font-jp-serif text-fg tracking-wide font-bold leading-[1.3] text-[length:clamp(2.5rem,7vw,6rem)]"
            >
              <FuriganaText
                text={getSurface(current)}
                tokens={current.tokens}
                showRuby={settings.showKana}
                alignRuby
              />
            </p>

            {settings.showChinese && (
              <p
                lang="zh-CN"
                className="text-fg-cn text-[length:clamp(1rem,2vw,1.75rem)] tracking-wide"
              >
                {current.chineseZh}
              </p>
            )}

            {(current.synonyms?.length || current.note) && (
              <div className="flex flex-col items-center gap-1">
                {current.synonyms?.length ? (
                  <p className="font-mono text-[clamp(0.65rem,1.1vw,0.85rem)] text-fg-tertiary">
                    = {current.synonyms.join(" / ")}
                  </p>
                ) : null}
                {current.note && (
                  <p className="max-w-xl text-[clamp(0.65rem,1.1vw,0.85rem)] text-fg-tertiary leading-relaxed">
                    {current.note}
                  </p>
                )}
              </div>
            )}

            {/* 活用表：只有动词 / 形容词才出现 */}
            {settings.showForms && (current.verbForms || current.adjForms) && (
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 rounded-lg border border-border bg-surface px-4 py-2.5">
                {current.verbForms &&
                  VERB_FORMS_ON_CARD.map((key) => (
                    <FormCell
                      key={key}
                      label={VERB_FORM_LABEL[key]}
                      value={current.verbForms![key].text}
                    />
                  ))}
                {current.adjForms &&
                  ADJ_FORMS_ON_CARD.map((key) => (
                    <FormCell
                      key={key}
                      label={ADJECTIVE_FORM_LABEL[key]}
                      value={current.adjForms![key].text}
                    />
                  ))}
              </div>
            )}

            {/* 例句 */}
            {settings.showExample && (
              <div className="space-y-1.5 pt-1">
                <div className="mx-auto mb-3 h-px w-full max-w-sm bg-border" />
                <p
                  lang="ja"
                  className="flex justify-center font-jp-serif text-fg tracking-wide leading-[1.4] text-balance text-[length:clamp(1.05rem,2.2vw,2rem)]"
                >
                  <FuriganaText
                    text={current.example.japanese}
                    tokens={current.example.tokens}
                    showRuby={settings.showKana}
                    alignRuby
                  />
                </p>
                {settings.showChinese && (
                  <p
                    lang="zh-CN"
                    className="text-fg-cn text-[length:clamp(0.8rem,1.3vw,1.15rem)] text-balance"
                  >
                    {current.example.chinese}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* -- 底部工具条 -- */}
      <div
        className={cn(
          "absolute bottom-6 inset-x-0 z-10 flex items-center justify-between px-6 transition-opacity duration-300",
          showChrome ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div className="hidden sm:flex items-center gap-1.5 max-w-[40vw] overflow-hidden">
          {queue.slice(0, 24).map((c, i) => (
            <span
              key={c.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === index % queue.length ? "bg-fg" : "bg-fg-tertiary opacity-25",
              )}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 mx-auto sm:mx-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIndex((i) => (i - 1 + queue.length) % queue.length)}
            aria-label="前の単語"
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
            aria-label="次の単語"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden sm:block text-xs text-fg-tertiary tabular font-mono">
          {(index % queue.length) + 1} / {queue.length}
        </div>
      </div>

      {/* -- 快捷键面板 -- */}
      {showShortcuts && (
        <dialog
          open
          className="fixed inset-0 z-50 m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-transparent p-0 animate-fade-in"
          aria-labelledby="tango-shortcuts-title"
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
                id="tango-shortcuts-title"
                className="text-lg font-semibold mb-5 text-fg flex items-center gap-2"
              >
                <Keyboard className="h-4 w-4" />
                キーボードショートカット
              </h2>
              <dl className="space-y-2.5 text-sm">
                <ShortcutRow keys={["j", "l", "→"]} desc="次の単語へ" />
                <ShortcutRow keys={["k", "h", "←"]} desc="前の単語へ" />
                <ShortcutRow keys={["Space"]} desc="一時停止 / 再生" />
                <ShortcutRow keys={["r"]} desc="ランダムにジャンプ" />
                <ShortcutRow keys={["s"]} desc="単語と例文を朗読" />
                <ShortcutRow keys={["m"]} desc="この単語を「覚えた」に" />
                <ShortcutRow keys={["?"]} desc="このヘルプを表示" />
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

// -- Sub-components --

function FormCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-wider text-fg-tertiary">
        {label}
      </span>
      <span lang="ja" className="font-jp-serif text-[clamp(0.9rem,1.5vw,1.2rem)] text-fg">
        {value}
      </span>
    </span>
  )
}

function GroupBar({
  value,
  counts,
  onChange,
}: {
  value: string
  counts: Map<string, number>
  onChange: (v: string) => void
}) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  return (
    <div className="px-4 pb-1.5 sm:px-6">
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <GroupChip
          label={`全部 ${total}`}
          active={value === "all"}
          onClick={() => onChange("all")}
        />
        {TANGO_GROUPS.filter((g) => (counts.get(g.id) ?? 0) > 0).map((g) => (
          <GroupChip
            key={g.id}
            label={`${g.no}. ${g.nameZh} ${counts.get(g.id) ?? 0}`}
            active={value === g.id}
            onClick={() => onChange(g.id)}
          />
        ))}
      </div>
    </div>
  )
}

function GroupChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-accent bg-accent text-fg-on-accent shadow-sm"
          : "border-border bg-surface text-fg-secondary hover:bg-bg-subtle hover:text-fg",
      )}
    >
      {label}
    </button>
  )
}

function WordIndex({
  words,
  currentId,
  knownSet,
  onJump,
  onToggleKnown,
}: {
  words: TangoCard[]
  currentId?: string
  knownSet: Set<string>
  onJump: (id: string) => void
  onToggleKnown: (id: string) => void
}) {
  const knownCount = words.filter((w) => knownSet.has(w.id)).length
  // 语料到 800 词时「全部」模式会渲染 800 个芯片，横向滚不到头也拖慢首屏。
  // 截断到一屏能扫完的量，并保证当前词一定在窗口里。
  const shown = useMemo(() => {
    if (words.length <= MAX_INDEX_CHIPS) return words
    const at = Math.max(
      0,
      words.findIndex((w) => w.id === currentId),
    )
    const start = Math.min(
      Math.max(0, at - Math.floor(MAX_INDEX_CHIPS / 2)),
      words.length - MAX_INDEX_CHIPS,
    )
    return words.slice(start, start + MAX_INDEX_CHIPS)
  }, [words, currentId])

  return (
    <div className="px-4 pb-2 sm:px-6">
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-fg-tertiary">
          単語 {words.length - knownCount}/{words.length}
          {shown.length < words.length && (
            <span className="ml-1 normal-case text-fg-tertiary">（切到某一组看全部）</span>
          )}
        </span>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5">
          {shown.map((w) => (
            <WordChip
              key={w.id}
              word={w}
              active={w.id === currentId}
              known={knownSet.has(w.id)}
              onJump={() => onJump(w.id)}
              onToggleKnown={() => onToggleKnown(w.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function WordChip({
  word,
  active,
  known,
  onJump,
  onToggleKnown,
}: {
  word: TangoCard
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
        title={known ? "已会，点击仍可跳过去（取消标记）" : "跳到这个词"}
      >
        <span lang="ja" className="font-jp-serif text-sm font-semibold leading-none">
          {getSurface(word)}
        </span>
        <span
          className={cn(
            "text-[10px] leading-none",
            active ? "text-fg-on-accent/85" : "text-fg-tertiary",
          )}
        >
          {word.chineseZh}
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

function ToggleButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}) {
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
