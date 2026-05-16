// [PERF] Optimized: removed framer-motion — replaced with CSS animations
// Infinite animations (shimmer, spark float, pulse) now run via CSS @keyframes instead of JS
"use client"

import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SparkProgressBarProps {
  progress: number
  className?: string
  color?: string
  showSparks?: boolean
}

export default function SparkProgressBar({
  progress,
  className,
  color = "#0066cc",
  showSparks = true,
}: SparkProgressBarProps) {
  const sparkPositions = [20, 40, 60, 80]

  return (
    <div className={cn("relative w-full h-3 bg-muted rounded-full overflow-hidden", className)}>
      {/* Background glow */}
      <div className="absolute inset-0 rounded-full opacity-30 blur-sm" style={{ backgroundColor: color }} />

      {/* Progress bar — CSS transition instead of framer-motion animate */}
      <div
        className="h-full rounded-full relative overflow-hidden transition-[width] duration-700 ease-out"
        style={{ backgroundColor: color, width: `${progress}%` }}
      >
        {/* Shimmer effect — pure CSS animation */}
        <div
          className="absolute inset-0 animate-spark-shimmer"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
            backgroundSize: '200% 100%',
          }}
        />
      </div>

      {/* Floating sparks — CSS animation */}
      {showSparks &&
        sparkPositions.map(
          (position, index) =>
            progress >= position && (
              <div
                key={index}
                className="absolute top-1/2 -translate-y-1/2 animate-spark-float"
                style={{
                  left: `${position}%`,
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
              </div>
            ),
        )}

      {/* Progress indicator — CSS transition + pulse */}
      <div
        className="absolute top-1/2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-500 ease-out"
        style={{
          left: `${progress}%`,
          backgroundColor: color,
          transform: `translateX(-50%) translateY(-50%)`,
        }}
      >
        <div
          className="absolute inset-0 rounded-full animate-spark-pulse"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  )
}
