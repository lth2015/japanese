import { LearningClient } from "./learning-client"

// /learning —— 主动输出训练页。语料存在浏览器 localStorage，与 /display
// 的 SQLite 语料完全独立，因此这里无需服务端取数。
export default function LearningPage() {
  return <LearningClient />
}
