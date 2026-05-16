// [PERF] Optimized: replaced framer-motion useScroll/useSpring with native scroll listener + CSS
"use client"

import { useEffect, useRef } from "react"

export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          if (barRef.current) {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            const progress = docHeight > 0 ? scrollTop / docHeight : 0
            barRef.current.style.transform = `scaleX(${progress})`
          }
          ticking = false
        })
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      ref={barRef}
      className="fixed top-0 left-0 right-0 h-1 bg-primary z-[100] origin-left transition-transform duration-150 ease-out"
      style={{ transform: "scaleX(0)" }}
    />
  )
}
