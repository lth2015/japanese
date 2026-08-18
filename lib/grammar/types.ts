import type { Token } from "@/lib/db/schema"

/** L1 入门 → L5 进阶。目录页按这个分段画学习路径。 */
export type GrammarLevel = 1 | 2 | 3 | 4 | 5

export const LEVEL_LABEL: Record<GrammarLevel, string> = {
  1: "L1 入门",
  2: "L2 造句",
  3: "L3 时与体",
  4: "L4 动词进阶",
  5: "L5 复杂句",
}

export type Register = "敬語" | "丁寧" | "カジュアル"
export type Scene = "work" | "life"

export type GrammarExample = {
  japanese: string
  tokens: Token[]
  kana: string
  chinese: string
  scene: Scene
  register: Register
}

/**
 * 一条变形/使用规律。刻意拆成「什么时候 → 怎么变 → 变出来长这样」三段，
 * 因为学习者卡住的地方几乎总是「我知道有这个形，但不知道什么时候该用」。
 */
export type GrammarRule = {
  /** 触发条件，说人话：「一类动词（う段结尾）」 */
  when: string
  /** 变形操作：「う段 → え段 + る」 */
  how: string
  /** 变完长这样：「書く → 書ける」 */
  sample: string
}

/** 对照表，如五十音表、活用表 */
export type GrammarTable = {
  caption?: string
  headers: string[]
  rows: string[][]
}

export type GrammarPoint = {
  id: string
  /** 语法点名字，如「可能形」 */
  title: string
  /**
   * 一句话规律。硬性上限 40 字，且必须是白话——
   * 这是整个 /grammar 的质量线，check:grammar 会卡。
   */
  oneLiner: string
  rules?: GrammarRule[]
  tables?: GrammarTable[]
  /** 至少 3 句，真实职场/日常场景 */
  examples: GrammarExample[]
  /** 至少 1 条易错点。没有易错点的语法点说明没讲透 */
  pitfalls: string[]
  /** 需要对比着记的其它语法点 id，如 ば / と / たら / なら 互相对比 */
  contrastWith?: string[]
  /** 关联到 /verbs 的动词辞書形，页面上给个跳转 */
  relatedVerbs?: string[]
  /** 关联到 /tango 的分组 id */
  relatedTangoGroups?: string[]
}

/** 章节元数据。内容还没写的章节也有 meta，目录页据此画出完整路径。 */
export type ChapterMeta = {
  id: string
  no: number
  title: string
  titleJa: string
  level: GrammarLevel
  /** 本章一句话讲什么 */
  summaryZh: string
  /** 前置章节 id */
  prerequisites: string[]
  /** 这一章对应原图的哪个区块，便于和图片对照 */
  sourceSection?: string
}

export type GrammarChapter = ChapterMeta & {
  points: GrammarPoint[]
  /** 内容是否已经写完 */
  ready: boolean
}
