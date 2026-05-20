"use client"

/**
 * /learning 语料的 localStorage 存储 + 间隔复习逻辑。
 *
 * 完全独立于 /display 的 SQLite `sentence` 表 —— 这里只用浏览器
 * localStorage（key: nihongo:learning-corpus-v1），避免数据库迁移、保证
 * 每次反馈都能即时落盘。订阅模式与 store/display-settings.ts 一致。
 *
 * 后续要换成服务端 / SQLite，只需替换 read()/write() 两个函数。
 */

import { id as genId } from "@/lib/id"
import { sm2 as sm2Step } from "@/lib/sm2"
import { useEffect, useState } from "react"
import { LEARNING_SEED, type SeedEntry } from "./seed"
import type { Feedback, LearningEntry, LearningEntryInput, LearningSm2 } from "./types"

const KEY = "nihongo:learning-corpus-v1"
// 记录「哪些内置种子已经注入过」，使后续新增的种子能自动补给老用户，
// 同时尊重用户手动删除（删过的 id 已在此集合中，不会被重新加回）。
const SEEDED_KEY = "nihongo:learning-seeded-v1"
const DAY_MS = 86_400_000

const ALL_SEED_IDS = LEARNING_SEED.map((s) => s.id)

/** SM-2 初始状态：从未复习过的句子。 */
const DEFAULT_SM2: LearningSm2 = { easeFactor: 2.5, intervalDays: 0, repetitions: 0 }

/** 「太简单」直接跳到的「已掌握」状态：7 天后再复习。 */
const MASTERED_SM2: LearningSm2 = { easeFactor: 2.6, intervalDays: 7, repetitions: 3 }

/** 「加入重点复习」用的标签。 */
export const FOCUS_TAG = "重点"

/** 「收藏」用的标签。 */
export const FAVORITE_TAG = "收藏"

/** 碎片超短句的标签——「口语流」里加权出现。 */
export const SHORT_TAG = "超短"

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** SM-2 的 repetitions 映射到 UI 用的 0-3 熟练度。 */
function repsToLevel(reps: number): number {
  return Math.max(0, Math.min(3, reps))
}

let cache: LearningEntry[] | null = null
const listeners = new Set<(entries: LearningEntry[]) => void>()

function nowIso(): string {
  return new Date().toISOString()
}

/** 把单条种子展开成完整 LearningEntry（补全运行期字段）。 */
function expandSeed(s: SeedEntry): LearningEntry {
  const ts = nowIso()
  return {
    id: s.id,
    zh: s.zh,
    ja: s.ja,
    kana: s.kana,
    romaji: s.romaji,
    scene: s.scene,
    level: 0,
    variants: s.variants,
    tags: s.tags ?? [],
    createdAt: ts,
    updatedAt: ts,
    reviewCount: 0,
  }
}

function seedEntries(): LearningEntry[] {
  return LEARNING_SEED.map(expandSeed)
}

function loadSeededIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(SEEDED_KEY)
    const arr = raw ? JSON.parse(raw) : null
    return Array.isArray(arr) ? new Set(arr as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveSeededIds(ids: string[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SEEDED_KEY, JSON.stringify(ids))
  } catch {
    // ignore
  }
}

function read(): LearningEntry[] {
  if (cache) return cache
  if (typeof window === "undefined") return seedEntries()
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) {
      // 首次打开：注入全部内置语料
      const seeded = seedEntries()
      window.localStorage.setItem(KEY, JSON.stringify(seeded))
      saveSeededIds(ALL_SEED_IDS)
      cache = seeded
      return seeded
    }
    const parsed = JSON.parse(raw)
    let entries: LearningEntry[] = Array.isArray(parsed)
      ? (parsed as LearningEntry[])
      : seedEntries()

    // 合并后续新增的内置语料：补进「从未注入过」的种子条目。
    let seededIds = loadSeededIds()
    if (seededIds.size === 0) {
      // 迁移：本机制上线前已 seed 过的用户——以现存语料里已有的种子 id 为基线，
      // 避免把老的 50 条种子重复加入。
      const present = new Set(entries.map((e) => e.id))
      seededIds = new Set(ALL_SEED_IDS.filter((id) => present.has(id)))
    }
    const fresh = LEARNING_SEED.filter((s) => !seededIds.has(s.id))
    if (fresh.length > 0) {
      entries = [...fresh.map(expandSeed), ...entries]
      window.localStorage.setItem(KEY, JSON.stringify(entries))
    }
    saveSeededIds(ALL_SEED_IDS)

    cache = entries
    return entries
  } catch {
    return seedEntries()
  }
}

function write(next: LearningEntry[]) {
  cache = next
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      // localStorage 不可用（隐私模式 / 配额）——忽略，至少内存里是对的。
    }
  }
  for (const fn of listeners) fn(next)
}

// === CRUD ===

export function addEntry(input: LearningEntryInput): LearningEntry {
  const ts = nowIso()
  const entry: LearningEntry = {
    id: genId(),
    zh: input.zh.trim(),
    ja: input.ja.trim(),
    kana: input.kana?.trim() || undefined,
    romaji: input.romaji?.trim() || undefined,
    scene: input.scene.trim(),
    level: 0,
    tags: input.tags ?? [],
    audioUrl: input.audioUrl,
    createdAt: ts,
    updatedAt: ts,
    reviewCount: 0,
  }
  write([entry, ...read()])
  return entry
}

export function updateEntry(entryId: string, patch: LearningEntryInput) {
  write(
    read().map((e) =>
      e.id === entryId
        ? {
            ...e,
            zh: patch.zh.trim(),
            ja: patch.ja.trim(),
            kana: patch.kana?.trim() || undefined,
            romaji: patch.romaji?.trim() || undefined,
            scene: patch.scene.trim(),
            tags: patch.tags ?? e.tags,
            audioUrl: patch.audioUrl,
            updatedAt: nowIso(),
          }
        : e,
    ),
  )
}

export function deleteEntry(entryId: string) {
  write(read().filter((e) => e.id !== entryId))
}

/** 切换一条语料的「收藏」状态（通过增删 收藏 标签实现）。 */
export function toggleFavorite(entryId: string) {
  write(
    read().map((e) => {
      if (e.id !== entryId) return e
      const has = e.tags.includes(FAVORITE_TAG)
      return {
        ...e,
        tags: has ? e.tags.filter((t) => t !== FAVORITE_TAG) : [...e.tags, FAVORITE_TAG],
        updatedAt: nowIso(),
      }
    }),
  )
}

/** 清空 localStorage 并重新注入内置语料。 */
export function resetCorpus() {
  cache = null
  if (typeof window !== "undefined") window.localStorage.removeItem(KEY)
  saveSeededIds(ALL_SEED_IDS)
  write(seedEntries())
}

// === 间隔复习 ===

/**
 * 记录一次复习反馈，用 SM-2 算法更新复习状态：
 * - known 我会了：SM-2 quality 4，间隔按算法增长
 * - unknown 还不会：SM-2 quality 2（判为失败，重置间隔为 1 天、熟练度归 0）
 * - easy  太简单：直接跳到「已掌握」状态，7 天后再复习
 * - focus 加入重点复习：打上「重点」标签、立即到期，不改动 SM-2 进度
 *
 * `level`（0-3）由 SM-2 的 repetitions 推导，仅用于 UI 展示与队列排序。
 */
export function recordFeedback(entryId: string, fb: Feedback) {
  const now = Date.now()
  write(
    read().map((e) => {
      if (e.id !== entryId) return e
      let tags = e.tags
      let sm2State = e.sm2 ?? DEFAULT_SM2
      let nextReviewMs: number

      if (fb === "focus") {
        if (!tags.includes(FOCUS_TAG)) tags = [...tags, FOCUS_TAG]
        nextReviewMs = now // 立即再练，SM-2 状态不变
      } else if (fb === "easy") {
        sm2State = MASTERED_SM2
        nextReviewMs = now + MASTERED_SM2.intervalDays * DAY_MS
      } else {
        // known -> quality 4；unknown -> quality 2（< 3 视为失败，SM-2 自动重置）
        sm2State = sm2Step(sm2State, fb === "known" ? 4 : 2)
        nextReviewMs = now + sm2State.intervalDays * DAY_MS
      }

      return {
        ...e,
        sm2: sm2State,
        level: repsToLevel(sm2State.repetitions),
        tags,
        reviewCount: e.reviewCount + 1,
        lastReviewedAt: new Date(now).toISOString(),
        nextReviewAt: new Date(nextReviewMs).toISOString(),
        updatedAt: new Date(now).toISOString(),
      }
    }),
  )
}

/** 一条句子是否「该复习」：从未复习过、或下次复习时间已到。 */
export function isDue(entry: LearningEntry, now = Date.now()): boolean {
  if (!entry.nextReviewAt) return true
  return new Date(entry.nextReviewAt).getTime() <= now
}

/**
 * 构建训练队列：
 * 1. 已到期 / 新句子优先
 * 2. 熟练度低的优先
 * 3. 复习次数少的优先
 */
export function buildQueue(entries: LearningEntry[]): LearningEntry[] {
  const now = Date.now()
  return [...entries].sort((a, b) => {
    const aDue = isDue(a, now) ? 0 : 1
    const bDue = isDue(b, now) ? 0 : 1
    if (aDue !== bDue) return aDue - bDue
    if (a.level !== b.level) return a.level - b.level
    if (a.reviewCount !== b.reviewCount) return a.reviewCount - b.reviewCount
    const an = a.nextReviewAt ? new Date(a.nextReviewAt).getTime() : 0
    const bn = b.nextReviewAt ? new Date(b.nextReviewAt).getTime() : 0
    return an - bn
  })
}

/**
 * 每日学习队列：默认 15 条新句 + 最多 50 条到期旧句，打乱后交错出现。
 * 「新句」= 从未复习过；「旧句」= 复习过且已到期。让用户感觉是「又见面」，
 * 而不是「背单词」。今天既无新句也无到期复习时，退化为完整队列避免空场。
 */
export function buildDailySession(
  entries: LearningEntry[],
  opts?: { newCount?: number; reviewCap?: number },
): LearningEntry[] {
  const newCount = opts?.newCount ?? 15
  const reviewCap = opts?.reviewCap ?? 50
  const ordered = buildQueue(entries)
  const fresh = ordered.filter((e) => e.reviewCount === 0).slice(0, newCount)
  const reviews = ordered.filter((e) => e.reviewCount > 0 && isDue(e)).slice(0, reviewCap)
  const combined = shuffle([...fresh, ...reviews])
  return combined.length > 0 ? combined : ordered
}

/**
 * 「口语流」队列：完全随机、不按分类，超短句双倍权重高频穿插，
 * 像刷短视频一样让第二屏一直有「日本人碎碎念」。
 */
export function buildStreamQueue(entries: LearningEntry[]): LearningEntry[] {
  const weighted: LearningEntry[] = []
  for (const e of entries) {
    weighted.push(e)
    if (e.tags.includes(SHORT_TAG)) weighted.push(e)
  }
  return shuffle(weighted)
}

// === 每日活动量（接触 / 听） ===

export type DailyActivity = { date: string; touched: number; heard: number }

const ACTIVITY_KEY = "nihongo:learning-activity-v1"
const activityListeners = new Set<(a: DailyActivity) => void>()

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

/** 读取今天的活动量；跨天自动归零。 */
export function getDailyActivity(): DailyActivity {
  const today = todayKey()
  if (typeof window === "undefined") return { date: today, touched: 0, heard: 0 }
  try {
    const raw = window.localStorage.getItem(ACTIVITY_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && parsed.date === today) return parsed as DailyActivity
  } catch {
    // ignore
  }
  return { date: today, touched: 0, heard: 0 }
}

/** 记一次活动：touched = 接触了一条表达，heard = 听了一次日语。 */
export function bumpActivity(kind: "touched" | "heard"): DailyActivity {
  const cur = getDailyActivity()
  const next: DailyActivity = { ...cur, [kind]: cur[kind] + 1 }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(next))
    } catch {
      // ignore
    }
  }
  for (const fn of activityListeners) fn(next)
  return next
}

// === 统计 ===

export type CorpusStats = {
  total: number
  due: number // 当前到期 / 待复习
  byLevel: [number, number, number, number] // 各熟练度句数
  mastered: number // level 3
  reviewedToday: number // 今日已复习句数
  totalReviews: number // 累计复习次数
  focusCount: number // 重点句数
  byScene: { scene: string; total: number; mastered: number }[]
}

/** 汇总语料的学习进度，用于「进度」视图。 */
export function getStats(entries: LearningEntry[]): CorpusStats {
  const now = Date.now()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const byLevel: [number, number, number, number] = [0, 0, 0, 0]
  const sceneMap = new Map<string, { total: number; mastered: number }>()
  let due = 0
  let reviewedToday = 0
  let totalReviews = 0
  let focusCount = 0

  for (const e of entries) {
    const lvl = Math.max(0, Math.min(3, e.level)) as 0 | 1 | 2 | 3
    byLevel[lvl] += 1
    if (isDue(e, now)) due += 1
    if (e.lastReviewedAt && new Date(e.lastReviewedAt).getTime() >= todayStart.getTime()) {
      reviewedToday += 1
    }
    totalReviews += e.reviewCount
    if (e.tags.includes(FOCUS_TAG)) focusCount += 1

    const s = sceneMap.get(e.scene) ?? { total: 0, mastered: 0 }
    s.total += 1
    if (lvl >= 3) s.mastered += 1
    sceneMap.set(e.scene, s)
  }

  return {
    total: entries.length,
    due,
    byLevel,
    mastered: byLevel[3],
    reviewedToday,
    totalReviews,
    focusCount,
    byScene: [...sceneMap.entries()]
      .map(([scene, v]) => ({ scene, ...v }))
      .sort((a, b) => b.total - a.total),
  }
}

// === 导入 / 导出 ===

/** 当前全部语料，用于导出备份。 */
export function exportEntries(): LearningEntry[] {
  return read()
}

/**
 * 导入语料：接受一个数组，每项至少含 zh / ja。
 * 兼容两种形态——精简的语料包（只有 zh/ja/scene/...）与完整导出（含进度字段）：
 * 进度字段若存在则保留，id 一律重新生成以避免与现有语料冲突。
 * 返回成功导入的条数。
 */
export function importEntries(items: unknown): number {
  if (!Array.isArray(items)) throw new Error("格式错误：JSON 顶层需为数组")
  const ts = nowIso()
  const valid: LearningEntry[] = []
  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue
    const r = raw as Record<string, unknown>
    if (typeof r.zh !== "string" || typeof r.ja !== "string") continue
    if (!r.zh.trim() || !r.ja.trim()) continue
    const lvl = typeof r.level === "number" ? Math.max(0, Math.min(3, Math.round(r.level))) : 0
    const s = r.sm2 as Record<string, unknown> | undefined
    const sm2State: LearningSm2 | undefined =
      s &&
      typeof s.easeFactor === "number" &&
      typeof s.intervalDays === "number" &&
      typeof s.repetitions === "number"
        ? { easeFactor: s.easeFactor, intervalDays: s.intervalDays, repetitions: s.repetitions }
        : undefined
    const v = r.variants as Record<string, unknown> | undefined
    const pickStr = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim() : undefined)
    const variants =
      v && (pickStr(v.casual) || pickStr(v.normal) || pickStr(v.polite))
        ? { casual: pickStr(v.casual), normal: pickStr(v.normal), polite: pickStr(v.polite) }
        : undefined
    valid.push({
      id: genId(),
      zh: r.zh.trim(),
      ja: r.ja.trim(),
      kana: typeof r.kana === "string" ? r.kana.trim() || undefined : undefined,
      romaji: typeof r.romaji === "string" ? r.romaji.trim() || undefined : undefined,
      scene: typeof r.scene === "string" && r.scene.trim() ? r.scene.trim() : "闲聊",
      level: lvl,
      sm2: sm2State,
      variants,
      tags: Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string") : [],
      audioUrl: typeof r.audioUrl === "string" ? r.audioUrl : undefined,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : ts,
      updatedAt: ts,
      reviewCount: typeof r.reviewCount === "number" ? r.reviewCount : 0,
      lastReviewedAt: typeof r.lastReviewedAt === "string" ? r.lastReviewedAt : undefined,
      nextReviewAt: typeof r.nextReviewAt === "string" ? r.nextReviewAt : undefined,
    })
  }
  if (valid.length === 0) throw new Error("没有可导入的有效语料（每项至少需要 zh 和 ja）")
  write([...valid, ...read()])
  return valid.length
}

// === React hook ===

/** 订阅 learning 语料；ready 表示已从 localStorage 读取完成。 */
export function useLearningCorpus(): { entries: LearningEntry[]; ready: boolean } {
  const [entries, setEntries] = useState<LearningEntry[]>([])
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setEntries(read())
    setReady(true)
    const fn = (next: LearningEntry[]) => setEntries([...next])
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return { entries, ready }
}

/** 订阅今天的活动量（接触条数 / 听日语次数）。 */
export function useDailyActivity(): DailyActivity {
  const [state, setState] = useState<DailyActivity>({ date: "", touched: 0, heard: 0 })
  useEffect(() => {
    setState(getDailyActivity())
    const fn = (a: DailyActivity) => setState(a)
    activityListeners.add(fn)
    return () => {
      activityListeners.delete(fn)
    }
  }, [])
  return state
}
