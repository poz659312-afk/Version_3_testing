"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface AvatarBorderProps {
  children: React.ReactNode
  borderId?: string | null
  isAdmin?: boolean
  className?: string
}

export default function AvatarBorder({
  children,
  borderId: propBorderId,
  isAdmin = false,
  className
}: AvatarBorderProps) {
  const [activeBorder, setActiveBorder] = useState<string | null>(null)
  const [isPowerSave, setIsPowerSave] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  const syncSettings = () => {
    if (typeof window === "undefined") return

    // 0. Detect mobile/touch device
    const mobile = window.matchMedia("(max-width: 768px)").matches || window.matchMedia("(pointer: coarse)").matches
    setIsMobile(mobile)

    // 1. Read performance mode
    const perfMode = localStorage.getItem("chameleon_perf_mode")
    setIsPowerSave(perfMode === "power-save")

    // 2. Read equipped border if not explicitly provided as a prop
    if (propBorderId === undefined) {
      const equipped = localStorage.getItem("chameleon-equipped-border")
      setActiveBorder(equipped)
    } else {
      setActiveBorder(propBorderId)
    }
  }

  useEffect(() => {
    setIsMounted(true)
    syncSettings()

    // Inject styles once in head if not already present
    if (typeof document !== "undefined" && !document.getElementById("chameleon-border-styles")) {
      const styleEl = document.createElement("style")
      styleEl.id = "chameleon-border-styles"
      styleEl.innerHTML = BORDER_STYLES
      document.head.appendChild(styleEl)
    }

    window.addEventListener("chameleon_visual_settings_changed", syncSettings)
    window.addEventListener("storage", syncSettings)

    return () => {
      window.removeEventListener("chameleon_visual_settings_changed", syncSettings)
      window.removeEventListener("storage", syncSettings)
    }
  }, [propBorderId])

  // Don't render borders on server side to avoid hydration mismatch
  if (!isMounted) {
    return <div className={cn("relative rounded-full overflow-hidden", className)}>{children}</div>
  }

  // Admin border is a fallback if user is admin and no other custom border is equipped
  const borderToRender = activeBorder || (isAdmin ? "admin-border" : null)

  if (!borderToRender) {
    return <div className={cn("relative rounded-full overflow-hidden", className)}>{children}</div>
  }

  // On mobile or power-save, use static zero-overhead hardware rendering without continuous repaints
  const isStaticMode = isPowerSave || isMobile

  return (
    <div className={cn("relative p-[3px] rounded-full inline-block", className)}>
      {/* Gold Glow border effect */}
      {borderToRender === "border-gold-glow" && (
        <div 
          className={cn(
            "absolute -inset-[3px] rounded-full -z-10",
            isStaticMode ? "" : "animate-[avatar-spin_4s_linear_infinite]"
          )}
          style={{
            background: "conic-gradient(from 0deg, #d97706, #f59e0b, #fbbf24, #fffbeb, #fbbf24, #f59e0b, #d97706)",
            filter: isStaticMode ? "none" : "drop-shadow(0 0 5px rgba(245, 158, 11, 0.75))",
            boxShadow: isStaticMode ? "0 0 8px rgba(245, 158, 11, 0.65)" : undefined,
            willChange: isStaticMode ? "auto" : "transform"
          }}
        />
      )}

      {/* Cosmic Aurora border effect */}
      {borderToRender === "border-cosmic-aurora" && (
        <div 
          className={cn(
            "absolute -inset-[3px] rounded-full -z-10",
            isStaticMode ? "" : "animate-[aurora-wave_6s_ease_infinite,avatar-spin_12s_linear_infinite]"
          )}
          style={{
            background: "linear-gradient(135deg, #10b981, #06b6d4, #6366f1, #10b981)",
            backgroundSize: isStaticMode ? "100% 100%" : "200% 200%",
            filter: isStaticMode ? "none" : "drop-shadow(0 0 6px rgba(6, 182, 212, 0.65))",
            boxShadow: isStaticMode ? "0 0 8px rgba(6, 182, 212, 0.6)" : undefined,
            willChange: isStaticMode ? "auto" : "transform"
          }}
        />
      )}

      {/* Cyber Neon border effect (Glitch style) */}
      {borderToRender === "border-neon-glitch" && (
        <>
          {/* Cyan glitch layer */}
          <div 
            className={cn(
              "absolute -inset-[3px] rounded-full -z-10",
              isStaticMode ? "" : "animate-[neon-glitch-cyan_1.5s_steps(2)_infinite]"
            )}
            style={{
              border: "3px solid #06b6d4",
              filter: isStaticMode ? "none" : "drop-shadow(0 0 3px rgba(6, 182, 212, 0.6))",
              boxShadow: isStaticMode ? "0 0 6px rgba(6, 182, 212, 0.55)" : undefined,
              willChange: isStaticMode ? "auto" : "transform"
            }}
          />
          {/* Magenta glitch layer - omitted on mobile to save composite layer */}
          {!isStaticMode && (
            <div 
              className="absolute -inset-[3px] rounded-full -z-10 animate-[neon-glitch-magenta_1.5s_steps(2)_infinite]"
              style={{
                border: "3px solid #d946ef",
                filter: "drop-shadow(0 0 3px rgba(217, 70, 239, 0.6))",
                willChange: "transform"
              }}
            />
          )}
        </>
      )}

      {/* Infernal Flame border effect */}
      {borderToRender === "border-infernal-flame" && (
        <>
          <div 
            className={cn(
              "absolute -inset-[4px] rounded-full -z-10",
              isStaticMode ? "" : "animate-[flame-flicker_1.5s_ease-in-out_infinite_alternate,avatar-spin_3.5s_linear_infinite]"
            )}
            style={{
              background: "conic-gradient(from 0deg, #dc2626, #ea580c, #f59e0b, #fef08a, #f97316, #dc2626)",
              filter: isStaticMode ? "none" : "drop-shadow(0 0 8px #f97316) drop-shadow(0 0 16px rgba(220, 38, 38, 0.75))",
              boxShadow: isStaticMode ? "0 0 10px rgba(249, 115, 22, 0.65)" : undefined,
              willChange: isStaticMode ? "auto" : "transform"
            }}
          />
          {!isStaticMode && (
            <div 
              className="absolute -inset-[2px] rounded-full -z-10 opacity-75 animate-[avatar-spin-reverse_2s_linear_infinite]"
              style={{
                background: "conic-gradient(from 180deg, rgba(239, 68, 68, 0.6), rgba(245, 158, 11, 0.9), transparent)",
                willChange: "transform"
              }}
            />
          )}
        </>
      )}

      {/* Sakura Bloom border effect */}
      {borderToRender === "border-sakura-bloom" && (
        <div 
          className={cn(
            "absolute -inset-[3.5px] rounded-full -z-10",
            isStaticMode ? "" : "animate-[sakura-pulse_3s_ease-in-out_infinite,avatar-spin_8s_linear_infinite]"
          )}
          style={{
            background: "conic-gradient(from 0deg, #f43f5e, #ec4899, #f472b6, #fbcfe8, #fda4af, #f43f5e)",
            filter: isStaticMode ? "none" : "drop-shadow(0 0 8px rgba(244, 63, 94, 0.7)) drop-shadow(0 0 3px #fbcfe8)",
            boxShadow: isStaticMode ? "0 0 8px rgba(244, 63, 94, 0.6)" : undefined,
            willChange: isStaticMode ? "auto" : "transform"
          }}
        />
      )}

      {/* Arcane Void Portal border effect */}
      {borderToRender === "border-arcane-portal" && (
        <>
          <div 
            className={cn(
              "absolute -inset-[4px] rounded-full -z-10",
              isStaticMode ? "" : "animate-[avatar-spin_2.2s_linear_infinite]"
            )}
            style={{
              background: "conic-gradient(from 0deg, #09090b, #4c1d95, #7c3aed, #a855f7, #38bdf8, #8b5cf6, #09090b)",
              filter: isStaticMode ? "none" : "drop-shadow(0 0 10px rgba(139, 92, 246, 0.9)) drop-shadow(0 0 4px #06b6d4)",
              boxShadow: isStaticMode ? "0 0 10px rgba(139, 92, 246, 0.65)" : undefined,
              willChange: isStaticMode ? "auto" : "transform"
            }}
          />
          {!isStaticMode && (
            <div 
              className="absolute -inset-[2px] rounded-full -z-10 opacity-70 animate-[avatar-spin-reverse_4s_linear_infinite]"
              style={{
                background: "conic-gradient(from 90deg, #38bdf8, transparent, #c084fc, transparent)",
                willChange: "transform"
              }}
            />
          )}
        </>
      )}

      {/* Electric Storm border effect */}
      {borderToRender === "border-electric-storm" && (
        <div 
          className={cn(
            "absolute -inset-[3.5px] rounded-full -z-10",
            isStaticMode ? "" : "animate-[electric-strobe_0.8s_steps(4)_infinite,avatar-spin_5s_linear_infinite]"
          )}
          style={{
            background: "conic-gradient(from 0deg, #0284c7, #00f0ff, #38bdf8, #ffffff, #6366f1, #00f0ff)",
            filter: isStaticMode ? "none" : "drop-shadow(0 0 9px #00f0ff) drop-shadow(0 0 3px #ffffff)",
            boxShadow: isStaticMode ? "0 0 8px rgba(0, 240, 255, 0.6)" : undefined,
            willChange: isStaticMode ? "auto" : "transform"
          }}
        />
      )}

      {/* Standard Admin spin border effect */}
      {borderToRender === "admin-border" && (
        <div 
          className={cn(
            "absolute -inset-[3px] rounded-full -z-10",
            isStaticMode ? "" : "animate-[avatar-spin_3s_linear_infinite]"
          )}
          style={{
            background: "conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #3b82f6, #ef4444)",
            boxShadow: isStaticMode ? "0 0 6px rgba(59, 130, 246, 0.45)" : undefined,
            willChange: isStaticMode ? "auto" : "transform"
          }}
        />
      )}

      {/* Inner Avatar Child Wrapper */}
      <div className="relative rounded-full overflow-hidden bg-background w-full h-full flex items-center justify-center">
        {children}
      </div>
    </div>
  )
}

const BORDER_STYLES = `
  @keyframes avatar-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes avatar-spin-reverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }
  @keyframes avatar-pulse-scale {
    0%, 100% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.05) rotate(180deg); }
  }
  @keyframes aurora-wave {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  @keyframes flame-flicker {
    0% { transform: scale(0.98); filter: brightness(1) drop-shadow(0 0 7px #f97316); }
    50% { transform: scale(1.03); filter: brightness(1.25) drop-shadow(0 0 13px #ef4444); }
    100% { transform: scale(1.01); filter: brightness(1.1) drop-shadow(0 0 10px #f59e0b); }
  }
  @keyframes sakura-pulse {
    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 6px rgba(244, 63, 94, 0.6)); }
    50% { transform: scale(1.04); filter: drop-shadow(0 0 11px rgba(244, 63, 94, 0.9)) drop-shadow(0 0 4px #fbcfe8); }
  }
  @keyframes electric-strobe {
    0% { opacity: 0.85; filter: drop-shadow(0 0 7px #00f0ff); }
    25% { opacity: 1; filter: drop-shadow(0 0 14px #38bdf8) drop-shadow(0 0 4px #ffffff); }
    50% { opacity: 0.9; filter: drop-shadow(0 0 8px #00f0ff); }
    75% { opacity: 1; filter: drop-shadow(0 0 16px #00f0ff) drop-shadow(0 0 6px #ffffff); }
    100% { opacity: 0.85; filter: drop-shadow(0 0 7px #00f0ff); }
  }
  @keyframes neon-glitch-cyan {
    0%, 100% { transform: translate(0, 0); opacity: 0.8; }
    20% { transform: translate(-1.5px, 1px); opacity: 1; }
    40% { transform: translate(1px, -1px); opacity: 0.9; }
    60% { transform: translate(-0.5px, -1.5px); opacity: 0.8; }
    80% { transform: translate(1.5px, 1.5px); opacity: 1; }
  }
  @keyframes neon-glitch-magenta {
    0%, 100% { transform: translate(0, 0); opacity: 0.8; }
    15% { transform: translate(1.5px, -1px); opacity: 1; }
    35% { transform: translate(-1px, 1.5px); opacity: 0.9; }
    55% { transform: translate(0.5px, 0.5px); opacity: 1; }
    75% { transform: translate(-1.5px, -1.5px); opacity: 0.8; }
  }
`
