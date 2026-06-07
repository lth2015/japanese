import type { ReactNode } from "react"

// Verbs 模式覆盖父级 (app) layout 的侧边栏 / 底部 nav，全屏接管。
export default function VerbsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
