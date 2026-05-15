import { MessageSquare, Phone, Users, Mail, Briefcase } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { listDialogues } from "@/lib/actions/dialogues"

export const dynamic = "force-dynamic"

const SCENARIO_LABEL: Record<string, { label: string; icon: typeof MessageSquare }> = {
  "1on1": { label: "1on1", icon: Users },
  meeting: { label: "会议", icon: Briefcase },
  slack: { label: "Slack", icon: MessageSquare },
  email: { label: "邮件", icon: Mail },
  phone: { label: "电话", icon: Phone },
}

export default async function DialoguesPage() {
  const dialogues = await listDialogues()
  return (
    <div className="px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-fg-tertiary">阅读</p>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">情景对话</h1>
        <p className="text-base text-fg-secondary max-w-2xl">
          多轮对话原文。点开后可逐句听读,或一键朗读全段。
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {dialogues.map((d) => {
          const meta = SCENARIO_LABEL[d.scenario] ?? SCENARIO_LABEL.meeting
          const Icon = meta.icon
          return (
            <Link key={d.id} href={`/dialogues/${d.id}`} className="group">
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
                    {d.title}
                  </h2>
                  {d.description && (
                    <p
                      className="text-sm text-fg-secondary line-clamp-2 flex-1"
                      lang="zh-CN"
                    >
                      {d.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-fg-tertiary tabular pt-2 border-t border-border">
                    <span>难度 {d.difficulty}/5</span>
                    <span>· {d.turns?.length ?? 0} 轮</span>
                    {d.register && <span>· {d.register}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {dialogues.length === 0 && (
        <p className="text-fg-tertiary text-sm py-16 text-center">还没有对话。</p>
      )}
    </div>
  )
}
