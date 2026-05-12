/**
 * Seed the SQLite db with curated workplace Japanese sentences.
 * Run: pnpm db:seed (after pnpm db:push)
 */

import { sql } from "drizzle-orm"
import { db, schema } from "../lib/db/client"
import { id } from "../lib/id"

type Seed = {
  japanese: string
  kana: string
  chinese: string
  category: "rescue" | "progress" | "request" | "apology" | "smalltalk"
  difficulty: 1 | 2 | 3 | 4 | 5
  tags?: string[]
}

const seeds: Seed[] = [
  // === 救命句（卡壳时的缓冲、拖时间、请求重复） ===
  { japanese: "少々お待ちください。", kana: "しょうしょうおまちください", chinese: "请稍等一下。", category: "rescue", difficulty: 1, tags: ["缓冲", "万能"] },
  { japanese: "少し考えさせてください。", kana: "すこしかんがえさせてください", chinese: "让我想一下。", category: "rescue", difficulty: 2, tags: ["缓冲", "高频"] },
  { japanese: "もう一度お願いできますか。", kana: "もういちどおねがいできますか", chinese: "可以再说一遍吗？", category: "rescue", difficulty: 2, tags: ["请求重复"] },
  { japanese: "すみません、聞き取れませんでした。", kana: "すみません、ききとれませんでした", chinese: "不好意思，没听清。", category: "rescue", difficulty: 2, tags: ["请求重复"] },
  { japanese: "現時点では未確認です。", kana: "げんじてんではみかくにんです", chinese: "目前还没确认。", category: "rescue", difficulty: 3, tags: ["拖延", "汇报"] },
  { japanese: "確認してから共有します。", kana: "かくにんしてからきょうゆうします", chinese: "确认之后再分享。", category: "rescue", difficulty: 3, tags: ["拖延", "承诺"] },
  { japanese: "うまく説明できないのですが。", kana: "うまくせつめいできないのですが", chinese: "不太好解释……", category: "rescue", difficulty: 3, tags: ["缓冲"] },
  { japanese: "後ほど共有させていただきます。", kana: "のちほどきょうゆうさせていただきます", chinese: "稍后我会分享给您。", category: "rescue", difficulty: 3, tags: ["承诺", "敬语"] },
  { japanese: "認識合わせをさせてください。", kana: "にんしきあわせをさせてください", chinese: "让我们对一下认识。", category: "rescue", difficulty: 4, tags: ["对齐"] },
  { japanese: "前提を整理させてください。", kana: "ぜんていをせいりさせてください", chinese: "让我先理一下前提。", category: "rescue", difficulty: 4, tags: ["缓冲", "整理"] },

  // === 进度报告 ===
  { japanese: "予定通り進んでいます。", kana: "よていどおりすすんでいます", chinese: "按计划在推进。", category: "progress", difficulty: 2, tags: ["报告"] },
  { japanese: "少し遅れが出ています。", kana: "すこしおくれがでています", chinese: "稍微有些延迟。", category: "progress", difficulty: 2, tags: ["报告", "风险"] },
  { japanese: "リスクが一点ございます。", kana: "りすくがいってんございます", chinese: "有一个风险点。", category: "progress", difficulty: 3, tags: ["风险", "敬语"] },
  { japanese: "現状を整理してご報告します。", kana: "げんじょうをせいりしてごほうこくします", chinese: "我整理一下现状然后汇报。", category: "progress", difficulty: 3, tags: ["报告"] },
  { japanese: "明日までに共有できる見込みです。", kana: "あすまでにきょうゆうできるみこみです", chinese: "预计明天之前可以分享。", category: "progress", difficulty: 3, tags: ["承诺", "时间"] },
  { japanese: "現在対応中です。", kana: "げんざいたいおうちゅうです", chinese: "目前正在处理。", category: "progress", difficulty: 1, tags: ["报告"] },
  { japanese: "もう少しで完了します。", kana: "もうすこしでかんりょうします", chinese: "再稍等就完成了。", category: "progress", difficulty: 2, tags: ["报告"] },
  { japanese: "進捗共有させていただきます。", kana: "しんちょくきょうゆうさせていただきます", chinese: "我来分享一下进度。", category: "progress", difficulty: 3, tags: ["报告", "敬语"] },
  { japanese: "おおむね順調です。", kana: "おおむねじゅんちょうです", chinese: "大致顺利。", category: "progress", difficulty: 3, tags: ["报告"] },
  { japanese: "課題が一つ残っています。", kana: "かだいがひとつのこっています", chinese: "还有一个课题没解决。", category: "progress", difficulty: 3, tags: ["报告"] },

  // === 请求 / 确认 ===
  { japanese: "この件についてご相談したいです。", kana: "このけんについてごそうだんしたいです", chinese: "想就这件事和您商量。", category: "request", difficulty: 2, tags: ["请求"] },
  { japanese: "もう一度確認させていただけますか。", kana: "もういちどかくにんさせていただけますか", chinese: "可以让我再确认一下吗？", category: "request", difficulty: 3, tags: ["确认", "敬语"] },
  { japanese: "認識に齟齬がないか確認させてください。", kana: "にんしきにそごがないかかくにんさせてください", chinese: "让我确认一下我们认识是否一致。", category: "request", difficulty: 4, tags: ["对齐"] },
  { japanese: "ご都合のよい時間を教えていただけますか。", kana: "ごつごうのよいじかんをおしえていただけますか", chinese: "方便告诉我您方便的时间吗？", category: "request", difficulty: 3, tags: ["约时间"] },
  { japanese: "差し支えなければ、共有していただけますか。", kana: "さしつかえなければ、きょうゆうしていただけますか", chinese: "如果没问题，可以分享给我吗？", category: "request", difficulty: 4, tags: ["请求", "敬语"] },
  { japanese: "アドバイスをいただけると幸いです。", kana: "あどばいすをいただけるとさいわいです", chinese: "希望能得到您的建议。", category: "request", difficulty: 3, tags: ["请求", "邮件"] },
  { japanese: "認識を合わせたく、お時間いただけますか。", kana: "にんしきをあわせたく、おじかんいただけますか", chinese: "想对齐一下认识，能借用您一些时间吗？", category: "request", difficulty: 4, tags: ["对齐", "约时间"] },
  { japanese: "サンプルを共有いただけますでしょうか。", kana: "さんぷるをきょうゆういただけますでしょうか", chinese: "能分享一份样本吗？", category: "request", difficulty: 3, tags: ["请求"] },

  // === 道歉 / 调整 ===
  { japanese: "申し訳ございません。", kana: "もうしわけございません", chinese: "非常抱歉。", category: "apology", difficulty: 1, tags: ["道歉", "敬语"] },
  { japanese: "ご迷惑をおかけしました。", kana: "ごめいわくをおかけしました", chinese: "给您添麻烦了。", category: "apology", difficulty: 2, tags: ["道歉"] },
  { japanese: "私の確認不足でした。", kana: "わたしのかくにんぶそくでした", chinese: "是我确认不足。", category: "apology", difficulty: 3, tags: ["道歉", "复盘"] },
  { japanese: "認識違いがありました。", kana: "にんしきちがいがありました", chinese: "之前认识有出入。", category: "apology", difficulty: 3, tags: ["复盘"] },
  { japanese: "再発防止に努めます。", kana: "さいはつぼうしにつとめます", chinese: "我会努力防止再次发生。", category: "apology", difficulty: 4, tags: ["复盘"] },
  { japanese: "別途調整させていただきます。", kana: "べっとちょうせいさせていただきます", chinese: "我会另外协调。", category: "apology", difficulty: 3, tags: ["调整", "敬语"] },
  { japanese: "今後気をつけます。", kana: "こんごきをつけます", chinese: "今后我会注意。", category: "apology", difficulty: 1, tags: ["复盘"] },
  { japanese: "ご指摘ありがとうございます。", kana: "ごしてきありがとうございます", chinese: "感谢您的指出。", category: "apology", difficulty: 2, tags: ["回应"] },

  // === 杂谈 / 距离感 ===
  { japanese: "お疲れさまです。", kana: "おつかれさまです", chinese: "辛苦了 / 你好（同事打招呼）。", category: "smalltalk", difficulty: 1, tags: ["寒暄"] },
  { japanese: "週末いかがでしたか。", kana: "しゅうまついかがでしたか", chinese: "周末过得怎么样？", category: "smalltalk", difficulty: 1, tags: ["寒暄"] },
  { japanese: "最近お忙しいですか。", kana: "さいきんおいそがしいですか", chinese: "最近忙吗？", category: "smalltalk", difficulty: 1, tags: ["寒暄"] },
  { japanese: "そろそろランチに行きませんか。", kana: "そろそろらんちにいきませんか", chinese: "差不多该去吃午饭了吧？", category: "smalltalk", difficulty: 2, tags: ["邀请"] },
  { japanese: "いつもお世話になっております。", kana: "いつもおせわになっております", chinese: "一直承蒙关照。", category: "smalltalk", difficulty: 2, tags: ["邮件", "寒暄"] },
  { japanese: "こちらこそありがとうございます。", kana: "こちらこそありがとうございます", chinese: "我才要谢谢您呢。", category: "smalltalk", difficulty: 2, tags: ["回应"] },
  { japanese: "お先に失礼します。", kana: "おさきにしつれいします", chinese: "我先走了（下班用）。", category: "smalltalk", difficulty: 1, tags: ["寒暄"] },
  { japanese: "今日もよろしくお願いします。", kana: "きょうもよろしくおねがいします", chinese: "今天也请多关照。", category: "smalltalk", difficulty: 1, tags: ["寒暄"] },
]

async function main() {
  console.log(`Seeding ${seeds.length} sentences...`)

  // Skip if already seeded (don't dup on re-run)
  const existing = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.sentence)
    .where(sql`source = 'preset'`)
    .all()
  const presetCount = existing[0]?.count ?? 0
  if (presetCount > 0) {
    console.log(`  → Already have ${presetCount} preset sentences. Skipping.`)
    return
  }

  for (const s of seeds) {
    db.insert(schema.sentence)
      .values({
        id: id(),
        japanese: s.japanese,
        kana: s.kana,
        chinese: s.chinese,
        category: s.category,
        difficulty: s.difficulty,
        source: "preset",
        tags: s.tags ?? [],
      })
      .run()
  }

  console.log(`  ✓ Seeded ${seeds.length} sentences.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
