import { sql } from "drizzle-orm"
import { db, schema } from "@/lib/db/client"
import { LibraryClient } from "./library-client"

export const dynamic = "force-dynamic"

export default async function LibraryPage() {
  const sentences = db
    .select()
    .from(schema.sentence)
    .orderBy(sql`category, difficulty`)
    .all()

  return (
    <div className="px-6 lg:px-10 py-8 lg:py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-fg-tertiary">语料</p>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">场景库</h1>
        <p className="text-base text-fg-secondary">
          {sentences.length} 句。按分类筛选，挑句子加入 Display 队列。
        </p>
      </header>
      <LibraryClient sentences={sentences} />
    </div>
  )
}
