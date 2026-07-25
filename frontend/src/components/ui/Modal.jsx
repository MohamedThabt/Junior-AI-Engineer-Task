import React, { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0c0a09]/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container Card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg max-h-[85vh] bg-[#ffffff] border border-[#e7e5e4] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all",
          className
        )}
      >
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-4 sm:p-5 border-b border-[#e7e5e4] flex items-start justify-between bg-[#ffffff] z-10">
          <div className="pr-4">
            {title && (
              <h3 className="font-serif text-lg sm:text-xl font-normal text-[#0c0a09] tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-[#4e4e4e] mt-0.5 leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#777169] hover:text-[#0c0a09] hover:bg-[#f0efed] transition-colors flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  )
}
