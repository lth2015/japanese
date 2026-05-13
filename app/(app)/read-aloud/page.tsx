import { getNextReadAloudSentence } from "@/lib/actions/read-aloud"
import { ReadAloudClient } from "./read-aloud-client"

export const dynamic = "force-dynamic"

export default async function ReadAloudPage() {
  const first = await getNextReadAloudSentence()
  return <ReadAloudClient initial={first} />
}
