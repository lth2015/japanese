/**
 * Thin wrappers around the Web Speech APIs (TTS + STT).
 * Browser-only — guard with typeof window checks before use.
 */

// === Text-to-Speech ===

let cachedJaVoice: SpeechSynthesisVoice | null = null

function getVoicesSafe(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return []
  return window.speechSynthesis.getVoices()
}

// A voice counts as Japanese by BCP-47 tag. Some platforms report "ja_JP".
function isJapaneseVoice(v: SpeechSynthesisVoice): boolean {
  return v.lang.toLowerCase().replace("_", "-").startsWith("ja")
}

export function hasJapaneseVoice(): boolean {
  return getVoicesSafe().some(isJapaneseVoice)
}

function findJapaneseVoice(): SpeechSynthesisVoice | null {
  const voices = getVoicesSafe()
  if (cachedJaVoice && voices.includes(cachedJaVoice) && isJapaneseVoice(cachedJaVoice)) {
    return cachedJaVoice
  }
  const ja = voices.filter(isJapaneseVoice)
  if (ja.length === 0) return null
  // Prefer known high-quality native/female voices, then any local voice,
  // then whatever ja-JP voice exists.
  cachedJaVoice =
    ja.find((v) =>
      /Kyoko|Otoya|Hattori|Sayaka|O-ren|Google 日本語|Google Japanese|Female/i.test(v.name),
    ) ??
    ja.find((v) => v.localService) ??
    ja[0]
  return cachedJaVoice
}

export function speakJapanese(text: string, opts: { rate?: number } = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      reject(new Error("Not in browser"))
      return
    }
    const voice = findJapaneseVoice()
    // Without an explicit Japanese voice the browser falls back to the system
    // default — often a Chinese voice that reads the kanji in Chinese. Refuse
    // rather than emit wrong-language audio; the UI surfaces a hint instead.
    if (!voice) {
      reject(new Error("no-japanese-voice"))
      return
    }
    const utter = new SpeechSynthesisUtterance(text)
    utter.voice = voice
    utter.lang = voice.lang || "ja-JP"
    utter.rate = opts.rate ?? 1
    utter.onend = () => resolve()
    utter.onerror = (e) => reject(new Error(`TTS error: ${e.error}`))
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utter)
  })
}

// Trigger and wait for the voice list to load. Chrome/Safari lazy-load voices
// and may fire `onvoiceschanged` more than once as more voices stream in, so we
// resolve only once a Japanese voice appears (or a hard timeout elapses),
// rather than on the first non-empty list.
export function ensureVoicesLoaded(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return resolve()
    if (hasJapaneseVoice()) return resolve()

    let settled = false
    let poll: ReturnType<typeof setInterval> | null = null
    let hardTimeout: ReturnType<typeof setTimeout> | null = null
    const done = () => {
      if (settled) return
      settled = true
      if (poll) clearInterval(poll)
      if (hardTimeout) clearTimeout(hardTimeout)
      window.speechSynthesis.onvoiceschanged = null
      resolve()
    }

    window.speechSynthesis.onvoiceschanged = () => {
      if (hasJapaneseVoice() || getVoicesSafe().length > 0) done()
    }
    // Some browsers never fire onvoiceschanged — poll as a backup.
    poll = setInterval(() => {
      if (hasJapaneseVoice() || getVoicesSafe().length > 0) done()
    }, 150)
    hardTimeout = setTimeout(done, 3000)
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
  isFinal: boolean
}

export type SttOptions = {
  onResult: (r: SttResult) => void
  onEnd?: () => void
  onError?: (msg: string) => void
  /** When true, fires onResult continuously as the user speaks. Default false. */
  interimResults?: boolean
}

export function startJapaneseSTT(opts: SttOptions): SttListener | null {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) {
    opts.onError?.("浏览器不支持语音识别（建议使用 Chrome / Safari）")
    return null
  }
  const rec = new Ctor()
  rec.lang = "ja-JP"
  rec.continuous = false
  rec.interimResults = opts.interimResults ?? false
  rec.maxAlternatives = 1
  rec.onresult = (event) => {
    const lastIdx = event.results.length - 1
    const lastResult = event.results[lastIdx]
    // SpeechRecognitionResult.isFinal isn't directly indexable; cheat by checking the wrapping object.
    // biome-ignore lint/suspicious/noExplicitAny: vendor API
    const isFinal = (lastResult as any).isFinal ?? false
    const alt = lastResult[0]
    opts.onResult({
      transcript: alt.transcript,
      confidence: alt.confidence ?? 1,
      isFinal,
    })
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
