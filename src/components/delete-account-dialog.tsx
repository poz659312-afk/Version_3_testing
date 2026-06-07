"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, AlertTriangle, Heart, Clock, PartyPopper, Skull } from "lucide-react"
import { useToast } from "@/components/ToastProvider"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

interface DeleteAccountDialogProps {
  userId: number
  username: string
  quizCount: number
  deletionScheduledAt?: string | null
  onDeletionScheduled?: () => void
  onDeletionCancelled?: () => void
}

// Sarcastic messages for different stages
const SARCASTIC_MESSAGES = {
  initial: [
    "So you want to abandon us? After all we've been through?",
    "Warning: Your data will miss you more than you'll miss it",
    "Your quiz attempts are already crying in anticipation",
  ],
  confirmation: [
    "Fine. We'll wait 14 days. Maybe you'll miss us... probably not, but maybe.",
    "Last chance to back out! Your { quizCount } quizzes are begging for mercy",
    "Type 'DELETE' below to prove you're not just having a bad day",
  ],
  scheduled: [
    "T-minus { days } days until your dramatic exit",
    "Still time to change your mind... just saying",
    "Your account is on death row. Pretty dark, right?",
  ],
  cancelled: [
    "Oh thank goodness! We were getting worried!",
    "We knew you couldn't stay away! Welcome back!",
    "Plot twist: You actually like us! (We like you too)",
  ],
  farewell: [
    "It's been real. It's been fun. It hasn't been real fun. Goodbye.",
    "Don't let the digital door hit you on the way out!",
    "May your future quizzes be forever untracked",
  ]
}

export function DeleteAccountDialog({
  userId,
  username,
  quizCount,
  deletionScheduledAt,
  onDeletionScheduled,
  onDeletionCancelled,
}: DeleteAccountDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"initial" | "confirm" | "scheduled">("initial")
  const [confirmText, setConfirmText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const [actualQuizCount, setActualQuizCount] = useState<number | null>(null)
  const [isCountLoading, setIsCountLoading] = useState(false)
  const { addToast } = useToast()

  // Calculate days remaining if deletion is scheduled
  useEffect(() => {
    if (deletionScheduledAt) {
      const deletionDate = new Date(deletionScheduledAt)
      const now = new Date()
      const diffTime = deletionDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays > 0 ? diffDays : 0)
      setStep("scheduled")
    } else {
      setStep("initial")
      setDaysRemaining(null)
    }
  }, [deletionScheduledAt])

  // Fetch actual quiz count from database when dialog opens
  useEffect(() => {
    if (open) {
      const fetchQuizCount = async () => {
        setIsCountLoading(true)
        try {
          const supabase = createClient()
          const { count, error } = await supabase
            .from("quiz_data")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
          
          if (!error && count !== null) {
            setActualQuizCount(count)
          }
        } catch (err) {
          console.error("Error fetching actual quiz count:", err)
        } finally {
          setIsCountLoading(false)
        }
      }
      fetchQuizCount()
    }
  }, [open, userId])

  const displayQuizCount = actualQuizCount !== null ? actualQuizCount : quizCount

  const handleScheduleDeletion = async () => {
    if (confirmText.toUpperCase() !== "DELETE") {
      addToast("Please type DELETE to confirm. We need to know you're serious.", "error")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/delete-account/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to schedule deletion")
      }

      const data = await response.json()
      
      addToast(
        SARCASTIC_MESSAGES.farewell[Math.floor(Math.random() * SARCASTIC_MESSAGES.farewell.length)],
        "success"
      )
      
      // Update local state immediately to show countdown
      setStep("scheduled")
      setDaysRemaining(14)
      
      // Close dialog and reload to get fresh data
      setOpen(false)
      onDeletionScheduled?.()
    } catch (error) {
      console.error("Error scheduling deletion:", error)
      addToast("Failed to schedule deletion. The universe wants you to stay!", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelDeletion = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/delete-account/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel deletion")
      }

      addToast(
        SARCASTIC_MESSAGES.cancelled[Math.floor(Math.random() * SARCASTIC_MESSAGES.cancelled.length)],
        "success"
      )
      
      setStep("initial")
      setDaysRemaining(null)
      setConfirmText("")
      onDeletionCancelled?.()
      setOpen(false)
    } catch (error) {
      console.error("Error cancelling deletion:", error)
      addToast("Failed to cancel deletion. Please try again!", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const renderInitialStep = () => (
    <>
      {/* Background glow effects inside the dialog */}
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />
      
      <DialogHeader className="relative z-10">
        <DialogTitle className="text-lg font-black tracking-tight text-red-500 dark:text-red-400 leading-tight">
          {SARCASTIC_MESSAGES.initial[0]}
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground/90 mt-1.5 leading-relaxed">
          Look, we get it. Sometimes you just need to burn it all down and start fresh. 
          But before you go full scorched earth, here's what you'll be losing:
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2.5 py-3 relative z-10">
        {/* What will be deleted card */}
        <div className="bg-red-500/5 dark:bg-red-950/10 border-2 border-red-500/20 border-b-[3px] border-b-red-500/30 rounded-xl p-3 space-y-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]">
          <h4 className="font-bold text-red-500 dark:text-red-400 flex items-center gap-1.5 text-xs">
            <Trash2 className="w-4 h-4" />
            Things that will be obliterated:
          </h4>
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              <span><strong>{displayQuizCount}</strong> quiz attempts (they had dreams, you know)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              <span>All your notifications (the good ones AND the bad ones)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500/60" />
              <span>Your beloved Chameleon profile (R.I.P. <strong className="text-foreground">{username}</strong>)</span>
            </li>
          </ul>
        </div>

        {/* Timer explanation card */}
        <div className="bg-amber-500/5 dark:bg-amber-950/10 border-2 border-amber-500/20 border-b-[3px] border-b-amber-500/30 rounded-xl p-3 space-y-1 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01]">
          <h4 className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-xs">
            <Clock className="w-4 h-4" />
            The 14-Day Cooling Off Period
          </h4>
          <p className="text-xs text-muted-foreground leading-normal">
            Because we're hopeless romantics, we'll wait 14 days before actually deleting anything. 
            You know, in case you realize you can't live without us. 
            <span className="italic block mt-0.5 text-[10px] text-amber-500/80"> (No pressure though... okay maybe a little pressure)</span>
          </p>
        </div>
      </div>

      <DialogFooter className="gap-2 flex-row w-full mt-2 relative z-10">
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          className="flex-1 h-10 text-xs font-bold rounded-xl border-2 border-b-[3px] border-green-500/30 border-b-green-700/40 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-all active:border-b-2 active:translate-y-[1.5px]"
        >
          <Heart className="w-3.5 h-3.5 mr-1.5" />
          Nevermind, I love it here!
        </Button>
        <Button
          variant="destructive"
          onClick={() => setStep("confirm")}
          className="flex-1 h-10 text-xs font-bold rounded-xl border-2 border-b-[3px] border-red-500 border-b-red-700 bg-red-500 text-white hover:brightness-105 transition-all active:border-b-2 active:translate-y-[1.5px]"
        >
          <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
          I'm sure, proceed...
        </Button>
      </DialogFooter>
    </>
  )

  const renderConfirmStep = () => (
    <>
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

      <DialogHeader className="relative z-10">
        <DialogTitle className="flex items-center gap-1.5 text-lg font-black tracking-tight text-red-500 dark:text-red-400 leading-tight">
          <AlertTriangle className="w-5 h-5 animate-pulse text-red-500" />
          Last Chance, {username}!
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground/90 mt-1.5 leading-relaxed space-y-1.5">
          <p className="text-xs font-bold text-amber-500 dark:text-amber-400">
            {SARCASTIC_MESSAGES.confirmation[1].replace("{ quizCount }", String(displayQuizCount))}
          </p>
          <p>
            Okay okay, we believe you. But we need you to prove you're not just having 
            a Monday (even if it's not Monday).
          </p>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-3 relative z-10">
        <div className="space-y-1.5">
          <Label htmlFor="confirm-delete" className="text-xs font-bold text-muted-foreground/80">
            Type <span className="text-red-500 font-black">DELETE</span> to confirm:
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE here..."
            className="h-10 bg-background/50 border-2 border-border/50 placeholder:text-muted-foreground/40 rounded-xl focus:border-red-500 focus:ring-red-500/20 text-center font-bold tracking-widest text-base transition-all"
          />
        </div>

        <p className="text-[10px] text-muted-foreground/60 italic text-center">
          Fun fact: Most people who get this far chicken out. No shame in it!
        </p>
      </div>

      <DialogFooter className="gap-2 flex-row w-full mt-2 relative z-10">
        <Button
          variant="outline"
          onClick={() => {
            setStep("initial")
            setConfirmText("")
          }}
          className="flex-1 h-10 text-xs font-bold rounded-xl border-2 border-b-[3px] border-green-500/30 border-b-green-700/40 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 transition-all active:border-b-2 active:translate-y-[1.5px]"
        >
          Wait, let reconsider...
        </Button>
        <Button
          variant="destructive"
          onClick={handleScheduleDeletion}
          disabled={isLoading || confirmText.toUpperCase() !== "DELETE"}
          className="flex-1 h-10 text-xs font-bold rounded-xl border-2 border-b-[3px] border-red-500 border-b-red-700 bg-red-500 text-white hover:brightness-105 transition-all active:border-b-2 active:translate-y-[1.5px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-1.5" />
          ) : (
            <Skull className="w-3.5 h-3.5 mr-1.5" />
          )}
          Schedule Departure
        </Button>
      </DialogFooter>
    </>
  )

  const renderScheduledStep = () => (
    <>
      <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[60%] h-[60%] bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

      <DialogHeader className="relative z-10">
        <DialogTitle className="flex items-center gap-1.5 text-lg font-black tracking-tight text-amber-500 leading-tight">
          <Clock className="w-5 h-5 animate-spin-slow text-amber-500" />
          Countdown Initiated
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground/90 mt-1.5 leading-relaxed space-y-1">
          <p className="text-lg font-black text-red-500 dark:text-red-400">
            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
          </p>
          <p className="text-xs font-semibold text-foreground/85">
            {SARCASTIC_MESSAGES.scheduled[1]}
          </p>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-3 py-3 relative z-10">
        {/* Countdown visual card */}
        <div className="bg-gradient-to-br from-red-500/10 to-amber-500/10 border-2 border-red-500/20 border-b-[3px] border-b-red-500/30 rounded-xl p-4 text-center backdrop-blur-sm">
          <div className="text-4xl font-black text-red-500 dark:text-red-400 mb-1 tracking-tighter">
            {daysRemaining}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            days until account deletion
          </p>
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden p-0.5 border border-border/20">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${((14 - (daysRemaining || 0)) / 14) * 100}%` }}
            />
          </div>
        </div>

        {/* Change mind alert */}
        <div className="bg-green-500/5 dark:bg-green-950/10 border-2 border-green-500/20 border-b-[3px] border-b-green-500/30 rounded-xl p-3 space-y-1 backdrop-blur-sm">
          <p className="text-green-600 dark:text-green-400 text-xs font-bold flex items-center gap-1.5">
            <PartyPopper className="w-4 h-4" />
            Changed your mind? It's not too late!
          </p>
          <p className="text-muted-foreground text-[11px] leading-normal">
            Just click the button below and pretend this never happened. We won't judge. 
            <span className="italic block mt-0.5 text-muted-foreground/60">(Okay, maybe we'll judge a little bit)</span>
          </p>
        </div>
      </div>

      <DialogFooter className="gap-2 flex-row w-full mt-2 relative z-10">
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          className="flex-1 h-10 text-xs font-bold rounded-xl border-2 border-b-[3px] border-border border-b-border/70 bg-transparent text-muted-foreground hover:bg-muted transition-all active:border-b-2 active:translate-y-[1.5px]"
        >
          Close
        </Button>
        <Button
          variant="default"
          onClick={handleCancelDeletion}
          disabled={isLoading}
          className="flex-1 h-10 text-xs font-bold rounded-xl border-2 border-b-[3px] border-green-500 border-b-green-700 bg-green-500 text-white hover:brightness-105 transition-all active:border-b-2 active:translate-y-[1.5px]"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-1.5" />
          ) : (
            <Heart className="w-3.5 h-3.5 mr-1.5" />
          )}
          Cancel Deletion
        </Button>
      </DialogFooter>
    </>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50 transition-all duration-300 ${
            deletionScheduledAt ? "animate-pulse" : ""
          }`}
        >
          {deletionScheduledAt ? (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Deletion Scheduled ({daysRemaining} days left)
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete My Account
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-2 border-border/60 shadow-2xl rounded-[2rem] max-w-md p-5 overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        {step === "initial" && renderInitialStep()}
        {step === "confirm" && renderConfirmStep()}
        {step === "scheduled" && renderScheduledStep()}
      </DialogContent>
    </Dialog>
  )
}
