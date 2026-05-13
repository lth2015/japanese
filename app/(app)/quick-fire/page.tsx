import { getNextQuickFireSentence } from "@/lib/actions/quick-fire"
import { QuickFireClient } from "./quick-fire-client"

export const dynamic = "force-dynamic"

export default async function QuickFirePage() {
  const first = await getNextQuickFireSentence()
  return <QuickFireClient initial={first} />
}
