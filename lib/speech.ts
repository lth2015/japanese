/**
 * Thin wrappers around the Web Speech APIs (TTS + STT).
 * Browser-only — guard with typeof window checks before use.
 */

// === Text-to-Speech ===

let cachedJaVoice: SpeechSynthesisVoice | null = null

function findJapaneseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined") return null
  const voices = window.speechSynthesis.getVoices()
  if (cachedJaVoice && voices.includes(cachedJaVoice)) return cachedJaVoice
  // Prefer female-sounding native voices; fall back to anything ja-JP.
  const ja = voices.filter((v) => v.lang.startsWith("ja"))
  if (ja.length === 0) return null
  cachedJaVoice = ja.find((v) => /Kyoko|Otoya|Hattori|Sayaka|Female/i.test(v.name)) ?? ja[0]
  return cachedJaVoice
}

export function speakJapanese(text: string, opts: { rate?: number } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Not in browser"))
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = "ja-JP"
    utter.rate = opts.rate ?? 1
    const voice = findJapaneseVoice()
    if (voice) utter.voice = voice
    utter.onend = () => resolve()
    utter.onerror = (e) => reject(new Error(`TTS error: ${e.error}`))
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  })
}

// Trigger voice list load (Chrome lazy-loads)
export function ensureVoicesLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve()
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) return resolve()
    window.speechSynthesis.onvoiceschanged = () => resolve()
    // Backup timeout
    setTimeout(resolve, 800)
  })
}

// === Speech-to-Text (Web Speech API) ===

// Web Speech API isn't in standard lib.d.ts; keep a minimal type stub.
type SpeechRecognitionResult = { transcript: string; isFinal: boolean; confidence: number }
type SpeechRecognitionEvent = { results: ArrayLike<ArrayLike<SpeechRecognitionResult>> }

interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start(): void
  stop(): void
  abort(): void
}

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  if (typeof window === "undefined") return null
  // biome-ignore lint/suspicious/noExplicitAny: vendor-prefixed API
  const w = window as any
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition) ?? null
}

export function isSttSupported(): boolean {
  return getSpeechRecognitionCtor() !== null
}

export type SttListener = {
  abort: () => void
}

export type SttResult = {
  transcript: string
  confidence: number
}

export function startJapaneseSTT(opts: {
  onResult: (r: SttResult) => void
  onEnd?: () => void
  onError?: (msg: string) => void
}): SttListener | null {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) {
    opts.onError?.("浏览器不支持语音识别（建议使用 Chrome / Safari）")
    return null
  }
  const rec = new Ctor()
  rec.lang = "ja-JP"
  rec.continuous = false
  rec.interimResults = false
  rec.maxAlternatives = 1
  rec.onresult = (event) => {
    const res = event.results[event.results.length - 1][0]
    opts.onResult({ transcript: res.transcript, confidence: res.confidence ?? 1 })
  }
  rec.onend = () => opts.onEnd?.()
  rec.onerror = (e) => opts.onError?.(e.error ?? "unknown error")
  try {
    rec.start()
  } catch (e) {
    opts.onError?.(e instanceof Error ? e.message : "STT start failed")
    return null
  }
  return { abort: () => rec.abort() }
}
