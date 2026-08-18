/**
 * /tango 语料校验。
 *
 *   pnpm check:tango           质量检查（有问题就非零退出）+ 打印覆盖率表
 *   pnpm check:tango --strict  额外要求每组都达到 targetCount（收尾时用）
 *
 * 分成两类：
 * - 「错误」＝语料本身是坏的（拼接对不上、缺字段、重复），任何时候都必须为零
 * - 「覆盖」＝还没写够，分批推进时是正常状态，只有 --strict 才当失败
 */
import { conjugateVerb } from "../lib/conjugation/index"
import { TANGO_GROUPS } from "../lib/tango/groups"
import { TANGO_CORPUS } from "../lib/tango/index"
import { flattenTangoCards } from "../lib/tango/utils"
import { VERB_CORPUS } from "../lib/verbs/verb-corpus"

const strict = process.argv.includes("--strict")
const errors: string[] = []

const KANA_ONLY = /^[ぁ-ゖァ-ヺーゝゞヽヾ]+$/

function err(id: string, msg: string) {
  errors.push(`${id}: ${msg}`)
}

// -- 逐条检查 --
const cards = flattenTangoCards(TANGO_CORPUS)
const seenIds = new Set<string>()
const seenWords = new Map<string, string>()

for (const card of cards) {
  if (seenIds.has(card.id)) err(card.id, "id 重复")
  seenIds.add(card.id)

  if (!KANA_ONLY.test(card.kana)) err(card.id, `kana 含非假名字符：${card.kana}`)
  if (!card.chineseZh.trim()) err(card.id, "缺中文释义")

  const wordKey = `${card.kana} ${card.pos}`
  const prev = seenWords.get(wordKey)
  if (prev) err(card.id, `与 ${prev} 重复（同假名同词性）`)
  else seenWords.set(wordKey, card.id)

  // 词本身的 ruby 拼接必须还原表记
  const surface = card.kanji ?? card.kana
  const tokenText = (card.tokens ?? []).map((t) => t.text).join("")
  if (tokenText !== surface) err(card.id, `tokens 拼接「${tokenText}」不等于表记「${surface}」`)

  // 例句拼接
  const ex = card.example
  const exText = ex.tokens.map((t) => t.text).join("")
  if (exText !== ex.japanese) err(card.id, `例句 tokens 拼接「${exText}」不等于「${ex.japanese}」`)
  const exKana = ex.tokens.map((t) => t.kana ?? t.text).join("")
  if (exKana !== ex.kana) err(card.id, `例句 kana「${ex.kana}」与 token 推导「${exKana}」不符`)
  if (!ex.chinese.trim()) err(card.id, "例句缺中文")
  // 例句里必须真的出现这个词，否则例句是白给的
  if (!ex.japanese.includes(surface) && !ex.kana.includes(card.kana)) {
    err(card.id, `例句里没出现「${surface}」`)
  }

  if (card.pos === "動詞") {
    if (!card.verbGroup) err(card.id, "动词缺 verbGroup")
    if (!card.verbForms) err(card.id, "动词没派生出活用表")
  }
  if (card.pos === "イ形容詞" || card.pos === "ナ形容詞") {
    if (!card.adjType) err(card.id, "形容词缺 adjType")
    if (!card.adjForms) err(card.id, "形容词没派生出活用表")
  }
}

// -- 与 /verbs 语料交叉比对：同一个动词的变形必须逐字一致 --
const verbByForm = new Map(VERB_CORPUS.map((v) => [v.dictionaryForm, v]))
let crossChecked = 0
for (const card of cards) {
  if (card.pos !== "動詞" || !card.verbGroup) continue
  const surface = card.kanji ?? card.kana
  const twin = verbByForm.get(surface)
  if (!twin) continue
  crossChecked++
  if (twin.verbGroup !== card.verbGroup) {
    err(card.id, `动词分类与 /verbs 不一致：${card.verbGroup} vs ${twin.verbGroup}`)
    continue
  }
  const mine = conjugateVerb(surface, card.kana, card.verbGroup)
  for (const conj of twin.conjugations) {
    const key =
      conj.conjugationType === "polite"
        ? "masu"
        : conj.conjugationType === "negative"
          ? "nai"
          : conj.conjugationType === "potential"
            ? "potential"
            : null
    if (!key) continue
    const want = conj.conjugatedForm
    const got = mine[key as "masu" | "nai" | "potential"].text
    if (want !== got) err(card.id, `${conj.conjugationType} 与 /verbs 不一致：${got} vs ${want}`)
  }
}

// -- 覆盖率 --
const byGroup = new Map<string, number>()
for (const card of cards) byGroup.set(card.groupId, (byGroup.get(card.groupId) ?? 0) + 1)

const rows: string[] = []
let short = 0
let total = 0
let target = 0
for (const g of TANGO_GROUPS) {
  const n = byGroup.get(g.id) ?? 0
  total += n
  target += g.targetCount
  const ok = n >= Math.floor(g.targetCount * 0.9)
  if (!ok) short++
  const filled = Math.min(20, Math.round((n / g.targetCount) * 20))
  const bar = "#".repeat(filled).padEnd(20, ".")
  rows.push(
    `  ${String(g.no).padStart(2)} ${g.nameZh.padEnd(10)} ${bar} ${String(n).padStart(3)}/${g.targetCount}${ok ? " ok" : ""}`,
  )
}

console.log(`\n词条覆盖率（${total}/${target}）`)
console.log(rows.join("\n"))
console.log(
  `\n与 /verbs 交叉核对了 ${crossChecked} 个重叠动词${crossChecked === 0 ? "（暂无重叠）" : ""}`,
)

if (errors.length > 0) {
  console.log(`\n${errors.length} 处语料错误：`)
  for (const e of errors.slice(0, 40)) console.log(`  ${e}`)
  if (errors.length > 40) console.log(`  ...还有 ${errors.length - 40} 处`)
  process.exit(1)
}

if (strict && short > 0) {
  console.log(`\n--strict：还有 ${short} 组没写够`)
  process.exit(1)
}

console.log(`\n${cards.length} 条词条全部通过质量检查${short > 0 ? `（${short} 组待补全）` : ""}`)
