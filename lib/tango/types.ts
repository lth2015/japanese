import type { AdjectiveForms, AdjectiveType, VerbForms, VerbGroup } from "@/lib/conjugation"
import type { Token } from "@/lib/db/schema"

/** 日语十一种词性。对应语法体系图「二、10种单词词性」，另补了接続詞。 */
export type Pos =
  | "名詞"
  | "動詞"
  | "イ形容詞"
  | "ナ形容詞"
  | "副詞"
  | "助詞"
  | "代名詞"
  | "連体詞"
  | "数詞"
  | "感動詞"
  | "接続詞"

export const POS_LIST: Pos[] = [
  "名詞",
  "動詞",
  "イ形容詞",
  "ナ形容詞",
  "副詞",
  "助詞",
  "代名詞",
  "連体詞",
  "数詞",
  "感動詞",
  "接続詞",
]

/** 词性的中文说明，卡片上贴在 badge 旁边 */
export const POS_LABEL_ZH: Record<Pos, string> = {
  名詞: "名词",
  動詞: "动词",
  イ形容詞: "イ形容词",
  ナ形容詞: "ナ形容词",
  副詞: "副词",
  助詞: "助词",
  代名詞: "代词",
  連体詞: "连体词",
  数詞: "数词",
  感動詞: "感叹词",
  接続詞: "接续词",
}

export type TangoGroupId = string

export type TangoGroup = {
  id: TangoGroupId
  /** 原图用 "Group N" 编号，这里沿用，方便和图片对照 */
  no: number
  nameZh: string
  nameJa: string
  /** 1 = 最基础，3 = 进阶。用于「由浅入深」的默认播放顺序 */
  level: 1 | 2 | 3
  /** 目标词数，check:tango 用它判定这一组是否补全 */
  targetCount: number
}

export type TangoExample = {
  japanese: string
  tokens: Token[]
  kana: string
  chinese: string
}

/**
 * 一个词条。注意：**不存活用形** —— 动词/形容词的变形一律由
 * lib/conjugation 在 flattenTangoCards() 里派生，语料里只声明分类。
 * 这样 /tango 和 /verbs 的变形结果不可能对不上。
 */
export type TangoEntry = {
  id: string
  groupId: TangoGroupId
  /** 假名读法，如「いぬ」 */
  kana: string
  /** 汉字/片假名表记，如「犬」。纯假名词不写 */
  kanji?: string
  /** 词本身的 ruby 分词。不写则从 kanji + kana 自动生成 */
  tokens?: Token[]
  chineseZh: string
  pos: Pos
  /** pos 为「動詞」时必填 */
  verbGroup?: VerbGroup
  /** pos 为「イ形容詞 / ナ形容詞」时必填 */
  adjType?: AdjectiveType
  /** 同义/异写，如 さかな 的 うお */
  synonyms?: string[]
  /** 用法提示或对原图的勘误说明 */
  note?: string
  example: TangoExample
}

/** 摊平后的轮播单元：词条 + 所属组 + 派生出来的活用表 */
export type TangoCard = TangoEntry & {
  group: TangoGroup
  verbForms?: VerbForms
  adjForms?: AdjectiveForms
}

export type { AdjectiveType, VerbGroup }
