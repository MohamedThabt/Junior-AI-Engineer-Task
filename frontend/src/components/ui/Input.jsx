import React from "react"
import { cn } from "@/lib/utils"

export const Input = React.forwardRef(({
  className,
  error,
  icon: Icon,
  ...props
}, ref) => {
  return (
    <div className="relative w-full">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#777169]">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full bg-[#ffffff] border border-[#d6d3d1] text-[#0c0a09] placeholder:text-[#a8a29e] text-sm rounded-md h-[44px] px-4 focus:outline-none focus:border-[#0c0a09] focus:ring-1 focus:ring-[#0c0a09] transition-all",
          Icon && "pl-10",
          error && "border-rose-500 focus:border-rose-600 focus:ring-rose-600",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      )}
    </div>
  )
})

Input.displayName = "Input"
