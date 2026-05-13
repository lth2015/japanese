# 设计稿 04 — 设计系统 v2（白底 / Linear-Notion 质感）

> 替代之前的深色版（被否决）。这是项目唯一的真实视觉源。所有 CSS vars、Tailwind tokens、组件 variant 都从这里派生。

## 1. 视觉定位

**类比**：Linear · Notion · Things 3 · shadcn 默认

**原则**：
1. 克制 — 单一主色调 + 单一 accent，所有视觉决策基于灰度
2. 安静 — 长时间观看不疲劳；不抢学习材料的注意力
3. 现代 — subtle shadow + 中等圆角 + 8pt 间距系统
4. 可读 — body 16px+，行高 1.6，中日混排字体对齐

**风格**：Minimalism & Swiss Style（light mode primary，Display ambient 可深色）

## 2. 颜色

### 2.1 表面（surfaces）

| Token | Hex | 用途 |
|---|---|---|
| `--bg` | `#FFFFFF` | 页面主背景（**纯白**） |
| `--bg-subtle` | `#F8F8F6` | 二级表面：hover、selected、disabled |
| `--bg-muted` | `#F2F2EF` | 三级：嵌套块、code 块 |
| `--surface` | `#FFFFFF` | 卡片表面（同主背景，靠边框分离） |
| `--surface-elevated` | `#FFFFFF` | 弹窗、Popover（多加阴影） |

### 2.2 边框

| Token | Hex | 用途 |
|---|---|---|
| `--border` | `#EBEBE5` | 默认 hairline |
| `--border-strong` | `#D4D4CC` | focused / selected |
| `--border-input` | `#E0E0DA` | input 默认 |

### 2.3 文字层级

| Token | Hex | 对比度 vs #FFFFFF | 用途 |
|---|---|---|---|
| `--fg` | `#1A1A1A` | 19.0:1 (AAA) | 主要文字、标题 |
| `--fg-secondary` | `#5F5F5A` | 7.1:1 (AAA) | 副标、说明、表格 |
| `--fg-tertiary` | `#8E8E88` | 3.8:1 (AA large only) | hint、placeholder、disabled label |
| `--fg-on-accent` | `#FFFFFF` | — | accent 上的文字 |

### 2.4 品牌 / 状态

| Token | Hex | 用途 |
|---|---|---|
| `--accent` | `#3B5BDB` | 主要操作、链接、focus ring（Linear 调性的稳重蓝）|
| `--accent-hover` | `#3650C8` | hover |
| `--accent-soft` | `#EEF0FE` | accent 软背景：selected tab、subtle badge |
| `--accent-fg` | `#FFFFFF` | accent 上的文字 |
| `--success` | `#0E8345` | 通过、正确 |
| `--success-soft` | `#E7F5EE` | 成功软背景 |
| `--warning` | `#B26B00` | 部分准确、注意 |
| `--warning-soft` | `#FEF6E6` | 警告软背景 |
| `--danger` | `#C0392B` | 错误、录音中、删除 |
| `--danger-soft` | `#FCEDEA` | 危险软背景 |
| `--vermilion` | `#D14B3F` | **唯一暖色高光**：标记"Stage 4 真实战斗力" / "最自然版本"。慎用。 |

**对比度验证（所有正文 vs #FFFFFF）**：
- fg on bg: 19.0:1 ✅ AAA
- fg-secondary on bg: 7.1:1 ✅ AAA
- accent on bg: 5.4:1 ✅ AA
- fg-on-accent on accent: 10.1:1 ✅ AAA

## 3. 字号

> 这套阶梯**符合视觉习惯**，body 16-18px、section 24-32px、hero 不超过 56px（Display ambient 模式例外）。

| Token | Tailwind | px | line-height | 用途 |
|---|---|---|---|---|
| `text-xs` | `text-xs` | 12 | 1.5 | tags、captions、kana annotation |
| `text-sm` | `text-sm` | 14 | 1.5 | meta、badges、table cells |
| `text-base` | `text-base` | 16 | 1.65 | body 默认 |
| `text-lg` | `text-lg` | 18 | 1.65 | 强调正文、card description |
| `text-xl` | `text-xl` | 20 | 1.45 | card title、小区块标题 |
| `text-2xl` | `text-2xl` | 24 | 1.35 | card hero title |
| `text-3xl` | `text-3xl` | 30 | 1.25 | 区块标题（H2） |
| `text-4xl` | `text-4xl` | 36 | 1.2 | 页面标题（H1） |
| `text-5xl` | `text-5xl` | 48 | 1.15 | Dashboard hero |
| `.text-prompt` | clamp(1.75rem, 3.5vw, 3rem) | 28-48 | 1.25 | 训练页中文 prompt |
| `.text-sentence` | clamp(2rem, 4vw, 3.5rem) | 32-56 | 1.2 | 训练页日文 sentence card |
| `.text-ambient` | clamp(3rem, 9vw, 8rem) | 48-128 | 1.1 | **Display 模式专用**（仅这里允许超过 56px） |

**Body 行高 1.65**：保证长段日文 / 中文阅读舒适。
**Heading 行高 1.2-1.35**：紧凑但有呼吸。

## 4. 字体

| 用途 | 字体 | weight |
|---|---|---|
| UI Sans (所有 UI、英数) | **Inter** | 400 / 500 / 600 / 700 |
| 中文（fallback after Inter）| **Noto Sans SC** | 400 / 500 |
| 日文 sans（UI、表格） | **Noto Sans JP** | 400 / 500 |
| 日文 serif（句子展示、ruby）| **Noto Serif JP** | 500 / 700 |
| Mono（数字、时间、code） | **JetBrains Mono** | 400 |

Tailwind config：
```ts
fontFamily: {
  sans: ['Inter', '"Noto Sans SC"', '"Noto Sans JP"', 'system-ui', 'sans-serif'],
  jp: ['"Noto Sans JP"', '"Noto Sans SC"', 'Inter', 'system-ui', 'sans-serif'],
  'jp-serif': ['"Noto Serif JP"', '"Noto Serif SC"', 'Georgia', 'serif'],
  mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
}
```

## 5. 间距系统（4 / 8pt）

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 / 96 / 128`

**禁止**任何非阶梯值。

**关键节奏**：
- 紧凑组件内部 padding: 12-16
- 卡片 padding: 20-24
- 区块上下: 32-48
- 大区块（section between）: 64-80
- 页面顶部: 32-48（mobile），64-80（desktop）

## 6. 圆角

| Token | px | 用途 |
|---|---|---|
| `rounded-sm` | 4 | tag、inline pill |
| `rounded` | 6 | small button、badge |
| `rounded-md` | 8 | button、input |
| `rounded-lg` | 10 | regular card |
| `rounded-xl` | 14 | hero card、Display 句子卡 |
| `rounded-2xl` | 20 | dialog、modal |
| `rounded-full` | 9999 | avatar、pill、icon button |

## 7. 阴影（subtle，参考 Linear）

```css
--shadow-xs: 0 1px 2px 0 rgba(15, 23, 42, 0.04);
--shadow-sm: 0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04);
--shadow-md: 0 4px 12px -2px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.04);
--shadow-lg: 0 12px 32px -4px rgba(15, 23, 42, 0.10), 0 4px 8px -4px rgba(15, 23, 42, 0.06);
--shadow-focus: 0 0 0 4px rgba(59, 91, 219, 0.16); /* accent halo */
```

**默认 card** 用 `--shadow-xs` + 1px border。**hover** 提升到 `--shadow-sm`。
**modal / popover** 用 `--shadow-lg`。
**禁止**多重彩色阴影、内阴影（除非 input focus）。

## 8. 动效

| 场景 | 时长 | Easing |
|---|---|---|
| press feedback (scale 0.97) | 100ms | cubic-bezier(0.16, 1, 0.3, 1) |
| hover | 150ms | ease-out |
| state transition (tabs, select) | 200ms | ease-out |
| page enter | 250ms | cubic-bezier(0.16, 1, 0.3, 1) |
| Display 句子 crossfade | 400ms | ease-in-out |

`prefers-reduced-motion: reduce` → 全部退化为 0ms。

## 9. 关键组件规范

### 9.1 Button

| Variant | bg | fg | border | hover |
|---|---|---|---|---|
| primary | accent | white | none | accent-hover |
| secondary | white | fg | 1px border | bg-subtle |
| ghost | transparent | fg-secondary | none | bg-subtle |
| outline | transparent | fg | 1px border-strong | bg-subtle |
| destructive | danger | white | none | danger-hover |

高度：`sm` 32px / `default` 40px / `lg` 48px。
圆角：`rounded-md` (8px)。
focus 环：4px accent-soft halo。

### 9.2 Card

- bg: white (`--surface`)
- border: 1px `--border`
- shadow: `--shadow-xs`
- radius: `rounded-lg` (10px) 默认 / `rounded-xl` (14px) hero
- padding: `p-5` (20px) 默认 / `p-6 lg:p-7` 大卡片
- hover: shadow 升到 `--shadow-sm`, border 不变

### 9.3 Input / Textarea

- bg: white
- border: 1px `--border-input`
- radius: 8px
- height: 40px (single line) / auto (textarea, min 96px)
- padding: `px-3 py-2`
- font: text-base (16px) — 必须 16px+ 避免 iOS 自动放大
- focus: border 变 accent + 4px accent-soft halo
- placeholder: `--fg-tertiary`

### 9.4 Badge

- bg: 对应 -soft 色（`--accent-soft` / `--success-soft` / etc.）
- fg: 对应主色
- border: 1px 对应主色 @ 20% opacity
- radius: 4-6px
- padding: `px-2 py-0.5`
- font: text-xs (12px) weight 500

### 9.5 Sidebar (desktop)

- 宽度: 240px
- bg: `--bg-subtle` (#F8F8F6)
- border-right: 1px `--border`
- item: `px-3 py-1.5`, `rounded-md`, hover bg `#F0F0EC`, active bg `--accent-soft`, active text `--accent`
- icon: 16px, stroke 1.5
- font: text-sm (14px) weight 500

### 9.6 Bottom nav (mobile)

- height: 56px + safe-area
- bg: white + 1px top border
- item: 5 max, label + icon, active text/icon `--accent`

## 10. Display ambient 模式（深色例外）

Display 路由作为"副屏挂机"场景，**允许**使用深色变体以减少长时间显示的眼睛疲劳：

- bg: `#0F1115`（near-black with warmth）
- fg: `#E8E8E5`
- sentence color: `#FFFFFF`
- kana ruby: `#7C7C76`
- chinese: `#9C9C95`

但**默认仍是 light mode** — 用户可在 Display 设置里切到 ambient dark。Dashboard / Drill / 其他训练页**始终白底**。

## 11. 不做的事

- ❌ 渐变背景（mesh、aurora、conic）
- ❌ 玻璃拟态（backdrop-blur 仅限弹窗 scrim）
- ❌ Neon glow / 霓虹
- ❌ emoji 当图标
- ❌ 单色块大面积铺设（flat design extreme）
- ❌ 超过 8 种字号
- ❌ Multiple competing accent colors
- ❌ 圆角 > 24px（除 full）

## 12. 落地检查

实施后逐项核对：
- [ ] 所有页面 bg 都是 `--bg` (#FFFFFF) 或 `--bg-subtle`（不是 navy / dark）
- [ ] 没有 hardcoded hex（用 CSS var / Tailwind token）
- [ ] body 文字最小 16px
- [ ] 所有交互元素有 hover state（150-250ms）
- [ ] 所有交互元素有 keyboard focus ring（4px accent halo）
- [ ] 卡片阴影是 `--shadow-xs`，不是凹陷感的多重重阴影
- [ ] 圆角统一使用 token，不要混 8px/10px/12px 随机
- [ ] Display 模式默认 light，"ambient dark" 是可选
- [ ] reduced-motion 尊重
- [ ] 触摸目标 ≥ 40×40px (web) / 44×44px (mobile)

---

实施顺序见提交日志。先 CSS vars + Tailwind config → UI primitives → 各页面。
