import { notFound } from "next/navigation"
import { getDialogue } from "@/lib/actions/dialogues"
import { DialogueReader } from "./dialogue-reader"

export const dynamic = "force-dynamic"

export default async function DialoguePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const dialogue = await getDialogue(id)
  if (!dialogue) notFound()
  return <DialogueReader dialogue={dialogue} />
}
