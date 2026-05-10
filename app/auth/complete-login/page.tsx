"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ToastProvider"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Loader2 } from "lucide-react"

// Helper function to save student session
const saveStudentSession = (userData: {
  user_id: number
  username: string
  phone_number: string
  specialization: string
  age: number
  current_level: number
  is_admin: boolean
  is_banned: boolean
  created_at: string
  email?: string
  profile_image?: string
}) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("student_session", JSON.stringify(userData))
  }
}

export default function CompleteLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const sessionParam = searchParams.get("session")
    
    if (sessionParam) {
      try {
        // Decode and parse the session data
        const sessionData = JSON.parse(decodeURIComponent(sessionParam))
        
        // Save the session to localStorage
        saveStudentSession(sessionData)
        
        // Show welcome toast
        addToast(`Welcome back, ${sessionData.username}!`, "success")
        
        // Dispatch login event to fetch notifications
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { userId: sessionData.user_id }
        }))
        
        // Redirect to main page
        router.replace("/")
      } catch (error) {
        console.error("Error setting up session:", error)
        addToast("Login failed. Please try again.", "error")
        // Redirect to auth page on error
        router.replace("/auth/signin")
      }
    } else {
      // No session data, redirect to auth
      router.replace("/auth/signin")
    }
  }, [router, searchParams, addToast])

  if (!mounted) return null

  return (
    <div className="h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Aura Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] size-[700px] bg-primary/10 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-15%] left-[-10%] size-[700px] bg-secondary/10 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '500ms' }} />
      </div>

      {/* Centered Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center pt-12 relative z-10"
      >
        <Link href="/" className="flex items-center gap-2.5 font-bold group focus:outline-none">
          <div className="relative size-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
            <Image 
              src="/images/chameleon.png" 
              alt="Chameleon" 
              width={36} 
              height={36} 
              className="size-full object-cover" 
            />
          </div>
          <span className="text-xl font-bold rock-salt">Chameleon</span>
        </Link>
      </motion.div>

      {/* Loading Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10"
      >
        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter">
          Syncing<span className="text-primary">...</span>
        </h1>
        <Loader2 className="animate-spin size-8 text-muted-foreground" />
        <p className="text-muted-foreground text-sm font-medium">Completing login...</p>
      </motion.div>
    </div>
  )
}
