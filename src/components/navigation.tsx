// [PERF] Optimized: ALL framer-motion removed — replaced with CSS animations + transitions
// [PERF] backdrop-blur-xl → bg-background/90 on mobile for GPU savings
// components/navigation.tsx (updated)
"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Moon, Sun, Menu, X, LogIn, UserPlus, BrainCircuit, SquareUserRound, LogOut, Home, HelpCircle, ChevronDown, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getStudentSession } from "@/lib/auth"
import { formatTAName } from "@/lib/ta-utils"
import { createBrowserClient } from "@/lib/supabase/client"
import { NotificationBell } from "./notification-bell"
import { useLenis } from "lenis/react"
// ThemeSwitcher and extra icons removed (not used here)
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
  const [mounted, setMounted] = useState(false)

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
  const savedScrollY = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
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

    return () => {
      window.removeEventListener("scroll", handleScroll)
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

  const lenis = useLenis()

  // Disable background scrolling while mobile menu or specializations menu is open (preserve scroll position)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    const shouldLock = isOpen || isSpecializationsOpen;

    if (shouldLock) {
      lenis?.stop()
      if (savedScrollY.current === null) {
        savedScrollY.current = window.scrollY
      }
      document.body.style.position = 'fixed'
      document.body.style.top = `-${savedScrollY.current}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.documentElement.style.overflow = 'hidden'
    } else {
      if (savedScrollY.current !== null) {
        const y = savedScrollY.current
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.documentElement.style.overflow = ''
        window.scrollTo(0, y)
        savedScrollY.current = null
      } else {
        document.documentElement.style.overflow = ''
      }
      lenis?.start()
    }

    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.documentElement.style.overflow = ''
      lenis?.start()
    }
  }, [isOpen, isSpecializationsOpen, lenis])

  // Close menus when route changes (or on large resizes)
  useEffect(() => {
    setIsOpen(false)
    setIsSpecializationsOpen(false)
  }, [pathname])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient()
      await supabase.auth.signOut({ scope: 'global' })
      
      localStorage.clear()
      sessionStorage.clear()
      
      setUser(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
      window.location.href = '/'
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
        <div
           className={`pointer-events-auto h-16 md:h-16 rounded-full border transition-all duration-300 bg-background/90 ${
             scrolled 
               ? "shadow-lg border-primary/20 scale-[0.98]" 
               : "border-border/40"
           } ${mounted ? 'animate-nav-enter' : 'opacity-0'}`}
        >
          <div className="container h-full mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between h-full">
              {/* Logo */}
              <div className="flex items-center gap-3 hover:scale-105 transition-transform duration-200">
              <div className="rounded-full bg-primary">
              <div className="relative">
                <Image
                  src="/images/chameleon.png"
                  alt="Logo"
                  width={40}
                  height={40}
                  className="object-cover rounded-full"
                />
              </div>
              </div>
              <span className="text-xl font-bold ">Chameleon</span>
            </div>

            {/* Desktop Navigation — pure CSS entrance */}
            <nav
              className={`hidden md:flex items-center gap-8 ${mounted ? 'animate-nav-items' : 'opacity-0'}`}
            >
              {navItems.map((item) => (
                <div key={item.name}>
                  {item.name === "Specializations" ? (
                    <div className="relative">
                      <button
                        onClick={() => setIsSpecializationsOpen(!isSpecializationsOpen)}
                        className="flex items-center gap-2 text-foreground/70 transition-colors duration-200 group specializations-trigger"
                      >
                        <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                        <span className="relative">
                          {item.name}
                          <span className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full w-0 group-hover:w-full transition-all duration-300" />
                        </span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSpecializationsOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {isSpecializationsOpen && (
                        <div
                          className="absolute top-full left-0 mt-2 w-80 max-h-[60vh] overflow-y-auto custom-scrollbar overscroll-contain pointer-events-auto bg-background border border-border rounded-lg shadow-2xl specializations-menu z-50 animate-dropdown-enter"
                          data-lenis-prevent="true"
                        >
                          <div className="p-4">
                            <h3 className=" font-semibold mb-3 text-sm uppercase tracking-wide">Available Specializations</h3>
                            <div className="space-y-2">
                              {specializations.map((spec) => (
                                <div key={spec.name}>
                                  <Link href={spec.href} onClick={() => setIsSpecializationsOpen(false)} className="block p-3 rounded-lg hover:bg-muted transition-colors duration-200 group">
                                    <div className=" font-medium group-hover:text-primary transition-colors">{spec.name}</div>
                                    <div className="text-muted-foreground text-sm mt-1">{spec.description}</div>
                                  </Link>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : item.name === "Explo" ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-foreground/70 transition-colors duration-200 group">
                      <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      <span className="relative">{item.name}</span>
                    </a>
                  ) : (
                    <Link href={item.href} onClick={(e) => handleNavigation(e, item)} className="flex items-center gap-2 text-foreground/70 transition-colors duration-200 group">
                      <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                      <span className="relative">{item.name}</span>
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* Auth Buttons or User Profile */}
            <div className={`hidden md:flex items-center gap-4 ${mounted ? 'animate-nav-auth' : 'opacity-0'}`}>
              {user ? (
                  <div className="flex items-center gap-4">
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
                </div>
              ) : (
                <>
                  <Link href="/auth/signin">
                    <Button
                      variant="ghost"
                      className="text-foreground/70 hover: hover:bg-muted transition-all duration-300"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-lg transition-all duration-300">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center gap-1.5 z-50">
              {user && <NotificationBell />}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className=" p-1.5 hover:bg-muted rounded-lg transition-colors duration-300"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

        {/* Mobile Menu — CSS animation, no backdrop-blur on mobile */}
        {isOpen && (
          <div
            ref={(el) => { mobileMenuRef.current = el }}
            className="absolute pointer-events-auto mt-4 top-full left-0 right-0 md:hidden max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar overscroll-contain rounded-[2rem] border border-border/40 bg-background/95 shadow-2xl z-[100] animate-mobile-menu-enter"
            data-lenis-prevent="true"
          >
            <div className="container mx-auto px-4 py-6">
              <div className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <div key={item.name}>
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
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSpecializationsOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Mobile Specializations Menu */}
                        {isSpecializationsOpen && (
                          <div
                            className="ml-8 mt-2 space-y-2 animate-accordion-enter"
                          >
                            {specializations.map((spec) => (
                              <div key={spec.name}>
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
                              </div>
                            ))}
                          </div>
                        )}
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
                  </div>
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
          </div>
        )}
      </header>

      {/* Spacer to prevent content from hiding behind fixed nav */}
      <div className="h-16 md:h-20" />
    </>
  )
}
