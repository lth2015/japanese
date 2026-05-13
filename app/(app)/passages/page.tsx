import { BookOpen, FileText, Mail, MessageSquare } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { listPassages } from "@/lib/actions/passages"

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
    <div className="px-6 lg:px-16 py-10 lg:py-16 max-w-5xl mx-auto space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight">短文阅读</h1>
        <p className="text-lg text-fg-secondary max-w-2xl leading-relaxed">
          用你"读"的强项作为入口。读懂全文 → 用日语回答问题 → 输出。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {passages.map((p) => {
          const meta = SOURCE_LABEL[p.source] ?? SOURCE_LABEL.report
          const Icon = meta.icon
          return (
            <Link key={p.id} href={`/passages/${p.id}`}>
              <Card className="hover:border-border-strong transition-colors group h-full">
                <CardContent className="p-5 space-y-3 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <Badge>{meta.label}</Badge>
                    <Icon className="h-4 w-4 text-fg-tertiary" strokeWidth={1.75} />
                  </div>
                  <h2 className="font-jp-serif text-lg text-fg leading-snug" lang="ja">
                    {p.title}
                  </h2>
                  <p className="text-fg-secondary text-sm line-clamp-2 flex-1" lang="zh-CN">
                    {p.description ?? "—"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-fg-tertiary tabular pt-1">
                    <span>难度 {p.difficulty}/5</span>
                    {p.lengthWords && <span>· {p.lengthWords} 字</span>}
                    <span>· {p.questions?.length ?? 0} 道题</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {passages.length === 0 && (
        <p className="text-fg-tertiary text-sm py-12 text-center">还没有短文。</p>
      )}
    </div>
  )
}
