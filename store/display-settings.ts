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
  intervalSec: 8,
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
 * Font size for Display ambient mode. These ARE allowed to be huge (this is the
 * one place in the app where extreme typography is the point —副屏挂机). The
 * non-ambient Display fallback uses .text-ambient (clamp 48-128px).
 */
// Fluid clamp() — JP scales smoothly with viewport, no breakpoint dead zones.
// Min ensures JP is substantial on mobile; max caps growth on huge monitors.
// L (default): ~56px @ 320 mobile, ~106px @ 960 tablet, ~176px @ 1920 desktop.
export const FONT_SIZE_CLASS: Record<FontSize, string> = {
  S: "text-[clamp(2.25rem,7vw,7.5rem)]",
  M: "text-[clamp(2.75rem,9vw,10rem)]",
  L: "text-[clamp(3.5rem,11vw,12.5rem)]",
  XL: "text-[clamp(4.25rem,13.5vw,15rem)]",
}
