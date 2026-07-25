import React from "react"

/**
 * MarkdownRenderer component
 * Renders Markdown formatted text including headers, bold/italic inline text,
 * lists, tables, code blocks, and blockquotes in Data Assistant aesthetics.
 */
export function MarkdownRenderer({ content = "", isUser = false }) {
  if (!content) return null

  // Split by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: content.substring(lastIndex, match.index) })
    }
    parts.push({ type: "codeblock", language: match[1], value: match[2].trim() })
    lastIndex = codeBlockRegex.lastIndex
  }

  if (lastIndex < content.length) {
    parts.push({ type: "text", value: content.substring(lastIndex) })
  }

  return (
    <div className={`space-y-2 text-xs sm:text-[13px] leading-relaxed ${isUser ? "text-[#0c0a09] font-normal" : "text-[#0c0a09]"}`}>
      {parts.map((part, pIdx) => {
        if (part.type === "codeblock") {
          return (
            <div key={pIdx} className="my-2.5 rounded-xl bg-[#fafafa] border border-[#e7e5e4] overflow-hidden font-mono shadow-xs">
              {part.language && (
                <div className="px-3 py-1 bg-[#f0efed] border-b border-[#e7e5e4] text-[10px] text-[#777169] uppercase tracking-wider font-semibold">
                  {part.language}
                </div>
              )}
              <pre className="p-3.5 text-[11px] text-[#0c0a09] overflow-x-auto whitespace-pre leading-relaxed">
                <code>{part.value}</code>
              </pre>
            </div>
          )
        }

        // Process text lines (paragraphs, headings, lists, tables)
        const lines = part.value.split("\n")
        const elements = []
        let currentList = []
        let listType = null // 'ul' | 'ol'
        let tableRows = []

        const flushList = () => {
          if (currentList.length > 0) {
            if (listType === "ul") {
              elements.push(
                <ul key={`ul-${elements.length}`} className={`list-disc list-inside space-y-1 my-1.5 pl-1 ${isUser ? "text-[#0c0a09]" : "text-[#4e4e4e]"}`}>
                  {currentList.map((li, lIdx) => (
                    <li key={lIdx}>{formatInline(li, isUser)}</li>
                  ))}
                </ul>
              )
            } else if (listType === "ol") {
              elements.push(
                <ol key={`ol-${elements.length}`} className={`list-decimal list-inside space-y-1 my-1.5 pl-1 ${isUser ? "text-[#0c0a09]" : "text-[#4e4e4e]"}`}>
                  {currentList.map((li, lIdx) => (
                    <li key={lIdx}>{formatInline(li, isUser)}</li>
                  ))}
                </ol>
              )
            }
            currentList = []
            listType = null
          }
        }

        const flushTable = () => {
          if (tableRows.length > 0) {
            const headerRow = tableRows[0]
            const bodyRows = tableRows.slice(1).filter(r => !r.every(c => /^[-:\s]+$/.test(c)))
            elements.push(
              <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded-xl border border-[#e7e5e4] bg-[#ffffff]">
                <table className="w-full text-left font-mono text-[11px] divide-y divide-[#e7e5e4]">
                  <thead className="bg-[#f0efed] text-[#0c0a09]">
                    <tr>
                      {headerRow.map((cell, cIdx) => (
                        <th key={cIdx} className="px-3 py-2 font-semibold">{formatInline(cell, isUser)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0efed] text-[#4e4e4e]">
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#fafafa]">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-2">{formatInline(cell, isUser)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
            tableRows = []
          }
        }

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          const trimmed = line.trim()

          // Table row detection
          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            flushList()
            const cells = trimmed.split("|").slice(1, -1).map(c => c.trim())
            tableRows.push(cells)
            continue
          } else {
            flushTable()
          }

          // Unordered list items: `- `, `* `, `• `
          const ulMatch = line.match(/^\s*[-*•]\s+(.*)/)
          if (ulMatch) {
            if (listType && listType !== "ul") flushList()
            listType = "ul"
            currentList.push(ulMatch[1])
            continue
          }

          // Ordered list items: `1. `
          const olMatch = line.match(/^\s*(\d+)\.\s+(.*)/)
          if (olMatch) {
            if (listType && listType !== "ol") flushList()
            listType = "ol"
            currentList.push(olMatch[2])
            continue
          }

          // Not a list line — flush any active list
          flushList()

          if (!trimmed) {
            continue
          }

          // Headings
          if (trimmed.startsWith("### ")) {
            elements.push(<h4 key={`h3-${i}`} className={`font-serif text-sm font-semibold mt-2 mb-1 ${isUser ? "text-[#0c0a09]" : "text-[#0c0a09]"}`}>{formatInline(trimmed.slice(4), isUser)}</h4>)
          } else if (trimmed.startsWith("## ")) {
            elements.push(<h3 key={`h2-${i}`} className="font-serif text-base font-normal text-[#0c0a09] mt-3 mb-1">{formatInline(trimmed.slice(3), isUser)}</h3>)
          } else if (trimmed.startsWith("# ")) {
            elements.push(<h2 key={`h1-${i}`} className="font-serif text-lg font-light text-[#0c0a09] mt-3 mb-1">{formatInline(trimmed.slice(2), isUser)}</h2>)
          } else if (trimmed.startsWith("> ")) {
            elements.push(
              <blockquote key={`bq-${i}`} className={`border-l-2 border-[#292524] pl-3 py-1 my-2 italic bg-[#fafafa] rounded-r text-[#4e4e4e]`}>
                {formatInline(trimmed.slice(2), isUser)}
              </blockquote>
            )
          } else {
            elements.push(<p key={`p-${i}`} className="my-1 leading-relaxed">{formatInline(line, isUser)}</p>)
          }
        }

        flushList()
        flushTable()

        return <React.Fragment key={pIdx}>{elements}</React.Fragment>
      })}
    </div>
  )
}

/**
 * Format inline markdown tokens: bold **foo**, italic *bar*, inline `code`
 */
function formatInline(text = "", isUser = false) {
  if (!text) return ""

  // Split by inline code `...`
  const parts = text.split(/(`[^`]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code 
          key={index} 
          className="px-1.5 py-0.5 mx-0.5 rounded-md font-mono text-[11px] bg-[#f0efed] border border-[#e7e5e4] text-[#0c0a09] font-medium"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    // Process bold (**foo** or __foo__) and italics (*foo* or _foo_)
    const regex = /(\*\*[^*]+\*\*|__[^_]+__|(?<!\w)\*[^*]+\*(?!\w)|(?:^|\s)_[^\s_](?:[^_]*[^\s_])?_(?=\s|[.,!?]|$))/g

    let formatted = []
    let lastIdx = 0
    let match

    while ((match = regex.exec(part)) !== null) {
      if (match.index > lastIdx) {
        formatted.push(part.substring(lastIdx, match.index))
      }

      const token = match[0]
      const trimmedToken = token.trimStart()
      const leadingSpace = token.substring(0, token.length - trimmedToken.length)

      if (leadingSpace) {
        formatted.push(leadingSpace)
      }

      if ((trimmedToken.startsWith("**") && trimmedToken.endsWith("**")) || 
          (trimmedToken.startsWith("__") && trimmedToken.endsWith("__"))) {
        formatted.push(
          <strong key={match.index} className="font-semibold text-[#0c0a09]">
            {trimmedToken.slice(2, -2)}
          </strong>
        )
      } else if ((trimmedToken.startsWith("*") && trimmedToken.endsWith("*")) ||
                 (trimmedToken.startsWith("_") && trimmedToken.endsWith("_"))) {
        formatted.push(
          <em key={match.index} className="italic text-[#4e4e4e]">
            {trimmedToken.slice(1, -1)}
          </em>
        )
      } else {
        formatted.push(token)
      }

      lastIdx = regex.lastIndex
    }

    if (lastIdx < part.length) {
      formatted.push(part.substring(lastIdx))
    }

    return <React.Fragment key={index}>{formatted}</React.Fragment>
  })
}
