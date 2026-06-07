import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { db, schema } from "@/lib/db/client"
import { STAGES, type Stage, stageLabel } from "@/lib/progress"
import { cn } from "@/lib/utils"
import { sql } from "drizzle-orm"
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  FlipHorizontal2,
  Headphones,
  Layers3,
  MonitorPlay,
  PencilLine,
  PlayCircle,
  Sparkles,
  Volume2,
  Zap,
} from "lucide-react"
import Link from "next/link"

const TRAINING = [
  {
    href: "/drill",
    stage: "Stage 2",
    title: "写作 Drill",
    desc: "中文提示到日语输出，修复“懂但说不出”。",
    icon: PencilLine,
    tone: "teal",
  },
  {
    href: "/read-aloud",
    stage: "Stage 2.5",
    title: "音読",
    desc: "跟读、朗读、纠音，把句子变成肌肉记忆。",
    icon: Volume2,
    tone: "indigo",
  },
  {
    href: "/listen-write",
    stage: "Stage 3",
    title: "听写",
    desc: "只听不看，训练真实会话里的辨音能力。",
    icon: Headphones,
    tone: "sage",
  },
  {
    href: "/quick-fire",
    stage: "Stage 4",
    title: "Quick-Fire",
    desc: "5 秒内开口，逼近真实会议里的反应速度。",
    icon: Zap,
    tone: "coral",
  },
] as const

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
    <div className="page-container space-y-8">
      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden border-accent/15 bg-white/78">
          <div className="grid gap-0 lg:grid-cols-[1fr_17rem]">
            <div className="space-y-7 p-6 sm:p-8 lg:p-10">
              <div className="space-y-4">
                <p className="page-kicker">
                  <Sparkles className="h-4 w-4" strokeWidth={1.75} />
                  おかえりなさい
                </p>
                <div className="space-y-3">
                  <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-fg sm:text-5xl">
                    今天，把一句日语练到能脱口而出。
                  </h1>
                  <p className="max-w-2xl text-base leading-relaxed text-fg-secondary">
                    用短句、场景、听写和快速开口，把“能读懂”逐步推进到“能在会议里自然说出来”。
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="sm:min-w-40">
                  <Link href="/drill">
                    开始训练
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/quick-fire">
                    Quick-Fire
                    <Zap className="h-4 w-4 text-vermilion" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="border-t border-border bg-surface-tint/80 p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div className="grid h-full content-between gap-5">
                <Metric
                  label="语料"
                  value={totalSentences}
                  detail={`${presetCount} 预置 / ${customCount} 自建`}
                />
                <Metric
                  label="到期复习"
                  value={dueCount}
                  detail="今日优先处理"
                  tone={dueCount > 0 ? "warning" : "success"}
                />
                <Metric
                  label="战斗力"
                  value={stageCounts[4] ?? 0}
                  detail="Stage 4 通过句"
                  tone="coral"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Badge variant="accent">今日重点</Badge>
              <h2 className="text-2xl font-semibold leading-tight text-fg">先做一轮写作 Drill</h2>
              <p className="text-sm leading-relaxed text-fg-secondary">
                {dueCount > 0
                  ? `${dueCount} 句已经到期，先复习会更稳。`
                  : "从最高频句子开始，完成一轮就能推进间隔复习。"}
              </p>
            </div>
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
              <PlayCircle className="h-6 w-6" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-8 space-y-3">
            <FocusStep done label="看中文提示" />
            <FocusStep done label="写出自然日语" />
            <FocusStep label="核对差异并自评" />
          </div>
          <Button asChild className="mt-8 w-full" size="lg">
            <Link href="/drill">
              进入今日训练
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="page-kicker">Training Flow</p>
            <h2 className="mt-2 text-2xl font-semibold text-fg">四段式训练</h2>
          </div>
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/library">
              查看语料
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {TRAINING.map((item) => (
            <TrainingCard key={item.href} {...item} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="page-kicker">Progress Map</p>
              <h2 className="mt-2 text-2xl font-semibold text-fg">通关地图</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-fg-secondary">
                一句话停留在哪一关，就只算到哪一关。Stage 4 才接近真实输出。
              </p>
            </div>
            <Layers3 className="h-6 w-6 text-fg-tertiary" strokeWidth={1.75} />
          </div>
          <div className="mt-7 space-y-4">
            {STAGES.filter((s) => s !== 5).map((s) => (
              <StageRow key={s} stage={s} count={stageCounts[s] ?? 0} total={totalSentences} />
            ))}
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <ResourceCard
            href="/display"
            icon={MonitorPlay}
            title="Display 模式"
            desc={`${totalSentences} 句轮播，适合副屏和碎片时间。`}
            badge="Ambient"
          />
          <ResourceCard
            href="/passages"
            icon={FileText}
            title="短文阅读"
            desc="用阅读优势进入商务邮件、会议纪要和新闻语境。"
            badge="Reading"
          />
          <ResourceCard
            href="/dialogues"
            icon={BookOpen}
            title="情景对话"
            desc="多轮对话逐句听读，练真实交互节奏。"
            badge="Dialogues"
          />
          <ResourceCard
            href="/verbs"
            icon={FlipHorizontal2}
            title="動詞変形"
            desc="动词变形轮播训练：受身・使役・使役受身。"
            badge="Verbs"
          />
        </div>
      </section>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string
  value: number
  detail: string
  tone?: "default" | "warning" | "success" | "coral"
}) {
  return (
    <div className="rounded-lg border border-border bg-white/66 p-4">
      <p className="text-xs font-medium text-fg-tertiary">{label}</p>
      <p
        className={cn(
          "mt-2 font-mono text-3xl font-semibold leading-none tabular",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
          tone === "coral" && "text-vermilion",
          tone === "default" && "text-fg",
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-fg-secondary">{detail}</p>
    </div>
  )
}

function FocusStep({ label, done = false }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-white/58 px-3 py-2">
      <CheckCircle2
        className={cn("h-4 w-4", done ? "text-success" : "text-fg-tertiary")}
        strokeWidth={1.75}
      />
      <span className={cn("text-sm", done ? "text-fg" : "text-fg-secondary")}>{label}</span>
    </div>
  )
}

function TrainingCard({ href, stage, title, desc, icon: Icon, tone }: (typeof TRAINING)[number]) {
  const toneClass = {
    teal: "bg-accent-soft text-accent border-accent/20",
    indigo: "bg-indigo/10 text-indigo border-indigo/20",
    sage: "bg-success-soft text-success border-success/20",
    coral: "bg-danger-soft text-vermilion border-vermilion/20",
  }[tone]

  return (
    <Link href={href} className="group">
      <Card className="pressable h-full overflow-hidden">
        <div className="flex h-full flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className={cn("grid h-11 w-11 place-items-center rounded-lg border", toneClass)}>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <span className="rounded bg-white/70 px-2 py-1 font-mono text-[10px] text-fg-tertiary">
              {stage}
            </span>
          </div>
          <div className="mt-6 flex-1">
            <h3 className="text-lg font-semibold text-fg">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{desc}</p>
          </div>
          <div className="mt-5 flex items-center text-sm font-medium text-accent">
            进入
            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Card>
    </Link>
  )
}

function ResourceCard({
  href,
  icon: Icon,
  title,
  desc,
  badge,
}: {
  href: string
  icon: typeof BookOpen
  title: string
  desc: string
  badge: string
}) {
  return (
    <Link href={href} className="group">
      <Card className="pressable h-full p-5">
        <div className="flex gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-border bg-white/70 text-fg-secondary">
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-fg">{title}</h3>
              <span className="font-mono text-[10px] text-fg-tertiary">{badge}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}

function StageRow({ stage, count, total }: { stage: Stage; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const isCore = stage === 4
  return (
    <div className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-4 sm:grid-cols-[7.5rem_1fr_5.5rem]">
      <div>
        <p className={cn("text-sm font-semibold", isCore ? "text-vermilion" : "text-fg")}>
          Stage {stage === 25 ? "2.5" : stage}
        </p>
        <p className="mt-0.5 text-xs text-fg-tertiary">{stageLabel(stage)}</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-muted">
        <div
          className={cn("h-full rounded-full", isCore ? "bg-vermilion" : "bg-accent")}
          style={{ width: `${Math.max(pct, isCore && pct === 0 ? 1.5 : 0)}%` }}
        />
      </div>
      <div className="text-right">
        <p
          className={cn(
            "font-mono text-lg font-semibold tabular",
            isCore ? "text-vermilion" : "text-fg",
          )}
        >
          {pct}%
        </p>
        <p className="font-mono text-[10px] text-fg-tertiary">
          {count}/{total}
        </p>
      </div>
    </div>
  )
}
