"use client"

import type { Pos, TangoGroupId } from "@/lib/tango/types"
import { useEffect, useState } from "react"

export type TangoSettings = {
  intervalSec: number // 2..30，轮播停顿秒数
  ttsRate: number // 0.5..1.5，浏览器 TTS 语速
  showKana: boolean
  showChinese: boolean
  showExample: boolean
  /** 动词/形容词的活用小表 */
  showForms: boolean
  autoPlayTTS: boolean
  filterGroup: TangoGroupId | "all"
  filterPos: Pos | "all"
  onlyConjugatable: boolean
  /** 标记「我会了」的词条 id；从轮播队列隐藏，但仍在索引条上 */
  knownIds: string[]
}

const KEY = "nihongo:tango-settings-v1"

const DEFAULT_SETTINGS: TangoSettings = {
  intervalSec: 5,
  ttsRate: 0.9,
  showKana: true,
  showChinese: true,
  showExample: true,
  showForms: true,
  autoPlayTTS: false,
  filterGroup: "all",
  filterPos: "all",
  onlyConjugatable: false,
  knownIds: [],
}

const listeners = new Set<(s: TangoSettings) => void>()
let current: TangoSettings = DEFAULT_SETTINGS

function load(): TangoSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function save(next: TangoSettings) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  }
}

export function setTangoSettings(patch: Partial<TangoSettings>) {
  current = { ...current, ...patch }
  save(current)
  for (const fn of listeners) fn(current)
}

export function useTangoSettings(): [TangoSettings, (patch: Partial<TangoSettings>) => void] {
  const [settings, setSettings] = useState<TangoSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    current = load()
    setSettings(current)
    const fn = (s: TangoSettings) => setSettings(s)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])

  return [settings, setTangoSettings]
}
