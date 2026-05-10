"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import bcrypt from "bcryptjs"
import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Script from "next/script"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ToastProvider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowRight, 
  ArrowLeft,
  ChevronRight, 
  ChevronDown,
  Loader2,
  AlertCircle,
  Sun,
  Moon,
  Github,
  Shield,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react"
import { useTheme } from "next-themes"

async function hashPassword(plainPassword: string) {
  const saltRounds = 12
  return await bcrypt.hash(plainPassword, saltRounds)
}

// Custom dropdown (same style as Morx)
function CustomDropdown({
  id, label, value, onChange, options,
}: {
  id: string; label: string; value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  const selectedOption = options.find((option) => option.value === value)
  return (
    <div className="space-y-2" ref={dropdownRef}>
      <Label className="text-primary text-[10px] font-black tracking-[0.3em] uppercase">{label}</Label>
      <div className="relative">
        <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex h-14 w-full items-center justify-between rounded-2xl border border-border bg-background px-5 text-left text-sm hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
          <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>{selectedOption?.label || `Select ${label.toLowerCase()}`}</span>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}><ChevronDown className="w-4 h-4 text-muted-foreground" /></motion.div>
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute z-50 mt-2 w-full rounded-2xl border border-border bg-background overflow-hidden shadow-2xl">
              <div className="py-1 max-h-60 overflow-auto">
                {options.map((option) => (
                  <button key={option.value} type="button" onClick={() => { onChange(option.value); setIsOpen(false) }} className={`block w-full px-5 py-3 text-left text-sm transition-colors ${value === option.value ? "bg-primary/10 text-primary font-bold" : "text-foreground/70 hover:bg-muted"}`}>{option.label}</button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

type AuthStep = "choice" | "otp" | "name" | "specialization" | "password" | "complete"
type GoogleUserData = { email: string; name: string; picture: string; sub: string }

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(0) // 0: Splash, 1: Choice
  const [authStep, setAuthStep] = useState<AuthStep>("choice")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { addToast } = useToast()

  const [googleUserData, setGoogleUserData] = useState<GoogleUserData | null>(null)
  const [oauthProvider, setOauthProvider] = useState<"google" | "github" | null>(null)
  const [otpCode, setOtpCode] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const otpSentRef = useRef(false)
  const [otpVerificationAttempted, setOtpVerificationAttempted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [level, setLevel] = useState("")
  const [specialization, setSpecialization] = useState("")

  const [signupData, setSignupData] = useState({
    username: "", phoneNumber: "", age: "", password: "", confirmPassword: "",
  })

  useEffect(() => { setMounted(true) }, [])

  // Check if returning from OAuth callback
  useEffect(() => {
    const stepParam = searchParams.get("step")
    if (stepParam === "name" || stepParam === "name-phone") {
      setStep(1)
    }
  }, [searchParams])

  useEffect(() => {
    if (resendTimer > 0) { const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000); return () => clearInterval(interval) }
  }, [resendTimer])

  // Handle OAuth callback flow
  useEffect(() => {
    const handleAuthFlow = async () => {
      const stepParam = searchParams.get("step")
      if ((stepParam === "name" || stepParam === "name-phone") && !googleUserData && !otpSentRef.current) {
        otpSentRef.current = true
        const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const provider = session.user.app_metadata?.provider || 'google'
          setOauthProvider(provider as "google" | "github")
          setGoogleUserData({
            email: session.user.email || "",
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
            picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "",
            sub: session.user.id,
          })
          const otp = Math.floor(100000 + Math.random() * 900000).toString()
          setGeneratedOtp(otp)
          try {
            const response = await fetch('/api/send-otp', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: session.user.email, otp, name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User' })
            })
            const data = await response.json()
            if (response.ok && data.success) { setAuthStep("otp"); setResendTimer(600); setTimeout(() => addToast('Verification code sent!', 'success'), 0) }
            else setError('Failed to send verification code.')
          } catch (err) { setError('Failed to send verification code.') }
          setStep(1)
        }
      }
    }
    handleAuthFlow()
  }, [searchParams, googleUserData, addToast])

  const handleGoogleAuth = async () => {
    setLoading(true); setError(""); setOauthProvider("google")
    try {
      const supabase = createBrowserClient()
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?mode=signup&step=name`,
          queryParams: { prompt: 'select_account', access_type: 'offline' },
          scopes: "openid email profile",
        },
      })
      if (authError) { setError(authError.message); setLoading(false); return }
      if (data?.url) window.location.href = data.url
    } catch (e) { setError("The stardust failed to align. Try again?"); setLoading(false) }
  }

  const handleGithubAuth = async () => {
    setLoading(true); setError(""); setOauthProvider("github")
    try {
      const supabase = createBrowserClient()
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?mode=signup&step=name`,
          scopes: "read:user user:email",
        },
      })
      if (authError) { setError(authError.message); setLoading(false); return }
      if (data?.url) window.location.href = data.url
    } catch (e) { setError("The stardust failed to align. Try again?"); setLoading(false) }
  }

  const handleOtpVerification = () => {
    setOtpVerificationAttempted(true)
    if (otpCode === generatedOtp) { setError(""); addToast('Email verified!', 'success'); setTimeout(() => setAuthStep("name"), 500) }
    else { setError("Invalid verification code."); addToast('Invalid code', 'error') }
  }

  const handleResendOtp = async () => {
    if (!googleUserData?.email || resendTimer > 0) return
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); setGeneratedOtp(otp); setOtpCode(""); setIsLoading(true)
    try {
      const response = await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: googleUserData.email, otp, name: googleUserData.name }) })
      const data = await response.json()
      if (response.ok && data.success) { setResendTimer(600); addToast('New code sent', 'success'); setError(""); setOtpVerificationAttempted(false) } else setError('Failed to resend code.')
    } catch (err) { setError('Failed to resend code.') } finally { setIsLoading(false) }
  }

  const handleStepBack = () => {
    if (authStep === "otp") { setAuthStep("choice"); setGoogleUserData(null); setOtpCode(""); setGeneratedOtp(""); otpSentRef.current = false }
    else if (authStep === "name") { setAuthStep("choice"); setGoogleUserData(null) }
    else if (authStep === "specialization") setAuthStep("name")
    else if (authStep === "password") setAuthStep("specialization")
  }

  const handleStepForward = () => {
    if (authStep === "name") {
      if (!signupData.username.trim()) { setError("Username is required"); return }
      if (signupData.username.trim().length < 3) { setError("Username must be at least 3 characters"); return }
      setError(""); setAuthStep("specialization")
    } else if (authStep === "specialization") {
      if (!specialization) { setError("Please select a specialization"); return }
      if (!level) { setError("Please select your level"); return }
      if (!signupData.age || Number.parseInt(signupData.age) < 16 || Number.parseInt(signupData.age) > 100) { setError("Please enter a valid age (16-100)"); return }
      setError(""); setAuthStep("password")
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError("")
    if (signupData.password !== signupData.confirmPassword) { setError("Passwords do not match"); setIsLoading(false); return }
    if (signupData.password.length < 6) { setError("Password must be at least 6 characters"); setIsLoading(false); return }
    try {
      const supabase = createBrowserClient()
      const { data: existingUser } = await supabase.from("chameleons").select("username").eq("username", signupData.username).single()
      if (existingUser) { setError("Username already exists"); setIsLoading(false); return }
      let authUserId: string; const email = googleUserData?.email || `user_${Date.now()}@temp.local`
      if (googleUserData) { const { data: { user } } = await supabase.auth.getUser(); if (!user) { setError("Authentication error. Please try again."); setIsLoading(false); return }; authUserId = user.id }
      else { const { data: authData, error: authError } = await supabase.auth.signUp({ email, password: signupData.password }); if (authError || !authData.user) { setError('Failed to create account: ' + (authError?.message || 'Unknown error')); setIsLoading(false); return }; authUserId = authData.user.id }
      const hashedPassword = await hashPassword(signupData.password)
      const insertData = { username: signupData.username, phone_number: signupData.phoneNumber, pass: hashedPassword, specialization, age: Number.parseInt(signupData.age), current_level: Number.parseInt(level), is_admin: false, is_banned: false, email, profile_image: googleUserData?.picture || "", auth_id: authUserId }
      const response = await fetch('/api/users/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(insertData) })
      if (!response.ok) { const errorData = await response.json(); setError('Failed to create profile: ' + (errorData.error || 'Unknown error')); setIsLoading(false); return }
      const { data: newUser, error: insertError } = await response.json()
      if (insertError) { setError("Failed to create user profile: " + insertError.message); setIsLoading(false); return }
      if (newUser) { setAuthStep("complete"); window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { userId: newUser.user_id } })); addToast(`Welcome, ${newUser.username}!`, "success"); setTimeout(() => router.push("/"), 2000) }
    } catch (err) { setError("An error occurred. Please try again."); setIsLoading(false) }
  }

  const currentYear = () => new Date().getFullYear()
  const levelOptions = [
    { value: "1", label: `Level 1 - ${currentYear()}/${currentYear() + 1}` },
    { value: "2", label: `Level 2 - ${currentYear() - 1}/${currentYear()}` },
    { value: "3", label: `Level 3 - ${currentYear() - 2}/${currentYear() - 1}` },
    { value: "4", label: `Level 4 - ${currentYear() - 3}/${currentYear() - 2}` },
  ]
  const specializationOptions = [
    { value: "Data Science", label: "Data Science" }, { value: "Cyber Security", label: "Cyber Security" },
    { value: "Artificial Intelligence", label: "Artificial Intelligence" }, { value: "Media Analysis", label: "Media Analysis" },
    { value: "Business Analysis", label: "Business Analysis" }, { value: "Health Care", label: "Health Care" },
  ]

  const inputClassName = "h-14 bg-background border border-border rounded-2xl px-5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
  const labelClassName = "text-primary text-[10px] font-black tracking-[0.3em] uppercase"

  if (!mounted) return null

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground selection:bg-primary/30 relative font-sans flex flex-col overflow-x-hidden">
      {/* Immersive Background */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute top-[-10%] left-[-10%] size-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse dark:bg-primary/10" />
        <div className="absolute bottom-[-10%] right-[-10%] size-[600px] bg-secondary/10 rounded-full blur-[120px] animate-pulse dark:bg-secondary/10" style={{ animationDelay: '700ms' }} />
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </motion.div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10 px-4 py-20">
        {/* Persistent Branding - Absolutely Positioned */}
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
          {/* STEP 0: Splash */}
          {step === 0 && authStep === "choice" && (
            <motion.div 
              key="step0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6 lg:space-y-8"
            >
              {/* Lottie Chameleon Animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
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
                   Start your <br className="hidden xl:block" /><span className="text-primary">Legacy.</span>
                 </h1>
                 <p className="text-lg lg:text-xl text-muted-foreground font-medium max-w-sm mx-auto">Your workflow isn&apos;t just about tasks &mdash; it&apos;s about the marks you leave.</p>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={() => setStep(1)}
                  className="h-16 lg:h-20 px-10 lg:px-14 rounded-full text-xl md:text-2xl font-black italic tracking-tighter bg-foreground text-background hover:scale-105 transition-transform shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(255,255,255,0.1)] shrink-0"
                >
                  Let&apos;s Go <ArrowRight className="ml-2 size-6 lg:size-7" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Choice / Auth Flow */}
          {(step === 1 || authStep !== "choice") && (
            <motion.div 
              key={`step1-${authStep}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="w-full max-w-lg space-y-8 lg:space-y-12 py-4"
            >
              {/* Title per step */}
              {authStep === "choice" && (
                <div className="space-y-2 lg:space-y-4 text-center">
                  <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter">Enter the Core.</h2>
                  <p className="text-base lg:text-lg text-muted-foreground max-w-sm mx-auto">We exclusively use authorized digital protocols for maximum security.</p>
                </div>
              )}
              {authStep === "otp" && (
                <div className="space-y-2 lg:space-y-4 text-center">
                  <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter">Verify Identity.</h2>
                  <p className="text-base lg:text-lg text-muted-foreground max-w-sm mx-auto">We sent a verification code to {googleUserData?.email}</p>
                </div>
              )}
              {authStep === "name" && (
                <div className="space-y-2 lg:space-y-4 text-center">
                  <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter">Welcome, Explorer.</h2>
                  <p className="text-base lg:text-lg text-muted-foreground max-w-sm mx-auto">Authenticated via [{googleUserData?.email}]. Let&apos;s finalize your digital identity.</p>
                </div>
              )}
              {authStep === "specialization" && (
                <div className="space-y-2 lg:space-y-4 text-center">
                  <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter">Define your Path.</h2>
                  <p className="text-base lg:text-lg text-muted-foreground max-w-sm mx-auto">Tell us about your academic journey to personalize your experience.</p>
                </div>
              )}
              {authStep === "password" && (
                <div className="space-y-2 lg:space-y-4 text-center">
                  <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter">Secure your Legacy.</h2>
                  <p className="text-base lg:text-lg text-muted-foreground max-w-sm mx-auto">Create a strong password to protect your digital identity.</p>
                </div>
              )}

              {authStep === "complete" ? (
                <div className="space-y-2 lg:space-y-4 text-center">
                  <h2 className="text-4xl lg:text-5xl font-black italic tracking-tighter">Identity Synchronized.</h2>
                  <p className="text-base lg:text-lg text-muted-foreground max-w-sm mx-auto">Your digital workspace is ready. Redirecting...</p>
                  <div className="flex flex-col items-center gap-6 pt-8">
                    <div className="size-16 bg-primary rounded-full flex items-center justify-center">
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-2xl text-primary-foreground">✓</motion.span>
                    </div>
                    <Loader2 className="animate-spin size-6 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <form onSubmit={authStep === "password" ? handleSignup : (e) => { e.preventDefault(); handleStepForward() }}>

                  {/* OAuth choice */}
                  {authStep === "choice" && (
                    <>
                      <div className="grid gap-4 lg:gap-6">
                        <button 
                          type="button"
                          onClick={handleGoogleAuth}
                          disabled={loading}
                          className="flex items-center justify-between group p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
                        >
                          <div className="flex items-center gap-4 lg:gap-5">
                            <div className="size-10 lg:size-12 rounded-[14px] lg:rounded-2xl bg-background flex items-center justify-center p-2 lg:p-2.5 shadow-sm">
                              <svg viewBox="0 0 24 24" className="size-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            </div>
                            <div>
                              <p className="text-xl lg:text-2xl font-black italic tracking-tighter">Launch with Google</p>
                              <p className="text-[9px] lg:text-[10px] font-bold opacity-40 uppercase tracking-wider">Instant Authentication</p>
                            </div>
                          </div>
                          {loading && oauthProvider === "google" ? <Loader2 className="animate-spin size-6 lg:size-7" /> : <ChevronRight className="size-6 lg:size-7 opacity-20 group-hover:opacity-100 transition-opacity" />}
                        </button>

                        <button 
                          type="button"
                          onClick={handleGithubAuth}
                          disabled={loading}
                          className="flex items-center justify-between group p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
                        >
                          <div className="flex items-center gap-4 lg:gap-5">
                            <div className="size-10 lg:size-12 rounded-[14px] lg:rounded-2xl bg-foreground text-background flex items-center justify-center p-2 lg:p-2.5 shadow-sm group-hover:rotate-6 transition-transform ring-1 ring-background/10">
                              <Github className="size-full" />
                            </div>
                            <div>
                              <p className="text-xl lg:text-2xl font-black italic tracking-tighter">Launch with GitHub</p>
                              <p className="text-[9px] lg:text-[10px] font-bold opacity-40 uppercase tracking-wider">Developer Grade Auth</p>
                            </div>
                          </div>
                          {loading && oauthProvider === "github" ? <Loader2 className="animate-spin size-6 lg:size-7" /> : <ChevronRight className="size-6 lg:size-7 opacity-20 group-hover:opacity-100 transition-opacity" />}
                        </button>

                        {error && (
                          <div className="flex items-center gap-2 text-red-500 font-bold justify-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-sm">
                            <AlertCircle className="size-5 shrink-0" /> <span className="flex-1">{error}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 lg:pt-8 flex flex-col items-center gap-4">
                        <p className="text-muted-foreground/30 text-[9px] lg:text-[10px] font-black uppercase tracking-[0.3em]">Already initialized?</p>
                        <Link href="/auth/signin" className="text-foreground hover:text-primary font-bold underline underline-offset-8 decoration-foreground/20 hover:decoration-primary transition-all text-sm lg:text-base">Sign in to your account</Link>
                      </div>
                    </>
                  )}

                  {/* OTP */}
                  {authStep === "otp" && (
                    <div className="space-y-6">
                      <div className="size-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
                        <Shield className="size-8 text-primary" />
                      </div>
                      <div className="flex justify-center gap-2">
                        {[0, 1, 2, 3, 4, 5].map((index) => {
                          const digit = otpCode[index] || ""
                          const isCorrect = otpVerificationAttempted && otpCode === generatedOtp
                          const isWrong = otpVerificationAttempted && otpCode !== generatedOtp
                          return (
                            <Input key={index} id={`otp-${index}`} type="text" inputMode="numeric" maxLength={1} value={digit}
                              onChange={(e) => { const value = e.target.value.replace(/\D/g, ''); if (value) { const newOtp = otpCode.split(''); newOtp[index] = value; setOtpCode(newOtp.join('').slice(0, 6)); setError(""); if (index < 5) document.getElementById(`otp-${index + 1}`)?.focus() } else { const newOtp = otpCode.split(''); newOtp[index] = ''; setOtpCode(newOtp.join('')) } }}
                              onKeyDown={(e) => { if (e.key === 'Backspace' && !digit && index > 0) document.getElementById(`otp-${index - 1}`)?.focus() }}
                              className={`w-12 h-14 lg:w-14 lg:h-16 text-center text-xl lg:text-2xl font-black bg-background border-2 rounded-2xl transition-all ${isCorrect ? 'border-primary ring-2 ring-primary/20' : isWrong ? 'border-red-500 ring-2 ring-red-500/20' : 'border-border focus:border-primary/50'}`}
                            />
                          )
                        })}
                      </div>
                      {error && <div className="flex items-center gap-2 text-red-500 font-bold justify-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-sm"><AlertCircle className="size-5 shrink-0" /> <span className="flex-1">{error}</span></div>}
                      <button type="button" onClick={handleOtpVerification} disabled={otpCode.length !== 6} className="flex items-center justify-center gap-3 w-full p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all font-black italic tracking-tighter text-lg lg:text-xl disabled:opacity-50 mt-4">Verify Code <ArrowRight className="size-5" /></button>
                      <div className="flex items-center justify-between mt-4">
                        <button type="button" onClick={handleStepBack} className="text-neutral-500 hover:text-foreground transition-colors inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft className="size-4" /> Go back</button>
                        <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0} className={`text-sm font-bold ${resendTimer > 0 ? 'text-neutral-400' : 'text-primary hover:text-primary/80'} transition-colors`}>{resendTimer > 0 ? `Resend in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}` : "Resend code"}</button>
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  {authStep === "name" && (
                    <div className="space-y-4 lg:space-y-5 text-left">
                      {error && <div className="flex items-center gap-2 text-red-500 font-bold justify-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-sm"><AlertCircle className="size-5 shrink-0" /> <span className="flex-1">{error}</span></div>}
                      <div className="space-y-2"><Label className={labelClassName}>Username</Label><Input type="text" placeholder="Enter your username" value={signupData.username} onChange={(e) => setSignupData({ ...signupData, username: e.target.value })} className={inputClassName} required /></div>
                      <div className="space-y-2"><Label className={labelClassName}>Phone Number</Label><Input type="tel" placeholder="Enter your phone number" value={signupData.phoneNumber} onChange={(e) => setSignupData({ ...signupData, phoneNumber: e.target.value })} className={inputClassName} required /></div>
                      <button type="submit" className="flex items-center justify-center gap-3 w-full p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all font-black italic tracking-tighter text-lg lg:text-xl mt-6">Continue <ArrowRight className="size-5" /></button>
                      <button type="button" onClick={handleStepBack} className="text-neutral-500 hover:text-foreground transition-colors inline-flex items-center gap-2 text-sm font-bold mx-auto block pt-4"><ArrowLeft className="size-4" /> Go back</button>
                    </div>
                  )}

                  {/* Specialization */}
                  {authStep === "specialization" && (
                    <div className="space-y-4 lg:space-y-5 text-left">
                      {error && <div className="flex items-center gap-2 text-red-500 font-bold justify-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-sm"><AlertCircle className="size-5 shrink-0" /> <span className="flex-1">{error}</span></div>}
                      <div className="space-y-2"><Label className={labelClassName}>Age</Label><Input type="number" placeholder="Enter your age" value={signupData.age} onChange={(e) => setSignupData({ ...signupData, age: e.target.value })} className={inputClassName} required /></div>
                      <CustomDropdown id="level" label="Level" value={level} onChange={setLevel} options={levelOptions} />
                      <CustomDropdown id="specialization" label="Specialization" value={specialization} onChange={setSpecialization} options={specializationOptions} />
                      <button type="submit" className="flex items-center justify-center gap-3 w-full p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all font-black italic tracking-tighter text-lg lg:text-xl mt-6">Continue <ArrowRight className="size-5" /></button>
                      <button type="button" onClick={handleStepBack} className="text-neutral-500 hover:text-foreground transition-colors inline-flex items-center gap-2 text-sm font-bold mx-auto block pt-4"><ArrowLeft className="size-4" /> Go back</button>
                    </div>
                  )}

                  {/* Password */}
                  {authStep === "password" && (
                    <div className="space-y-4 lg:space-y-5 text-left">
                      {error && <div className="flex items-center gap-2 text-red-500 font-bold justify-center bg-red-500/10 p-4 rounded-2xl border border-red-500/20 text-sm"><AlertCircle className="size-5 shrink-0" /> <span className="flex-1">{error}</span></div>}
                      <div className="space-y-2"><Label className={labelClassName}>Password</Label><div className="relative"><Input type={showPassword ? "text" : "password"} placeholder="Create a password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} className={`${inputClassName} pr-12`} required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></div>
                      <div className="space-y-2"><Label className={labelClassName}>Confirm Password</Label><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} className={`${inputClassName} pr-12`} required /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></div>
                      <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-3 w-full p-4 lg:p-5 rounded-[24px] lg:rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all font-black italic tracking-tighter text-lg lg:text-xl mt-6 disabled:opacity-50">
                        {isLoading ? <Loader2 className="animate-spin size-6 lg:size-7" /> : <>Synchronize Identity <ArrowRight className="size-5" /></>}
                      </button>
                      <button type="button" onClick={handleStepBack} className="text-neutral-500 hover:text-foreground transition-colors inline-flex items-center gap-2 text-sm font-bold mx-auto block pt-4"><ArrowLeft className="size-4" /> Go back</button>
                    </div>
                  )}
                </form>
              )}
            </motion.div>
          )}

        </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
