"use client"

import { useEffect, useState } from "react"

export type FontSize = "S" | "M" | "L" | "XL"
export type DisplayQueueSource = "all" | "rescue" | "progress" | "request" | "apology" | "smalltalk"

export type DisplaySettings = {
  intervalSec: number // 4..30
  source: DisplayQueueSource
  fontSize: FontSize
  showKana: boolean
  showChinese: boolean
  autoPlayTTS: boolean
  focusMode: boolean // hide ALL chrome
}

const KEY = "nihongo:display-settings"

const DEFAULT_SETTINGS: DisplaySettings = {
  intervalSec: 8,
  source: "all",
  fontSize: "L",
  showKana: true,
  showChinese: true,
  autoPlayTTS: false,
  focusMode: false,
}

// Tiny localStorage-backed store. Avoids zustand-persist complexity for one slice of state.
const listeners = new Set<(s: DisplaySettings) => void>()
let current: DisplaySettings = DEFAULT_SETTINGS

function load(): DisplaySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function save(next: DisplaySettings) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next))
  }
}

export function setDisplaySettings(patch: Partial<DisplaySettings>) {
  current = { ...current, ...patch }
  save(current)
  for (const fn of listeners) fn(current)
}

export function useDisplaySettings(): [DisplaySettings, typeof setDisplaySettings] {
  const [state, setState] = useState<DisplaySettings>(current)
  useEffect(() => {
    current = load()
    setState(current)
    const fn = (s: DisplaySettings) => setState(s)
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  }, [])
  return [state, setDisplaySettings]
}

export const FONT_SIZE_CLASS: Record<FontSize, string> = {
  S: "text-[2rem] sm:text-[2.5rem] lg:text-[3rem]",
  M: "text-[2.5rem] sm:text-[3rem] lg:text-[4rem]",
  L: "text-[3rem] sm:text-[4rem] lg:text-[5.5rem]",
  XL: "text-[3.5rem] sm:text-[5rem] lg:text-[7rem]",
}
