// [PERF] Optimized: faster nav entrance (0.8s→0.3s), removed nav item stagger delays, throttled scroll handler
// components/navigation.tsx (updated)
"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Moon, Sun, Menu, X, LogIn, UserPlus, BookOpen, BrainCircuit, SquareUserRound, LogOut, Home, HelpCircle, ChevronDown, Lock, Gamepad2, ClipboardList, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getStudentSession } from "@/lib/auth"
import { formatTAName } from "@/lib/ta-utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { NotificationBell } from "./notification-bell"
import { ThemeSwitcher } from "./theme-switcher"
import { Zap, Clock as ClockIcon, Activity, Calendar } from "lucide-react"
import { User } from "@/lib/types"
import { useTheme } from "next-themes"

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "Store", href: "/store", icon: ShoppingBag },
  { name: "Specializations", href: "#", icon: SquareUserRound },
  { name: "About", href: "/about", icon: HelpCircle  },
  { name: "Explo", href: "/explo", icon: BrainCircuit, target: "_blank" }
]

export default function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isSpecializationsOpen, setIsSpecializationsOpen] = useState(false)
  // removed dynamic clock/island for performance

  const specializations = [
    {
      name: "Computing and Data Sciences",
      href: "/specialization/computing-data-sciences",
      description: "Advanced computing and data science methodologies"
    },
    {
      name: "Cybersecurity",
      href: "/specialization/cybersecurity",
      description: "Protecting information systems and networks"
    },
    {
      name: "Intelligent Systems",
      href: "/specialization/artificial-intelligence",
      description: "Advanced AI systems and intelligent automation"
    },
    {
      name: "Media Analytics",
      href: "/specialization/media-analytics",
      description: "Analyzing and interpreting media content"
    },
    {
      name: "Business Analytics",
      href: "/specialization/business-analytics",
      description: "Data-driven business intelligence and analytics"
    },
    {
      name: "Healthcare Informatics",
      href: "/specialization/healthcare-informatics",
      description: "Leveraging data and technology to improve patient care"
    },
  ]

  const scrollThrottled = useRef(false)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      // Throttle scroll handler — only update state when rAF fires, not every px
      if (!scrollThrottled.current) {
        scrollThrottled.current = true
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 50)
          scrollThrottled.current = false
        })
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    
    const checkSession = async () => {
      const session = await getStudentSession()
      if (session) {
        setUser(session)
      }
    }
    checkSession()

    // removed clock/timer logic to avoid frequent re-renders

    return () => {
      window.removeEventListener("scroll", handleScroll)
      // nothing extra to clean up for clock
    }
  }, [])

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return
    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setIsOpen(false)
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  // Handle clicks outside the specializations menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isSpecializationsOpen && !target.closest('.specializations-menu') && !target.closest('.specializations-trigger')) {
        setIsSpecializationsOpen(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isSpecializationsOpen) {
        setIsSpecializationsOpen(false)
      }
    }

    if (isSpecializationsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isSpecializationsOpen])

  // Disable background scrolling when the mobile menu is open
  useEffect(() => {
    if (typeof document === 'undefined') return
    const original = document.body.style.overflow
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = original
      }
    }
    return
  }, [isOpen])

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut({ scope: 'global' })
      
      // Clear any remaining localStorage/sessionStorage
      localStorage.clear()
      sessionStorage.clear()
      
      setUser(null)
      window.location.href = '/' // Redirect to home and refresh
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/' // Still redirect even if there's an error
    }
  }

  const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, item: typeof navItems[0]) => {
    if (item.name === "Specializations") {
      e.preventDefault()
      setIsSpecializationsOpen(!isSpecializationsOpen)
      return
    }
  }

  // Hide completely on quiz interface and auth pages
  if (pathname?.startsWith("/quiz/") || pathname?.startsWith("/auth")) {
    return null
  }

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-7xl pointer-events-none">
        <motion.div
           initial={{ y: -30, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ duration: 0.3, ease: "easeOut" }}
           className={`pointer-events-auto h-16 md:h-16 rounded-full border transition-all duration-300 backdrop-blur-xl ${
             scrolled 
               ? "bg-background/80 shadow-lg border-primary/20 scale-[0.98]" 
               : "bg-background/40 border-border/40"
           }`}
        >
          <div className="container h-full mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between h-full">
              {/* Logo */}
              <motion.div whileHover={{ scale: 1.05 }} className="flex items-center gap-3">
              <div style={{ borderRadius: "50%", backgroundColor: "var(--primary)" }}>
              <div className="relative">
                <Image
                  src="/images/chameleon.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-cover"
                  style={{ borderRadius: "50%" }}
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              </div>
              </div>
              <span className="text-xl font-bold ">Chameleon</span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.name === "Specializations" ? (
                    <div className="relative">
                      <button
                        onClick={() => setIsSpecializationsOpen(!isSpecializationsOpen)}
                        className="flex items-center gap-2 text-foreground/70 hover: transition-colors duration-300 group specializations-trigger"
                      >
                        <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="relative">
                          {item.name}
                          <motion.div
                            className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                            initial={{ width: 0 }}
                            whileHover={{ width: "100%" }}
                            transition={{ duration: 0.3 }}
                          />
                        </span>
                        <motion.div
                          animate={{ rotate: isSpecializationsOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>

                      {/* Specializations Dropdown Menu */}
                      <AnimatePresence>
                        {isSpecializationsOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full left-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-2xl specializations-menu z-50"
                          >
                            <div className="p-4">
                              <h3 className=" font-semibold mb-3 text-sm uppercase tracking-wide">Available Specializations</h3>
                              <div className="space-y-2">
                                {specializations.map((spec, specIndex) => (
                                  <motion.div
                                    key={spec.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.12 }}
                                  >
                                    <Link
                                      href={spec.href}
                                      onClick={() => setIsSpecializationsOpen(false)}
                                      className="block p-3 rounded-lg hover:bg-muted transition-colors duration-200 group"
                                    >
                                      <div className=" font-medium group-hover:text-primary transition-colors">
                                        {spec.name}
                                      </div>
                                      <div className="text-muted-foreground text-sm mt-1">
                                        {spec.description}
                                      </div>
                                    </Link>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : item.name === "Explo" ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-foreground/70 hover: transition-colors duration-300 group"
                    >
                      <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      <span className="relative">
                        {item.name}
                        <motion.div
                          className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                          initial={{ width: 0 }}
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </span>
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={(e) => handleNavigation(e, item)}
                      className="flex items-center gap-2 text-foreground/70 hover: transition-colors duration-300 group"
                    >
                      <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      <span className="relative">
                        {item.name}
                        <motion.div
                          className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full"
                          initial={{ width: 0 }}
                          whileHover={{ width: "100%" }}
                          transition={{ duration: 0.3 }}
                        />
                      </span>
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Auth Buttons or User Profile */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                  <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-4"
                >
                  <NotificationBell />
                  <Link href="/profile" className="relative group">
                    <div className="relative">
                      {/* Animated border for admin */}
                      {user.is_admin && (
                        <div 
                          className="absolute -inset-1 rounded-full opacity-75 group-hover:opacity-100 transition-opacity"
                          style={{
                            background: 'conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #3b82f6, #ef4444)',
                            animation: 'spin 3s linear infinite'
                          }}
                        />
                      )}
                      <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 ${user.is_admin ? 'border-transparent' : 'border-border'} group-hover:border-purple-500/50 transition-all duration-300`}>
                        {user.profile_image ? (
                          <Image
                            src={user.profile_image}
                            alt={user.username || 'User'}
                            width={40}
                            height={40}
                            unoptimized
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                            <span className=" font-bold text-sm">{user.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="rounded-full shadow-sm"
                  >
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}>
                    <Link href="/auth/signin">
                      <Button
                        variant="ghost"
                        className="text-foreground/70 hover: hover:bg-muted transition-all duration-300"
                      >
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </Link>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }}>
                    <Link href="/auth/signup">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg transition-all duration-300">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Sign Up
                      </Button>
                    </Link>
                  </motion.div>
                </>
              )}
            </div>

            {/* Mobile Actions & Dynamic Island */}
            <div className="md:hidden flex items-center gap-1.5 z-50">
              {/* removed dynamic clock/island for performance */}
              {user && <NotificationBell />}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12 }}
                onClick={() => (isOpen ? setIsOpen(false) : setIsOpen(true))}
                className=" p-1.5 hover:bg-muted rounded-lg transition-colors duration-300"
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        setIsOpen(false)
                      }}
                    >
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        setIsOpen(true)
                      }}
                    >
                      <Menu className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 0.9, 0.25, 1] }}
              style={{ transformOrigin: 'top' }}
              ref={(el) => (mobileMenuRef.current = el)}
              className="absolute pointer-events-auto mt-4 top-full left-0 right-0 md:hidden overflow-hidden rounded-[2rem] border border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl z-[100] will-change-transform will-change-opacity"
            >
              <div className="container mx-auto px-4 py-6">
                <div className="flex flex-col gap-4">
                  {navItems.map((item, index) => (
                    <motion.div
                      key={item.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.12 }}
                    >
                      {item.name === "Specializations" ? (
                        <div>
                          <button
                            onClick={() => setIsSpecializationsOpen(!isSpecializationsOpen)}
                            className="flex items-center gap-3 text-foreground/70 hover: p-3 rounded-lg hover:bg-muted transition-all duration-300 w-full justify-between specializations-trigger"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="w-5 h-5" />
                              <span>{item.name}</span>
                            </div>
                            <motion.div
                              animate={{ rotate: isSpecializationsOpen ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </motion.div>
                          </button>

                          {/* Mobile Specializations Menu */}
                          <AnimatePresence>
                            {isSpecializationsOpen && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="ml-8 mt-2 space-y-2 max-h-[50vh] overflow-auto mobile-specializations-scroll"
                                // limit height and allow internal scrolling on mobile
                              >
                                {specializations.map((spec, specIndex) => (
                                  <motion.div
                                    key={spec.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.12 }}
                                  >
                                    <Link
                                      href={spec.href}
                                      onClick={() => {
                                        setIsSpecializationsOpen(false)
                                        setIsOpen(false)
                                      }}
                                      className="block p-3 rounded-lg hover:bg-muted transition-colors duration-200"
                                    >
                                      <div className=" font-medium hover:text-purple-300 transition-colors">
                                        {spec.name}
                                      </div>
                                      <div className="text-muted-foreground text-sm mt-1">
                                        {spec.description}
                                      </div>
                                    </Link>
                                  </motion.div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : item.name === "Explo" ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 text-foreground/70 hover: p-3 rounded-lg hover:bg-muted transition-all duration-300"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </a>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={(e) => {
                            handleNavigation(e, item)
                            setIsOpen(false)
                          }}
                          className="flex items-center gap-3 text-foreground/70 hover: p-3 rounded-lg hover:bg-muted transition-all duration-300"
                        >
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </Link>
                      )}
                    </motion.div>
                  ))}
                  
                  <div className="border-t border-border pt-4 mt-2">
                    {user ? (
                      <div className="flex flex-col gap-3">
                        <Link 
                          href="/profile" 
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3  p-3 rounded-lg hover:bg-muted transition-all duration-300"
                        >
                          <div className="relative">
                            {user.is_admin && (
                              <div 
                                className="absolute -inset-1 rounded-full opacity-75"
                                style={{
                                  background: 'conic-gradient(from 0deg, #ef4444, #eab308, #22c55e, #3b82f6, #ef4444)',
                                  animation: 'spin 3s linear infinite'
                                }}
                              />
                            )}
                            <div className={`relative w-10 h-10 rounded-full overflow-hidden border-2 ${user.is_admin ? 'border-transparent' : 'border-border'}`}>
                              {user.profile_image ? (
                                <Image
                                  src={user.profile_image}
                                  alt={user.username || 'User'}
                                  width={40}
                                  height={40}
                                  unoptimized
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                  <span className=" font-bold text-sm">{user.username?.charAt(0)?.toUpperCase() || 'U'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <span>{formatTAName(user.username, user.current_level)}</span>
                        </Link>
                        <Button
                          onClick={() => {
                            handleLogout()
                            setIsOpen(false)
                          }}
                          variant="ghost"
                          className="w-full justify-start text-foreground/70 hover: hover:bg-muted"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <Link href="/auth/signin" onClick={() => setIsOpen(false)}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-foreground/70 hover: hover:bg-muted"
                          >
                            <LogIn className="w-4 h-4 mr-2" />
                            Login
                          </Button>
                        </Link>
                        <Link href="/auth?mode=signup" onClick={() => setIsOpen(false)}>
                          <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90 border-0">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Sign Up
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer to prevent content from hiding behind fixed nav */}
      <div className="h-16 md:h-20" />
    </>
  )
}
