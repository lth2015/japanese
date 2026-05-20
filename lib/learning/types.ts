/**
 * /learning — 主动输出训练页面的数据模型。
 *
 * 与 /display 的 `sentence` 表完全独立：learning 语料保存在浏览器
 * localStorage（key: nihongo:learning-corpus-v1），可随时增删改、记录复习
 * 进度，且不触碰现有 SQLite 数据。结构刻意做得宽松，方便后续迁移到数据库
 * 或接入服务端：只要保留这些字段即可。
 */

/** 内置场景，覆盖日常生活与简单口语。用户也可填入自定义场景字符串。 */
export const LEARNING_SCENES = [
  "起床",
  "出门",
  "通勤",
  "工作",
  "开会",
  "摸鱼",
  "吃饭",
  "买东西",
  "便利店",
  "咖啡店",
  "回家",
  "洗澡",
  "睡觉",
  "情绪",
  "拒绝",
  "请求",
  "确认",
  "闲聊",
  "手机聊天",
  "自言自语",
  "口头禅",
] as const

export type LearningScene = (typeof LEARNING_SCENES)[number]

/** 熟练度 0-3 的中文标签，用于 UI 展示。 */
export const LEVEL_LABEL = ["未学", "学习中", "较熟", "已掌握"] as const

/**
 * 同义表达的三档语气版本。系统可随机切换，训练「同一个意思的多种说法」。
 * casual = 随意 / タメ口，normal = 普通 / 丁寧，polite = 礼貌 / 敬語。
 */
export type LearningVariants = {
  casual?: string
  normal?: string
  polite?: string
}

/** 一条语料的 SM-2 间隔复习状态（见 lib/sm2.ts）。 */
export type LearningSm2 = {
  easeFactor: number // 难度系数，>= 1.3
  intervalDays: number // 当前间隔天数
  repetitions: number // 连续答对次数
}

/** 一条 learning 语料。 */
export type LearningEntry = {
  id: string
  zh: string // 中文提示
  ja: string // 日语答案
  kana?: string // 假名读音，可选
  romaji?: string // 罗马音，可选
  scene: string // 场景（内置或自定义）
  level: number // 0-3 熟练度（由 SM-2 repetitions 推导，用于 UI 展示与排序）
  sm2?: LearningSm2 // SM-2 复习状态；老数据缺省时按初始值处理
  variants?: LearningVariants // 同义表达的语气版本（可选）
  tags: string[]
  audioUrl?: string // 预录音频，可选；缺省时用浏览器 TTS
  createdAt: string // ISO 时间
  updatedAt: string // ISO 时间
  reviewCount: number // 已复习次数
  lastReviewedAt?: string // ISO 时间
  nextReviewAt?: string // ISO 时间；到期或缺省视为「该复习」
}

/** 写入语料时的输入（运行期字段由 store 自动补全）。 */
export type LearningEntryInput = {
  zh: string
  ja: string
  scene: string
  tags?: string[]
  kana?: string
  romaji?: string
  audioUrl?: string
}

/** 用户对一条句子的反馈，驱动间隔复习。 */
export type Feedback = "known" | "unknown" | "easy" | "focus"
