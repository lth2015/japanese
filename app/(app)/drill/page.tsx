import { getNextDrillSentence } from "@/lib/actions/drill"
import { DrillClient } from "./drill-client"

export const dynamic = "force-dynamic"

export default async function DrillPage() {
  const first = await getNextDrillSentence()
  return <DrillClient initial={first} />
}
