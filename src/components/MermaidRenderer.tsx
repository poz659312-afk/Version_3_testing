'use client'

import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'

// Initialize mermaid configurations
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    fontFamily: 'Cairo, var(--font-cairo), sans-serif',
    themeVariables: {
      primaryColor: '#8b5cf6',
      primaryTextColor: '#fff',
      lineColor: '#a78bfa',
      signalColor: '#f472b6',
      signalTextColor: '#fff',
    }
  })
} catch (err) {
  console.error('Failed to initialize mermaid:', err)
}

interface MermaidRendererProps {
  chart: string
}

export default function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    let isMounted = true
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.floor(Math.random() * 1000000)}`
        const cleanChart = chart.trim()
        
        // Render chart SVG
        const { svg: renderedSvg } = await mermaid.render(id, cleanChart)
        
        if (isMounted) {
          setSvg(renderedSvg)
          setError('')
        }
      } catch (err: unknown) {
        console.error('Mermaid render error:', err)
        if (isMounted) {
          setError('Failed to render diagram. Please verify syntax.')
        }
      }
    }

    renderChart()
    return () => {
      isMounted = false
    }
  }, [chart])

  if (error) {
    return (
      <div className="bg-zinc-950 p-4 rounded-xl border border-rose-500/20 text-rose-400 text-xs my-4 select-text">
        <p className="font-bold mb-1">⚠️ Diagram Syntax Error:</p>
        <p className="text-gray-400">{error}</p>
        <pre className="mt-2 text-gray-600 font-mono text-[10px] overflow-x-auto bg-black/40 p-2 rounded border border-white/5">{chart}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="bg-zinc-950/40 p-8 rounded-xl border border-white/5 flex items-center justify-center text-gray-500 text-xs my-4 animate-pulse">
        Rendering diagram...
      </div>
    )
  }

  return (
    <div 
      ref={containerRef} 
      className="my-6 flex justify-center bg-zinc-950/40 p-6 rounded-xl border border-white/10 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  )
}
