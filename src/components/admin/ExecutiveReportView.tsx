'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  Calendar,
  Users,
  Sparkles,
  LifeBuoy,
  Database,
  Cloud,
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
  Server,
  Coins,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Bug,
  Flame,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  Loader2,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Trophy,
  GraduationCap,
  BarChart3,
  Target,
  Compass,
  AlertTriangle,
  Award
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { getPlatformExecutiveReportData, ExecutiveReportData } from '@/app/admin/actions'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas-pro'

export default function ExecutiveReportView() {
  const [reportData, setReportData] = useState<ExecutiveReportData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [exportingPdf, setExportingPdf] = useState<boolean>(false)

  // Security Gate State (Admin Password required to unlock database analytics)
  const [adminPassword, setAdminPassword] = useState<string>('')
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false)

  // Date range filters
  const [preset, setPreset] = useState<string>('30d')
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  // Chart view tab
  const [activeChartTab, setActiveChartTab] = useState<'activity' | 'scores' | 'growth' | 'hourly'>('activity')

  const printAreaRef = useRef<HTMLDivElement>(null)

  const fetchReport = async (overrideFrom?: string, overrideTo?: string, passToUse?: string) => {
    const pwd = passToUse || adminPassword
    if (!pwd) {
      setIsUnlocked(false)
      setAuthError('Please enter your encrypted admin password to execute real database calculations.')
      return
    }

    setLoading(true)
    setAuthError(null)
    const activeFrom = overrideFrom !== undefined ? overrideFrom : fromDate
    const activeTo = overrideTo !== undefined ? overrideTo : toDate

    try {
      const res = await getPlatformExecutiveReportData({
        adminPassword: pwd,
        fromDate: `${activeFrom}T00:00:00.000Z`,
        toDate: `${activeTo}T23:59:59.999Z`
      })

      if (!res.success || !res.data) {
        const errorMsg = res.error || 'Failed to authenticate and generate report'
        setAuthError(errorMsg)
        toast.error(errorMsg)
        setIsUnlocked(false)
        return
      }

      setReportData(res.data)
      setIsUnlocked(true)
      toast.success('Admin authorized: Real platform metrics successfully computed from database!')
    } catch (err: any) {
      console.error('Error fetching executive report:', err)
      const errorMsg = err.message || 'Failed to authenticate and generate report'
      setAuthError(errorMsg)
      toast.error(errorMsg)
      setIsUnlocked(false)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPassword.trim()) {
      setAuthError('Password cannot be empty.')
      return
    }
    fetchReport(undefined, undefined, adminPassword)
  }

  const handlePresetChange = (value: string) => {
    setPreset(value)
    const now = new Date()
    let from = new Date()

    if (value === '24h') {
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    } else if (value === '7d') {
      from.setDate(now.getDate() - 7)
    } else if (value === '30d') {
      from.setDate(now.getDate() - 30)
    } else if (value === '90d') {
      from.setDate(now.getDate() - 90)
    } else if (value === 'thisMonth') {
      from = new Date(now.getFullYear(), now.getMonth(), 1)
    } else if (value === 'ytd') {
      from = new Date(now.getFullYear(), 0, 1)
    } else if (value === 'all') {
      from = new Date('2024-01-01T00:00:00Z')
    }

    if (value !== 'custom') {
      const fromStr = from.toISOString().split('T')[0]
      const toStr = now.toISOString().split('T')[0]
      setFromDate(fromStr)
      setToDate(toStr)
      if (isUnlocked && adminPassword) {
        fetchReport(fromStr, toStr)
      }
    }
  }

  const handleExportPDF = async () => {
    if (!printAreaRef.current) return
    setExportingPdf(true)
    const toastId = toast.loading('Generating executive PDF report...')

    try {
      const element = printAreaRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0a0c',
        windowWidth: 1200,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('executive-report-document')
          if (clonedElement) {
            clonedElement.style.width = '1140px'
            clonedElement.style.maxWidth = '1140px'
            clonedElement.style.boxSizing = 'border-box'
            clonedElement.style.paddingRight = '32px'
            clonedElement.style.paddingLeft = '32px'
          }
        }
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = 210
      const pageHeight = 297
      const marginMm = 6
      const contentWidth = pageWidth - marginMm * 2 // 198mm safe printable width
      const contentHeight = (canvas.height * contentWidth) / canvas.width
      const printablePageHeight = pageHeight - marginMm * 2 // 285mm

      let heightLeft = contentHeight
      let position = marginMm

      // Fill background for seamless borders
      pdf.setFillColor(10, 10, 12)
      pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      pdf.addImage(imgData, 'JPEG', marginMm, position, contentWidth, contentHeight)
      heightLeft -= printablePageHeight

      while (heightLeft > 0) {
        position = marginMm - (contentHeight - heightLeft)
        pdf.addPage()
        pdf.setFillColor(10, 10, 12)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
        pdf.addImage(imgData, 'JPEG', marginMm, position, contentWidth, contentHeight)
        heightLeft -= printablePageHeight
      }

      const fileName = `Chameleon_Executive_Report_${fromDate}_to_${toDate}.pdf`
      pdf.save(fileName)
      toast.success('Executive PDF downloaded successfully!', { id: toastId })
    } catch (err: any) {
      console.error('PDF export failed:', err)
      toast.error('Failed to export PDF: ' + err.message, { id: toastId })
    } finally {
      setExportingPdf(false)
    }
  }

  return (
    <div className="space-y-6 font-rubik" dir="ltr">
      {/* Configuration Header Card */}
      <Card className="bg-card border-border shadow-md print:hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold font-rubik text-foreground flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <span>Executive Platform Analytics &amp; PDF Report</span>
              </CardTitle>
              <CardDescription className="text-xs md:text-sm mt-1 font-rubik">
                Generate and print full platform usage audit including time-bounded quiz velocity, real scores, student retention, AI compute, and infrastructure costs.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportPDF}
                disabled={exportingPdf || loading || !reportData}
                className="rounded-full text-xs font-bold gap-1.5 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md hover:brightness-105 active:scale-95 transition-all"
              >
                {exportingPdf ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rendering PDF...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Timeframe selector bar */}
          <div className="mt-5 p-4 rounded-2xl bg-muted/30 border border-border/70 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Preset Window
                </Label>
                <Select value={preset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="w-44 h-9 text-xs rounded-xl font-rubik">
                    <SelectValue placeholder="Select Range" />
                  </SelectTrigger>
                  <SelectContent className="font-rubik">
                    <SelectItem value="24h">Last 24 Hours / Today</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days (Default)</SelectItem>
                    <SelectItem value="90d">Last Quarter (90 Days)</SelectItem>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="ytd">Year-to-Date</SelectItem>
                    <SelectItem value="all">All Time Since Launch</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  From Date
                </Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setPreset('custom')
                  }}
                  className="h-9 text-xs rounded-xl font-mono w-36"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  To Date
                </Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    setPreset('custom')
                  }}
                  className="h-9 text-xs rounded-xl font-mono w-36"
                />
              </div>
            </div>

            {isUnlocked ? (
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="h-9 px-3 text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Session Verified</span>
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsUnlocked(false)
                    setAdminPassword('')
                    setReportData(null)
                    toast.info('Admin report locked successfully.')
                  }}
                  className="rounded-xl h-9 text-xs font-semibold gap-1.5 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </Button>
                <Button
                  onClick={() => fetchReport()}
                  disabled={loading}
                  className="rounded-xl h-9 px-5 text-xs font-bold gap-2 self-end lg:self-auto shrink-0 bg-primary text-primary-foreground"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Recompute Real Metrics</span>
                </Button>
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {/* Main Report Document Container */}
      {loading ? (
        <Card className="py-24 flex flex-col items-center justify-center text-center space-y-4 border-primary/20 bg-card/60 backdrop-blur-sm">
          <div className="p-4 rounded-2xl bg-primary/10 text-primary animate-pulse">
            <Loader2 className="w-10 h-10 animate-spin" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-foreground text-base font-rubik">Executing Real Database Telemetry Queries...</h4>
            <p className="text-xs text-muted-foreground font-rubik max-w-md">
              Aggregating live records across 5,100+ users, 20,100+ quiz submissions, 211 published quizzes, genuine CAPI AI tokens, and infrastructure storage catalogs.
            </p>
          </div>
        </Card>
      ) : !isUnlocked || !reportData ? (
        <Card className="border-border/80 bg-card/70 backdrop-blur-md shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

          <CardContent className="py-16 px-6 sm:px-12 flex flex-col items-center text-center max-w-2xl mx-auto space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary shadow-inner">
                <Lock className="w-9 h-9" />
              </div>
              <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-amber-500 text-black shadow-md">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 font-bold text-xs uppercase tracking-wider">
                  Protected System Action
                </Badge>
              </div>
              <h3 className="text-2xl font-black text-foreground tracking-tight font-rubik">
                Super Admin Password Verification Required
              </h3>
              <p className="text-sm text-muted-foreground font-rubik leading-relaxed">
                To guarantee <span className="font-bold text-foreground">100% accurate platform calculations</span> powered by live database telemetry (aggregating records across 5,100+ users, live CAPI_REQS tokens, and over 20,100 quiz attempts), entering an authorized encrypted Super Admin password is required to prevent accidental execution of expensive queries.
              </p>
            </div>

            {authError && (
              <div className="w-full p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold text-center flex items-center justify-center gap-2 animate-in fade-in duration-200">
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleUnlock} className="w-full space-y-4 pt-2">
              <div className="space-y-2 text-left">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  <span>Admin Database Password</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPasswordInput ? 'text' : 'password'}
                    placeholder="Enter your encrypted admin password..."
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value)
                      if (authError) setAuthError(null)
                    }}
                    autoFocus
                    className="h-12 text-sm rounded-2xl pr-12 font-mono bg-background/80 border-border focus:border-primary shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordInput(!showPasswordInput)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !adminPassword.trim()}
                className="w-full h-12 rounded-2xl font-bold text-sm bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg hover:brightness-105 active:scale-[0.99] transition-all gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials &amp; Running Analytics...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize &amp; Execute Live Calculations</span>
                  </>
                )}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-muted-foreground/70">
                Credentials are automatically verified server-side against bcrypt hash in <code className="text-[11px] px-1 py-0.5 rounded bg-muted">chameleons.pass</code>.
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          ref={printAreaRef}
          id="executive-report-document"
          className="bg-card text-foreground border border-border/80 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-10 relative overflow-hidden print:p-0 print:border-none print:shadow-none print:bg-white print:text-black font-rubik"
        >
          {/* Subtle Ambient Background Watermark */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[140px] pointer-events-none print:hidden" />
          <div className="absolute top-1/2 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-[140px] pointer-events-none print:hidden" />

          {/* REPORT HEADER */}
          <div className="border-b border-border/60 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-black italic tracking-tighter rock-salt text-foreground print:text-black">
                  Chameleon<span className="text-primary text-xl">.</span>
                </span>
                <Badge variant="outline" className="text-[11px] font-bold border-primary/30 text-primary bg-primary/10 ml-2">
                  CONFIDENTIAL EXECUTIVE REPORT
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground print:text-black">
                Institutional Platform &amp; Academic Intelligence Audit
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground print:text-gray-600 mt-1">
                Deep analytical assessment of student learning velocity, quiz performance, cloud infrastructure, and AI compute efficiency.
              </p>
            </div>

            {/* Metadata Box */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1.5 shrink-0 print:border-gray-300 print:bg-gray-50">
              <div className="flex items-center justify-between gap-4 text-muted-foreground print:text-gray-600">
                <span>Selected Window:</span>
                <strong className="text-foreground print:text-black font-mono">
                  {new Date(reportData.timeframe.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' '}&mdash;{' '}
                  {new Date(reportData.timeframe.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-muted-foreground print:text-gray-600">
                <span>Duration / Comparison:</span>
                <strong className="text-foreground print:text-black">
                  {reportData.timeframe.durationDays} Days (vs prior period)
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-muted-foreground print:text-gray-600">
                <span>Generated At:</span>
                <strong className="text-foreground print:text-black">{new Date(reportData.timeframe.generatedAt).toLocaleString('en-US')}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 text-muted-foreground print:text-gray-600">
                <span>Auditor:</span>
                <strong className="text-primary font-bold">{reportData.timeframe.generatedBy}</strong>
              </div>
            </div>
          </div>

          {/* SECTION 1: KEY EXECUTIVE HIGHLIGHTS (KPIs) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>1. Executive Summary &amp; Core Performance KPIs</span>
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Quiz Attempts in Window */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-1 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground print:text-gray-600 font-medium">Quiz Attempts (Period)</span>
                  <Trophy className="w-4 h-4 text-primary opacity-70" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground print:text-black">
                  {reportData.quizzes.performance.totalAttemptsInPeriod.toLocaleString()}
                </div>
                <div className="text-[11px] font-bold flex items-center gap-1">
                  {reportData.quizzes.performance.attemptGrowthRate >= 0 ? (
                    <span className="text-emerald-500 flex items-center gap-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +{reportData.quizzes.performance.attemptGrowthRate}% vs prior period
                    </span>
                  ) : (
                    <span className="text-amber-500 flex items-center gap-0.5">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      {reportData.quizzes.performance.attemptGrowthRate}% vs prior period
                    </span>
                  )}
                </div>
              </div>

              {/* Average Quiz Score & Pass Rate */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground print:text-gray-600 font-medium">Mean Quiz Score</span>
                  <Award className="w-4 h-4 text-emerald-500 opacity-70" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-500">
                  {reportData.quizzes.performance.averageScoreInPeriod}%
                </div>
                <div className="text-[11px] text-muted-foreground print:text-gray-600">
                  <strong className="text-foreground">{reportData.quizzes.performance.passRate}%</strong> pass rate ({reportData.quizzes.performance.excellenceRate}% distinction)
                </div>
              </div>

              {/* Active Quiz Solvers */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground print:text-gray-600 font-medium">Active Quiz Solvers</span>
                  <Users className="w-4 h-4 text-blue-500 opacity-70" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-500">
                  {reportData.users.activeSolversCount.toLocaleString()}
                </div>
                <div className="text-[11px] text-muted-foreground print:text-gray-600">
                  {reportData.users.solverEngagementRate}% of unbanned students solved quizzes
                </div>
              </div>

              {/* Total Users Cohort */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground print:text-gray-600 font-medium">Total Registered Students</span>
                  <GraduationCap className="w-4 h-4 text-purple-500 opacity-70" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-foreground print:text-black">
                  {reportData.users.totalUsersToDate.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{reportData.users.newUsersInPeriod} new students in window (+{reportData.users.growthRate}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: INTERACTIVE TIME-SERIES & TREND TELEMETRY (CHARTS) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span>2. Time-Bounded Academic Activity &amp; Velocity Telemetry</span>
              </h3>

              {/* Chart Switcher Buttons (Hidden on print) */}
              <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/60 print:hidden self-start sm:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveChartTab('activity')}
                  className={`h-7 px-3 text-xs rounded-lg font-semibold transition-all ${
                    activeChartTab === 'activity'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Daily Quiz Activity
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveChartTab('scores')}
                  className={`h-7 px-3 text-xs rounded-lg font-semibold transition-all ${
                    activeChartTab === 'scores'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Score % Trend
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveChartTab('growth')}
                  className={`h-7 px-3 text-xs rounded-lg font-semibold transition-all ${
                    activeChartTab === 'growth'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cohort Signups
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveChartTab('hourly')}
                  className={`h-7 px-3 text-xs rounded-lg font-semibold transition-all ${
                    activeChartTab === 'hourly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  24h Peak Study Hours
                </Button>
              </div>
            </div>

            {/* Main Interactive Chart Canvas */}
            <div className="p-5 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-4">
              {activeChartTab === 'activity' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground print:text-black">Daily Quiz Attempts &amp; Active Student Solvers</h4>
                      <p className="text-xs text-muted-foreground">Volume of quiz submissions along with distinct daily active student participants.</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Quiz Attempts</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-primary" />
                        <span>Unique Solvers</span>
                      </div>
                    </div>
                  </div>

                  <div className="h-[280px] w-full">
                    {reportData.quizzes.performance.dailyActivity.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        No quiz activity recorded in this exact date range.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reportData.quizzes.performance.dailyActivity} margin={{ top: 12, right: 32, left: -10, bottom: 4 }}>
                          <defs>
                            <linearGradient id="attemptsGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="solversGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.4} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(v) => v.slice(5)}
                            stroke="#737373"
                            fontSize={11}
                            padding={{ left: 12, right: 20 }}
                            minTickGap={24}
                          />
                          <YAxis stroke="#737373" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0a0a0c',
                              borderColor: '#262626',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                          <Area type="monotone" dataKey="attempts" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#attemptsGrad)" name="Attempts" />
                          <Area type="monotone" dataKey="uniqueSolvers" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#solversGrad)" name="Active Solvers" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {activeChartTab === 'scores' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground print:text-black">Daily Average Score Progression (%)</h4>
                      <p className="text-xs text-muted-foreground">Tracking cohort comprehension and quiz difficulty stability over time.</p>
                    </div>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-xs font-mono">
                      Window Average: {reportData.quizzes.performance.averageScoreInPeriod}%
                    </Badge>
                  </div>

                  <div className="h-[280px] w-full">
                    {reportData.quizzes.performance.dailyActivity.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        No quiz scores recorded in this exact date range.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={reportData.quizzes.performance.dailyActivity} margin={{ top: 12, right: 32, left: -10, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.4} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(v) => v.slice(5)}
                            stroke="#737373"
                            fontSize={11}
                            padding={{ left: 12, right: 20 }}
                            minTickGap={24}
                          />
                          <YAxis domain={[0, 100]} stroke="#737373" fontSize={11} />
                          <Tooltip
                            formatter={(v: any) => [`${v}%`, 'Average Score']}
                            contentStyle={{
                              backgroundColor: '#0a0a0c',
                              borderColor: '#262626',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                          <Line type="monotone" dataKey="avgScore" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 6 }} name="Avg Score %" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {activeChartTab === 'growth' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground print:text-black">Student Registrations &amp; Cumulative Student Cohort</h4>
                      <p className="text-xs text-muted-foreground">New accounts onboarded in this timeframe and cumulative user growth.</p>
                    </div>
                  </div>

                  <div className="h-[280px] w-full">
                    {reportData.users.dailyRegistrations.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        No new registrations in this window.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={reportData.users.dailyRegistrations} margin={{ top: 12, right: 32, left: -10, bottom: 4 }}>
                          <defs>
                            <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.4} />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(v) => v.slice(5)}
                            stroke="#737373"
                            fontSize={11}
                            padding={{ left: 12, right: 20 }}
                            minTickGap={24}
                          />
                          <YAxis stroke="#737373" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#0a0a0c',
                              borderColor: '#262626',
                              borderRadius: '12px',
                              color: '#fff',
                              fontSize: '12px'
                            }}
                          />
                          <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#regGrad)" name="New Students" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}

              {activeChartTab === 'hourly' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-foreground print:text-black">24-Hour Peak Study Distribution</h4>
                      <p className="text-xs text-muted-foreground">Hourly aggregate of when students are actively answering quizzes across the day.</p>
                    </div>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-xs">
                      Study Habits &amp; Peak Server Load
                    </Badge>
                  </div>

                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportData.quizzes.performance.peakStudyHours} margin={{ top: 12, right: 32, left: -10, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.4} />
                        <XAxis
                          dataKey="label"
                          stroke="#737373"
                          fontSize={10}
                          interval={1}
                          padding={{ left: 8, right: 14 }}
                        />
                        <YAxis stroke="#737373" fontSize={11} />
                        <Tooltip
                          formatter={(v: any) => [`${v} attempts`, 'Volume']}
                          contentStyle={{
                            backgroundColor: '#0a0a0c',
                            borderColor: '#262626',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="attempts" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Attempts">
                          {reportData.quizzes.performance.peakStudyHours.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.attempts > 80 ? '#10b981' : entry.attempts > 40 ? '#3b82f6' : '#6366f1'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: QUIZ MASTERY, SCORE TIERS & DURATION PREFERENCES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Target className="w-4 h-4 text-emerald-500" />
              <span>3. Student Comprehension Tiers &amp; Test Durations</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Score Buckets / Mastery Tiers */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/70 print:border-gray-300 space-y-3.5 lg:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-foreground print:text-black">Score Distribution &amp; Comprehension Tiers</h4>
                    <p className="text-[11px] text-muted-foreground">Classifying quiz attempts into performance mastery tiers.</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {reportData.quizzes.performance.totalAttemptsInPeriod} Total Submissions
                  </Badge>
                </div>

                <div className="space-y-3 pt-1">
                  {reportData.quizzes.performance.scoreBuckets.map((bucket, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bucket.color }} />
                          <span>{bucket.label}</span>
                        </span>
                        <span className="font-mono text-muted-foreground">
                          {bucket.count.toLocaleString()} attempts ({bucket.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(bucket.percentage * 2, 100)}%`,
                            backgroundColor: bucket.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Completion & Time-out Health */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/70 print:border-gray-300 space-y-4">
                <h4 className="text-xs font-bold text-foreground print:text-black">Completion &amp; Drop-off Health</h4>
                
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">Completed</span>
                    <div className="text-2xl font-black text-emerald-500 mt-0.5">
                      {reportData.quizzes.performance.completionRate}%
                    </div>
                    <span className="text-[10px] text-muted-foreground">Solved to the end</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">Timed Out</span>
                    <div className="text-2xl font-black text-amber-500 mt-0.5">
                      {reportData.quizzes.performance.timedOutRate}%
                    </div>
                    <span className="text-[10px] text-muted-foreground">Time elapsed</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40 space-y-2">
                  <span className="text-[11px] font-bold text-foreground block">Top Chosen Durations:</span>
                  <div className="space-y-1.5">
                    {reportData.quizzes.performance.byDuration.slice(0, 3).map((dur, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-card border border-border/50">
                        <span className="text-muted-foreground">{dur.duration}</span>
                        <span className="font-mono font-bold text-foreground">{dur.count} ({dur.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: TOP PERFORMING & HARDEST QUIZZES */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>4. Academic Curriculum Analytics &amp; Quiz Difficulty Rankings</span>
            </h3>

            {/* Top 10 Most Attempted Quizzes Table */}
            <div className="p-5 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-foreground print:text-black">Top 10 Most Attempted Quizzes in Selected Window</h4>
                  <p className="text-[11px] text-muted-foreground">Quizzes with the highest student engagement and practice volume.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Quiz ID</th>
                      <th className="py-2.5 px-3">Lecture / Quiz Title</th>
                      <th className="py-2.5 px-3">Level</th>
                      <th className="py-2.5 px-3 text-right">Attempts</th>
                      <th className="py-2.5 px-3 text-right">Average Score</th>
                      <th className="py-2.5 px-3 text-right">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {reportData.quizzes.performance.topAttemptedQuizzes.map((q, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-muted-foreground font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-primary">{q.quiz_id}</td>
                        <td className="py-2.5 px-3 font-medium text-foreground max-w-xs truncate">{q.title}</td>
                        <td className="py-2.5 px-3">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Level {q.level}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-foreground">{q.attempts}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={q.avgScore >= 75 ? 'text-emerald-500' : q.avgScore >= 60 ? 'text-amber-500' : 'text-red-400'}>
                            {q.avgScore}%
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{q.passRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hardest vs Highest Scoring Quizzes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hardest Quizzes */}
              <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20 print:border-gray-300 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <h4 className="text-xs font-bold text-foreground print:text-black">Top 5 Most Challenging Quizzes (Lowest Scores)</h4>
                </div>
                <p className="text-[11px] text-muted-foreground">Lectures where students struggled the most (candidates for TA review or extra explanations).</p>

                <div className="space-y-2 pt-1">
                  {reportData.quizzes.performance.hardestQuizzes.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No quiz attempts in this window.</p>
                  ) : (
                    reportData.quizzes.performance.hardestQuizzes.map((q, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-card border border-destructive/20 flex items-center justify-between text-xs">
                        <div className="space-y-0.5 truncate mr-3">
                          <span className="font-bold text-foreground truncate block">{q.title}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{q.quiz_id} &bull; {q.attempts} attempts</span>
                        </div>
                        <Badge variant="destructive" className="font-mono font-bold shrink-0">
                          {q.avgScore}% avg
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Highest Scoring Quizzes */}
              <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 print:border-gray-300 space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-bold text-foreground print:text-black">Top 5 Highest Scoring Quizzes (Mastery)</h4>
                </div>
                <p className="text-[11px] text-muted-foreground">Lectures with the highest comprehension and student success rates.</p>

                <div className="space-y-2 pt-1">
                  {reportData.quizzes.performance.highestScoringQuizzes.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No quiz attempts in this window.</p>
                  ) : (
                    reportData.quizzes.performance.highestScoringQuizzes.map((q, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-card border border-emerald-500/20 flex items-center justify-between text-xs">
                        <div className="space-y-0.5 truncate mr-3">
                          <span className="font-bold text-foreground truncate block">{q.title}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{q.quiz_id} &bull; {q.attempts} attempts</span>
                        </div>
                        <Badge variant="outline" className="font-mono font-bold shrink-0 border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                          {q.avgScore}% avg
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: PUBLISHED QUIZZES CATALOG OVERVIEW */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>5. Platform Quiz Question Bank &amp; Published Library</span>
            </h3>

            <div className="p-5 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground block">Total Published Quizzes</span>
                  <div className="text-xl font-black text-foreground mt-0.5">
                    {reportData.quizzes.catalog.totalPublishedQuizzes}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground block">Total Questions in Bank</span>
                  <div className="text-xl font-black text-primary mt-0.5">
                    {reportData.quizzes.catalog.totalQuestionsInBank.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground block">Study Spaces (V2)</span>
                  <div className="text-xl font-black text-blue-500 mt-0.5">
                    {reportData.engagement.studyRoomsCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground block">Study Space Members</span>
                  <div className="text-xl font-black text-purple-500 mt-0.5">
                    {reportData.engagement.studyRoomMembersCount}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-foreground block mb-2">Curriculum Breakdown by Academic Level:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {reportData.quizzes.catalog.quizzesByLevel.map((lvl, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center justify-between">
                      <span className="font-semibold text-foreground">{lvl.level}</span>
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {lvl.count} Quizzes
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: STUDENT POPULATION & TOP SOLVERS LEADERBOARD */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>6. Student Cohort Demographics &amp; Active Solvers Leaderboard</span>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Demographics by Major */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/70 print:border-gray-300 space-y-3">
                <h4 className="text-xs font-bold text-foreground print:text-black">Distribution by Specialization / Major</h4>
                <div className="space-y-2.5">
                  {reportData.users.bySpecialization.map((spec, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[200px]">{spec.name}</span>
                        <span className="font-mono text-muted-foreground">
                          {spec.count} students ({spec.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${Math.min(spec.percentage * 2.5, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Active Solvers in Window */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/70 print:border-gray-300 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground print:text-black">Top Active Quiz Solvers (Selected Window)</h4>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 text-[10px]">
                    Leaderboard
                  </Badge>
                </div>

                <div className="space-y-2">
                  {reportData.users.topActiveUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No quiz submissions recorded in this window.</p>
                  ) : (
                    reportData.users.topActiveUsers.slice(0, 5).map((u, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/50 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate mr-2">
                          <span className="font-mono font-bold text-muted-foreground w-4">{idx + 1}</span>
                          <div className="truncate">
                            <span className="font-bold text-foreground block truncate">{u.username}</span>
                            <span className="text-[10px] text-muted-foreground">{u.specialization} &bull; {u.level}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-bold text-primary block">{u.quizzesSolved} quizzes</span>
                          <span className="text-[10px] font-mono text-emerald-500 font-semibold">{u.avgScore}% avg</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Coins Economy Telemetry */}
            <div className="p-5 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-foreground">Chameleon Coin Economy &amp; Wealth Distribution</h4>
                </div>
                <span className="text-xs font-mono font-bold text-amber-500">
                  {reportData.users.totalCoinsInEconomy.toLocaleString()} Total Coins
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {reportData.users.coinsTopDistribution.map((b, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-center">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">{b.bracket}</span>
                    <div className="text-base font-black text-foreground mt-0.5">{b.usersCount.toLocaleString()}</div>
                    <span className="text-[10px] text-muted-foreground font-mono">{b.percentage}% students</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 7: MARLINE AI COMPUTE & TOKEN AUDIT */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>7. Marline AI Assistant Usage &amp; Token Budget Telemetry</span>
            </h3>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/5 via-card to-card border border-purple-500/20 print:border-gray-300 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground block">Active AI Learners</span>
                  <div className="text-xl font-black text-foreground mt-0.5">{reportData.aiUsage.activeAiUsers.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground block">Total Tokens Consumed</span>
                  <div className="text-xl font-black text-purple-500 mt-0.5">
                    {(reportData.aiUsage.totalTokens / 1000).toLocaleString()}k
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground block">Avg AI Response Latency</span>
                  <div className="text-xl font-black text-emerald-500 mt-0.5">{reportData.aiUsage.averageResponseTimeMs}ms</div>
                </div>
                <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                  <span className="text-[11px] text-muted-foreground block">Commercial Value Saved</span>
                  <div className="text-xl font-black text-primary mt-0.5">${reportData.aiUsage.estimatedCostSaved}</div>
                </div>
              </div>

              {/* Subject Demand Table */}
              <div>
                <span className="text-xs font-bold text-foreground print:text-black block mb-2">Most Queried Academic Topics &amp; Courses:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {reportData.aiUsage.popularSubjects.map((sub, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center justify-between">
                      <span className="truncate mr-2 font-medium">{sub.name}</span>
                      <Badge variant="secondary" className="font-mono text-[10px] shrink-0">
                        {sub.queries} queries
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8: STUDENT REPORTS, COMPLAINTS & FEEDBACK */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-primary" />
              <span>8. Student Reports, Bug Complaints &amp; Resolution Velocity</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category Breakdown */}
              <div className="p-5 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">Complaints by Category</h4>
                  <span className="text-xs text-muted-foreground font-mono">{reportData.reportsAndSupport.totalReports} total submitted</span>
                </div>

                <div className="space-y-2">
                  {reportData.reportsAndSupport.byCategory.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">No reports received in this timeframe.</p>
                  ) : (
                    reportData.reportsAndSupport.byCategory.map((cat, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-muted/30 text-xs">
                        <span className="font-medium text-foreground">{cat.label}</span>
                        <Badge variant="outline" className="font-mono">
                          {cat.count} ticket{cat.count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Status Breakdown & KPIs */}
              <div className="p-5 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-3">
                <h4 className="text-xs font-bold text-foreground">Resolution Pipeline Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                    <span className="text-[10px] text-amber-500 font-bold uppercase">Pending / Open</span>
                    <div className="text-xl font-black text-amber-500 mt-0.5">{reportData.reportsAndSupport.openReports}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <span className="text-[10px] text-blue-500 font-bold uppercase">In Progress</span>
                    <div className="text-xl font-black text-blue-500 mt-0.5">{reportData.reportsAndSupport.inProgressReports}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase">Resolved</span>
                    <div className="text-xl font-black text-emerald-500 mt-0.5">{reportData.reportsAndSupport.resolvedReports}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-muted border border-border text-center">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Closed</span>
                    <div className="text-xl font-black text-foreground mt-0.5">{reportData.reportsAndSupport.closedReports}</div>
                  </div>
                </div>

                <div className="pt-2 text-xs text-muted-foreground leading-relaxed">
                  Support efficiency rating is <strong className="text-emerald-500">{reportData.reportsAndSupport.resolutionRate}%</strong>. All resolved items dispatched instant notifications to the respective student profiles.
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 9: CLOUD INFRASTRUCTURE & LIVE DATABASE CATALOG */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              <span>9. Cloud Infrastructure &amp; Live Database Catalog (Vercel &amp; Supabase)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supabase Metrics Card */}
              <div className="p-5 rounded-2xl bg-card border border-emerald-500/20 print:border-gray-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-foreground">Supabase PostgreSQL Live Catalog</h4>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[10px]">
                    {reportData.infrastructure.supabase.connectionPoolStatus}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  {reportData.infrastructure.supabase.tablesBreakdown.map((tbl, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                      <span className="text-muted-foreground font-mono">{tbl.name}</span>
                      <strong className="text-foreground font-mono">{tbl.count.toLocaleString()} rows</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vercel Metrics Card */}
              <div className="p-5 rounded-2xl bg-card border border-blue-500/20 print:border-gray-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-500" />
                    <h4 className="text-xs font-bold text-foreground">Vercel Edge Network &amp; Compute Telemetry</h4>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10 text-[10px]">
                    {reportData.infrastructure.vercel.systemHealth}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Estimated Edge Requests:</span>
                    <strong className="text-foreground font-mono">{reportData.infrastructure.vercel.estimatedEdgeRequests.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Serverless Function Invocations:</span>
                    <strong className="text-foreground font-mono">{reportData.infrastructure.vercel.serverlessInvocations.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Edge Bandwidth Transferred:</span>
                    <strong className="text-foreground font-mono">{reportData.infrastructure.vercel.bandwidthUsedGb} GB</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Fast Cache Hit Ratio:</span>
                    <strong className="text-blue-500 font-mono">{reportData.infrastructure.vercel.cacheHitRatio}%</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Average Query Latency:</span>
                    <strong className="text-emerald-500 font-mono">{reportData.infrastructure.supabase.avgQueryLatencyMs}ms (P95)</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* REPORT FOOTER SIGNATURE & VERIFICATION */}
          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-muted-foreground print:text-gray-600">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground print:text-black">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Chameleon Administrative Verification System</span>
              </div>
              <p className="text-[11px]">
                This audit report is officially generated, digitally verified, and sealed for institutional administration reporting.
              </p>
            </div>

            <div className="text-right font-mono text-[10px] space-y-0.5 shrink-0">
              <div>REPORT ID: CHM-AUDIT-{reportData.timeframe.durationDays}D-{Date.now().toString().slice(-6)}</div>
              <div>SECURITY LEVEL: RESTRICTED MASTER ACCESS</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
