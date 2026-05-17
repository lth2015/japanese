import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { listDialogues } from "@/lib/actions/dialogues"
import { Briefcase, Mail, MessageSquare, Phone, Users } from "lucide-react"
import Link from "next/link"

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
    <div className="page-container space-y-8">
      <header className="panel-solid rounded-lg p-6 sm:p-8">
        <p className="page-kicker">Dialogues</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-fg sm:text-4xl">情景对话</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-fg-secondary">
              多轮对话原文。逐句听读，熟悉职场和生活场景的来回节奏。
            </p>
          </div>
          <Badge variant="accent">{dialogues.length} 段</Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {dialogues.map((d) => {
          const meta = SCENARIO_LABEL[d.scenario] ?? SCENARIO_LABEL.meeting
          const Icon = meta.icon
          return (
            <Link key={d.id} href={`/dialogues/${d.id}`} className="group">
              <Card className="pressable h-full overflow-hidden">
                <CardContent className="p-6 space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-surface-tint text-accent">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <Badge>{meta.label}</Badge>
                  </div>
                  <h2 className="font-jp-serif text-lg font-medium leading-snug text-fg" lang="ja">
                    {d.title}
                  </h2>
                  {d.description && (
                    <p className="line-clamp-2 flex-1 text-sm text-fg-secondary" lang="zh-CN">
                      {d.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 border-t border-border pt-2 text-xs text-fg-tertiary tabular">
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
