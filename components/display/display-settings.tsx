"use client"

import { Settings as SettingsIcon } from "lucide-react"
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

const SOURCES: { value: string; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "rescue", label: "救命" },
  { value: "progress", label: "进度" },
  { value: "request", label: "请求" },
  { value: "apology", label: "道歉" },
  { value: "smalltalk", label: "杂谈" },
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
          className="text-text-muted hover:text-text-primary"
          aria-label="Display 设置"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Display 设置</SheetTitle>
          <SheetDescription>设置会自动保存到本地。</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Source */}
          <div className="space-y-2">
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
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label>切换间隔</Label>
              <span className="text-sm text-text-secondary tabular">{s.intervalSec}s</span>
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
          <div className="space-y-2">
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

          {/* Toggles */}
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
            hint="Phase 2 启用"
            disabled
          />
          <Toggle
            label="深度专注 (隐藏所有 UI)"
            checked={s.focusMode}
            onChange={(v) => set({ focusMode: v })}
            hint="只剩键盘控制：← → Space"
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
        <Label className={disabled ? "opacity-50" : ""}>{label}</Label>
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  )
}
