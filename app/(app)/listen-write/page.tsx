import { getNextListenWriteSentence } from "@/lib/actions/listen-write"
import { ListenWriteClient } from "./listen-write-client"

export const dynamic = "force-dynamic"

export default async function ListenWritePage() {
  const first = await getNextListenWriteSentence()
  return <ListenWriteClient initial={first} />
}
