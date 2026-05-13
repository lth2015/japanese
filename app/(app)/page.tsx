import { sql } from "drizzle-orm"
import { ArrowUpRight, BookOpen, MonitorPlay, PencilLine, Sparkles, Volume2 } from "lucide-react"
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
    <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-6xl mx-auto space-y-10">
      <header className="space-y-2">
        <p className="text-sm text-text-secondary font-jp">おかえりなさい</p>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
          今天，开口几次？
        </h1>
        <p className="text-text-secondary">
          训练的目标是把"看得懂"变成"说得出来"。每天一点 drill，比周末补课有效十倍。
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Drill — highest priority CTA */}
        <Card className="lg:col-span-2 hover:border-border-strong transition-colors group">
          <CardContent className="p-6 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <Badge variant="accent">Stage 2 · 主战场</Badge>
              <PencilLine className="h-5 w-5 text-text-muted" strokeWidth={1.75} />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">写作 Drill</h2>
              <p className="text-text-secondary text-sm">
                {dueCount > 0
                  ? `今天有 ${dueCount} 句待复习，先把它们过一遍。`
                  : `开始把中文翻译成日语。${stageCounts[2] > 0 ? `已完成 ${stageCounts[2]} 句` : "从最高频的句子开始"}。`}
              </p>
            </div>
            <div>
              <Button asChild>
                <Link href="/drill">
                  开始 Drill <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Display */}
        <Card className="hover:border-border-strong transition-colors group">
          <CardContent className="p-6 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <Badge>副屏 · 被动</Badge>
              <MonitorPlay className="h-5 w-5 text-text-muted" strokeWidth={1.75} />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">Display</h2>
              <p className="text-text-secondary text-sm">{totalSentences} 句轮播。</p>
            </div>
            <div>
              <Button variant="secondary" asChild>
                <Link href="/display">立即播放</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Library */}
        <Card className="hover:border-border-strong transition-colors group">
          <CardContent className="p-6 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <Badge>浏览</Badge>
              <BookOpen className="h-5 w-5 text-text-muted" strokeWidth={1.75} />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">场景库</h2>
              <p className="text-text-secondary text-sm">
                {presetCount} 句预置 · {customCount} 句自建
              </p>
            </div>
            <div>
              <Button variant="secondary" asChild>
                <Link href="/library">浏览</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 音読 */}
        <Card className="hover:border-border-strong transition-colors group">
          <CardContent className="p-6 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <Badge variant="accent">Stage 2.5</Badge>
              <Volume2 className="h-5 w-5 text-text-muted" strokeWidth={1.75} />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">音読</h2>
              <p className="text-text-secondary text-sm">
                看带 furigana 的日文 → 朗读出声 → 浏览器 STT 校对。修复字↔声联结。
              </p>
            </div>
            <div>
              <Button variant="secondary" asChild>
                <Link href="/read-aloud">开始朗读</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 听写 */}
        <ComingSoonCard
          title="听写 · Stage 3"
          desc="只听不看，把日文写下来。听力会塌方一次，那是进步的起点。"
        />
      </section>

      <Separator />

      {/* 通关地图 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">通关地图</h2>
          <Sparkles className="h-4 w-4 text-text-muted" strokeWidth={1.75} />
        </div>
        <p className="text-text-secondary text-sm">
          以最低阶段标识能力——一句话停留在哪一关，就只算到哪一关。
          <span className="text-vermilion ml-1">Stage 4 才是真实战斗力。</span>
        </p>
        <div className="space-y-3 mt-4">
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

function StageRow({ stage, count, total }: { stage: Stage; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const isCore = stage === 4
  return (
    <div className="flex items-center gap-4">
      <div className="w-32 shrink-0">
        <p className={cn("text-sm", isCore ? "text-vermilion font-semibold" : "text-text-primary")}>
          Stage {stage === 25 ? "2.5" : stage}
        </p>
        <p className="text-xs text-text-muted">{stageLabel(stage)}</p>
      </div>
      <div className="flex-1 h-2 rounded-full bg-bg-overlay overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out-expo",
            isCore ? "bg-vermilion" : "bg-accent",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-20 shrink-0 text-right">
        <p className="text-sm tabular text-text-primary">{pct}%</p>
        <p className="text-xs text-text-muted tabular">
          {count} / {total}
        </p>
      </div>
    </div>
  )
}

function ComingSoonCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card className="opacity-60">
      <CardContent className="p-6 space-y-3">
        <Badge variant="outline">即将上线</Badge>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-text-secondary text-sm leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  )
}
