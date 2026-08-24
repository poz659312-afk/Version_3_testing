"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"
import { Check, Copy, Terminal, ExternalLink } from "lucide-react"

import "highlight.js/styles/github-dark.css"
import "katex/dist/katex.min.css"

interface MarlineMarkdownRendererProps {
  content: string
  className?: string
}

// Safely extract plain text from React nodes for clipboard copy
function extractText(node: any): string {
  if (!node) return ""
  if (typeof node === "string") return node
  if (typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (node.props && node.props.children) return extractText(node.props.children)
  return ""
}

function CodeBlock({ language, codeText, children }: { language: string; codeText: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <div dir="ltr" className="my-4 rounded-2xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100 shadow-xl font-mono text-xs text-left">
      {/* Code Header */}
      <div dir="ltr" className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-400 select-none text-left">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-300">
            {language || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[11px] font-medium cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div dir="ltr" className="p-4 overflow-x-auto text-[13px] leading-relaxed select-text text-left dir-ltr">
        <pre dir="ltr" className="font-mono text-left">
          <code dir="ltr" className="font-mono text-left">{children || codeText}</code>
        </pre>
      </div>
    </div>
  )
}

// Preprocess math & LaTeX delimiters, clean thinking tags, fix inline headers and tables
function preprocessMarlineContent(content: string): string {
  if (!content) return ""
  let text = content

  // 1. Filter out thinking / reasoning tags (<think>...</think>)
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "")
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "")
  text = text.replace(/<think>[\s\S]*$/gi, "")
  text = text.replace(/<thought>[\s\S]*$/gi, "")

  // 2. Convert explicit LaTeX syntax patterns into standard $ math delimiters:
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, g1) => '\n\n$$' + g1 + '$$\n\n')
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, g1) => '$' + g1 + '$')

  // 3. Fix rogue dividers crammed with headers
  text = text.replace(/---\s*(#{1,6}\s+)/g, '\n\n---\n\n$1')
  text = text.replace(/([^\n])\s+---\s+([^\n])/g, '$1\n\n---\n\n$2')

  // 4. Separate headers (#{1,6}) if they appear inline
  text = text.replace(/([^\n])\s+(#{1,6}\s+[^\n]+)/g, '$1\n\n$2\n\n')

  // 5. Fix tables: Convert double pipes "||" into row newlines "|\n| "
  text = text.replace(/\|{2,}/g, '|\n| ')

  // 6. Repair and auto-normalize tables (split glued header/separator rows, invert RTL columns)
  const rawLines = text.split('\n')
  const repairedLines: string[] = []
  for (let i = 0; i < rawLines.length; i++) {
    let trimmed = rawLines[i].trim()
    if (!trimmed.includes('|') || trimmed.startsWith('#') || trimmed.startsWith('```') || trimmed.startsWith('$$')) {
      repairedLines.push(rawLines[i])
      continue
    }

    // Check if line has both table headers AND separator (:---) glued on the same line
    const sepMatch = trimmed.match(/(.+?)\s*\|\s*(:?-{2,}:?(?:\s*\|\s*:?-{2,}:?)*\s*\|?)$/)
    if (sepMatch && sepMatch[1].includes('|')) {
      const headerPart = sepMatch[1].endsWith('|') ? sepMatch[1] : sepMatch[1] + ' |'
      const sepPart = sepMatch[2].startsWith('|') ? sepMatch[2] : '| ' + sepMatch[2]
      repairedLines.push(headerPart)
      repairedLines.push(sepPart.endsWith('|') ? sepPart : sepPart + ' |')
      continue
    }

    // Handle standalone separator row
    if (trimmed.includes(':---') || trimmed.includes('---:') || (trimmed.includes('---') && trimmed.includes('|'))) {
      repairedLines.push('| :--- | :--- | :--- |')
      continue
    }

    const parts = trimmed.split(/\|{1,2}/).map(s => s.trim()).filter(Boolean)
    if (parts.length >= 3) {
      const last = parts[parts.length - 1]
      const first = parts[0]
      // If the last column is a LaTeX symbol or variable and the first column is Arabic text (RTL inversion)
      if (/^[a-zA-Z0-9\\_{}^\s\$]+$/.test(last) && /[\u0600-\u06FF]/.test(first)) {
        const symbol = last.startsWith('$') ? last : `$${last}$`
        const meaning = first
        const unit = parts.slice(1, parts.length - 1).join(' | ')
        repairedLines.push(`| ${symbol} | ${meaning} | ${unit} |`)
        continue
      }
    }

    if (!trimmed.startsWith('|')) trimmed = '| ' + trimmed
    if (!trimmed.endsWith('|')) trimmed = trimmed + ' |'
    repairedLines.push(trimmed)
  }
  text = repairedLines.join('\n')

  // 7. Ensure Dividers come BEFORE Headings, not glued underneath them
  text = text.replace(/(#{1,6}\s+[^\n]+)\n+\s*---\s*\n+/g, '\n\n---\n\n$1\n\n')

  // 8. Wrap standalone LaTeX environments with $$ if missing
  text = text.replace(
    /(?<!\$\$)\s*(\\begin\{(?:cases|matrix|bmatrix|pmatrix|aligned|align)\}[\s\S]*?\\end\{(?:cases|matrix|bmatrix|pmatrix|aligned|align)\})\s*(?!\$\$)/g,
    (_m, g1) => '\n\n$$' + g1 + '$$\n\n'
  )

  // 9. Ensure display math $$ has its own lines
  text = text.replace(/([^\n])\s*(\$\$)/g, '$1\n\n$2')
  text = text.replace(/(\$\$)\s*([^\n$\s])/g, '$1\n\n$2')

  // 10. Collapse excessive vertical blank lines
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

export function MarlineMarkdownRenderer({ content, className = "" }: MarlineMarkdownRendererProps) {
  const displayContent = preprocessMarlineContent(content) || content

  return (
    <div className={`prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm md:text-base space-y-3 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false, errorColor: "inherit" }], rehypeRaw, rehypeHighlight]}
        components={{
          // Custom Code Block Renderer fixing [object Object] bug
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "")
            const plainCodeText = extractText(children).replace(/\n$/, "")

            if (!inline && (match || plainCodeText.includes("\n"))) {
              return <CodeBlock language={match ? match[1] : "text"} codeText={plainCodeText} children={children} />
            }

            return (
              <code
                dir="ltr"
                className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-semibold inline-block text-left"
                {...props}
              >
                {children}
              </code>
            )
          },

          // Custom Table Renderer
          table({ children }: any) {
            return (
              <div className="my-5 overflow-x-auto rounded-xl border border-border/80 bg-card/90 shadow-sm">
                <table className="w-full text-sm text-right dir-rtl divide-y divide-border">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }: any) {
            return <thead className="bg-muted/60 font-bold text-foreground">{children}</thead>
          },
          th({ children }: any) {
            return <th className="px-4 py-3 text-right font-bold text-xs uppercase tracking-wider">{children}</th>
          },
          td({ children }: any) {
            return <td className="px-4 py-3 text-sm border-t border-border/40 leading-relaxed">{children}</td>
          },

          // Custom Divider
          hr() {
            return <hr className="my-6 border-t border-border/70" />
          },

          // Custom Headings with generous top spacing
          h1({ children }: any) {
            return (
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground border-b border-border/60 pb-2 mt-8 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-primary inline-block" />
                {children}
              </h1>
            )
          },
          h2({ children }: any) {
            return (
              <h2 className="text-lg md:text-xl font-bold text-foreground mt-7 mb-3.5 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-accent inline-block" />
                {children}
              </h2>
            )
          },
          h3({ children }: any) {
            return <h3 className="text-base font-bold text-foreground mt-6 mb-2.5">{children}</h3>
          },

          // Custom Paragraph
          p({ children }: any) {
            return <p className="mb-3 leading-relaxed text-foreground/90 font-rubik">{children}</p>
          },

          // Custom Lists
          ul({ children }: any) {
            return <ul className="my-3 space-y-1.5 list-disc list-inside text-foreground/90 pr-2">{children}</ul>
          },
          ol({ children }: any) {
            return <ol className="my-3 space-y-1.5 list-decimal list-inside text-foreground/90 pr-2">{children}</ol>
          },
          li({ children }: any) {
            return <li className="leading-relaxed">{children}</li>
          },

          // Custom Blockquotes / Callouts
          blockquote({ children }: any) {
            return (
              <blockquote className="my-4 border-r-4 border-primary bg-primary/5 dark:bg-primary/10 p-4 rounded-l-xl text-foreground/90 text-sm italic shadow-inner">
                {children}
              </blockquote>
            )
          },

          // Custom Links
          a({ href, children }: any) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline underline-offset-4 transition-colors"
              >
                <span>{children}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )
          },

          // Custom Horizontal Rule
          hr() {
            return <hr className="my-6 border-border/60" />
          },
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  )
}
