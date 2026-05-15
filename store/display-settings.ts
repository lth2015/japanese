"use client"

import { useEffect, useState } from "react"

export type FontSize = "S" | "M" | "L" | "XL"
export type DisplayQueueSource = "all" | "rescue" | "progress" | "request" | "apology" | "smalltalk" | "daily" | "grammar"
export type DisplayTheme = "light" | "ambient-dark"

export type DisplaySettings = {
  intervalSec: number // 4..30
  source: DisplayQueueSource
  fontSize: FontSize
  showKana: boolean
  showChinese: boolean
  autoPlayTTS: boolean
  focusMode: boolean
  theme: DisplayTheme
}

const KEY = "nihongo:display-settings-v2"

const DEFAULT_SETTINGS: DisplaySettings = {
  intervalSec: 5,
  source: "all",
  fontSize: "L",
  showKana: true,
  showChinese: true,
  autoPlayTTS: false,
  focusMode: false,
  theme: "light",
}

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

/**
 * Font size for Display ambient mode. The one place in the app where extreme
 * typography is the point — JP must dominate at every viewport. CN sits at a
 * fixed small range (see display-ticker), so these are calibrated to keep
 * JP ≥3x CN even at the smallest setting on the narrowest screen.
 */
// L (default): ~60px @ 320 mobile, ~115px @ 1280 desktop, 152px cap @ 1700+.
// Calibrated so a 6-10 char JP sentence fits in 1-2 lines on a 1500px screen
// — dominant but not overwhelming. JP/CN ratio stays ≥3.5x at every viewport.
// NOTE: `length:` prefix is REQUIRED — without it, tailwind-merge sees
// `text-[clamp(...)]` next to `text-fg` (color) and can't disambiguate,
// dropping the font-size class. The literal `length:` tells twMerge this
// is unambiguously a size. Don't remove it.
export const FONT_SIZE_CLASS: Record<FontSize, string> = {
  S: "text-[length:clamp(2.75rem,6vw,6rem)]",
  M: "text-[length:clamp(3.25rem,7.5vw,7.5rem)]",
  L: "text-[length:clamp(3.75rem,9vw,9.5rem)]",
  XL: "text-[length:clamp(4.5rem,11vw,12rem)]",
}
