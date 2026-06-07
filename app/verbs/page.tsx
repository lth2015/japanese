import { VerbTicker } from "@/components/verbs/verb-ticker"
import { flattenVerbCards } from "@/lib/verbs/utils"
import { VERB_CORPUS } from "@/lib/verbs/verb-corpus"

export const dynamic = "force-static"

export default function VerbsPage() {
  const cards = flattenVerbCards(VERB_CORPUS)
  return <VerbTicker cards={cards} />
}
