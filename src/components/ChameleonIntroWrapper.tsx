"use client"

import React, { useEffect, useState, useCallback, useRef } from "react"
import { Pacifico } from "next/font/google"
import { Sparkles } from "lucide-react"

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
  display: "swap",
})

interface ChameleonIntroWrapperProps {
  children: React.ReactNode
}

/**
 * ChameleonIntroWrapper
 * Standalone Next.js ('use client') component.
 *
 * Slower, Luxurious Hardware-Accelerated Calligraphy Intro:
 * 1. SLOWER & DELIBERATE:
 *    - Handwriting stroke gracefully drawn over ~2.4s.
 *    - Calligraphy flourish underline smoothly sweeping over ~1.2s.
 *    - Luminous ink flooding in over ~0.6s with a brief pause to appreciate the signature.
 * 2. ZERO STUTTER / ZERO HEAVY LOAD:
 *    - GPU Compositor CSS keyframes with will-change isolation.
 *    - Background page content rendering deferred via content-visibility.
 *    - WebGL shader compilation in HeroGeometric held until curtain lift (3.2s).
 * 3. DYNAMIC THEME COLOR:
 *    - Inherits active theme colors (--primary, --secondary, --accent) automatically.
 * 4. Fast skip available instantly via click or keyboard key (Escape / Space / Enter).
 */
export default function ChameleonIntroWrapper({ children }: ChameleonIntroWrapperProps) {
  const [isReady, setIsReady] = useState(false)
  const [isContentReady, setIsContentReady] = useState(false)
  const [isLifting, setIsLifting] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const contentTimerRef = useRef<NodeJS.Timeout | null>(null)
  const finishTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fast skip helper
  const handleFastSkip = useCallback(() => {
    if (isDismissed) return
    setIsContentReady(true)
    setIsLifting(true)
    if (contentTimerRef.current) clearTimeout(contentTimerRef.current)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current)

    finishTimerRef.current = setTimeout(() => {
      setIsDismissed(true)
      document.body.style.overflow = ""
    }, 550)
  }, [isDismissed])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Lock body scroll briefly for the intro
    document.body.style.overflow = "hidden"

    // Skip on Escape / Enter / Space
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === " " || e.key === "Enter") {
        handleFastSkip()
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    // Verify font is ready before starting CSS stroke animation to prevent reflow stutter
    const fontCheck = document.fonts ? document.fonts.ready : Promise.resolve()
    fontCheck.then(() => {
      setIsReady(true)

      // Timeline sequence:
      // 0.0s - 0.4s: "Welcome to" badge entrance
      // 0.15s - 2.45s: Cursive handwriting draw (~2.3s)
      // 1.25s - 2.35s: Flourish underline swooshes underneath (~1.1s)
      // 2.2s - 2.8s: Luminous gradient ink floods into letters (~0.6s)
      // 2.5s: Handwriting stroke complete -> unhide homepage content in background to warm up WebGL
      // 2.8s - 3.1s: Elegant hold to appreciate the glowing signature (~0.3s)
      // 3.1s - 3.8s: Smooth luxury curtain lift revealing Hero section (~0.7s)
      // 3.85s: Intro complete, scroll unlocked
      contentTimerRef.current = setTimeout(() => {
        setIsContentReady(true)
      }, 2500)

      timerRef.current = setTimeout(() => {
        setIsLifting(true)
      }, 3100)

      finishTimerRef.current = setTimeout(() => {
        setIsDismissed(true)
        document.body.style.overflow = ""
      }, 3850)
    })

    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current)
    }
  }, [handleFastSkip])

  return (
    <div className={`chameleon-intro-wrapper relative w-full overflow-x-hidden ${pacifico.variable}`}>
      {/* Hardware-Accelerated CSS Keyframes running on the browser compositor */}
      <style jsx global>{`
        /* Hide scrollbars completely while keeping full scrolling */
        html, body {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        @keyframes strokeDrawChameleonSlow {
          0% {
            stroke-dashoffset: 3200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes flourishDrawChameleonSlow {
          0% {
            stroke-dashoffset: 1400;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes inkFillChameleonSlow {
          0% {
            fill-opacity: 0;
          }
          100% {
            fill-opacity: 1;
          }
        }
        @keyframes welcomeFadeIn {
          0% {
            opacity: 0;
            transform: translateY(14px);
            letter-spacing: 0.22em;
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: 0.38em;
          }
        }
      `}</style>

      {/* =====================================================================
          CINEMATIC ON-LOAD OVERLAY (DYNAMIC THEME + COMPOSITOR ISOLATION):
          ===================================================================== */}
      {!isDismissed && (
        <div
          onClick={handleFastSkip}
          className="fixed inset-0 w-full h-[100dvh] z-[150] overflow-hidden select-none bg-background dark:bg-[#06070b] text-foreground flex flex-col items-center justify-center cursor-pointer rounded-b-[2rem] sm:rounded-b-[3rem] shadow-2xl border-b border-border/40"
          style={{
            height: "100dvh",
            transform: isLifting ? "translateY(-100%)" : "translateY(0%)",
            transition: "transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)",
            willChange: "transform",
          }}
        >
          {/* Static, High-Performance GPU Ambient Lighting Aura */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 48%, color-mix(in srgb, var(--primary) 18%, transparent) 0%, color-mix(in srgb, var(--secondary, var(--primary)) 8%, transparent) 40%, transparent 70%)",
            }}
          />

          {/* Central Typography Showcase */}
          <div
            className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-8 w-full max-w-6xl text-center pointer-events-none"
            style={{
              opacity: isLifting ? 0 : 1,
              transform: isLifting ? "translateY(-22px) scale(1.02)" : "translateY(0) scale(1)",
              transition: "opacity 0.4s ease-in, transform 0.4s ease-in",
            }}
          >
            {/* "WELCOME TO" Minimalist Theme-Glow Badge */}
            <div
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs sm:text-sm md:text-base font-mono uppercase tracking-[0.38em] mb-4 sm:mb-8 shadow-sm"
              style={{
                boxShadow: "0 0 20px -6px var(--primary)",
                animation: isReady ? "welcomeFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
                opacity: isReady ? 1 : 0,
              }}
            >
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span>Welcome to</span>
            </div>

            {/* Large Scale SVG Canvas for Calligraphy Handwriting "Chameleon" */}
            <div className="w-full max-w-5xl px-2 sm:px-6 relative flex items-center justify-center">
              {/* Static Hardware-Accelerated Luminous Glow Behind Signature */}
              <div
                className="absolute w-[500px] h-[160px] rounded-full pointer-events-none opacity-20 dark:opacity-30"
                style={{
                  background: "radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%)",
                  transform: "translateZ(0)",
                }}
              />

              <svg
                viewBox="0 0 1200 360"
                className="w-full h-auto overflow-visible select-none"
              >
                <defs>
                  {/* Dynamic Gradient using User's Active Theme CSS Variables */}
                  <linearGradient id="chameleon-theme-dynamic-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="50%" stopColor="var(--secondary, var(--primary))" />
                    <stop offset="100%" stopColor="var(--accent, var(--primary))" />
                  </linearGradient>
                </defs>

                {/* Main Cursive Handwriting Stroke & Smooth Ink Flood (Zero duplicate overhead) */}
                <text
                  x="600"
                  y="175"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: "var(--font-pacifico), 'Brush Script MT', cursive",
                    fontSize: "205px",
                    fontWeight: "400",
                    fill: "url(#chameleon-theme-dynamic-grad)",
                    fillOpacity: 0,
                    stroke: "url(#chameleon-theme-dynamic-grad)",
                    strokeWidth: 4.5,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeDasharray: 3200,
                    strokeDashoffset: 3200,
                    willChange: "stroke-dashoffset, fill-opacity",
                    transform: "translateZ(0)",
                    animation: isReady
                      ? "strokeDrawChameleonSlow 2.3s cubic-bezier(0.35, 0.1, 0.25, 1) 0.15s forwards, inkFillChameleonSlow 0.6s ease-out 2.2s forwards"
                      : "none",
                  }}
                >
                  Chameleon
                </text>

                {/* Signature Cursive Flourish Underline */}
                <path
                  d="M 180 270 C 350 310, 820 235, 1000 275 S 1100 290, 1060 255"
                  fill="none"
                  stroke="url(#chameleon-theme-dynamic-grad)"
                  strokeWidth="4.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: 1400,
                    strokeDashoffset: 1400,
                    willChange: "stroke-dashoffset",
                    transform: "translateZ(0)",
                    animation: isReady
                      ? "flourishDrawChameleonSlow 1.1s cubic-bezier(0.35, 0.1, 0.25, 1) 1.25s forwards"
                      : "none",
                  }}
                />
              </svg>
            </div>
          </div>

          {/* Minimalist skip hint */}
          <div
            className="absolute bottom-6 text-[10px] sm:text-xs font-mono tracking-widest text-muted-foreground/60 uppercase pointer-events-none"
            style={{
              opacity: isLifting ? 0 : 1,
              transition: "opacity 0.25s ease",
            }}
          >
            Click anywhere to skip
          </div>
        </div>
      )}

      {/* =====================================================================
          HOMEPAGE CONTENT:
          Deferred via contentVisibility during intro to free 100% CPU/GPU for weak devices.
          ===================================================================== */}
      <div
        className="chameleon-page-content relative w-full"
        style={{
          contentVisibility: isContentReady || isDismissed ? "visible" : "hidden",
        }}
      >
        {children}
      </div>
    </div>
  )
}
