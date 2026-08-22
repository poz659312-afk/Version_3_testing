"use client"

import React, { useState, useEffect } from "react"
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
  ChevronRight,
  EyeOff,
  Flame,
  Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getStudentSession } from "@/lib/auth"

interface TourStep {
  id: number
  mascotImage: string
  mascotAlt: string
  badge: string
  badgeIcon: React.ElementType
  badgeColor: string
  title: string
  subtitle: string
  description: string
  highlights: { icon: React.ElementType; title: string; desc: string }[]
  actionButton?: {
    text: string
    href: string
    icon: React.ElementType
  }
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    mascotImage: "/images/chameleon/02_chameleon_waving.png",
    mascotAlt: "Marline Waving Welcome",
    badge: "مرحباً بك في المنصة",
    badgeIcon: Sparkles,
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    title: "أهلاً بك في Chameleon! مين إحنا ومن إمتى؟",
    subtitle: "رفيقك التعليمي والأكاديمي المتكامل لكلية الحاسبات والذكاء الاصطناعي",
    description:
      "إحنا مجتمع ومنصة Chameleon لطلاب كلية الحاسبات والمعلومات وعلوم البيانات (FCDS) بجامعة الإسكندرية. تأسست المنصة سنة 2024 بهدف تسهيل رحلتك الجامعية وتوفير كل ما تحتاجه في مكان واحد بأحدث تقنيات الذكاء الاصطناعي وبمساعدتي أنا، مارلين 🦎!",
    highlights: [
      {
        icon: Compass,
        title: "مجتمع طلابي 100%",
        desc: "صُنعت خصيصاً لتلبي احتياجات طلاب حاسبات وعلوم البيانات بدقة."
      },
      {
        icon: Clock,
        title: "منذ 2024 ومستمرون",
        desc: "تطور مستمر بمحتوى متجدد يواكب كل فصل دراسي ومناهج الكلية."
      },
      {
        icon: Star,
        title: "أكثر من 4,000 طالب",
        desc: "شبكة تعليمية متكاملة تساعدك على التفوق الأكاديمي والعملي."
      }
    ]
  },
  {
    id: 2,
    mascotImage: "/images/chameleon/04_chameleon_reading.png",
    mascotAlt: "Marline Reading Materials",
    badge: "المناهج والدرايف",
    badgeIcon: BookOpen,
    badgeColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    title: "إزاي توصل للمواد، الدرايف، والملخصات؟",
    subtitle: "كل سلايدات ومحاضرات الكلية منظمة بنقرة زر",
    description:
      "تصفح تخصصاتك الستة (علوم البيانات، الذكاء الاصطناعي، الأمن السيبراني، الميديا، بيزنس أناليتكس، والمعلوماتية الصحية). في صفحة كل مادة ستجد روابط Google Drive المباشرة لكل المحاضرات والسكاشن، بالإضافة لقسم الملخصات الحصرية المعتمدة!",
    highlights: [
      {
        icon: FolderOpen,
        title: "روابط Google Drive مباشرة",
        desc: "تصفح وحمّل ملفات المحاضرات والسكاشن والكتب الدراسية فورياً."
      },
      {
        icon: BookOpen,
        title: "ملخصات شاملة ومعتمدة",
        desc: "ملخصات لكل مادة أعدها نخبة من أوائل الدفعات لتوفير وقتك."
      },
      {
        icon: Compass,
        title: "مسارات التخصصات 6",
        desc: "دليل شامل لمقررات كل تخصص ومتطلباته الأكاديمية."
      }
    ],
    actionButton: {
      text: "تصفح التخصصات الآن",
      href: "/#specializations",
      icon: Compass
    }
  },
  {
    id: 3,
    mascotImage: "/images/chameleon/09_chameleon_idea.png",
    mascotAlt: "Marline Quiz Idea",
    badge: "الكويزات والمسابقات",
    badgeIcon: Trophy,
    badgeColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    title: "الكويزات التفاعلية وتحديات الترتيب والعملات",
    subtitle: "تدرّب على أسئلة الامتحانات وتصدر قائمة الأوائل",
    description:
      "حل كويزات تفاعلية لكل شابتر مع اختيار نظام التقييم الفوري (Instant Feedback) أو التقليدي (Traditional). محاولتك الأولى تُسجل في ليدربورد الدفعة وتكسبك كوينز كاميليون (Coins) تقدر تستبدلها بجوائز وميزات حصرية من المتجر!",
    highlights: [
      {
        icon: Flame,
        title: "بنك أسئلة لكل محاضرة",
        desc: "أسئلة مجمعة من امتحانات سابقة ومراجع مع تفسير الإجابات."
      },
      {
        icon: Trophy,
        title: "ليدربورد تنافسي",
        desc: "تنافس مع زملائك في الدفعة وتصدر ترتيب المتفوقين."
      },
      {
        icon: Zap,
        title: "كوينز وجوائز المتجر",
        desc: "اجمع العملات مع كل كويز وحقق أوسمة الإنجاز لملفك الشخصي."
      }
    ]
  },
  {
    id: 4,
    mascotImage: "/images/chameleon/05_chameleon_laptop.png",
    mascotAlt: "Marline Laptop AI",
    badge: "المساعد الذكي والأدوات",
    badgeIcon: BrainCircuit,
    badgeColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    title: "المساعد الذكي Marline & غرف المذاكرة",
    subtitle: "أدوات ذكية متطورة تجعل دراستك أسرع وأمتع",
    description:
      "تكلم مع Marline AI المساعد الذكي الذي يفهم مناهج كليتك بالعربي والإنجليزي، وذاكر مع زملائك في غرف المذاكرة الجماعية (Study Spaces) مع مؤقت بومودورو، واستخدم حاسبة الـ GPA لحساب وتوقع معدلك التراكمي بدقة!",
    highlights: [
      {
        icon: MessageSquare,
        title: "شات Marline الذكي",
        desc: "اسأل أي سؤال في المنهج واطلب تلخيص أو شرح لأي مسألة 24/7."
      },
      {
        icon: BrainCircuit,
        title: "غرف المذاكرة Study Spaces",
        desc: "مساحات دراسية تفاعلية للمذاكرة والتركيز ومشاركة الشاشات."
      },
      {
        icon: Sparkles,
        title: "حاسبة المعدل التراكمي GPA",
        desc: "احسب معدلك التراكمي والفصلي وفق اللائحة الرسمية للكلية."
      }
    ],
    actionButton: {
      text: "تحدث مع مارلين الآن",
      href: "/marline",
      icon: MessageSquare
    }
  },
  {
    id: 5,
    mascotImage: "/images/chameleon/13_chameleon_celebrating.png",
    mascotAlt: "Marline Celebrating",
    badge: "انطلق الآن",
    badgeIcon: Rocket,
    badgeColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    title: "أنت جاهز الآن لبدء رحلتك الأكاديمية! 🎉",
    subtitle: "مارلين دايماً معاك في كل خطوة بالكلية",
    description:
      "هذا التوتوريال مخصص للترحيب بك خلال أول يومين فقط من انضمامك. إذا احتجت لمراجعته، ستجدني دائماً في الزر العائم في الأسفل طوال أول يومين، أو يمكنك إلغاء التوتوريال نهائياً بنقرة واحدة. نتمنى لك فصلاً دراسياً حافلاً بالنجاح والتفوق!",
    highlights: [
      {
        icon: ShieldCheck,
        title: "ظهور لمدة يومين فقط",
        desc: "التوتوريال يختفي تلقائياً بعد مرور 48 ساعة على انضمامك للموقع."
      },
      {
        icon: HelpCircle,
        title: "دعم مستمر وإرشادات",
        desc: "فريق Chameleon جاهز دائماً لمساعدتك عبر قنوات التواصل والدعم."
      },
      {
        icon: CheckCircle2,
        title: "ابدأ الآن واستكشف",
        desc: "سجّل دخولك، استكشف المواد، وحقق أعلى المراتب!"
      }
    ]
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

  useEffect(() => {
    setIsClient(true)

    const checkEligibility = async () => {
      try {
        // Check if user has permanently dismissed the tour
        const permanentlyDismissed = localStorage.getItem(STORAGE_KEYS.PERMANENT_DISMISS) === "true"
        if (permanentlyDismissed) {
          setIsEligible(false)
          return
        }

        const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000 // 48 hours
        let isWithinTwoDays = false
        let hoursOld = 0

        // 1. Try to check logged in student user's created_at
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
          // 2. Unauthenticated visitor check (first visit tracking)
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

        // If account is strictly <= 2 days (48 hours), enable the tour
        if (isWithinTwoDays) {
          setIsEligible(true)
          
          // Restore saved step if user had progressed
          const savedStep = parseInt(localStorage.getItem(STORAGE_KEYS.LAST_STEP) || "0", 10)
          if (!isNaN(savedStep) && savedStep >= 0 && savedStep < TOUR_STEPS.length) {
            setCurrentStep(savedStep)
          }

          // Automatically open modal for fresh beginners after a subtle 1s delay
          const hasClosedInSession = sessionStorage.getItem("chameleon_tour_session_minimized") === "true"
          if (!hasClosedInSession) {
            const timer = setTimeout(() => setIsOpen(true), 1200)
            return () => clearTimeout(timer)
          }
        } else {
          // Beyond 2 days: Auto-expire and completely cleanup
          setIsEligible(false)
          setIsOpen(false)
        }
      } catch (err) {
        console.error("Error in onboarding tour check:", err)
      }
    }

    checkEligibility()
  }, [])

  // If not running on client or user account is older than 2 days, render nothing
  if (!isClient || !isEligible) {
    return null
  }

  const stepData = TOUR_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === TOUR_STEPS.length - 1
  const remainingHours = Math.max(0, 48 - accountAgeHours)

  const handleNext = () => {
    if (!isLastStep) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      localStorage.setItem(STORAGE_KEYS.LAST_STEP, nextStep.toString())
    } else {
      handleCompleteTour()
    }
  }

  const handlePrev = () => {
    if (!isFirstStep) {
      const prevStep = currentStep - 1
      setCurrentStep(prevStep)
      localStorage.setItem(STORAGE_KEYS.LAST_STEP, prevStep.toString())
    }
  }

  const handleMinimize = () => {
    setIsOpen(false)
    sessionStorage.setItem("chameleon_tour_session_minimized", "true")
  }

  const handleCompleteTour = () => {
    setIsOpen(false)
    localStorage.setItem(STORAGE_KEYS.PERMANENT_DISMISS, "true")
    setIsEligible(false)
  }

  const handlePermanentDismiss = () => {
    if (window.confirm("هل أنت متأكد من إلغاء التوتوريال نهائياً؟ لن يظهر لك مجدداً.")) {
      localStorage.setItem(STORAGE_KEYS.PERMANENT_DISMISS, "true")
      setIsOpen(false)
      setIsEligible(false)
    }
  }

  return (
    <>
      {/* Floating Mascot Trigger Button (Visible when minimized during the 2-day period) */}
      {!isOpen && isEligible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-6 z-[999] flex items-center gap-3"
          dir="rtl"
        >
          <div className="relative group">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary via-emerald-600 to-secondary text-primary-foreground font-rubik text-sm font-bold shadow-[0_8px_30px_rgba(var(--primary),0.35)] hover:shadow-[0_12px_40px_rgba(var(--primary),0.55)] hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 backdrop-blur-md"
              title="دليل المبتدئين مع مارلين"
            >
              <div className="relative w-8 h-8 rounded-full bg-white/20 p-0.5 flex items-center justify-center shrink-0">
                <Image
                  src="/images/chameleon/02_chameleon_waving.png"
                  alt="Marline Mascot"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
              </div>
              <span className="flex flex-col text-right">
                <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                  جولة المبتدئين 🦎
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-white/20 text-white border-0">
                    {currentStep + 1}/{TOUR_STEPS.length}
                  </Badge>
                </span>
                <span className="text-[10px] text-white/80 font-normal">
                  متبقي {remainingHours} ساعة في الترحيب
                </span>
              </span>
            </button>
          </div>
        </motion.div>
      )}

      {/* Main Interactive Onboarding Modal & Spotlight Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-black/75 backdrop-blur-md"
            dir="rtl"
          >
            {/* Backdrop Blur & Ambient Glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleMinimize}
              className="fixed inset-0 z-0 bg-gradient-to-tr from-primary/10 via-background/40 to-secondary/10"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
              className="relative z-10 w-full max-w-2xl bg-card/95 dark:bg-[#12141a]/95 backdrop-blur-2xl border border-primary/20 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.5)] overflow-hidden font-rubik flex flex-col max-h-[92vh]"
            >
              {/* Top Gradient Ambient Bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-400 to-secondary" />

              {/* Header: Progress & Close Controls */}
              <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${stepData.badgeColor}`}>
                    <stepData.badgeIcon className="w-3.5 h-3.5" />
                    <span>{stepData.badge}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    خطوة <strong className="text-foreground">{currentStep + 1}</strong> من {TOUR_STEPS.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePermanentDismiss}
                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                    title="إلغاء التوتوريال نهائياً"
                  >
                    <EyeOff className="w-3 h-3" />
                    <span className="hidden sm:inline">إلغاء التوتوريال</span>
                  </button>

                  <button
                    onClick={handleMinimize}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="تصغير"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Steps Indicator */}
              <div className="px-6 py-2.5 bg-background/50 flex items-center justify-between gap-1.5 border-b border-border/30">
                {TOUR_STEPS.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setCurrentStep(idx)
                      localStorage.setItem(STORAGE_KEYS.LAST_STEP, idx.toString())
                    }}
                    className="flex-1 group py-1"
                    title={`الخطوة ${idx + 1}: ${step.title}`}
                  >
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep
                          ? "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)] scale-y-125"
                          : idx < currentStep
                          ? "bg-primary/50"
                          : "bg-muted hover:bg-muted-foreground/30"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Content Body: Mascot & Details */}
              <div className="px-6 py-6 overflow-y-auto space-y-6 flex-1">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Mascot Visual Frame with Ambient Pulsing Glow */}
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-secondary/30 rounded-full blur-2xl animate-pulse" />
                    <div className="relative w-36 h-36 sm:w-44 sm:h-44 p-3 rounded-2xl bg-gradient-to-b from-primary/10 via-background/60 to-secondary/10 border border-primary/20 shadow-inner flex items-center justify-center group overflow-hidden">
                      <Image
                        src={stepData.mascotImage}
                        alt={stepData.mascotAlt}
                        width={180}
                        height={180}
                        className="object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.35)] transform group-hover:scale-105 transition-transform duration-500 select-none"
                        priority
                      />
                    </div>
                  </div>

                  {/* Step Text Details */}
                  <div className="space-y-3 text-center sm:text-right flex-1">
                    <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                      {stepData.title}
                    </h3>
                    <p className="text-sm font-medium text-primary">
                      {stepData.subtitle}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {stepData.description}
                    </p>
                  </div>
                </div>

                {/* Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {stepData.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-muted/40 border border-border/50 hover:border-primary/30 hover:bg-muted/70 transition-all duration-300 space-y-1.5"
                    >
                      <div className="flex items-center gap-2 text-primary font-bold text-xs">
                        <div className="p-1.5 rounded-lg bg-primary/10">
                          <h.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <span>{h.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {h.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Optional Step Direct Action Link */}
                {stepData.actionButton && (
                  <div className="pt-1 flex justify-center sm:justify-start">
                    <Link
                      href={stepData.actionButton.href}
                      onClick={handleMinimize}
                      className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline bg-primary/10 hover:bg-primary/15 px-4 py-2 rounded-full border border-primary/20 transition-colors"
                    >
                      <stepData.actionButton.icon className="w-3.5 h-3.5" />
                      <span>{stepData.actionButton.text}</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Footer Actions: Navigation & Expiration Notice */}
              <div className="px-6 py-4 bg-muted/30 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-[11px] text-muted-foreground text-center sm:text-right">
                  <span className="inline-flex items-center gap-1 text-amber-500 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    متاح لمدة يومين:
                  </span>{" "}
                  يختفي التوتوريال تلقائياً بعد {remainingHours} ساعة من إنشاء الحساب.
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrev}
                      className="rounded-xl px-4 text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      السابق
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="rounded-xl px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:shadow-primary/40 flex items-center gap-1.5"
                  >
                    {isLastStep ? (
                      <>
                        <span>إنهاء وبدء الاستكشاف</span>
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
