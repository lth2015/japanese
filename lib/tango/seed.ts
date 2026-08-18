import type { Token } from "@/lib/db/schema"
import type { AdjectiveType, Pos, TangoEntry, TangoGroupId, VerbGroup } from "./types"

/** 与 verb-corpus 一致的紧凑分词写法：["漢字", "かんじ"] 或 ["ひらがな"] */
export type TokenPart = readonly [text: string, kana?: string]

/**
 * 词条的书写格式。字段名刻意短——语料文件会有几百条，
 * 每条写成完整对象会把文件撑爆。
 */
export type EntrySeed = {
  /** 组内唯一后缀，最终 id = `${groupId}-${id}` */
  id: string
  /** 假名读法 */
  kana: string
  /** 汉字 / 片假名表记。纯平假名词不写 */
  kanji?: string
  /** 中文释义 */
  zh: string
  pos: Pos
  /** pos === "動詞" 时必填 */
  vg?: VerbGroup
  /** pos 是形容词时必填 */
  adj?: AdjectiveType
  /** 词本身的分词覆盖。自动拆分不理想时才写 */
  tokens?: TokenPart[]
  /** 同义词 / 异写 */
  syn?: string[]
  /** 用法提示，或对原图的勘误说明 */
  note?: string
  /** 例句分词 */
  ex: TokenPart[]
  /** 例句中文 */
  exZh: string
}

const KANA_RE = /^[぀-ゟ゠-ヿー]$/

function isKana(ch: string): boolean {
  return KANA_RE.test(ch)
}

/**
 * 自动给词条拆 ruby：把表记和读音两头相同的假名（送假名、词头的お等）剥掉，
 * 只给中间真正需要注音的部分挂 ruby。
 *
 *   食べる / たべる → 食(た)べる
 *   お茶   / おちゃ → お茶(ちゃ)
 *   犬     / いぬ   → 犬(いぬ)      两头都没共同假名，整体注音
 *   大人   / おとな → 大人(おとな)  熟字訓，整体注音（正确）
 */
export function splitRuby(kanji: string, kana: string): Token[] {
  let head = 0
  while (
    head < kanji.length &&
    head < kana.length &&
    kanji[head] === kana[head] &&
    isKana(kanji[head])
  ) {
    head++
  }

  let tail = 0
  while (
    tail < kanji.length - head &&
    tail < kana.length - head &&
    kanji[kanji.length - 1 - tail] === kana[kana.length - 1 - tail] &&
    isKana(kanji[kanji.length - 1 - tail])
  ) {
    tail++
  }

  const prefix = kanji.slice(0, head)
  const core = kanji.slice(head, kanji.length - tail)
  const suffix = kanji.slice(kanji.length - tail)
  const coreKana = kana.slice(head, kana.length - tail)

  const tokens: Token[] = []
  if (prefix) tokens.push({ text: prefix })
  if (core)
    tokens.push(coreKana && coreKana !== core ? { text: core, kana: coreKana } : { text: core })
  if (suffix) tokens.push({ text: suffix })
  return tokens.length > 0 ? tokens : [{ text: kanji }]
}

function partsToTokens(parts: TokenPart[]): Token[] {
  return parts.map(([text, kana]) => (kana ? { text, kana } : { text }))
}

function partsToText(parts: TokenPart[]): string {
  return parts.map(([text]) => text).join("")
}

function partsToKana(parts: TokenPart[]): string {
  return parts.map(([text, kana]) => kana ?? text).join("")
}

/** 把一组紧凑 seed 展开成完整词条 */
export function makeEntries(groupId: TangoGroupId, seeds: EntrySeed[]): TangoEntry[] {
  return seeds.map((seed) => {
    const surface = seed.kanji ?? seed.kana
    return {
      id: `${groupId}-${seed.id}`,
      groupId,
      kana: seed.kana,
      kanji: seed.kanji,
      tokens: seed.tokens
        ? partsToTokens(seed.tokens)
        : seed.kanji
          ? splitRuby(seed.kanji, seed.kana)
          : [{ text: surface }],
      chineseZh: seed.zh,
      pos: seed.pos,
      verbGroup: seed.vg,
      adjType: seed.adj,
      synonyms: seed.syn,
      note: seed.note,
      example: {
        japanese: partsToText(seed.ex),
        tokens: partsToTokens(seed.ex),
        kana: partsToKana(seed.ex),
        chinese: seed.exZh,
      },
    }
  })
}
