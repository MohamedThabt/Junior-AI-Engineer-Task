import React from "react"
import { cn } from "@/lib/utils"

export const SpotlightCard = ({
  className,
  variant = "violet",
  title,
  subtitle,
  children,
  badge,
  action,
  ...props
}) => {
  const gradientClasses = {
    violet: "gradient-spotlight-violet border border-purple-500/20",
    magenta: "gradient-spotlight-magenta border border-pink-500/20",
    orange: "gradient-spotlight-orange border border-orange-500/20",
    coral: "gradient-spotlight-coral border border-rose-500/20",
  }

  return (
    <div
      className={cn(
        "relative rounded-[30px] p-8 overflow-hidden transition-all duration-500 hover:scale-[1.01]",
        gradientClasses[variant],
        className
      )}
      {...props}
    >
      {/* Decorative ambient light circle */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          {badge && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-white/10 border border-white/15 text-xs text-white/90 font-medium mb-4 backdrop-blur-md">
              {badge}
            </div>
          )}
          {title && (
            <h3 className="text-2xl md:text-3xl font-medium tracking-display-md text-ink leading-tight mb-2">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-white/70 leading-relaxed mb-6 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mt-4">
          {children}
        </div>

        {action && (
          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
