import { 
  Award, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  Palette, 
  Shield, 
  Star, 
  Sun, 
  Flame, 
  Flower2, 
  Orbit, 
  Terminal, 
  MousePointer, 
  Trophy 
} from "lucide-react"

export interface StoreCatalogItem {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  icon: any
  color: string
  shadow: string
  category: "badge" | "theme" | "border" | "cursor"
  isNew?: boolean
}

export const STORE_ITEMS: StoreCatalogItem[] = [
  { 
    id: "badge-quiz-master", 
    name: "Quiz Master", 
    description: "The ultimate mark of a knowledge seeker. Shows everyone you've mastered your field.",
    price: 500, 
    icon: Award, 
    color: "from-yellow-400 to-orange-500",
    shadow: "shadow-yellow-500/20",
    category: "badge"
  },
  { 
    id: "badge-speed-demon", 
    name: "Speed Demon", 
    description: "For those who solve complex problems in the blink of an eye. Lightning fast response.",
    price: 300, 
    icon: Zap, 
    color: "from-blue-400 to-cyan-500",
    shadow: "shadow-blue-500/20",
    category: "badge"
  },
  { 
    id: "badge-pro-solver", 
    name: "Pro Solver", 
    description: "A prestigious title for the most consistent and accurate students in the academy.",
    price: 1000, 
    icon: ShieldCheck, 
    color: "from-purple-500 to-pink-500",
    shadow: "shadow-purple-500/20",
    category: "badge"
  },
  { 
    id: "theme-diamond", 
    name: "Diamond Theme", 
    description: "Shine like a diamond with this premium cyber-cyan and silver metallic theme.",
    price: 1500, 
    icon: Sparkles, 
    color: "from-cyan-300 via-sky-400 to-blue-500",
    shadow: "shadow-cyan-500/20",
    category: "theme"
  },
  { 
    id: "theme-luxury", 
    name: "Luxury Velvet Theme", 
    description: "A premium velvet royal purple background combined with glowing gold accents. Pure luxury.",
    price: 1500, 
    icon: Palette, 
    color: "from-amber-400 via-yellow-500 to-purple-600",
    shadow: "shadow-yellow-500/20",
    category: "theme"
  },
  { 
    id: "theme-cyberpunk", 
    name: "Cyberpunk Theme", 
    description: "Vibrant synthwave aesthetic with hot magenta and neon cyber-cyan glowing highlights.",
    price: 1500, 
    icon: Zap, 
    color: "from-pink-500 via-purple-600 to-cyan-400",
    shadow: "shadow-pink-500/20",
    category: "theme"
  },
  { 
    id: "theme-matrix", 
    name: "Matrix Theme", 
    description: "Deep digital green code style. Unlocks a dark hacking environment grid vibe.",
    price: 3000, 
    icon: Shield, 
    color: "from-green-600 via-emerald-700 to-green-400",
    shadow: "shadow-green-500/20",
    category: "theme"
  },
  { 
    id: "theme-nebula", 
    name: "Nebula Theme", 
    description: "Vivid cosmic dust cloud style combining deep space violet with bright sun flare orange accents.",
    price: 1500, 
    icon: Sparkles, 
    color: "from-indigo-600 via-purple-600 to-orange-500",
    shadow: "shadow-purple-500/20",
    category: "theme"
  },
  { 
    id: "theme-glacier", 
    name: "Glacier Theme", 
    description: "Arctic cold frost aesthetics combining glacial light blues and glowing ice white lines.",
    price: 3000, 
    icon: Star, 
    color: "from-blue-300 via-sky-400 to-teal-200",
    shadow: "shadow-blue-500/20",
    category: "theme"
  },
  { 
    id: "theme-solaris", 
    name: "Solaris Supernova", 
    description: "Harness the blinding power of a dying star. Incandescent solar flares, liquid gold plasma & radiant crimson embers.",
    price: 10000, 
    icon: Sun, 
    color: "from-amber-400 via-orange-500 via-rose-600 to-yellow-300",
    shadow: "shadow-amber-500/30 border-amber-500/40",
    category: "theme",
    isNew: true
  },
  // Animated Avatar Borders
  { 
    id: "border-gold-glow", 
    name: "Gold Glow Border", 
    description: "Wrap your avatar in a premium rotating golden aura. Exquisite craftsmanship.",
    price: 600, 
    originalPrice: 800,
    icon: Award, 
    color: "from-amber-400 to-yellow-500",
    shadow: "shadow-amber-500/20",
    category: "border",
    isNew: true
  },
  { 
    id: "border-cosmic-aurora", 
    name: "Cosmic Aurora Border", 
    description: "A waving, ethereal gradient of emerald green, deep cyan, and violet purple with a soft aurora glow.",
    price: 900, 
    originalPrice: 1200,
    icon: Palette, 
    color: "from-emerald-400 via-cyan-500 to-indigo-600",
    shadow: "shadow-emerald-500/20",
    category: "border",
    isNew: true
  },
  { 
    id: "border-neon-glitch", 
    name: "Cyber Neon Border", 
    description: "Cyberpunk glitching dual shadow effect. Stand out in the hacker workspace.",
    price: 750, 
    originalPrice: 1000,
    icon: Zap, 
    color: "from-cyan-400 via-indigo-500 to-fuchsia-500",
    shadow: "shadow-cyan-500/20",
    category: "border",
    isNew: true
  },
  { 
    id: "border-infernal-flame", 
    name: "Infernal Flame Border", 
    description: "Blazing halo of molten fire with dual reverse-spinning auras and radiant thermal flickers.",
    price: 900, 
    originalPrice: 1200,
    icon: Flame, 
    color: "from-red-500 via-orange-500 to-amber-400",
    shadow: "shadow-orange-500/30",
    category: "border",
    isNew: true
  },
  { 
    id: "border-sakura-bloom", 
    name: "Sakura Blossom Border", 
    description: "Gentle orbital halo of pastel cherry blossoms with harmonic breathing luminescence.",
    price: 750, 
    originalPrice: 1000,
    icon: Flower2, 
    color: "from-rose-400 via-pink-500 to-fuchsia-400",
    shadow: "shadow-pink-500/30",
    category: "border",
    isNew: true
  },
  { 
    id: "border-arcane-portal", 
    name: "Arcane Void Portal", 
    description: "Gravitational event horizon vortex with counter-rotating deep space accretion rings.",
    price: 1050, 
    originalPrice: 1400,
    icon: Orbit, 
    color: "from-violet-600 via-purple-500 to-cyan-400",
    shadow: "shadow-purple-500/30",
    category: "border",
    isNew: true
  },
  { 
    id: "border-electric-storm", 
    name: "Electric Storm Border", 
    description: "High-voltage plasma aura with rapid lightning strobe discharges and cyan ionized glow.",
    price: 825, 
    originalPrice: 1100,
    icon: Zap, 
    color: "from-sky-400 via-cyan-400 to-blue-600",
    shadow: "shadow-cyan-500/30",
    category: "border",
    isNew: true
  },
  // Interactive Cursors
  { 
    id: "cursor-sparkles", 
    name: "Cosmic Sparkles Cursor", 
    description: "Leaves a tail of glowing star dust particles that fade away beautifully.",
    price: 450, 
    originalPrice: 600,
    icon: Sparkles, 
    color: "from-blue-400 to-purple-500",
    shadow: "shadow-blue-500/20",
    category: "cursor",
    isNew: true
  },
  { 
    id: "cursor-cyber-cross", 
    name: "Cyber Cross Cursor", 
    description: "A cool futuristic crosshair cursor that follows your movement with precision.",
    price: 600, 
    originalPrice: 800,
    icon: ShieldCheck, 
    color: "from-green-400 to-emerald-600",
    shadow: "shadow-green-500/20",
    category: "cursor",
    isNew: true
  },
  { 
    id: "cursor-bubbles", 
    name: "Bouncing Bubbles Cursor", 
    description: "Generate floating bubbles behind your cursor that drift and pop dynamically.",
    price: 750, 
    originalPrice: 1000,
    icon: Star, 
    color: "from-cyan-300 via-sky-400 to-blue-500",
    shadow: "shadow-cyan-500/20",
    category: "cursor",
    isNew: true
  },
  { 
    id: "cursor-inferno", 
    name: "Infernal Embers Trail", 
    description: "Leaves a trail of drifting molten embers and rising fire sparks behind your cursor.",
    price: 600, 
    originalPrice: 800,
    icon: Flame, 
    color: "from-orange-500 via-red-500 to-amber-400",
    shadow: "shadow-orange-500/30",
    category: "cursor",
    isNew: true
  },
  { 
    id: "cursor-sakura", 
    name: "Sakura Drift Trail", 
    description: "Gracefully floats spinning cherry blossom petals that drift with cursor momentum.",
    price: 525, 
    originalPrice: 700,
    icon: Flower2, 
    color: "from-pink-400 via-rose-400 to-pink-300",
    shadow: "shadow-pink-500/30",
    category: "cursor",
    isNew: true
  },
  { 
    id: "cursor-lightning", 
    name: "Electric Arc Trail", 
    description: "Generates high-voltage crackling plasma arcs and ionized electric discharge bolts.",
    price: 650, 
    originalPrice: 850,
    icon: Zap, 
    color: "from-cyan-400 via-sky-400 to-blue-500",
    shadow: "shadow-cyan-500/30",
    category: "cursor",
    isNew: true
  },
  { 
    id: "cursor-matrix", 
    name: "Quantum Matrix Trail", 
    description: "Streams glowing green digital mainframe code glyphs that cascade in real time.",
    price: 550, 
    originalPrice: 750,
    icon: Terminal, 
    color: "from-emerald-400 via-green-500 to-teal-400",
    shadow: "shadow-emerald-500/30",
    category: "cursor",
    isNew: true
  },
]

export function getInventoryItemMeta(rawItem: any) {
  if (!rawItem) {
    return { name: "Achievement", color: "text-muted-foreground bg-muted", icon: Trophy }
  }

  const cleanId = typeof rawItem === "string" ? rawItem.trim() : String(rawItem?.id || "").trim()
  if (!cleanId) {
    return { name: "Achievement", color: "text-muted-foreground bg-muted", icon: Trophy }
  }

  // 1. Direct or case-insensitive match against STORE_ITEMS
  const found = STORE_ITEMS.find(
    (s) => s.id === cleanId || s.id.toLowerCase() === cleanId.toLowerCase()
  )

  if (found) {
    let badgeColor = "text-primary bg-primary/10"
    if (found.color.includes("amber") || found.color.includes("yellow")) {
      badgeColor = "text-amber-500 bg-amber-500/10"
    } else if (found.color.includes("blue") || found.color.includes("sky")) {
      badgeColor = "text-blue-500 bg-blue-500/10"
    } else if (found.color.includes("cyan")) {
      badgeColor = "text-cyan-500 bg-cyan-500/10"
    } else if (found.color.includes("purple") || found.color.includes("violet") || found.color.includes("indigo")) {
      badgeColor = "text-purple-500 bg-purple-500/10"
    } else if (found.color.includes("pink") || found.color.includes("rose") || found.color.includes("fuchsia")) {
      badgeColor = "text-pink-500 bg-pink-500/10"
    } else if (found.color.includes("green") || found.color.includes("emerald") || found.color.includes("teal")) {
      badgeColor = "text-emerald-500 bg-emerald-500/10"
    } else if (found.color.includes("red") || found.color.includes("orange")) {
      badgeColor = "text-orange-500 bg-orange-500/10"
    }

    return {
      name: found.name,
      color: badgeColor,
      icon: found.icon || Trophy
    }
  }

  // 2. Fallbacks for borders
  if (cleanId.startsWith("border-")) {
    const title = cleanId
      .replace(/^border-/, "")
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") + " Border"
    return { name: title, color: "text-purple-400 bg-purple-500/10", icon: Award }
  }

  // 3. Fallbacks for cursors
  if (cleanId.startsWith("cursor-")) {
    const title = cleanId
      .replace(/^cursor-/, "")
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") + " Trail"
    return { name: title, color: "text-cyan-400 bg-cyan-500/10", icon: Sparkles }
  }

  // 4. Fallbacks for themes
  if (cleanId.startsWith("theme-")) {
    const title = cleanId
      .replace(/^theme-/, "")
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") + " Theme"
    return { name: title, color: "text-amber-400 bg-amber-500/10", icon: Palette }
  }

  // 5. Fallbacks for badges
  if (cleanId.startsWith("badge-")) {
    const title = cleanId
      .replace(/^badge-/, "")
      .split("-")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    return { name: title, color: "text-yellow-500 bg-yellow-500/10", icon: Award }
  }

  return { name: "Achievement", color: "text-muted-foreground bg-muted", icon: Trophy }
}
