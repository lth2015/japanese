"use server"

import { asc, eq } from "drizzle-orm"
import { db, schema } from "@/lib/db/client"

export async function listDialogues() {
  return db
    .select()
    .from(schema.dialogue)
    .orderBy(asc(schema.dialogue.difficulty), asc(schema.dialogue.scenario))
    .all()
}

export async function getDialogue(id: string) {
  return db.select().from(schema.dialogue).where(eq(schema.dialogue.id, id)).get() ?? null
}
