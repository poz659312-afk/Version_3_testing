// [PERF] Optimized: replaced framer-motion with IntersectionObserver + CSS animations
// Saves ~45kB of JS per chunk that imported this component
"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface ScrollAnimatedSectionProps {
  children: ReactNode
  className?: string
  id?: string
  style?: React.CSSProperties
  animation?:
    | "fadeIn"
    | "slideUp"
    | "slideDown"
    | "slideInFromLeft"
    | "slideInFromRight"
    | "slideInFromBottom"
    | "scaleIn"
    | "rotateIn"
  delay?: number
  duration?: number
}

const animationClassMap: Record<string, string> = {
  fadeIn: "scroll-anim-fade-in",
  slideUp: "scroll-anim-slide-up",
  slideDown: "scroll-anim-slide-down",
  slideInFromLeft: "scroll-anim-slide-left",
  slideInFromRight: "scroll-anim-slide-right",
  slideInFromBottom: "scroll-anim-slide-bottom",
  scaleIn: "scroll-anim-scale-in",
  rotateIn: "scroll-anim-rotate-in",
}

export default function ScrollAnimatedSection({
  children,
  className = "",
  id,
  style,
  animation = "fadeIn",
  delay = 0,
  duration = 0.8,
}: ScrollAnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el) // once: true equivalent
        }
      },
      { rootMargin: "-100px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const animClass = animationClassMap[animation] || "scroll-anim-fade-in"

  return (
    <div
      ref={ref}
      className={`${animClass} ${isVisible ? "scroll-anim-visible" : ""} ${className}`}
      id={id}
      style={{
        ...style,
        transitionDelay: `${delay}s`,
        transitionDuration: `${duration}s`,
      }}
    >
      {children}
    </div>
  )
}
