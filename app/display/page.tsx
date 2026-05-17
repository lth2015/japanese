import { DisplayTicker } from "@/components/display/display-ticker"
import { db, schema } from "@/lib/db/client"

export const dynamic = "force-dynamic"

type Props = {
  searchParams?: Promise<{
    tag?: string | string[]
  }>
}

export default async function DisplayPage({ searchParams }: Props) {
  const params = await searchParams
  const tag = Array.isArray(params?.tag) ? params.tag[0] : params?.tag
  const sentences = db.select().from(schema.sentence).orderBy(schema.sentence.id).all()
  const displaySentences = tag
    ? sentences.filter((sentence) => sentence.tags?.includes(tag))
    : sentences

  return <DisplayTicker sentences={displaySentences} ignoreSourceFilter={Boolean(tag)} />
}
