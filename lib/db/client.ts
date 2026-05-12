import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { existsSync, mkdirSync } from "node:fs"
import { dirname } from "node:path"
import * as schema from "./schema"

const dbPath = process.env.DATABASE_URL ?? "./data/app.db"

// Ensure parent dir exists (so first run can create the file).
const parent = dirname(dbPath)
if (!existsSync(parent)) {
  mkdirSync(parent, { recursive: true })
}

// Use a global singleton to survive Next.js HMR in dev.
const globalForDb = globalThis as unknown as { __sqlite?: Database.Database }
const sqlite = globalForDb.__sqlite ?? new Database(dbPath)
sqlite.pragma("journal_mode = WAL")
sqlite.pragma("foreign_keys = ON")
if (process.env.NODE_ENV !== "production") globalForDb.__sqlite = sqlite

export const db = drizzle(sqlite, { schema })
export { schema }
