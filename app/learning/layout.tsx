import type { ReactNode } from "react"

// /learning 全屏接管，不显示侧边栏 / 底部 nav（与 /display 一致）。
export default function LearningLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
