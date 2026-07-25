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
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed select-none rounded-full"
  
  const variants = {
    primary: "bg-[#292524] text-white hover:bg-[#0c0a09] active:bg-[#0c0a09] shadow-xs font-medium text-[15px]",
    outline: "bg-transparent text-[#0c0a09] border border-[#d6d3d1] hover:bg-[#f0efed] hover:border-[#0c0a09] active:bg-[#e7e5e4] text-[15px]",
    tertiary: "bg-transparent text-[#0c0a09] hover:underline underline-offset-4 p-0 rounded-none h-auto font-normal text-[15px]",
    secondary: "bg-[#ffffff] text-[#0c0a09] border border-[#e7e5e4] hover:bg-[#fafafa] hover:border-[#d6d3d1] text-[15px]",
    icon: "bg-transparent text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#f0efed] p-2 rounded-full",
    ghost: "bg-transparent text-[#4e4e4e] hover:text-[#0c0a09] hover:bg-[#f0efed]",
    danger: "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100",
  }

  const sizes = {
    sm: "text-xs px-3.5 py-1.5 h-8",
    md: "text-[15px] px-5 py-2.5 h-10",
    lg: "text-base px-6 py-3 h-12",
    icon: "p-2 h-9 w-9",
  }

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        baseStyles,
        variants[variant],
        variant !== "icon" && variant !== "tertiary" && sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
})

Button.displayName = "Button"
