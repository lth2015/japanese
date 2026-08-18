/**
 * 活用规则回归测试。lib/conjugation 是 /verbs、/tango、/grammar 三处共用的
 * 唯一规则来源，任何改动都必须先跑通这里。
 *
 *   pnpm check:conjugation
 */
import { conjugateAdjective, conjugateVerb } from "../lib/conjugation/index"

const cases: Array<[string, string, "group1" | "group2" | "group3", Record<string, string>]> = [
  [
    "書く",
    "かく",
    "group1",
    {
      masu: "書きます",
      te: "書いて",
      ta: "書いた",
      nai: "書かない",
      potential: "書ける",
      volitional: "書こう",
      passive: "書かれる",
      causative: "書かせる",
      imperative: "書け",
      ba: "書けば",
    },
  ],
  ["泳ぐ", "およぐ", "group1", { te: "泳いで", ta: "泳いだ", nai: "泳がない" }],
  [
    "話す",
    "はなす",
    "group1",
    { masu: "話します", te: "話して", nai: "話さない", potential: "話せる" },
  ],
  [
    "待つ",
    "まつ",
    "group1",
    { masu: "待ちます", te: "待って", nai: "待たない", potential: "待てる" },
  ],
  ["死ぬ", "しぬ", "group1", { te: "死んで", nai: "死なない" }],
  ["遊ぶ", "あそぶ", "group1", { te: "遊んで", nai: "遊ばない" }],
  ["飲む", "のむ", "group1", { te: "飲んで", nai: "飲まない", potential: "飲める" }],
  [
    "作る",
    "つくる",
    "group1",
    { masu: "作ります", te: "作って", nai: "作らない", potential: "作れる" },
  ],
  [
    "買う",
    "かう",
    "group1",
    { masu: "買います", te: "買って", nai: "買わない", potential: "買える" },
  ],
  ["行く", "いく", "group1", { te: "行って", ta: "行った", masu: "行きます", nai: "行かない" }],
  ["ある", "ある", "group1", { nai: "ない", masu: "あります" }],
  [
    "食べる",
    "たべる",
    "group2",
    {
      masu: "食べます",
      te: "食べて",
      ta: "食べた",
      nai: "食べない",
      potential: "食べられる",
      volitional: "食べよう",
      imperative: "食べろ",
      ba: "食べれば",
    },
  ],
  ["見る", "みる", "group2", { masu: "見ます", te: "見て", potential: "見られる" }],
  [
    "する",
    "する",
    "group3",
    {
      masu: "します",
      te: "して",
      nai: "しない",
      potential: "できる",
      volitional: "しよう",
      imperative: "しろ",
      ba: "すれば",
    },
  ],
  [
    "勉強する",
    "べんきょうする",
    "group3",
    { masu: "勉強します", te: "勉強して", potential: "勉強できる" },
  ],
  [
    "来る",
    "くる",
    "group3",
    {
      masu: "来ます",
      te: "来て",
      nai: "来ない",
      potential: "来られる",
      volitional: "来よう",
      imperative: "来い",
      ba: "来れば",
    },
  ],
]

let fail = 0
for (const [dict, kana, group, expect] of cases) {
  const forms = conjugateVerb(dict, kana, group)
  for (const [key, want] of Object.entries(expect)) {
    const got = forms[key as keyof typeof forms].text
    if (got !== want) {
      console.log(`✗ ${dict} ${key}: got ${got}, want ${want}`)
      fail++
    }
  }
}

// kana 一致性：假名读法必须与表记同长尾部规则
const kaku = conjugateVerb("書く", "かく", "group1")
if (kaku.te.kana !== "かいて") {
  console.log(`✗ 書く te kana: ${kaku.te.kana}`)
  fail++
}
const kuru = conjugateVerb("来る", "くる", "group3")
if (kuru.nai.kana !== "こない") {
  console.log(`✗ 来る nai kana: ${kuru.nai.kana}`)
  fail++
}

const adjCases: Array<[string, string, "i" | "na", Record<string, string>]> = [
  [
    "高い",
    "たかい",
    "i",
    {
      negative: "高くない",
      past: "高かった",
      pastNegative: "高くなかった",
      adverb: "高く",
      te: "高くて",
      ba: "高ければ",
      attributive: "高い",
    },
  ],
  [
    "いい",
    "いい",
    "i",
    {
      dictionary: "いい",
      negative: "よくない",
      past: "よかった",
      adverb: "よく",
      te: "よくて",
      ba: "よければ",
    },
  ],
  ["良い", "よい", "i", { negative: "良くない", past: "良かった", adverb: "良く" }],
  [
    "静か",
    "しずか",
    "na",
    {
      dictionary: "静かだ",
      negative: "静かじゃない",
      past: "静かだった",
      adverb: "静かに",
      te: "静かで",
      ba: "静かなら",
      attributive: "静かな",
    },
  ],
  [
    "きれい",
    "きれい",
    "na",
    { negative: "きれいじゃない", adverb: "きれいに", attributive: "きれいな" },
  ],
]
for (const [dict, kana, type, expect] of adjCases) {
  const forms = conjugateAdjective(dict, kana, type)
  for (const [key, want] of Object.entries(expect)) {
    const got = forms[key as keyof typeof forms].text
    if (got !== want) {
      console.log(`✗ ${dict} ${key}: got ${got}, want ${want}`)
      fail++
    }
  }
}

console.log(
  fail === 0 ? `✓ 全部通过（${cases.length} 动词 + ${adjCases.length} 形容词）` : `${fail} 处不符`,
)
process.exit(fail === 0 ? 0 : 1)
