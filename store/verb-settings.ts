"use client"

import type { ConjugationType, Scene, VerbGroup } from "@/lib/verbs/types"
import { useEffect, useState } from "react"

export type VerbSettings = {
  intervalSec: number // 2..30，轮播停顿秒数
  ttsRate: number // 0.5..1.5，浏览器 TTS 语速
  showKana: boolean
  showChinese: boolean
  showPatternHint: boolean
  autoPlayTTS: boolean
  filterConjugation: ConjugationType | "all"
  filterScene: Scene | "all"
  filterGroup: VerbGroup | "all"
  /** 用户标记「我会了」的动词 id 列表；这些动词从轮播队列里隐藏，但仍出现在索引条上 */
  knownVerbIds: string[]
}

const KEY = "nihongo:verb-settings-v1"

const DEFAULT_SETTINGS: VerbSettings = {
  intervalSec: 6,
  ttsRate: 0.9,
  showKana: true,
  showChinese: true,
  showPatternHint: true,
  autoPlayTTS: false,
  filterConjugation: "all",
  filterScene: "all",
  filterGroup: "all",
  knownVerbIds: [],
}

const listeners = new Set<(s: VerbSettings) => void>()
let current: VerbSettings = DEFAULT_SETTINGS

function load(): VerbSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function save(next: VerbSettings) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  }
}

export function setVerbSettings(patch: Partial<VerbSettings>) {
  current = { ...current, ...patch }
  save(current)
  for (const fn of listeners) fn(current)
}

export function useVerbSettings(): [VerbSettings, typeof setVerbSettings] {
  const [state, setState] = useState<VerbSettings>(current)
  useEffect(() => {
    current = load()
    setState(current)
    const fn = (s: VerbSettings) => setState(s)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return [state, setVerbSettings]
}
