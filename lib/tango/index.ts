import { GROUP12_ANIMALS } from "./entries/12-animals"
import { GROUP13_FAMILY } from "./entries/13-family"
import { GROUP14_STATIONERY } from "./entries/14-stationery"
import { GROUP16_WEATHER } from "./entries/16-weather"
import { GROUP17_CLOTHING } from "./entries/17-clothing"
import type { TangoEntry } from "./types"

/**
 * 全部词条。每组一个文件，按 Group 编号排。
 * 新增一组时：写 entries/NN-xxx.ts，然后在这里挂上。
 */
export const TANGO_CORPUS: TangoEntry[] = [
  GROUP12_ANIMALS,
  GROUP13_FAMILY,
  GROUP14_STATIONERY,
  GROUP16_WEATHER,
  GROUP17_CLOTHING,
].flat()

export { TANGO_GROUPS, TANGO_TARGET_TOTAL, getTangoGroup } from "./groups"
export { filterTangoCards, flattenTangoCards, getSurface } from "./utils"
export type { TangoCard, TangoEntry, TangoGroup, Pos } from "./types"
