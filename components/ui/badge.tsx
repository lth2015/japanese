import { cn } from "@/lib/utils"
import { type VariantProps, cva } from "class-variance-authority"
import type * as React from "react"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/62 text-fg-secondary border-border",
        accent: "bg-accent-soft text-accent border-accent/20",
        success: "bg-success-soft text-success border-success/20",
        warning: "bg-warning-soft text-warning border-warning/20",
        danger: "bg-danger-soft text-danger border-danger/20",
        outline: "bg-transparent text-fg-secondary border-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
