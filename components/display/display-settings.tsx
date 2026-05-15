"use client"

import { Moon, Settings as SettingsIcon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { type FontSize, useDisplaySettings } from "@/store/display-settings"
import { cn } from "@/lib/utils"

const SOURCES: { value: string; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "rescue", label: "救命" },
  { value: "progress", label: "进度" },
  { value: "request", label: "请求" },
  { value: "apology", label: "道歉" },
  { value: "smalltalk", label: "杂谈" },
  { value: "daily", label: "日常" },
  { value: "grammar", label: "语法" },
]

const SIZES: FontSize[] = ["S", "M", "L", "XL"]

export function DisplaySettingsSheet() {
  const [s, set] = useDisplaySettings()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Display 设置"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Display 设置</SheetTitle>
          <SheetDescription>设置自动保存到本地。</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-7">
          {/* Theme */}
          <div className="space-y-2.5">
            <Label>主题</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={s.theme === "light" ? "default" : "secondary"}
                onClick={() => set({ theme: "light" })}
              >
                <Sun className="h-4 w-4" />
                白底
              </Button>
              <Button
                size="sm"
                variant={s.theme === "ambient-dark" ? "default" : "secondary"}
                onClick={() => set({ theme: "ambient-dark" })}
              >
                <Moon className="h-4 w-4" />
                暗色挂机
              </Button>
            </div>
            <p className="text-xs text-fg-tertiary">挂副屏 / 晚上长时间用，切到暗色更护眼。</p>
          </div>

          {/* Source */}
          <div className="space-y-2.5">
            <Label>句子来源</Label>
            <div className="grid grid-cols-3 gap-2">
              {SOURCES.map((src) => (
                <Button
                  key={src.value}
                  size="sm"
                  variant={s.source === src.value ? "default" : "secondary"}
                  onClick={() => set({ source: src.value as typeof s.source })}
                >
                  {src.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <Label>切换间隔</Label>
              <span className="text-sm text-fg-secondary tabular font-mono">{s.intervalSec}s</span>
            </div>
            <Slider
              value={[s.intervalSec]}
              min={4}
              max={30}
              step={1}
              onValueChange={([v]) => set({ intervalSec: v })}
            />
          </div>

          {/* Font size */}
          <div className="space-y-2.5">
            <Label>字号</Label>
            <div className="grid grid-cols-4 gap-2">
              {SIZES.map((sz) => (
                <Button
                  key={sz}
                  size="sm"
                  variant={s.fontSize === sz ? "default" : "secondary"}
                  onClick={() => set({ fontSize: sz })}
                >
                  {sz}
                </Button>
              ))}
            </div>
          </div>

          <Toggle
            label="显示假名"
            checked={s.showKana}
            onChange={(v) => set({ showKana: v })}
          />
          <Toggle
            label="显示中文"
            checked={s.showChinese}
            onChange={(v) => set({ showChinese: v })}
          />
          <Toggle
            label="自动播放朗读 (TTS)"
            checked={s.autoPlayTTS}
            onChange={(v) => set({ autoPlayTTS: v })}
            hint="浏览器系统语音（ja-JP）"
          />
          <Toggle
            label="深度专注（隐藏所有 UI）"
            checked={s.focusMode}
            onChange={(v) => set({ focusMode: v })}
            hint="只留键盘控制：← → Space"
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function Toggle({
  label,
  checked,
  onChange,
  hint,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  hint?: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-0.5">
        <Label className={cn(disabled && "opacity-50")}>{label}</Label>
        {hint && <p className="text-xs text-fg-tertiary">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}
