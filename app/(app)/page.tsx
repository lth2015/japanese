import { sql } from "drizzle-orm"
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Headphones,
  MonitorPlay,
  PencilLine,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { db, schema } from "@/lib/db/client"
import { STAGES, stageLabel, type Stage } from "@/lib/progress"
import { cn } from "@/lib/utils"

export default async function DashboardPage() {
  const [{ totalSentences }] = db
    .select({ totalSentences: sql<number>`count(*)` })
    .from(schema.sentence)
    .all()

  const [{ presetCount }] = db
    .select({ presetCount: sql<number>`count(*)` })
    .from(schema.sentence)
    .where(sql`source = 'preset'`)
    .all()

  const customCount = totalSentences - presetCount

  // Stage counts: how many sentences have currentStage >= S for each S.
  // Stage 1 is implicit baseline = totalSentences.
  const stageCounts: Record<number, number> = { 1: totalSentences }
  for (const s of STAGES) {
    if (s === 1) continue
    const [{ c }] = db
      .select({ c: sql<number>`count(*)` })
      .from(schema.userProgress)
      .where(sql`${schema.userProgress.currentStage} >= ${s}`)
      .all()
    stageCounts[s] = c
  }

  // Due-today review count (Stage 2 only for now)
  const nowSec = Math.floor(Date.now() / 1000)
  const [{ dueCount }] = db
    .select({ dueCount: sql<number>`count(*)` })
    .from(schema.userProgress)
    .where(
      sql`json_extract(${schema.userProgress.sm2}, '$.s2.nextReviewAt') IS NOT NULL AND
          json_extract(${schema.userProgress.sm2}, '$.s2.nextReviewAt') <= ${nowSec}`,
    )
    .all()

  return (
    <div className="px-6 lg:px-16 xl:px-24 py-10 lg:py-16 max-w-7xl mx-auto space-y-14">
      <header className="space-y-4">
        <p className="text-base lg:text-lg text-text-secondary font-jp">おかえりなさい</p>
        <h1 className="text-4xl lg:text-6xl xl:text-7xl font-semibold tracking-tight leading-[1.05]">
          今天，开口几次？
        </h1>
        <p className="text-lg text-text-secondary max-w-2xl leading-relaxed">
          目标：把"看得懂"变成"说得出来"。每天一点 drill，比周末补课有效十倍。
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Drill — highest priority */}
        <TrainingCard
          href="/drill"
          badge="Stage 2 · 主战场"
          badgeVariant="accent"
          title="写作 Drill"
          desc={
            dueCount > 0
              ? `今天有 ${dueCount} 句待复习，先把它们过一遍。`
              : `中文 → 日文 打字翻译。${stageCounts[2] > 0 ? `已完成 ${stageCounts[2]} 句` : "从最高频的句子开始"}。`
          }
          icon={PencilLine}
          cta="开始 Drill"
          span={2}
          primary
        />

        {/* Quick-Fire — vermilion accent, the "real combat" stage */}
        <TrainingCard
          href="/quick-fire"
          badge="Stage 4 · 战场"
          badgeVariant="danger"
          title="Quick-Fire"
          desc="5 秒内开口。流畅 > 准确。这是真实战斗力的位置。"
          icon={Zap}
          cta="开始"
          accent="vermilion"
        />

        {/* 音読 */}
        <TrainingCard
          href="/read-aloud"
          badge="Stage 2.5"
          title="音読"
          desc="看带 furigana 的日文 → 朗读出声 → STT 校对。修复字↔声联结。"
          icon={Volume2}
          cta="开始朗读"
        />

        {/* 听写 */}
        <TrainingCard
          href="/listen-write"
          badge="Stage 3"
          title="听写"
          desc="只听不看，把日文写下来。听力会塌方，那是进步起点。"
          icon={Headphones}
          cta="开始听写"
        />

        {/* 短文 */}
        <TrainingCard
          href="/passages"
          badge="阅读"
          title="短文"
          desc={`用你"读"的强项当入口。读完用日语回答问题。`}
          icon={FileText}
          cta="进入"
        />

        {/* Display */}
        <TrainingCard
          href="/display"
          badge="副屏 · 被动"
          title="Display"
          desc={`${totalSentences} 句轮播。挂在副屏 / 手机，长期被动接触。`}
          icon={MonitorPlay}
          cta="立即播放"
        />

        {/* Library */}
        <TrainingCard
          href="/library"
          badge="浏览"
          title="场景库"
          desc={`${presetCount} 句预置 · ${customCount} 句自建`}
          icon={BookOpen}
          cta="浏览"
        />
      </section>

      <Separator />

      {/* 通关地图 */}
      <section className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl lg:text-4xl font-semibold tracking-tight">通关地图</h2>
            <Sparkles className="h-5 w-5 text-text-muted" strokeWidth={1.75} />
          </div>
          <p className="text-base text-text-secondary leading-relaxed max-w-2xl">
            以最低阶段标识能力——一句话停留在哪一关，就只算到哪一关。
            <span className="text-vermilion ml-1">Stage 4 才是真实战斗力。</span>
          </p>
        </div>
        <div className="space-y-5 mt-6 max-w-3xl">
          {STAGES.filter((s) => s !== 5).map((s) => (
            <StageRow
              key={s}
              stage={s}
              count={stageCounts[s] ?? 0}
              total={totalSentences}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

interface TrainingCardProps {
  href: string
  badge: string
  badgeVariant?: "default" | "accent" | "danger" | "warning" | "success" | "outline"
  title: string
  desc: string
  icon: typeof PencilLine
  cta: string
  span?: 1 | 2
  primary?: boolean
  accent?: "vermilion"
}

function TrainingCard({
  href,
  badge,
  badgeVariant,
  title,
  desc,
  icon: Icon,
  cta,
  span = 1,
  primary,
  accent,
}: TrainingCardProps) {
  return (
    <Card
      className={cn(
        "hover:border-border-strong transition-colors group",
        span === 2 && "lg:col-span-2",
        accent === "vermilion" && "border-vermilion/30 hover:border-vermilion/60",
      )}
    >
      <CardContent className="p-7 lg:p-8 flex flex-col gap-5 h-full">
        <div className="flex items-center justify-between">
          <Badge variant={badgeVariant}>{badge}</Badge>
          <Icon
            className={cn(
              "h-6 w-6",
              accent === "vermilion" ? "text-vermilion" : "text-text-muted",
            )}
            strokeWidth={1.75}
          />
        </div>
        <div className="space-y-2 flex-1">
          <h2
            className={cn(
              "font-semibold tracking-tight leading-tight",
              span === 2 ? "text-3xl lg:text-4xl" : "text-2xl lg:text-3xl",
            )}
          >
            {title}
          </h2>
          <p className="text-text-secondary text-base leading-relaxed">{desc}</p>
        </div>
        <div>
          <Button variant={primary ? "default" : "secondary"} size="lg" asChild>
            <Link href={href}>
              {cta} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function StageRow({ stage, count, total }: { stage: Stage; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const isCore = stage === 4
  return (
    <div className="flex items-center gap-5">
      <div className="w-44 shrink-0">
        <p
          className={cn(
            "text-lg font-semibold",
            isCore ? "text-vermilion" : "text-text-primary",
          )}
        >
          Stage {stage === 25 ? "2.5" : stage}
        </p>
        <p className="text-sm text-text-muted">{stageLabel(stage)}</p>
      </div>
      <div className="flex-1 h-3 rounded-full bg-bg-overlay overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out-expo",
            isCore ? "bg-vermilion" : "bg-accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-24 shrink-0 text-right">
        <p
          className={cn(
            "text-2xl font-semibold tabular leading-none",
            isCore ? "text-vermilion" : "text-text-primary",
          )}
        >
          {pct}%
        </p>
        <p className="text-xs text-text-muted tabular mt-1">
          {count} / {total}
        </p>
      </div>
    </div>
  )
}
