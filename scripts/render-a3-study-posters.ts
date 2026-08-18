import { execFileSync } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { conjugateAdjective, conjugateVerb } from "../lib/conjugation/index"
import { TANGO_CORPUS } from "../lib/tango/index"
import type { TangoEntry } from "../lib/tango/types"

const WIDTH = 4961
const HEIGHT = 3508
const MARGIN = 140
const OUTPUT_DIR = path.resolve("artifacts/a3-japanese-print")
const SVG_DIR = path.join(OUTPUT_DIR, "svg")

const C = {
  paper: "#FAF8F1",
  ink: "#172229",
  secondary: "#48565B",
  muted: "#758185",
  line: "#CDD5D2",
  lineStrong: "#93A09D",
  teal: "#147A73",
  tealSoft: "#DCEDE8",
  tealPale: "#EFF6F3",
  vermilion: "#B64B3F",
  vermilionSoft: "#F3E3DD",
  amber: "#9A6818",
  amberSoft: "#F2E9D6",
}

const FONT_SANS = "Hiragino Sans, Hiragino Kaku Gothic ProN, PingFang SC, sans-serif"
const FONT_SERIF = "Hiragino Mincho ProN, YuMincho, serif"

type TextOptions = {
  size?: number
  weight?: number
  fill?: string
  family?: string
  anchor?: "start" | "middle" | "end"
  spacing?: number
  opacity?: number
}

type Poster = { slug: string; title: string; svg: string }

function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function text(x: number, y: number, value: string, options: TextOptions = {}): string {
  const {
    size = 44,
    weight = 400,
    fill = C.ink,
    family = FONT_SANS,
    anchor = "start",
    spacing = 0,
    opacity = 1,
  } = options
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" letter-spacing="${spacing}" opacity="${opacity}">${esc(value)}</text>`
}

function line(x1: number, y1: number, x2: number, y2: number, color = C.line, width = 2): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" />`
}

function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill = "none",
  stroke = "none",
  strokeWidth = 0,
  radius = 0,
): string {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />`
}

function charWidth(ch: string): number {
  if (ch === " ") return 0.34
  if (ch.charCodeAt(0) <= 0x7f) return /[MW@#%]/.test(ch) ? 0.82 : 0.56
  if (/[。、，．・：；（）「」『』【】]/.test(ch)) return 0.72
  return 1
}

function wrap(value: string, maxWidth: number, size: number, maxLines = 3): string[] {
  const paragraphs = value.split("\n")
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    let current = ""
    let used = 0
    for (const ch of paragraph) {
      const next = charWidth(ch) * size
      if (current && used + next > maxWidth) {
        lines.push(current)
        current = ch
        used = next
        if (lines.length >= maxLines) break
      } else {
        current += ch
        used += next
      }
    }
    if (lines.length >= maxLines) break
    if (current) lines.push(current)
  }
  if (lines.length > maxLines) lines.length = maxLines
  const originalLength = lines.join("").length
  if (originalLength < value.replaceAll("\n", "").length && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[，。、；：・—\s]+$/u, "")}…`
  }
  return lines
}

function multiline(
  x: number,
  y: number,
  value: string,
  maxWidth: number,
  options: TextOptions & { lineHeight?: number; maxLines?: number } = {},
): string {
  const size = options.size ?? 44
  const lineHeight = options.lineHeight ?? Math.round(size * 1.34)
  const lines = wrap(value, maxWidth, size, options.maxLines ?? 3)
  const tspans = lines
    .map(
      (entry, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(entry)}</tspan>`,
    )
    .join("")
  const base = text(x, y, "__CONTENT__", options).replace("__CONTENT__", tspans)
  return base
}

function svgDocument(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${C.paper}" />
  ${body}
</svg>`
}

function posterHeader(options: {
  kicker: string
  title: string
  subtitle: string
  code: string
  count?: string
}): string {
  return [
    text(MARGIN, 120, options.kicker.toUpperCase(), {
      size: 28,
      weight: 700,
      fill: C.teal,
      spacing: 5,
    }),
    text(MARGIN, 260, options.title, { size: 104, weight: 600, family: FONT_SERIF }),
    text(MARGIN, 335, options.subtitle, { size: 36, fill: C.secondary }),
    text(WIDTH - MARGIN, 120, options.code, {
      size: 30,
      weight: 700,
      fill: C.muted,
      anchor: "end",
      spacing: 3,
    }),
    options.count
      ? text(WIDTH - MARGIN, 270, options.count, {
          size: 76,
          weight: 700,
          fill: C.teal,
          anchor: "end",
          family: FONT_SERIF,
        })
      : "",
    line(MARGIN, 390, WIDTH - MARGIN, 390, C.lineStrong, 3),
  ].join("\n")
}

function posterFooter(page: string, note: string): string {
  return [
    line(MARGIN, HEIGHT - 105, WIDTH - MARGIN, HEIGHT - 105, C.line, 2),
    text(MARGIN, HEIGHT - 50, note, { size: 25, fill: C.muted }),
    text(WIDTH - MARGIN, HEIGHT - 50, `NIHONGO STUDIO  /  ${page}`, {
      size: 24,
      weight: 700,
      fill: C.muted,
      anchor: "end",
      spacing: 2,
    }),
  ].join("\n")
}

const grammarRoadmap = [
  {
    level: "L1  SOUND & WORDS",
    zh: "声音与词",
    chapters: [
      ["01", "五十音与发音", "假名、浊音、拗音、促音、长音"],
      ["02", "词性识别", "先认功能，再看词尾；例外单独记"],
      ["03", "人称与こそあど", "私／自分／これ・それ・あれ・どれ"],
    ],
  },
  {
    level: "L2  SENTENCE",
    zh: "句子骨架",
    chapters: [
      ["04", "基本语序与助词", "中性完整句通常谓语在后"],
      ["05", "句子语气", "陈述、疑问、请求、命令、感叹"],
      ["06", "疑问词", "いつ・どこ・だれ・なぜ・どう"],
    ],
  },
  {
    level: "L3  CONJUGATION",
    zh: "活用与时体",
    chapters: [
      ["07", "动词分类与活用", "先掌握五段／一段／不规则"],
      ["08", "时制与体", "过去／非过去＋ている等体表达"],
      ["09", "时间表达", "昨日、毎日、これから、〜ところ"],
    ],
  },
  {
    level: "L4  VOICE & TONE",
    zh: "视角与语气",
    chapters: [
      ["10", "可能・使役・受身", "谁能做、让谁做、谁受影响"],
      ["11", "意志与命令", "〜よう／〜ましょう／〜ろ的分寸"],
    ],
  },
  {
    level: "L5  COMPLEXITY",
    zh: "复杂表达",
    chapters: [
      ["12", "四种条件", "と／ば／たら／なら按关系选"],
      ["13", "存在・强调・倒装", "ある／いる、のは〜だ、口语后置"],
    ],
  },
] as const

function roadmapPoster(): Poster {
  const body: string[] = [
    posterHeader({
      kicker: "Grammar learning map",
      title: "日语语法学习地图",
      subtitle: "先结构、后变形、再语气；为输出服务，不按英语时态硬套",
      code: "GRAMMAR 01",
      count: "13 章",
    }),
  ]
  const gap = 54
  const columnWidth = (WIDTH - MARGIN * 2 - gap * 4) / 5
  grammarRoadmap.forEach((level, columnIndex) => {
    const x = MARGIN + columnIndex * (columnWidth + gap)
    const y = 500
    body.push(rect(x, y, columnWidth, 88, C.teal, "none", 0, 0))
    body.push(
      text(x + 28, y + 56, level.level, { size: 28, weight: 700, fill: C.paper, spacing: 2 }),
    )
    body.push(
      text(x + columnWidth - 25, y + 56, level.zh, {
        size: 28,
        weight: 600,
        fill: C.paper,
        anchor: "end",
      }),
    )
    let chapterY = y + 178
    for (const [no, titleZh, summary] of level.chapters) {
      body.push(text(x, chapterY, no, { size: 86, weight: 700, fill: C.teal, family: FONT_SERIF }))
      body.push(text(x + 138, chapterY - 18, titleZh, { size: 49, weight: 600 }))
      body.push(
        multiline(x + 138, chapterY + 45, summary, columnWidth - 138, {
          size: 31,
          fill: C.secondary,
          lineHeight: 45,
          maxLines: 2,
        }),
      )
      body.push(line(x, chapterY + 145, x + columnWidth, chapterY + 145, C.line, 2))
      chapterY += 500
    }
  })
  const stripY = 2730
  body.push(rect(MARGIN, stripY, WIDTH - MARGIN * 2, 520, C.tealPale, C.line, 2, 18))
  body.push(text(MARGIN + 45, stripY + 85, "怎么用这张图", { size: 42, weight: 700, fill: C.teal }))
  const tips = [
    ["01", "跳过已会", "你已有 N2/N1 阅读基础；熟悉章节只做查漏，不从头背课本。"],
    ["02", "活用先行", "第 07 章是第 08–12 章的共同前置，先把词尾变化练成肌肉记忆。"],
    ["03", "每章都输出", "看懂之后立刻造 3 句：工作一句、生活一句、救场一句。"],
  ]
  tips.forEach(([no, titleZh, detail], index) => {
    const x = MARGIN + 45 + index * 1540
    body.push(text(x, stripY + 190, no, { size: 42, weight: 700, fill: C.vermilion }))
    body.push(text(x + 85, stripY + 190, titleZh, { size: 38, weight: 700 }))
    body.push(
      multiline(x + 85, stripY + 250, detail, 1320, {
        size: 32,
        lineHeight: 48,
        fill: C.secondary,
        maxLines: 3,
      }),
    )
  })
  body.push(posterFooter("01 / 09", "修订版顺序：动词活用置于时制与体之前"))
  return { slug: "01-grammar-roadmap", title: "语法学习地图", svg: svgDocument(body.join("\n")) }
}

const kanaRows = [
  ["あ", "い", "う", "え", "お"],
  ["か", "き", "く", "け", "こ"],
  ["さ", "し", "す", "せ", "そ"],
  ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"],
  ["は", "ひ", "ふ", "へ", "ほ"],
  ["ま", "み", "む", "め", "も"],
  ["や", "", "ゆ", "", "よ"],
  ["ら", "り", "る", "れ", "ろ"],
  ["わ", "", "", "", "を"],
  ["ん", "", "", "", ""],
]
const kataRows = [
  ["ア", "イ", "ウ", "エ", "オ"],
  ["カ", "キ", "ク", "ケ", "コ"],
  ["サ", "シ", "ス", "セ", "ソ"],
  ["タ", "チ", "ツ", "テ", "ト"],
  ["ナ", "ニ", "ヌ", "ネ", "ノ"],
  ["ハ", "ヒ", "フ", "ヘ", "ホ"],
  ["マ", "ミ", "ム", "メ", "モ"],
  ["ヤ", "", "ユ", "", "ヨ"],
  ["ラ", "リ", "ル", "レ", "ロ"],
  ["ワ", "", "", "", "ヲ"],
  ["ン", "", "", "", ""],
]
const rowLabels = [
  "あ行",
  "か行",
  "さ行",
  "た行",
  "な行",
  "は行",
  "ま行",
  "や行",
  "ら行",
  "わ行",
  "撥音",
]

function kanaTable(
  x: number,
  y: number,
  width: number,
  rows: string[][],
  titleJa: string,
  titleEn: string,
): string {
  const body: string[] = []
  const labelWidth = 240
  const cellWidth = (width - labelWidth) / 5
  const rowHeight = 206
  body.push(text(x, y - 38, titleJa, { size: 58, weight: 600, family: FONT_SERIF }))
  body.push(
    text(x + width, y - 38, titleEn, {
      size: 26,
      weight: 700,
      fill: C.teal,
      anchor: "end",
      spacing: 3,
    }),
  )
  const headers = ["", "a 段", "i 段", "u 段", "e 段", "o 段"]
  body.push(rect(x, y, width, rowHeight, C.tealSoft))
  headers.forEach((header, index) => {
    const cx = index === 0 ? x + labelWidth / 2 : x + labelWidth + cellWidth * (index - 0.5)
    body.push(text(cx, y + 130, header, { size: 34, weight: 700, fill: C.teal, anchor: "middle" }))
  })
  rows.forEach((row, rowIndex) => {
    const rowY = y + rowHeight * (rowIndex + 1)
    if (rowIndex % 2 === 1) body.push(rect(x, rowY, width, rowHeight, C.tealPale))
    body.push(
      text(x + labelWidth / 2, rowY + 128, rowLabels[rowIndex], {
        size: 30,
        weight: 600,
        fill: C.secondary,
        anchor: "middle",
      }),
    )
    row.forEach((cell, cellIndex) => {
      const cx = x + labelWidth + cellWidth * (cellIndex + 0.5)
      body.push(
        text(cx, rowY + 135, cell || "—", {
          size: cell ? 71 : 33,
          weight: cell ? 500 : 400,
          fill: cell ? C.ink : C.lineStrong,
          family: FONT_SERIF,
          anchor: "middle",
        }),
      )
    })
  })
  for (let i = 0; i <= 12; i++)
    body.push(line(x, y + rowHeight * i, x + width, y + rowHeight * i, C.line, 2))
  body.push(line(x, y, x, y + rowHeight * 12, C.lineStrong, 2))
  body.push(line(x + labelWidth, y, x + labelWidth, y + rowHeight * 12, C.lineStrong, 2))
  for (let i = 1; i <= 5; i++) {
    const xx = x + labelWidth + cellWidth * i
    body.push(line(xx, y, xx, y + rowHeight * 12, C.line, 2))
  }
  return body.join("\n")
}

function kanaPoster(): Poster {
  const body: string[] = [
    posterHeader({
      kicker: "Kana reference",
      title: "平假名・片假名地图",
      subtitle: "横向同辅音，纵向同元音；两套字形共用同一套声音",
      code: "GRAMMAR 02",
      count: "104 字",
    }),
  ]
  const tableY = 610
  const tableWidth = 2260
  body.push(kanaTable(MARGIN, tableY, tableWidth, kanaRows, "ひらがな", "HIRAGANA"))
  body.push(
    kanaTable(WIDTH - MARGIN - tableWidth, tableY, tableWidth, kataRows, "カタカナ", "KATAKANA"),
  )
  body.push(rect(MARGIN, 3130, WIDTH - MARGIN * 2, 210, C.tealPale, "none", 0, 12))
  body.push(text(MARGIN + 35, 3210, "先记例外读音", { size: 34, weight: 700, fill: C.teal }))
  body.push(
    text(MARGIN + 330, 3210, "し shi   /   ち chi   /   つ tsu   /   ふ fu", {
      size: 37,
      weight: 600,
      family: FONT_SERIF,
    }),
  )
  body.push(text(2800, 3210, "を 作助词时读作「お」", { size: 34, weight: 600 }))
  body.push(text(MARGIN + 35, 3280, "拍数提示", { size: 30, weight: 700, fill: C.vermilion }))
  body.push(
    text(MARGIN + 330, 3280, "ん 自己占 1 拍：にほん = に・ほ・ん（3 拍）", {
      size: 32,
      fill: C.secondary,
    }),
  )
  body.push(posterFooter("02 / 09", "A3 横版 · 假名总表 · 平片假名并排查阅"))
  return { slug: "02-kana-map", title: "平片假名地图", svg: svgDocument(body.join("\n")) }
}

function sectionTitle(
  x: number,
  y: number,
  no: string,
  titleZh: string,
  titleJa: string,
  width: number,
): string {
  return [
    text(x, y, no, { size: 35, weight: 700, fill: C.vermilion }),
    text(x + 78, y, titleZh, { size: 48, weight: 700 }),
    text(x + width, y, titleJa, { size: 27, weight: 600, fill: C.teal, anchor: "end" }),
    line(x, y + 34, x + width, y + 34, C.lineStrong, 2),
  ].join("\n")
}

function moraBoxes(x: number, y: number, units: string[], label: string, width = 175): string {
  const body: string[] = []
  units.forEach((unit, index) => {
    const fill = unit === "っ" || unit === "う" || unit === "い" ? C.vermilionSoft : C.tealPale
    body.push(rect(x + index * (width + 16), y, width, 115, fill, C.lineStrong, 2, 10))
    body.push(
      text(x + index * (width + 16) + width / 2, y + 78, unit, {
        size: 52,
        weight: 600,
        family: FONT_SERIF,
        anchor: "middle",
        fill: unit === "っ" ? C.vermilion : C.ink,
      }),
    )
  })
  body.push(
    text(x + units.length * (width + 16) + 18, y + 74, label, {
      size: 31,
      weight: 600,
      fill: C.secondary,
    }),
  )
  return body.join("\n")
}

function pronunciationPoster(): Poster {
  const body: string[] = [
    posterHeader({
      kicker: "Pronunciation & mora",
      title: "浊音・拗音・促音・长音",
      subtitle: "不要按汉字数拍子；日语按「拍」组织节奏",
      code: "GRAMMAR 03",
      count: "4 规则",
    }),
  ]
  const leftX = MARGIN
  const leftW = 2450
  const rightX = 2760
  const rightW = WIDTH - MARGIN - rightX
  body.push(sectionTitle(leftX, 505, "01", "浊音与半浊音", "濁音・半濁音", leftW))
  const dakuRows = [
    ["か き く け こ", "が ぎ ぐ げ ご", "—"],
    ["さ し す せ そ", "ざ じ ず ぜ ぞ", "—"],
    ["た ち つ て と", "だ ぢ づ で ど", "—"],
    ["は ひ ふ へ ほ", "ば び ぶ べ ぼ", "ぱ ぴ ぷ ぺ ぽ"],
  ]
  const dakuHeaders = ["清音", "゛浊音", "゜半浊音"]
  dakuHeaders.forEach((entry, index) => {
    body.push(
      text(leftX + 410 + index * 760, 640, entry, {
        size: 32,
        weight: 700,
        fill: C.teal,
        anchor: "middle",
      }),
    )
  })
  dakuRows.forEach((row, rowIndex) => {
    const y = 735 + rowIndex * 150
    if (rowIndex % 2 === 0) body.push(rect(leftX, y - 83, leftW, 125, C.tealPale))
    row.forEach((entry, index) => {
      body.push(
        text(leftX + 410 + index * 760, y, entry, {
          size: 43,
          weight: 500,
          family: FONT_SERIF,
          anchor: "middle",
          fill: entry === "—" ? C.muted : C.ink,
        }),
      )
    })
  })
  body.push(
    multiline(
      leftX,
      1400,
      "じ／ぢ、ず／づ在东京标准语里通常同音，但拼写不能互换：つづく、はなぢ。",
      leftW,
      {
        size: 33,
        fill: C.secondary,
        lineHeight: 50,
        maxLines: 2,
      },
    ),
  )

  body.push(sectionTitle(rightX, 505, "02", "拗音", "きゃ・しゅ・ちょ", rightW))
  const youonRows = [
    ["きゃ", "きゅ", "きょ"],
    ["しゃ", "しゅ", "しょ"],
    ["ちゃ", "ちゅ", "ちょ"],
    ["にゃ", "にゅ", "にょ"],
    ["ひゃ", "ひゅ", "ひょ"],
    ["みゃ", "みゅ", "みょ"],
    ["りゃ", "りゅ", "りょ"],
    ["ぎゃ", "ぎゅ", "ぎょ"],
    ["じゃ", "じゅ", "じょ"],
    ["びゃ", "びゅ", "びょ"],
    ["ぴゃ", "ぴゅ", "ぴょ"],
  ]
  youonRows.forEach((row, rowIndex) => {
    const y = 650 + rowIndex * 75
    row.forEach((entry, index) => {
      body.push(
        text(rightX + 280 + index * 610, y, entry, {
          size: 42,
          family: FONT_SERIF,
          weight: 500,
          anchor: "middle",
        }),
      )
    })
  })
  body.push(rect(rightX, 1510, rightW, 135, C.vermilionSoft, "none", 0, 10))
  body.push(
    text(rightX + 28, 1596, "びょういん（病院）≠ びよういん（美容院）", {
      size: 35,
      weight: 600,
      family: FONT_SERIF,
      fill: C.vermilion,
    }),
  )

  const bottomY = 1810
  const colW = 1450
  const colGap = 170
  const x1 = MARGIN
  const x2 = x1 + colW + colGap
  const x3 = x2 + colW + colGap
  body.push(sectionTitle(x1, bottomY, "03", "促音与拍数", "小さい「っ」", colW))
  body.push(moraBoxes(x1, bottomY + 115, ["に", "ほ", "ん"], "3 拍", 145))
  body.push(moraBoxes(x1, bottomY + 270, ["に", "っ", "ぽ", "ん"], "4 拍", 145))
  body.push(moraBoxes(x1, bottomY + 425, ["き", "っ", "て"], "3 拍", 145))
  body.push(
    multiline(
      x1,
      bottomY + 665,
      "和语中主要出现在か・さ・た・ぱ行前；外来词还常见バッグ、ベッド、グッズ。",
      colW,
      {
        size: 31,
        fill: C.secondary,
        lineHeight: 48,
        maxLines: 3,
      },
    ),
  )

  body.push(sectionTitle(x2, bottomY, "04", "长音", "母音を一拍伸ばす", colW))
  const longRows = [
    ["あ＋あ", "おかあさん"],
    ["い＋い", "おにいさん"],
    ["う＋う", "くうこう"],
    ["え段＋い（多）", "せんせい"],
    ["お段＋う（多）", "こうこう"],
    ["片假名", "コーヒー"],
  ]
  longRows.forEach(([rule, sample], index) => {
    const y = bottomY + 135 + index * 128
    body.push(text(x2, y, rule, { size: 30, weight: 600, fill: C.teal }))
    body.push(text(x2 + 540, y, sample, { size: 43, weight: 600, family: FONT_SERIF }))
  })
  body.push(
    multiline(
      x2,
      bottomY + 920,
      "おじさん（叔叔）／おじいさん（爷爷）：长一拍就是另一个词。",
      colW,
      {
        size: 31,
        fill: C.vermilion,
        weight: 600,
        lineHeight: 48,
        maxLines: 2,
      },
    ),
  )

  body.push(sectionTitle(x3, bottomY, "05", "开口检查", "声に出して確認", colW))
  const pairs = [
    ["きて", "来て", "きって", "切手"],
    ["ここ", "这里", "こうこう", "高校"],
    ["おじさん", "叔叔", "おじいさん", "爷爷"],
    ["びょういん", "医院", "びよういん", "美容院"],
  ]
  pairs.forEach(([a, azh, b, bzh], index) => {
    const y = bottomY + 145 + index * 205
    body.push(text(x3, y, a, { size: 41, weight: 600, family: FONT_SERIF }))
    body.push(text(x3 + 405, y, azh, { size: 28, fill: C.secondary }))
    body.push(text(x3 + 650, y, "↔", { size: 30, weight: 700, fill: C.vermilion }))
    body.push(text(x3 + 750, y, b, { size: 41, weight: 600, family: FONT_SERIF }))
    body.push(text(x3 + 1200, y, bzh, { size: 28, fill: C.secondary }))
    body.push(line(x3, y + 55, x3 + colW, y + 55, C.line, 2))
  })
  body.push(rect(x3, bottomY + 1010, colW, 180, C.tealPale, "none", 0, 10))
  body.push(
    multiline(
      x3 + 25,
      bottomY + 1070,
      "练法：先拍手数拍，再说完整词；不要一边看汉字一边猜长度。",
      colW - 50,
      {
        size: 31,
        weight: 600,
        fill: C.teal,
        lineHeight: 47,
        maxLines: 2,
      },
    ),
  )
  body.push(posterFooter("03 / 09", "促音与长音都会独占一拍；先数拍，再追求语速"))
  return { slug: "03-pronunciation-mora", title: "发音与拍数", svg: svgDocument(body.join("\n")) }
}

function conjugationPoster(): Poster {
  const verbs = [
    ["書く", "かく", "group1"],
    ["食べる", "たべる", "group2"],
    ["する", "する", "group3"],
    ["来る", "くる", "group3"],
  ] as const
  const verbForms = verbs.map(([surface, kana, group]) => conjugateVerb(surface, kana, group))
  const formRows = [
    ["dictionary", "辞書形"],
    ["masu", "ます形"],
    ["te", "て形"],
    ["ta", "た形"],
    ["nai", "ない形"],
    ["potential", "可能形"],
    ["volitional", "意志形"],
    ["passive", "受身形"],
    ["causative", "使役形"],
    ["imperative", "命令形"],
    ["ba", "ば形"],
  ] as const
  const body: string[] = [
    posterHeader({
      kicker: "Conjugation reference",
      title: "动词・形容词活用速查",
      subtitle: "先看类别，再换词尾；相同表面形式仍要靠语境判断功能",
      code: "GRAMMAR 04",
      count: "11 + 8",
    }),
  ]
  const x = MARGIN
  const y = 520
  const tableW = WIDTH - MARGIN * 2
  const labelW = 610
  const colW = (tableW - labelW) / 4
  const rowH = 162
  body.push(text(x, y, "动词 11 形", { size: 48, weight: 700 }))
  body.push(
    text(x + tableW, y, "五段／一段／サ変／カ変", {
      size: 29,
      weight: 700,
      fill: C.teal,
      anchor: "end",
    }),
  )
  const headY = y + 65
  body.push(rect(x, headY, tableW, rowH, C.tealSoft))
  body.push(
    text(x + labelW / 2, headY + 105, "形式", {
      size: 32,
      weight: 700,
      fill: C.teal,
      anchor: "middle",
    }),
  )
  verbs.forEach(([surface, kana], index) => {
    const cx = x + labelW + colW * (index + 0.5)
    body.push(
      text(cx, headY + 82, surface, {
        size: 49,
        weight: 600,
        family: FONT_SERIF,
        anchor: "middle",
      }),
    )
    body.push(text(cx, headY + 127, kana, { size: 24, fill: C.teal, anchor: "middle" }))
  })
  formRows.forEach(([key, label], rowIndex) => {
    const rowY = headY + rowH * (rowIndex + 1)
    if (rowIndex % 2 === 1) body.push(rect(x, rowY, tableW, rowH, C.tealPale))
    body.push(text(x + 45, rowY + 72, label, { size: 35, weight: 700 }))
    body.push(text(x + 45, rowY + 118, key, { size: 21, weight: 700, fill: C.muted, spacing: 2 }))
    verbForms.forEach((forms, columnIndex) => {
      const cx = x + labelW + colW * (columnIndex + 0.5)
      body.push(
        text(cx, rowY + 100, forms[key].text, {
          size: forms[key].text.length > 5 ? 37 : 43,
          weight: 500,
          family: FONT_SERIF,
          anchor: "middle",
          fill: key === "imperative" ? C.vermilion : C.ink,
        }),
      )
    })
  })
  for (let i = 0; i <= formRows.length + 1; i++)
    body.push(line(x, headY + rowH * i, x + tableW, headY + rowH * i, C.line, 2))
  body.push(
    line(x + labelW, headY, x + labelW, headY + rowH * (formRows.length + 1), C.lineStrong, 2),
  )
  for (let i = 1; i <= 4; i++)
    body.push(
      line(
        x + labelW + colW * i,
        headY,
        x + labelW + colW * i,
        headY + rowH * (formRows.length + 1),
        C.line,
        2,
      ),
    )

  const adjY = 2550
  const adjX = MARGIN
  const adjW = 3170
  const adjLabelW = 510
  const adjColW = (adjW - adjLabelW) / 4
  const adjectives = [
    ["高い", "たかい", "i"],
    ["いい", "いい", "i"],
    ["静か", "しずか", "na"],
    ["きれい", "きれい", "na"],
  ] as const
  const adjForms = adjectives.map(([surface, kana, type]) =>
    conjugateAdjective(surface, kana, type),
  )
  const adjRows = [
    ["negative", "否定"],
    ["past", "过去"],
    ["pastNegative", "过去否定"],
    ["adverb", "副词化"],
    ["te", "て形"],
    ["ba", "条件"],
    ["attributive", "修饰名词"],
  ] as const
  body.push(text(adjX, adjY, "形容词 8 形", { size: 46, weight: 700 }))
  body.push(
    text(adjX + adjW, adjY, "イ形容詞／ナ形容詞", {
      size: 28,
      weight: 700,
      fill: C.teal,
      anchor: "end",
    }),
  )
  const adjHeadY = adjY + 58
  const adjRowH = 96
  body.push(rect(adjX, adjHeadY, adjW, adjRowH, C.tealSoft))
  body.push(
    text(adjX + adjLabelW / 2, adjHeadY + 66, "形式", {
      size: 29,
      weight: 700,
      fill: C.teal,
      anchor: "middle",
    }),
  )
  adjectives.forEach(([surface], index) => {
    body.push(
      text(adjX + adjLabelW + adjColW * (index + 0.5), adjHeadY + 68, surface, {
        size: 37,
        weight: 600,
        family: FONT_SERIF,
        anchor: "middle",
      }),
    )
  })
  adjRows.forEach(([key, label], rowIndex) => {
    const rowY = adjHeadY + adjRowH * (rowIndex + 1)
    if (rowIndex % 2 === 1) body.push(rect(adjX, rowY, adjW, adjRowH, C.tealPale))
    body.push(text(adjX + 28, rowY + 65, label, { size: 28, weight: 600 }))
    adjForms.forEach((forms, index) => {
      body.push(
        text(adjX + adjLabelW + adjColW * (index + 0.5), rowY + 65, forms[key].text, {
          size: forms[key].text.length > 7 ? 27 : 31,
          family: FONT_SERIF,
          weight: 500,
          anchor: "middle",
        }),
      )
    })
  })
  const noteX = 3470
  const noteW = WIDTH - MARGIN - noteX
  body.push(rect(noteX, adjY, noteW, 770, C.amberSoft, C.line, 2, 14))
  body.push(text(noteX + 35, adjY + 72, "实际会话提醒", { size: 39, weight: 700, fill: C.amber }))
  const notes = [
    "一段动词的可能形与受身形同形：食べられる。",
    "口语会听到「食べれる」，但打印表保留标准形。",
    "命令形很强；职场优先用〜てください／お願いします。",
    "不是所有动词都自然拥有全部 11 形；不要机械套用ある等状态动词。",
  ]
  notes.forEach((entry, index) => {
    body.push(
      text(noteX + 35, adjY + 155 + index * 145, `0${index + 1}`, {
        size: 28,
        weight: 700,
        fill: C.vermilion,
      }),
    )
    body.push(
      multiline(noteX + 110, adjY + 155 + index * 145, entry, noteW - 145, {
        size: 30,
        fill: C.secondary,
        lineHeight: 45,
        maxLines: 2,
      }),
    )
  })
  body.push(posterFooter("04 / 09", "标准活用速查；口语缩约与语气限制放在右侧提醒"))
  return { slug: "04-conjugation", title: "活用速查", svg: svgDocument(body.join("\n")) }
}

const noteOverrides: Record<string, string> = {
  "g12-tori": "泛指鸟，也可指鸡肉；小鸟是「小鳥（ことり）」。",
  "g12-sakana": "日常泛称通常读さかな；うお多见于固定词与复合词。",
  "g12-chou": "ちょう较中性；ちょうちょ更口语、亲切，也常对孩子说。",
  "g12-hachi": "蜂类泛称；蜜蜂要明确说「ミツバチ」。",
  "g13-otouto": "说对方弟弟时可说「弟さん／おとうとさん」。",
  "g13-sofu": "不区分爷爷与外公；对外说自己家人时用祖父。",
  "g13-sobo": "不区分奶奶与外婆；对外说自己家人时用祖母。",
  "g13-oji": "伯父／叔父都读おじ；也包括舅舅等父母辈男性亲属。",
  "g13-oba": "伯母／叔母都读おば；也包括姨妈等父母辈女性亲属。",
  "g13-ryoushin": "说对方父母通常说「ご両親」。",
  "g13-kyoudai": "写作兄弟，但可包含姐妹；何人兄弟＝家中几个孩子。",
  "g13-itoko": "不分堂表、男女、长幼，统一说いとこ。",
  "g14-pen": "ペン是笔的泛称；钢笔是万年筆。",
  "g14-mannenhitsu": "钢笔。日常借普通笔时只说ペン即可。",
  "g14-shaapu": "日常常说シャーペン；完整名称是シャープペンシル。",
  "g14-fairu": "既可指实体文件夹，也可指电脑文件。",
  "g14-nori": "与海苔（のり）同音，靠语境区分。",
  "g14-hotchikisu": "日常最常见的订书机叫法；商品名也会写ステープラー。",
  "g14-kami": "紙与髪在东京音通常同调；神可借声调与语境辅助区分。",
  "g14-meishi": "名片交换通常双手递出，正面朝向对方。",
  "g14-inkan": "口语常说はんこ；正式文书常见印鑑。",
  "g16-ame": "雨与飴在东京音不同；方言中可能不同。",
  "g16-kaze": "風与風邪同音，靠汉字和语境区分。",
  "g16-tsuyu": "六月前后的雨季；梅雨前線读ばいうぜんせん。",
  "g16-kumo": "雲与蜘蛛在东京音通常同调，主要靠语境区分。",
  "g16-atsui": "天气热写暑い；物体烫写熱い。",
  "g16-samui": "天气冷用寒い；触感冰凉用冷たい。",
  "g16-atatakai": "天气暖写暖かい；食物、水温温暖写温かい。",
  "g16-tsumetai": "描述触感、饮料等的低温；天气冷不用这个词。",
  "g16-mushiatsui": "湿度高的闷热；日本夏季寒暄中很高频。",
  "g17-kutsu": "鞋袜和裤裙用履く；上身衣物用着る。",
  "g17-waishatsu": "正装衬衫，不限白色；名称来自white shirt。",
  "g17-zubon": "日常说ズボン仍自然；服装销售语境常说パンツ。",
  "g17-boushi": "帽子用かぶる。",
  "g17-nekutai": "领带用締める或する。",
  "g17-tebukuro": "手套用はめる或する。",
  "g17-megane": "眼镜用かける。",
  "g17-tokei": "腕時計用する或はめる。",
  "g17-yukata": "夏祭り常穿；温泉旅馆也会提供浴衣。",
}

const meaningOverrides: Record<string, string> = {
  "g12-hachi": "蜂",
  "g17-waishatsu": "正装衬衫",
}

const groupMeta: Record<
  string,
  { title: string; titleJa: string; subtitle: string; code: string; footer: string }
> = {
  g12: {
    title: "动物",
    titleJa: "動物",
    subtitle: "先记泛称，再补具体种类；避免把蜂、鸟、鱼说得过窄",
    code: "TANGO 12",
    footer: "30 词 · 绿色注释为常用语域与易混词",
  },
  g14: {
    title: "文具与办公用品",
    titleJa: "文房具",
    subtitle: "日常叫法优先；正式名称与职场礼节放在注释中",
    code: "TANGO 14",
    footer: "25 词 · 适合办公室、学校与手续场景",
  },
  g16: {
    title: "天气与体感",
    titleJa: "天気",
    subtitle: "名词看天气现象，形容词区分天气温度与触感温度",
    code: "TANGO 16",
    footer: "30 词 · 最后一行六个形容词用浅绿色标识",
  },
  g17: {
    title: "服饰鞋帽",
    titleJa: "衣類",
    subtitle: "穿戴动词按部位分：着る／履く／かぶる／する",
    code: "TANGO 17",
    footer: "30 词 · 注释优先标明自然搭配与现代口语",
  },
}

function entrySurface(entry: TangoEntry): string {
  return entry.kanji ?? entry.kana
}

function vocabularyGridPoster(groupId: "g12" | "g14" | "g16" | "g17", page: string): Poster {
  const entries = TANGO_CORPUS.filter((entry) => entry.groupId === groupId)
  const meta = groupMeta[groupId]
  const rows = 6
  const columns = 5
  const top = 500
  const bottom = HEIGHT - 145
  const gridW = WIDTH - MARGIN * 2
  const gridH = bottom - top
  const cellW = gridW / columns
  const cellH = gridH / rows
  const body: string[] = [
    posterHeader({
      kicker: `Vocabulary group ${groupId.slice(1)}`,
      title: meta.title,
      subtitle: meta.subtitle,
      code: meta.code,
      count: `${entries.length} 词`,
    }),
  ]
  for (let rowIndex = 0; rowIndex <= rows; rowIndex++) {
    body.push(
      line(
        MARGIN,
        top + cellH * rowIndex,
        WIDTH - MARGIN,
        top + cellH * rowIndex,
        rowIndex === 0 ? C.lineStrong : C.line,
        rowIndex === 0 ? 3 : 2,
      ),
    )
  }
  for (let columnIndex = 0; columnIndex <= columns; columnIndex++) {
    body.push(
      line(
        MARGIN + cellW * columnIndex,
        top,
        MARGIN + cellW * columnIndex,
        bottom,
        columnIndex === 0 || columnIndex === columns ? C.lineStrong : C.line,
        2,
      ),
    )
  }
  entries.forEach((entry, index) => {
    const rowIndex = Math.floor(index / columns)
    const columnIndex = index % columns
    const x = MARGIN + columnIndex * cellW
    const y = top + rowIndex * cellH
    const inset = 35
    const surface = entrySurface(entry)
    const meaning = meaningOverrides[entry.id] ?? entry.chineseZh
    const note = noteOverrides[entry.id] ?? entry.note ?? ""
    const highlight = groupId === "g16" && entry.pos === "イ形容詞"
    if (highlight) body.push(rect(x + 2, y + 2, cellW - 4, cellH - 4, C.tealPale))
    body.push(
      text(x + inset, y + 58, String(index + 1).padStart(2, "0"), {
        size: 24,
        weight: 700,
        fill: C.muted,
        spacing: 2,
      }),
    )
    body.push(
      text(x + cellW - inset, y + 58, entry.pos, {
        size: 23,
        weight: 600,
        fill: highlight ? C.teal : C.muted,
        anchor: "end",
      }),
    )
    body.push(
      text(x + inset, y + 154, surface, {
        size: surface.length > 7 ? 59 : surface.length > 5 ? 68 : 78,
        weight: 600,
        family: FONT_SERIF,
      }),
    )
    if (surface !== entry.kana)
      body.push(text(x + inset, y + 207, entry.kana, { size: 31, weight: 600, fill: C.teal }))
    body.push(
      text(x + inset, y + 276, meaning, {
        size: meaning.length > 12 ? 37 : 43,
        weight: 600,
        fill: C.secondary,
      }),
    )
    if (note) {
      body.push(
        multiline(x + inset, y + 342, note, cellW - inset * 2, {
          size: 31,
          lineHeight: 43,
          maxLines: 3,
          fill: C.secondary,
        }),
      )
    }
  })
  body.push(
    text(WIDTH - MARGIN, 335, meta.titleJa, {
      size: 38,
      weight: 600,
      fill: C.muted,
      anchor: "end",
      family: FONT_SERIF,
    }),
  )
  body.push(posterFooter(page, meta.footer))
  return {
    slug: `${page.slice(0, 2)}-tango-${groupId}-${meta.titleJa}`,
    title: meta.title,
    svg: svgDocument(body.join("\n")),
  }
}

function familyPoster(): Poster {
  const entries = TANGO_CORPUS.filter((entry) => entry.groupId === "g13")
  const byShortId = new Map(entries.map((entry) => [entry.id.replace("g13-", ""), entry]))
  const pairs = [
    ["母亲", "haha", "okaasan"],
    ["父亲", "chichi", "otousan"],
    ["哥哥", "ani", "oniisan"],
    ["姐姐", "ane", "oneesan"],
    ["祖父／外公", "sofu", "ojiisan"],
    ["祖母／外婆", "sobo", "obaasan"],
    ["丈夫", "otto", "goshujin"],
    ["妻子", "tsuma", "okusan"],
  ] as const
  const usedIds = new Set(pairs.flatMap(([, own, other]) => [own, other]))
  const others = entries.filter((entry) => !usedIds.has(entry.id.replace("g13-", "")))
  const body: string[] = [
    posterHeader({
      kicker: "Vocabulary group 13",
      title: "家庭成员：称呼视角",
      subtitle: "先判断“在说谁、对谁说”；不是死背两套，而是按关系与场合选",
      code: "TANGO 13",
      count: "30 词",
    }),
  ]
  const leftX = MARGIN
  const leftW = 2930
  const rightX = 3200
  const rightW = WIDTH - MARGIN - rightX
  const tableY = 540
  const rowH = 300
  body.push(text(leftX, 490, "对外说自己家人", { size: 34, weight: 700, fill: C.teal }))
  body.push(
    text(leftX + 1740, 490, "说对方家人／直接称呼", { size: 34, weight: 700, fill: C.teal }),
  )
  body.push(rect(leftX, tableY, leftW, 90, C.tealSoft))
  const columns = [leftX, leftX + 360, leftX + 1510, leftX + 1740, leftX + leftW]
  body.push(
    text(leftX + 180, tableY + 60, "关系", {
      size: 29,
      weight: 700,
      fill: C.teal,
      anchor: "middle",
    }),
  )
  body.push(
    text(leftX + 900, tableY + 60, "自己这一方", {
      size: 29,
      weight: 700,
      fill: C.teal,
      anchor: "middle",
    }),
  )
  body.push(
    text(leftX + 2290, tableY + 60, "对方／称呼", {
      size: 29,
      weight: 700,
      fill: C.teal,
      anchor: "middle",
    }),
  )
  pairs.forEach(([relation, ownId, otherId], rowIndex) => {
    const y = tableY + 90 + rowIndex * rowH
    const own = byShortId.get(ownId)!
    const other = byShortId.get(otherId)!
    if (rowIndex % 2 === 1) body.push(rect(leftX, y, leftW, rowH, C.tealPale))
    body.push(text(leftX + 25, y + 92, relation, { size: 31, weight: 600, fill: C.secondary }))
    body.push(
      text(leftX + 400, y + 112, entrySurface(own), { size: 62, weight: 600, family: FONT_SERIF }),
    )
    body.push(text(leftX + 400, y + 170, own.kana, { size: 27, weight: 600, fill: C.teal }))
    body.push(
      text(leftX + 1780, y + 112, entrySurface(other), {
        size: 62,
        weight: 600,
        family: FONT_SERIF,
      }),
    )
    body.push(text(leftX + 1780, y + 170, other.kana, { size: 27, weight: 600, fill: C.teal }))
    const nuance =
      relation === "丈夫" || relation === "妻子"
        ? "现代会话也常说旦那さん／奥さん／パートナー"
        : "直接叫自己家人时也常用右侧称呼"
    body.push(
      multiline(leftX + 1780, y + 225, nuance, leftW - 1810, {
        size: 25,
        fill: C.muted,
        lineHeight: 36,
        maxLines: 2,
      }),
    )
  })
  body.push(line(leftX, tableY, leftX + leftW, tableY, C.lineStrong, 2))
  for (let i = 0; i <= 9; i++)
    body.push(line(leftX, tableY + 90 + rowH * i, leftX + leftW, tableY + 90 + rowH * i, C.line, 2))
  columns.forEach((xx, index) =>
    body.push(
      line(
        xx,
        tableY,
        xx,
        tableY + 90 + rowH * 8,
        index === 0 || index === columns.length - 1 ? C.lineStrong : C.line,
        2,
      ),
    ),
  )

  body.push(text(rightX, 490, "其他常用亲属", { size: 34, weight: 700, fill: C.teal }))
  const otherColumns = 2
  const otherRows = 7
  const otherCellW = (rightW - 35) / otherColumns
  const otherCellH = 350
  others.forEach((entry, index) => {
    const columnIndex = Math.floor(index / otherRows)
    const rowIndex = index % otherRows
    const x = rightX + columnIndex * (otherCellW + 35)
    const y = tableY + rowIndex * otherCellH
    body.push(line(x, y, x + otherCellW, y, C.line, 2))
    body.push(
      text(x, y + 85, entrySurface(entry), {
        size: entrySurface(entry).length > 4 ? 48 : 57,
        weight: 600,
        family: FONT_SERIF,
      }),
    )
    body.push(text(x, y + 132, entry.kana, { size: 25, weight: 600, fill: C.teal }))
    body.push(
      text(x, y + 190, entry.chineseZh.replace("（我）", ""), {
        size: 31,
        weight: 600,
        fill: C.secondary,
      }),
    )
    const note = noteOverrides[entry.id] ?? ""
    if (note)
      body.push(
        multiline(x, y + 238, note, otherCellW, {
          size: 24,
          fill: C.muted,
          lineHeight: 34,
          maxLines: 3,
        }),
      )
  })
  body.push(rect(rightX, 3050, rightW, 245, C.vermilionSoft, "none", 0, 12))
  body.push(text(rightX + 25, 3112, "实用原则", { size: 32, weight: 700, fill: C.vermilion }))
  body.push(
    multiline(
      rightX + 25,
      3170,
      "对外说自己家人用父・母等较稳妥；直接称呼家人或说对方家人常带お／ご／さん。关系近、场合随意时会有更多变体。",
      rightW - 50,
      {
        size: 28,
        fill: C.secondary,
        lineHeight: 40,
        maxLines: 3,
      },
    ),
  )
  body.push(posterFooter("06 / 09", "家庭称谓按视角整理；右侧收录其余 14 个亲属词"))
  return { slug: "06-tango-g13-family", title: "家庭成员", svg: svgDocument(body.join("\n")) }
}

async function render(): Promise<void> {
  await mkdir(SVG_DIR, { recursive: true })
  const posters: Poster[] = [
    roadmapPoster(),
    kanaPoster(),
    pronunciationPoster(),
    conjugationPoster(),
    vocabularyGridPoster("g12", "05 / 09"),
    familyPoster(),
    vocabularyGridPoster("g14", "07 / 09"),
    vocabularyGridPoster("g16", "08 / 09"),
    vocabularyGridPoster("g17", "09 / 09"),
  ]

  for (const poster of posters) {
    const svgPath = path.join(SVG_DIR, `${poster.slug}.svg`)
    const pngPath = path.join(OUTPUT_DIR, `${poster.slug}.png`)
    await writeFile(svgPath, poster.svg, "utf8")
    execFileSync("/usr/bin/sips", ["-s", "format", "png", svgPath, "--out", pngPath], {
      stdio: "ignore",
    })
    execFileSync(
      "/usr/bin/sips",
      ["--setProperty", "dpiWidth", "300", "--setProperty", "dpiHeight", "300", pngPath],
      { stdio: "ignore" },
    )
  }

  const readme = `# A3 横版日语学习图\n\n- 尺寸：4961 × 3508 px（A3 横版，300 DPI）\n- 打印：选择 A3、横向、100% / 实际大小；关闭“适合页面”缩放\n- 配色：彩色打印最佳，灰度打印仍保持层级\n- 源稿：svg/ 目录；重新生成：\`./node_modules/.bin/tsx scripts/render-a3-study-posters.ts\`\n\n${posters
    .map((poster, index) => `${index + 1}. ${poster.slug}.png — ${poster.title}`)
    .join("\n")}\n`
  await writeFile(path.join(OUTPUT_DIR, "README.md"), readme, "utf8")
  console.log(`Generated ${posters.length} A3 posters in ${OUTPUT_DIR}`)
}

await render()
