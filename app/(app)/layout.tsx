import { AppSidebar } from "@/components/app-sidebar"
import { BottomNav } from "@/components/bottom-nav"
import type { ReactNode } from "react"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell flex min-h-dvh">
      <AppSidebar />
      <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      <BottomNav />
    </div>
  )
}
