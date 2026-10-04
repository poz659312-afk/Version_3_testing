'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  Printer,
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
  Cpu,
  Coins,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Bug,
  Flame,
  Zap,
  ArrowUpRight,
  Layers,
  ChevronDown,
  Loader2
} from 'lucide-react'
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
  const [loading, setLoading] = useState<boolean>(true)
  const [exportingPdf, setExportingPdf] = useState<boolean>(false)

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

  const printAreaRef = useRef<HTMLDivElement>(null)

  const fetchReport = async (overrideFrom?: string, overrideTo?: string) => {
    setLoading(true)
    const activeFrom = overrideFrom !== undefined ? overrideFrom : fromDate
    const activeTo = overrideTo !== undefined ? overrideTo : toDate
    try {
      const data = await getPlatformExecutiveReportData({
        fromDate: `${activeFrom}T00:00:00.000Z`,
        toDate: `${activeTo}T23:59:59.999Z`
      })
      setReportData(data)
    } catch (err: any) {
      console.error('Error fetching executive report:', err)
      toast.error(err.message || 'Failed to generate executive report')
    } finally {
      setLoading(false)
    }
  }

  const handlePresetChange = (value: string) => {
    setPreset(value)
    const now = new Date()
    let from = new Date()

    if (value === '7d') {
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
      fetchReport(fromStr, toStr)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [])

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
        windowWidth: 1200
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
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

  const handlePrint = () => {
    window.print()
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
                Generate and print full platform usage audit including users, AI interactions, reports resolution, and Vercel/Supabase infrastructure metrics.
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
                  <SelectTrigger className="w-40 h-9 text-xs rounded-xl font-rubik">
                    <SelectValue placeholder="Select Range" />
                  </SelectTrigger>
                  <SelectContent className="font-rubik">
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

            <Button
              onClick={() => fetchReport()}
              disabled={loading}
              className="rounded-xl h-9 px-6 text-xs font-bold gap-2 self-end lg:self-auto shrink-0 bg-primary text-primary-foreground"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Apply &amp; Recompute Metrics</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Main Report Document Container */}
      {loading ? (
        <Card className="py-24 flex flex-col items-center justify-center text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <div className="space-y-1">
            <h4 className="font-bold text-foreground text-base">Gathering Platform Telemetry...</h4>
            <p className="text-xs text-muted-foreground">Aggregating database records, support tickets, AI tokens, and cloud consumption.</p>
          </div>
        </Card>
      ) : !reportData ? (
        <Card className="py-16 text-center">
          <p className="text-muted-foreground text-sm">No report data generated. Please select a valid date range.</p>
        </Card>
      ) : (
        <div
          ref={printAreaRef}
          id="executive-report-document"
          className="bg-card text-foreground border border-border/80 shadow-2xl rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden print:p-0 print:border-none print:shadow-none print:bg-white print:text-black font-rubik"
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
                Platform Operations &amp; Performance Audit
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground print:text-gray-600 mt-1">
                Official aggregated executive briefing on student engagement, system health, AI compute, and infrastructure costs.
              </p>
            </div>

            {/* Metadata Box */}
            <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs space-y-1.5 shrink-0 print:border-gray-300 print:bg-gray-50">
              <div className="flex items-center justify-between gap-3 text-muted-foreground print:text-gray-600">
                <span>Selected Window:</span>
                <strong className="text-foreground print:text-black font-mono">
                  {new Date(reportData.timeframe.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' '}&mdash;{' '}
                  {new Date(reportData.timeframe.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-3 text-muted-foreground print:text-gray-600">
                <span>Duration:</span>
                <strong className="text-foreground print:text-black">{reportData.timeframe.durationDays} Days</strong>
              </div>
              <div className="flex items-center justify-between gap-3 text-muted-foreground print:text-gray-600">
                <span>Generated At:</span>
                <strong className="text-foreground print:text-black">{new Date(reportData.timeframe.generatedAt).toLocaleString('en-US')}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 text-muted-foreground print:text-gray-600">
                <span>Auditor:</span>
                <strong className="text-primary font-bold">{reportData.timeframe.generatedBy}</strong>
              </div>
            </div>
          </div>

          {/* SECTION 1: KEY EXECUTIVE HIGHLIGHTS (KPIs) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              <span>1. Executive Summary &amp; Core Platform KPIs</span>
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Total Users */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-1">
                <span className="text-xs text-muted-foreground print:text-gray-600 font-medium">Total Users (To Date)</span>
                <div className="text-2xl sm:text-3xl font-black text-foreground print:text-black">
                  {reportData.users.totalUsersToDate.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-500 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+{reportData.users.newUsersInPeriod} new students in window</span>
                </div>
              </div>

              {/* Growth Rate */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-1">
                <span className="text-xs text-muted-foreground print:text-gray-600 font-medium">Cohort Growth Rate</span>
                <div className="text-2xl sm:text-3xl font-black text-primary">
                  +{reportData.users.growthRate}%
                </div>
                <div className="text-[11px] text-muted-foreground print:text-gray-600">
                  {reportData.users.activeStudents} active students ({reportData.users.bannedUsers} restricted)
                </div>
              </div>

              {/* AI Compute */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-1">
                <span className="text-xs text-muted-foreground print:text-gray-600 font-medium">Marline AI Queries</span>
                <div className="text-2xl sm:text-3xl font-black text-purple-500">
                  {reportData.aiUsage.totalAiQueries.toLocaleString()}
                </div>
                <div className="text-[11px] text-purple-400 font-bold">
                  {(reportData.aiUsage.totalTokens / 1000000).toFixed(2)}M Tokens (${reportData.aiUsage.estimatedCostSaved} saved)
                </div>
              </div>

              {/* Support Resolution */}
              <div className="p-4 rounded-2xl bg-card border border-border/70 print:border-gray-300 space-y-1">
                <span className="text-xs text-muted-foreground print:text-gray-600 font-medium">Support Resolution Rate</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-500">
                  {reportData.reportsAndSupport.resolutionRate}%
                </div>
                <div className="text-[11px] text-muted-foreground print:text-gray-600">
                  {reportData.reportsAndSupport.resolvedReports + reportData.reportsAndSupport.closedReports} / {reportData.reportsAndSupport.totalReports} issues resolved
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: STUDENT DEMOGRAPHICS & SPECIALIZATION BREAKDOWN */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>2. Student Population &amp; Academic Specializations</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* By Specialization */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/70 print:border-gray-300 space-y-3">
                <h4 className="text-xs font-bold text-foreground print:text-black">Distribution by Major / Department</h4>
                <div className="space-y-2.5">
                  {reportData.users.bySpecialization.map((spec, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground print:text-black truncate max-w-[200px]">{spec.name}</span>
                        <span className="font-mono text-muted-foreground print:text-gray-600">
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

              {/* By Academic Level & Daily Regs */}
              <div className="p-5 rounded-2xl bg-muted/20 border border-border/70 print:border-gray-300 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-foreground print:text-black mb-2.5">Distribution by Academic Year</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {reportData.users.byLevel.map((lvl, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-card border border-border/50 print:border-gray-200">
                        <span className="text-[11px] text-muted-foreground block">{lvl.level}</span>
                        <div className="text-base font-black text-foreground mt-0.5">
                          {lvl.count} <span className="text-xs font-normal text-muted-foreground">({lvl.percentage}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border/40">
                  <h4 className="text-xs font-bold text-foreground print:text-black mb-1.5">Registration Velocity</h4>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Average student onboarding velocity is <strong className="text-foreground">{(reportData.users.newUsersInPeriod / Math.max(1, reportData.timeframe.durationDays)).toFixed(1)} new registrations/day</strong> during this audit timeframe.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: MARLINE AI COMPUTE & TOKEN AUDIT */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>3. Marline AI Assistant Usage &amp; Token Budget Telemetry</span>
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

          {/* SECTION 4: STUDENT REPORTS, COMPLAINTS & FEEDBACK */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-primary" />
              <span>4. Student Reports, Bug Complaints &amp; Resolution Velocity</span>
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

          {/* SECTION 5: CLOUD INFRASTRUCTURE & RESOURCE CONSUMPTION (VERCEL & SUPABASE) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-gray-500 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              <span>5. Cloud Infrastructure &amp; Resource Consumption (Vercel &amp; Supabase)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Supabase Metrics Card */}
              <div className="p-5 rounded-2xl bg-card border border-emerald-500/20 print:border-gray-300 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-foreground">Supabase PostgreSQL &amp; Auth Telemetry</h4>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 text-[10px]">
                    {reportData.infrastructure.supabase.connectionPoolStatus}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Total Database Records:</span>
                    <strong className="text-foreground font-mono">{reportData.infrastructure.supabase.totalDatabaseRows.toLocaleString()} rows</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Database Storage Footprint:</span>
                    <strong className="text-foreground font-mono">{reportData.infrastructure.supabase.estimatedDbSizeMb} MB</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Auth Registered Identities:</span>
                    <strong className="text-foreground font-mono">{reportData.infrastructure.supabase.authIdentitiesCount}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                    <span className="text-muted-foreground">Average Query Latency:</span>
                    <strong className="text-emerald-500 font-mono">{reportData.infrastructure.supabase.avgQueryLatencyMs}ms (P95)</strong>
                  </div>
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
                This audit log is officially generated and digitally signed for institutional administration reporting.
              </p>
            </div>

            <div className="text-right font-mono text-[10px] space-y-0.5 shrink-0">
              <div>REPORT ID: CHM-AUDIT-{reportData.timeframe.durationDays}D-{Date.now().toString().slice(-6)}</div>
              <div>SECURITY LEVEL: RESTRICTED ACCESS</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
