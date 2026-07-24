import React from "react"
import { cn } from "@/lib/utils"

export const Card = ({
  className,
  variant = "default",
  children,
  ...props
}) => {
  const variants = {
    // Level 1 Charcoal surface-1 card
    default: "bg-surface-1 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:border-white/20",
    
    // Level 2 Surface-2 featured card with subtle light-edge top inset
    featured: "bg-surface-2 border border-white/15 rounded-xl p-6 card-light-edge transition-all duration-300 hover:border-white/30",

    // Flat canvas card
    canvas: "bg-canvas border border-white/10 rounded-xl p-6",

    // Mockup tile with frame
    mockup: "bg-surface-1 border border-white/10 rounded-xl p-4 card-light-edge overflow-hidden",
  }

  return (
    <div className={cn(variants[variant], className)} {...props}>
      {children}
    </div>
  )
}

export const CardHeader = ({ className, children, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props}>
    {children}
  </div>
)

export const CardTitle = ({ className, children, ...props }) => (
  <h3 className={cn("text-xl font-medium tracking-display-md text-ink", className)} {...props}>
    {children}
  </h3>
)

export const CardDescription = ({ className, children, ...props }) => (
  <p className={cn("text-sm text-ink-muted leading-relaxed", className)} {...props}>
    {children}
  </p>
)

export const CardContent = ({ className, children, ...props }) => (
  <div className={cn("", className)} {...props}>
    {children}
  </div>
)

export const CardFooter = ({ className, children, ...props }) => (
  <div className={cn("flex items-center pt-4 border-t border-white/5 mt-6", className)} {...props}>
    {children}
  </div>
)
