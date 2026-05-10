"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"
import { useColorTheme, ColorTheme } from "@/components/color-theme-provider"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const colorThemes: { name: ColorTheme; color: string }[] = [
  { name: "default", color: "hsl(0, 0%, 50%)" },
  { name: "mint", color: "hsl(158, 64%, 52%)" },
  { name: "volcano", color: "hsl(14, 100%, 57%)" },
  { name: "nightowl", color: "hsl(207, 90%, 54%)" },
  { name: "skyblue", color: "hsl(199, 89%, 48%)" },
  { name: "sunset", color: "hsl(340, 82%, 52%)" },
  { name: "forest", color: "hsl(142, 76%, 36%)" },
  { name: "ocean", color: "hsl(212, 100%, 48%)" },
  { name: "lavender", color: "hsl(262, 83%, 58%)" },
  { name: "rose", color: "hsl(330, 81%, 60%)" },
  { name: "amber", color: "hsl(32, 95%, 44%)" },
  { name: "crimson", color: "hsl(348, 83%, 47%)" },
  { name: "indigo", color: "hsl(239, 84%, 67%)" },
  { name: "emerald", color: "hsl(158, 64%, 52%)" },
  { name: "coral", color: "hsl(16, 100%, 66%)" },
]

export function ThemeSwitcher() {
  const [mounted, setMounted] = React.useState(false)
  const { setTheme } = useTheme()
  const { colorTheme, setColorTheme } = useColorTheme()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative shrink-0 text-foreground/70">
        <Palette className="w-5 h-5 transition-all" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative shrink-0 text-foreground/70 hover: hover:bg-muted">
          <Palette className="w-5 h-5 transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" /> Light Mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" /> Dark Mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <span className="mr-2 h-4 w-4 flex justify-center items-center">💻</span> System
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="grid grid-cols-5 gap-2 p-2 justify-items-center">
          {colorThemes.map((t) => (
            <button
              key={t.name}
              onClick={() => setColorTheme(t.name)}
              className={`w-6 h-6 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-offset-2 ${colorTheme === t.name ? "ring-2 ring-primary ring-offset-2" : ""}`}
              style={{ backgroundColor: t.color }}
              title={t.name}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
