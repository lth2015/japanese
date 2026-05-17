import { db, schema } from "@/lib/db/client"
import { sql } from "drizzle-orm"
import { LibraryClient } from "./library-client"

export const dynamic = "force-dynamic"

export default async function LibraryPage() {
  const sentences = db.select().from(schema.sentence).orderBy(sql`category, difficulty`).all()

  return (
    <div className="page-container space-y-8">
      <header className="panel-solid rounded-lg p-6 sm:p-8">
        <p className="page-kicker">Corpus Library</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-fg sm:text-4xl">场景库</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-fg-secondary">
              {sentences.length} 句可训练语料。按场景筛选，快速找到适合今天练的句子。
            </p>
          </div>
          <div className="rounded-lg border border-border bg-surface-tint px-4 py-3">
            <p className="font-mono text-2xl font-semibold leading-none text-accent tabular">
              {sentences.length}
            </p>
            <p className="mt-1 text-xs text-fg-tertiary">sentences</p>
          </div>
        </div>
      </header>
      <LibraryClient sentences={sentences} />
    </div>
  )
}
