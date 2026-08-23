"use client"

import React, { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  Code,
  BookOpen,
  Calculator,
  Lightbulb,
  MessageSquare,
  PanelLeft,
  X,
  RefreshCw,
  Zap,
  GraduationCap
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MarlineMarkdownRenderer } from "@/components/MarlineMarkdownRenderer"
import { getStudentSession, type StudentUser } from "@/lib/auth"
import { Lock, ShieldAlert, Clock } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  emotion?: string
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: string
}

const DAILY_QUESTION_LIMIT = 20

function getMarlineEmotion(content: string, isThinking?: boolean, isError?: boolean): string {
  if (isThinking) return "/images/chameleon/03_chameleon_thinking.png"
  if (isError) return "/images/chameleon/08_chameleon_angry.png"

  if (content.includes("```")) return "/images/chameleon/05_chameleon_laptop.png"
  if (content.includes("$$") || content.includes("نصيحة") || content.includes("فكرة") || content.includes("شرح") || content.includes("مفهوم"))
    return "/images/chameleon/09_chameleon_idea.png"
  if (content.includes("ملخص") || content.includes("كتاب") || content.includes("قراءة") || content.includes("مستند"))
    return "/images/chameleon/04_chameleon_reading.png"
  if (content.includes("رائع") || content.includes("ممتاز") || content.includes("ناجح") || content.includes("مبروك") || content.includes("احسنت"))
    return "/images/chameleon/10_chameleon_success.png"
  if (content.includes("عذراً") || content.includes("أسف") || content.includes("خطأ") || content.includes("مشكلة"))
    return "/images/chameleon/07_chameleon_sad.png"
  if (content.includes("مساعدة") || content.includes("دعم") || content.includes("تواصل"))
    return "/images/chameleon/17_chameleon_contact_support.png"

  return "/images/chameleon/01_chameleon_front.png"
}

export default function MarlineAssistantPage() {
  const [user, setUser] = useState<StudentUser | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true)
  const [dailyUsage, setDailyUsage] = useState<number>(0)
  const [dailyLimitExceeded, setDailyLimitExceeded] = useState<boolean>(false)

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>("")
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentHeaderEmotion, setCurrentHeaderEmotion] = useState("/images/chameleon/02_chameleon_waving.png")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isUserScrolledUpRef = useRef<boolean>(false)

  // Auth Guard & Daily Question Limit Check
  useEffect(() => {
    async function initUserSession() {
      setIsAuthChecking(true)
      const student = await getStudentSession()
      setUser(student)
      setIsAuthChecking(false)

      if (student) {
        const todayStr = new Date().toISOString().slice(0, 10)
        const storageKey = `marline_daily_${student.auth_id}_${todayStr}`
        const used = parseInt(localStorage.getItem(storageKey) || "0", 10)
        setDailyUsage(used)
        if (used >= DAILY_QUESTION_LIMIT) {
          setDailyLimitExceeded(true)
        }
      }
    }
    initUserSession()
  }, [])

  // Pre-load Web Speech API voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices()
      }
    }
  }, [])

  // Initialize Chat Sessions
  useEffect(() => {
    const saved = localStorage.getItem("marline_chat_sessions_v3")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.length > 0) {
          setSessions(parsed)
          setActiveSessionId(parsed[0].id)
          return
        }
      } catch (e) {
        console.error("Error parsing saved sessions:", e)
      }
    }

    // Default new session
    const initialSession: ChatSession = {
      id: "session-" + Date.now(),
      title: "محادثة جديدة",
      messages: [],
      createdAt: new Date().toISOString()
    }
    setSessions([initialSession])
    setActiveSessionId(initialSession.id)
  }, [])

  // Save Sessions to LocalStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("marline_chat_sessions_v3", JSON.stringify(sessions))
    }
  }, [sessions])

  // Track User Scroll Position (Prevent Forced Auto-Scroll when user scrolls up)
  const handleContainerScroll = () => {
    if (!scrollContainerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120
    isUserScrolledUpRef.current = !isNearBottom
  }

  // Smart Auto-Scroll: Only scroll to bottom if user HAS NOT manually scrolled up
  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [sessions, activeSessionId, isLoading])

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0]
  const messages = activeSession?.messages || []

  // Handle New Session
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: "session-" + Date.now(),
      title: "محادثة جديدة",
      messages: [],
      createdAt: new Date().toISOString()
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    setCurrentHeaderEmotion("/images/chameleon/02_chameleon_waving.png")
    setIsSidebarOpen(false)
  }

  // Delete Session
  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = sessions.filter((s) => s.id !== id)
    if (updated.length === 0) {
      const fresh: ChatSession = {
        id: "session-" + Date.now(),
        title: "محادثة جديدة",
        messages: [],
        createdAt: new Date().toISOString()
      }
      setSessions([fresh])
      setActiveSessionId(fresh.id)
    } else {
      setSessions(updated)
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id)
      }
    }
  }

  // Helper for selecting top-quality female voice
  const getBestFemaleVoice = (isArabic: boolean): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null
    const voices = window.speechSynthesis.getVoices()
    if (!voices || voices.length === 0) return null

    if (isArabic) {
      const arFemaleKeywords = [
        "laila", "zariyah", "salma", "tarana", "maryam", "zeina", "hoda", "samira", "nour",
        "arabic (female)", "arabic female", "ar-sa", "ar-eg", "ar-ae"
      ]
      for (const kw of arFemaleKeywords) {
        const match = voices.find(
          (v) => v.lang.toLowerCase().startsWith("ar") && v.name.toLowerCase().includes(kw)
        )
        if (match) return match
      }
      const anyAr = voices.find((v) => v.lang.toLowerCase().startsWith("ar"))
      if (anyAr) return anyAr
    }

    const enFemaleKeywords = [
      "zira", "samantha", "aria", "jenny", "karen", "victoria", "susan", "hazel",
      "female", "woman", "en-us-female"
    ]
    for (const kw of enFemaleKeywords) {
      const match = voices.find(
        (v) => v.lang.toLowerCase().startsWith("en") && v.name.toLowerCase().includes(kw)
      )
      if (match) return match
    }

    return voices.find((v) => v.lang.toLowerCase().startsWith("en")) || null
  }

  // Text-To-Speech Toggle with High-Quality Female Voice
  const handleSpeak = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel()
      setIsSpeaking(null)
      return
    }

    window.speechSynthesis.cancel()
    const cleanText = text.replace(/```[\s\S]*?```/g, "كود برمجي").replace(/[#*`$_~>]/g, "")
    const isArabic = /[\u0600-\u06FF]/.test(cleanText)

    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = isArabic ? "ar-SA" : "en-US"
    utterance.pitch = 1.08 // Elegant female tone
    utterance.rate = 0.96  // Smooth, natural reading speed

    const femaleVoice = getBestFemaleVoice(isArabic)
    if (femaleVoice) {
      utterance.voice = femaleVoice
    }

    utterance.onend = () => setIsSpeaking(null)
    utterance.onerror = () => setIsSpeaking(null)

    setIsSpeaking(msgId)
    window.speechSynthesis.speak(utterance)
  }

  // Copy Full Message
  const handleCopyMessage = async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(msgId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Send Message Logic with Real-Time SSE Token Streaming
  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input
    if (!textToSend.trim() || isLoading) return
    if (!user) return

    // Check & increment daily usage limit
    const todayStr = new Date().toISOString().slice(0, 10)
    const storageKey = `marline_daily_${user.auth_id}_${todayStr}`
    const currentUsed = parseInt(localStorage.getItem(storageKey) || "0", 10)

    if (currentUsed >= DAILY_QUESTION_LIMIT) {
      setDailyLimitExceeded(true)
      return
    }

    const newUsed = currentUsed + 1
    localStorage.setItem(storageKey, newUsed.toString())
    setDailyUsage(newUsed)
    if (newUsed >= DAILY_QUESTION_LIMIT) {
      setDailyLimitExceeded(true)
    }

    // Reset user scroll state on new prompt so view auto-scrolls down for new prompt
    isUserScrolledUpRef.current = false

    const userMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    }

    const updatedTitle = messages.length === 0 ? textToSend.trim().slice(0, 25) + "..." : activeSession.title
    const updatedMessages = [...messages, userMsg]

    // Placeholder message for streaming tokens live
    const assistantMsgId = "msg-" + (Date.now() + 1)
    const assistantPlaceholder: Message = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      emotion: "/images/chameleon/03_chameleon_thinking.png"
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: updatedTitle, messages: [...updatedMessages, assistantPlaceholder] }
          : s
      )
    )

    if (!customPrompt) setInput("")
    setIsLoading(true)
    setCurrentHeaderEmotion("/images/chameleon/03_chameleon_thinking.png")

    try {
      const response = await fetch("/api/marline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_id: user.auth_id,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content }))
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `خطأ في الاتصال بالسيرفر (${response.status})`)
      }

      if (!response.body) {
        throw new Error("لم يتم استلام Stream من السيرفر")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim()
            if (jsonStr === "[DONE]") continue
            try {
              const parsed = JSON.parse(jsonStr)
              const deltaContent = parsed.choices?.[0]?.delta?.content || ""
              if (deltaContent) {
                accumulatedText += deltaContent
                const currentEmotion = getMarlineEmotion(accumulatedText)

                // Update assistant message content token-by-token live
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id !== activeSessionId) return s
                    const newMsgs = s.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: accumulatedText, emotion: currentEmotion } : m
                    )
                    return { ...s, messages: newMsgs }
                  })
                )
                setCurrentHeaderEmotion(currentEmotion)
              }
            } catch (e) {
              // Ignore partial JSON chunks
            }
          }
        }
      }

      if (!accumulatedText.trim()) {
        throw new Error("لم أتمكن من الحصول على إجابة من الذكاء الاصطناعي.")
      }

      const finalEmotion = getMarlineEmotion(accumulatedText)
      setCurrentHeaderEmotion(finalEmotion)
    } catch (error: any) {
      console.error("Marline Streaming Error:", error)
      const errorContent = `⚠️ **حدث خطأ:** ${error.message || "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}`
      
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id !== activeSessionId) return s
          const newMsgs = s.messages.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: errorContent, emotion: "/images/chameleon/08_chameleon_angry.png" }
              : m
          )
          return { ...s, messages: newMsgs }
        })
      )
      setCurrentHeaderEmotion("/images/chameleon/08_chameleon_angry.png")
    } finally {
      setIsLoading(false)
    }
  }

  // 1. Auth Loading Spinner State
  if (isAuthChecking) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background font-rubik">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="text-xs text-muted-foreground font-semibold">جاري التحقق من تسجيل الدخول...</span>
        </div>
      </div>
    )
  }

  // 2. Locked Access View if User is NOT logged in
  if (!user) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-background p-4 relative overflow-hidden font-rubik">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary),0.15),transparent_70%)] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-card/90 border border-primary/20 backdrop-blur-2xl text-center space-y-6 shadow-2xl relative z-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto text-primary shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs px-3 py-1 rounded-full font-bold">
              مطلوب تسجيل الدخول 🔒
            </Badge>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight pt-1">
              أهلاً بك في مارلين <span className="text-primary">AI</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              استخدام الرفيق الأكاديمي متاح حصرياً للطلاب المسجلين في منصة Chameleon FCDS لتقديم جداول المذاكرة والإرشاد الأكاديمي.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/auth/signin">
              <Button size="lg" className="w-full rounded-2xl h-12 text-sm font-extrabold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                <span>تسجيل الدخول إلى حسابك</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="pt-2 border-t border-border/40">
            <Link href="/" className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-semibold">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة إلى المنصة الرئيسية</span>
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full overflow-hidden bg-background text-foreground dir-rtl font-rubik marline-page fixed inset-0">
      {/* 1. Sidebar Sessions Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-[100] w-72 bg-card/95 backdrop-blur-2xl border-l border-border/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-2xl" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Header Branding */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-primary/30 bg-primary/10 flex items-center justify-center">
                <Image
                  src="/images/chameleon/01_chameleon_front.png"
                  alt="Marline Logo"
                  fill
                  className="object-contain p-0.5 group-hover:scale-110 transition-transform"
                />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
                  Marline <span className="text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">AI</span>
                </span>
                <p className="text-[10px] text-muted-foreground">ChameleonFCDS Companion</p>
              </div>
            </Link>

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl text-muted-foreground hover:text-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* New Chat Button */}
          <Button
            onClick={createNewSession}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-11 font-semibold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>محادثة جديدة</span>
          </Button>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto marline-scroll overscroll-contain space-y-1.5 pr-1 pl-1" data-lenis-prevent="true">
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 pt-2 mb-1">
              سجل المحادثات
            </div>
            {sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id)
                  setIsSidebarOpen(false)
                }}
                className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                  s.id === activeSessionId
                    ? "bg-primary/10 border border-primary/30 text-primary font-bold shadow-sm"
                    : "hover:bg-muted/50 text-foreground/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate max-w-[80%]">
                  <MessageSquare className="w-4 h-4 shrink-0 text-primary/70" />
                  <span className="truncate">{s.title}</span>
                </div>
                <button
                  onClick={(e) => deleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity p-1 rounded-lg hover:bg-muted cursor-pointer"
                  title="حذف المحادثة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Back to Platform */}
        <div className="pt-3 border-t border-border/60">
          <Link href="/">
            <Button variant="outline" className="w-full rounded-xl border-border/80 text-xs font-medium justify-center gap-2">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>العودة للمنصة الرئيسيّة</span>
            </Button>
          </Link>
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-[100dvh] max-h-[100dvh] min-h-0 overflow-hidden bg-background relative">
        {/* Top Header Bar */}
        <header className="h-14 sm:h-16 px-2.5 sm:px-4 md:px-6 border-b border-border/80 bg-card/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile History / Drawer Button */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden rounded-xl border-border/80 bg-muted/40 px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer shadow-sm active:scale-95 shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <MessageSquare className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[11px] hidden xs:inline">المحادثات</span>
            </Button>

            {/* Marline Dynamic Emotion Avatar */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 border border-primary/20 p-0.5 shrink-0 overflow-hidden shadow-inner">
              <Image
                src={currentHeaderEmotion}
                alt="Marline Emotion"
                fill
                className="object-contain p-0.5 transition-all duration-300"
              />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight text-foreground truncate">
                  Marline <span className="text-primary">AI</span>
                </h1>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                {isLoading ? "جاري التفكير والإجابة..." : "المساعد الأكاديمي للكلية"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Daily Usage Counter Badge */}
            <Badge
              variant="outline"
              className={`text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-1 font-bold flex items-center gap-1 rounded-full shrink-0 ${
                dailyUsage >= DAILY_QUESTION_LIMIT
                  ? "bg-destructive/10 border-destructive/30 text-destructive animate-pulse"
                  : "bg-primary/10 border-primary/30 text-primary"
              }`}
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span>
                {Math.max(0, DAILY_QUESTION_LIMIT - dailyUsage)} / {DAILY_QUESTION_LIMIT}
              </span>
            </Badge>

            {/* Mobile New Chat Button */}
            <Button
              variant="default"
              size="sm"
              onClick={createNewSession}
              className="lg:hidden rounded-xl bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1.5 flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[11px]">جديدة</span>
            </Button>

            {/* Desktop New Chat Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createNewSession}
                    className="rounded-xl border-border text-xs font-semibold hidden lg:flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>محادثة جديدة</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>بدء محادثة جديدة</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </header>

        {/* Messages Container / Welcome View */}
        <div
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className="flex-1 min-h-0 overflow-y-auto marline-scroll overscroll-contain p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6 scroll-smooth"
          data-lenis-prevent="true"
        >
          {messages.length === 0 ? (
            /* Welcome View */
            <div className="max-w-2xl mx-auto my-auto py-4 sm:py-8 text-center flex flex-col items-center justify-center space-y-4 sm:space-y-6">
              {/* Animated Marline Waving Mascot */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                <Image
                  src="/images/chameleon/02_chameleon_waving.png"
                  alt="Marline Waving"
                  fill
                  className="object-contain relative z-10 drop-shadow-2xl"
                  priority
                />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  أهلاً بك! أنا <span className="text-primary">مارلين (Marline)</span> 👋
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed font-rubik px-2">
                  رفيقتك الأكاديمية والبرمجية الذكية لشرح وتوليد الأكواد، الإرشاد حول لائحة ومقررات الكلية، وتنظيم جداول المذاكرة!
                </p>
              </div>

              {/* Quick Action Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full pt-2 sm:pt-4">
                <button
                  onClick={() => handleSend("اكتب واشرح لي خوارزمية Binary Search بالـ C++ أو Python مع حساب الـ Time Complexity")}
                  className="p-3 sm:p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border/80 text-right space-y-1.5 transition-all hover:scale-[1.01] hover:border-primary/40 shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Code className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>كتابة وشرح كود برمجي</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">"اكتب واشرح لي كود برمجي وخوارزمية"</p>
                </button>

                <button
                  onClick={() => handleSend("اشرح لي نظام الساعات المعتمدة في الكلية، حساب الـ CGPA، وشروط التخرج والإنذار الأكاديمي")}
                  className="p-3 sm:p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border/80 text-right space-y-1.5 transition-all hover:scale-[1.01] hover:border-primary/40 shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                    <GraduationCap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>لائحة الكلية وحساب الـ CGPA</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">"ما هي شروط التخرج وقواعد اللائحة الرسمية؟"</p>
                </button>

                <button
                  onClick={() => handleSend("ما هي الأقسام والتخصصات المتاحة في الكلية ومقررات كل قسم (AI, DS, Cyber, BA)؟")}
                  className="p-3 sm:p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border/80 text-right space-y-1.5 transition-all hover:scale-[1.01] hover:border-primary/40 shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                    <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>أقسام الكلية ومقررات التخصص</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">"قارن بين أقسام الكلية والمواد الدراسية"</p>
                </button>

                <button
                  onClick={() => handleSend("اعمل لي جدول مذاكرة منظّم وموزّع للمواد الدراسية قبل الامتحانات")}
                  className="p-3 sm:p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border/80 text-right space-y-1.5 transition-all hover:scale-[1.01] hover:border-primary/40 shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-purple-500 font-bold text-xs">
                    <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>جدول مذاكرة وخطة مراجعة</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">"اعمل لي جدول مذاكرة منظم قبل الامتحانات"</p>
                </button>
              </div>
            </div>
          ) : (
            /* Chat Messages List */
            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 sm:gap-3 md:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Assistant Avatar */}
                  {message.role === "assistant" && (
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-primary/10 border border-primary/20 p-0.5 shrink-0 overflow-hidden shadow-inner mt-1">
                      <Image
                        src={message.emotion || getMarlineEmotion(message.content)}
                        alt="Marline"
                        fill
                        className="object-contain p-0.5"
                      />
                    </div>
                  )}

                  {/* Message Bubble Card */}
                  <div className={`max-w-[90%] sm:max-w-[88%] md:max-w-[80%] space-y-1.5 sm:space-y-2`}>
                    <div
                      className={`p-3.5 sm:p-4 md:p-5 shadow-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-3xl rounded-tl-sm font-medium"
                          : "bg-card/90 dark:bg-card/95 border border-border/80 rounded-3xl rounded-tr-sm text-foreground backdrop-blur-xl"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm md:text-base font-rubik">
                          {message.content}
                        </p>
                      ) : message.content ? (
                        <MarlineMarkdownRenderer content={message.content} />
                      ) : (
                        <div className="flex items-center gap-3 text-muted-foreground py-1">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                          </div>
                          <span className="text-xs font-semibold font-rubik text-foreground/80">مارلين تفكر وتُحلل الإجابة...</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata & Action Toolbar */}
                    <div
                      className={`flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground px-2 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{message.timestamp}</span>

                      {message.role === "assistant" && message.content && (
                        <div className="flex items-center gap-1 mr-2 border-r border-border/60 pr-2">
                          <button
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="نسخ الإجابة"
                          >
                            {copiedId === message.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleSpeak(message.content, message.id)}
                            className={`p-1 rounded-md hover:bg-muted transition-colors cursor-pointer ${
                              isSpeaking === message.id ? "text-primary animate-pulse" : "text-muted-foreground hover:text-foreground"
                            }`}
                            title="قراءة صوتية"
                          >
                            {isSpeaking === message.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {message.role === "user" && (
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0 mt-1 text-muted-foreground">
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  )}
                </motion.div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 3. Pinned Texting / Input Dock */}
        <div className="p-2.5 sm:p-4 md:p-6 border-t border-border/80 bg-card/95 backdrop-blur-xl shrink-0 z-20 sticky bottom-0">
          <div className="max-w-4xl mx-auto space-y-1.5 sm:space-y-2">
            {dailyUsage >= DAILY_QUESTION_LIMIT && (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>لقد استنفدت حد الأسئلة اليومي (20/20 أسئلة). يرجى العودة غداً للمزيد من الإرشاد الأكاديمي!</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="relative flex items-center gap-2"
            >
              <Textarea
                ref={textareaRef}
                value={input}
                disabled={isLoading || dailyUsage >= DAILY_QUESTION_LIMIT}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={
                  dailyUsage >= DAILY_QUESTION_LIMIT
                    ? "وصلت إلى الحد اليومي (20 أسئلة). يرجى العودة غداً..."
                    : "اسأل مارلين عن جداول المذاكرة أو استفسارات الطلاب الجدد..."
                }
                rows={1}
                className="min-h-[46px] sm:min-h-[52px] max-h-28 sm:max-h-36 resize-none pr-3.5 pl-12 sm:pr-4 sm:pl-14 py-2.5 sm:py-3.5 rounded-2xl bg-background/80 border-border focus-visible:ring-primary text-foreground text-xs sm:text-sm md:text-base font-rubik shadow-inner disabled:opacity-60"
              />

              <Button
                type="submit"
                disabled={!input.trim() || isLoading || dailyUsage >= DAILY_QUESTION_LIMIT}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-xl w-8 h-8 sm:w-10 sm:h-10 p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-40"
              >
                <Send className="w-4 h-4 rotate-180" />
              </Button>
            </form>

            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-muted-foreground px-1.5 sm:px-2">
              <span className="text-primary font-semibold flex items-center gap-1 mr-auto sm:mr-0">
                <Sparkles className="w-3 h-3" /> Powered by Marline AI 3.0 & Nvidia
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
