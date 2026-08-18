/**
 * /grammar 内容校验。
 *
 *   pnpm check:grammar           质量检查 + 打印进度
 *   pnpm check:grammar --strict  额外要求 13 章全部写完、语法点 >= 60
 *
 * 质量线是硬的（一句话规律 <= 40 字、每点 >= 3 例句 >= 1 易错点），
 * 因为这三条正是「明晰 / 说人话 / 有实例」这个目标能被机器守住的部分。
 */
import { GRAMMAR_CHAPTERS, GRAMMAR_POINT_BY_ID } from "../lib/grammar/index"
import { TANGO_GROUP_BY_ID } from "../lib/tango/groups"
import { VERB_CORPUS } from "../lib/verbs/verb-corpus"

const strict = process.argv.includes("--strict")
const errors: string[] = []
const warnings: string[] = []

const ONE_LINER_MAX = 40
const MIN_POINTS_TOTAL = 60
const MIN_POINTS_PER_CHAPTER = 3

/** 这些术语单独出现会把人劝退，必须配 rules[] 把变形步骤说成人话 */
const JARGON = ["未然形", "連用形", "連体形", "終止形", "仮定形", "已然形"]

function err(where: string, msg: string) {
  errors.push(`${where}: ${msg}`)
}

// -- 章节层 --
const chapterIds = new Set(GRAMMAR_CHAPTERS.map((c) => c.id))
for (const ch of GRAMMAR_CHAPTERS) {
  for (const pre of ch.prerequisites) {
    if (!chapterIds.has(pre)) err(ch.id, `前置章节 ${pre} 不存在`)
    const preChapter = GRAMMAR_CHAPTERS.find((c) => c.id === pre)
    if (preChapter && preChapter.no >= ch.no) {
      err(ch.id, `前置章节 ${pre} 排在自己后面（第${preChapter.no}章），学习路径成环`)
    }
  }
  if (ch.ready && ch.points.length < MIN_POINTS_PER_CHAPTER) {
    err(ch.id, `只有 ${ch.points.length} 个语法点，至少要 ${MIN_POINTS_PER_CHAPTER} 个`)
  }
}

// -- 语法点层 --
const verbForms = new Set(VERB_CORPUS.map((v) => v.dictionaryForm))
const seenPointIds = new Set<string>()
let workCount = 0
let lifeCount = 0

for (const ch of GRAMMAR_CHAPTERS) {
  for (const p of ch.points) {
    const where = `${ch.id}/${p.id}`

    if (seenPointIds.has(p.id)) err(where, "语法点 id 重复")
    seenPointIds.add(p.id)

    // 一句话规律：这是全站的质量线
    if (!p.oneLiner.trim()) err(where, "缺一句话规律")
    if (p.oneLiner.length > ONE_LINER_MAX) {
      err(where, `一句话规律 ${p.oneLiner.length} 字，超过 ${ONE_LINER_MAX} 字上限`)
    }
    const jargon = JARGON.filter((j) => p.oneLiner.includes(j))
    if (jargon.length > 0 && !p.rules?.length) {
      err(where, `一句话规律里用了术语「${jargon.join("/")}」却没有 rules[] 把步骤讲成人话`)
    }

    if (p.examples.length < 3) err(where, `只有 ${p.examples.length} 个例句，至少 3 个`)
    if (p.pitfalls.length < 1) err(where, "缺易错点。讲不出易错点说明没讲透")

    for (const [i, e] of p.examples.entries()) {
      const tokenText = e.tokens.map((t) => t.text).join("")
      if (tokenText !== e.japanese) {
        err(where, `例句${i + 1} tokens 拼接「${tokenText}」不等于「${e.japanese}」`)
      }
      const tokenKana = e.tokens.map((t) => t.kana ?? t.text).join("")
      if (tokenKana !== e.kana) {
        err(where, `例句${i + 1} kana「${e.kana}」与 token 推导「${tokenKana}」不符`)
      }
      if (!e.chinese.trim()) err(where, `例句${i + 1} 缺中文`)
      if (e.scene === "work") workCount++
      else lifeCount++
    }

    for (const ref of p.contrastWith ?? []) {
      if (!GRAMMAR_POINT_BY_ID.has(ref)) err(where, `contrastWith 指向不存在的语法点 ${ref}`)
    }
    for (const v of p.relatedVerbs ?? []) {
      if (!verbForms.has(v)) err(where, `relatedVerbs 里的「${v}」不在 /verbs 语料中`)
    }
    for (const g of p.relatedTangoGroups ?? []) {
      if (!TANGO_GROUP_BY_ID.has(g)) err(where, `relatedTangoGroups 里的「${g}」不是有效分组`)
    }
  }
}

// -- 场景分布：例句不能全挤在职场或全挤在日常 --
const totalExamples = workCount + lifeCount
if (totalExamples >= 30) {
  const workRatio = workCount / totalExamples
  if (workRatio < 0.3 || workRatio > 0.7) {
    warnings.push(
      `例句场景失衡：职场 ${workCount} / 日常 ${lifeCount}（职场占 ${Math.round(workRatio * 100)}%，建议 30%-70%）`,
    )
  }
}

// -- 进度 --
const readyChapters = GRAMMAR_CHAPTERS.filter((c) => c.ready)
const totalPoints = GRAMMAR_CHAPTERS.reduce((n, c) => n + c.points.length, 0)

console.log(
  `\n章节进度（${readyChapters.length}/${GRAMMAR_CHAPTERS.length} 章，${totalPoints}/${MIN_POINTS_TOTAL} 个语法点）`,
)
for (const c of GRAMMAR_CHAPTERS) {
  const mark = c.ready ? `${c.points.length} 点` : "编写中"
  console.log(`  L${c.level} ${String(c.no).padStart(2)} ${c.title.padEnd(24)} ${mark}`)
}

if (warnings.length > 0) {
  console.log("\n提醒：")
  for (const w of warnings) console.log(`  ${w}`)
}

if (errors.length > 0) {
  console.log(`\n${errors.length} 处内容错误：`)
  for (const e of errors.slice(0, 40)) console.log(`  ${e}`)
  if (errors.length > 40) console.log(`  ...还有 ${errors.length - 40} 处`)
  process.exit(1)
}

if (strict) {
  const problems: string[] = []
  if (readyChapters.length < GRAMMAR_CHAPTERS.length) {
    problems.push(`还有 ${GRAMMAR_CHAPTERS.length - readyChapters.length} 章没写`)
  }
  if (totalPoints < MIN_POINTS_TOTAL) {
    problems.push(`语法点 ${totalPoints} 个，不足 ${MIN_POINTS_TOTAL}`)
  }
  if (problems.length > 0) {
    console.log(`\n--strict：${problems.join("；")}`)
    process.exit(1)
  }
}

console.log(`\n${totalPoints} 个语法点全部通过质量检查`)
