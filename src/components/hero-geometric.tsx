// [PERF] Optimized: removed framer-motion — replaced with CSS keyframe animations
"use client"

import { Pacifico } from "next/font/google"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useTheme } from "@/components/theme-provider"
import dynamic from "next/dynamic"

const Grainient = dynamic(() => import("./Grainient"), { ssr: false })

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
  children,
}: {
  badge?: string
  title1?: string
  title2?: string
  children?: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const [bgEnabled, setBgEnabled] = useState(true)
  const { theme } = useTheme()
  const [colors, setColors] = useState({ c1: '#FF9FFC', c2: '#5227FF', c3: '#B497CF' })

  useEffect(() => {
    setMounted(true)
    const checkSettings = () => {
      const isEnabled = localStorage.getItem('chameleon_bg_animation') !== 'false'
      const isPowerSave = localStorage.getItem('chameleon_perf_mode') === 'power-save'
      setBgEnabled(isEnabled && !isPowerSave)
    }
    checkSettings()
    window.addEventListener('chameleon_visual_settings_changed', checkSettings)
    window.addEventListener('storage', checkSettings)
    return () => {
      window.removeEventListener('chameleon_visual_settings_changed', checkSettings)
      window.removeEventListener('storage', checkSettings)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const getVar = (v: string) => getComputedStyle(root).getPropertyValue(v).trim();
    setColors({
      c1: getVar('--primary') || '#FF9FFC',
      c2: getVar('--secondary') || '#5227FF',
      c3: getVar('--accent') || '#B497CF', // Accent usually has a better contrasting tint than pure background
    });
  }, [theme, mounted])

  return (
    <div
      className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden pt-32 md:pt-40 pb-10"
    >
      {/* Grainient Interactive Background */}
      {mounted && bgEnabled && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-100">
          <Grainient
            color1={colors.c1}
            color2={colors.c2}
            color3={colors.c3}
            timeSpeed={1.8}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1.2}
            centerX={0}
            centerY={0}
            zoom={0.3}
          />
        </div>
      )}
      
      {/* Fallback/Overlay to ensure text readability if Grainient is too intense */}
      <div className="absolute inset-0 bg-background/20 dark:bg-background/40 pointer-events-none transition-colors duration-300 z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_90%)] pointer-events-none z-0" />

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
              <span className="relative inline-block mt-2 md:mt-4 px-6 md:px-10 py-2 md:py-4">
                {/* Glitchy Highlight Background */}
                <span 
                  className="absolute inset-0 bg-background shadow-2xl -rotate-2"
                  style={{
                    borderRadius: "20px",
                  }}
                />
                <span className={cn(
                  "relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]",
                  pacifico.className,
                )}>
                  {title2}
                </span>
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

        {children && (
          <div
            className={`transition-all duration-1000 ease-out delay-300 w-full mt-12 flex justify-center ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            {children}
          </div>
        )}
      </div>

      <div className="absolute bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" />
    </div>
  )
}
