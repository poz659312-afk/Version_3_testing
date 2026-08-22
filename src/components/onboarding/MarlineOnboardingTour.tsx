"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
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
  CheckCircle2,
  HelpCircle,
  Clock,
  Compass,
  Zap,
  FolderOpen,
  MessageSquare,
  ShieldCheck,
  EyeOff,
  Flame,
  Star,
  Volume2,
  VolumeX,
  Layers,
  GraduationCap,
  Coins,
  ChevronLeft,
  Play,
  RotateCcw,
  Sparkle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getStudentSession } from "@/lib/auth"

// ==========================================
// Web Audio API Micro-Synthesizer (0 KB download, ultra-fast)
// ==========================================
class SoundFX {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chameleon_tour_sound")
      this.enabled = saved !== "false"
    }
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
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
      osc.frequency.setValueAtTime(440, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.08)
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playSuccess() {
    if (!this.enabled) return
    try {
      this.init()
      if (!this.ctx) return
      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, i) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, now + i * 0.07)
        gain.gain.setValueAtTime(0.15, now + i * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.18)
        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(now + i * 0.07)
        osc.stop(now + i * 0.07 + 0.18)
      })
    } catch {}
  }
}

const sfx = new SoundFX()

// ==========================================
// Tour Step Definitions
// ==========================================
interface TourStep {
  id: number
  mascotImage: string
  mascotAlt: string
  mascotMood: string
  badge: string
  badgeIcon: React.ElementType
  themeGlow: string
  accentColor: string
  title: string
  subtitle: string
  description: string
  interactiveType: "timeline" | "drive-preview" | "mini-quiz" | "ai-prompts" | "celebration"
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    mascotImage: "/images/chameleon/02_chameleon_waving.png",
    mascotAlt: "Marline Waving Welcome",
    mascotMood: "👋 مرحباً يا بطل!",
    badge: "بوابة الانطلاق",
    badgeIcon: Sparkles,
    themeGlow: "from-emerald-500/20 via-teal-500/10 to-primary/20",
    accentColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    title: "أهلاً بك في Chameleon! مين إحنا ومن إمتى؟",
    subtitle: "المجتمع التعليمي الأذكى لكلية الحاسبات والذكاء الاصطناعي",
    description:
      "إحنا المنصة الرسمية لمجتمع طلاب FCDS بجامعة الإسكندرية. انطلقنا سنة 2024 كفكرة طلابية لجمع كل المواد، السلايدات، والكويزات في مكان واحد متطور. واليوم نقدم لك تجربة مدعومة بالذكاء الاصطناعي وبمساعدتي أنا، مارلين 🦎!",
    interactiveType: "timeline"
  },
  {
    id: 2,
    mascotImage: "/images/chameleon/04_chameleon_reading.png",
    mascotAlt: "Marline Reading Materials",
    mascotMood: "📚 ماتيريال منظمة",
    badge: "المكتبة الذكية",
    badgeIcon: BookOpen,
    themeGlow: "from-blue-500/20 via-cyan-500/10 to-primary/20",
    accentColor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    title: "إزاي توصل لموادك، الدرايف، والملخصات؟",
    subtitle: "تصفح سريع لجميع التخصصات وسلايدات المحاضرات الرسمية",
    description:
      "تصفح التخصصات الستة (CDS, AI, CYS, MA, BA, HI). في صفحة كل مادة ستجد مستودع Google Drive للمحاضرات والسكاشن، بالإضافة للملخصات الحصرية المعتمدة التي أعدها أوائل الدفعة!",
    interactiveType: "drive-preview"
  },
  {
    id: 3,
    mascotImage: "/images/chameleon/09_chameleon_idea.png",
    mascotAlt: "Marline Quiz Idea",
    mascotMood: "💡 تحديات ذكية",
    badge: "ساحة الكويزات",
    badgeIcon: Trophy,
    themeGlow: "from-amber-500/20 via-orange-500/10 to-primary/20",
    accentColor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    title: "الكويزات التفاعلية وتحديات الترتيب والعملات",
    subtitle: "تدرّب على أسئلة الامتحانات وتصدر قائمة الأوائل",
    description:
      "حل كويزات تفاعلية لكل شابتر، اختر بين التقييم الفوري أو التقليدي، واجمع كوينز كاميليون (Coins) مع كل نجاح لفتح ميزات حصرية والتصدر في ليدربورد الدفعة!",
    interactiveType: "mini-quiz"
  },
  {
    id: 4,
    mascotImage: "/images/chameleon/05_chameleon_laptop.png",
    mascotAlt: "Marline Laptop AI",
    mascotMood: "⚡ ذكاء اصطناعي 24/7",
    badge: "مختبر الإنتاجية",
    badgeIcon: BrainCircuit,
    themeGlow: "from-purple-500/20 via-violet-500/10 to-primary/20",
    accentColor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
    title: "مساعدك الذكي Marline & غرف المذاكرة",
    subtitle: "أدوات مخصصة لمناهج كليتك تجعل دراستك أسرع",
    description:
      "تحدث مع Marline AI لشرح أي مسألة أو تلخيص الشباتر، واستمتع بغرف المذاكرة الجماعية (Study Spaces) مع زملائك، بالإضافة لحاسبة الـ GPA التراكمي المحدثة باللائحة!",
    interactiveType: "ai-prompts"
  },
  {
    id: 5,
    mascotImage: "/images/chameleon/13_chameleon_celebrating.png",
    mascotAlt: "Marline Celebrating",
    mascotMood: "🎉 مبروك الانطلاق!",
    badge: "التتويج والبداية",
    badgeIcon: Rocket,
    themeGlow: "from-emerald-500/25 via-primary/20 to-secondary/25",
    accentColor: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    title: "أنت الآن جاهز لاكتساح رحلتك الأكاديمية! 🚀",
    subtitle: "تم فتح ميزات الدليل ومكافأة البداية",
    description:
      "تذكر أن هذا التوتوريال متاح لك خلال أول يومين فقط من إنشاء حسابك، ومارلين مستعد دائماً لمساعدتك عبر الزر العائم في أي وقت. انطلق واستمتع بتجربة دراسية لا مثيل لها!",
    interactiveType: "celebration"
  }
]

const STORAGE_KEYS = {
  PERMANENT_DISMISS: "chameleon_tour_permanent_dismiss",
  FIRST_VISIT: "chameleon_first_visit",
  LAST_STEP: "chameleon_tour_step"
}

export default function MarlineOnboardingTour() {
  const [isEligible, setIsEligible] = useState<boolean>(false)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [isClient, setIsClient] = useState<boolean>(false)
  const [accountAgeHours, setAccountAgeHours] = useState<number>(0)
  const [isSoundOn, setIsSoundOn] = useState<boolean>(true)
  
  // Interactive widget states
  const [activeTabDrive, setActiveTabDrive] = useState<"drive" | "summaries" | "specs">("drive")
  const [quizSelected, setQuizSelected] = useState<number | null>(null)
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false)
  const [marlineClicked, setMarlineClicked] = useState<number>(0)

  useEffect(() => {
    setIsClient(true)
    setIsSoundOn(sfx.isSoundEnabled())

    const checkEligibility = async () => {
      try {
        const permanentlyDismissed = localStorage.getItem(STORAGE_KEYS.PERMANENT_DISMISS) === "true"
        if (permanentlyDismissed) {
          setIsEligible(false)
          return
        }

        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000 // 48 hours
        let isWithinTwoDays = false
        let hoursOld = 0

        const session = await getStudentSession()
        if (session && session.created_at) {
          const createdAtTime = new Date(session.created_at).getTime()
          const ageMs = Date.now() - createdAtTime
          hoursOld = Math.floor(ageMs / (1000 * 60 * 60))
          setAccountAgeHours(hoursOld)

          if (ageMs >= 0 && ageMs <= TWO_DAYS_MS) {
            isWithinTwoDays = true
          }
        } else {
          let firstVisit = localStorage.getItem(STORAGE_KEYS.FIRST_VISIT)
          if (!firstVisit) {
            firstVisit = Date.now().toString()
            localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, firstVisit)
          }
          const ageMs = Date.now() - parseInt(firstVisit, 10)
          hoursOld = Math.floor(ageMs / (1000 * 60 * 60))
          setAccountAgeHours(hoursOld)

          if (ageMs >= 0 && ageMs <= TWO_DAYS_MS) {
            isWithinTwoDays = true
          }
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
            }, 1000)
            return () => clearTimeout(timer)
          }
        } else {
          setIsEligible(false)
          setIsOpen(false)
        }
      } catch (err) {
        console.error("Error checking onboarding eligibility:", err)
      }
    }

    checkEligibility()
  }, [])

  // Keyboard navigation support
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handleNext()
      if (e.key === "ArrowRight") handlePrev()
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

  const handleNext = () => {
    sfx.playPop()
    if (!isLastStep) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      localStorage.setItem(STORAGE_KEYS.LAST_STEP, nextStep.toString())
    } else {
      handleCompleteTour()
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

  const handleCompleteTour = () => {
    sfx.playSuccess()
    setIsOpen(false)
    localStorage.setItem(STORAGE_KEYS.PERMANENT_DISMISS, "true")
    setIsEligible(false)
  }

  const handlePermanentDismiss = () => {
    sfx.playPop()
    if (window.confirm("هل أنت متأكد من إلغاء التوتوريال نهائياً؟ لن يظهر لك مجدداً.")) {
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

  const handleMarlineClick = () => {
    sfx.playPop()
    setMarlineClicked(prev => prev + 1)
  }

  return (
    <>
      {/* ==========================================
          Floating Pro-Max Mascot Widget (Minimized Mode)
          ========================================== */}
      {!isOpen && isEligible && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed bottom-6 left-6 z-[999]"
          dir="rtl"
        >
          <div className="relative group">
            {/* Ambient Multi-layer Pulsing Ring */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-primary to-secondary rounded-full blur-md opacity-70 group-hover:opacity-100 animate-pulse transition-opacity" />

            <button
              onClick={() => {
                sfx.playSuccess()
                setIsOpen(true)
              }}
              className="relative flex items-center gap-3.5 px-4 py-2.5 rounded-full bg-background/90 dark:bg-[#10131a]/95 text-foreground font-rubik shadow-[0_12px_35px_rgba(0,0,0,0.35)] hover:scale-105 active:scale-95 transition-all duration-300 border border-emerald-500/30 backdrop-blur-xl"
              title="دليل المبتدئين التفاعلي"
            >
              {/* Animated Mascot Head with Reaction Ripple */}
              <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500/20 to-primary/20 border border-emerald-500/40 p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src={stepData.mascotImage}
                  alt="Marline Mascot"
                  width={36}
                  height={36}
                  className="object-contain transform group-hover:scale-110 transition-transform duration-300"
                />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>

              {/* Text Meta Info */}
              <div className="flex flex-col text-right">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black tracking-tight text-foreground flex items-center gap-1">
                    جولة Chameleon Pro
                    <Sparkle className="w-3 h-3 text-amber-400 fill-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  </span>
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold border-primary/30 bg-primary/10 text-primary">
                    {currentStep + 1}/{TOUR_STEPS.length}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-500" />
                  متبقي {remainingHours} ساعة في فترة الترحيب
                </span>
              </div>
            </button>
          </div>
        </motion.div>
      )}

      {/* ==========================================
          Fullscreen Cyber-Glass Holographic Tour Modal
          ========================================== */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl selection:bg-emerald-500/30"
            dir="rtl"
          >
            {/* Cinematic Radial Mesh Background */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleMinimize}
              className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-background/60 to-black/90 pointer-events-auto"
            />

            {/* Glowing Ambient Light Orbs (Optimized CSS-only) */}
            <div className="fixed top-1/4 right-1/4 w-80 h-80 bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" />
            <div className="fixed bottom-1/4 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse" style={{ animationDelay: "1.5s" }} />

            {/* Modal Card Structure */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", duration: 0.45, bounce: 0.18 }}
              className="relative z-10 w-full max-w-3xl bg-card/95 dark:bg-[#0e1118]/95 backdrop-blur-2xl border border-emerald-500/25 rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.65)] overflow-hidden font-rubik flex flex-col max-h-[92vh] will-change-transform"
            >
              {/* Dynamic Neon Gradient Ambient Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-primary to-cyan-400 shadow-[0_0_15px_rgba(16,185,129,0.8)]" />

              {/* Header: Status, Mute & Dismiss Controls */}
              <div className="px-6 py-3.5 flex items-center justify-between border-b border-border/40 bg-muted/20 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 ${stepData.accentColor}`}>
                    <stepData.badgeIcon className="w-3.5 h-3.5" />
                    <span>{stepData.badge}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline-block">
                    مستوى الإتقان: <strong className="text-foreground">{Math.round(((currentStep + 1) / TOUR_STEPS.length) * 100)}%</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Sound Effect Toggle */}
                  <button
                    onClick={handleToggleSound}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title={isSoundOn ? "كتم المؤثرات الصوتية" : "تشغيل المؤثرات الصوتية"}
                  >
                    {isSoundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {/* Permanent Dismiss */}
                  <button
                    onClick={handlePermanentDismiss}
                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    title="إلغاء التوتوريال نهائياً"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">إلغاء التوتوريال</span>
                  </button>

                  {/* Minimize */}
                  <button
                    onClick={handleMinimize}
                    className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="تصغير إلى الزر العائم"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Futuristic Stepper Progress Bar */}
              <div className="px-6 py-2.5 bg-background/40 flex items-center justify-between gap-2 border-b border-border/30">
                {TOUR_STEPS.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => handleJumpToStep(idx)}
                    className="flex-1 group py-1.5 focus:outline-none"
                    title={`الخطوة ${idx + 1}: ${step.title}`}
                  >
                    <div className="flex flex-col gap-1 items-center">
                      <div
                        className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                          idx === currentStep
                            ? "bg-gradient-to-r from-emerald-400 to-primary shadow-[0_0_12px_rgba(16,185,129,0.8)] scale-y-125"
                            : idx < currentStep
                            ? "bg-emerald-500/50"
                            : "bg-muted/60 group-hover:bg-muted-foreground/30"
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Main Content Body */}
              <div className="px-6 py-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                {/* Hero Mascot + Headline Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Interactive Mascot Hologram Avatar */}
                  <div
                    onClick={handleMarlineClick}
                    className="relative shrink-0 flex items-center justify-center cursor-pointer group select-none"
                    title="اضغط على مارلين للتحية! 🦎"
                  >
                    {/* Glowing Aura Ring */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 to-primary/30 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-300 animate-pulse" />
                    
                    <div className="relative w-36 h-36 sm:w-44 sm:h-44 p-3 rounded-3xl bg-gradient-to-b from-emerald-500/10 via-background/70 to-secondary/10 border border-emerald-500/30 shadow-inner flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
                      <Image
                        src={stepData.mascotImage}
                        alt={stepData.mascotAlt}
                        width={180}
                        height={180}
                        className="object-contain drop-shadow-[0_8px_25px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover:rotate-3"
                        priority
                      />

                      {/* Mascot Floating Mood Badge */}
                      <div className="absolute bottom-2 inset-x-2 bg-background/90 dark:bg-[#121620]/90 backdrop-blur-md px-2 py-1 rounded-xl border border-emerald-500/30 text-center shadow-md">
                        <span className="text-[11px] font-black text-emerald-400 flex items-center justify-center gap-1">
                          {stepData.mascotMood}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Step Headlines & Description */}
                  <div className="space-y-2.5 text-center sm:text-right flex-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-muted/60 text-[11px] font-bold text-muted-foreground">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      محطة التعلم {currentStep + 1} من {TOUR_STEPS.length}
                    </div>

                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-snug">
                      {stepData.title}
                    </h3>
                    <p className="text-sm font-bold text-emerald-400">
                      {stepData.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stepData.description}
                    </p>
                  </div>
                </div>

                {/* ==========================================
                    Pro-Max Interactive Mini-Widgets per Step
                    ========================================== */}
                <div className="pt-2">
                  {/* Step 1: Interactive Timeline Widget */}
                  {stepData.interactiveType === "timeline" && (
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-xl bg-background/60 border border-emerald-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-400">2024</span>
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        </div>
                        <p className="text-xs font-bold text-foreground">انطلاق Chameleon</p>
                        <p className="text-[10px] text-muted-foreground">تأسست لتلبية احتياجات طلاب حاسبات FCDS بجامعة الإسكندرية.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-background/60 border border-primary/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-primary">2025</span>
                          <BrainCircuit className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <p className="text-xs font-bold text-foreground">الكويزات وغرف المذاكرة</p>
                        <p className="text-[10px] text-muted-foreground">تدشين بنوك الأسئلة الذكية وغرف المذاكرة Study Spaces.</p>
                      </div>

                      <div className="p-3 rounded-xl bg-background/60 border border-cyan-500/20 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-cyan-400">2026</span>
                          <Rocket className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <p className="text-xs font-bold text-foreground">الجيل الثالث المتكامل</p>
                        <p className="text-[10px] text-muted-foreground">تكامل الذكاء الاصطناعي مع مارلين ومناهج الكلية الشاملة.</p>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Interactive Drive & Library Selector */}
                  {stepData.interactiveType === "drive-preview" && (
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                      <div className="flex items-center gap-2 p-1 bg-background/60 rounded-xl border border-border/50">
                        <button
                          onClick={() => { sfx.playPop(); setActiveTabDrive("drive") }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTabDrive === "drive" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          📁 ملفات Google Drive
                        </button>
                        <button
                          onClick={() => { sfx.playPop(); setActiveTabDrive("summaries") }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTabDrive === "summaries" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          📝 الملخصات المعتمدة
                        </button>
                        <button
                          onClick={() => { sfx.playPop(); setActiveTabDrive("specs") }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTabDrive === "specs" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          🏛️ التخصصات الستة
                        </button>
                      </div>

                      <div className="text-xs text-muted-foreground leading-relaxed bg-background/40 p-3 rounded-xl border border-border/40">
                        {activeTabDrive === "drive" && (
                          <p className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>تصفح ملفات المحاضرات والسكاشن بصيغ PDF وسلايدات منظمة بدون الحاجة للبحث في قنوات التليجرام.</span>
                          </p>
                        )}
                        {activeTabDrive === "summaries" && (
                          <p className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>ملخصات مكثفة لكل شابتر ومراجعات ليلة الامتحان قام بإعدادها أفضل الطلاب وأوائل الدفعات السابقة.</span>
                          </p>
                        )}
                        {activeTabDrive === "specs" && (
                          <p className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>تغطية كاملة لـ: علوم البيانات (CDS)، الذكاء الاصطناعي (AI)، الأمن السيبراني (CYS)، والمزيد!</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Interactive Mini-Quiz Experience */}
                  {stepData.interactiveType === "mini-quiz" && (
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          جرّب كويز تفاعلي سريع الآن:
                        </span>
                        {quizAnswered && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                            +10 كوينز ترحيبية 🪙
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs font-semibold text-foreground">
                        ما هو الهدف الأساسي لمنصة Chameleon FCDS؟
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 1, text: "توفير بيئة تعليمية ذكية وشاملة لطلاب الكلية", correct: true },
                          { id: 2, text: "مجرد موقع لعرض الإعلانات", correct: false }
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => {
                              setQuizSelected(opt.id)
                              setQuizAnswered(true)
                              if (opt.correct) sfx.playSuccess()
                              else sfx.playPop()
                            }}
                            className={`p-2.5 rounded-xl text-right text-xs font-medium border transition-all ${
                              quizSelected === opt.id
                                ? opt.correct
                                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold"
                                  : "bg-red-500/20 border-red-500 text-red-300"
                                : "bg-background/60 border-border/60 hover:border-amber-500/40 text-foreground"
                            }`}
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 4: AI Quick Prompt Chips */}
                  {stepData.interactiveType === "ai-prompts" && (
                    <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-2.5">
                      <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                        <BrainCircuit className="w-3.5 h-3.5" />
                        أمثلة لما يمكن لمارلين مساعدتك به:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "💬 اشرحلي خوارزميات الـ Sorting بأسلوب مبسط",
                          "📊 لخصلي أهم قوانين مادة الإحصاء",
                          "🧮 احسبلي معدلي التراكمي وتوقعات التقدير",
                          "🎧 فتح غرفة مذاكرة مع زملائي"
                        ].map((prompt, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-xl bg-background/80 border border-purple-500/20 text-xs text-foreground/80 font-medium hover:border-purple-500/50 transition-colors cursor-default"
                          >
                            {prompt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 5: Celebration & Welcome Rewards */}
                  {stepData.interactiveType === "celebration" && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-secondary/10 border border-emerald-500/30 text-center space-y-3">
                      <div className="inline-flex items-center justify-center p-3 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mb-1">
                        <GraduationCap className="w-8 h-8" />
                      </div>
                      <h4 className="text-sm font-black text-foreground">
                        تم تفعيل وسام &quot;المستكشف الجديد&quot; في ملفك الشخصي! 🌟
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        يمكنك الآن الانتقال لتصفح المواد، خوض أول كويز، أو التحدث مع مارلين. التوتوريال سيظل متاحاً لك كزر عائم لمدة يومين في حال أردت مراجعته.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer: Controls & Expiration Timer */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
                <div className="text-[11px] text-muted-foreground text-center sm:text-right flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    متاح لمدة يومين فقط (متبقي <strong className="text-foreground">{remainingHours} ساعة</strong> قبل الاختفاء التلقائي).
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      className="rounded-xl px-4 text-xs font-bold flex items-center gap-1.5 border-border hover:bg-muted/60"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      السابق
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="rounded-xl px-5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-primary text-primary-foreground shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
                  >
                    {isLastStep ? (
                      <>
                        <span>إنهاء وبدء الاستكشاف 🚀</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <span>التالي</span>
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
