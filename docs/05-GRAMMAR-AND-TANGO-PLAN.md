# 05 — 语法体系（/grammar）与高频词轮播（/tango）实施规划

> 两个跨会话长任务的执行计划。来源：两张手写图（「整个日语语法体系」「10天爆刷背完3500个高频词」）。
> 目标不是复刻图片，而是**补全 + 校对 + 产品化**。

---

## 0. 现状基线

| 项 | 现状 |
|---|---|
| 语法 | 只有 `seed/data/grammar.ts`（N2/N1 句型例句，进 sentence 表），无体系化页面 |
| 词汇 | 只有 `lib/verbs/verb-corpus.ts`（421 动词 × 活用），无名词/形容词等泛词表 |
| 可复用模板 | `/verbs` 全栈：types → corpus → flatten → ticker → settings store |
| 图 2 实际印出量 | **12 组 ≈ 140 词**（Group 6–17 + 1 组无标题颜色词）；Group 1–5 缺失 |

`/verbs` 模板的五个文件是本次两个任务共同的骨架参考：

```
lib/verbs/types.ts          类型
lib/verbs/verb-corpus.ts    静态语料 + 派生函数
lib/verbs/utils.ts          flatten / filter / label
components/verbs/verb-ticker.tsx  全屏轮播 UI
store/verb-settings.ts      localStorage 设置
app/verbs/{page,layout}.tsx  layout 覆盖父级 sidebar，全屏接管
```

---

## 1. 原图勘误清单（「校对」的第一产出）

这两张图有**实质性错误**，补全时必须修正，不能照抄：

### 图 1（语法）

| 位置 | 原图 | 问题 | 我们的处理 |
|---|---|---|---|
| 三、人称代词 → 物主代词 | 物主代词一栏写 `我 私 / 私を`，与人称代词栏完全相同 | **抄错**。物主代词应为 `私の / あなたの / 彼の / 彼女の…` | 重写整栏；并补 こそあど 指示体系（これ/それ/あれ/どれ） |
| 「日语16种时态」 | 按英语 12/16 时态框架套日语 | 日语**没有**16 种时态。真实系统是「过去 / 非过去」二元 + `ている` 体（アスペクト） | 保留对照表（对中文母语者有用），但顶部一句话讲清真相：**先讲二元时制 + 体，再给中文时态对照表** |
| 「将来进行时 ～ているところです」 | 标为将来 | `～ているところだ` 是「正在…的当口」，与将来无关 | 归入「体」章，改述为「动作进行的时点强调」 |
| 「过去完成时 ～たことがありました」 | 标为过去完成 | `～たことがある` 是**经验体**，不是完成时 | 独立讲经验 vs 完成（`～てしまった`/`～ている` 的结果残存） |
| 二、10种单词词性 | イ形容词「尾为い」 | 不够，`きれい・嫌い` 是 ナ 形容词却以 い 结尾 | 规律 + 例外清单一起给 |

### 图 2（词汇）

| 原图 | 问题 | 修正 |
|---|---|---|
| `(はい) 灰色` | 单字 `はい` 不表灰色 | `(はいいろ) 灰色`，口语也说 `グレー` |
| `(とり) 小鸟` | `とり` 泛指鸟/也指鸡肉 | `(とり) 鸟`；小鸟 = `(ことり)` |
| `(うお) 鱼` | `うお` 多用于复合词/鱼市 | 主词条改 `(さかな) 鱼`，`うお` 作副注 |
| `(ちょう) 蝴蝶` | 口语常用 `ちょうちょ` | 两者并列 |
| `(ぎゅうにゅう) 牛奶` 放在 Group 7 食物 | 分类可接受 | 保留，但加「饮料」子标签 |
| Group 8 无标题 | 印刷遗漏 | 定名 **Group 8 颜色**，并补 `あか / あお / しろ / くろ / ちゃいろ` 等缺失基础色 |
| 缺 Group 1–5 | 未印出 | 按体系补：1 人称与指示 / 2 时间日期 / 3 身体部位 / 4 常用动词 / 5 常用形容词 |

> 勘误清单本身会作为 `/grammar` 的一个「原图勘误」附录页展示 —— 这是这套材料相对原图的差异化价值。

---

## 2. 任务一：`/grammar` 语法体系

### 2.1 设计原则（对应用户三条要求）

1. **明晰** → 一个语法点 = 一张卡：`一句话规律` + `规律表` + `≥3 个真实例句` + `易错点` + `对比链接`
2. **由浅入深** → 13 章按 L1–L5 分级，章节间有明确前置依赖，目录页显示学习路径
3. **用简单话描述规律** → 硬性约束：`oneLiner` ≤ 40 个汉字，禁止术语堆砌（「未然形＋れる/られる」这类必须配一句白话）
4. **举实际例子** → 例句一律职场/日常真实场景，复用项目既有的 `register`（敬語/丁寧/カジュアル）+ `scene`（work/life），带 `tokens` furigana，可 TTS

### 2.2 章节结构（13 章，由浅入深）

| 章 | 标题 | 级 | 来源（图 1 区块） |
|---|---|---|---|
| 01 | 五十音与四类发音（清音・浊音・半浊音・拗音） | L1 | 一、基础知识 |
| 02 | 10 种词性 —— 一句话认出每一类 | L1 | 二 |
| 03 | 人称・指示・反身代词（含原图勘误） | L1 | 三 + 反身代词 |
| 04 | 8 种句子结构（S+V → S+O1+O2+V + 三类从句） | L2 | 五 |
| 05 | 4 种句子种类 + 4 类疑问句 | L2 | 六 |
| 06 | 20 个疑问词与提问场景对照 | L2 | 四 |
| 07 | 时与体：日语只有「过去/非过去」+ ている | L3 | 16种时态（重构） |
| 08 | 8 组时态标志词（毎日/昨日/明日/その翌日…） | L3 | 八大时态标志词 |
| 09 | 动词三类分法 + 8 个基础活用形 | L3 | 十（动词基础活用形） |
| 10 | 进阶态：可能・使役・被动・使役被动・自发 | L4 | 十 |
| 11 | 意志形与命令形（提议 vs 命令的语气分寸） | L4 | 十 |
| 12 | 条件句四大分支 ば / と / たら / なら | L5 | 十一 |
| 13 | 特殊句式：存在句・のは〜だ 强调・倒装・宾补・同格 | L5 | 七 + 7./8. |
| 附 | 原图勘误对照 | — | 本文第 1 节 |

### 2.3 数据模型 `lib/grammar/types.ts`

```ts
export type GrammarLevel = 1 | 2 | 3 | 4 | 5

export type GrammarExample = {
  japanese: string
  tokens: Token[]        // 复用 lib/db/schema 的 Token，furigana
  kana: string
  chinese: string
  scene: "work" | "life"
  register: Register     // 敬語 / 丁寧 / カジュアル
}

export type GrammarRule = {
  when: string           // 触发条件，白话："一类动词（う段结尾）"
  how: string            // 变形操作："う段 → え段 + る"
  sample: string         // "書く → 書ける"
}

export type GrammarPoint = {
  id: string
  chapterId: string
  title: string          // "可能形"
  oneLiner: string       // ≤40 字白话规律
  rules: GrammarRule[]
  table?: { headers: string[]; rows: string[][] }   // 活用对照表 / 五十音表
  examples: GrammarExample[]      // ≥3
  pitfalls: string[]              // ≥1 易错点
  contrastWith?: string[]         // 其它 point id，渲染成「对比」卡
  verbIds?: string[]              // 链到 /verbs 对应动词
}

export type GrammarChapter = {
  id: string; no: number; title: string; titleJa: string
  level: GrammarLevel
  summaryZh: string      // 本章一句话讲什么
  prerequisites: string[]  // 前置章节 id
  points: GrammarPoint[]
}
```

### 2.4 文件与路由

```
lib/grammar/types.ts
lib/grammar/chapters/01-kana.ts … 13-special.ts   # 每章一文件，便于分批推进
lib/grammar/index.ts            # GRAMMAR_CHAPTERS 汇总 + 查询工具
components/grammar/chapter-view.tsx
components/grammar/point-card.tsx   # 一句话规律 / 规律表 / 例句 / 易错点
components/grammar/conjugation-table.tsx
app/(app)/grammar/page.tsx          # 目录：L1–L5 路径图 + 进度
app/(app)/grammar/[chapter]/page.tsx
app/(app)/grammar/cheatsheet/page.tsx  # A4 打印版（对标 business_japanese_100_a4_print.html）
scripts/check-grammar.ts            # 质量校验
```

导航挂载：`components/app-sidebar.tsx` 的 `LIBRARY` 组新增 `{ href: "/grammar", label: "语法体系", icon: BookMarked }`。

### 2.5 质量与数量验收（`pnpm check:grammar`）

- [ ] 13 章齐全，`prerequisites` 无环、无悬空 id
- [ ] 语法点总数 ≥ 60，每章 ≥ 3 点
- [ ] 每点：`oneLiner` 非空且 ≤ 40 字；`examples.length ≥ 3`；`pitfalls.length ≥ 1`
- [ ] 每个例句：`tokens.map(t => t.text).join("") === japanese`（拼接一致性，沿用 corpus:import 的校验思路）
- [ ] `kana` 只含平/片假名与标点
- [ ] 例句 `scene` 分布：work / life 各占 ≥ 30%
- [ ] `contrastWith` / `verbIds` 引用的 id 真实存在
- [ ] 术语白话检查：`oneLiner` 命中「未然形/连用形/终止形」等术语时，必须同段出现白话解释

### 2.6 分批里程碑（可断点续做）

| 批次 | 内容 | 产物 |
|---|---|---|
| G0 | 类型 + 路由骨架 + `check-grammar.ts` + 目录页（章节先放空壳） | 可跑通、校验通过（0 点） |
| G1 | Ch01–03（L1） | 语法点 ≈ 14 |
| G2 | Ch04–06（L2） | ≈ 30 |
| G3 | Ch07–08（L3 时体） | ≈ 40 |
| G4 | Ch09–11（动词活用，与 `/verbs` 交叉链接） | ≈ 55 |
| G5 | Ch12–13（L5） + 勘误附录 | ≈ 65 |
| G6 | A4 cheatsheet 打印页 + README 更新 | 完 |

---

## 3. 任务二：`/tango` 高频词轮播

### 3.1 交互（对齐 `/verbs` 惯例）

全屏轮播，卡片一屏一词：

```
┌──────────────────────────────────────┐
│  Group 12 動物            名詞  L1   │  ← 组 + 词性 badge
│                                      │
│         いぬ                         │  ← 假名大字
│          犬                          │  ← 汉字（ruby furigana）
│         狗                           │  ← 中文
│                                      │
│  犬の散歩に行ってきます。            │  ← 例句（tokens furigana）
│  我去遛狗。                          │
│                                      │
│  [动词/形容词才出现的变形小表]        │
└──────────────────────────────────────┘
   索引条：本组全部词，已会的打勾
```

复用 `/verbs` 全部能力：自动轮播间隔、TTS 语速、假名/中文/例句显隐开关、「我会了」隐藏、wake-lock、Vim 键（j/k/space/r/f/?/q）。
新增筛选维度：**按组**、**按词性**、**只看动词/形容词变形**。

### 3.2 数据模型 `lib/tango/types.ts`

```ts
export type Pos =
  | "名詞" | "動詞" | "イ形容詞" | "ナ形容詞" | "副詞"
  | "助詞" | "代名詞" | "連体詞" | "数詞" | "感動詞" | "接続詞"

export type TangoGroup = {
  id: string; no: number; nameZh: string; nameJa: string; level: 1|2|3
}

/** 动词才有：三档活用，与 lib/verbs 的规则保持一致 */
export type TangoVerbForms = {
  verbGroup: VerbGroup            // 复用 lib/verbs/types
  masu: string; te: string; ta: string
  nai: string; potential: string; volitional: string
}

/** 形容词才有 */
export type TangoAdjForms = { negative: string; past: string; adverb: string }

export type TangoEntry = {
  id: string
  groupId: string
  kana: string                    // いぬ
  kanji?: string                  // 犬
  tokens: Token[]                 // ruby 渲染
  chineseZh: string               // 狗
  pos: Pos
  synonyms?: string[]             // さかな/うお 这类并列写法
  note?: string                   // 勘误/用法提示："小鸟是 ことり"
  example: { japanese: string; tokens: Token[]; kana: string; chinese: string }
  verb?: TangoVerbForms
  adj?: TangoAdjForms
}
```

**关键决策**：`/tango` 的动词条目**不重复造活用**，其 `verb` 字段由 `lib/verbs` 里已有的活用规则函数派生（`GROUP1_ROW` 那套），保证两个页面永不打架；校验脚本做交叉比对。

### 3.3 分组规划（22 组）

图上是 Group 6–17（12 组）+ 1 组未命名颜色词。补全为 22 组：

| # | 组名 | 来源 | 目标词数 |
|---|---|---|---|
| 1 | 人称与指示 | **补** | 30 |
| 2 | 时间与日期 | **补** | 40 |
| 3 | 身体部位 | **补** | 30 |
| 4 | 常用动词 | **补**（与 /verbs 联动） | 60 |
| 5 | 常用形容词 | **补** | 50 |
| 6 | 职业 | 图 (15) | 30 |
| 7 | 食物 | 图 (20) | 60 |
| 8 | 颜色 | 图（未命名，10） | 20 |
| 9 | 基础数字 | 图 (13) | 40（含量词） |
| 10 | 家居物品 | 图 (8) | 40 |
| 11 | 交通工具 | 图 (5) | 25 |
| 12 | 动物 | 图 (16) | 30 |
| 13 | 家庭成员 | 图 (12) | 30 |
| 14 | 文具用品 | 图 (10) | 25 |
| 15 | 方位场所 | 图 (17) | 40 |
| 16 | 天气 | 图 (11) | 30 |
| 17 | 服饰鞋帽 | 图 (4，被笔挡住) | 30 |
| 18 | 职场办公 | **补**（贴合本项目定位） | 50 |
| 19 | IT・数字 | **补** | 40 |
| 20 | 情绪与状态 | **补** | 30 |
| 21 | 副词与接续词 | **补** | 40 |
| 22 | 授受・敬语常用词 | **补** | 30 |

合计目标 **≈ 800 词**。

> **关于「3500」**：原图标题的 3500 是营销数字，实际只印了约 140 个。手写 3500 条带例句+词性+变形的词条不现实（按 /verbs 的密度约等于 8 万行代码）。建议分期：
> - **P1（本计划）800 词**，全部手工精校，每词带例句 —— 这是「质量优先」的可交付量
> - **P2 扩到 1500**（覆盖 N5–N3 高频）
> - **P3 若真要 3500**：改走脚本导入公开 JLPT 词表 + AI 生成例句 + 人工抽检，不手写。这需要单独立项。

### 3.4 文件与路由

```
lib/tango/types.ts
lib/tango/groups.ts                 # 22 组元数据
lib/tango/entries/01-pronouns.ts … 22-keigo.ts   # 每组一文件，分批可续
lib/tango/index.ts                  # TANGO_CORPUS 汇总
lib/tango/utils.ts                  # flatten / filter / label（对标 lib/verbs/utils.ts）
lib/tango/derive.ts                 # 从 lib/verbs 规则派生动词/形容词变形
components/tango/tango-ticker.tsx   # 基于 verb-ticker 改
store/tango-settings.ts
app/tango/{page,layout}.tsx         # layout 覆盖父级 nav，全屏（同 /verbs）
scripts/check-tango.ts
```

导航：sidebar `LIBRARY` 组加 `{ href: "/tango", label: "単語", hint: "高频词", icon: Layers }`。

### 3.5 质量与数量验收（`pnpm check:tango`）

- [ ] 22 组齐全，每组达到目标词数（允许 ±10%），总数 ≥ 800
- [ ] `id` 唯一；同一 `kana + pos` 不重复（跨组去重）
- [ ] `kana` 只含假名；`tokens` 拼接 === `kanji ?? kana`
- [ ] 每词 `chineseZh` 非空、`pos` 合法、`example` 存在且 tokens 拼接一致
- [ ] `pos === "動詞"` ⇒ `verb` 存在，且六个形与 `lib/verbs` 规则派生结果**逐字相等**
- [ ] `pos` 为形容词 ⇒ `adj` 存在，イ/ナ 变形规则正确（`きれい・嫌い` 例外表覆盖）
- [ ] 与 `lib/verbs/verb-corpus.ts` 重叠的动词，`meaningZh` 与 `chineseZh` 不矛盾
- [ ] 第 1 节勘误清单的 6 条全部体现（有 `note` 或已改词条）

### 3.6 分批里程碑

| 批次 | 内容 | 累计词数 |
|---|---|---|
| T0 | 类型 + groups + ticker + store + 路由 + `check-tango.ts`（语料先放 1 组样板） | 30 |
| T1 | 图上 12 组全部补全到目标量（Group 6–17）+ Group 8 颜色定名补色 | ≈ 430 |
| T2 | 补 Group 1–5（人称/时间/身体/动词/形容词），打通 `derive.ts` 与 /verbs 交叉校验 | ≈ 640 |
| T3 | 补 Group 18–22（职场/IT/情绪/副词/敬语） | ≈ 800 |
| T4 | 索引条 / 筛选 / 快捷键打磨 + README 更新 | 完 |

---

## 4. 两个任务的关系与推进顺序

- **相互独立**，但共用 `Token` / `Register` / `FuriganaText` / `lib/speech`，且 `/grammar` Ch09–11 与 `/tango` Group 4 都要引用 `lib/verbs` 的活用规则 —— 这块抽成 `lib/conjugation/`（从 `verb-corpus.ts` 里把 `GROUP1_ROW` 等规则提出来）是两个任务的**共同前置**。
- 建议顺序：
  1. **P0 共同前置**：抽出 `lib/conjugation/`，`/verbs` 改为引用它（纯重构，行为不变，先跑通 `pnpm lint` + 页面回归）
  2. **T0 + G0**：两个骨架并行搭好，校验脚本先行
  3. 之后按 `T1 → G1 → T2 → G2 → …` 交替推进，每批结束跑校验 + 提交，随时可断点

## 5. 待用户确认的三点

1. **词量目标**：P1 定 800 词（每词手工精校 + 例句）是否接受？还是先只做图上 12 组 ≈ 430 词看效果？
2. **`/grammar` 形态**：本计划做成「可读的分章教程 + 打印版」。是否也要一个 `/grammar` 的**轮播模式**（像 /display 那样挂机滚语法点）？
3. **P3 的 3500 词**：是否需要现在就规划脚本导入路径（JLPT 公开词表 + AI 例句 + 抽检），还是 P1/P2 做完再说。
