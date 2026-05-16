// [PERF] Optimized: removed framer-motion — replaced with CSS keyframe animations
"use client"

import { Pacifico } from "next/font/google"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
  display: "swap",
})

export default function HeroGeometric({
  badge = "Chameleon FCDS",
  title1 = "Master Your",
  title2 = "Future Skills",
}: {
  badge?: string
  title1?: string
  title2?: string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-white/80 dark:bg-black/60 pointer-events-none transition-colors duration-300" />

      {/* Background gradient */}
      <div className="absolute opacity-40" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.3) 0%, rgba(0, 0, 0, 0) 70%)',
      }} />

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12 transition-all duration-700 ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="rounded-full bg-primary flex items-center justify-center">
              <Image 
                src="/images/chameleon.png" 
                alt="Chameleon Logo" 
                width={20} 
                height={20}
                priority
                loading="eager"
                className="object-cover rounded-full"
              />
            </div>
            <span className="text-sm text-muted-foreground tracking-wide">{badge}</span>
          </div>

          <div
            className={`transition-all duration-700 ease-out delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h1 className="text-[65px] md:text-[120px] font-bold mb-6 md:mb-8 tracking-tight leading-tight" >
              <span style={{ WebkitTextStroke: '1.2px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000 dark:border-white/10 border-black/10">{title1}</span>
              <br />
              <span className={cn(
                "text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]",
                pacifico.className,
              )}>
                {title2}
              </span>
            </h1>
          </div>

          <div
            className={`transition-all duration-700 ease-out delay-200 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              Transforming ideas into vibrant digital experiences, adapting seamlessly like a chameleon to every challenge and vision.
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />
    </div>
  )
}
