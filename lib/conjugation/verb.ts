/**
 * 动词活用规则的唯一来源。
 *
 * `/verbs`（動詞変形）与 `/tango`（高频词）都从这里派生活用形，
 * 避免两处各写一套规则、之后互相打架。
 *
 * 核心观察：动词的汉字表记（書く）和假名读法（かく）**送假名尾部完全一致**，
 * 活用只改尾部、不改词干。所以同一条规则对两个字符串各跑一遍即可，
 * 不需要靠例句 token 去反推读音。
 * 唯一的例外是「来る」——词干 来 在不同活用形下读 き/こ/く，单独列表处理。
 */

export type VerbGroup = "group1" | "group2" | "group3"

export type VerbFormKey =
  | "dictionary" // 辞書形　書く
  | "masu" // ます形　書きます
  | "te" // て形　　書いて
  | "ta" // た形　　書いた
  | "nai" // ない形　書かない
  | "potential" // 可能形　書ける
  | "volitional" // 意志形　書こう
  | "passive" // 受身形　書かれる
  | "causative" // 使役形　書かせる
  | "imperative" // 命令形　書け
  | "ba" // 仮定形　書けば

export const VERB_FORM_KEYS: VerbFormKey[] = [
  "dictionary",
  "masu",
  "te",
  "ta",
  "nai",
  "potential",
  "volitional",
  "passive",
  "causative",
  "imperative",
  "ba",
]

/** 中文教材的「一/二/三类动词」＝ 日语的 五段 / 一段 / 不規則 */
export const VERB_GROUP_LABEL: Record<VerbGroup, string> = {
  group1: "一类动词",
  group2: "二类动词",
  group3: "三类动词",
}

export const VERB_FORM_LABEL: Record<VerbFormKey, string> = {
  dictionary: "辞書形",
  masu: "ます形",
  te: "て形",
  ta: "た形",
  nai: "ない形",
  potential: "可能形",
  volitional: "意志形",
  passive: "受身形",
  causative: "使役形",
  imperative: "命令形",
  ba: "仮定形",
}

export type ConjugatedForm = { text: string; kana: string }
export type VerbForms = Record<VerbFormKey, ConjugatedForm>

/**
 * 五段动词：按辞書形末尾假名查行，替换成对应的活用后缀。
 * 每一行就是五十音图里那一行的「あ/い/う/え/お段」在活用上的落点。
 */
const GROUP1_ENDINGS: Record<string, Omit<Record<VerbFormKey, string>, "dictionary">> = {
  う: {
    masu: "います",
    te: "って",
    ta: "った",
    nai: "わない",
    potential: "える",
    volitional: "おう",
    passive: "われる",
    causative: "わせる",
    imperative: "え",
    ba: "えば",
  },
  く: {
    masu: "きます",
    te: "いて",
    ta: "いた",
    nai: "かない",
    potential: "ける",
    volitional: "こう",
    passive: "かれる",
    causative: "かせる",
    imperative: "け",
    ba: "けば",
  },
  ぐ: {
    masu: "ぎます",
    te: "いで",
    ta: "いだ",
    nai: "がない",
    potential: "げる",
    volitional: "ごう",
    passive: "がれる",
    causative: "がせる",
    imperative: "げ",
    ba: "げば",
  },
  す: {
    masu: "します",
    te: "して",
    ta: "した",
    nai: "さない",
    potential: "せる",
    volitional: "そう",
    passive: "される",
    causative: "させる",
    imperative: "せ",
    ba: "せば",
  },
  つ: {
    masu: "ちます",
    te: "って",
    ta: "った",
    nai: "たない",
    potential: "てる",
    volitional: "とう",
    passive: "たれる",
    causative: "たせる",
    imperative: "て",
    ba: "てば",
  },
  ぬ: {
    masu: "にます",
    te: "んで",
    ta: "んだ",
    nai: "なない",
    potential: "ねる",
    volitional: "のう",
    passive: "なれる",
    causative: "なせる",
    imperative: "ね",
    ba: "ねば",
  },
  ぶ: {
    masu: "びます",
    te: "んで",
    ta: "んだ",
    nai: "ばない",
    potential: "べる",
    volitional: "ぼう",
    passive: "ばれる",
    causative: "ばせる",
    imperative: "べ",
    ba: "べば",
  },
  む: {
    masu: "みます",
    te: "んで",
    ta: "んだ",
    nai: "まない",
    potential: "める",
    volitional: "もう",
    passive: "まれる",
    causative: "ませる",
    imperative: "め",
    ba: "めば",
  },
  る: {
    masu: "ります",
    te: "って",
    ta: "った",
    nai: "らない",
    potential: "れる",
    volitional: "ろう",
    passive: "られる",
    causative: "らせる",
    imperative: "れ",
    ba: "れば",
  },
}

/** 一段动词：去掉词尾「る」后统一接。 */
const GROUP2_ENDINGS: Omit<Record<VerbFormKey, string>, "dictionary"> = {
  masu: "ます",
  te: "て",
  ta: "た",
  nai: "ない",
  potential: "られる",
  volitional: "よう",
  passive: "られる",
  causative: "させる",
  imperative: "ろ",
  ba: "れば",
}

/** サ変「〜する」：去掉词尾「する」后统一接。 */
const SURU_ENDINGS: Omit<Record<VerbFormKey, string>, "dictionary"> = {
  masu: "します",
  te: "して",
  ta: "した",
  nai: "しない",
  potential: "できる",
  volitional: "しよう",
  passive: "される",
  causative: "させる",
  imperative: "しろ",
  ba: "すれば",
}

/** カ変「来る」：词干读音随活用变（き / こ / く），只能整表硬写。 */
const KURU_FORMS: VerbForms = {
  dictionary: { text: "来る", kana: "くる" },
  masu: { text: "来ます", kana: "きます" },
  te: { text: "来て", kana: "きて" },
  ta: { text: "来た", kana: "きた" },
  nai: { text: "来ない", kana: "こない" },
  potential: { text: "来られる", kana: "こられる" },
  volitional: { text: "来よう", kana: "こよう" },
  passive: { text: "来られる", kana: "こられる" },
  causative: { text: "来させる", kana: "こさせる" },
  imperative: { text: "来い", kana: "こい" },
  ba: { text: "来れば", kana: "くれば" },
}

/**
 * 不规则五段动词：形上属于五段，但个别活用形不按行表走。
 * key 用假名读法匹配，这样「行く / いく」两种写法都能命中。
 */
const IRREGULAR_GROUP1: Record<string, Partial<Omit<Record<VerbFormKey, string>, "dictionary">>> = {
  // 促音便例外：按く行本该是「行いて」，实际是「行って」
  いく: { te: "って", ta: "った" },
  // 尊敬语五段：ます形是「〜います」不是「〜ります」，命令形也特殊
  ござる: { masu: "います", imperative: "い" },
  いらっしゃる: { masu: "います", imperative: "い" },
  くださる: { masu: "います", imperative: "い" },
  なさる: { masu: "います", imperative: "い" },
  おっしゃる: { masu: "います", imperative: "い" },
}

/**
 * 整词替换的例外（不是「换尾部」而是「换整个词」）。
 * ある 的否定是「ない」而不是「あらない」—— 词干整个消失了，尾部规则救不了。
 */
const FULL_FORM_OVERRIDES: Record<string, Partial<VerbForms>> = {
  ある: { nai: { text: "ない", kana: "ない" } },
}

function isKuru(kana: string): boolean {
  return kana === "くる"
}

function isSuru(kana: string): boolean {
  return kana === "する" || (kana.endsWith("する") && kana.length > 2)
}

/**
 * 对单个书写形套用活用规则。`surface` 可以是汉字表记也可以是纯假名，
 * 规则只动尾部，所以两者用同一函数。
 */
function applyEnding(surface: string, trim: number, ending: string): string {
  return surface.slice(0, surface.length - trim) + ending
}

/**
 * 派生一个动词的全部活用形。
 *
 * @param dictionary 辞書形的书写表记，如「書く」「食べる」「勉強する」
 * @param kana       辞書形的假名读法，如「かく」「たべる」「べんきょうする」
 * @param group      动词分类
 */
export function conjugateVerb(dictionary: string, kana: string, group: VerbGroup): VerbForms {
  if (isKuru(kana)) {
    // 「来る」和纯假名「くる」都走整表，只把 dictionary 的表记换回来
    if (dictionary === "くる") {
      return Object.fromEntries(
        VERB_FORM_KEYS.map((key) => [
          key,
          { text: KURU_FORMS[key].kana, kana: KURU_FORMS[key].kana },
        ]),
      ) as VerbForms
    }
    return KURU_FORMS
  }

  const dictionaryForm: ConjugatedForm = { text: dictionary, kana }

  if (group === "group3") {
    if (!isSuru(kana)) {
      throw new Error(`三类动词只支持「〜する」与「来る」，收到：${dictionary} / ${kana}`)
    }
    const forms = { dictionary: dictionaryForm } as VerbForms
    for (const key of VERB_FORM_KEYS) {
      if (key === "dictionary") continue
      const ending = SURU_ENDINGS[key]
      forms[key] = {
        text: applyEnding(dictionary, 2, ending),
        kana: applyEnding(kana, 2, ending),
      }
    }
    return forms
  }

  if (group === "group2") {
    if (!kana.endsWith("る")) {
      throw new Error(`二类动词必须以「る」结尾，收到：${dictionary} / ${kana}`)
    }
    const forms = { dictionary: dictionaryForm } as VerbForms
    for (const key of VERB_FORM_KEYS) {
      if (key === "dictionary") continue
      const ending = GROUP2_ENDINGS[key]
      forms[key] = {
        text: applyEnding(dictionary, 1, ending),
        kana: applyEnding(kana, 1, ending),
      }
    }
    return forms
  }

  const tail = kana.at(-1)
  const row = tail ? GROUP1_ENDINGS[tail] : undefined
  if (!row) {
    throw new Error(`一类动词词尾不在う段：${dictionary} / ${kana}`)
  }
  const overrides = IRREGULAR_GROUP1[kana] ?? {}
  const forms = { dictionary: dictionaryForm } as VerbForms
  for (const key of VERB_FORM_KEYS) {
    if (key === "dictionary") continue
    const ending = overrides[key] ?? row[key]
    forms[key] = {
      text: applyEnding(dictionary, 1, ending),
      kana: applyEnding(kana, 1, ending),
    }
  }
  return { ...forms, ...FULL_FORM_OVERRIDES[kana] }
}

/**
 * 猜测动词分类。语料里应当显式写明 group，这个函数只用于校验脚本交叉核对。
 * 返回 null 表示「靠拼写判断不了」（る 结尾的 え/い 段动词天然歧义：
 * 帰る=一类、食べる=二类，光看拼写无解，只能靠词表）。
 */
export function guessVerbGroup(kana: string): VerbGroup | null {
  if (isKuru(kana) || isSuru(kana)) return "group3"
  if (!kana.endsWith("る")) return "group1"
  const beforeRu = kana.at(-2)
  if (!beforeRu) return null
  // る 前面是 あ/う/お段 → 必定是一类动词（乗る・作る・降る）
  if (
    "あかがさざただなはばぱまやらわうくぐすずつづぬふぶぷむゆるおこごそぞとどのほぼぽもよろ".includes(
      beforeRu,
    )
  ) {
    return "group1"
  }
  return null // い段 / え段 + る：歧义，需要词表
}
