"use client"

/**
 * /learning —— 主动输出训练页。
 *
 * 与 /display（被动轮播）不同，这里走「中文提示 → 自己开口 → 显示答案 →
 * 播放跟读 → 反馈」的流程，并据反馈做间隔复习。语料独立保存在
 * localStorage（见 lib/learning/store.ts），不影响现有 /display。
 *
 * 两个视图：
 *   - 练习（TrainView）：训练流程 + 自动轮播
 *   - 语料（ManageView）：增删改查、筛选、搜索
 */

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { diff } from "@/lib/diff"
import { id as genId } from "@/lib/id"
import {
  FAVORITE_TAG,
  addEntry,
  buildDailySession,
  buildStreamQueue,
  bumpActivity,
  deleteEntry,
  getStats,
  importEntries,
  isDue,
  recordFeedback,
  resetCorpus,
  toggleFavorite,
  updateEntry,
  useDailyActivity,
  useLearningCorpus,
} from "@/lib/learning/store"
import { LEARNING_SCENES, LEVEL_LABEL } from "@/lib/learning/types"
import type {
  Feedback,
  LearningEntry,
  LearningEntryInput,
  LearningVariants,
} from "@/lib/learning/types"
import { ensureVoicesLoaded, speakJapanese, startJapaneseSTT } from "@/lib/speech"
import type { SttListener } from "@/lib/speech"
import { cn } from "@/lib/utils"
import { pronunciationScore, wer } from "@/lib/wer"
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Mic,
  Minimize2,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  Square,
  Star,
  Trash2,
  Upload,
  Volume2,
  Waves,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

// 场景配色：把场景名哈希到固定调色板，自定义场景也能稳定着色。
const SCENE_PALETTE = [
  "bg-accent-soft text-accent border-accent/25",
  "bg-success-soft text-success border-success/30",
  "bg-warning-soft text-warning border-warning/30",
  "bg-danger-soft text-danger border-danger/30",
  "bg-indigo/10 text-indigo border-indigo/30",
  "bg-vermilion/10 text-vermilion border-vermilion/30",
  "bg-fg-plum/10 text-fg-plum border-fg-plum/30",
  "bg-fg-sage/15 text-fg-sage border-fg-sage/30",
]

function sceneColorClass(scene: string): string {
  let h = 0
  for (let i = 0; i < scene.length; i++) h = (h * 31 + scene.charCodeAt(i)) >>> 0
  return SCENE_PALETTE[h % SCENE_PALETTE.length]
}

// ============================================================
// 顶层：视图切换 + 全屏
// ============================================================

export function LearningClient() {
  const { entries, ready } = useLearningCorpus()
  const [view, setView] = useState<"train" | "stream" | "manage" | "stats">("train")
  const [isFullscreen, setIsFullscreen] = useState(false)

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  return (
    <main className="fixed inset-0 flex flex-col bg-bg text-fg">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-white/55 px-4 py-2.5 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-jp-serif text-lg font-bold leading-none text-accent-fg">
            話
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">口语训练</p>
            <p className="text-xs leading-tight text-fg-tertiary">主动输出 · 间隔复习</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-border bg-white/70 p-0.5">
            <TabButton active={view === "train"} onClick={() => setView("train")}>
              训练
            </TabButton>
            <TabButton active={view === "stream"} onClick={() => setView("stream")}>
              口语流
            </TabButton>
            <TabButton active={view === "manage"} onClick={() => setView("manage")}>
              语料
            </TabButton>
            <TabButton active={view === "stats"} onClick={() => setView("stats")}>
              进度
            </TabButton>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "退出全屏" : "全屏"}
            aria-label="全屏切换"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="/">退出</a>
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1">
        {!ready ? (
          <div className="grid h-full place-items-center text-fg-tertiary">加载中…</div>
        ) : view === "train" ? (
          <TrainView entries={entries} />
        ) : view === "stream" ? (
          <StreamView entries={entries} />
        ) : view === "manage" ? (
          <ManageView entries={entries} />
        ) : (
          <StatsView entries={entries} />
        )}
      </div>
    </main>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-3 py-1 text-sm font-medium transition-colors",
        active ? "bg-accent text-accent-fg shadow-sm" : "text-fg-secondary hover:text-fg",
      )}
    >
      {children}
    </button>
  )
}

// ============================================================
// 练习视图
// ============================================================

const PROMPT_SECONDS = 3 // 显示中文后，多少秒自动揭示答案
const AUTO_DWELL_SECONDS = 6 // 自动轮播时，答案停留多久后切下一句

function TrainView({ entries }: { entries: LearningEntry[] }) {
  const [sceneFilter, setSceneFilter] = useState<string>("all")
  const [queue, setQueue] = useState<string[]>([])
  const [pos, setPos] = useState(0)
  const [phase, setPhase] = useState<"prompt" | "revealed">("prompt")
  const [countdown, setCountdown] = useState(PROMPT_SECONDS)
  const [paused, setPaused] = useState(false)
  const [auto, setAuto] = useState(false)
  const [looping, setLooping] = useState(false)
  const loopRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // 录音跟读（阶段 D 的主动输出闭环）
  const [recording, setRecording] = useState(false)
  const [sttResult, setSttResult] = useState<{ transcript: string; score: number } | null>(null)
  const sttRef = useRef<SttListener | null>(null)

  const activity = useDailyActivity()
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries])

  const pool = useMemo(
    () => entries.filter((e) => sceneFilter === "all" || e.scene === sceneFilter),
    [entries, sceneFilter],
  )

  const scenes = useMemo(() => {
    const set = new Set<string>(LEARNING_SCENES)
    for (const e of entries) set.add(e.scene)
    return [...set]
  }, [entries])

  const dueCount = useMemo(() => pool.filter((e) => isDue(e)).length, [pool])

  // 切换场景时重建队列。pool 本身每次反馈都会变（熟练度更新），
  // 故只在 sceneFilter 变化时重建，避免训练过程中顺序乱跳。
  // biome-ignore lint/correctness/useExhaustiveDependencies: 仅在场景切换时重建队列，刻意不依赖 pool
  useEffect(() => {
    setQueue(buildDailySession(pool).map((e) => e.id))
    setPos(0)
    setPhase("prompt")
  }, [sceneFilter])

  // 走到队列末尾：用最新语料重建新一轮。
  useEffect(() => {
    if (queue.length > 0 && pos >= queue.length) {
      setQueue(buildDailySession(pool).map((e) => e.id))
      setPos(0)
      setPhase("prompt")
    }
  }, [pos, queue.length, pool])

  const current = queue.length > 0 ? byId.get(queue[pos]) : undefined

  // === 音频 ===
  // 有预录音频（audioUrl）就放音频，否则回退到浏览器 TTS。两条路径都返回
  // 一个在播放结束时 resolve 的 Promise，方便「循环播放」串接。
  const playEntryAudio = useCallback((entry: LearningEntry): Promise<void> => {
    if (entry.audioUrl) {
      return new Promise((resolve) => {
        const el = new Audio(entry.audioUrl)
        audioRef.current = el
        el.onended = () => resolve()
        el.onerror = () => resolve()
        el.play().catch(() => resolve())
      })
    }
    return ensureVoicesLoaded().then(() => speakJapanese(entry.ja, { rate: 0.92 }))
  }, [])

  const stopAudio = useCallback(() => {
    loopRef.current = false
    setLooping(false)
    if (typeof window !== "undefined") window.speechSynthesis.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
  }, [])

  const playOnce = useCallback(
    (entry: LearningEntry) => {
      stopAudio()
      bumpActivity("heard")
      playEntryAudio(entry).catch(() => {})
    },
    [stopAudio, playEntryAudio],
  )

  const playLoop = useCallback(
    (entry: LearningEntry) => {
      stopAudio()
      bumpActivity("heard")
      loopRef.current = true
      setLooping(true)
      const run = () => {
        if (!loopRef.current) return
        playEntryAudio(entry)
          .then(() => {
            if (loopRef.current) setTimeout(run, 500)
          })
          .catch(() => {})
      }
      run()
    },
    [stopAudio, playEntryAudio],
  )

  // === 录音跟读 ===
  const stopRecording = useCallback(() => {
    sttRef.current?.abort()
    sttRef.current = null
    setRecording(false)
  }, [])

  const startRecording = useCallback(() => {
    if (!current) return
    stopAudio()
    setSttResult(null)
    setRecording(true)
    const target = current.ja
    sttRef.current = startJapaneseSTT({
      onResult: (r) => {
        if (!r.isFinal) return
        setSttResult({
          transcript: r.transcript,
          score: pronunciationScore(wer(target, r.transcript)),
        })
      },
      onEnd: () => setRecording(false),
      onError: (msg) => {
        setRecording(false)
        setSttResult({ transcript: `识别失败：${msg}`, score: -1 })
      },
    })
    if (!sttRef.current) setRecording(false)
  }, [current, stopAudio])

  // 卸载时停掉音频与录音。
  useEffect(() => {
    return () => {
      stopAudio()
      sttRef.current?.abort()
    }
  }, [stopAudio])

  // 换句时清掉上一句的跟读结果。
  // biome-ignore lint/correctness/useExhaustiveDependencies: 仅在切句时重置
  useEffect(() => {
    setSttResult(null)
    sttRef.current?.abort()
    sttRef.current = null
    setRecording(false)
  }, [current?.id])

  // === 导航 ===
  const goNext = useCallback(() => {
    stopAudio()
    setPhase("prompt")
    setPos((p) => p + 1)
  }, [stopAudio])

  const goPrev = useCallback(() => {
    stopAudio()
    setPhase("prompt")
    setPos((p) => Math.max(0, p - 1))
  }, [stopAudio])

  const reveal = useCallback(() => setPhase("revealed"), [])

  // === 阶段 E：反馈 ===
  const handleFeedback = useCallback(
    (fb: Feedback) => {
      if (!current) return
      recordFeedback(current.id, fb)
      // 「还不会」「重点复习」——把当前句插回前方，本轮内更快再次出现。
      if (fb === "unknown" || fb === "focus") {
        setQueue((q) => {
          const next = [...q]
          const insertAt = Math.min(pos + 4, next.length)
          next.splice(insertAt, 0, current.id)
          return next
        })
      }
      goNext()
    },
    [current, pos, goNext],
  )

  // === 阶段 A/B：中文 + 倒计时，到点自动揭示 ===
  // biome-ignore lint/correctness/useExhaustiveDependencies: pos 变化即新句子，需重启倒计时
  useEffect(() => {
    if (phase !== "prompt" || paused || !current) return
    setCountdown(PROMPT_SECONDS)
    let c = PROMPT_SECONDS
    const timer = setInterval(() => {
      c -= 1
      setCountdown(c)
      if (c <= 0) {
        clearInterval(timer)
        setPhase("revealed")
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, paused, pos, current])

  // === 阶段 D：揭示答案后自动播一次音频，并记一次「接触」 ===
  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在进入 revealed 时播放
  useEffect(() => {
    if (phase !== "revealed" || !current) return
    bumpActivity("touched")
    playOnce(current)
  }, [phase, current?.id])

  // === 自动轮播：答案停留一会儿后自动切下一句 ===
  // biome-ignore lint/correctness/useExhaustiveDependencies: 仅靠 pos 触发，避免 goNext 引用反复重置
  useEffect(() => {
    if (!auto || paused || phase !== "revealed") return
    const timer = setTimeout(() => goNext(), AUTO_DWELL_SECONDS * 1000)
    return () => clearTimeout(timer)
  }, [auto, paused, phase, pos, goNext])

  // === 键盘快捷键 ===
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return
      if (e.key === "ArrowRight") goNext()
      else if (e.key === "ArrowLeft") goPrev()
      else if (e.code === "Space") {
        e.preventDefault()
        if (phase === "prompt") reveal()
        else setPaused((p) => !p)
      } else if (phase === "revealed") {
        if (e.key === "1") handleFeedback("known")
        else if (e.key === "2") handleFeedback("unknown")
        else if (e.key === "3") handleFeedback("easy")
        else if (e.key === "4") handleFeedback("focus")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, goNext, goPrev, reveal, handleFeedback])

  if (pool.length === 0) {
    return (
      <div className="grid h-full place-items-center px-6 text-center">
        <div className="space-y-3">
          <p className="text-fg-secondary">这个场景还没有语料。</p>
          <p className="text-sm text-fg-tertiary">切换到「语料」标签新增句子，或换一个场景。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 设置条 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-4 py-2 sm:px-6">
        <select
          value={sceneFilter}
          onChange={(e) => setSceneFilter(e.target.value)}
          className="h-9 rounded-md border border-border-input bg-white/78 px-2.5 text-sm text-fg"
        >
          <option value="all">全部场景</option>
          {scenes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <Button variant={auto ? "default" : "outline"} size="sm" onClick={() => setAuto((a) => !a)}>
          自动轮播 {auto ? "开" : "关"}
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-fg-tertiary">
          <span>
            今天接触 <span className="font-mono font-semibold text-accent">{activity.touched}</span>{" "}
            条 · 听 <span className="font-mono font-semibold text-accent">{activity.heard}</span> 次
          </span>
          <span>
            待复习 <span className="font-mono font-semibold text-warning">{dueCount}</span> /{" "}
            {pool.length}
          </span>
        </div>
      </div>

      {/* 主卡片 */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-6 sm:px-10">
        {current ? (
          <div
            key={current.id + phase}
            className="flex w-full max-w-3xl animate-fade-in flex-col items-center gap-6 text-center"
          >
            <div className="flex items-center gap-2">
              <Badge className={sceneColorClass(current.scene)}>{current.scene}</Badge>
              <Badge variant={current.level >= 2 ? "success" : "outline"}>
                {LEVEL_LABEL[current.level]}
              </Badge>
              {current.tags.includes("重点") && <Badge variant="warning">重点</Badge>}
              <button
                type="button"
                onClick={() => toggleFavorite(current.id)}
                aria-label="收藏"
                title="收藏"
                className="ml-0.5 text-fg-tertiary transition-colors hover:text-warning"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    current.tags.includes(FAVORITE_TAG) && "fill-warning text-warning",
                  )}
                />
              </button>
            </div>

            {phase === "prompt" ? (
              <>
                <p className="text-xs font-medium uppercase tracking-widest text-fg-tertiary">
                  用日语说出来
                </p>
                <p
                  lang="zh-CN"
                  className="text-balance text-[length:clamp(2rem,5.5vw,4.25rem)] font-semibold leading-tight text-fg"
                >
                  {current.zh}
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-accent/40 font-mono text-2xl font-bold text-accent">
                    {paused ? "‖" : countdown}
                  </div>
                  <p className="text-sm text-fg-tertiary">
                    {paused ? "已暂停" : `请先自己用日语说出来，${countdown} 秒后显示答案`}
                  </p>
                  <Button size="lg" onClick={reveal}>
                    显示答案
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p
                  lang="zh-CN"
                  className="text-[length:clamp(1rem,2vw,1.5rem)] font-normal text-fg-cn"
                >
                  {current.zh}
                </p>
                <p
                  lang="ja"
                  className="text-balance font-jp-serif text-[length:clamp(2.25rem,6vw,5rem)] font-semibold leading-[1.15] tracking-wide text-fg"
                >
                  {current.ja}
                </p>
                {current.kana && (
                  <p
                    lang="ja"
                    className="font-mono text-[length:clamp(0.9rem,1.6vw,1.35rem)] tracking-wider text-fg-ruby"
                  >
                    {current.kana}
                  </p>
                )}
                {current.romaji && (
                  <p className="text-[length:clamp(0.8rem,1.3vw,1.05rem)] italic tracking-wide text-fg-tertiary">
                    {current.romaji}
                  </p>
                )}

                {/* 同义表达组：同一个意思的不同语气 */}
                {current.variants && <VariantChips variants={current.variants} />}

                {/* 阶段 D：音频 + 录音跟读 */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Button variant="secondary" onClick={() => playOnce(current)}>
                    <Volume2 className="h-4 w-4" /> 播放一次
                  </Button>
                  <Button
                    variant={looping ? "default" : "secondary"}
                    onClick={() => (looping ? stopAudio() : playLoop(current))}
                  >
                    <Repeat className="h-4 w-4" /> {looping ? "循环中" : "循环播放"}
                  </Button>
                  <Button variant="ghost" onClick={stopAudio}>
                    <Square className="h-4 w-4" /> 停止
                  </Button>
                  <Button
                    variant={recording ? "destructive" : "outline"}
                    onClick={() => (recording ? stopRecording() : startRecording())}
                  >
                    <Mic className="h-4 w-4" /> {recording ? "录音中…点此停止" : "录音跟读"}
                  </Button>
                </div>

                {/* 跟读结果对比 */}
                {sttResult && <RecitationResult result={sttResult} target={current.ja} />}

                {/* 阶段 E：反馈 */}
                <div className="grid w-full max-w-xl grid-cols-2 gap-2.5 pt-1 sm:grid-cols-4">
                  <Button
                    size="lg"
                    onClick={() => handleFeedback("known")}
                    className={cn(
                      // 跟读达标时高亮「我会了」，把得分顺势引导到间隔复习
                      sttResult && sttResult.score >= 80 && "ring-2 ring-success ring-offset-2",
                    )}
                  >
                    我会了
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-warning/40 text-warning hover:bg-warning-soft"
                    onClick={() => handleFeedback("unknown")}
                  >
                    还不会
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => handleFeedback("easy")}>
                    太简单
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => handleFeedback("focus")}>
                    重点复习
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-fg-tertiary">准备中…</p>
        )}
      </div>

      {/* 底部控制 */}
      <div className="flex shrink-0 items-center justify-between border-t border-border/70 px-5 py-2.5 sm:px-8">
        <Button variant="ghost" size="icon" onClick={goPrev} aria-label="上一句">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "继续" : "暂停"}
          >
            {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
          </Button>
          <span className="font-mono text-xs tabular text-fg-tertiary">
            {queue.length > 0 ? `${(pos % queue.length) + 1} / ${queue.length}` : "0 / 0"}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={goNext} aria-label="下一句">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}

// 跟读对比结果：把 STT 识别文本与答案做字符级 diff 并高亮。
function RecitationResult({
  result,
  target,
}: {
  result: { transcript: string; score: number }
  target: string
}) {
  if (result.score < 0) {
    return <p className="text-sm text-danger">{result.transcript}</p>
  }
  const segs = diff(result.transcript, target)
  let offset = 0
  const keyed = segs.map((s) => {
    const k = `${offset}-${s.op}`
    offset += s.user.length + s.target.length
    return { ...s, k }
  })
  const tone =
    result.score >= 80 ? "text-success" : result.score >= 50 ? "text-warning" : "text-danger"
  return (
    <div className="w-full max-w-xl space-y-1.5 rounded-lg border border-border bg-white/70 p-3">
      <p className="text-xs text-fg-tertiary">
        跟读对比
        <span className={cn("ml-1.5 font-mono text-sm font-semibold", tone)}>
          {result.score} 分
        </span>
      </p>
      <p lang="ja" className="font-jp-serif text-lg leading-snug text-fg">
        {keyed.map((s) =>
          s.op === "match" ? (
            <span key={s.k}>{s.user}</span>
          ) : s.op === "insert" ? (
            <span key={s.k} className="text-fg-tertiary/60 line-through">
              {s.target}
            </span>
          ) : (
            <span key={s.k} className="text-danger underline decoration-danger/50">
              {s.user}
            </span>
          ),
        )}
      </p>
      <p className="text-xs text-fg-tertiary">
        {result.score >= 80
          ? "发音很接近，继续保持！"
          : result.score >= 50
            ? "大致对了，再跟读几遍。"
            : "和答案差距较大，多听几遍再跟读。"}
      </p>
    </div>
  )
}

// 同义表达组：同一个意思的随意 / 普通 / 礼貌三档说法。
function VariantChips({ variants }: { variants: LearningVariants }) {
  const rows: { label: string; text?: string }[] = [
    { label: "随意", text: variants.casual },
    { label: "普通", text: variants.normal },
    { label: "礼貌", text: variants.polite },
  ]
  const shown = rows.filter((r) => r.text)
  if (shown.length === 0) return null
  return (
    <div className="flex w-full max-w-xl flex-col gap-1.5 rounded-lg border border-border bg-white/55 p-3">
      <p className="text-xs text-fg-tertiary">换个语气也能说：</p>
      {shown.map((r) => (
        <div key={r.label} className="flex items-baseline gap-2">
          <span className="shrink-0 rounded bg-bg-subtle px-1.5 py-0.5 text-[10px] text-fg-tertiary">
            {r.label}
          </span>
          <span lang="ja" className="font-jp-serif text-base text-fg">
            {r.text}
          </span>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// 口语流视图：随机、高频、像刷短视频一样浸泡
// ============================================================

const STREAM_INTERVAL_SEC = 4 // 口语流每条停留秒数

function StreamView({ entries }: { entries: LearningEntry[] }) {
  const activity = useDailyActivity()
  const [queue, setQueue] = useState<LearningEntry[]>([])
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [speak, setSpeak] = useState(false)

  // 进入时构建一条加权随机流。
  useEffect(() => {
    setQueue(buildStreamQueue(entries))
    setIndex(0)
  }, [entries])

  const current = queue[index]

  // 自动推进。
  useEffect(() => {
    if (paused || queue.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % queue.length)
    }, STREAM_INTERVAL_SEC * 1000)
    return () => clearInterval(timer)
  }, [paused, queue.length])

  // 每出现一条记一次「接触」；开了朗读就读出来并记一次「听」。
  // biome-ignore lint/correctness/useExhaustiveDependencies: 仅随当前句变化
  useEffect(() => {
    if (!current) return
    bumpActivity("touched")
    if (speak && !paused) {
      bumpActivity("heard")
      ensureVoicesLoaded().then(() => {
        speakJapanese(current.ja, { rate: 0.95 }).catch(() => {})
      })
    }
    return () => {
      if (typeof window !== "undefined") window.speechSynthesis.cancel()
    }
  }, [current?.id])

  const next = useCallback(() => {
    if (queue.length === 0) return
    setIndex((i) => (i + 1) % queue.length)
  }, [queue.length])

  if (queue.length === 0) {
    return <div className="grid h-full place-items-center text-fg-tertiary">还没有语料。</div>
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-4 py-2 sm:px-6">
        <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
          <Waves className="h-4 w-4 text-accent" /> 口语流
        </span>
        <Button
          variant={speak ? "default" : "outline"}
          size="sm"
          onClick={() => setSpeak((s) => !s)}
        >
          朗读 {speak ? "开" : "关"}
        </Button>
        <span className="ml-auto text-xs text-fg-tertiary">
          今天接触 <span className="font-mono font-semibold text-accent">{activity.touched}</span>{" "}
          条 · 听 <span className="font-mono font-semibold text-accent">{activity.heard}</span> 次
        </span>
      </div>

      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="flex min-h-0 flex-1 items-center justify-center px-6 py-8"
      >
        {current && (
          <div
            key={`${current.id}-${index}`}
            className="flex animate-fade-in flex-col items-center gap-4 text-center"
          >
            <Badge className={sceneColorClass(current.scene)}>{current.scene}</Badge>
            <p
              lang="ja"
              className="text-balance font-jp-serif text-[length:clamp(2.5rem,7vw,5.5rem)] font-semibold leading-tight text-fg"
            >
              {current.ja}
            </p>
            {current.kana && (
              <p lang="ja" className="font-mono text-base tracking-wider text-fg-ruby">
                {current.kana}
              </p>
            )}
            <p lang="zh-CN" className="text-[length:clamp(0.95rem,1.8vw,1.4rem)] text-fg-cn">
              {current.zh}
            </p>
          </div>
        )}
      </button>

      <div className="flex shrink-0 items-center justify-center gap-2 border-t border-border/70 px-5 py-2.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "继续" : "暂停"}
        >
          {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={next} aria-label="下一条">
          <ChevronRight className="h-5 w-5" />
        </Button>
        <span className="ml-2 text-xs text-fg-tertiary">
          {paused ? "已暂停 · 点画面继续" : "点画面暂停"}
        </span>
      </div>
    </div>
  )
}

// ============================================================
// 进度视图
// ============================================================

function StatsView({ entries }: { entries: LearningEntry[] }) {
  const stats = useMemo(() => getStats(entries), [entries])
  const activity = useDailyActivity()
  const masteredPct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-fg">学习进度</h2>
        </div>

        {/* 今天的接触量 —— 不是 KPI，是「今天又和这些表达见过面」 */}
        <div className="rounded-lg border border-accent/20 bg-accent-soft/40 p-4">
          <p className="text-sm text-fg-secondary">
            今天，你已经和 <b className="font-mono text-base text-accent">{activity.touched}</b>{" "}
            条日语表达见过面， 听了{" "}
            <b className="font-mono text-base text-accent">{activity.heard}</b> 次日语。
          </p>
          <p className="mt-1 text-xs text-fg-tertiary">不用记住，多见几次自然就脸熟了。</p>
        </div>

        {/* 指标卡 */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="语料总数" value={stats.total} />
          <StatCard label="待复习" value={stats.due} tone="warning" />
          <StatCard label="今日已练" value={stats.reviewedToday} tone="accent" />
          <StatCard label="已掌握" value={`${masteredPct}%`} tone="success" />
        </div>

        {/* 熟练度分布 */}
        <section className="space-y-2 rounded-lg border border-border bg-white/65 p-4">
          <p className="text-sm font-semibold text-fg">熟练度分布</p>
          {LEVEL_LABEL.map((label, i) => {
            const count = stats.byLevel[i]
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
            return (
              <div key={label} className="grid grid-cols-[4rem_1fr_3rem] items-center gap-3">
                <span className="text-xs text-fg-secondary">{label}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-right font-mono text-xs text-fg-tertiary">{count}</span>
              </div>
            )
          })}
        </section>

        {/* 累计数据 */}
        <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-lg border border-border bg-white/65 p-4 text-sm">
          <span className="text-fg-secondary">
            累计复习 <b className="font-mono text-fg">{stats.totalReviews}</b> 次
          </span>
          <span className="text-fg-secondary">
            重点句 <b className="font-mono text-fg">{stats.focusCount}</b> 条
          </span>
        </div>

        {/* 各场景掌握度 */}
        <section className="space-y-2 rounded-lg border border-border bg-white/65 p-4">
          <p className="text-sm font-semibold text-fg">各场景掌握度</p>
          {stats.byScene.length === 0 && <p className="text-xs text-fg-tertiary">还没有语料。</p>}
          {stats.byScene.map((s) => {
            const pct = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0
            return (
              <div key={s.scene} className="grid grid-cols-[4rem_1fr_4rem] items-center gap-3">
                <span className="text-xs text-fg-secondary">{s.scene}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-bg-muted">
                  <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-right font-mono text-xs text-fg-tertiary">
                  {s.mastered}/{s.total}
                </span>
              </div>
            )
          })}
        </section>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string
  value: number | string
  tone?: "default" | "warning" | "success" | "accent"
}) {
  const toneClass = {
    default: "text-fg",
    warning: "text-warning",
    success: "text-success",
    accent: "text-accent",
  }[tone]
  return (
    <div className="rounded-lg border border-border bg-white/65 p-3">
      <p className="text-xs text-fg-tertiary">{label}</p>
      <p className={cn("mt-1 font-mono text-2xl font-semibold tabular", toneClass)}>{value}</p>
    </div>
  )
}

// ============================================================
// 语料管理视图
// ============================================================

/** 把 nextReviewAt 转成「待复习 / N 天后复习」的简短提示。 */
function dueHint(entry: LearningEntry): string {
  if (!entry.nextReviewAt) return "待复习"
  const ms = new Date(entry.nextReviewAt).getTime() - Date.now()
  if (ms <= 0) return "待复习"
  const days = Math.ceil(ms / 86_400_000)
  return days <= 1 ? "明天复习" : `${days} 天后复习`
}

function ManageView({ entries }: { entries: LearningEntry[] }) {
  const [search, setSearch] = useState("")
  const [sceneFilter, setSceneFilter] = useState("all")
  const [levelFilter, setLevelFilter] = useState("all")
  const [editing, setEditing] = useState<LearningEntry | null>(null)
  const [adding, setAdding] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 导出当前全部语料为 JSON 备份。
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `learning-corpus-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入 JSON 语料包（兼容精简包与完整导出）。
  const handleImportFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const n = importEntries(JSON.parse(String(reader.result)))
        setImportMsg(`成功导入 ${n} 条语料`)
      } catch (err) {
        setImportMsg(err instanceof Error ? err.message : "导入失败：无法解析 JSON")
      }
    }
    reader.readAsText(file)
  }

  const scenes = useMemo(() => {
    const set = new Set<string>(LEARNING_SCENES)
    for (const e of entries) set.add(e.scene)
    return [...set]
  }, [entries])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((e) => {
      if (sceneFilter !== "all" && e.scene !== sceneFilter) return false
      if (levelFilter !== "all" && String(e.level) !== levelFilter) return false
      if (q && !`${e.zh} ${e.ja} ${e.kana ?? ""} ${e.romaji ?? ""}`.toLowerCase().includes(q))
        return false
      return true
    })
  }, [entries, search, sceneFilter, levelFilter])

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-5 sm:px-6">
        {/* 工具条 */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-tertiary" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索中文或日语…"
              className="pl-8"
            />
          </div>
          <select
            value={sceneFilter}
            onChange={(e) => setSceneFilter(e.target.value)}
            className="h-10 rounded-md border border-border-input bg-white/78 px-2.5 text-sm text-fg"
          >
            <option value="all">全部场景</option>
            {scenes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-10 rounded-md border border-border-input bg-white/78 px-2.5 text-sm text-fg"
          >
            <option value="all">全部熟练度</option>
            {LEVEL_LABEL.map((label, i) => (
              <option key={label} value={String(i)}>
                {label}
              </option>
            ))}
          </select>
          <Button
            onClick={() => {
              setAdding(true)
              setEditing(null)
            }}
          >
            <Plus className="h-4 w-4" /> 新增
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> 导入
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4" /> 导出
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImportFile(file)
              e.target.value = ""
            }}
          />
        </div>

        {importMsg && (
          <p className="rounded-md border border-accent/30 bg-accent-soft/50 px-3 py-2 text-xs text-fg-secondary">
            {importMsg}
          </p>
        )}

        {/* 新增表单 */}
        {adding && (
          <EntryForm
            key="add"
            onSubmit={(input) => {
              addEntry(input)
              setAdding(false)
            }}
            onCancel={() => setAdding(false)}
          />
        )}

        <p className="text-xs text-fg-tertiary">
          共 {filtered.length} 条 / 全部 {entries.length} 条
        </p>

        {/* 列表 */}
        <ul className="space-y-2">
          {filtered.map((e) =>
            editing?.id === e.id ? (
              <li key={e.id}>
                <EntryForm
                  initial={e}
                  onSubmit={(input) => {
                    updateEntry(e.id, input)
                    setEditing(null)
                  }}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li
                key={e.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-white/65 p-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p lang="ja" className="font-jp-serif text-lg font-semibold leading-snug text-fg">
                    {e.ja}
                  </p>
                  {e.kana && (
                    <p lang="ja" className="font-mono text-xs text-fg-ruby">
                      {e.kana}
                    </p>
                  )}
                  <p className="text-sm text-fg-secondary">{e.zh}</p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <Badge className={sceneColorClass(e.scene)}>{e.scene}</Badge>
                    <Badge variant={e.level >= 2 ? "success" : "outline"}>
                      {LEVEL_LABEL[e.level]}
                    </Badge>
                    <span className="font-mono text-[10px] text-fg-tertiary">
                      复习 {e.reviewCount} 次 · {dueHint(e)}
                    </span>
                    {e.tags.map((t) => (
                      <Badge key={t} variant="warning">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => toggleFavorite(e.id)}
                    aria-label="收藏"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        e.tags.includes(FAVORITE_TAG)
                          ? "fill-warning text-warning"
                          : "text-fg-tertiary",
                      )}
                    />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditing(e)
                      setAdding(false)
                    }}
                    aria-label="编辑"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (confirm(`删除「${e.zh}」？`)) deleteEntry(e.id)
                    }}
                    aria-label="删除"
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-fg-tertiary">没有匹配的语料。</p>
        )}

        {/* 恢复内置语料 */}
        <div className="border-t border-border/70 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("恢复初始语料会清空所有自建句子与复习进度，确定？")) resetCorpus()
            }}
          >
            <RotateCcw className="h-4 w-4" /> 恢复初始语料
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 语料表单（新增 / 编辑共用）
// ============================================================

function EntryForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: LearningEntry
  onSubmit: (input: LearningEntryInput) => void
  onCancel: () => void
}) {
  const [zh, setZh] = useState(initial?.zh ?? "")
  const [ja, setJa] = useState(initial?.ja ?? "")
  const [scene, setScene] = useState(initial?.scene ?? LEARNING_SCENES[0])
  const [kana, setKana] = useState(initial?.kana ?? "")
  const [romaji, setRomaji] = useState(initial?.romaji ?? "")
  const [audioUrl, setAudioUrl] = useState(initial?.audioUrl ?? "")
  const [tags, setTags] = useState((initial?.tags ?? []).join(" "))
  const fieldId = useMemo(() => genId(6), [])

  const submit = () => {
    if (!zh.trim() || !ja.trim()) return
    onSubmit({
      zh,
      ja,
      scene,
      kana,
      romaji,
      audioUrl: audioUrl.trim() || undefined,
      tags: tags
        .split(/[\s,，、]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    })
  }

  return (
    <div className="space-y-2.5 rounded-lg border border-accent/30 bg-accent-soft/40 p-3">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="中文提示 *" htmlFor={`${fieldId}-zh`}>
          <Input
            id={`${fieldId}-zh`}
            value={zh}
            onChange={(e) => setZh(e.target.value)}
            placeholder="我先去洗澡。"
          />
        </Field>
        <Field label="日语答案 *" htmlFor={`${fieldId}-ja`}>
          <Input
            id={`${fieldId}-ja`}
            value={ja}
            onChange={(e) => setJa(e.target.value)}
            placeholder="先にお風呂に入ってくるね。"
            lang="ja"
          />
        </Field>
        <Field label="假名（可选）" htmlFor={`${fieldId}-kana`}>
          <Input
            id={`${fieldId}-kana`}
            value={kana}
            onChange={(e) => setKana(e.target.value)}
            placeholder="さきにおふろにはいってくるね"
            lang="ja"
          />
        </Field>
        <Field label="罗马音（可选）" htmlFor={`${fieldId}-romaji`}>
          <Input
            id={`${fieldId}-romaji`}
            value={romaji}
            onChange={(e) => setRomaji(e.target.value)}
            placeholder="saki ni ofuro ni haittekuru ne"
          />
        </Field>
        <Field label="场景" htmlFor={`${fieldId}-scene`}>
          <select
            id={`${fieldId}-scene`}
            value={scene}
            onChange={(e) => setScene(e.target.value)}
            className="h-10 w-full rounded-md border border-border-input bg-white/78 px-3 text-sm text-fg"
          >
            {LEARNING_SCENES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="标签（空格分隔，可选）" htmlFor={`${fieldId}-tags`}>
          <Input
            id={`${fieldId}-tags`}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="口语 高频"
          />
        </Field>
        <Field label="音频链接（可选，留空用 TTS）" htmlFor={`${fieldId}-audio`}>
          <Input
            id={`${fieldId}-audio`}
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://… 或 /audio/xxx.mp3"
          />
        </Field>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          取消
        </Button>
        <Button size="sm" onClick={submit} disabled={!zh.trim() || !ja.trim()}>
          {initial ? "保存" : "添加"}
        </Button>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-fg-secondary">
        {label}
      </label>
      {children}
    </div>
  )
}
