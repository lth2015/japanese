/**
 * Short workplace passages. Reading-comprehension entry into output.
 * Used by /passages mode (Phase 2+).
 */
import type { SeedPassage } from "./types"

export const passages: SeedPassage[] = [
  // === Email: 项目延期通知 ===
  {
    title: "プロジェクト納期延期のご連絡",
    source: "email",
    description: "项目延期通知邮件",
    difficulty: 3,
    lengthWords: 95,
    tags: ["邮件", "延期", "正式"],
    body:
      "山田様\n\n" +
      "お世話になっております。鈴木でございます。\n\n" +
      "現在進めている A プロジェクトについて、ご連絡申し上げます。" +
      "テスト工程で一点問題が見つかり、原因調査と対応を行っております。" +
      "つきましては、当初の納期から二日ほど遅れる見込みです。\n\n" +
      "詳細は明日中にご共有いたします。" +
      "ご迷惑をおかけし大変申し訳ございません。\n\n" +
      "何卒よろしくお願いいたします。\n\n" +
      "鈴木",
    tokens: [
      { text: "山田様", kana: "やまださま" },
      { text: "\n\n" },
      { text: "お" },
      { text: "世話", kana: "せわ" },
      { text: "になっております。" },
      { text: "鈴木", kana: "すずき" },
      { text: "でございます。\n\n" },
      { text: "現在", kana: "げんざい" },
      { text: "進めて", kana: "すすめて" },
      { text: "いる A " },
      { text: "プロジェクトについて、ご" },
      { text: "連絡", kana: "れんらく" },
      { text: "申し上げます。", kana: "もうしあげます" },
      { text: "テスト" },
      { text: "工程", kana: "こうてい" },
      { text: "で" },
      { text: "一点", kana: "いってん" },
      { text: "問題", kana: "もんだい" },
      { text: "が" },
      { text: "見つかり、", kana: "みつかり" },
      { text: "原因調査", kana: "げんいんちょうさ" },
      { text: "と" },
      { text: "対応", kana: "たいおう" },
      { text: "を" },
      { text: "行って", kana: "おこなって" },
      { text: "おります。つきましては、" },
      { text: "当初", kana: "とうしょ" },
      { text: "の" },
      { text: "納期", kana: "のうき" },
      { text: "から" },
      { text: "二日", kana: "ふつか" },
      { text: "ほど" },
      { text: "遅れる", kana: "おくれる" },
      { text: "見込み", kana: "みこみ" },
      { text: "です。\n\n" },
      { text: "詳細", kana: "しょうさい" },
      { text: "は" },
      { text: "明日中", kana: "あすちゅう" },
      { text: "にご" },
      { text: "共有", kana: "きょうゆう" },
      { text: "いたします。ご" },
      { text: "迷惑", kana: "めいわく" },
      { text: "をおかけし" },
      { text: "大変", kana: "たいへん" },
      { text: "申し訳", kana: "もうしわけ" },
      { text: "ございません。\n\n" },
      { text: "何卒", kana: "なにとぞ" },
      { text: "よろしく" },
      { text: "お" },
      { text: "願い", kana: "ねがい" },
      { text: "いたします。\n\n" },
      { text: "鈴木", kana: "すずき" },
    ],
    vocabulary: [
      { word: "つきましては", meaning: "因此（正式商务用语）" },
      { word: "見込み", kana: "みこみ", meaning: "预计、估计" },
      { word: "工程", kana: "こうてい", meaning: "工序、阶段" },
      { word: "何卒", kana: "なにとぞ", meaning: "万望、还请（极正式）" },
      { word: "ご迷惑をおかけし", kana: "ごめいわくをおかけし", meaning: "给您添麻烦" },
    ],
    questions: [
      {
        q: "このメールの目的は何ですか。",
        a: "プロジェクトの納期が当初より二日ほど遅れることを連絡するため。",
        type: "fact",
      },
      {
        q: "詳細はいつ共有されますか。",
        a: "明日中。",
        type: "fact",
      },
      {
        q: "あなたが山田の立場なら、どう返信しますか。日本語で短く書いてください。",
        a: "（自由作答。例：「了解しました。詳細をお待ちしております。」など。）",
        type: "open",
      },
    ],
  },

  // === Slack: 周报片段 ===
  {
    title: "週報の一部：今週の進捗とリスク",
    source: "slack",
    description: "Slack 上发的周报，简短的进展 + 风险陈述。",
    difficulty: 3,
    lengthWords: 80,
    tags: ["slack", "周报", "汇报"],
    body:
      "お疲れさまです。今週の進捗を共有します。\n\n" +
      "■ 完了\n" +
      "・ユーザー登録機能のテスト\n" +
      "・ログイン画面のデザイン修正\n\n" +
      "■ 進行中\n" +
      "・API 連携の実装（80% 完了）\n\n" +
      "■ リスク\n" +
      "テスト環境で一点不具合が出ています。原因を調査中ですが、来週初めまでに対応する見込みです。\n\n" +
      "ご不明点があればお声がけください。",
    tokens: [
      { text: "お" },
      { text: "疲れさま", kana: "つかれさま" },
      { text: "です。" },
      { text: "今週", kana: "こんしゅう" },
      { text: "の" },
      { text: "進捗", kana: "しんちょく" },
      { text: "を" },
      { text: "共有", kana: "きょうゆう" },
      { text: "します。\n\n■ " },
      { text: "完了", kana: "かんりょう" },
      { text: "\n・" },
      { text: "ユーザー登録機能", kana: "ユーザーとうろくきのう" },
      { text: "の" },
      { text: "テスト\n・" },
      { text: "ログイン画面", kana: "ログインがめん" },
      { text: "の" },
      { text: "デザイン" },
      { text: "修正", kana: "しゅうせい" },
      { text: "\n\n■ " },
      { text: "進行中", kana: "しんこうちゅう" },
      { text: "\n・API " },
      { text: "連携", kana: "れんけい" },
      { text: "の" },
      { text: "実装", kana: "じっそう" },
      { text: "（80%" },
      { text: "完了", kana: "かんりょう" },
      { text: "）\n\n■ " },
      { text: "リスク\n" },
      { text: "テスト" },
      { text: "環境", kana: "かんきょう" },
      { text: "で" },
      { text: "一点", kana: "いってん" },
      { text: "不具合", kana: "ふぐあい" },
      { text: "が" },
      { text: "出て", kana: "でて" },
      { text: "います。" },
      { text: "原因", kana: "げんいん" },
      { text: "を" },
      { text: "調査中", kana: "ちょうさちゅう" },
      { text: "ですが、" },
      { text: "来週", kana: "らいしゅう" },
      { text: "初め", kana: "はじめ" },
      { text: "までに" },
      { text: "対応", kana: "たいおう" },
      { text: "する" },
      { text: "見込み", kana: "みこみ" },
      { text: "です。\n\nご" },
      { text: "不明点", kana: "ふめいてん" },
      { text: "があれば" },
      { text: "お" },
      { text: "声", kana: "こえ" },
      { text: "がけください。" },
    ],
    vocabulary: [
      { word: "進行中", kana: "しんこうちゅう", meaning: "进行中" },
      { word: "連携", kana: "れんけい", meaning: "联动、对接" },
      { word: "不具合", kana: "ふぐあい", meaning: "故障、bug" },
      { word: "お声がけ", kana: "おこえがけ", meaning: "（请）告知一声" },
    ],
    questions: [
      {
        q: "今週完了した項目は何ですか。",
        a: "ユーザー登録機能のテスト と ログイン画面のデザイン修正。",
        type: "fact",
      },
      {
        q: "リスクの対応はいつまでにする予定ですか。",
        a: "来週初め。",
        type: "fact",
      },
      {
        q: "この週報を一行で要約してください（日本語で）。",
        a: "（自由作答。例：「概ね順調だが、テスト環境の不具合を来週初めまでに対応予定。」）",
        type: "summary",
      },
    ],
  },
]
