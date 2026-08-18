import { GROUP12_ANIMALS } from "./entries/12-animals"
import type { TangoEntry } from "./types"

/**
 * 全部词条。每组一个文件，按 Group 编号排。
 * 新增一组时：写 entries/NN-xxx.ts，然后在这里挂上。
 */
export const TANGO_CORPUS: TangoEntry[] = [GROUP12_ANIMALS].flat()

export { TANGO_GROUPS, TANGO_TARGET_TOTAL, getTangoGroup } from "./groups"
export { filterTangoCards, flattenTangoCards, getSurface } from "./utils"
export type { TangoCard, TangoEntry, TangoGroup, Pos } from "./types"
