/**
 * N2/N1 high-frequency grammar patterns, shown in workplace-relevant context.
 * Each sentence is an example of one pattern; `chunkPattern` field marks the pattern.
 * The goal: get the patterns into your active production, not just recognition.
 */
import type { SeedSentence } from "./types"

export const grammarSentences: SeedSentence[] = [
  // === ～ことになる / ことになっている ===
  {
    japanese: "来週からプロジェクトを担当することになりました。",
    tokens: [
      { text: "来週", kana: "らいしゅう" },
      { text: "から" },
      { text: "プロジェクトを" },
      { text: "担当", kana: "たんとう" },
      { text: "することになりました。" },
    ],
    kana: "らいしゅうからぷろじぇくとをたんとうすることになりました",
    chinese: "下周开始我要负责这个项目了。",
    category: "grammar",
    register: "丁寧",
    difficulty: 3,
    frequencyRank: 105,
    chunkPattern: "~ことになる",
    tags: ["N2", "事项决定"],
  },
  {
    japanese: "毎週月曜日に進捗会議をすることになっています。",
    tokens: [
      { text: "毎週", kana: "まいしゅう" },
      { text: "月曜日", kana: "げつようび" },
      { text: "に" },
      { text: "進捗会議", kana: "しんちょくかいぎ" },
      { text: "をすることになっています。" },
    ],
    kana: "まいしゅうげつようびにしんちょくかいぎをすることになっています",
    chinese: "每周一定期开进度会议。",
    category: "grammar",
    register: "丁寧",
    difficulty: 3,
    frequencyRank: 130,
    chunkPattern: "~ことになっている",
    tags: ["N2", "惯例"],
  },

  // === ～わけだ / わけではない ===
  {
    japanese: "つまり、納期が一週間ずれるわけですね。",
    tokens: [
      { text: "つまり、" },
      { text: "納期", kana: "のうき" },
      { text: "が" },
      { text: "一週間", kana: "いっしゅうかん" },
      { text: "ずれるわけですね。" },
    ],
    kana: "つまり、のうきがいっしゅうかんずれるわけですね",
    chinese: "也就是说，交期会推迟一周对吧。",
    category: "grammar",
    register: "丁寧",
    difficulty: 3,
    frequencyRank: 140,
    chunkPattern: "~わけだ",
    tags: ["N2", "推论"],
  },
  {
    japanese: "反対しているわけではありません。",
    tokens: [
      { text: "反対", kana: "はんたい" },
      { text: "しているわけではありません。" },
    ],
    kana: "はんたいしているわけではありません",
    chinese: "我并不是在反对。",
    category: "grammar",
    register: "丁寧",
    difficulty: 3,
    frequencyRank: 150,
    chunkPattern: "~わけではない",
    tags: ["N2", "否定"],
  },

  // === ～次第 ===
  {
    japanese: "結果が分かり次第、ご連絡いたします。",
    tokens: [
      { text: "結果", kana: "けっか" },
      { text: "が" },
      { text: "分かり次第、", kana: "わかりしだい" },
      { text: "ご" },
      { text: "連絡", kana: "れんらく" },
      { text: "いたします。" },
    ],
    kana: "けっかがわかりしだい、ごれんらくいたします",
    chinese: "结果一出来我马上联系您。",
    category: "grammar",
    register: "敬語",
    difficulty: 3,
    frequencyRank: 100,
    chunkPattern: "~次第",
    tags: ["N2", "邮件", "高频"],
  },

  // === ～にあたって / にあたり ===
  {
    japanese: "プロジェクト開始にあたり、ご挨拶申し上げます。",
    tokens: [
      { text: "プロジェクト" },
      { text: "開始", kana: "かいし" },
      { text: "にあたり、" },
      { text: "ご" },
      { text: "挨拶", kana: "あいさつ" },
      { text: "申し上げます。", kana: "もうしあげます" },
    ],
    kana: "ぷろじぇくとかいしにあたり、ごあいさつもうしあげます",
    chinese: "在项目启动之际，向您致意。",
    category: "grammar",
    register: "敬語",
    difficulty: 4,
    frequencyRank: 200,
    chunkPattern: "~にあたって",
    tags: ["N1", "邮件", "正式"],
  },

  // === ～かねる / かねない ===
  {
    japanese: "その件は私一人では判断しかねます。",
    tokens: [
      { text: "その" },
      { text: "件", kana: "けん" },
      { text: "は" },
      { text: "私", kana: "わたし" },
      { text: "一人", kana: "ひとり" },
      { text: "では" },
      { text: "判断", kana: "はんだん" },
      { text: "しかねます。" },
    ],
    kana: "そのけんはわたしひとりではんだんしかねます",
    chinese: "这件事我一个人不好做决定。",
    category: "grammar",
    register: "丁寧",
    difficulty: 4,
    frequencyRank: 180,
    chunkPattern: "~かねる",
    tags: ["N1", "委婉拒绝"],
  },
  {
    japanese: "このままだとリスクになりかねません。",
    tokens: [
      { text: "このままだと" },
      { text: "リスクに" },
      { text: "なりかねません。" },
    ],
    kana: "このままだとりすくになりかねません",
    chinese: "这样下去可能会变成风险。",
    category: "grammar",
    register: "丁寧",
    difficulty: 4,
    frequencyRank: 175,
    chunkPattern: "~かねない",
    tags: ["N1", "风险"],
  },

  // === ～うえに / うえで ===
  {
    japanese: "詳細をご確認のうえ、ご返信ください。",
    tokens: [
      { text: "詳細", kana: "しょうさい" },
      { text: "をご" },
      { text: "確認", kana: "かくにん" },
      { text: "のうえ、" },
      { text: "ご" },
      { text: "返信", kana: "へんしん" },
      { text: "ください。" },
    ],
    kana: "しょうさいをごかくにんのうえ、ごへんしんください",
    chinese: "请确认细节后回信。",
    category: "grammar",
    register: "敬語",
    difficulty: 3,
    frequencyRank: 120,
    chunkPattern: "~のうえで",
    tags: ["N2", "邮件"],
  },

  // === ～にもかかわらず ===
  {
    japanese: "遅くにもかかわらず、ご対応いただきありがとうございます。",
    tokens: [
      { text: "遅く", kana: "おそく" },
      { text: "にもかかわらず、" },
      { text: "ご" },
      { text: "対応", kana: "たいおう" },
      { text: "いただき" },
      { text: "ありがとうございます。" },
    ],
    kana: "おそくにもかかわらず、ごたいおういただきありがとうございます",
    chinese: "这么晚还麻烦您处理，非常感谢。",
    category: "grammar",
    register: "敬語",
    difficulty: 4,
    frequencyRank: 220,
    chunkPattern: "~にもかかわらず",
    tags: ["N1", "邮件", "感谢"],
  },

  // === ～にしては ===
  {
    japanese: "新人にしてはよくできていますね。",
    tokens: [
      { text: "新人", kana: "しんじん" },
      { text: "にしては" },
      { text: "よくできていますね。" },
    ],
    kana: "しんじんにしてはよくできていますね",
    chinese: "作为新人，做得不错。",
    category: "grammar",
    register: "丁寧",
    difficulty: 3,
    frequencyRank: 250,
    chunkPattern: "~にしては",
    tags: ["N2", "评价"],
  },

  // === ～ものの ===
  {
    japanese: "報告は受けたものの、まだ詳細が分かりません。",
    tokens: [
      { text: "報告", kana: "ほうこく" },
      { text: "は" },
      { text: "受けた", kana: "うけた" },
      { text: "ものの、まだ" },
      { text: "詳細", kana: "しょうさい" },
      { text: "が" },
      { text: "分かりません。", kana: "わかりません" },
    ],
    kana: "ほうこくはうけたものの、まだしょうさいがわかりません",
    chinese: "虽然收到报告了，但具体细节还不清楚。",
    category: "grammar",
    register: "丁寧",
    difficulty: 4,
    frequencyRank: 230,
    chunkPattern: "~ものの",
    tags: ["N2", "转折"],
  },

  // === ～たびに ===
  {
    japanese: "彼に会うたびに新しい発見があります。",
    tokens: [
      { text: "彼", kana: "かれ" },
      { text: "に" },
      { text: "会う", kana: "あう" },
      { text: "たびに" },
      { text: "新しい", kana: "あたらしい" },
      { text: "発見", kana: "はっけん" },
      { text: "があります。" },
    ],
    kana: "かれにあうたびにあたらしいはっけんがあります",
    chinese: "每次见到他都有新发现。",
    category: "grammar",
    register: "丁寧",
    difficulty: 3,
    frequencyRank: 280,
    chunkPattern: "~たびに",
    tags: ["N2", "频率"],
  },

  // === ～どころか ===
  {
    japanese: "解決どころか、新しい問題まで出てきました。",
    tokens: [
      { text: "解決", kana: "かいけつ" },
      { text: "どころか、" },
      { text: "新しい", kana: "あたらしい" },
      { text: "問題", kana: "もんだい" },
      { text: "まで" },
      { text: "出て", kana: "でて" },
      { text: "きました。" },
    ],
    kana: "かいけつどころか、あたらしいもんだいまででてきました",
    chinese: "别说解决，新问题反而冒出来了。",
    category: "grammar",
    register: "丁寧",
    difficulty: 4,
    frequencyRank: 290,
    chunkPattern: "~どころか",
    tags: ["N1", "强调"],
  },

  // === ～あまり ===
  {
    japanese: "急ぎすぎたあまり、ミスが多くなりました。",
    tokens: [
      { text: "急ぎすぎた", kana: "いそぎすぎた" },
      { text: "あまり、ミスが" },
      { text: "多く", kana: "おおく" },
      { text: "なりました。" },
    ],
    kana: "いそぎすぎたあまり、みすがおおくなりました",
    chinese: "因为太着急，错误就多了。",
    category: "grammar",
    register: "丁寧",
    difficulty: 4,
    frequencyRank: 310,
    chunkPattern: "~あまり",
    tags: ["N1", "原因"],
  },

  // === ～さえ～ば ===
  {
    japanese: "資料さえあれば、すぐに対応できます。",
    tokens: [
      { text: "資料", kana: "しりょう" },
      { text: "さえあれば、すぐに" },
      { text: "対応", kana: "たいおう" },
      { text: "できます。" },
    ],
    kana: "しりょうさえあれば、すぐにたいおうできます",
    chinese: "只要有资料，我立刻可以处理。",
    category: "grammar",
    register: "丁寧",
    difficulty: 3,
    frequencyRank: 270,
    chunkPattern: "~さえ~ば",
    tags: ["N2", "条件"],
  },
]
