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
    <div className="px-6 lg:px-12 py-8 lg:py-12 max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">场景库</h1>
        <p className="text-text-secondary">
          {sentences.length} 句。按分类筛选，挑句子加入 Display 队列。
        </p>
      </header>
      <LibraryClient sentences={sentences} />
    </div>
  )
}
