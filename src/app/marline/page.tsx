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

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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

  // Text-To-Speech Toggle
  const handleSpeak = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    if (isSpeaking === msgId) {
      window.speechSynthesis.cancel()
      setIsSpeaking(null)
      return
    }

    window.speechSynthesis.cancel()
    const cleanText = text.replace(/```[\s\S]*?```/g, "كود برمجي").replace(/[#*`$_]/g, "")
    const utterance = new SpeechSynthesisUtterance(cleanText)
    utterance.lang = /[\u0600-\u06FF]/.test(cleanText) ? "ar-SA" : "en-US"
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

  // Send Message Logic
  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input
    if (!textToSend.trim() || isLoading) return

    const userMsg: Message = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })
    }

    // Update session title if first message
    const updatedTitle = messages.length === 0 ? textToSend.trim().slice(0, 25) + "..." : activeSession.title

    const updatedMessages = [...messages, userMsg]

    setSessions((prev) =>
      prev.map((s) => (s.id === activeSessionId ? { ...s, title: updatedTitle, messages: updatedMessages } : s))
    )

    if (!customPrompt) setInput("")
    setIsLoading(true)
    setCurrentHeaderEmotion("/images/chameleon/03_chameleon_thinking.png")

    try {
      const response = await fetch("/api/marline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content }))
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "عذراً، تعذر الاتصال بـ Marline AI")
      }

      const replyContent = data.choices?.[0]?.message?.content || "عذراً، لم أتمكن من الحصول على إجابة مناسبة."
      const emotion = getMarlineEmotion(replyContent)

      const assistantMsg: Message = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        content: replyContent,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        emotion: emotion
      }

      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...updatedMessages, assistantMsg] } : s))
      )
      setCurrentHeaderEmotion(emotion)
    } catch (error: any) {
      console.error("Marline Send Error:", error)
      const errorMsg: Message = {
        id: "msg-" + (Date.now() + 1),
        role: "assistant",
        content: `⚠️ **حدث خطأ:** ${error.message || "عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى."}`,
        timestamp: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        emotion: "/images/chameleon/08_chameleon_angry.png"
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, messages: [...updatedMessages, errorMsg] } : s))
      )
      setCurrentHeaderEmotion("/images/chameleon/08_chameleon_angry.png")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground dir-rtl font-rubik">
      {/* 1. Sidebar Sessions Drawer */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 bg-card/95 backdrop-blur-2xl border-l border-border/80 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
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
                <p className="text-[10px] text-muted-foreground">Chameleon Companion</p>
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
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 2. Main Chat Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        {/* Top Header Bar */}
        <header className="h-16 px-4 md:px-6 border-b border-border/80 bg-card/80 backdrop-blur-xl flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl text-foreground"
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft className="w-5 h-5" />
            </Button>

            {/* Marline Dynamic Emotion Avatar */}
            <div className="relative w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 p-0.5 shrink-0 overflow-hidden shadow-inner">
              <Image
                src={currentHeaderEmotion}
                alt="Marline Emotion"
                fill
                className="object-contain p-0.5 transition-all duration-300"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base md:text-lg tracking-tight text-foreground">
                  Marline <span className="text-primary">AI</span>
                </h1>
                <Badge variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary px-2 py-0.5">
                  FCDS Smart Companion
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isLoading ? "جاري التفكير والإجابة..." : "جاهز ومستعد لجميع استفساراتك الأكاديمية"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createNewSession}
                    className="rounded-xl border-border text-xs font-semibold hidden md:flex items-center gap-1.5"
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
        <div className="flex-1 overflow-y-auto marline-scroll overscroll-contain p-4 md:p-6 space-y-6 scroll-smooth" data-lenis-prevent="true">
          {messages.length === 0 ? (
            /* Welcome View */
            <div className="max-w-2xl mx-auto my-auto py-8 text-center flex flex-col items-center justify-center space-y-6">
              {/* Animated Marline Waving Mascot */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="relative w-40 h-40 md:w-48 md:h-48"
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
                <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  أهلاً بك! أنا <span className="text-primary">مارلين (Marline)</span> 👋
                </h2>
                <p className="text-sm md:text-base text-muted-foreground max-w-lg leading-relaxed font-rubik">
                  رفيقك الذكي المخصص لكلية الحاسبات وعلوم البيانات. يمكنني كتابة الأكواد، شرح المفاهيم، حل المسائل، وحساب معدلك الأكاديمي!
                </p>
              </div>

              {/* Quick Action Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
                <button
                  onClick={() => handleSend("اشرح لي مفهوم الـ Object-Oriented Programming (OOP) بأمثلة كود Python")}
                  className="p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border/80 text-right space-y-1.5 transition-all hover:scale-[1.01] hover:border-primary/40 shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <Code className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>برمجة وهندسة كود</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">"اشرح لي مفهوم الـ OOP بأمثلة كود Python"</p>
                </button>

                <button
                  onClick={() => handleSend("كيف أستطيع حساب الـ GPA الخاص بي وحساب تأثير المواد على التقدير؟")}
                  className="p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border/80 text-right space-y-1.5 transition-all hover:scale-[1.01] hover:border-primary/40 shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-accent font-bold text-xs">
                    <Calculator className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>حساب الـ GPA والتقديرات</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">"ازاي أحسب الـ GPA وتأثير المواد على التقدير؟"</p>
                </button>

                <button
                  onClick={() => handleSend("اعمل لي جدول مذاكرة منظّم وموزّع للمواد الدراسية قبل الامتحانات")}
                  className="p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border/80 text-right space-y-1.5 transition-all hover:scale-[1.01] hover:border-primary/40 shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                    <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>خطة مذاكرة وتنظيم</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">"اعمل لي جدول مذاكرة منظم قبل الامتحانات"</p>
                </button>

                <button
                  onClick={() => handleSend("اعطني 5 أسئلة كويز تفاعلية مع إجاباتها عن قواعد البيانات SQL")}
                  className="p-4 rounded-2xl bg-card hover:bg-muted/50 border border-border/80 text-right space-y-1.5 transition-all hover:scale-[1.01] hover:border-primary/40 shadow-sm group cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                    <Lightbulb className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>أسئلة كويز وتدريب</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">"اعطني أسئلة كويز وتدريب عن SQL"</p>
                </button>
              </div>
            </div>
          ) : (
            /* Chat Messages List */
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-3 md:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Assistant Avatar */}
                  {message.role === "assistant" && (
                    <div className="relative w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 p-0.5 shrink-0 overflow-hidden shadow-inner mt-1">
                      <Image
                        src={message.emotion || getMarlineEmotion(message.content)}
                        alt="Marline"
                        fill
                        className="object-contain p-0.5"
                      />
                    </div>
                  )}

                  {/* Message Bubble Card */}
                  <div className={`max-w-[88%] md:max-w-[80%] space-y-2`}>
                    <div
                      className={`p-4 md:p-5 shadow-lg ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-3xl rounded-tl-sm font-medium"
                          : "bg-card/90 dark:bg-card/95 border border-border/80 rounded-3xl rounded-tr-sm text-foreground backdrop-blur-xl"
                      }`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base font-rubik">
                          {message.content}
                        </p>
                      ) : (
                        <MarlineMarkdownRenderer content={message.content} />
                      )}
                    </div>

                    {/* Bottom Metadata & Action Toolbar */}
                    <div
                      className={`flex items-center gap-2 text-[11px] text-muted-foreground px-2 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{message.timestamp}</span>

                      {message.role === "assistant" && (
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
                    <div className="w-9 h-9 rounded-2xl bg-muted border border-border flex items-center justify-center shrink-0 mt-1 text-muted-foreground">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading / Thinking Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 md:gap-4 justify-start"
                >
                  <div className="relative w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 p-0.5 shrink-0 overflow-hidden shadow-inner animate-pulse">
                    <Image
                      src="/images/chameleon/03_chameleon_thinking.png"
                      alt="Marline Thinking"
                      fill
                      className="object-contain p-0.5"
                    />
                  </div>
                  <div className="p-4 rounded-3xl rounded-tr-sm bg-card/90 border border-border/80 text-muted-foreground flex items-center gap-3 shadow-md">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                    </div>
                    <span className="text-xs font-semibold font-rubik text-foreground/80">مارلين يفكر ويُحلل الإجابة...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 3. Input Dock */}
        <div className="p-4 md:p-6 border-t border-border/80 bg-card/80 backdrop-blur-xl shrink-0">
          <div className="max-w-4xl mx-auto space-y-2">
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
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="اسأل مارلين في الكود، المواد، الـ GPA، أو أي استفسار أكاديمي..."
                rows={1}
                className="min-h-[52px] max-h-36 resize-none pr-4 pl-14 py-3.5 rounded-2xl bg-background/80 border-border focus-visible:ring-primary text-foreground text-sm md:text-base font-rubik shadow-inner"
              />

              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-xl w-10 h-10 p-0 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-40"
              >
                <Send className="w-4 h-4 rotate-180" />
              </Button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-2">
              <span className="hidden sm:inline">اضغط Enter للإرسال، Shift + Enter لسطر جديد</span>
              <span className="text-primary font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Powered by Marline AI 3.0
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
