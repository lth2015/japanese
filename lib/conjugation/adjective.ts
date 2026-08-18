/**
 * 形容词活用规则的唯一来源。
 *
 * 日语形容词只有两类，规律极简：
 * - イ形容词：把词尾「い」摘掉，换成 くない / かった / く / くて / ければ
 * - ナ形容词：本体不变，后面换 だ / じゃない / だった / に / で / なら
 *
 * 唯一要背的例外是「いい」——活用一律走「よい」（よくない・よかった），
 * 因为 いい 是 よい 的口语音变，只有辞書形变了、活用没跟着变。
 */

export type AdjectiveType = "i" | "na"

export type AdjectiveFormKey =
  | "dictionary" // 辞書形　高い / 静かだ
  | "negative" // 否定　　高くない / 静かじゃない
  | "past" // 过去　　高かった / 静かだった
  | "pastNegative" // 过去否定 高くなかった / 静かじゃなかった
  | "adverb" // 副词化　高く / 静かに
  | "te" // て形　　高くて / 静かで
  | "ba" // 条件形　高ければ / 静かなら
  | "attributive" // 连体形（修饰名词）高い / 静かな

export const ADJECTIVE_FORM_KEYS: AdjectiveFormKey[] = [
  "dictionary",
  "negative",
  "past",
  "pastNegative",
  "adverb",
  "te",
  "ba",
  "attributive",
]

export const ADJECTIVE_FORM_LABEL: Record<AdjectiveFormKey, string> = {
  dictionary: "辞書形",
  negative: "否定",
  past: "过去",
  pastNegative: "过去否定",
  adverb: "副词形",
  te: "て形",
  ba: "条件形",
  attributive: "连体形",
}

export const ADJECTIVE_TYPE_LABEL: Record<AdjectiveType, string> = {
  i: "イ形容詞",
  na: "ナ形容詞",
}

export type AdjectiveForm = { text: string; kana: string }
export type AdjectiveForms = Record<AdjectiveFormKey, AdjectiveForm>

/** イ形容词：摘掉词尾「い」之后接的后缀 */
const I_ENDINGS: Record<AdjectiveFormKey, string> = {
  dictionary: "い",
  negative: "くない",
  past: "かった",
  pastNegative: "くなかった",
  adverb: "く",
  te: "くて",
  ba: "ければ",
  attributive: "い",
}

/** ナ形容词：本体后面直接接的后缀 */
const NA_ENDINGS: Record<AdjectiveFormKey, string> = {
  dictionary: "だ",
  negative: "じゃない",
  past: "だった",
  pastNegative: "じゃなかった",
  adverb: "に",
  te: "で",
  ba: "なら",
  attributive: "な",
}

/**
 * 以「い」结尾却是ナ形容词的常见词。
 * 这是初学者最高频的踩坑点：光看词尾判断类型会全错。
 */
export const NA_ADJECTIVES_ENDING_IN_I = [
  "きれい", // 綺麗　漂亮／干净
  "きらい", // 嫌い　讨厌
  "ゆうめい", // 有名　有名
  "げんき", // 元気　精神好（不以い结尾，但同属高频误判）
  "とくい", // 得意　擅长
  "しつれい", // 失礼　失礼
  "ていねい", // 丁寧　礼貌周到
  "あいまい", // 曖昧　含糊
  "よけい", // 余計　多余
] as const

/**
 * 派生一个形容词的全部活用形。
 *
 * @param dictionary イ形容词写辞書形（高い）；ナ形容词写**不带だ**的词干（静か）
 * @param kana       对应的假名读法（たかい / しずか）
 */
export function conjugateAdjective(
  dictionary: string,
  kana: string,
  type: AdjectiveType,
): AdjectiveForms {
  if (type === "na") {
    const forms = {} as AdjectiveForms
    for (const key of ADJECTIVE_FORM_KEYS) {
      forms[key] = { text: dictionary + NA_ENDINGS[key], kana: kana + NA_ENDINGS[key] }
    }
    return forms
  }

  if (!kana.endsWith("い")) {
    throw new Error(`イ形容词必须以「い」结尾，收到：${dictionary} / ${kana}`)
  }

  // いい / 良い：辞書形保留原样，其余活用一律走「よ」词干（いかった ✗ / よかった ○）
  const isIi = kana === "いい" || kana === "よい"
  const stem = isIi && dictionary === "いい" ? "よ" : dictionary.slice(0, -1)
  const stemKana = isIi ? "よ" : kana.slice(0, -1)

  const forms = {} as AdjectiveForms
  for (const key of ADJECTIVE_FORM_KEYS) {
    if (isIi && (key === "dictionary" || key === "attributive")) {
      forms[key] = { text: dictionary, kana }
      continue
    }
    forms[key] = { text: stem + I_ENDINGS[key], kana: stemKana + I_ENDINGS[key] }
  }
  return forms
}
