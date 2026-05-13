"use server"

import { asc, eq, sql } from "drizzle-orm"
import { db, schema } from "@/lib/db/client"

export async function listPassages() {
  return db
    .select()
    .from(schema.passage)
    .orderBy(asc(schema.passage.difficulty), asc(sql`length(${schema.passage.body})`))
    .all()
}

export async function getPassage(id: string) {
  return db.select().from(schema.passage).where(eq(schema.passage.id, id)).get() ?? null
}
