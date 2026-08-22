"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  BookOpen,
  BrainCircuit,
  Trophy,
  Rocket,
  ArrowRight,
  ArrowLeft,
  X,
  Clock,
  EyeOff,
  Volume2,
  VolumeX,
  Coins,
  Gift,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getStudentSession, StudentUser } from "@/lib/auth"
import { createBrowserClient } from "@/lib/supabase/client"
import { toast } from "sonner"

// ==========================================
// Lightweight Audio Synthesizer
// ==========================================
class SoundFX {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== "undefined") {
      this.enabled = localStorage.getItem("chameleon_tour_sound") !== "false"
    }
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {})
    }
  }

  toggleSound(): boolean {
    this.enabled = !this.enabled
    localStorage.setItem("chameleon_tour_sound", this.enabled ? "true" : "false")
    return this.enabled
  }

  isSoundEnabled(): boolean {
    return this.enabled
  }

  playPop() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = "sine"
      osc.frequency.setValueAtTime(480, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(720, this.ctx.currentTime + 0.06)
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.06)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.06)
    } catch {}
  }

  playSuccess() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99]
      notes.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + i * 0.06)
        gain.gain.setValueAtTime(0.12, now + i * 0.06)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + i * 0.06)
        osc.stop(now + i * 0.06 + 0.15)
      })
    } catch {}
  }

  playCoins() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const freqs = [1046.5, 1318.51, 1567.98, 2093.0]
      freqs.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, now + i * 0.07)
        gain.gain.setValueAtTime(0.15, now + i * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + i * 0.07)
        osc.stop(now + i * 0.07 + 0.2)
      })
    } catch {}
  }
}

const sfx = new SoundFX()

// ==========================================
// Tour Step Definitions (Chameleon Gold Theme as Default)
// ==========================================
interface TourStep {
  id: number
  mascotImage: string
  mascotAlt: string
  pillBadge: string
  pillColor: string
  title: (name: string) => string
  subtitle: string
  description: string
  interactiveType: "cover" | "timeline" | "drive" | "quiz" | "ai" | "celebration"
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 0,
    mascotImage: "/images/chameleon/02_chameleon_waving.webp",
    mascotAlt: "Marline Waving Welcome",
    pillBadge: "✨ WELCOME ABOARD",
    pillColor: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30",
    title: (name) => `WELCOME, ${name.toUpperCase()}!`,
    subtitle: "Knowledge, Growth & Community at FCDS",
    description:
      "Welcome to Chameleon — your complete digital campus companion. Take this quick 1-minute tour to discover your courses, quizzes, and AI tools!",
    interactiveType: "cover"
  },
  {
    id: 1,
    mascotImage: "/images/chameleon/01_chameleon_front.webp",
    mascotAlt: "Marline Front",
    pillBadge: "🏛️ ABOUT CHAMELEON",
    pillColor: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30",
    title: () => "Who We Are & Our Story",
    subtitle: "Faculty of Computer & Data Science (FCDS)",
    description:
      "Chameleon launched in 2024 as an Alexandria University student initiative to gather all academic lectures, sections, and study materials into one easy-to-use platform.",
    interactiveType: "timeline"
  },
  {
    id: 2,
    mascotImage: "/images/chameleon/04_chameleon_reading.webp",
    mascotAlt: "Marline Reading Materials",
    pillBadge: "📚 COURSES & DRIVE",
    pillColor: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30",
    title: () => "Access Courses & Materials",
    subtitle: "Official slides, past exams, and top summaries",
    description:
      "Explore the 6 specializations (CDS, AI, CYS, MA, BA, HI). Every course features organized Google Drive materials along with verified summaries prepared by top students.",
    interactiveType: "drive"
  },
  {
    id: 3,
    mascotImage: "/images/chameleon/09_chameleon_idea.webp",
    mascotAlt: "Marline Quiz Idea",
    pillBadge: "🏆 INTERACTIVE QUIZZES",
    pillColor: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30",
    title: () => "Quizzes & Competitive Ranking",
    subtitle: "Adaptive tests with Instant or Traditional feedback",
    description:
      "Solve chapter-by-chapter quizzes, earn points towards the batch leaderboard on your first attempt, and collect Chameleon Coins for the store!",
    interactiveType: "quiz"
  },
  {
    id: 4,
    mascotImage: "/images/chameleon/05_chameleon_laptop.webp",
    mascotAlt: "Marline Laptop AI",
    pillBadge: "⚡ SMART ASSISTANT",
    pillColor: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30",
    title: () => "Marline AI & Study Spaces",
    subtitle: "Intelligent tutoring, Pomodoro rooms & GPA calculator",
    description:
      "Use Marline AI to explain code and summarize chapters, collaborate with peers in Study Spaces, and track your cumulative GPA using official faculty formulas.",
    interactiveType: "ai"
  },
  {
    id: 5,
    mascotImage: "/images/chameleon/13_chameleon_celebrating.webp",
    mascotAlt: "Marline Celebrating",
    pillBadge: "🎁 WELCOME REWARD",
    pillColor: "bg-amber-500/15 text-amber-500 dark:text-amber-400 border-amber-500/30",
    title: () => "Claim 15,000 Welcome Coins! 🪙",
    subtitle: "Your official starter gift to kick off the semester",
    description:
      "Click the claim button below to deposit 15,000 Chameleon Coins straight into your account. You are now all set to excel. Have an amazing journey!",
    interactiveType: "celebration"
  }
]

const STORAGE_KEYS = {
  PERMANENT_DISMISS: "chameleon_tour_permanent_dismiss",
  LAST_STEP: "chameleon_tour_step",
  COINS_CLAIMED: "chameleon_tour_15k_coins_claimed"
}

export default function MarlineOnboardingTour() {
  const [isEligible, setIsEligible] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isClient, setIsClient] = useState<boolean>(false)
  const [accountAgeHours, setAccountAgeHours] = useState<number>(0)
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true)
  const [currentUser, setCurrentUser] = useState<StudentUser | null>(null)
  const [isClaimingCoins, setIsClaimingCoins] = useState<boolean>(false)
  
  // Interactive step mini-states
  const [activeDriveTab, setActiveDriveTab] = useState<"drive" | "summaries" | "specs">("drive")
  const [quizSelected, setQuizSelected] = useState<number | null>(null)

  useEffect(() => {
    setIsClient(true)
    setIsSoundOn(sfx.isSoundEnabled())

    const checkEligibility = async () => {
      try {
        const permanentlyDismissed = localStorage.getItem(STORAGE_KEYS.PERMANENT_DISMISS) === "true"
        if (permanentlyDismissed) {
          setIsEligible(false)
          setIsOpen(false)
          return
        }

        // Must be a logged-in student user
        const session = await getStudentSession()
        if (!session || !session.auth_id) {
          // Unauthenticated visitors / guests do NOT see the onboarding tour
          setIsEligible(false)
          setIsOpen(false)
          return
        }

        setCurrentUser(session)

        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000 // 48 hours
        let isWithinTwoDays = false

        if (session.created_at) {
          const createdAtTime = new Date(session.created_at).getTime()
          const ageMs = Date.now() - createdAtTime
          const hoursOld = Math.max(0, Math.floor(ageMs / (1000 * 60 * 60)))
          setAccountAgeHours(hoursOld)

          // Eligible only if account was created within the last 48 hours
          if (ageMs >= 0 && ageMs <= TWO_DAYS_MS) {
            isWithinTwoDays = true
          }
        } else {
          // New session without created_at is considered newly created
          isWithinTwoDays = true
          setAccountAgeHours(0)
        }

        if (isWithinTwoDays) {
          setIsEligible(true)
          const savedStep = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_STEP) || "0", 10)
          if (!isNaN(savedStep) && savedStep >= 0 && savedStep < TOUR_STEPS.length) {
            setCurrentStep(savedStep)
          }

          const hasClosedInSession = sessionStorage.getItem("chameleon_tour_session_minimized") === "true"
          if (!hasClosedInSession) {
            const timer = setTimeout(() => {
              setIsOpen(true)
              sfx.playSuccess()
            }, 600)
            return () => clearTimeout(timer)
          }
        } else {
          setIsEligible(false)
          setIsOpen(false)
        }
      } catch (err) {
        console.error("Error checking onboarding eligibility:", err)
        setIsEligible(false)
        setIsOpen(false)
      }
    }

    checkEligibility()

    // Listen to custom auth state changes or window focus to re-check when user logs in
    const handleAuthChange = () => checkEligibility()
    window.addEventListener("chameleon_auth_change", handleAuthChange)
    window.addEventListener("focus", handleAuthChange)

    return () => {
      window.removeEventListener("chameleon_auth_change", handleAuthChange)
      window.removeEventListener("focus", handleAuthChange)
    }
  }, [])

  // Lock background body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prevOverflow
      }
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
      if (e.key === "Escape") handleMinimize()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, currentStep])

  if (!isClient || !isEligible) {
    return null
  }

  const stepData = TOUR_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOUR_STEPS.length - 1
  const remainingHours = Math.max(0, 48 - accountAgeHours)
  const userName = currentUser?.username ? currentUser.username.split(" ")[0] : "Chameleon"

  const handleNext = () => {
    sfx.playPop()
    if (!isLastStep) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      localStorage.setItem(STORAGE_KEYS.LAST_STEP, nextStep.toString())
    } else {
      handleClaimCoinsAndFinish()
    }
  }

  const handlePrev = () => {
    sfx.playPop()
    if (!isFirstStep) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      localStorage.setItem(STORAGE_KEYS.LAST_STEP, prevStep.toString())
    }
  }

  const handleJumpToStep = (idx: number) => {
    sfx.playPop()
    setCurrentStep(idx)
    localStorage.setItem(STORAGE_KEYS.LAST_STEP, idx.toString())
  }

  const handleMinimize = () => {
    sfx.playPop()
    setIsOpen(false)
    sessionStorage.setItem("chameleon_tour_session_minimized", "true")
  }

  const handleClaimCoinsAndFinish = async () => {
    setIsClaimingCoins(true)
    sfx.playCoins()

    try {
      const alreadyClaimed = localStorage.getItem(STORAGE_KEYS.COINS_CLAIMED) === "true"
      
      if (!alreadyClaimed) {
        const supabase = createBrowserClient()
        let user = currentUser
        if (!user) {
          user = await getStudentSession()
        }

        if (user && user.auth_id) {
          const { data: dbUser } = await supabase
            .from("chameleons")
            .select("coins")
            .eq("auth_id", user.auth_id)
            .single()

          const currentCoins = dbUser?.coins || 0
          const updatedCoins = currentCoins + 15000

          await supabase
            .from("chameleons")
            .update({ coins: updatedCoins })
            .eq("auth_id", user.auth_id)

          sessionStorage.removeItem("chameleon_user_cache")
        }

        localStorage.setItem(STORAGE_KEYS.COINS_CLAIMED, "true")
      }

      toast.success("🎉 Congrats! 15,000 Welcome Coins added to your account!", {
        duration: 4500,
      })

      setTimeout(() => {
        setIsOpen(false)
        localStorage.setItem(STORAGE_KEYS.PERMANENT_DISMISS, "true")
        setIsEligible(false)
      }, 1200)
    } catch (err) {
      console.error("Error awarding welcome coins:", err)
      setIsOpen(false)
      localStorage.setItem(STORAGE_KEYS.PERMANENT_DISMISS, "true")
      setIsEligible(false)
    } finally {
      setIsClaimingCoins(false)
    }
  }

  const handlePermanentDismiss = () => {
    sfx.playPop()
    if (window.confirm("Are you sure you want to dismiss the tour? It will not appear again.")) {
      localStorage.setItem(STORAGE_KEYS.PERMANENT_DISMISS, "true")
      setIsOpen(false)
      setIsEligible(false)
    }
  }

  const handleToggleSound = () => {
    const state = sfx.toggleSound()
    setIsSoundOn(state)
    if (state) sfx.playPop()
  }

  return (
    <>
      {/* ==========================================
          Floating Trigger Pill (Chameleon Gold Theme)
          ========================================== */}
      {!isOpen && isEligible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-6 z-[999]"
          dir="ltr"
        >
          <button
            onClick={() => {
              sfx.playPop()
              setIsOpen(true)
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-card border-2 border-amber-500/50 text-foreground font-sans shadow-lg hover:border-amber-500 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
              <Image
                src={stepData.mascotImage}
                alt="Marline Mascot"
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-foreground">Chameleon Tour</span>
                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-500 font-black text-[10px]">
                  +15K 🪙
                </span>
              </div>
            </div>
          </button>
        </motion.div>
      )}

      {/* ==========================================
          Creative Modal: Authenticated New Users Tour
          ========================================== */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-black/65 backdrop-blur-sm"
            dir="ltr"
          >
            {/* Backdrop click to minimize */}
            <div onClick={handleMinimize} className="fixed inset-0 z-0" />

            {/* Main Window Outer Wrapper */}
            <div className="relative z-10 w-full max-w-xl sm:max-w-2xl lg:max-w-[760px] my-auto py-6 sm:py-8 sm:pr-14 md:pr-20 overflow-visible">

              {/* ------------------------------------------
                  MASCOT OVERHANGING ON RIGHT
                  Exits UP ⬆️ on slide change
                  ------------------------------------------ */}
              <div className="sm:absolute sm:-right-8 md:-right-10 lg:-right-12 sm:top-1/2 sm:-translate-y-1/2 z-30 flex flex-col items-center justify-center select-none pointer-events-none mb-3 sm:mb-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`mascot-gold-theme-${currentStep}`}
                    initial={{ opacity: 0, y: 35, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -55, scale: 0.92 }}
                    transition={{ duration: 0.25, ease: [0.25, 1, 0.5, 1] }}
                    className="flex flex-col items-center justify-center"
                  >
                    {/* Full Height Mascot Overhanging */}
                    <div className="relative w-44 h-44 sm:w-68 sm:h-68 md:w-80 md:h-80 lg:w-[370px] lg:h-[370px] flex items-center justify-center filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.85)]">
                      <Image
                        src={stepData.mascotImage}
                        alt={stepData.mascotAlt}
                        width={380}
                        height={380}
                        className="object-contain"
                        priority
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* ------------------------------------------
                  CARD WITH CHAMELEON GOLD THEME BORDERS & HIGHLIGHTS
                  ------------------------------------------ */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="relative z-20 w-full bg-card text-card-foreground border-2 border-amber-500/30 rounded-3xl sm:rounded-[2.4rem] shadow-2xl p-5 sm:p-7 md:p-8 font-sans overflow-hidden min-h-[360px] sm:min-h-[400px] flex flex-col justify-between"
                style={{
                  maskImage: "radial-gradient(circle 168px at calc(100% - 18px) 50%, transparent 167px, black 168px)",
                  WebkitMaskImage: "radial-gradient(circle 168px at calc(100% - 18px) 50%, transparent 167px, black 168px)"
                }}
              >
                {/* Continuous Gold/Theme Border Arc along the circular cutout */}
                <div
                  className="hidden sm:block absolute pointer-events-none rounded-full border-2 border-amber-500/30 z-30"
                  style={{
                    width: "336px",
                    height: "336px",
                    right: "calc(-168px + 18px)",
                    top: "50%",
                    transform: "translateY(-50%)"
                  }}
                />

                {/* Top Header Controls Bar */}
                <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-border/60 max-w-full sm:max-w-[78%] md:max-w-[80%]">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide border ${stepData.pillColor}`}>
                      {stepData.pillBadge}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Step {currentStep} of {TOUR_STEPS.length - 1}
                    </span>
                  </div>

                  {/* Audio / Skip / Close Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleSound}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title={isSoundOn ? "Mute audio" : "Unmute audio"}
                    >
                      {isSoundOn ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={handlePermanentDismiss}
                      className="text-xs text-muted-foreground hover:text-red-500 px-2.5 py-1 rounded-lg hover:bg-red-500/10 transition-colors font-medium"
                    >
                      <span className="hidden sm:inline">Skip Tour</span>
                      <EyeOff className="w-3.5 h-3.5 sm:hidden" />
                    </button>

                    <button
                      onClick={handleMinimize}
                      className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      title="Minimize"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Dots Indicator */}
                <div className="flex items-center justify-start gap-1.5 mb-4 max-w-full sm:max-w-[62%] md:max-w-[64%]">
                  {TOUR_STEPS.map((step, idx) => (
                    <button
                      key={step.id}
                      onClick={() => handleJumpToStep(idx)}
                      className={`h-1.5 rounded-full transition-all duration-200 ${
                        idx === currentStep
                          ? "w-6 bg-amber-500 shadow-sm shadow-amber-500/30"
                          : idx < currentStep
                          ? "w-1.5 bg-amber-500/50"
                          : "w-1.5 bg-muted hover:bg-muted-foreground/40"
                      }`}
                      title={`Step ${idx}`}
                    />
                  ))}
                </div>

                {/* Content Area */}
                <div className="w-full sm:max-w-[62%] md:max-w-[64%] min-h-[210px] sm:min-h-[230px] overflow-hidden flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`content-down-${currentStep}`}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 30 }}
                      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
                      className="space-y-3 text-left w-full"
                    >
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight font-outfit">
                          {stepData.title(userName)}
                        </h3>
                        <p className="text-xs sm:text-sm font-bold text-amber-500 dark:text-amber-400">
                          {stepData.subtitle}
                        </p>
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {stepData.description}
                      </p>

                      {/* Interactive Widgets */}
                      <div className="pt-1.5">
                        {/* Slide 0: Cover Highlights */}
                        {stepData.interactiveType === "cover" && (
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                              <span className="text-[11px] font-black text-amber-500 dark:text-amber-400 block">📚 6 Tracks</span>
                              <span className="text-[9px] text-muted-foreground block">Full Drive</span>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 block">🏆 Quizzes</span>
                              <span className="text-[9px] text-muted-foreground block">Leaderboard</span>
                            </div>
                            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                              <span className="text-[11px] font-black text-purple-600 dark:text-purple-400 block">🤖 Marline</span>
                              <span className="text-[9px] text-muted-foreground block">24/7 AI</span>
                            </div>
                          </div>
                        )}

                        {/* Slide 1: Timeline */}
                        {stepData.interactiveType === "timeline" && (
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                              <span className="text-xs font-black text-amber-500 dark:text-amber-400 block">2024</span>
                              <span className="text-[10px] font-bold text-foreground block">Launched</span>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                              <span className="text-xs font-black text-amber-500 dark:text-amber-400 block">2025</span>
                              <span className="text-[10px] font-bold text-foreground block">Drive & Quizzes</span>
                            </div>
                            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                              <span className="text-xs font-black text-amber-500 dark:text-amber-400 block">2026</span>
                              <span className="text-[10px] font-bold text-foreground block">AI & Spaces</span>
                            </div>
                          </div>
                        )}

                        {/* Slide 2: Drive Tabs */}
                        {stepData.interactiveType === "drive" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 p-0.5 bg-muted/60 rounded-lg">
                              <button
                                onClick={() => { sfx.playPop(); setActiveDriveTab("drive") }}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                  activeDriveTab === "drive" ? "bg-background text-amber-500 shadow-sm" : "text-muted-foreground"
                                }`}
                              >
                                📁 Google Drive
                              </button>
                              <button
                                onClick={() => { sfx.playPop(); setActiveDriveTab("summaries") }}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                  activeDriveTab === "summaries" ? "bg-background text-amber-500 shadow-sm" : "text-muted-foreground"
                                }`}
                              >
                                📝 Summaries
                              </button>
                              <button
                                onClick={() => { sfx.playPop(); setActiveDriveTab("specs") }}
                                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                                  activeDriveTab === "specs" ? "bg-background text-amber-500 shadow-sm" : "text-muted-foreground"
                                }`}
                              >
                                🏛️ 6 Majors
                              </button>
                            </div>
                            <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                              {activeDriveTab === "drive" && "Download lecture slides, assignments, and section PDFs directly."}
                              {activeDriveTab === "summaries" && "Comprehensive exam reviews and summaries prepared by top alumni."}
                              {activeDriveTab === "specs" && "Full tracks for Data Science, AI, Cybersecurity, Media, and more."}
                            </p>
                          </div>
                        )}

                        {/* Slide 3: Quiz Sample */}
                        {stepData.interactiveType === "quiz" && (
                          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                            <p className="text-xs font-bold text-foreground">
                              What is the primary mission of Chameleon FCDS?
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {[
                                { id: 1, text: "Provide a smart educational ecosystem for students", correct: true },
                                { id: 2, text: "Just a generic static site", correct: false }
                              ].map((opt) => (
                                <button
                                  key={opt.id}
                                  onClick={() => {
                                    setQuizSelected(opt.id)
                                    if (opt.correct) sfx.playSuccess()
                                    else sfx.playPop()
                                  }}
                                  className={`p-2 rounded-xl text-left text-xs font-medium border transition-colors ${
                                    quizSelected === opt.id
                                      ? opt.correct
                                        ? "bg-amber-500/20 border-amber-500 text-amber-500 dark:text-amber-300 font-bold"
                                        : "bg-red-500/20 border-red-500 text-red-600"
                                      : "bg-background border-border hover:border-amber-400"
                                  }`}
                                >
                                  {opt.text}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Slide 4: AI Prompt Chips */}
                        {stepData.interactiveType === "ai" && (
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "💬 Explain algorithms",
                              "📊 Summarize chapters",
                              "🧮 Calculate GPA",
                              "🎧 Live study spaces"
                            ].map((prompt, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-xl bg-muted/60 border border-border/60 text-[11px] text-foreground font-medium"
                              >
                                {prompt}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Slide 5: 15,000 Coins Reward */}
                        {stepData.interactiveType === "celebration" && (
                          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3">
                            <div className="text-left">
                              <span className="text-sm sm:text-base font-black text-amber-500 block">
                                +15,000 Chameleon Coins 🪙
                              </span>
                              <span className="text-[11px] text-muted-foreground block">
                                Official welcome reward added directly to your balance
                              </span>
                            </div>
                            <div className="p-2.5 rounded-full bg-amber-500/20 text-amber-500 shrink-0">
                              <Coins className="w-6 h-6" />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border/60 max-w-full sm:max-w-[62%] md:max-w-[64%]">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      Available for 2 days ({remainingHours}h left).
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isFirstStep && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrev}
                        className="rounded-full px-3.5 text-xs font-bold flex items-center gap-1 h-8"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={handleNext}
                      disabled={isClaimingCoins}
                      className="rounded-full px-4 text-xs font-black bg-amber-500 hover:bg-amber-600 text-black flex items-center gap-1.5 h-8 shadow-md shadow-amber-500/20"
                    >
                      {isFirstStep ? (
                        <>
                          <span>Start Tour</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      ) : isLastStep ? (
                        <>
                          <Gift className="w-3.5 h-3.5" />
                          <span>{isClaimingCoins ? "Depositing..." : "Claim Coins 🎉"}</span>
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
