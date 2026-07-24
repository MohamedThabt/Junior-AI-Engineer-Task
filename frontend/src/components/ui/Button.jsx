import React from "react"
import { cn } from "@/lib/utils"

export const Button = React.forwardRef(({
  className,
  variant = "primary",
  size = "md",
  children,
  disabled,
  isLoading,
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-md"
  
  const variants = {
    primary: "bg-zinc-100 text-zinc-950 hover:bg-white active:bg-zinc-200 font-medium",
    secondary: "bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800 hover:text-white",
    translucent: "bg-zinc-900/80 text-zinc-200 border border-zinc-800 hover:bg-zinc-800",
    icon: "bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/60 p-1.5",
    ghost: "bg-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40",
    danger: "bg-red-950/30 text-red-400 border border-red-900/50 hover:bg-red-900/40",
  }

  const sizes = {
    sm: "text-xs px-2.5 py-1.5",
    md: "text-xs px-3.5 py-2",
    lg: "text-sm px-4 py-2.5",
    icon: "p-1.5",
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        baseStyles,
        variants[variant],
        variant !== "icon" && sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = "Button"
