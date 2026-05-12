import { sql } from "drizzle-orm"
import { DisplayTicker } from "@/components/display/display-ticker"
import { db, schema } from "@/lib/db/client"

export const dynamic = "force-dynamic"

export default async function DisplayPage() {
  const sentences = db
    .select()
    .from(schema.sentence)
    .orderBy(sql`random()`)
    .all()

  return <DisplayTicker sentences={sentences} />
}
