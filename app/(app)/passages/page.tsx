import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { listPassages } from "@/lib/actions/passages"
import { BookOpen, FileText, Mail, MessageSquare } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const SOURCE_LABEL: Record<string, { label: string; icon: typeof FileText }> = {
  email: { label: "邮件", icon: Mail },
  slack: { label: "Slack", icon: MessageSquare },
  "meeting-minutes": { label: "会议纪要", icon: FileText },
  report: { label: "汇报", icon: FileText },
  news: { label: "新闻", icon: BookOpen },
}

export default async function PassagesPage() {
  const passages = await listPassages()
  return (
    <div className="page-container space-y-8">
      <header className="panel-solid rounded-lg p-6 sm:p-8">
        <p className="page-kicker">Reading</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-fg sm:text-4xl">短文</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-fg-secondary">
              用你“读”的强项作为入口。读懂全文，再把理解转成日语回答。
            </p>
          </div>
          <Badge variant="accent">{passages.length} 篇</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {passages.map((p) => {
          const meta = SOURCE_LABEL[p.source] ?? SOURCE_LABEL.report
          const Icon = meta.icon
          return (
            <Link key={p.id} href={`/passages/${p.id}`} className="group">
              <Card className="pressable h-full overflow-hidden">
                <CardContent className="p-6 space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-tint text-accent">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <Badge>{meta.label}</Badge>
                  </div>
                  <h2 className="font-jp-serif text-lg text-fg leading-snug font-medium" lang="ja">
                    {p.title}
                  </h2>
                  {p.description && (
                    <p className="text-sm text-fg-secondary line-clamp-2 flex-1" lang="zh-CN">
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 border-t border-border pt-2 text-xs text-fg-tertiary tabular">
                    <span>难度 {p.difficulty}/5</span>
                    {p.lengthWords && <span>· {p.lengthWords} 字</span>}
                    <span>· {p.questions?.length ?? 0} 题</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {passages.length === 0 && (
        <p className="text-fg-tertiary text-sm py-16 text-center">还没有短文。</p>
      )}
    </div>
  )
}
