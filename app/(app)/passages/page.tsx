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
    <div className="px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-fg-tertiary">阅读</p>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">短文</h1>
        <p className="text-base text-fg-secondary max-w-2xl">
          用你"读"的强项作为入口。读懂全文 → 用日语回答问题 → 输出。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {passages.map((p) => {
          const meta = SOURCE_LABEL[p.source] ?? SOURCE_LABEL.report
          const Icon = meta.icon
          return (
            <Link key={p.id} href={`/passages/${p.id}`} className="group">
              <Card className="hover:shadow-sm hover:-translate-y-px transition-all duration-200 h-full">
                <CardContent className="p-6 space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-md bg-bg-subtle border border-border grid place-items-center shrink-0">
                      <Icon className="h-4 w-4 text-fg-secondary" strokeWidth={1.75} />
                    </div>
                    <Badge>{meta.label}</Badge>
                  </div>
                  <h2
                    className="font-jp-serif text-lg text-fg leading-snug font-medium"
                    lang="ja"
                  >
                    {p.title}
                  </h2>
                  {p.description && (
                    <p
                      className="text-sm text-fg-secondary line-clamp-2 flex-1"
                      lang="zh-CN"
                    >
                      {p.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-fg-tertiary tabular pt-2 border-t border-border">
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
