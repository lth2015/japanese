import type { TangoGroup } from "./types"

/**
 * 22 个高频词分组。
 *
 * Group 6–17 来自原图（「10天爆刷背完3500个高频词」），其中 Group 8 在原图上
 * 漏印了标题——从内容判断是颜色词，这里定名为「颜色」。
 * Group 1–5 原图完全没印出来，按体系补齐。
 * Group 18–22 是本项目自己加的，贴合「职场日语口语」的定位。
 *
 * targetCount 是 check:tango 的验收线，允许 ±10%。
 */
export const TANGO_GROUPS: TangoGroup[] = [
  // ── 原图缺失、按体系补齐 ──
  { id: "g01", no: 1, nameZh: "人称与指示", nameJa: "人称・指示", level: 1, targetCount: 30 },
  { id: "g02", no: 2, nameZh: "时间与日期", nameJa: "時間・日付", level: 1, targetCount: 40 },
  { id: "g03", no: 3, nameZh: "身体部位", nameJa: "体の部位", level: 1, targetCount: 30 },
  { id: "g04", no: 4, nameZh: "常用动词", nameJa: "基本動詞", level: 1, targetCount: 60 },
  { id: "g05", no: 5, nameZh: "常用形容词", nameJa: "基本形容詞", level: 1, targetCount: 50 },

  // ── 原图 Group 6–17 ──
  { id: "g06", no: 6, nameZh: "职业", nameJa: "職業", level: 1, targetCount: 30 },
  { id: "g07", no: 7, nameZh: "食物", nameJa: "食べ物", level: 1, targetCount: 60 },
  // 原图这一组没印标题，按内容定名
  { id: "g08", no: 8, nameZh: "颜色", nameJa: "色", level: 1, targetCount: 20 },
  { id: "g09", no: 9, nameZh: "基础数字", nameJa: "基本の数", level: 1, targetCount: 40 },
  { id: "g10", no: 10, nameZh: "家居物品", nameJa: "家の中のもの", level: 1, targetCount: 40 },
  { id: "g11", no: 11, nameZh: "交通工具", nameJa: "乗り物", level: 1, targetCount: 25 },
  { id: "g12", no: 12, nameZh: "动物", nameJa: "動物", level: 1, targetCount: 30 },
  { id: "g13", no: 13, nameZh: "家庭成员", nameJa: "家族", level: 1, targetCount: 30 },
  { id: "g14", no: 14, nameZh: "文具用品", nameJa: "文房具", level: 1, targetCount: 25 },
  { id: "g15", no: 15, nameZh: "方位场所", nameJa: "位置・場所", level: 1, targetCount: 40 },
  { id: "g16", no: 16, nameZh: "天气", nameJa: "天気", level: 2, targetCount: 30 },
  { id: "g17", no: 17, nameZh: "服饰鞋帽", nameJa: "衣類", level: 2, targetCount: 30 },

  // ── 本项目补充：贴合职场口语训练的定位 ──
  { id: "g18", no: 18, nameZh: "职场办公", nameJa: "職場・オフィス", level: 2, targetCount: 50 },
  { id: "g19", no: 19, nameZh: "IT・数字", nameJa: "IT・デジタル", level: 3, targetCount: 40 },
  { id: "g20", no: 20, nameZh: "情绪与状态", nameJa: "感情・状態", level: 2, targetCount: 30 },
  { id: "g21", no: 21, nameZh: "副词与接续词", nameJa: "副詞・接続詞", level: 3, targetCount: 40 },
  {
    id: "g22",
    no: 22,
    nameZh: "授受・敬语常用词",
    nameJa: "授受・敬語",
    level: 3,
    targetCount: 30,
  },
]

export const TANGO_GROUP_BY_ID = new Map(TANGO_GROUPS.map((g) => [g.id, g]))

export function getTangoGroup(id: string): TangoGroup {
  const group = TANGO_GROUP_BY_ID.get(id)
  if (!group) throw new Error(`未知词汇分组：${id}`)
  return group
}

/** 全部分组目标词数之和 */
export const TANGO_TARGET_TOTAL = TANGO_GROUPS.reduce((sum, g) => sum + g.targetCount, 0)
