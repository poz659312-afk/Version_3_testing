"use client"

import React, { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import rehypeHighlight from "rehype-highlight"
import { Check, Copy, Terminal, ExternalLink } from "lucide-react"

import "katex/dist/katex.min.css"
import "highlight.js/styles/github-dark.css"

interface MarlineMarkdownRendererProps {
  content: string
  className?: string
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy code:", err)
    }
  }

  return (
    <div className="my-4 rounded-2xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100 shadow-xl font-mono text-xs dir-ltr">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-400 select-none">
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
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed select-text">
        <pre className="font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

export function MarlineMarkdownRenderer({ content, className = "" }: MarlineMarkdownRendererProps) {
  return (
    <div className={`prose dark:prose-invert max-w-none text-foreground leading-relaxed text-sm md:text-base space-y-3 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false }], rehypeRaw, rehypeHighlight]}
        components={{
          // Custom Code Block Renderer
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "")
            const codeString = String(children).replace(/\n$/, "")

            if (!inline && (match || codeString.includes("\n"))) {
              return <CodeBlock language={match ? match[1] : "text"} code={codeString} />
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-semibold"
                {...props}
              >
                {children}
              </code>
            )
          },

          // Custom Table Renderer
          table({ children }: any) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-border/80 bg-card shadow-sm">
                <table className="w-full text-sm text-right dir-rtl divide-y divide-border">
                  {children}
                </table>
              </div>
            )
          },
          thead({ children }: any) {
            return <thead className="bg-muted/50 font-bold text-foreground">{children}</thead>
          },
          th({ children }: any) {
            return <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider">{children}</th>
          },
          td({ children }: any) {
            return <td className="px-4 py-3 text-sm border-t border-border/40">{children}</td>
          },

          // Custom Headings
          h1({ children }: any) {
            return (
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground border-b border-border/60 pb-2 mt-6 mb-3 flex items-center gap-2">
                <span className="w-2 h-6 rounded-full bg-primary inline-block" />
                {children}
              </h1>
            )
          },
          h2({ children }: any) {
            return (
              <h2 className="text-lg md:text-xl font-bold text-foreground mt-5 mb-2.5 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-accent inline-block" />
                {children}
              </h2>
            )
          },
          h3({ children }: any) {
            return <h3 className="text-base font-bold text-foreground mt-4 mb-2">{children}</h3>
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
        {content}
      </ReactMarkdown>
    </div>
  )
}
