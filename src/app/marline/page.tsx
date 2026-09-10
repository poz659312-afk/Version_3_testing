"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
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
  GraduationCap,
  MoreVertical,
  Pin,
  PinOff,
  Pencil,
  ArrowUp
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
import { ThemeSwitcher } from "@/components/theme-switcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  isPinned?: boolean
}

const DAILY_QUESTION_LIMIT = 20

function stripThinkingProcess(text?: string | null): string {
  if (!text || typeof text !== "string") return text || ""
  let clean = text

  // 1. Remove XML-like thinking/thought tags
  clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, "")
  clean = clean.replace(/<thought>[\s\S]*?<\/thought>/gi, "")
  clean = clean.replace(/<think>[\s\S]*$/gi, "")
  clean = clean.replace(/<thought>[\s\S]*$/gi, "")

  // 2. Remove English meta-thinking / scratchpad text at the beginning even if joined without newline
  clean = clean.replace(
    /^(?:Thinking Process:?|Thought Process:?|Internal Reasoning:?|We need to respond as|Let's craft|The user says|The user asks|The user wants)[\s\S]*?(?=[#\u0600-\u06FF]|\n\n)/i,
    ""
  )

  // 3. Remove leading English meta-planning block if Arabic content follows (even without newline)
  clean = clean.replace(
    /^[A-Za-z0-9\s,.:;'"!?()\-_/\\]+(?=[#\u0600-\u06FF])/g,
    (match) => {
      if (match.length > 25 && /(?:marline|respond|thinking|thought|user|prompt|rule|assist)/i.test(match)) {
        return ""
      }
      return match
    }
  )

  // 4. Remove markdown thinking block headers
  clean = clean.replace(
    /^\s*\*{1,2}(?:Thinking Process|Thought Process|Internal Reasoning)\*{1,2}:?[\s\S]*?(?:\n\n+|(?=[#\u0600-\u06FF]))/i,
    ""
  )

  return clean.trim()
}

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

interface ChatMessageItemProps {
  message: Message
  copiedId: string | null
  isSpeaking: string | null
  onCopy: (content: string, id: string) => void
  onSpeak: (content: string, id: string) => void
}

const ChatMessageItem = React.memo(function ChatMessageItem({
  message,
  copiedId,
  isSpeaking,
  onCopy,
  onSpeak,
}: ChatMessageItemProps) {
  return (
    <div className={`flex gap-3 sm:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
      {/* Assistant Avatar */}
      {message.role === "assistant" && (
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/25 p-0.5 shrink-0 overflow-hidden shadow-sm mt-1">
          <Image
            src={message.emotion || getMarlineEmotion(message.content)}
            alt="Marline"
            fill
            className="object-contain p-1"
          />
        </div>
      )}

      {/* Message Bubble Card */}
      <div className="max-w-[88%] sm:max-w-[82%] md:max-w-[78%] space-y-2">
        <div
          className={`p-4 sm:p-5 shadow-sm ${
            message.role === "user"
              ? "bg-primary text-primary-foreground rounded-3xl rounded-tr-md font-medium text-xs sm:text-sm md:text-[15px] leading-relaxed shadow-sm"
              : "bg-white dark:bg-white/[0.025] border border-border/70 dark:border-white/[0.08] rounded-3xl rounded-tl-md text-foreground backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none"
          }`}
        >
          {message.role === "user" ? (
            <p className="whitespace-pre-wrap leading-relaxed font-rubik">
              {message.content}
            </p>
          ) : message.content ? (
            <MarlineMarkdownRenderer content={message.content} />
          ) : (
            <div className="flex items-center gap-3 text-muted-foreground py-1.5">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
              </div>
              <span className="text-xs font-semibold font-rubik text-foreground/85">مارلين تفكر وتُحلل الإجابة...</span>
            </div>
          )}
        </div>

        {/* Bottom Metadata & Action Toolbar */}
        <div
          className={`flex items-center gap-2 text-[11px] text-muted-foreground/75 px-2 ${
            message.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <span>{message.timestamp}</span>

          {message.role === "assistant" && message.content && (
            <div className="flex items-center gap-1.5 mr-2 border-r border-border/60 dark:border-white/10 pr-2">
              <button
                onClick={() => onCopy(message.content, message.id)}
                className="p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="نسخ الإجابة"
              >
                {copiedId === message.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={() => onSpeak(message.content, message.id)}
                className={`p-1 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors cursor-pointer ${
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
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-muted/50 border border-border/60 dark:border-white/10 flex items-center justify-center shrink-0 mt-1 text-muted-foreground shadow-xs">
          <User className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </div>
      )}
    </div>
  )
})

interface MarlineChatInputProps {
  onSend: (text: string) => void
  isLoading: boolean
  dailyLimitExceeded: boolean
  dailyLimit: number
}

const MarlineChatInput = React.memo(function MarlineChatInput({
  onSend,
  isLoading,
  dailyLimitExceeded,
  dailyLimit,
}: MarlineChatInputProps) {
  const [localInput, setLocalInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!localInput.trim() || isLoading || dailyLimitExceeded) return
    onSend(localInput.trim())
    setLocalInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="w-full shrink-0 z-30 pt-1 pb-2 sm:pb-2.5 px-3 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-1.5 sm:space-y-2">
        {dailyLimitExceeded && (
          <div className="p-3 rounded-2xl bg-destructive/15 border border-destructive/35 text-destructive text-xs font-bold flex items-center gap-2.5 backdrop-blur-xl shadow-lg">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>لقد استنفدت حد الأسئلة اليومي ({dailyLimit}/{dailyLimit} أسئلة). يرجى العودة غداً للمزيد من الإرشاد الأكاديمي!</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="relative rounded-[28px] sm:rounded-[32px] bg-white/95 dark:bg-[#121318]/90 backdrop-blur-2xl border border-border/80 dark:border-white/[0.09] shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_45px_rgba(0,0,0,0.5)] focus-within:border-primary/70 focus-within:ring-4 focus-within:ring-primary/15 transition-all duration-300 p-2 sm:p-2.5 flex items-center"
        >
          <Textarea
            ref={textareaRef}
            value={localInput}
            disabled={isLoading || dailyLimitExceeded}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              dailyLimitExceeded
                ? `وصلت إلى الحد اليومي (${dailyLimit} أسئلة). يرجى العودة غداً...`
                : "اسأل مارلين عن جداول المذاكرة، الأكواد، أو استفسارات الكلية..."
            }
            rows={1}
            className="w-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm md:text-[15px] resize-none min-h-[44px] sm:min-h-[48px] max-h-32 pr-4 pl-14 py-2.5 font-rubik leading-relaxed [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          />

          <Button
            type="submit"
            disabled={!localInput.trim() || isLoading || dailyLimitExceeded}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 sm:w-10 sm:h-10 p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 flex items-center justify-center"
            title="إرسال"
          >
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          </Button>
        </form>

        <div className="flex items-center justify-center text-[10.5px] sm:text-[11px] text-muted-foreground/65 px-2 text-center font-medium">
          <span>قد ترتكب مارلين أخطاء أحياناً • المساعدة الأكاديمية والبرمجية لطلاب FCDS</span>
        </div>
      </div>
    </div>
  )
})

export default function MarlineAssistantPage() {
  const [user, setUser] = useState<StudentUser | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true)
  const [dailyUsage, setDailyUsage] = useState<number>(0)
  const [dailyLimitExceeded, setDailyLimitExceeded] = useState<boolean>(false)

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitleInput, setEditTitleInput] = useState<string>("")
  const isSidebarExpanded = isSidebarOpen || isSidebarHovered || isMenuOpen || !!editingSessionId
  const [isSpeaking, setIsSpeaking] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [currentHeaderEmotion, setCurrentHeaderEmotion] = useState("/images/chameleon/02_chameleon_waving.png")

  const rootContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isUserScrolledUpRef = useRef<boolean>(false)

  // Keep root page container locked to scrollTop 0 (prevent any scroll leakage to layout wrapper)
  useEffect(() => {
    if (rootContainerRef.current && rootContainerRef.current.scrollTop !== 0) {
      rootContainerRef.current.scrollTop = 0
    }
  })

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

  // Smart Auto-Scroll: Only scroll the messages container, NEVER ancestor containers
  useEffect(() => {
    if (!isUserScrolledUpRef.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      })
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

  // Toggle Pin Session
  const togglePinSession = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, isPinned: !s.isPinned } : s))
      localStorage.setItem("marline_chat_sessions_v3", JSON.stringify(updated))
      return updated
    })
  }

  // Rename Session
  const startRenameSession = (id: string, currentTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingSessionId(id)
    setEditTitleInput(currentTitle)
  }

  const saveRenameSession = (id: string, e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault()
    if (editTitleInput.trim()) {
      setSessions((prev) => {
        const updated = prev.map((s) => (s.id === id ? { ...s, title: editTitleInput.trim() } : s))
        localStorage.setItem("marline_chat_sessions_v3", JSON.stringify(updated))
        return updated
      })
    }
    setEditingSessionId(null)
  }

  const cancelRename = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.stopPropagation()
    setEditingSessionId(null)
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
  const handleSpeak = useCallback((text: string, msgId: string) => {
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
  }, [isSpeaking])

  // Copy Full Message
  const handleCopyMessage = useCallback(async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(msgId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }, [])

  // Send Message Logic with Real-Time SSE Token Streaming
  const handleSend = async (textToSend: string) => {
    if (!textToSend || !textToSend.trim() || isLoading) return
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
              const delta = parsed.choices?.[0]?.delta
              const deltaContent = delta?.content || ""
              if (deltaContent) {
                accumulatedText += deltaContent
                const cleanAccumulated = stripThinkingProcess(accumulatedText)
                const currentEmotion = getMarlineEmotion(cleanAccumulated)

                // Update assistant message content token-by-token live
                setSessions((prev) =>
                  prev.map((s) => {
                    if (s.id !== activeSessionId) return s
                    const newMsgs = s.messages.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: cleanAccumulated, emotion: currentEmotion } : m
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
    <div
      ref={rootContainerRef}
      className="flex w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-[#07080b] text-foreground dir-rtl font-rubik marline-page fixed inset-0 select-none-area"
    >
      {/* Google Gemini Signature Atmospheric Aura Gradients (Dynamic with Theme - Contained strictly to prevent parent scrollHeight overflow) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-24 left-1/2 gemini-aura-glow w-[90vw] max-w-[1100px] h-[500px] rounded-full blur-[70px] pointer-events-none transform-gpu will-change-transform opacity-70 dark:opacity-100"
          style={{
            background: `radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 28%, transparent) 0%, color-mix(in srgb, var(--primary) 8%, transparent) 50%, transparent 75%)`
          }}
        />
        <div
          className="absolute -bottom-24 -left-20 w-[60vw] max-w-[700px] h-[500px] rounded-full blur-[80px] opacity-30 dark:opacity-40 pointer-events-none transform-gpu will-change-transform"
          style={{
            background: `radial-gradient(circle at center, color-mix(in srgb, var(--secondary) 30%, transparent) 0%, transparent 70%)`
          }}
        />
        <div
          className="absolute top-1/3 -right-24 w-[40vw] max-w-[500px] h-[400px] rounded-full blur-[70px] opacity-20 dark:opacity-25 pointer-events-none transform-gpu will-change-transform"
          style={{
            background: `radial-gradient(circle at center, color-mix(in srgb, var(--primary) 22%, transparent) 0%, transparent 70%)`
          }}
        />
      </div>

      {/* 1. Sidebar Sessions Drawer (Collapsible on mouse leave / Expand on hover) */}
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => {
          if (!isMenuOpen) {
            setIsSidebarHovered(false)
          }
        }}
        className={`fixed inset-y-0 right-0 z-[100] h-full bg-white/70 dark:bg-[#0d0e14]/70 backdrop-blur-xl border-l border-border/50 dark:border-white/[0.08] flex flex-col justify-between transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarExpanded ? "w-72 sm:w-80 p-4 sm:p-5 shadow-2xl lg:shadow-none" : "w-16 sm:w-[68px] p-2.5"
        } ${isSidebarOpen ? "translate-x-0 shadow-2xl shadow-black/80" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Header Branding */}
          <div className={`flex items-center pb-3.5 border-b border-border/60 dark:border-white/[0.08] ${isSidebarExpanded ? "justify-between" : "justify-center"}`}>
            <Link href="/" className="flex items-center gap-2.5 group" title="Marline AI">
              <div className="relative w-9 h-9 rounded-2xl overflow-hidden border border-primary/30 bg-primary/10 flex items-center justify-center shadow-inner shrink-0">
                <Image
                  src="/images/chameleon/01_chameleon_front.png"
                  alt="Marline Logo"
                  fill
                  className="object-contain p-0.5 group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              {isSidebarExpanded && (
                <div className="overflow-hidden">
                  <span className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5 whitespace-nowrap">
                    Marline <span className="text-primary text-[10px] bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 font-mono">AI</span>
                  </span>
                  <p className="text-[10px] text-muted-foreground/75 whitespace-nowrap">ChameleonFCDS Companion</p>
                </div>
              )}
            </Link>

            {isSidebarExpanded && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* New Chat Button */}
          {isSidebarExpanded ? (
            <Button
              onClick={createNewSession}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-11 font-bold text-xs sm:text-sm shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>محادثة جديدة</span>
            </Button>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={createNewSession}
                    size="icon"
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 mx-auto flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">محادثة جديدة</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Sessions List */}
          <div
            className={`flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden marline-scroll overscroll-contain space-y-2 ${
              isSidebarExpanded ? "pr-0.5 pl-0.5" : "flex flex-col items-center px-0"
            }`}
            data-lenis-prevent="true"
          >
            {isSidebarExpanded && (
              <div className="flex items-center justify-between px-2 pt-2 mb-1">
                <span className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  سجل المحادثات
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
                  {sessions.length}
                </span>
              </div>
            )}

            {sessions
              .slice()
              .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1
                if (!a.isPinned && b.isPinned) return 1
                return 0
              })
              .map((s) => {
                const isActive = s.id === activeSessionId

                if (!isSidebarExpanded) {
                  return (
                    <TooltipProvider key={s.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setActiveSessionId(s.id)}
                            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/40"
                                : "bg-black/[0.03] dark:bg-white/[0.04] text-muted-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08] hover:text-foreground"
                            }`}
                          >
                            {s.isPinned ? (
                              <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5" />
                            )}
                            {s.isPinned && (
                              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-background" />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs max-w-xs">
                          <p className="font-semibold">{s.title || "محادثة جديدة"}</p>
                          {s.isPinned && <p className="text-[10px] text-amber-500">مثبتة 📌</p>}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                }

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (editingSessionId !== s.id) {
                        setActiveSessionId(s.id)
                        setIsSidebarOpen(false)
                      }
                    }}
                    className={`group relative flex items-center justify-between p-2.5 rounded-2xl cursor-pointer text-xs transition-all duration-200 ${
                      isActive
                        ? "bg-primary/12 dark:bg-primary/15 border border-primary/35 text-primary font-bold shadow-xs backdrop-blur-md"
                        : "hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-foreground/85 dark:text-foreground/80 border border-transparent hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0 pr-0.5 flex-1">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted/40 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10"
                        }`}
                      >
                        {s.isPinned ? (
                          <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {editingSessionId === s.id ? (
                        <form
                          onSubmit={(e) => saveRenameSession(s.id, e)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center gap-1 min-w-0"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={editTitleInput}
                            onChange={(e) => setEditTitleInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRenameSession(s.id, e)
                              if (e.key === "Escape") cancelRename(e)
                            }}
                            className="w-full bg-background/90 border border-primary/40 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <button
                            type="submit"
                            className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                            title="حفظ"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelRename}
                            className="p-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 cursor-pointer"
                            title="إلغاء"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      ) : (
                        <div className="truncate flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="truncate text-xs font-medium leading-tight">
                            {s.title || "محادثة جديدة"}
                          </span>
                          {s.isPinned && (
                            <span className="shrink-0 text-[10px] text-amber-500 font-mono">📌</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 3-Dots Dropdown Menu - Always Visible */}
                    {editingSessionId !== s.id && (
                      <div className="flex items-center shrink-0 pl-0.5" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu
                          onOpenChange={(open) => {
                            setIsMenuOpen(open)
                            if (open) setIsSidebarHovered(true)
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="p-1 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                              title="خيارات المحادثة"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            side="bottom"
                            className="w-44 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/70 dark:border-white/10 text-xs shadow-2xl p-1.5 z-[150]"
                          >
                            <DropdownMenuItem
                              onClick={(e) => togglePinSession(s.id, e)}
                              className="flex items-center gap-2 cursor-pointer rounded-xl font-medium"
                            >
                              {s.isPinned ? (
                                <>
                                  <PinOff className="w-3.5 h-3.5 text-muted-foreground" />
                                  <span>إلغاء التثبيت</span>
                                </>
                              ) : (
                                <>
                                  <Pin className="w-3.5 h-3.5 text-amber-500" />
                                  <span>تثبيت في الأعلى</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={(e) => startRenameSession(s.id, s.title || "محادثة جديدة", e)}
                              className="flex items-center gap-2 cursor-pointer rounded-xl font-medium"
                            >
                              <Pencil className="w-3.5 h-3.5 text-primary" />
                              <span>إعادة تسمية</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-border/60 dark:bg-white/10 my-1" />

                            <DropdownMenuItem
                              onClick={(e) => deleteSession(s.id, e)}
                              className="flex items-center gap-2 cursor-pointer rounded-xl text-destructive focus:text-destructive font-medium"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              <span>حذف المحادثة</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        {/* Footer Back to Platform */}
        <div className="pt-3 border-t border-border/60 dark:border-white/[0.08]">
          {isSidebarExpanded ? (
            <Link href="/">
              <Button
                variant="outline"
                className="w-full rounded-2xl border-border/70 dark:border-white/[0.08] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-xs font-medium justify-center gap-2 h-10 transition-all cursor-pointer text-foreground"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>العودة للمنصة الرئيسيّة</span>
              </Button>
            </Link>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/" className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-10 h-10 rounded-xl border-border/70 dark:border-white/[0.08] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="left">العودة للمنصة الرئيسية</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </aside>

      {/* Backdrop overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-transparent relative z-10">
        {/* Top Header Bar (Gemini Glassmorphic Navbar) */}
        <header className="h-14 sm:h-16 px-4 sm:px-6 md:px-8 border-b border-border/50 dark:border-white/[0.06] bg-white/70 dark:bg-background/60 backdrop-blur-xl flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile History / Drawer Button */}
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden rounded-2xl border-border/70 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.03] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer shadow-xs active:scale-95 shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft className="w-4 h-4 text-primary shrink-0" />
              <span className="text-[11px] hidden xs:inline">المحادثات</span>
            </Button>

            {/* Marline Dynamic Emotion Avatar with ambient halo */}
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-b from-primary/20 to-primary/5 border border-primary/25 p-0.5 shrink-0 overflow-hidden shadow-sm flex items-center justify-center">
              <Image
                src={currentHeaderEmotion}
                alt="Marline Emotion"
                fill
                className="object-contain p-1 transition-all duration-300"
              />
            </div>

            <div className="truncate">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-l from-foreground via-foreground to-primary bg-clip-text text-transparent truncate">
                  Marline AI
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-2.5 h-2.5" /> 3.0 Ultra
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground/75 truncate">
                {isLoading ? "جاري التفكير والتوليد الفائق..." : "المساعد الأكاديمي والبرمجي لكلية الحاسبات"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Daily Usage Counter Badge */}
            <Badge
              variant="outline"
              className={`text-[11px] px-3 py-1 font-bold flex items-center gap-1.5 rounded-full backdrop-blur-md shrink-0 transition-colors ${
                dailyUsage >= DAILY_QUESTION_LIMIT
                  ? "bg-destructive/15 border-destructive/35 text-destructive animate-pulse"
                  : "bg-primary/10 border-primary/25 text-primary"
              }`}
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span>
                {Math.max(0, DAILY_QUESTION_LIMIT - dailyUsage)} / {DAILY_QUESTION_LIMIT}
              </span>
            </Badge>

            {/* Desktop New Chat Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
     
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
          className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden marline-scroll overscroll-contain p-4 sm:p-6 md:p-8 space-y-6 scroll-smooth"
          data-lenis-prevent="true"
        >
          {messages.length === 0 ? (
            /* Google Gemini Style Welcome Screen */
            <div className="max-w-3xl mx-auto my-auto py-1 sm:py-2 text-center flex flex-col items-center justify-center space-y-3 sm:space-y-4 animate-in fade-in duration-500">
              {/* Floating Chameleon Mascot with Radiant Ambient Halo */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.45 }}
                className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 group cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                {/* Multi-layered dynamic radiant glow tailored to theme */}
                <div
                  className="absolute -inset-3 sm:-inset-6 rounded-full blur-2xl opacity-65 transition-all duration-700 group-hover:opacity-90"
                  style={{
                    background: `radial-gradient(circle, color-mix(in srgb, var(--primary) 50%, transparent) 0%, color-mix(in srgb, var(--primary) 15%, transparent) 50%, transparent 70%)`
                  }}
                />
                <Image
                  src="/images/chameleon/02_chameleon_waving.png"
                  alt="Marline Waving"
                  fill
                  className="object-contain relative z-10 drop-shadow-[0_12px_28px_rgba(0,0,0,0.22)] dark:drop-shadow-[0_12px_28px_rgba(0,0,0,0.6)]"
                  priority
                />
              </motion.div>

              {/* Gemini Radiant Headline & Subtitle */}
              <div className="space-y-1.5 px-2">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight flex items-center justify-center gap-1.5 flex-wrap">
                  <span className="bg-gradient-to-l from-foreground via-foreground/95 to-primary bg-clip-text text-transparent">
                    أهلاً بك! أنا مارلين (Marline)
                  </span>
                  <span className="animate-wave mr-2 inline-block text-2xl sm:text-3xl select-none" role="img" aria-label="Waving hand">👋</span>
                </h2>
                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground/80 max-w-lg mx-auto leading-relaxed font-medium">
                  رفيقتك الأكاديمية والبرمجية الذكية لشرح وتوليد الأكواد، الإرشاد حول لائحة ومقررات الكلية، وتنظيم جداول المذاكرة!
                </p>
              </div>

              {/* 4 Google Gemini Prompt Starter Cards with Left Background Watermark Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full pt-1">
                {[
                  {
                    title: "كتابة وشرح كود برمجي",
                    desc: "اكتبيلي واشرحي خوارزمية Binary Search بالـ C++ مع التعقيد الزمني",
                    prompt: "اكتبي واشرحي خوارزمية Binary Search بالـ C++ أو Python مع حساب الـ Time Complexity بالتفصيل",
                    icon: Code,
                    color: "text-primary",
                  },
                  {
                    title: "لائحة الكلية وحساب الـ CGPA",
                    desc: "شروط التخرج، الإنذار الأكاديمي وقواعد الساعات المعتمدة الرسمية",
                    prompt: "اشرح لي نظام الساعات المعتمدة في الكلية، حساب الـ CGPA، وشروط التخرج والإنذار الأكاديمي بالتفصيل",
                    icon: GraduationCap,
                    color: "text-emerald-400",
                  },
                  {
                    title: "أقسام الكلية ومقررات التخصص",
                    desc: "مقارنة شاملة بين مجالات AI, Data Science, Cyber Security, و Business",
                    prompt: "ما هي الأقسام والتخصصات المتاحة في الكلية ومقررات كل قسم (AI, DS, Cyber, BA) وما الفرق بينها؟",
                    icon: BookOpen,
                    color: "text-amber-400",
                  },
                  {
                    title: "جدول مذاكرة وخطة مراجعة",
                    desc: "تنظيم جدول زمني مكثف للمواد الدراسية قبل مواعيد الامتحانات",
                    prompt: "اعمل لي جدول مذاكرة منظّم وموزّع للمواد الدراسية قبل الامتحانات مع فترات راحة",
                    icon: Zap,
                    color: "text-purple-400",
                  }
                ].map((card, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(card.prompt)}
                    className="relative p-3 sm:p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.025] backdrop-blur-xl border border-border/70 dark:border-white/[0.08] hover:border-primary/50 hover:bg-white dark:hover:bg-white/[0.05] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group text-right cursor-pointer overflow-hidden flex items-center min-h-[66px] sm:min-h-[72px]"
                  >
                    {/* Top glass shine */}
                    <div className="absolute top-0 inset-x-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-primary/40 transition-colors" />

                    {/* Translucent Background Watermark Icon on the Left */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-15 dark:opacity-10 group-hover:opacity-30 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 z-0">
                      <card.icon className={`w-10 h-10 sm:w-11 sm:h-11 ${card.color}`} />
                    </div>

                    {/* Card Text Content on the Right */}
                    <div className="relative z-10 pl-11 pr-1">
                      <span className="font-bold text-xs sm:text-sm text-foreground/90 group-hover:text-primary transition-colors block mb-0.5">
                        {card.title}
                      </span>
                      <p className="text-[11px] sm:text-xs text-muted-foreground/75 font-normal leading-relaxed line-clamp-2">
                        "{card.desc}"
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat Messages List */
            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 pb-4">
              {messages.map((message) => (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  copiedId={copiedId}
                  isSpeaking={isSpeaking}
                  onCopy={handleCopyMessage}
                  onSpeak={handleSpeak}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 3. Floating Gemini Prompt Capsule Island */}
        <MarlineChatInput
          onSend={handleSend}
          isLoading={isLoading}
          dailyLimitExceeded={dailyLimitExceeded}
          dailyLimit={DAILY_QUESTION_LIMIT}
        />
      </main>
    </div>
  )
}
