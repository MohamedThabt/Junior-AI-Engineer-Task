import React from "react"
import { cn } from "@/lib/utils"

export const Badge = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variants = {
    default: "bg-surface-2 text-ink-muted border border-white/10 text-xs px-2.5 py-1 rounded-sm font-medium",
    primary: "bg-white/10 text-white border border-white/20 text-xs px-2.5 py-1 rounded-pill font-medium",
    success: "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 text-xs px-2.5 py-1 rounded-pill font-medium flex items-center gap-1.5",
    sky: "bg-sky-950/60 text-accent-blue border border-accent-blue/30 text-xs px-2.5 py-1 rounded-pill font-medium flex items-center gap-1.5",
    warning: "bg-amber-950/60 text-amber-400 border border-amber-800/40 text-xs px-2.5 py-1 rounded-pill font-medium",
  }

  return (
    <span className={cn("inline-flex items-center text-xs font-medium tracking-caption select-none", variants[variant], className)} {...props}>
      {children}
    </span>
  )
}
