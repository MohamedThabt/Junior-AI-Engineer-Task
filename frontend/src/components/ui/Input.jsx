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
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
          <Icon className="w-4 h-4" />
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder:text-zinc-500 text-xs rounded-md py-2 px-3 focus:outline-none focus:border-zinc-700 transition-colors",
          Icon && "pl-9",
          error && "border-red-500/80 focus:border-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[11px] text-red-400">{error}</p>
      )}
    </div>
  )
})

Input.displayName = "Input"
