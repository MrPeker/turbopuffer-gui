import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-mono font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-tp-border-subtle bg-tp-accent/20 text-tp-accent hover:bg-tp-accent/30",
        secondary:
          "border-tp-border-subtle bg-tp-surface-alt text-tp-text-muted hover:bg-tp-surface",
        destructive:
          "border-tp-danger/30 bg-tp-danger/10 text-tp-danger hover:bg-tp-danger/20",
        outline: "text-tp-text border-tp-border-strong",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
