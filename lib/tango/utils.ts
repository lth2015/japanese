import { conjugateAdjective, conjugateVerb } from "@/lib/conjugation"
import { getTangoGroup } from "./groups"
import type { Pos, TangoCard, TangoEntry, TangoGroupId } from "./types"

/**
 * 词条 → 轮播卡片。动词/形容词的活用表在这一步由 lib/conjugation 派生，
 * 语料里不存变形，所以 /tango 和 /verbs 的结果不可能对不上。
 */
export function flattenTangoCards(entries: TangoEntry[]): TangoCard[] {
  return entries.map((entry) => {
    const group = getTangoGroup(entry.groupId)
    const surface = entry.kanji ?? entry.kana

    if (entry.pos === "動詞") {
      if (!entry.verbGroup) throw new Error(`动词缺少 verbGroup：${entry.id}`)
      return { ...entry, group, verbForms: conjugateVerb(surface, entry.kana, entry.verbGroup) }
    }

    if (entry.pos === "イ形容詞" || entry.pos === "ナ形容詞") {
      if (!entry.adjType) throw new Error(`形容词缺少 adjType：${entry.id}`)
      return { ...entry, group, adjForms: conjugateAdjective(surface, entry.kana, entry.adjType) }
    }

    return { ...entry, group }
  })
}

export type TangoFilters = {
  groupId: TangoGroupId | "all"
  pos: Pos | "all"
  /** 只看有活用表的词（动词 + 形容词），用于集中练变形 */
  onlyConjugatable: boolean
}

export function filterTangoCards(cards: TangoCard[], filters: TangoFilters): TangoCard[] {
  return cards.filter((card) => {
    if (filters.groupId !== "all" && card.groupId !== filters.groupId) return false
    if (filters.pos !== "all" && card.pos !== filters.pos) return false
    if (filters.onlyConjugatable && !card.verbForms && !card.adjForms) return false
    return true
  })
}

/** 卡片正面显示的表记：有汉字用汉字，没有就用假名 */
export function getSurface(card: TangoCard): string {
  return card.kanji ?? card.kana
}
