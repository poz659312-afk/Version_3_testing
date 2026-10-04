"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Bug,
  BookOpen,
  User,
  Lightbulb,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Link2,
  Image as ImageIcon,
  Flame,
  Clock,
  Sparkles,
  LifeBuoy
} from "lucide-react"
import { submitReport } from "@/lib/actions/report-actions"
import { getStudentSession, StudentUser } from "@/lib/auth"
import { toast } from "sonner"
import { ReportCategory, ReportPriority } from "@/lib/types"

const CATEGORIES: {
  id: ReportCategory
  label: string
  icon: any
  color: string
  description: string
}[] = [
  {
    id: "bug",
    label: "Technical Bug",
    icon: Bug,
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    description: "Broken buttons, UI glitches, page errors, or unexpected behavior"
  },
  {
    id: "content",
    label: "Course Content",
    icon: BookOpen,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    description: "Missing summaries, broken Google Drive links, or quiz errors"
  },
  {
    id: "account",
    label: "Account Issue",
    icon: User,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    description: "Authentication, password resets, coins/rewards, or permissions"
  },
  {
    id: "feature_request",
    label: "Feature Request",
    icon: Lightbulb,
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    description: "New ideas, study tool requests, or UX improvements"
  },
  {
    id: "other",
    label: "General Inquiry",
    icon: HelpCircle,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    description: "General questions or inquiries for the Chameleon administration"
  },
]

interface ReportModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  defaultCategory?: ReportCategory
  prefilledTitle?: string
  prefilledPageUrl?: string
  onReportSubmitted?: () => void
}

export function ReportModal({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  defaultCategory = "bug",
  prefilledTitle = "",
  prefilledPageUrl = "",
  onReportSubmitted,
}: ReportModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const isOpen = isControlled ? controlledOpen : internalOpen
  const setIsOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const [user, setUser] = useState<StudentUser | null>(null)
  const [category, setCategory] = useState<ReportCategory>(defaultCategory)
  const [priority, setPriority] = useState<ReportPriority>("normal")
  const [title, setTitle] = useState(prefilledTitle)
  const [description, setDescription] = useState("")
  const [pageUrl, setPageUrl] = useState(prefilledPageUrl)
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const session = await getStudentSession()
      if (session) {
        setUser(session)
        if (session.email) setContactEmail(session.email)
      }
    }
    loadUser()

    if (typeof window !== "undefined" && !prefilledPageUrl) {
      setPageUrl(window.location.pathname + window.location.search)
    }
  }, [prefilledPageUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || title.trim().length < 3) {
      toast.error("Please enter a clear title (at least 3 characters).")
      return
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("Please describe the issue in detail (at least 10 characters).")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await submitReport({
        user_id: user?.auth_id || null,
        username: user?.username || "Guest User",
        user_email: contactEmail.trim() || user?.email || null,
        user_phone: user?.phone_number || null,
        category,
        priority,
        title: title.trim(),
        description: description.trim(),
        page_url: pageUrl.trim() || null,
        screenshot_url: screenshotUrl.trim() || null,
      })

      if (res.success) {
        setIsSuccess(true)
        toast.success("Report submitted successfully! Our admin team will review it.")
        if (onReportSubmitted) {
          onReportSubmitted()
        }
        setTimeout(() => {
          setIsSuccess(false)
          setTitle("")
          setDescription("")
          setScreenshotUrl("")
          setIsOpen(false)
        }, 2000)
      } else {
        toast.error(res.error || "Failed to submit report. Please try again.")
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred while submitting.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-border bg-card/95 backdrop-blur-xl shadow-2xl rounded-2xl font-rubik" dir="ltr">
        {/* Header */}
        <div className="relative overflow-hidden p-6 pb-5 border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shadow-sm shrink-0">
              <LifeBuoy className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-xl md:text-2xl font-bold font-rubik text-foreground flex items-center gap-2">
                <span>Report an Issue or Suggestion</span>
                <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/25">
                  Feedback Portal
                </span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs md:text-sm mt-0.5 font-rubik">
                Let us know about bugs, content mistakes, or feature ideas. Our admin team will investigate and respond promptly.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Success Screen */}
        <AnimatePresence>
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xl">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">Report Received!</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Thank you for helping us make Chameleon better. Your report has been dispatched and you can track status updates from your profile.
              </p>
              <div className="pt-2">
                <Badge variant="outline" className="px-4 py-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  Status: Under Review (Open)
                </Badge>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Issue Category <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const isSelected = category === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 relative overflow-hidden group ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-md shadow-primary/10"
                            : "border-border/60 hover:border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-foreground">
                            {cat.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {cat.description}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Title & Priority Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="report-title" className="text-xs font-bold text-foreground">
                    Issue Title / Summary <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="report-title"
                    placeholder="e.g., Download button not responding on AI course page..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="border-border bg-background/50 h-10 focus-visible:ring-primary text-sm font-rubik"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="report-priority" className="text-xs font-bold text-foreground">
                    Priority Level
                  </Label>
                  <Select value={priority} onValueChange={(val: ReportPriority) => setPriority(val)}>
                    <SelectTrigger id="report-priority" className="border-border bg-background/50 h-10 text-sm font-rubik">
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent className="font-rubik">
                      <SelectItem value="low">
                        <span className="flex items-center gap-2 text-emerald-500">
                          <Clock className="w-3.5 h-3.5" /> Low
                        </span>
                      </SelectItem>
                      <SelectItem value="normal">
                        <span className="flex items-center gap-2 text-blue-500">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                        </span>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <span className="flex items-center gap-2 text-red-500 font-bold">
                          <Flame className="w-3.5 h-3.5 animate-pulse" /> Urgent
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="report-description" className="text-xs font-bold text-foreground">
                  Detailed Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="report-description"
                  placeholder="Describe what happened, the steps to reproduce, or details about the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                  className="border-border bg-background/50 focus-visible:ring-primary text-sm resize-none leading-relaxed font-rubik"
                />
              </div>

              {/* Metadata details: Page URL & Screenshot link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="page-url" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5" />
                    Page URL (Optional)
                  </Label>
                  <Input
                    id="page-url"
                    placeholder="/courses/data-science"
                    value={pageUrl}
                    onChange={(e) => setPageUrl(e.target.value)}
                    className="border-border bg-background/50 h-9 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="screenshot-url" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Screenshot Image URL (Optional)
                  </Label>
                  <Input
                    id="screenshot-url"
                    placeholder="https://imgur.com/..."
                    value={screenshotUrl}
                    onChange={(e) => setScreenshotUrl(e.target.value)}
                    className="border-border bg-background/50 h-9 text-xs font-mono"
                  />
                </div>
              </div>

              {/* User Session Banner / Contact Info */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {user?.username ? user.username[0].toUpperCase() : "U"}
                  </div>
                  <div>
                    <span className="font-bold text-foreground">
                      {user ? user.username : "Guest User"}
                    </span>
                    <span className="text-muted-foreground ml-1.5">
                      {user ? "(Connected to your student profile)" : "(General Report)"}
                    </span>
                  </div>
                </div>

                {!user && (
                  <div className="w-full sm:w-auto">
                    <Input
                      placeholder="Your email address (optional)"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="h-8 text-xs border-border bg-background"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-full text-xs font-medium"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-full px-6 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold shadow-md hover:brightness-105 active:scale-95 transition-all text-xs sm:text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit to Admin
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
