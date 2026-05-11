"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import bcrypt from "bcryptjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Shield,
  ChevronRight,
  ChevronDown,
  Loader2,
  AlertCircle,
  Home,
  Sparkles,
  Sun,
  Moon,
  Github,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ToastProvider"
import { useTheme } from "next-themes"

async function hashPassword(plainPassword: string) {
  const saltRounds = 12
  const hash = await bcrypt.hash(plainPassword, saltRounds)
  return hash
}

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

type AuthStep = "google" | "otp" | "name" | "specialization" | "password" | "complete"
type GoogleUserData = { email: string; name: string; picture: string; sub: string }

export default function AuthPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [level, setLevel] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [error, setError] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [previousPath, setPreviousPath] = useState("/")
  const { addToast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(0) // 0: Splash, 1: Process
  const [authStep, setAuthStep] = useState<AuthStep>("google")
  const [googleUserData, setGoogleUserData] = useState<GoogleUserData | null>(null)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [oauthProvider, setOauthProvider] = useState<"google" | "github" | null>(null)
  const [otpCode, setOtpCode] = useState("")
  const [generatedOtp, setGeneratedOtp] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const otpSentRef = useRef(false)
  const [otpVerificationAttempted, setOtpVerificationAttempted] = useState(false)
  const [loginData, setLoginData] = useState({ studentId: "", password: "" })
  const [signupData, setSignupData] = useState({ username: "", phoneNumber: "", age: "", password: "", confirmPassword: "" })
  const [loading, setLoading] = useState(false)

  // Immersive parallax effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: (e.clientX / window.innerWidth) - 0.5, y: (e.clientY / window.innerHeight) - 0.5 })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const modeParam = searchParams.get("mode")
    const stepParam = searchParams.get("step")
    if (modeParam === "signup") {
      setMode("signup"); setStep(1)
      if (stepParam === "name" || stepParam === "name-phone") setAuthStep("name")
    } else { setMode("login") }
  }, [searchParams])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const remembered = localStorage.getItem("remembered_login")
      if (remembered) { try { const { studentId, password } = JSON.parse(remembered); setLoginData({ studentId: studentId || "", password: password || "" }); setRememberMe(true) } catch {} }
    }
  }, [])

  useEffect(() => {
    const referrer = document.referrer; const returnToParam = searchParams.get("returnTo")
    if (returnToParam) setPreviousPath(returnToParam)
    else if (referrer && referrer.startsWith(window.location.origin)) { const path = new URL(referrer).pathname; setPreviousPath(path === "/auth" ? "/" : path) }
  }, [searchParams])

  useEffect(() => {
    if (resendTimer > 0) { const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000); return () => clearInterval(interval) }
  }, [resendTimer])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true); setError("")
    try {
      const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: loginData.studentId, password: loginData.password }) })
      const data = await response.json()
      if (!response.ok) { if (response.status === 429 && data.lockoutRemaining) setError(`Too many failed attempts. Try again in ${data.lockoutRemaining} minutes.`); else setError(data.error || 'Login failed'); setIsLoading(false); return }
      const userData = data.user; const authEmail = data.authEmail
      const supabase = createBrowserClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: authEmail, password: loginData.password })
      if (signInError) { setError('Authentication error. Please try again.'); setIsLoading(false); return }
      if (rememberMe) localStorage.setItem("remembered_login", JSON.stringify({ studentId: loginData.studentId, password: loginData.password })); else localStorage.removeItem("remembered_login")
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { userId: userData.user_id } })); router.push(previousPath); addToast(`Welcome back, ${userData.username}!`, "info")
    } catch (err) { setError("An error occurred. Please try again."); setIsLoading(false) }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true); setError(""); setOauthProvider("google")
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?mode=signup&step=name`, queryParams: { access_type: "offline", prompt: "select_account" }, scopes: "openid email profile" } })
      if (error) { setError("Failed to sign in with Google: " + error.message); setLoading(false) }
    } catch (err) { setError("An error occurred during Google sign-in"); setLoading(false) }
  }

  const handleGithubSignIn = async () => {
    setLoading(true); setError(""); setOauthProvider("github")
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo: `${window.location.origin}/auth/callback?mode=signup&step=name`, scopes: "read:user user:email" } })
      if (error) { setError("Failed to sign in with GitHub: " + error.message); setLoading(false) }
    } catch (err) { setError("An error occurred during GitHub sign-in"); setLoading(false) }
  }

  useEffect(() => {
    const handleAuthFlow = async () => {
      const stepParam = searchParams.get("step"); const modeParam = searchParams.get("mode")
      if ((stepParam === "name" || stepParam === "name-phone") && modeParam === "signup" && !googleUserData && !otpSentRef.current) {
        otpSentRef.current = true; const supabase = createBrowserClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const provider = session.user.app_metadata?.provider || 'google'; setOauthProvider(provider as "google" | "github")
          setGoogleUserData({ email: session.user.email || "", name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "", picture: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "", sub: session.user.id })
          const otp = Math.floor(100000 + Math.random() * 900000).toString(); setGeneratedOtp(otp)
          try {
            const response = await fetch('/api/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: session.user.email, otp, name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User' }) })
            const data = await response.json()
            if (response.ok && data.success) { setAuthStep("otp"); setResendTimer(600); setTimeout(() => addToast('Verification code sent!', 'success'), 0) } else setError('Failed to send verification code.')
          } catch (err) { setError('Failed to send verification code.') }
          setMode("signup"); setStep(1)
        }
      }
    }
    handleAuthFlow()
  }, [searchParams, googleUserData, addToast])

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
      if (newUser) { setAuthStep("complete"); window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: { userId: newUser.user_id } })); addToast(`Welcome, ${newUser.username}!`, "success"); setTimeout(() => router.push(previousPath), 2000) }
    } catch (err) { setError("An error occurred. Please try again."); setIsLoading(false) }
  }

  const toggleMode = (newMode: "login" | "signup") => {
    const newSearchParams = new URLSearchParams(searchParams.toString()); newSearchParams.set("mode", newMode)
    router.replace(`?${newSearchParams.toString()}`, { scroll: false }); setMode(newMode); setError(""); setStep(0)
  }

  const handleStepBack = () => {
    if (authStep === "otp") { setAuthStep("google"); setGoogleUserData(null); setOtpCode(""); setGeneratedOtp(""); otpSentRef.current = false }
    else if (authStep === "name") { setAuthStep("google"); setGoogleUserData(null) }
    else if (authStep === "specialization") setAuthStep("name")
    else if (authStep === "password") setAuthStep("specialization")
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

  const handleStepForward = () => {
    if (authStep === "google") setAuthStep("name")
    else if (authStep === "name") {
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
    <div className="-mt-24 -mb-12 h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden font-sans">
      {/* Dynamic Aura Background */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ x: mousePos.x * 25, y: mousePos.y * 25 }}
      >
        <div className="absolute top-[-15%] right-[-10%] size-[700px] bg-primary/10 rounded-full blur-[140px] animate-pulse transition-opacity duration-1000 dark:bg-primary/10" />
        <div className="absolute bottom-[-15%] left-[-10%] size-[700px] bg-secondary/10 rounded-full blur-[140px] animate-pulse transition-opacity duration-1000 dark:bg-secondary/10" style={{ animationDelay: '500ms' }} />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] dark:opacity-[0.02]" />
      </motion.div>

      <div className="container relative z-10 h-full flex flex-col px-4 pt-12 pb-12">
        {/* Top Branding Anchor */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between w-full mb-8 relative z-20"
        >
          <div className="flex-1" />
          <Link href="/" className="flex items-center gap-2 font-bold group focus:outline-none">
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
          <div className="flex-1 flex justify-end">
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

        <div className="flex-1 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
          {/* STATE 0: Welcome Splash */}
          {step === 0 && authStep === "google" && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -30 }}
              className="max-w-xl text-center space-y-10"
            >
              <div className="space-y-4">
                 <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-none">
                    {mode === "login" ? (
                      <>Return to <span className="text-primary">Core.</span></>
                    ) : (
                      <>Start your <span className="text-primary">Legacy.</span></>
                    )}
                 </h1>
                 <p className="text-xl text-muted-foreground font-medium tracking-wide">
                    {mode === "login"
                      ? "Ready to continue sculpting your digital workspace? The era awaits your return."
                      : "Your workflow isn\u2019t just about tasks \u2014 it\u2019s about the marks you leave. Ready to build something great?"
                    }
                 </p>
              </div>
              
              <div className="flex flex-col items-center gap-6">
                <Button 
                  onClick={() => setStep(1)}
                  className="h-20 px-14 rounded-full text-2xl font-black italic tracking-tighter bg-foreground text-background hover:scale-105 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_-15px_rgba(255,255,255,0.1)] transition-all"
                >
                  {mode === "login" ? "I am Ready" : "Let\u2019s Go"} <ArrowRight className="ml-3 size-7" />
                </Button>
                
                <div className="flex flex-col items-center gap-2">
                   <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.4em]">
                      {mode === "login" ? "First time here?" : "Already initialized?"}
                   </p>
                   <button
                     onClick={() => toggleMode(mode === "login" ? "signup" : "login")}
                     className="group text-foreground hover:text-primary font-bold transition-all flex items-center gap-2"
                   >
                     <span className="underline underline-offset-8 decoration-foreground/20 group-hover:decoration-primary">
                        {mode === "login" ? "Initialize a new identity" : "Sign in to your account"}
                     </span>
                     <Sparkles className="size-4 animate-pulse text-primary" />
                   </button>
                </div>
                
                <Link href="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-black uppercase tracking-[0.3em] transition-colors">
                  <Home className="size-3" /> Back to Surface
                </Link>
              </div>
            </motion.div>
          )}

          {/* STATE 1: Auth Steps */}
          {(step === 1 || authStep !== "google") && (
            <motion.div 
              key={`auth-${authStep}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="w-full max-w-lg space-y-14"
            >
              {/* Title */}
              {authStep === "google" && (
                <div className="space-y-4 text-center">
                  <h2 className="text-5xl font-black italic tracking-tighter">
                    {mode === "login" ? "Resync Identity." : "Enter the Core."}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {mode === "login" ? "Secure entry via authorized digital protocols." : "We exclusively use authorized digital protocols for maximum security and simplicity."}
                  </p>
                </div>
              )}

              {authStep === "otp" && (
                <div className="space-y-4 text-center">
                  <h2 className="text-5xl font-black italic tracking-tighter">Verify Identity.</h2>
                  <p className="text-lg text-muted-foreground">We sent a verification code to {googleUserData?.email}</p>
                </div>
              )}

              {authStep === "name" && (
                <div className="space-y-4 text-center">
                  <h2 className="text-5xl font-black italic tracking-tighter">Welcome, Explorer.</h2>
                  <p className="text-lg text-muted-foreground">Authenticated via [{googleUserData?.email}]. Let&apos;s finalize your digital identity.</p>
                </div>
              )}

              {authStep === "specialization" && (
                <div className="space-y-4 text-center">
                  <h2 className="text-5xl font-black italic tracking-tighter">Define your Path.</h2>
                  <p className="text-lg text-muted-foreground">Tell us about your academic journey to personalize your experience.</p>
                </div>
              )}

              {authStep === "password" && (
                <div className="space-y-4 text-center">
                  <h2 className="text-5xl font-black italic tracking-tighter">Secure your Legacy.</h2>
                  <p className="text-lg text-muted-foreground">Create a strong password to protect your digital identity.</p>
                </div>
              )}

              {authStep === "complete" ? (
                <div className="space-y-4 text-center">
                  <h2 className="text-5xl font-black italic tracking-tighter">Identity Synchronized.</h2>
                  <p className="text-lg text-muted-foreground">Your digital workspace is ready. Redirecting...</p>
                  <div className="flex flex-col items-center gap-6 pt-8">
                    <div className="size-16 bg-primary rounded-full flex items-center justify-center">
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="text-2xl text-primary-foreground">✓</motion.span>
                    </div>
                    <Loader2 className="animate-spin size-6 text-muted-foreground" />
                  </div>
                </div>
              ) : (
                <form onSubmit={mode === "login" ? handleLogin : (authStep === "password" ? handleSignup : (e) => { e.preventDefault(); handleStepForward() })}>
                  {/* OAuth Buttons */}
                  {(mode === "login" || authStep === "google") && authStep !== "otp" && (
                    <>
                      <div className="grid gap-6">
                        {/* Google */}
                        <button 
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="flex items-center justify-between group p-5 rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
                        >
                          <div className="flex items-center gap-5">
                            <div className="size-12 rounded-2xl bg-background flex items-center justify-center p-2.5 shadow-sm group-hover:rotate-6 transition-transform">
                              <svg viewBox="0 0 24 24" className="size-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            </div>
                            <div>
                              <p className="text-2xl font-black italic tracking-tighter">{mode === "login" ? "Sync via Google" : "Launch with Google"}</p>
                              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{mode === "login" ? "Biometric Level Auth" : "Instant Authentication"}</p>
                            </div>
                          </div>
                          {loading && oauthProvider === "google" ? <Loader2 className="animate-spin size-7" /> : <ChevronRight className="size-7 opacity-10 group-hover:opacity-100 transition-opacity" />}
                        </button>

                        {/* GitHub */}
                        <button 
                          type="button"
                          onClick={handleGithubSignIn}
                          disabled={loading}
                          className="flex items-center justify-between group p-5 rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all text-left shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]"
                        >
                          <div className="flex items-center gap-5">
                            <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center p-2.5 shadow-sm group-hover:rotate-6 transition-transform ring-1 ring-background/10">
                              <Github className="size-full" />
                            </div>
                            <div>
                              <p className="text-2xl font-black italic tracking-tighter">{mode === "login" ? "Sync via GitHub" : "Launch with GitHub"}</p>
                              <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">Developer Grade Auth</p>
                            </div>
                          </div>
                          {loading && oauthProvider === "github" ? <Loader2 className="animate-spin size-7" /> : <ChevronRight className="size-7 opacity-10 group-hover:opacity-100 transition-opacity" />}
                        </button>

                        {error && (
                          <div className="flex items-center gap-3 text-red-400 font-bold justify-center bg-red-400/5 p-5 rounded-[30px] border border-red-400/10">
                            <AlertCircle className="size-6" /> {error}
                          </div>
                        )}
                      </div>

                      <div className="pt-8 flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-neutral-600 text-[10px] font-black uppercase tracking-[0.4em]">{mode === "login" ? "First time here?" : "Already initialized?"}</p>
                          <button type="button" onClick={() => toggleMode(mode === "login" ? "signup" : "login")} className="group text-foreground hover:text-primary font-bold transition-all flex items-center gap-2">
                            <span className="underline underline-offset-8 decoration-foreground/20 group-hover:decoration-primary">{mode === "login" ? "Initialize a new identity" : "Sign in to your account"}</span>
                            <Sparkles className="size-4 animate-pulse text-primary" />
                          </button>
                        </div>
                        
                        <Button variant="ghost" onClick={() => setStep(0)} className="text-neutral-500 font-bold hover:text-foreground">
                          <ArrowLeft className="mr-2 size-4" /> Changed my mind
                        </Button>
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
                              className={`w-12 h-14 text-center text-xl font-black bg-background border-2 rounded-2xl transition-all ${isCorrect ? 'border-primary ring-2 ring-primary/20' : isWrong ? 'border-red-500 ring-2 ring-red-500/20' : 'border-border focus:border-primary/50'}`}
                            />
                          )
                        })}
                      </div>
                      {error && <div className="flex items-center gap-3 text-red-400 font-bold justify-center bg-red-400/5 p-4 rounded-2xl border border-red-400/10"><AlertCircle className="size-5" /> {error}</div>}
                      <button type="button" onClick={handleOtpVerification} disabled={otpCode.length !== 6} className="flex items-center justify-center gap-3 w-full group p-5 rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all font-black italic tracking-tighter text-xl disabled:opacity-50">Verify Code <ArrowRight className="size-5" /></button>
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={handleStepBack} className="text-neutral-500 hover:text-foreground transition-colors inline-flex items-center gap-2 text-sm font-bold"><ArrowLeft className="size-4" /> Go back</button>
                        <button type="button" onClick={handleResendOtp} disabled={resendTimer > 0} className={`text-sm font-bold ${resendTimer > 0 ? 'text-neutral-400' : 'text-primary hover:text-primary/80'} transition-colors`}>{resendTimer > 0 ? `Resend in ${Math.floor(resendTimer / 60)}:${(resendTimer % 60).toString().padStart(2, '0')}` : "Resend code"}</button>
                      </div>
                    </div>
                  )}

                  {/* Name */}
                  {authStep === "name" && (
                    <div className="space-y-5 text-left">
                      {error && <div className="flex items-center gap-3 text-red-400 font-bold justify-center bg-red-400/5 p-4 rounded-2xl border border-red-400/10"><AlertCircle className="size-5" /> {error}</div>}
                      <div className="space-y-2"><Label className={labelClassName}>Username</Label><Input type="text" placeholder="Enter your username" value={signupData.username} onChange={(e) => setSignupData({ ...signupData, username: e.target.value })} className={inputClassName} required /></div>
                      <div className="space-y-2"><Label className={labelClassName}>Phone Number</Label><Input type="tel" placeholder="Enter your phone number" value={signupData.phoneNumber} onChange={(e) => setSignupData({ ...signupData, phoneNumber: e.target.value })} className={inputClassName} required /></div>
                      <button type="submit" className="flex items-center justify-center gap-3 w-full group p-5 rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all font-black italic tracking-tighter text-xl mt-3">Continue <ArrowRight className="size-5" /></button>
                      <button type="button" onClick={handleStepBack} className="text-neutral-500 hover:text-foreground transition-colors inline-flex items-center gap-2 text-sm font-bold mx-auto block pt-2"><ArrowLeft className="size-4" /> Go back</button>
                    </div>
                  )}

                  {/* Specialization */}
                  {authStep === "specialization" && (
                    <div className="space-y-5 text-left">
                      {error && <div className="flex items-center gap-3 text-red-400 font-bold justify-center bg-red-400/5 p-4 rounded-2xl border border-red-400/10"><AlertCircle className="size-5" /> {error}</div>}
                      <div className="space-y-2"><Label className={labelClassName}>Age</Label><Input type="number" placeholder="Enter your age" value={signupData.age} onChange={(e) => setSignupData({ ...signupData, age: e.target.value })} className={inputClassName} required /></div>
                      <CustomDropdown id="level" label="Level" value={level} onChange={setLevel} options={levelOptions} />
                      <CustomDropdown id="specialization" label="Specialization" value={specialization} onChange={setSpecialization} options={specializationOptions} />
                      <button type="submit" className="flex items-center justify-center gap-3 w-full group p-5 rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all font-black italic tracking-tighter text-xl mt-3">Continue <ArrowRight className="size-5" /></button>
                      <button type="button" onClick={handleStepBack} className="text-neutral-500 hover:text-foreground transition-colors inline-flex items-center gap-2 text-sm font-bold mx-auto block pt-2"><ArrowLeft className="size-4" /> Go back</button>
                    </div>
                  )}

                  {/* Password */}
                  {authStep === "password" && (
                    <div className="space-y-5 text-left">
                      {error && <div className="flex items-center gap-3 text-red-400 font-bold justify-center bg-red-400/5 p-4 rounded-2xl border border-red-400/10"><AlertCircle className="size-5" /> {error}</div>}
                      <div className="space-y-2"><Label className={labelClassName}>Password</Label><div className="relative"><Input type={showPassword ? "text" : "password"} placeholder="Create a password" value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} className={`${inputClassName} pr-12`} required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></div>
                      <div className="space-y-2"><Label className={labelClassName}>Confirm Password</Label><div className="relative"><Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm your password" value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })} className={`${inputClassName} pr-12`} required /><button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">{showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></div>
                      <button type="submit" disabled={isLoading} className="flex items-center justify-center gap-3 w-full group p-5 rounded-[32px] bg-foreground text-background hover:scale-[1.02] transition-all font-black italic tracking-tighter text-xl mt-3 disabled:opacity-50">
                        {isLoading ? <Loader2 className="animate-spin size-6" /> : <>Synchronize Identity <ArrowRight className="size-5" /></>}
                      </button>
                      <button type="button" onClick={handleStepBack} className="text-neutral-500 hover:text-foreground transition-colors inline-flex items-center gap-2 text-sm font-bold mx-auto block pt-2"><ArrowLeft className="size-4" /> Go back</button>
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
