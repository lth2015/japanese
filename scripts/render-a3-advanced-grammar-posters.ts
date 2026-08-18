import { execFileSync } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import {
  ADVANCED_GRAMMAR_TOPICS,
  type AdvancedGrammarPattern,
  type AdvancedGrammarTopic,
} from "./a3-advanced-grammar-data"
import {
  ADVANCED_GRAMMAR_FORM_READINGS,
  ADVANCED_GRAMMAR_READINGS,
} from "./a3-advanced-grammar-readings"

const WIDTH = 4961
const HEIGHT = 3508
const MARGIN = 140
const OUTPUT_DIR = path.resolve("artifacts/a3-advanced-grammar")
const SVG_DIR = path.join(OUTPUT_DIR, "svg")

const C = {
  paper: "#FAF8F1",
  ink: "#172229",
  secondary: "#465358",
  muted: "#778286",
  line: "#CED6D3",
  lineStrong: "#91A09C",
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
  if (/[。、，．・：；（）「」『』【】〈〉]/.test(ch)) return 0.72
  return 1
}

function wrap(value: string, maxWidth: number, size: number, maxLines: number): string[] {
  const lines: string[] = []
  let current = ""
  let used = 0
  for (const ch of value) {
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
  if (lines.length < maxLines && current) lines.push(current)
  if (lines.length === maxLines && value.length > lines.join("").length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`
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
  const lineHeight = options.lineHeight ?? Math.round(size * 1.42)
  const lines = wrap(value, maxWidth, size, options.maxLines ?? 2)
  const tspans = lines
    .map(
      (entry, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(entry)}</tspan>`,
    )
    .join("")
  return text(x, y, "__CONTENT__", options).replace("__CONTENT__", tspans)
}

function svgDoc(content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${C.paper}" />
  ${content}
</svg>`
}

function pageHeader(
  kicker: string,
  titleZh: string,
  subtitle: string,
  page: string,
  metric: string,
  titleJa?: string,
): string {
  return [
    text(MARGIN, 120, kicker, { size: 28, weight: 700, fill: C.teal, spacing: 5 }),
    text(MARGIN, 260, titleZh, { size: 96, weight: 600, family: FONT_SERIF }),
    text(MARGIN, 345, subtitle, { size: 34, fill: C.secondary }),
    text(WIDTH - MARGIN, 120, page, {
      size: 30,
      weight: 700,
      fill: C.muted,
      anchor: "end",
      spacing: 3,
    }),
    text(WIDTH - MARGIN, 265, metric, {
      size: 76,
      weight: 700,
      fill: C.teal,
      anchor: "end",
      family: FONT_SERIF,
    }),
    titleJa
      ? text(WIDTH - MARGIN, 345, titleJa, {
          size: 31,
          weight: 500,
          fill: C.secondary,
          anchor: "end",
        })
      : "",
    line(MARGIN, 395, WIDTH - MARGIN, 395, C.lineStrong, 3),
  ].join("\n")
}

function footer(page: string, note: string): string {
  return [
    line(MARGIN, HEIGHT - 105, WIDTH - MARGIN, HEIGHT - 105, C.line, 2),
    text(MARGIN, HEIGHT - 55, note, { size: 25, fill: C.muted }),
    text(WIDTH - MARGIN, HEIGHT - 55, `NIHONGO OUTPUT GRAMMAR  /  ${page} / 16`, {
      size: 25,
      weight: 700,
      fill: C.muted,
      anchor: "end",
      spacing: 1,
    }),
  ].join("\n")
}

function levelColor(level: AdvancedGrammarPattern["level"]): { fill: string; text: string } {
  if (level === "N1") return { fill: C.vermilionSoft, text: C.vermilion }
  if (level === "敬语") return { fill: C.amberSoft, text: C.amber }
  if (level === "口语") return { fill: C.tealSoft, text: C.teal }
  return { fill: C.tealPale, text: C.teal }
}

function patternBlock(
  pattern: AdvancedGrammarPattern,
  index: number,
  x: number,
  y: number,
  width: number,
  rowHeight: number,
): string {
  const body: string[] = []
  const innerX = x + 34
  const textWidth = width - 68
  const badge = levelColor(pattern.level)
  const titleSize = pattern.form.length >= 17 ? 55 : pattern.form.length >= 12 ? 61 : 68
  const exampleReading = ADVANCED_GRAMMAR_READINGS[pattern.exampleJa]
  const formReading = ADVANCED_GRAMMAR_FORM_READINGS[pattern.form]
  if (!exampleReading) throw new Error(`例句缺少读音：${pattern.exampleJa}`)

  body.push(line(x, y, x + width, y, C.lineStrong, 2))
  body.push(
    text(innerX, y + 43, String(index + 1).padStart(2, "0"), {
      size: 27,
      weight: 700,
      fill: C.muted,
    }),
  )
  body.push(rect(x + width - 150, y + 18, 116, 44, badge.fill, "none", 0, 22))
  body.push(
    text(x + width - 92, y + 49, pattern.level, {
      size: 25,
      weight: 700,
      fill: badge.text,
      anchor: "middle",
    }),
  )
  body.push(
    text(innerX, y + 127, pattern.form, { size: titleSize, weight: 600, family: FONT_SERIF }),
  )
  if (formReading) {
    body.push(text(innerX, y + 171, formReading, { size: 27, weight: 700, fill: C.teal }))
  }
  body.push(
    multiline(innerX, y + (formReading ? 217 : 187), pattern.attach, textWidth, {
      size: 31,
      weight: 600,
      fill: C.teal,
      lineHeight: 42,
      maxLines: 2,
    }),
  )
  body.push(
    multiline(innerX, y + 281, pattern.meaning, textWidth, {
      size: 42,
      weight: 600,
      lineHeight: 57,
      maxLines: 2,
    }),
  )
  body.push(text(innerX, y + 399, "例", { size: 25, weight: 700, fill: C.vermilion, spacing: 2 }))
  body.push(
    multiline(innerX + 66, y + 401, pattern.exampleJa, textWidth - 66, {
      size: 42,
      weight: 500,
      family: FONT_SERIF,
      lineHeight: 58,
      maxLines: 2,
    }),
  )
  body.push(text(innerX, y + 468, "よみ", { size: 23, weight: 700, fill: C.teal, spacing: 1 }))
  body.push(
    multiline(innerX + 66, y + 468, exampleReading, textWidth - 66, {
      size: 30,
      weight: 600,
      fill: C.teal,
      lineHeight: 42,
      maxLines: 1,
    }),
  )
  body.push(
    multiline(innerX + 66, y + 531, pattern.exampleZh, textWidth - 66, {
      size: 35,
      fill: C.secondary,
      lineHeight: 49,
      maxLines: 2,
    }),
  )
  body.push(rect(innerX, y + 592, textWidth, 126, C.tealPale, "none", 0, 8))
  body.push(text(innerX + 22, y + 629, "语感", { size: 25, weight: 700, fill: C.teal }))
  body.push(
    multiline(innerX + 100, y + 631, pattern.nuance, textWidth - 122, {
      size: 33,
      fill: C.secondary,
      lineHeight: 46,
      maxLines: 2,
    }),
  )
  body.push(text(innerX, y + 772, "辨析", { size: 25, weight: 700, fill: C.vermilion }))
  body.push(
    multiline(innerX + 92, y + 774, pattern.compare, textWidth - 92, {
      size: 32,
      fill: C.secondary,
      lineHeight: 44,
      maxLines: 2,
    }),
  )
  body.push(line(x, y + rowHeight, x + width, y + rowHeight, C.line, 2))
  return body.join("\n")
}

function topicPoster(topic: AdvancedGrammarTopic): string {
  const body: string[] = []
  body.push(
    pageHeader(
      `ADVANCED GRAMMAR  ${topic.no}`,
      topic.titleZh,
      topic.subtitle,
      `GRAMMAR ${topic.no}`,
      "6 型",
      topic.titleJa,
    ),
  )

  const gap = 96
  const columnWidth = (WIDTH - MARGIN * 2 - gap) / 2
  const rowHeight = 930
  const startY = 470
  for (const [index, pattern] of topic.patterns.entries()) {
    const column = index % 2
    const row = Math.floor(index / 2)
    const x = MARGIN + column * (columnWidth + gap)
    const y = startY + row * rowHeight
    body.push(patternBlock(pattern, index, x, y, columnWidth, rowHeight))
  }
  body.push(footer(topic.no, "用法优先于中文直译：读完例句后，换人称／时态／场景各说一遍"))
  return svgDoc(body.join("\n"))
}

function indexPoster(): string {
  const body: string[] = []
  body.push(
    pageHeader(
      "ADVANCED GRAMMAR OUTPUT MAP",
      "进阶日语语法・输出地图",
      "不按考试清单死背，按说话功能组织 90 个高频句型",
      "GRAMMAR 01",
      "90 型",
      "実際に使うための文法",
    ),
  )

  const gapX = 70
  const gapY = 28
  const columnWidth = (WIDTH - MARGIN * 2 - gapX * 2) / 3
  const rowHeight = 510
  const startY = 500
  for (const [index, topic] of ADVANCED_GRAMMAR_TOPICS.entries()) {
    const column = index % 3
    const row = Math.floor(index / 3)
    const x = MARGIN + column * (columnWidth + gapX)
    const y = startY + row * (rowHeight + gapY)
    body.push(line(x, y, x + columnWidth, y, C.lineStrong, 2))
    body.push(
      text(x, y + 78, topic.no, { size: 61, weight: 700, fill: C.teal, family: FONT_SERIF }),
    )
    body.push(text(x + 105, y + 70, topic.titleZh, { size: 43, weight: 700 }))
    body.push(text(x + 105, y + 116, topic.titleJa, { size: 28, weight: 600, fill: C.secondary }))
    body.push(
      multiline(x, y + 190, topic.subtitle, columnWidth, {
        size: 31,
        fill: C.secondary,
        lineHeight: 45,
        maxLines: 2,
      }),
    )
    body.push(
      multiline(
        x,
        y + 305,
        topic.patterns.map((pattern) => pattern.form.replaceAll("〜", "")).join("  ·  "),
        columnWidth,
        { size: 28, weight: 600, fill: C.teal, lineHeight: 42, maxLines: 3 },
      ),
    )
  }

  const stripY = 3200
  body.push(rect(MARGIN, stripY, WIDTH - MARGIN * 2, 155, C.tealPale, C.line, 2, 10))
  body.push(text(MARGIN + 34, stripY + 55, "学习顺序", { size: 27, weight: 700, fill: C.teal }))
  body.push(
    text(
      MARGIN + 210,
      stripY + 55,
      "先选一个说话功能 → 遮住中文复述例句 → 保留句型替换内容 → 当天实际说一次",
      {
        size: 33,
        weight: 600,
      },
    ),
  )
  body.push(text(MARGIN + 34, stripY + 112, "优先页", { size: 27, weight: 700, fill: C.vermilion }))
  body.push(
    text(MARGIN + 210, stripY + 112, "工作输出：02・07・13・14・15　｜　生活会话：03・08・11・16", {
      size: 31,
      fill: C.secondary,
    }),
  )
  body.push(footer("01", "覆盖日常与职场的高频功能；刻意不收只为考试辨认的低频书面古典句型"))
  return svgDoc(body.join("\n"))
}

async function render(): Promise<void> {
  await mkdir(SVG_DIR, { recursive: true })
  const posters: Poster[] = [
    { slug: "01-advanced-grammar-map", title: "进阶日语语法・输出地图", svg: indexPoster() },
    ...ADVANCED_GRAMMAR_TOPICS.map((topic) => ({
      slug: `${topic.no}-${topic.titleJa.replaceAll("・", "-")}`,
      title: topic.titleZh,
      svg: topicPoster(topic),
    })),
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

  const readme = `# A3 进阶日语语法・输出图谱\n\n- 内容：15 个功能主题、90 个高频句型，另附 1 张总索引\n- 读音：90 个日文例句全部附平假名读音；含汉字的语法标题也附读音\n- 尺寸：4961 × 3508 px（A3 横版，300 DPI）\n- 打印：A3、横向、100% / 实际大小；关闭“适合页面”缩放\n- 定位：N2/N1 阅读基础上的主动输出训练；不收只用于考试辨认的低频古典句型\n- 源稿：svg/ 目录\n- 重新生成：\`./node_modules/.bin/tsx scripts/render-a3-advanced-grammar-posters.ts\`\n\n${posters
    .map(
      (poster, index) =>
        `${String(index + 1).padStart(2, "0")}. ${poster.slug}.png — ${poster.title}`,
    )
    .join("\n")}\n`
  await writeFile(path.join(OUTPUT_DIR, "README.md"), readme, "utf8")
  console.log(`Generated ${posters.length} advanced A3 grammar posters in ${OUTPUT_DIR}`)
}

await render()
