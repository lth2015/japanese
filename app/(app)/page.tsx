import { sql } from "drizzle-orm"
import {
  ArrowRight,
  BookOpen,
  FileText,
  Headphones,
  MonitorPlay,
  PencilLine,
  Volume2,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
    <div className="px-6 lg:px-10 py-8 lg:py-12 max-w-6xl space-y-12">
      {/* Header */}
      <header className="space-y-3">
        <p className="text-sm text-fg-tertiary font-jp tracking-wide">おかえりなさい</p>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-fg">
          今天，开口几次？
        </h1>
        <p className="text-base text-fg-secondary max-w-2xl">
          目标：把"看得懂"变成"说得出来"。每天 15 分钟 drill，比周末补课有效十倍。
        </p>
      </header>

      {/* Today focus */}
      <FocusCard
        dueCount={dueCount}
        stage2Count={stageCounts[2] ?? 0}
        totalSentences={totalSentences}
      />

      {/* Training pages */}
      <section className="space-y-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-fg-tertiary">训练</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <TrainingCard
            href="/drill"
            badge="Stage 2"
            title="写作 Drill"
            desc="中文 → 日文 打字翻译"
            icon={PencilLine}
          />
          <TrainingCard
            href="/read-aloud"
            badge="Stage 2.5"
            title="音読"
            desc="朗读出声，修复字↔声联结"
            icon={Volume2}
          />
          <TrainingCard
            href="/listen-write"
            badge="Stage 3"
            title="听写"
            desc="只听不看，写下你听到的"
            icon={Headphones}
          />
          <TrainingCard
            href="/quick-fire"
            badge="Stage 4"
            badgeAccent="vermilion"
            title="Quick-Fire"
            desc="5 秒内开口。真实战斗力的位置"
            icon={Zap}
            accent="vermilion"
          />
          <TrainingCard
            href="/passages"
            badge="阅读"
            title="短文"
            desc={`用"读"的强项作为入口`}
            icon={FileText}
          />
          <TrainingCard
            href="/library"
            badge="资源"
            title="场景库"
            desc={`${presetCount} 句预置 · ${customCount} 句自建`}
            icon={BookOpen}
          />
        </div>
      </section>

      {/* Display */}
      <section className="space-y-5">
        <h2 className="text-xs font-medium uppercase tracking-wider text-fg-tertiary">被动接触</h2>
        <Card className="overflow-hidden">
          <Link
            href="/display"
            className="flex items-center justify-between gap-6 p-6 hover:bg-bg-subtle transition-colors"
          >
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-md bg-bg-subtle border border-border grid place-items-center shrink-0">
                <MonitorPlay className="h-5 w-5 text-fg-secondary" strokeWidth={1.75} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-fg">Display 模式</h3>
                <p className="text-sm text-fg-secondary">
                  挂在副屏 / 手机锁屏。{totalSentences} 句轮播，长期被动累积。
                </p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-fg-tertiary shrink-0" />
          </Link>
        </Card>
      </section>

      {/* Stage map */}
      <section className="space-y-5">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-fg">通关地图</h2>
          <p className="text-sm text-fg-secondary max-w-2xl">
            以最低阶段标识能力——一句话停留在哪一关，就只算到哪一关。
            <span className="text-vermilion font-medium">Stage 4 才是真实战斗力。</span>
          </p>
        </div>
        <Card className="p-6 lg:p-8 space-y-5">
          {STAGES.filter((s) => s !== 5).map((s) => (
            <StageRow
              key={s}
              stage={s}
              count={stageCounts[s] ?? 0}
              total={totalSentences}
            />
          ))}
        </Card>
      </section>
    </div>
  )
}

/** Hero card — today's most actionable thing. Bigger than training-card. */
function FocusCard({
  dueCount,
  stage2Count,
  totalSentences,
}: {
  dueCount: number
  stage2Count: number
  totalSentences: number
}) {
  const hint =
    dueCount > 0
      ? `${dueCount} 句到期复习`
      : stage2Count > 0
        ? `继续推进（已通过 ${stage2Count} 句）`
        : `从最高频的句子开始`
  return (
    <Card className="p-7 lg:p-9 bg-accent-soft/60 border-accent/20">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="space-y-3 max-w-xl">
          <Badge variant="accent">今日重点</Badge>
          <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-fg">
            写作 Drill
          </h2>
          <p className="text-base text-fg-secondary">
            把中文翻译成日语。{hint}。
            {totalSentences > 0 && (
              <span className="block mt-1 text-sm text-fg-tertiary">
                共 {totalSentences} 句可练。
              </span>
            )}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/drill">
            开始 <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}

interface TrainingCardProps {
  href: string
  badge: string
  badgeAccent?: "vermilion"
  title: string
  desc: string
  icon: typeof PencilLine
  accent?: "vermilion"
}

function TrainingCard({ href, badge, badgeAccent, title, desc, icon: Icon, accent }: TrainingCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-sm hover:-translate-y-px transition-all duration-200">
      <Link href={href} className="block p-6 h-full">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div
            className={cn(
              "h-10 w-10 rounded-md grid place-items-center shrink-0",
              accent === "vermilion"
                ? "bg-vermilion/10 text-vermilion border border-vermilion/20"
                : "bg-bg-subtle text-fg-secondary border border-border",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <span
            className={cn(
              "text-xs font-mono mt-0.5",
              badgeAccent === "vermilion" ? "text-vermilion font-medium" : "text-fg-tertiary",
            )}
          >
            {badge}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-fg leading-snug mb-2">{title}</h3>
        <p className="text-sm text-fg-secondary leading-relaxed">{desc}</p>
      </Link>
    </Card>
  )
}

function StageRow({ stage, count, total }: { stage: Stage; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const isCore = stage === 4
  return (
    <div className="flex items-center gap-5">
      <div className="w-36 shrink-0">
        <p
          className={cn(
            "text-sm font-semibold",
            isCore ? "text-vermilion" : "text-fg",
          )}
        >
          Stage {stage === 25 ? "2.5" : stage}
        </p>
        <p className="text-xs text-fg-tertiary mt-0.5">{stageLabel(stage)}</p>
      </div>
      <div className="flex-1 h-2 rounded-full bg-bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out-expo rounded-full",
            isCore ? "bg-vermilion" : "bg-accent",
          )}
          style={{ width: `${Math.max(pct, isCore && pct === 0 ? 1.5 : 0)}%` }}
        />
      </div>
      <div className="w-24 shrink-0 text-right">
        <p
          className={cn(
            "text-lg font-semibold tabular leading-none",
            isCore ? "text-vermilion" : "text-fg",
          )}
        >
          {pct}%
        </p>
        <p className="text-xs text-fg-tertiary tabular mt-1 font-mono">
          {count} / {total}
        </p>
      </div>
    </div>
  )
}
