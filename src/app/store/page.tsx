"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ShoppingBag, 
  Coins, 
  Star, 
  ShieldCheck, 
  Zap, 
  Award, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  Palette,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getStudentSession } from "@/lib/auth"
import { toast } from "sonner"
import { formatTAName } from "@/lib/ta-utils"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const STORE_ITEMS = [
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
  // New Categories: Borders (25% Discount)
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
    id: "border-rainbow-pulse", 
    name: "Rainbow Pulse Border", 
    description: "A shifting spectrum of color that pulses around your profile picture.",
    price: 900, 
    originalPrice: 1200,
    icon: Palette, 
    color: "from-pink-500 via-purple-500 to-cyan-500",
    shadow: "shadow-purple-500/20",
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
  // New Categories: Cursors (25% Discount)
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
]


export default function StorePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const fetchUser = async () => {
    const session = await getStudentSession(true)
    setUser(session)
    setLoading(false)
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const handlePurchase = async (itemId: string) => {
    if (!user) {
      toast.error("Please login to purchase items")
      return
    }

    setPurchasing(itemId)
    try {
      const response = await fetch("/api/store/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authId: user.auth_id, itemId })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Purchase successful! Item added to your profile.")
        fetchUser() // Refresh balance and inventory
      } else {
        toast.error(data.error || "Transaction failed")
      }
    } catch (error) {
      toast.error("Network error. Please try again.")
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="size-12 border-4 border-primary border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 bg-background selection:bg-primary/20">
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        
        <div className="container px-4 mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6"
          >
            <ShoppingBag className="size-4" />
            <span className="text-sm font-medium uppercase tracking-wider">Chameleon Marketplace</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black italic tracking-tighter mb-6 underline decoration-primary/30"
          >
            Evolve Your <span className="text-primary italic">Identity</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto text-muted-foreground text-lg mb-12"
          >
            Spend your hard-earned quiz coins on prestigious badges and unique achievements. 
            Show the academy who really rules the leaderboards.
          </motion.p>

          {/* Balance Widget */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-6 p-4 rounded-3xl bg-card border border-border/50 shadow-2xl"
          >
            <div className="flex items-center gap-3 pr-6 border-r border-border/50">
              <div className="size-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                <Coins className="size-6 animate-pulse" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Your Balance</p>
                <p className="text-2xl font-black tracking-tighter text-foreground">
                  {user?.coins?.toLocaleString() || 0}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                <TrendingUp className="size-6" />
              </div>
              <div className="text-left">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Rank Status</p>
                <p className="text-sm font-bold text-foreground">Premium Seeker</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Items Grid */}
      <section className="container px-4 mx-auto">
        <Tabs defaultValue="badge" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-muted border border-border h-auto p-1 gap-1 rounded-full px-2">
              <TabsTrigger value="badge" className="rounded-full px-6 py-2 font-bold font-outfit data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Badges
              </TabsTrigger>
              <TabsTrigger value="theme" className="rounded-full px-6 py-2 font-bold font-outfit data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Themes
              </TabsTrigger>
              <TabsTrigger value="border" className="rounded-full px-6 py-2 font-bold font-outfit data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Borders
              </TabsTrigger>
              <TabsTrigger value="cursor" className="rounded-full px-6 py-2 font-bold font-outfit data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
                Cursors
              </TabsTrigger>
            </TabsList>
          </div>

          {["badge", "theme", "border", "cursor"].map((category) => {
            const filteredItems = STORE_ITEMS.filter((item) => item.category === category)
            return (
              <TabsContent key={category} value={category} className="outline-none mt-0 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredItems.map((item, index) => {
                    const isOwned = user?.inventory?.includes(item.id)
                    const canAfford = (user?.coins || 0) >= item.price

                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                      >
                        <Card className={`relative h-full overflow-hidden group transition-all duration-500 hover:shadow-2xl ${item.shadow} ${isOwned ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                          <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${item.color}`} />
                          
                          <CardHeader className="pt-8">
                            <div className="flex justify-between items-start mb-4">
                              <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg relative`}>
                                <item.icon className="size-8" />
                                {item.isNew && (
                                  <span className="absolute -top-2 -right-2 text-[8px] uppercase tracking-wider font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded-full border border-background animate-pulse shadow-md">
                                    -25%
                                  </span>
                                )}
                              </div>
                              {isOwned ? (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                                  <CheckCircle2 className="size-3 mr-1" /> Owned
                                </Badge>
                              ) : (
                                <div className="flex flex-col items-end gap-0.5">
                                  {item.originalPrice && (
                                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground/75 line-through">
                                      <Coins className="size-3" />
                                      <span>{item.originalPrice}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 text-yellow-500 font-bold">
                                    <Coins className="size-4" />
                                    <span>{item.price}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                              {item.name}
                            </CardTitle>
                            <CardDescription className="text-base leading-relaxed">
                              {item.description}
                            </CardDescription>
                          </CardHeader>
                          
                          <CardContent>
                            <div className="p-4 rounded-xl bg-muted/50 border border-border/40 text-sm italic text-muted-foreground">
                              {item.id.startsWith("theme-") 
                                ? "Unlocks this color theme globally, which you can equip in your profile settings."
                                : item.id.startsWith("border-")
                                ? "Unlocks this premium avatar border, which you can equip in your visual settings."
                                : item.id.startsWith("cursor-")
                                ? "Unlocks this unique interactive cursor path effect, active across the entire platform."
                                : "Equipping this badge grants unique visual effects on your profile page."}
                            </div>
                          </CardContent>
                          
                          <CardFooter className="pb-8">
                            <Button 
                              className="w-full rounded-full h-12 font-bold group-hover:shadow-lg transition-all"
                              disabled={isOwned || !canAfford || purchasing === item.id}
                              onClick={() => handlePurchase(item.id)}
                              variant={isOwned ? "outline" : "default"}
                            >
                              {purchasing === item.id ? (
                                <motion.div 
                                  animate={{ rotate: 360 }} 
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  <RefreshCw className="size-4" />
                                </motion.div>
                              ) : isOwned ? (
                                "Already Purchased"
                              ) : !canAfford ? (
                                "Insufficient Coins"
                              ) : (
                                <>
                                  Purchase Item
                                  <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                                </>
                              )}
                            </Button>
                          </CardFooter>

                          {/* Aesthetic backgrounds */}
                          <div className="absolute -bottom-10 -right-10 size-40 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl md:blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </section>

      {/* Footer Info */}
      <section className="container px-4 mx-auto mt-32 text-center pb-20">
        <div className="max-w-3xl mx-auto p-12 rounded-[3rem] bg-gradient-to-b from-muted to-background border border-border relative overflow-hidden">
            <Sparkles className="absolute top-8 left-8 size-12 text-primary/10" />
            <Sparkles className="absolute bottom-8 right-8 size-12 text-secondary/10" />
            
            <h3 className="text-2xl font-black italic mb-4">Want more coins?</h3>
            <p className="text-muted-foreground mb-8">
                Every quiz you solve grants coins based on your score and speed. 
                Keep learning to unlock the rarest legendary items.
            </p>
            <Link href="/specialization">
                <Button variant="outline" className="rounded-full px-8 border-primary/20 hover:bg-primary/5">
                    Start Learning
                </Button>
            </Link>
        </div>
      </section>
    </div>
  )
}

function RefreshCw({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M3 21v-5h5" />
        </svg>
    )
}
