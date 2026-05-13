import { notFound } from "next/navigation"
import { getPassage } from "@/lib/actions/passages"
import { PassageReader } from "./passage-reader"

export const dynamic = "force-dynamic"

export default async function PassageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const passage = await getPassage(id)
  if (!passage) notFound()
  return <PassageReader passage={passage} />
}
