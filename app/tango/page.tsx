import { TangoTicker } from "@/components/tango/tango-ticker"
import { TANGO_CORPUS } from "@/lib/tango/index"
import { flattenTangoCards } from "@/lib/tango/utils"

export const dynamic = "force-static"

export default function TangoPage() {
  const cards = flattenTangoCards(TANGO_CORPUS)
  return <TangoTicker cards={cards} />
}
