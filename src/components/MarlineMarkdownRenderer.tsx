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

// Preprocess math & LaTeX delimiters, clean thinking tags, preserve Markdown tables intact
function preprocessMarlineContent(content: string): string {
  if (!content) return ""
  let text = content

  // 1. Filter out thinking / reasoning tags (<think>...</think>) and meta-planning scratchpads
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, "")
  text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "")
  text = text.replace(/<think>[\s\S]*$/gi, "")
  text = text.replace(/<thought>[\s\S]*$/gi, "")
  text = text.replace(
    /^(?:Thinking Process:?|Thought Process:?|Internal Reasoning:?|We need to respond as|Let's craft|The user says|The user asks|The user wants)[\s\S]*?(?=[#\u0600-\u06FF]|\n\n)/i,
    ""
  )
  text = text.replace(
    /^[A-Za-z0-9\s,.:;'"!?()\-_/\\]+(?=[#\u0600-\u06FF])/g,
    (match) => {
      if (match.length > 25 && /(?:marline|respond|thinking|thought|user|prompt|rule|assist)/i.test(match)) {
        return ""
      }
      return match
    }
  )

  // 2. Standardize LaTeX delimiters \[ ... \] and \( ... \)
  // Remove blank lines inside display math so Remark-Math does not break the block!
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (_m, g1) => {
    const cleanMath = g1.replace(/\n\s*\n+/g, '\n').trim()
    return `\n\n$$\n${cleanMath}\n$$\n\n`
  })
  text = text.replace(/\\\(([\s\S]*?)\\\)/g, (_m, g1) => `$${g1.trim()}$`)

  // 3. Protect LaTeX norm pipes \| as \Vert so they are never confused with markdown table column pipes
  text = text.replace(/\\\|/g, '\\Vert ')

  // 4. Protect table rows: wrap any \begin{...} inside a table row in inline $...$ with NO newlines
  text = text.replace(
    /^(\|.*?)(\\begin\{(?:cases|matrix|bmatrix|pmatrix|aligned|align)\}[\s\S]*?\\end\{(?:cases|matrix|bmatrix|pmatrix|aligned|align)\})(.*?\|)$/gm,
    (_m, before, env, after) => {
      const cleanEnv = env.trim()
      const wrapped = cleanEnv.startsWith('$') ? cleanEnv : `$${cleanEnv}$`
      return `${before}${wrapped}${after}`
    }
  )

  // 5. Convert any $$...$$ inside table rows into $...$ (inline math) so table rows never break!
  text = text.replace(/^(\|.*\|)$/gm, (line) => {
    return line.replace(/\$\$(.*?)\$\$/g, (_m, inner) => '$' + inner.trim() + '$')
  })

  // 6. Ensure tables have blank line before and single spacing between rows
  text = text.replace(/([^\n|])\n(\|[^\n]+\|)/g, '$1\n\n$2')
  text = text.replace(/(\|[^\n]*\|)\n\s*\n(\|[^\n]*\|)/g, '$1\n$2')

  // =========================================================================
  // MASK EXISTING VALID MATH BLOCKS TO PREVENT DOUBLE-WRAPPING / NESTING
  // =========================================================================
  const mathBlocks: string[] = []
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, body) => {
    // Blank lines (\n\n) inside $$...$$ destroy Remark-Math parsing!
    const cleanedBody = body.replace(/\n\s*\n+/g, '\n').trim()
    if (!cleanedBody) return '' // completely discard empty $$ blocks!
    const idx = mathBlocks.length
    mathBlocks.push(cleanedBody)
    return `___MATH_BLOCK_${idx}___`
  })

  // 7. Standalone bracketed math lines like [f(x) = \begin{cases} ... \end{cases}] or [ ... ]
  text = text.replace(
    /(?:^|\n)\s*\[\s*([a-zA-Z_]\w*(?:\([^\)]*\))?\s*=?\s*\\begin\{(?:cases|matrix|bmatrix|pmatrix|aligned|align)\}[\s\S]*?\\end\{(?:cases|matrix|bmatrix|pmatrix|aligned|align)\})\s*\]\s*(?=\n|$)/g,
    (_m, g1) => {
      const idx = mathBlocks.length
      mathBlocks.push(g1.trim())
      return `\n\n___MATH_BLOCK_${idx}___\n\n`
    }
  )

  text = text.replace(
    /(?:^|\n)\s*\[\s*([a-zA-Z0-9_().,\s=+\-*\/^_{}\\]*\\(?:frac|int|sum|prod|sqrt|mathbf|text|sigma|mu|alpha|beta|lambda|le|ge|ne|pm|times|div|infty|exp)[\s\S]*?)\s*\]\s*(?=\n|$)/g,
    (_m, g1) => {
      const idx = mathBlocks.length
      mathBlocks.push(g1.trim())
      return `\n\n___MATH_BLOCK_${idx}___\n\n`
    }
  )

  // 8. Wrap standalone LaTeX environments outside tables (cases, matrix, bmatrix, etc.)
  // Handles optional trailing \\ from markdown line breaks
  text = text.replace(
    /(?:^|\n)\s*(?:\[\s*)?([a-zA-Z_]\w*(?:\([^\)]*\))?\s*=\s*)?\\begin\{(cases|matrix|bmatrix|pmatrix|aligned|align)\}([\s\S]*?)\\end\{\2\}(?:\s*\])?(?:\s*\\\\+)?\s*(?=\n|$)/g,
    (_match, lhs, env, inner) => {
      const prefix = lhs || ''
      const idx = mathBlocks.length
      mathBlocks.push(`${prefix}\\begin{${env}}${inner}\\end{${env}}`)
      return `\n\n___MATH_BLOCK_${idx}___\n\n`
    }
  )

  // 9. Auto-wrap standalone raw LaTeX formulas on their own lines (e.g. F = \frac... or \approx...)
  text = text.replace(
    /(?:^|\n)\s*([a-zA-Z_]\w*(?:\([^\)]*\))?\s*=\s*\\(?:frac|sum|int|sqrt)[\s\S]*?)(?:\s*\\\\+)?(?=\n|$)/g,
    (match, formula) => {
      if (formula.trim().startsWith('$') || formula.includes('___MATH_BLOCK_')) return match
      const idx = mathBlocks.length
      mathBlocks.push(formula.trim())
      return `\n\n___MATH_BLOCK_${idx}___\n\n`
    }
  )

  text = text.replace(
    /(?:^|\n)\s*(\\approx[\s\S]*?)(?:\s*\\\\+)?(?=\n|$)/g,
    (match, formula) => {
      if (formula.trim().startsWith('$') || formula.includes('___MATH_BLOCK_')) return match
      const idx = mathBlocks.length
      mathBlocks.push(formula.trim())
      return `\n\n___MATH_BLOCK_${idx}___\n\n`
    }
  )

  // 10. Fix headings and dividers
  text = text.replace(/---\s*(#{1,6}\s+)/g, '\n\n---\n\n$1')
  text = text.replace(/([^\n])\s+---\s+([^\n])/g, '$1\n\n---\n\n$2')
  text = text.replace(/([^\n])\s+(#{1,6}\s+[^\n]+)/g, '$1\n\n$2\n\n')
  text = text.replace(/(#{1,6}\s+[^\n]+)\n+\s*---\s*\n+/g, '\n\n---\n\n$1\n\n')

  // =========================================================================
  // UNMASK MATH BLOCKS (Guaranteeing strictly single-wrapped clean $$ blocks)
  // =========================================================================
  text = text.replace(/___MATH_BLOCK_(\d+)___/g, (_m, id) => {
    const body = mathBlocks[parseInt(id, 10)] || ''
    if (!body.trim()) return '' // NEVER emit an empty math block!
    return `\n\n$$\n${body.trim()}\n$$\n\n`
  })

  // 11. Collapse excessive vertical blank lines
  text = text.replace(/\n{3,}/g, '\n\n')

  return text.trim()
}

export function MarlineMarkdownRenderer({ content, className = "" }: MarlineMarkdownRendererProps) {
  const displayContent = preprocessMarlineContent(content) || content

  return (
    <div className={`prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm md:text-base space-y-3 ${className}`}>
      {/* Scoped KaTeX styles guaranteeing 100% horizontal centering inside RTL layout */}
      <style>{`
        .katex-display:empty,
        .katex-display:not(:has(.base)),
        .katex-display:not(:has(.katex)) {
          display: none !important;
          margin: 0 !important;
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
        }
        .katex-display {
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
          direction: ltr !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 1.25rem 0 !important;
          padding: 0.85rem 1rem !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          unicode-bidi: isolate !important;
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 0.875rem !important;
        }
        .katex-display > .katex {
          text-align: center !important;
          display: inline-flex !important;
          justify-content: center !important;
          align-items: center !important;
          margin: 0 auto !important;
          direction: ltr !important;
          unicode-bidi: isolate !important;
        }
        .katex-display > .katex > .katex-html {
          display: inline-flex !important;
          justify-content: center !important;
          align-items: center !important;
          text-align: center !important;
          margin: 0 auto !important;
          direction: ltr !important;
        }
        .prose p:has(> .katex-display),
        .prose p:has(.katex-display),
        .prose li > .katex-display,
        .prose li:has(.katex-display) {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          width: 100% !important;
          text-align: center !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .prose li {
          width: 100% !important;
        }
      `}</style>
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

          // Custom Paragraph: if paragraph contains display math, render a div to prevent RTL right-alignment
          p({ children, ...props }: any) {
            const hasDisplayMath = React.Children.toArray(children).some((child: any) => {
              if (!child || typeof child !== "object") return false
              const className = child.props?.className || ""
              return (
                className.includes("katex-display") ||
                className.includes("math-display") ||
                (typeof child.props?.children === "object" &&
                  React.Children.toArray(child.props.children).some(
                    (c: any) => c?.props?.className?.includes("katex-display")
                  ))
              )
            })

            if (hasDisplayMath) {
              return (
                <div className="my-3 flex flex-col items-center justify-center w-full text-center" dir="ltr">
                  {children}
                </div>
              )
            }

            return <p className="mb-3 leading-relaxed text-foreground/90 font-rubik" {...props}>{children}</p>
          },

          // Custom Lists
          ul({ children }: any) {
            return <ul className="my-3 space-y-1.5 list-disc list-inside text-foreground/90 pr-2">{children}</ul>
          },
          ol({ children }: any) {
            return <ol className="my-3 space-y-1.5 list-decimal list-inside text-foreground/90 pr-2">{children}</ol>
          },
          li({ children }: any) {
            return <li className="leading-relaxed my-1 w-full">{children}</li>
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
        }}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  )
}
