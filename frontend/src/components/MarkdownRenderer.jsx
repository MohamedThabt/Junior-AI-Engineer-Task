import React from "react"

/**
 * MarkdownRenderer component
 * Renders Markdown formatted text including headers, bold/italic inline text,
 * lists, tables, code blocks, and blockquotes.
 */
export function MarkdownRenderer({ content = "" }) {
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
    <div className="space-y-2 text-xs leading-relaxed text-zinc-200">
      {parts.map((part, pIdx) => {
        if (part.type === "codeblock") {
          return (
            <div key={pIdx} className="my-2.5 rounded-md bg-zinc-950 border border-zinc-800/90 overflow-hidden font-mono">
              {part.language && (
                <div className="px-3 py-1 bg-zinc-900 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                  {part.language}
                </div>
              )}
              <pre className="p-3 text-[11px] text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed">
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
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-1.5 pl-1 text-zinc-300">
                  {currentList.map((li, lIdx) => (
                    <li key={lIdx}>{formatInline(li)}</li>
                  ))}
                </ul>
              )
            } else if (listType === "ol") {
              elements.push(
                <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1 my-1.5 pl-1 text-zinc-300">
                  {currentList.map((li, lIdx) => (
                    <li key={lIdx}>{formatInline(li)}</li>
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
              <div key={`table-${elements.length}`} className="my-3 overflow-x-auto rounded border border-zinc-800 bg-zinc-950/60">
                <table className="w-full text-left font-mono text-[11px] divide-y divide-zinc-800">
                  <thead className="bg-zinc-900 text-zinc-300">
                    <tr>
                      {headerRow.map((cell, cIdx) => (
                        <th key={cIdx} className="px-3 py-2 font-semibold">{formatInline(cell)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-zinc-900/40">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5">{formatInline(cell)}</td>
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
            elements.push(<h4 key={`h3-${i}`} className="text-xs font-bold text-zinc-100 mt-2 mb-1">{formatInline(trimmed.slice(4))}</h4>)
          } else if (trimmed.startsWith("## ")) {
            elements.push(<h3 key={`h2-${i}`} className="text-sm font-semibold text-white mt-3 mb-1">{formatInline(trimmed.slice(3))}</h3>)
          } else if (trimmed.startsWith("# ")) {
            elements.push(<h2 key={`h1-${i}`} className="text-base font-bold text-white mt-3 mb-1">{formatInline(trimmed.slice(2))}</h2>)
          } else if (trimmed.startsWith("> ")) {
            elements.push(
              <blockquote key={`bq-${i}`} className="border-l-2 border-cyan-500/80 pl-3 py-1 my-1.5 text-zinc-400 italic bg-zinc-950/40 rounded-r">
                {formatInline(trimmed.slice(2))}
              </blockquote>
            )
          } else {
            elements.push(<p key={`p-${i}`} className="my-1 leading-relaxed">{formatInline(line)}</p>)
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
function formatInline(text = "") {
  if (!text) return ""

  // Split by inline code `...`
  const parts = text.split(/(`[^`]+`)/g)

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 1) {
      return (
        <code key={index} className="px-1.5 py-0.5 mx-0.5 rounded bg-zinc-950 border border-zinc-800 text-cyan-300 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      )
    }

    // Process bold **...** and italics *...*
    let formatted = []
    const tokens = part.split(/(\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_)/g)

    tokens.forEach((token, tIdx) => {
      if ((token.startsWith("**") && token.endsWith("**")) || (token.startsWith("__") && token.endsWith("__"))) {
        formatted.push(<strong key={tIdx} className="font-semibold text-white">{token.slice(2, -2)}</strong>)
      } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
        formatted.push(<em key={tIdx} className="italic text-zinc-300">{token.slice(1, -1)}</em>)
      } else {
        formatted.push(token)
      }
    })

    return <React.Fragment key={index}>{formatted}</React.Fragment>
  })
}
