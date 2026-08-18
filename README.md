# Nihongo Studio

Learn Japanese while you work.

Instead of spending 30 minutes studying Japanese every day,
this project keeps Japanese around you all day long.

Passive learning.
Automatic slideshow.
Native pronunciation.
Grammar progression.

Make Japanese part of your working environment.

> Open-source Japanese spoken-output training system for "reads-fluently-but-can't-speak" learners.
>
> 面向「读得懂但说不出口」学习者的开源日语口语训练系统。
>
> 「読めるけど話せない」学習者のためのオープンソース日本語アウトプット訓練システム。

**Language jump**: [🇨🇳 中文](#-中文) · [🇬🇧 English](#-english) · [🇯🇵 日本語](#-日本語)

---

## 🇨🇳 中文

### 这是什么

Nihongo Studio 是一个**本地运行**的开源日语训练系统，专门服务于这样的学习者：

- 已经有 N2/N1 阅读水平
- 但**口语 / 听力跟不上阅读**
- 想在真实职场 / 生活里能自然开口

不是教语法的工具——是把"看得懂"和"说得出"之间的鸿沟，用结构化训练补上的系统。

### 训练方法

把高频日语 chunk 通过 **4 阶段循环**：

1. **Stage 2 — Drill**：中→日 翻译/写作
2. **Stage 2.5 — 音読**：朗读、练发音和节奏
3. **Stage 3 — Listen-Write**：听音 → 写出来
4. **Stage 4 — Quick-Fire**：限时口语反应

错题进入间隔重复队列（SM-2 算法）。

### 内置语料

**26 个主题 pack，约 380 句 / 35 段对话 / 6 段短文**，全部敬語/丁寧/カジュアル三档 register 覆盖。

| 类别 | 主题 |
|---|---|
| 职场 | 会议・Slack・邮件・电话・1on1・招聘・稟議・婉拒・调度・报告・事故沟通・供应商・反馈 |
| 日常 | 咖啡店・便利店・出行・医院・美容室・宅配・餐厅・银行・房东・超市・飲み会・入职 |
| 沉浸 | 日本谚语・每日 mantra（专门为大字 Display 模式优化） |

### 快速开始

```bash
node -v             # 推荐 22.x（仓库带 .node-version）
pnpm install
pnpm db:push        # 创建 SQLite schema（./data/app.db）
pnpm db:seed        # 灌入 seed 内容
pnpm corpus:import  # 导入 corpus/packs/ 里全部 pack
pnpm dev            # http://localhost:12345
```

> 首次装 pnpm 11+ 时，若提示 `pnpm approve-builds`，运行一次并放行 `better-sqlite3 / @biomejs/biome / esbuild / sharp`。

### 主要页面

- `/` 今日训练台
- `/drill` Stage 2 写作 Drill
- `/read-aloud` Stage 2.5 音読
- `/listen-write` Stage 3 听写
- `/quick-fire` Stage 4 Quick-Fire
- `/learning` **口语训练**（中文提示→自己开口→揭示答案→录音跟读→间隔复习；独立 localStorage 语料）
- `/display` **全屏轮播**（副屏 / 手机挂机；Vim 键全开）
- `/library` 场景库（按分类筛选、搜索）
- `/passages` 短文阅读 + 日语回答
- `/corpus` AI 语料工坊

### Display 模式键盘

| 键 | 动作 |
|---|---|
| `j` / `l` / `→` | 下一句 |
| `k` / `h` / `←` | 上一句 |
| `Space` | 暂停 / 播放 |
| `r` | 随机跳转 |
| `f` | 切换 focus mode |
| `?` | 显示全部快捷键 |
| `q` | 退出回首页 |

### 自己加语料

按 [corpus/AGENT_GUIDE.md](corpus/AGENT_GUIDE.md) 让 AI 生成 JSON pack，扔进 `corpus/packs/`：

```bash
pnpm corpus:import --dry-run   # 校验 schema + token 拼接
pnpm corpus:import             # 正式入库
```

幂等导入——重复运行不会重复入库（按内容 hash 去重）。

### 设计文档

详细设计在 [docs/](./docs/)：

- [00-DESIGN.md](./docs/00-DESIGN.md) 愿景 + V1 范围
- [01-ARCHITECTURE.md](./docs/01-ARCHITECTURE.md) 技术栈 + 数据模型
- [02-UI-UX.md](./docs/02-UI-UX.md) 设计系统 + 页面 mockup
- [03-LEARNING-METHOD.md](./docs/03-LEARNING-METHOD.md) 训练方法学
- [04-DESIGN-SYSTEM.md](./docs/04-DESIGN-SYSTEM.md) 视觉规范

### 贡献

欢迎 PR——尤其是**语料 pack**。一个新 pack 的成本就是写 11 句左右的 JSON 加一段对话。看 `corpus/AGENT_GUIDE.md` + `corpus/examples/`。

### License

[Apache License 2.0](./LICENSE)

---

## 🇬🇧 English

### What is this

Nihongo Studio is a **locally-run** open-source Japanese training system built for learners who:

- Read at N2/N1 level
- But **speak / listen at a noticeably lower level**
- Want to express themselves naturally at work or in daily life in Japan

This isn't a grammar app — it's a system for closing the gap between "I understand" and "I can produce."

### How it trains you

High-frequency Japanese chunks cycle through a **4-stage loop**:

1. **Stage 2 — Drill**: Chinese → Japanese translation
2. **Stage 2.5 — Read Aloud**: pronunciation + rhythm
3. **Stage 3 — Listen-Write**: audio → transcribe
4. **Stage 4 — Quick-Fire**: timed spoken response

Errors enter a spaced-repetition queue (SM-2 algorithm).

### Built-in corpus

**26 thematic packs, ~380 sentences / 35 dialogues / 6 passages**, fully covering 敬語 / 丁寧 / カジュアル registers.

| Category | Themes |
|---|---|
| Workplace | Meetings, Slack, email, phone, 1on1s, hiring, ringi (稟議), soft pushback, scheduling, reports, incident comm, vendor coordination, feedback |
| Daily life | Cafe, conbini, transit, clinic, salon, delivery, restaurant, bank, landlord, supermarket, drinking parties, onboarding |
| Ambient | Japanese proverbs + daily mantras (optimized for the big-text Display mode) |

### Quick start

```bash
node -v             # 22.x recommended (.node-version included)
pnpm install
pnpm db:push        # create SQLite schema (./data/app.db)
pnpm db:seed        # load seed content
pnpm corpus:import  # import all packs in corpus/packs/
pnpm dev            # http://localhost:12345
```

> On first install with pnpm 11+, if prompted `pnpm approve-builds`, run it once and approve `better-sqlite3 / @biomejs/biome / esbuild / sharp`.

### Main pages

- `/` Today's training dashboard
- `/drill` Stage 2 Writing Drill
- `/read-aloud` Stage 2.5 Read Aloud
- `/listen-write` Stage 3 Listen-Write
- `/quick-fire` Stage 4 Quick-Fire
- `/learning` **Speaking trainer** (Chinese prompt → speak it yourself → reveal answer → record & shadow → spaced repetition; independent localStorage corpus)
- `/display` **Full-screen rotation** (secondary monitor / ambient; Vim keys fully supported)
- `/library` Scenario library (filter, search)
- `/passages` Passage reading + Japanese Q&A
- `/corpus` AI corpus workshop

### Display mode keyboard

| Key | Action |
|---|---|
| `j` / `l` / `→` | Next sentence |
| `k` / `h` / `←` | Previous sentence |
| `Space` | Pause / play |
| `r` | Random jump |
| `f` | Toggle focus mode |
| `?` | Show all shortcuts |
| `q` | Exit to home |

### Add your own corpus

Follow [corpus/AGENT_GUIDE.md](corpus/AGENT_GUIDE.md) to have an AI generate a JSON pack, drop it in `corpus/packs/`:

```bash
pnpm corpus:import --dry-run   # validate schema + token concatenation
pnpm corpus:import             # commit to DB
```

Idempotent — re-importing doesn't duplicate entries (content-hash dedup).

### Design docs

Detailed design in [docs/](./docs/):

- [00-DESIGN.md](./docs/00-DESIGN.md) Vision + V1 scope
- [01-ARCHITECTURE.md](./docs/01-ARCHITECTURE.md) Stack + data model
- [02-UI-UX.md](./docs/02-UI-UX.md) Design system + page mockups
- [03-LEARNING-METHOD.md](./docs/03-LEARNING-METHOD.md) Pedagogy
- [04-DESIGN-SYSTEM.md](./docs/04-DESIGN-SYSTEM.md) Visual spec

### Contributing

PRs welcome — especially **new corpus packs**. A new pack is roughly 11 sentences of JSON plus an optional dialogue. See `corpus/AGENT_GUIDE.md` and `corpus/examples/`.

### License

[Apache License 2.0](./LICENSE)

---

## 🇯🇵 日本語

### これは何

Nihongo Studio は、以下のような学習者のために設計された**ローカル実行型**のオープンソース日本語訓練システムです：

- N2/N1 レベルで読める
- しかし**話す・聞くがそのレベルに追いついていない**
- 職場や日常生活で自然に発話できるようになりたい

文法アプリではなく、「読める」と「話せる」のギャップを埋めるための構造化訓練システムです。

### 訓練方法

高頻度の日本語チャンクを **4 段階のループ**で回します：

1. **Stage 2 — Drill**：中国語 → 日本語の翻訳
2. **Stage 2.5 — 音読**：発音とリズム
3. **Stage 3 — ディクテーション**：音声 → 書き起こし
4. **Stage 4 — Quick-Fire**：時間制限付き発話

誤答は間隔反復キュー（SM-2 アルゴリズム）に入ります。

### 内蔵コーパス

**26 の主題パック、約 380 文 / 35 対話 / 6 段落**、敬語 / 丁寧 / カジュアルの三レジスターをカバー。

| カテゴリ | テーマ |
|---|---|
| 職場 | 会議・Slack・メール・電話・1on1・面接・稟議・ソフトプッシュバック・スケジュール調整・レポート・インシデント連絡・ベンダー調整・フィードバック |
| 日常 | カフェ・コンビニ・交通・クリニック・美容室・宅配・レストラン・銀行・不動産・スーパー・飲み会・オンボーディング |
| アンビエント | 日本のことわざ + 日常の心構え（Display モードの大文字表示用） |

### クイックスタート

```bash
node -v             # 22.x 推奨（.node-version 同梱）
pnpm install
pnpm db:push        # SQLite スキーマを作成（./data/app.db）
pnpm db:seed        # シードコンテンツを投入
pnpm corpus:import  # corpus/packs/ の全パックをインポート
pnpm dev            # http://localhost:12345
```

> pnpm 11+ の初回インストールで `pnpm approve-builds` を促された場合、一度実行して `better-sqlite3 / @biomejs/biome / esbuild / sharp` を承認してください。

### 主なページ

- `/` 今日の訓練ダッシュボード
- `/drill` Stage 2 ライティング Drill
- `/read-aloud` Stage 2.5 音読
- `/listen-write` Stage 3 ディクテーション
- `/quick-fire` Stage 4 Quick-Fire
- `/learning` **スピーキング訓練**（中国語プロンプト→自分で発話→答え表示→録音シャドーイング→間隔反復；独立した localStorage コーパス）
- `/display` **全画面ローテーション**（サブモニター / アンビエント；Vim キー対応）
- `/library` シナリオライブラリ（フィルター、検索）
- `/passages` 段落読解 + 日本語Q&A
- `/corpus` AI コーパスワークショップ

### Display モードのキーボード

| キー | アクション |
|---|---|
| `j` / `l` / `→` | 次の文へ |
| `k` / `h` / `←` | 前の文へ |
| `Space` | 一時停止 / 再生 |
| `r` | ランダムにジャンプ |
| `f` | フォーカスモード切替 |
| `?` | 全ショートカット表示 |
| `q` | ホームへ戻る |

### 独自コーパスを追加する

[corpus/AGENT_GUIDE.md](corpus/AGENT_GUIDE.md) に従って AI に JSON パックを生成させ、`corpus/packs/` に置きます：

```bash
pnpm corpus:import --dry-run   # スキーマ + トークン連結を検証
pnpm corpus:import             # DB にコミット
```

冪等インポート — 再実行しても重複登録されません（コンテンツハッシュで重複排除）。

### 設計ドキュメント

詳細設計は [docs/](./docs/)：

- [00-DESIGN.md](./docs/00-DESIGN.md) ビジョン + V1 スコープ
- [01-ARCHITECTURE.md](./docs/01-ARCHITECTURE.md) スタック + データモデル
- [02-UI-UX.md](./docs/02-UI-UX.md) デザインシステム + 画面モックアップ
- [03-LEARNING-METHOD.md](./docs/03-LEARNING-METHOD.md) 学習方法論
- [04-DESIGN-SYSTEM.md](./docs/04-DESIGN-SYSTEM.md) ビジュアル仕様

### コントリビュート

PR を歓迎します — 特に**新しいコーパスパック**。新しいパックは概ね 11 文の JSON にオプションで対話を一つ追加するだけです。`corpus/AGENT_GUIDE.md` と `corpus/examples/` を参照してください。

### License

[Apache License 2.0](./LICENSE)
