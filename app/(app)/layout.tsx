import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <AppSidebar />
      <main className="flex-1 pb-20 lg:pb-0 min-w-0">{children}</main>
      <BottomNav />
    </div>
  )
}
