"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { getStudentSession } from "@/lib/auth"
import { toast } from "sonner"

export type ColorTheme = 
  | "default"
  | "volcano" 
  | "nightowl" 
  | "skyblue" 
  | "sunset" 
  | "forest" 
  | "ocean" 
  | "lavender" 
  | "rose" 
  | "amber" 
  | "mint" 
  | "crimson" 
  | "indigo"
  | "emerald"
  | "coral"
  | "diamond"
  | "luxury"
  | "cyberpunk"
  | "matrix"
  | "nebula"
  | "glacier"

type ColorThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: ColorTheme
  storageKey?: string
}

type ColorThemeProviderState = {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
}

const initialState: ColorThemeProviderState = {
  colorTheme: "default",
  setColorTheme: () => null,
}

const ColorThemeProviderContext = createContext<ColorThemeProviderState>(initialState)

const PREMIUM_THEMES: ColorTheme[] = ["diamond", "luxury", "cyberpunk", "matrix", "nebula", "glacier"]

export function ColorThemeProvider({
  children,
  defaultTheme = "default",
  storageKey = "chameleon-color-theme",
  ...props
}: ColorThemeProviderProps) {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(defaultTheme)

  useEffect(() => {
    const validateAndSetTheme = async () => {
      const stored = localStorage.getItem(storageKey) as ColorTheme
      if (stored) {
        setColorTheme(stored)
      }
    }
    validateAndSetTheme()
  }, [storageKey])

  useEffect(() => {
    const root = window.document.documentElement
    
    // Remove all theme classes
    root.classList.remove(
      "theme-volcano",
      "theme-nightowl",
      "theme-skyblue",
      "theme-sunset",
      "theme-forest",
      "theme-ocean",
      "theme-lavender",
      "theme-rose",
      "theme-amber",
      "theme-mint",
      "theme-crimson",
      "theme-indigo",
      "theme-emerald",
      "theme-coral",
      "theme-diamond",
      "theme-luxury",
      "theme-cyberpunk",
      "theme-matrix",
      "theme-nebula",
      "theme-glacier"
    )

    // Add new theme class if not default
    if (colorTheme !== "default") {
      root.classList.add(`theme-${colorTheme}`)
    }
  }, [colorTheme])

  const value = {
    colorTheme,
    setColorTheme: (theme: ColorTheme) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, theme)
      }
      setColorTheme(theme)
    },
  }

  return (
    <ColorThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ColorThemeProviderContext.Provider>
  )
}

export const useColorTheme = () => {
  const context = useContext(ColorThemeProviderContext)

  if (context === undefined)
    throw new Error("useColorTheme must be used within a ColorThemeProvider")

  return context
}

