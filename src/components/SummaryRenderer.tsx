'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeRaw from 'rehype-raw'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'
import MermaidRenderer from '@/components/MermaidRenderer'

interface SummaryRendererProps {
  content: string
  className?: string
}

export default function SummaryRenderer({ content, className }: SummaryRendererProps) {
  // Pre-process custom color and highlight tags (BBCode style and link style)
  const processedContent = (() => {
    if (!content) return ''
    let text = content
    
    // 1. Link-style color: [text](color:red) or [text](color:#ff0055)
    text = text.replace(/\[([^\]]+)\]\(color:([^\)]+)\)/g, '<span style="color: $2">$1</span>')
    
    // 2. Link-style bg: [text](bg:yellow) or [text](bg:#ff0055)
    text = text.replace(/\[([^\]]+)\]\(bg:([^\)]+)\)/g, '<span style="background-color: $2; padding: 2px 6px; border-radius: 4px;">$1</span>')

    // 3. BBCode-style [color=red]text[/color]
    text = text.replace(/\[color=([^\]]+)\]([\s\S]*?)\[\/color\]/gi, '<span style="color: $1">$2</span>')

    // 4. BBCode-style [bg=yellow]text[/bg]
    text = text.replace(/\[bg=([^\]]+)\]([\s\S]*?)\[\/bg\]/gi, '<span style="background-color: $1; padding: 2px 6px; border-radius: 4px;">$2</span>')

    // 5. Named BBCode tags: [red]text[/red], [blue]text[/blue], [yellow]text[/yellow], [green]text[/green], [orange]text[/orange], [purple]text[/purple], [pink]text[/pink], [emerald]text[/emerald], [sky]text[/sky], [indigo]text[/indigo], [rose]text[/rose]
    const commonColors = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray', 'emerald', 'sky', 'indigo', 'rose']
    commonColors.forEach(color => {
      const regex = new RegExp(`\\[${color}\\]([\\s\\S]*?)\\[\\/${color}\\]`, 'gi')
      text = text.replace(regex, `<span style="color: ${color}">$1</span>`)
    })

    return text
  })()

  return (
    <div className={cn("prose prose-invert max-w-none text-gray-300 select-text", className)} dir="rtl">
      <style jsx global>{`
        .katex-display {
          overflow-x: auto;
          overflow-y: hidden;
          padding: 16px;
          margin: 20px 0;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        .katex {
          font-size: 1.08em;
        }
        .katex-html {
          overflow-x: auto;
        }
        /* Code Syntax Highlighting Theme (One Dark Style) */
        .hljs-keyword, .hljs-selector-tag, .hljs-doctag { color: #f472b6; font-weight: bold; } /* Pink */
        .hljs-string, .hljs-type, .hljs-built_in { color: #a7f3d0; } /* Mint / Green */
        .hljs-number, .hljs-literal, .hljs-symbol, .hljs-bullet { color: #fbbf24; } /* Amber Gold */
        .hljs-comment, .hljs-quote { color: #6b7280; font-style: italic; } /* Gray */
        .hljs-title, .hljs-title.function_, .hljs-section { color: #60a5fa; } /* Blue */
        .hljs-params, .hljs-variable, .hljs-template-variable { color: #e2e8f0; } /* Light Slate */
        .hljs-attr, .hljs-attribute { color: #fb7185; } /* Rose */
        .hljs-tag, .hljs-name { color: #f472b6; } /* Pink tag names */
        .hljs-emphasis { font-style: italic; }
        .hljs-strong { font-weight: bold; }
      `}</style>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false }], rehypeRaw, rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-black mt-8 mb-4 border-b border-white/10 pb-3 text-white tracking-tight leading-tight" dir="auto">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-bold mt-6 mb-3 text-violet-400 tracking-tight leading-snug" dir="auto">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-bold mt-5 mb-2 text-fuchsia-400 tracking-tight" dir="auto">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 leading-relaxed text-gray-300 text-base md:text-lg" dir="auto">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 rtl:pl-0 rtl:pr-6 mb-4 space-y-1.5 text-gray-300" dir="auto">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 rtl:pl-0 rtl:pr-6 mb-4 space-y-1.5 text-gray-300" dir="auto">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-base md:text-lg" dir="auto">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-violet-500 pl-4 py-2 italic bg-white/5 my-5 rounded-r-lg text-gray-400" dir="auto">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match
            const language = match ? match[1] : ''

            if (language === 'mermaid') {
              return <MermaidRenderer chart={String(children)} />
            }

            return isInline ? (
              <code className="font-mono bg-white/10 text-violet-300 px-1.5 py-0.5 rounded text-sm font-semibold">
                {children}
              </code>
            ) : (
              <pre className="font-mono bg-zinc-950 p-4 rounded-xl border border-white/10 overflow-x-auto my-5 text-sm text-gray-300">
                <code>{children}</code>
              </pre>
            )
          },
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 rounded-xl border border-white/10 bg-white/2">
              <table className="w-full border-collapse text-sm text-left">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/5 text-xs text-violet-300 uppercase tracking-wider font-bold border-b border-white/10">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-white/5">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-white/2 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-semibold text-violet-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-gray-300">
              {children}
            </td>
          ),
          img: ({ src, alt }) => {
            const hash = src?.split('#')[1] || ''
            const params = new URLSearchParams(hash)
            const width = params.get('w') || params.get('width') || '100%'
            const align = params.get('align') || 'center'

            if (align === 'left' || align === 'right') {
              return (
                <span className={cn(
                  "block my-3 select-none",
                  align === 'left' ? 'float-left mr-5 mb-2' : 'float-right ml-5 mb-2'
                )}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt || 'Image'}
                    className="rounded-xl max-h-[380px] object-contain border border-white/10 shadow-2xl transition-transform hover:scale-[1.01]"
                    style={{ width: width !== '100%' ? width : undefined }}
                  />
                  {alt && <span className="block text-center text-xs text-gray-500 italic mt-1">{alt}</span>}
                </span>
              )
            }

            const alignClass = 
              align === 'left' ? 'justify-start' : 
              align === 'right' ? 'justify-end' : 
              'justify-center'

            return (
              <div className={cn("my-6 flex w-full gap-2 clear-both", alignClass)}>
                <div className="flex flex-col items-center max-w-full">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={alt || 'Image'}
                    className="rounded-xl max-h-[500px] object-contain border border-white/10 shadow-2xl transition-transform hover:scale-[1.01]"
                    style={{ width: width !== '100%' ? width : undefined }}
                  />
                  {alt && <span className="text-xs text-gray-500 italic mt-1.5">{alt}</span>}
                </div>
              </div>
            )
          },
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-violet-400 hover:text-violet-300 underline font-medium transition-colors"
            >
              {children}
            </a>
          ),
          span: ({ children, style, className, ...props }) => {
            let parsedStyle: React.CSSProperties = {}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const styleProp = style as any
            if (typeof styleProp === 'string') {
              const styleObj: Record<string, string> = {}
              styleProp.split(';').forEach((rule: string) => {
                const parts = rule.split(':')
                if (parts.length >= 2) {
                  const key = parts[0].trim()
                  const val = parts.slice(1).join(':').trim()
                  if (key && val) {
                    const camelKey = key.replace(/-./g, (x: string) => x[1].toUpperCase())
                    styleObj[camelKey] = val
                  }
                }
              })
              parsedStyle = styleObj as React.CSSProperties
            } else if (style) {
              parsedStyle = { ...style }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const extraProps = props as Record<string, any>
            const font = extraProps['data-font']
            const size = extraProps['data-size']
            const color = extraProps['data-color']

            if (font === 'cairo') parsedStyle.fontFamily = 'Cairo, var(--font-cairo), sans-serif'
            else if (font === 'outfit') parsedStyle.fontFamily = 'Outfit, var(--font-outfit), sans-serif'
            else if (font === 'rubik') parsedStyle.fontFamily = 'Rubik, var(--font-rubik), sans-serif'
            else if (font === 'noto') parsedStyle.fontFamily = 'Noto_Sans_Arabic, var(--font-noto-arabic), sans-serif'
            else if (font === 'rock-salt') parsedStyle.fontFamily = 'Rock_Salt, var(--font-rock-salt), cursive'
            else if (font === 'mono') parsedStyle.fontFamily = 'Roboto_Mono, var(--font-geist-mono), monospace'

            if (size === 'sm') parsedStyle.fontSize = '12px'
            else if (size === 'md') parsedStyle.fontSize = '20px'
            else if (size === 'lg') parsedStyle.fontSize = '24px'
            else if (size === 'xl') parsedStyle.fontSize = '32px'

            if (color === 'violet') parsedStyle.color = '#c084fc'
            else if (color === 'fuchsia') parsedStyle.color = '#f472b6'
            else if (color === 'blue') parsedStyle.color = '#60a5fa'
            else if (color === 'emerald') parsedStyle.color = '#34d399'
            else if (color === 'gold') parsedStyle.color = '#fbbf24'
            else if (color === 'red') parsedStyle.color = '#f87171'
            else if (color && String(color).startsWith('#')) parsedStyle.color = String(color)

            return (
              <span className={className} style={parsedStyle}>
                {children}
              </span>
            )
          },
          div: ({ children, style, className, ...props }) => {
            let parsedStyle: React.CSSProperties = {}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const styleProp = style as any
            if (typeof styleProp === 'string') {
              const styleObj: Record<string, string> = {}
              styleProp.split(';').forEach((rule: string) => {
                const parts = rule.split(':')
                if (parts.length >= 2) {
                  const key = parts[0].trim()
                  const val = parts.slice(1).join(':').trim()
                  if (key && val) {
                    const camelKey = key.replace(/-./g, (x: string) => x[1].toUpperCase())
                    styleObj[camelKey] = val
                  }
                }
              })
              parsedStyle = styleObj as React.CSSProperties
            } else if (style) {
              parsedStyle = { ...style }
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const extraProps = props as Record<string, any>
            const dir = extraProps['dir'] || undefined

            return (
              <div className={className} style={parsedStyle} dir={dir}>
                {children}
              </div>
            )
          },
          u: ({ children }) => {
            return <u className="underline decoration-violet-500/40 underline-offset-4">{children}</u>
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
