import { sql } from "drizzle-orm"
import { ArrowUpRight, BookOpen, MonitorPlay } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { db, schema } from "@/lib/db/client"

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

  return (
    <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-6xl mx-auto space-y-10">
      <header className="space-y-2">
        <p className="text-sm text-text-secondary font-jp">おかえりなさい</p>
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
          今天，开口几次？
        </h1>
        <p className="text-text-secondary">
          训练的目标是把"看得懂"变成"说得出来"。Display 模式可以挂在副屏，让被动接触积累。
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Display */}
        <Card className="lg:col-span-2 hover:border-border-strong transition-colors group">
          <CardContent className="p-6 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <Badge variant="accent">P0 · 杀手特性</Badge>
              <MonitorPlay className="h-5 w-5 text-text-muted" strokeWidth={1.75} />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="text-2xl font-semibold tracking-tight">Display</h2>
              <p className="text-text-secondary text-sm">
                把它放在副屏 / 手机挂机。被动看，被动听，长期累积。{totalSentences} 句立刻可以播。
              </p>
            </div>
            <div>
              <Button asChild>
                <Link href="/display">
                  立即播放 <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Library */}
        <Card className="hover:border-border-strong transition-colors group">
          <CardContent className="p-6 flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between">
              <Badge>P0</Badge>
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
                <Link href="/library">浏览全部</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Drill (coming soon) */}
        <ComingSoonCard
          title="写作 Drill"
          desc="中文 → 日语打字训练。AI 给出最自然 / 商务 / 口语三种版本。"
        />
        {/* Read */}
        <ComingSoonCard
          title="跟读"
          desc="听标准发音，自己录音，STT 比对 + AI 自然度反馈。"
        />
        {/* Talk */}
        <ComingSoonCard
          title="对话"
          desc="AI 扮演同事 / 上司，10 轮场景对话，结束后给改写建议。"
        />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">本周</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="开口时长" value="—" hint="Phase 2 解锁" />
          <StatCard label="Drill 成功率" value="—" hint="Phase 2 解锁" />
          <StatCard label="复习卡片" value="—" hint="Phase 2 解锁" />
          <StatCard label="连续天数" value="0" hint="今天开始" />
        </div>
      </section>
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

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-2xl font-semibold tabular">{value}</p>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </CardContent>
    </Card>
  )
}
