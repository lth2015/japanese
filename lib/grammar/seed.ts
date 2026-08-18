import type { GrammarExample, Register, Scene } from "./types"

/** 与 verb-corpus / tango 一致的紧凑分词写法 */
export type TokenPart = readonly [text: string, kana?: string]

/**
 * 例句书写助手。
 *
 *   ex([["会議", "かいぎ"], ["を"], ["始", "はじ"], ["めます。"]], "会议开始了。", "work")
 */
export function ex(
  parts: TokenPart[],
  chinese: string,
  scene: Scene = "life",
  register: Register = "丁寧",
): GrammarExample {
  return {
    japanese: parts.map(([text]) => text).join(""),
    tokens: parts.map(([text, kana]) => (kana ? { text, kana } : { text })),
    kana: parts.map(([text, kana]) => kana ?? text).join(""),
    chinese,
    scene,
    register,
  }
}
