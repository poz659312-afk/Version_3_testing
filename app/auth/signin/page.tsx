"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import Script from "next/script"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ToastProvider"
import { Button } from "@/components/ui/button"
import { 
  ArrowRight, 
  ArrowLeft,
  ChevronRight, 
  Loader2,
  AlertCircle,
  Home,
  Sparkles,
  Sun,
  Moon,
  Github
} from "lucide-react"
import { useTheme } from "next-themes"

export default function SignInPage() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0: Splash, 1: Process
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { addToast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError("")

    try {
      const supabase = createBrowserClient()
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (e) {
      setError("The gateway failed to initialize. Try again?")
      setLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setLoading(true)
    setError("")

    try {
      const supabase = createBrowserClient()
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    } catch (e) {
      setError("The gateway failed to initialize. Try again?")
      setLoading(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30 relative font-sans flex flex-col overflow-x-hidden">
      {/* Dynamic Aura Background */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute top-[-15%] right-[-10%] size-[700px] bg-primary/10 rounded-full blur-[140px] animate-pulse transition-opacity duration-1000 dark:bg-primary/10" />
        <div className="absolute bottom-[-15%] left-[-10%] size-[700px] bg-secondary/10 rounded-full blur-[140px] animate-pulse transition-opacity duration-1000 dark:bg-secondary/10" style={{ animationDelay: '500ms' }} />
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </motion.div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 px-4 py-20">
        {/* Top Branding Anchor - Absolutely Positioned to not disrupt centering */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-6 lg:top-8 left-4 right-4 lg:left-8 lg:right-8 flex items-center justify-between z-50 pointer-events-none"
        >
          <div className="flex-1" />
          <Link href="/" className="flex items-center gap-2 font-bold group focus:outline-none pointer-events-auto">
            <div className="relative size-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <Image 
                src="/images/chameleon.png" 
                alt="Chameleon" 
                width={36} 
                height={36} 
                className="size-full object-cover transition-transform group-hover:scale-110" 
              />
            </div>
            <span className="text-xl rock-salt group-hover:text-primary transition-colors">Chameleon</span>
          </Link>
          <div className="flex-1 flex justify-end pointer-events-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-full hover:bg-foreground/5 transition-colors"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
          </div>
        </motion.div>

        <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
          {/* STATE 0: Welcome Splash */}
          {step === 0 && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
              className="w-full space-y-6 lg:space-y-8"
            >
              {/* Lottie Chameleon Animation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mx-auto w-32 h-32 md:w-40 md:h-40 relative mb-[-1.5rem]"
              >
                {/* @ts-ignore */}
                <dotlottie-player
                  src="https://lottie.host/e113f2b9-9e85-47b2-9743-cf4e30fb43f4/y9usFgethv.lottie"
                  background="transparent"
                  speed="1"
                  style={{ width: '100%', height: '100%' }}
                  loop
                  autoplay
                />
              </motion.div>

              <div className="space-y-2 lg:space-y-4">
                 <h1 className="text-5xl lg:text-6xl xl:text-8xl font-black italic tracking-tighter leading-[0.9]">
                    Return to <br className="hidden xl:block" /><span className="text-primary">Core.</span>
                 </h1>
                 <p className="text-lg lg:text-xl text-muted-foreground font-medium tracking-wide max-w-sm mx-auto">
                    Ready to continue sculpting your digital workspace? The era awaits your return.
                 </p>
              </div>
              
              <div className="flex flex-col items-center gap-4 lg:gap-6 pt-2">
                <Button 
                  onClick={() => setStep(1)}
                  className="h-16 lg:h-20 px-10 lg:px-14 rounded-full text-xl md:text-2xl font-black italic tracking-tighter bg-foreground text-background hover:scale-105 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(255,255,255,0.1)] transition-all shrink-0"
                >
                  I am Ready <ArrowRight className="ml-3 size-6 lg:size-7" />
                </Button>
                
                <Link href="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] transition-colors mt-2">
                  <Home className="size-3" /> Back to Surface
                </Link>
              </div>
            </motion.div>
          )}

          {/* STATE 1: Identity Step */}
          {step === 1 && (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="w-full max-w-lg space-y-8 lg:space-y-12 py-4"
            >
              <div className="space-y-2 lg:space-y-4 text-center">
                <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter">Resync Identity.</h2>
                <p className="text-base lg:text-lg text-muted-foreground max-w-sm mx-auto">Secure entry via authorized digital protocols.</p>
              </div>
              
              <div className="grid gap-4 lg:gap-6">
                  <button 
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="flex items-center justify-between group p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
                 >
                    <div className="flex items-center gap-4 lg:gap-5">
                       <div className="size-10 lg:size-12 rounded-[14px] lg:rounded-2xl bg-background flex items-center justify-center p-2 lg:p-2.5 shadow-sm group-hover:rotate-6 transition-transform">
                          <svg viewBox="0 0 24 24" className="size-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                       </div>
                       <div>
                          <p className="text-xl lg:text-2xl font-black italic tracking-tighter">Sync via Google</p>
                          <p className="text-[9px] lg:text-[10px] font-bold opacity-50 uppercase tracking-widest">Biometric Level Auth</p>
                       </div>
                    </div>
                    {loading ? <Loader2 className="animate-spin size-6 lg:size-7" /> : <ChevronRight className="size-6 lg:size-7 opacity-10 group-hover:opacity-100 transition-opacity" />}
                 </button>

                 <button 
                  onClick={handleGithubSignIn}
                  disabled={loading}
                  className="flex items-center justify-between group p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
                 >
                    <div className="flex items-center gap-4 lg:gap-5">
                       <div className="size-10 lg:size-12 rounded-[14px] lg:rounded-2xl bg-foreground text-background flex items-center justify-center p-2 lg:p-2.5 shadow-sm group-hover:rotate-6 transition-transform ring-1 ring-background/10">
                          <Github className="size-full" />
                       </div>
                       <div>
                          <p className="text-xl lg:text-2xl font-black italic tracking-tighter">Sync via GitHub</p>
                          <p className="text-[9px] lg:text-[10px] font-bold opacity-50 uppercase tracking-widest">Developer Grade Auth</p>
                       </div>
                    </div>
                    {loading ? <Loader2 className="animate-spin size-6 lg:size-7" /> : <ChevronRight className="size-6 lg:size-7 opacity-10 group-hover:opacity-100 transition-opacity" />}
                 </button>

                 {error && (
                    <div className="flex items-center gap-3 text-red-400 font-bold justify-center bg-red-400/5 p-4 lg:p-5 rounded-[24px] lg:rounded-[30px] border border-red-400/10 text-sm">
                      <AlertCircle className="size-5 shrink-0" /> <span className="flex-1">{error}</span>
                    </div>
                 )}
              </div>

              <div className="pt-4 lg:pt-8 flex flex-col items-center gap-4 lg:gap-6">
                 <div className="flex flex-col items-center gap-2">
                    <p className="text-neutral-600 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.4em]">First time here?</p>
                    <Link href="/auth/signup" className="group text-foreground hover:text-primary font-bold transition-all flex items-center gap-2 text-sm lg:text-base">
                       <span className="underline underline-offset-8 decoration-foreground/20 group-hover:decoration-primary">Initialize a new identity</span>
                       <Sparkles className="size-4 animate-pulse text-primary" />
                    </Link>
                 </div>
                 
                 <Button variant="ghost" onClick={() => setStep(0)} className="text-neutral-500 font-bold hover:text-foreground text-sm lg:text-base">
                    <ArrowLeft className="mr-2 size-4" /> Changed my mind
                 </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
