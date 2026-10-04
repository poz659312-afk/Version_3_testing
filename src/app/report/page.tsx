"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LifeBuoy,
  ArrowLeft,
  Sparkles,
  Bug,
  BookOpen,
  User,
  Lightbulb,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Send,
  Loader2,
  Flame,
  Calendar,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getStudentSession, StudentUser } from "@/lib/auth"
import { submitReport, getUserReports } from "@/lib/actions/report-actions"
import { UserReport, ReportCategory, ReportPriority, ReportStatus } from "@/lib/types"
import { toast } from "sonner"
import { ReportModal } from "@/components/reports/ReportModal"

export default function ReportPortalPage() {
  const [user, setUser] = useState<StudentUser | null>(null)
  const [userReports, setUserReports] = useState<UserReport[]>([])
  const [loadingReports, setLoadingReports] = useState(false)
  const [activeTab, setActiveTab] = useState("new")

  // Form states
  const [category, setCategory] = useState<ReportCategory>("bug")
  const [priority, setPriority] = useState<ReportPriority>("normal")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [pageUrl, setPageUrl] = useState("")
  const [screenshotUrl, setScreenshotUrl] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)

  const loadUserData = async () => {
    const session = await getStudentSession()
    if (session) {
      setUser(session)
      if (session.email) setContactEmail(session.email)
      fetchUserReports(session.auth_id)
    }
  }

  const fetchUserReports = async (authId: string) => {
    setLoadingReports(true)
    try {
      const reports = await getUserReports(authId)
      setUserReports(reports)
    } catch (err) {
      console.error("Error loading user reports:", err)
    } finally {
      setLoadingReports(false)
    }
  }

  useEffect(() => {
    loadUserData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || title.trim().length < 3) {
      toast.error("Please enter a clear title (at least 3 characters).")
      return
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error("Please provide a detailed description (at least 10 characters).")
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
        setSubmissionSuccess(true)
        toast.success("Report submitted successfully! Our team will review it.")
        setTitle("")
        setDescription("")
        setScreenshotUrl("")

        if (user?.auth_id) {
          fetchUserReports(user.auth_id)
        }
      } else {
        toast.error(res.error || "Failed to submit report. Please try again.")
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred while submitting.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs font-bold gap-1 font-rubik">
            <Clock className="w-3 h-3" />
            Under Review (Open)
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-xs font-bold gap-1 font-rubik">
            <RefreshCw className="w-3 h-3 animate-spin" />
            In Progress
          </Badge>
        )
      case "resolved":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-bold gap-1 font-rubik">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </Badge>
        )
      case "closed":
        return (
          <Badge variant="outline" className="text-muted-foreground border-border text-xs gap-1 font-rubik">
            Closed
          </Badge>
        )
      default:
        return null
    }
  }

  const getCategoryDetails = (cat: ReportCategory) => {
    switch (cat) {
      case "bug":
        return { label: "Technical Bug", icon: Bug, color: "text-red-500" }
      case "content":
        return { label: "Course Content", icon: BookOpen, color: "text-blue-500" }
      case "account":
        return { label: "Account Issue", icon: User, color: "text-amber-500" }
      case "feature_request":
        return { label: "Feature Request", icon: Lightbulb, color: "text-purple-500" }
      default:
        return { label: "General Inquiry", icon: HelpCircle, color: "text-emerald-500" }
    }
  }

  return (
    <div
      dir="ltr"
      className="min-h-screen bg-background text-foreground font-rubik selection:bg-primary/20 pb-24 pt-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Background Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-48 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-10 relative z-10">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>

          {user && (
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
            >
              <span>Go to My Profile</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <LifeBuoy className="w-4 h-4 animate-pulse" />
            <span>Chameleon Help &amp; Reports Center</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
            Encountered an Issue?{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary">
              We&apos;re Here to Help
            </span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Whether it&apos;s a technical bug, course material correction, account trouble, or a feature suggestion — submit your report below and our admin team will investigate and follow up promptly.
          </p>
        </div>

        {/* Main Tabs Container */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
          <div className="flex justify-center">
            <TabsList className="bg-muted/60 border border-border/60 p-1 rounded-2xl h-auto">
              <TabsTrigger
                value="new"
                className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit New Report
              </TabsTrigger>

              {user && (
                <TabsTrigger
                  value="history"
                  className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm relative"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  My Reports History ({userReports.length})
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          {/* TAB 1: New Report Form */}
          <TabsContent value="new" className="outline-none">
            <Card className="bg-card/70 backdrop-blur-xl border-border/60 shadow-xl max-w-3xl mx-auto rounded-3xl overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-5">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <LifeBuoy className="w-5 h-5 text-primary" />
                  <span>Report Details &amp; Feedback</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Please provide clear information below so we can resolve the problem as quickly as possible.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 sm:p-8">
                {submissionSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="py-12 flex flex-col items-center justify-center text-center space-y-5"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-xl">
                      <CheckCircle2 className="w-10 h-10 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-foreground">Report Submitted Successfully!</h3>
                      <p className="text-muted-foreground text-sm max-w-md">
                        Thank you for contacting us. Your report has been dispatched to the administration and you can track updates from your student profile.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => setSubmissionSuccess(false)}
                        variant="outline"
                        className="rounded-full text-xs font-bold"
                      >
                        Submit Another Report
                      </Button>
                      {user && (
                        <Button
                          onClick={() => setActiveTab("history")}
                          className="rounded-full text-xs font-bold bg-primary text-primary-foreground"
                        >
                          View My Reports
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category Selection */}
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Issue Category <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[
                          { id: "bug", label: "Technical Bug", icon: Bug, color: "text-red-500" },
                          { id: "content", label: "Course Content", icon: BookOpen, color: "text-blue-500" },
                          { id: "account", label: "Account Issue", icon: User, color: "text-amber-500" },
                          { id: "feature_request", label: "Feature Request", icon: Lightbulb, color: "text-purple-500" },
                          { id: "other", label: "General Inquiry", icon: HelpCircle, color: "text-emerald-500" },
                        ].map((item) => {
                          const Icon = item.icon
                          const isSelected = category === item.id
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setCategory(item.id as ReportCategory)}
                              className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 text-xs font-bold ${
                                isSelected
                                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                                  : "border-border/60 hover:border-border hover:bg-muted/40 text-foreground"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
                              <span>{item.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Title & Priority */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="title" className="text-xs font-bold">
                          Issue Title / Summary <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="title"
                          placeholder="e.g., Unable to download summary for Algorithms..."
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                          className="h-11 border-border bg-background/50 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="priority" className="text-xs font-bold">
                          Priority Level
                        </Label>
                        <Select value={priority} onValueChange={(val: ReportPriority) => setPriority(val)}>
                          <SelectTrigger id="priority" className="h-11 border-border bg-background/50 rounded-xl text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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

                    {/* Detailed Description */}
                    <div className="space-y-1.5">
                      <Label htmlFor="description" className="text-xs font-bold">
                        Detailed Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Explain where the issue occurred, the steps taken, and any relevant error messages..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={5}
                        required
                        className="border-border bg-background/50 rounded-xl resize-none leading-relaxed text-sm"
                      />
                    </div>

                    {/* Page URL & Screenshot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="pageUrl" className="text-xs font-medium text-muted-foreground">
                          Page URL (Optional)
                        </Label>
                        <Input
                          id="pageUrl"
                          placeholder="/courses/algorithms"
                          value={pageUrl}
                          onChange={(e) => setPageUrl(e.target.value)}
                          className="h-10 border-border bg-background/50 rounded-xl text-xs font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="screenshotUrl" className="text-xs font-medium text-muted-foreground">
                          Screenshot URL (Optional)
                        </Label>
                        <Input
                          id="screenshotUrl"
                          placeholder="https://i.imgur.com/..."
                          value={screenshotUrl}
                          onChange={(e) => setScreenshotUrl(e.target.value)}
                          className="h-10 border-border bg-background/50 rounded-xl text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Email for non-logged-in users */}
                    {!user && (
                      <div className="space-y-1.5">
                        <Label htmlFor="contactEmail" className="text-xs font-medium text-muted-foreground">
                          Contact Email (Optional)
                        </Label>
                        <Input
                          id="contactEmail"
                          placeholder="student@example.com"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          className="h-10 border-border bg-background/50 rounded-xl text-xs"
                        />
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-full px-8 h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:brightness-105 active:scale-95 transition-all text-sm"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting Report...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Report
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: User's previous reports */}
          {user && (
            <TabsContent value="history" className="outline-none space-y-4">
              <div className="flex items-center justify-between max-w-3xl mx-auto px-1">
                <h3 className="text-lg font-bold text-foreground">Your Submitted Reports</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchUserReports(user.auth_id)}
                  disabled={loadingReports}
                  className="rounded-full text-xs font-bold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingReports ? "animate-spin" : ""}`} />
                  Refresh List
                </Button>
              </div>

              {loadingReports ? (
                <div className="py-16 flex flex-col items-center justify-center text-center text-muted-foreground space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm">Fetching your reports...</p>
                </div>
              ) : userReports.length === 0 ? (
                <Card className="max-w-3xl mx-auto p-12 text-center rounded-3xl border-dashed">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                    <LifeBuoy className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-foreground">No reports recorded on your account yet</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    If you encounter any bug or have suggestions for the platform, submit your feedback and we&apos;ll look into it.
                  </p>
                  <Button
                    onClick={() => setActiveTab("new")}
                    className="mt-5 rounded-full text-xs font-bold bg-primary text-primary-foreground"
                  >
                    Submit a New Report
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {userReports.map((report) => {
                    const cat = getCategoryDetails(report.category)
                    const CatIcon = cat.icon
                    return (
                      <Card
                        key={report.id}
                        className="bg-card/80 border-border/60 rounded-2xl overflow-hidden shadow-sm hover:border-border transition-all"
                      >
                        <CardHeader className="p-5 pb-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-lg bg-muted ${cat.color}`}>
                                <CatIcon className="w-4 h-4" />
                              </span>
                              <span className="text-xs text-muted-foreground font-bold">
                                {cat.label}
                              </span>
                              <span className="text-muted-foreground text-xs">•</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.created_at).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric"
                                })}
                              </span>
                            </div>

                            <div>{getStatusBadge(report.status)}</div>
                          </div>

                          <CardTitle className="text-base font-bold mt-2 text-foreground">
                            {report.title}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="px-5 py-2 space-y-3">
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {report.description}
                          </p>

                          {/* Admin Reply Box */}
                          {report.admin_reply && (
                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-2 mt-3">
                              <div className="flex items-center justify-between text-xs font-bold text-primary">
                                <span className="flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4" />
                                  Admin Response ({report.admin_name || "Admin"}):
                                </span>
                                {report.resolved_at && (
                                  <span className="text-[11px] text-muted-foreground font-normal">
                                    {new Date(report.resolved_at).toLocaleDateString("en-US")}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {report.admin_reply}
                              </p>
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="px-5 py-3 bg-muted/20 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
                          <span>
                            Priority:{" "}
                            <strong className="text-foreground capitalize">
                              {report.priority}
                            </strong>
                          </span>
                          {report.page_url && (
                            <span className="font-mono text-xs text-primary">
                              {report.page_url}
                            </span>
                          )}
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
