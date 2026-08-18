import { CH01_POINTS } from "./chapters/01-kana"
import { CHAPTER_META } from "./chapters/_meta"
import type { GrammarChapter, GrammarPoint } from "./types"

/**
 * 已经写好内容的章节。没在这里出现的章节，目录页会标「编写中」——
 * 学习路径图从第一天就是完整的 13 章，只是内容分批填。
 */
const POINTS_BY_CHAPTER: Record<string, GrammarPoint[]> = {
  ch01: CH01_POINTS,
}

export const GRAMMAR_CHAPTERS: GrammarChapter[] = CHAPTER_META.map((meta) => {
  const points = POINTS_BY_CHAPTER[meta.id] ?? []
  return { ...meta, points, ready: points.length > 0 }
})

export const GRAMMAR_CHAPTER_BY_ID = new Map(GRAMMAR_CHAPTERS.map((c) => [c.id, c]))

export function getGrammarChapter(id: string): GrammarChapter | undefined {
  return GRAMMAR_CHAPTER_BY_ID.get(id)
}

/** 全部语法点（跨章），给校验脚本和 contrastWith 引用检查用 */
export const ALL_GRAMMAR_POINTS: GrammarPoint[] = GRAMMAR_CHAPTERS.flatMap((c) => c.points)

export const GRAMMAR_POINT_BY_ID = new Map(ALL_GRAMMAR_POINTS.map((p) => [p.id, p]))

export { CHAPTER_META } from "./chapters/_meta"
export { LEVEL_LABEL } from "./types"
export type { GrammarChapter, GrammarPoint, GrammarLevel } from "./types"
