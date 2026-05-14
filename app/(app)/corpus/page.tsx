import { existsSync, readdirSync } from "node:fs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { db, schema } from "@/lib/db/client"
import { sql } from "drizzle-orm"
import { ArrowRight, Boxes, CheckCircle2, FileJson, Sparkles } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function CorpusPage() {
  const [{ aiSentences }] = db
    .select({ aiSentences: sql<number>`count(*)` })
    .from(schema.sentence)
    .where(sql`source = 'ai-generated-accepted'`)
    .all()

  const [{ aiDialogues }] = db
    .select({ aiDialogues: sql<number>`count(*)` })
    .from(schema.dialogue)
    .where(sql`source = 'ai-generated-accepted'`)
    .all()

  const [{ aiPassages }] = db
    .select({ aiPassages: sql<number>`count(*)` })
    .from(schema.passage)
    .where(sql`content_source = 'ai-generated-accepted'`)
    .all()

  const packFiles = listPackFiles()

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-xl border border-border bg-surface px-5 py-5 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-fg-tertiary">
                Corpus Engine
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-fg">语料工坊</h1>
              <p className="mt-2 max-w-2xl text-base text-fg-secondary">
                用 AI 批量生成可训练内容，审阅后导入；每次导入只增量更新，不清空旧积累。
              </p>
            </div>
            <Button asChild>
              <Link href="/library">
                去场景库
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="AI 句子" value={aiSentences} />
          <StatCard label="AI 对话" value={aiDialogues} />
          <StatCard label="AI 短文" value={aiPassages} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5 lg:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Badge variant="accent">Protocol</Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fg">
                  AI 内容包流程
                </h2>
              </div>
              <Boxes className="h-6 w-6 text-fg-tertiary" strokeWidth={1.75} />
            </div>
            <div className="mt-6 space-y-5">
              <Step
                icon={Sparkles}
                title="让 AI 生成 JSON"
                text="按 corpus/AGENT_GUIDE.md 输出 sentence、dialogue、passage。"
              />
              <Step
                icon={CheckCircle2}
                title="人工审阅"
                text="重点检查自然度、furigana tokens、难度、场景标签。"
              />
              <Step
                icon={FileJson}
                title="导入 SQLite"
                text="把 reviewed 内容包放入 corpus/packs，然后运行导入命令。"
              />
            </div>
          </Card>

          <Card className="p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="outline">Commands</Badge>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-fg">当前内容包</h2>
              </div>
              <span className="font-mono text-sm text-fg-tertiary">{packFiles.length} files</span>
            </div>

            <div className="mt-5 space-y-2">
              <CommandLine command="pnpm corpus:import --dry-run" />
              <CommandLine command="pnpm corpus:import" />
            </div>

            <div className="mt-6 rounded-lg border border-border bg-surface-tint">
              {packFiles.length > 0 ? (
                <div className="divide-y divide-border">
                  {packFiles.map((file) => (
                    <div key={file} className="flex items-center gap-3 px-4 py-3">
                      <FileJson className="h-4 w-4 text-accent" strokeWidth={1.75} />
                      <span className="font-mono text-sm text-fg-secondary">{file}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-8 text-center text-sm text-fg-secondary">
                  corpus/packs 里还没有待导入 JSON。
                </p>
              )}
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <DocLink title="工作流" path="corpus/README.md" />
          <DocLink title="AI 生成提示" path="corpus/AGENT_GUIDE.md" />
          <DocLink title="JSON Schema" path="corpus/schema.json" />
        </section>
      </div>
    </div>
  )
}

function listPackFiles() {
  const dir = `${process.cwd()}/corpus/packs`
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort()
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <p className="font-mono text-3xl font-semibold tabular text-fg">{value}</p>
      <p className="mt-2 text-sm text-fg-secondary">{label}</p>
    </Card>
  )
}

function Step({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Sparkles
  title: string
  text: string
}) {
  return (
    <div className="flex gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-bg-subtle text-fg-secondary">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div>
        <p className="text-sm font-semibold text-fg">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-fg-secondary">{text}</p>
      </div>
    </div>
  )
}

function CommandLine({ command }: { command: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-subtle px-3 py-2 font-mono text-xs text-fg-secondary">
      {command}
    </div>
  )
}

function DocLink({ title, path }: { title: string; path: string }) {
  return (
    <Card className="p-5">
      <p className="text-base font-semibold text-fg">{title}</p>
      <p className="mt-2 font-mono text-xs text-fg-tertiary">{path}</p>
    </Card>
  )
}
