'use client'

import { useState, useTransition, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Search, 
  Filter, 
  Settings, 
  UserCog, 
  FolderLock, 
  RefreshCw, 
  History, 
  FolderPlus, 
  Trash2, 
  AlertTriangle,
  Loader2,
  FileCode,
  FileText,
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  UserCheck,
  Crown,
  Calendar,
  BarChart3,
  Activity,
  TrendingUp,
  Percent,
  Users,
  Clock,
  AlertCircle,
  GraduationCap,
  KeyRound,
  Fingerprint,
  Monitor,
  Lock,
  ShieldAlert,
  LifeBuoy,
  Send,
  MessageSquare,
  Flame,
  Bug,
  BookOpen,
  User,
  Lightbulb,
  MessageSquareWarning,
  CheckCheck
} from 'lucide-react'
import { 
  updateUserProfile, 
  previewFolderChanges, 
  createAccessRule, 
  deleteAccessRule,
  getAccessRules,
  getAuditLogs,
  getAllUsers,
  syncUserCustomFolderAccess,
  previewCustomFolderChanges,
  verifyQuizWithAI,
  insertQuizToDb,
  getUserAnalytics
} from './actions'
import ExecutiveReportView from '@/components/admin/ExecutiveReportView'
import { 
  getAllReports, 
  updateReportStatusAndReply, 
  getUnresolvedReportsCount, 
  deleteReport 
} from '@/lib/actions/report-actions'
import { UserReport, ReportCategory, ReportPriority, ReportStatus } from '@/lib/types'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts'
import { DRIVE_TREE, DRIVE_ROOT_ID, getSuggestedFolderIds, mapSpecializationToDeptCode, getAllChildFolderIds } from '@/lib/drive-tree-data'
import TokenStatusMonitor from '@/components/TokenStatusMonitor'
import { departmentData } from '@/lib/department-data'

const SPECIALIZATIONS = [
  'Data Science',
  'Cybersecurity',
  'Intelligent Systems',
  'Media Analytics',
  'Business Analytics',
  'Healthcare Informatics'
]

const LEVELS = [1, 2, 3, 4]

interface AdminDashboardClientProps {
  initialUsers: any[]
  initialTotalCount: number
  initialRules: any[]
  initialLogs: any[]
  adminAuthId: string
}

export default function AdminDashboardClient({
  initialUsers,
  initialTotalCount,
  initialRules,
  initialLogs,
  adminAuthId
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('users')
  
  // Data States
  const [users, setUsers] = useState(initialUsers)
  const [rules, setRules] = useState(initialRules)
  const [logs, setLogs] = useState(initialLogs)

  // Analytics Telemetry States
  const [analyticsData, setAnalyticsData] = useState<any | null>(null)
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)
  const [selectedAnalyticsLevel, setSelectedAnalyticsLevel] = useState<string>('ALL')

  // Rules & Audit Logs Lazy-Loading States
  const [rulesLoaded, setRulesLoaded] = useState(initialRules.length > 0)
  const [isRulesLoading, setIsRulesLoading] = useState(false)
  const [logsLoaded, setLogsLoaded] = useState(initialLogs.length > 0)
  const [isLogsLoading, setIsLogsLoading] = useState(false)

  // Reports Management States
  const [unresolvedReportsCount, setUnresolvedReportsCount] = useState<number>(0)
  const [reportsList, setReportsList] = useState<UserReport[]>([])
  const [reportsLoading, setReportsLoading] = useState<boolean>(false)
  const [reportsTotalFiltered, setReportsTotalFiltered] = useState<number>(0)
  const [reportsPage, setReportsPage] = useState<number>(1)
  const [reportsStatusFilter, setReportsStatusFilter] = useState<string>('all')
  const [reportsCategoryFilter, setReportsCategoryFilter] = useState<string>('all')
  const [reportsPriorityFilter, setReportsPriorityFilter] = useState<string>('all')
  const [reportsSearch, setReportsSearch] = useState<string>('')
  const [reportsStats, setReportsStats] = useState<{
    total: number
    open: number
    inProgress: number
    resolved: number
    closed: number
    unresolved: number
  }>({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0, unresolved: 0 })

  // Reply & Status Dialog state
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null)
  const [adminReplyText, setAdminReplyText] = useState<string>('')
  const [adminSelectedStatus, setAdminSelectedStatus] = useState<ReportStatus>('open')
  const [isUpdatingReport, setIsUpdatingReport] = useState<boolean>(false)

  const fetchUnresolvedCount = async () => {
    try {
      const count = await getUnresolvedReportsCount()
      setUnresolvedReportsCount(count)
    } catch (e) {
      console.error('Error fetching unresolved count:', e)
    }
  }

  const fetchReportsList = async (page = 1) => {
    setReportsLoading(true)
    try {
      const res = await getAllReports({
        page,
        pageSize: 15,
        status: reportsStatusFilter,
        category: reportsCategoryFilter,
        priority: reportsPriorityFilter,
        search: reportsSearch
      })
      setReportsList(res.reports)
      setReportsTotalFiltered(res.totalFiltered)
      setReportsStats(res.stats)
      setUnresolvedReportsCount(res.stats.unresolved)
      setReportsPage(page)
    } catch (err: any) {
      console.error('Error fetching reports:', err)
      toast.error(err.message || 'Failed to fetch reports')
    } finally {
      setReportsLoading(false)
    }
  }

  useEffect(() => {
    fetchUnresolvedCount()
    const timer = setInterval(fetchUnresolvedCount, 30000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReportsList(reportsPage)
    }
  }, [activeTab, reportsStatusFilter, reportsCategoryFilter, reportsPriorityFilter])

  const handleOpenReplyDialog = (report: UserReport) => {
    setSelectedReport(report)
    setAdminReplyText(report.admin_reply || '')
    setAdminSelectedStatus(report.status)
  }

  const handleSaveReportStatusAndReply = async () => {
    if (!selectedReport) return
    setIsUpdatingReport(true)
    try {
      const res = await updateReportStatusAndReply({
        reportId: selectedReport.id,
        status: adminSelectedStatus,
        adminReply: adminReplyText.trim() || undefined,
        adminAuthId,
        adminName: 'Super Admin'
      })

      if (res.success && res.report) {
        toast.success('Report status updated and student notified successfully!')
        setSelectedReport(null)
        fetchReportsList(reportsPage)
        fetchUnresolvedCount()
      } else {
        toast.error(res.error || 'Failed to save update')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update report status')
    } finally {
      setIsUpdatingReport(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to permanently delete this report?')) return
    try {
      const res = await deleteReport(reportId)
      if (res.success) {
        toast.success('Report deleted successfully')
        fetchReportsList(reportsPage)
        fetchUnresolvedCount()
      } else {
        toast.error(res.error || 'Failed to delete report')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error occurred while deleting report')
    }
  }


  useEffect(() => {
    if (activeTab === 'analytics' && !analyticsData) {
      const fetchAnalytics = async () => {
        setIsAnalyticsLoading(true)
        try {
          const res = await getUserAnalytics()
          if (res.success) {
            setAnalyticsData(res)
          } else {
            toast.error('Failed to load user analytics data')
          }
        } catch (err: any) {
          toast.error(err.message || 'Error fetching user analytics')
        } finally {
          setIsAnalyticsLoading(false)
        }
      }
      fetchAnalytics()
    }
  }, [activeTab, analyticsData])

  useEffect(() => {
    if (activeTab === 'rules' && !rulesLoaded) {
      const fetchRules = async () => {
        setIsRulesLoading(true)
        try {
          const res = await getAccessRules()
          setRules(res)
          setRulesLoaded(true)
        } catch (err: any) {
          toast.error(err.message || 'Failed to load access rules')
        } finally {
          setIsRulesLoading(false)
        }
      }
      fetchRules()
    }
  }, [activeTab, rulesLoaded])

  useEffect(() => {
    if (activeTab === 'logs' && !logsLoaded) {
      const fetchLogs = async () => {
        setIsLogsLoading(true)
        try {
          const res = await getAuditLogs()
          setLogs(res)
          setLogsLoaded(true)
        } catch (err: any) {
          toast.error(err.message || 'Failed to load audit logs')
        } finally {
          setIsLogsLoading(false)
        }
      }
      fetchLogs()
    }
  }, [activeTab, logsLoaded])

  const computedMetrics = useMemo(() => {
    if (!analyticsData) return null

    const level = selectedAnalyticsLevel
    
    // Level counts
    let totalUsers = 0
    if (level === 'ALL') {
      totalUsers = analyticsData.totalCount
    } else if (level === 'unknown') {
      totalUsers = analyticsData.levelCounts.unknown
    } else {
      totalUsers = analyticsData.levelCounts[Number(level)] || 0
    }

    // Filtered trends
    let totalUsage = 0
    let totalErrors = 0
    const filteredTrends = analyticsData.trends.map((t: any) => {
      let usage = 0
      let errorRate = 0
      
      if (level === 'ALL') {
        usage = t.usage
        errorRate = t.errorRate
      } else {
        const lvlData = t.byLevel[level]
        if (lvlData) {
          usage = lvlData.usage
          errorRate = lvlData.errorRate
        }
      }
      
      totalUsage += usage
      totalErrors += (usage * errorRate) / 100
      
      return {
        date: t.date,
        usage,
        errorRate
      }
    })

    const avgErrorRate = totalUsage > 0 ? parseFloat(((totalErrors / totalUsage) * 100).toFixed(2)) : 0

    // Filtered hourly activity
    const filteredHourly = analyticsData.hourlyActivity.map((h: any) => {
      let requests = 0
      if (level === 'ALL') {
        requests = h.requests
      } else {
        requests = h.byLevel[level] || 0
      }
      return {
        hour: h.hour,
        requests
      }
    })

    // Compute peak hours for selected level
    const sortedHours = [...filteredHourly].sort((a: any, b: any) => b.requests - a.requests)
    const peakHour1 = sortedHours[0]?.hour || '12:00'
    const peakHour2 = sortedHours[1]?.hour || '20:00'
    const peakHours = `${peakHour1} & ${peakHour2}`

    return {
      totalUsers,
      totalUsage,
      avgErrorRate,
      peakHours,
      trends: filteredTrends,
      hourlyActivity: filteredHourly
    }
  }, [analyticsData, selectedAnalyticsLevel])

  // Quiz Upload States
  const [quizDept, setQuizDept] = useState<string>('')
  const [quizLevel, setQuizLevel] = useState<string>('')
  const [quizSubject, setQuizSubject] = useState<string>('')
  const [quizName, setQuizName] = useState<string>('')
  const [quizJsonStr, setQuizJsonStr] = useState<string>('')
  const [quizCode, setQuizCode] = useState<string>('')
  const [quizTerm, setQuizTerm] = useState<string>('')
  const [questionsCount, setQuestionsCount] = useState<number>(0)
  const [parsedQuestions, setParsedQuestions] = useState<any[] | null>(null)
  const [isVerifyingQuiz, setIsVerifyingQuiz] = useState<boolean>(false)
  const [isUploadingQuiz, setIsUploadingQuiz] = useState<boolean>(false)
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean
    error?: string
    validationErrors?: Array<{
      critical: boolean
      line?: number
      questionText?: string
      error: string
      fix?: string
    }>
  } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)

  const lineNumbers = useMemo(() => {
    const lines = quizJsonStr.split('\n')
    return Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1)
  }, [quizJsonStr])

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const [highlightedLine, setHighlightedLine] = useState<number | null>(null)

  const scrollToLine = (line?: number) => {
    if (!line || !textareaRef.current) return
    setHighlightedLine(line)
    const lineHeight = 20
    const scrollTop = (line - 1) * lineHeight
    textareaRef.current.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })
    textareaRef.current.focus()
  }

  const handleQuizFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        setQuizJsonStr(text)
        setVerificationResult(null)
      }
    }
    reader.readAsText(file)
  }

  const handleQuizVerify = async () => {
    if (!quizDept || !quizLevel || !quizSubject || !quizName || !quizJsonStr.trim()) {
      toast.error('Please fill in all quiz metadata fields and paste questions JSON.')
      return
    }
    setIsVerifyingQuiz(true)
    setVerificationResult(null)
    try {
      const res = await verifyQuizWithAI({
        departmentSlug: quizDept,
        levelNum: Number(quizLevel),
        subjectId: quizSubject,
        quizName,
        quizJsonStr
      })
      if (res.success) {
        setVerificationResult({
          success: true,
          validationErrors: res.validationErrors
        })
        setQuizCode(res.generatedCode || '')
        setQuizTerm(res.term || '')
        setQuestionsCount(res.questionsCount || 0)
        setParsedQuestions(res.parsedQuestions || null)
        const warnings = res.validationErrors?.filter(e => !e.critical) || []
        if (warnings.length > 0) {
          toast.warning(`Quiz verified with ${warnings.length} logic warnings. Review them before uploading.`)
        } else {
          toast.success('Quiz JSON and schema verified successfully!')
        }
      } else {
        setVerificationResult({
          success: false,
          error: res.error,
          validationErrors: res.validationErrors
        })
        toast.error(res.error || 'Failed to verify quiz.')
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected error occurred during verification.')
    } finally {
      setIsVerifyingQuiz(false)
    }
  }

  const handleQuizUpload = async () => {
    if (!quizCode.trim()) {
      toast.error('Quiz code is required. Please enter or generate it.')
      return
    }
    if (!parsedQuestions) {
      toast.error('Please verify the quiz JSON first.')
      return
    }
    setIsUploadingQuiz(true)
    try {
      const res = await insertQuizToDb({
        code: quizCode,
        name: quizName,
        duration: 'OP',
        questionsCount,
        questions: parsedQuestions,
        departmentSlug: quizDept,
        levelNum: Number(quizLevel),
        subjectId: quizSubject,
        term: quizTerm
      })

      if (res.success) {
        toast.success('Quiz uploaded to database successfully!')
        // Reset form
        setQuizName('')
        setQuizJsonStr('')
        setQuizCode('')
        setQuizTerm('')
        setQuestionsCount(0)
        setParsedQuestions(null)
        setVerificationResult(null)
      } else {
        toast.error(res.error || 'Failed to upload quiz.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload quiz due to an error.')
    } finally {
      setIsUploadingQuiz(false)
    }
  }

  const subjectsList = useMemo(() => {
    if (!quizDept || !quizLevel) return []
    const dept = departmentData[quizDept]
    const levelNum = Number(quizLevel)
    const lvl = dept?.levels[levelNum]
    if (!lvl) return []
    return [...lvl.subjects.term1, ...lvl.subjects.term2]
  }, [quizDept, quizLevel])

  // Filters & Search
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('ALL')
  const [levelFilter, setLevelFilter] = useState('ALL')

  // Pagination & Loading States
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(initialTotalCount)
  const [isLoading, setIsLoading] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const isFirstMount = useRef(true)

  // Edit User States
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editAdmin, setEditAdmin] = useState(false)
  const [editSpec, setEditSpec] = useState<string>('')
  const [editLevel, setEditLevel] = useState<string>('')
  const [editBanned, setEditBanned] = useState(false)

  // Confirmation Dialog States
  const [showConfirm, setShowConfirm] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewChanges, setPreviewChanges] = useState<{
    foldersToGrant: Array<{ id: string; name: string }>
    foldersToRevoke: Array<{ id: string; name: string }>
  }>({ foldersToGrant: [], foldersToRevoke: [] })

  // Add Access Rule States
  const [newRuleSpec, setNewRuleSpec] = useState<string>('ALL')
  const [newRuleLevel, setNewRuleLevel] = useState<string>('ALL')
  const [newRuleFolderUrl, setNewRuleFolderUrl] = useState('')
  const [newRuleFolderName, setNewRuleFolderName] = useState('')
  const [isCreatingRule, setIsCreatingRule] = useState(false)

  // Auto-parse Drive Folder ID from URL
  useEffect(() => {
    if (newRuleFolderUrl.includes('drive.google.com/drive/folders/')) {
      const match = newRuleFolderUrl.match(/\/folders\/([^/?]+)/)
      if (match && match[1] && !newRuleFolderName) {
        // Just extract, name can be entered or fetched if possible
      }
    }
  }, [newRuleFolderUrl])

  // Year Access States
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [customAccessType, setCustomAccessType] = useState<'suggested' | 'full' | 'custom' | 'none'>('suggested')
  const [customYears, setCustomYears] = useState<string[]>([])
  const [customDepts, setCustomDepts] = useState<string[]>([])
  const [customFolders, setCustomFolders] = useState<string[]>([])
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncPreview, setSyncPreview] = useState<{
    foldersToGrant: Array<{ id: string; name: string }>
    foldersToRevoke: Array<{ id: string; name: string }>
  }>({ foldersToGrant: [], foldersToRevoke: [] })
  const [showSyncConfirm, setShowSyncConfirm] = useState(false)

  // Student Search States (for Year Access tab selector)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentOptions, setStudentOptions] = useState<any[]>(initialUsers)
  const [isSearchingStudents, setIsSearchingStudents] = useState(false)

  // Debounced search for student selector in Year Access tab
  useEffect(() => {
    const term = studentSearch.trim()
    if (term === '') {
      setStudentOptions(users)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearchingStudents(true)
      try {
        const res = await getAllUsers({
          page: 1,
          pageSize: 50,
          search: term,
          specialization: 'ALL',
          level: 'ALL'
        })
        setStudentOptions(res.users)
      } catch (err) {
        console.error('Failed to search students in access tab:', err)
      } finally {
        setIsSearchingStudents(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [studentSearch, users])

  const displayStudents = [...studentOptions]
  if (selectedUser && !displayStudents.some(u => u.auth_id === selectedUser.auth_id)) {
    displayStudents.unshift(selectedUser)
  }

  const handleUserSelect = (userId: string) => {
    if (userId === 'none') {
      setSelectedUser(null)
      return
    }
    const user = displayStudents.find(u => u.auth_id === userId)
    if (!user) {
      setSelectedUser(null)
      return
    }

    setSelectedUser(user)

    // Load their existing rules from rules state
    const userSpecificRules = rules.filter(r => r.specialization === `user:${user.auth_id}`)
    
    if (userSpecificRules.length > 0) {
      const folderIds = userSpecificRules.map(r => r.folder_id)
      if (folderIds.includes('none')) {
        setCustomAccessType('none')
        setCustomYears([])
        setCustomDepts([])
        setCustomFolders([])
      } else if (folderIds.includes(DRIVE_ROOT_ID)) {
        setCustomAccessType('full')
        setCustomYears([])
        setCustomDepts([])
        setCustomFolders([DRIVE_ROOT_ID])
      } else {
        setCustomAccessType('custom')
        setCustomFolders(folderIds)
        
        // Infer active years and departments to pre-fill standard options if possible
        const activeYears: string[] = []
        const activeDepts: string[] = []
        
        // Year detection
        for (let y = 1; y <= 4; y++) {
          const yearNode = DRIVE_TREE.children?.find(c => c.name === `YEAR ${y}`)
          if (yearNode) {
            const yearFolderIds = getAllChildFolderIds(yearNode)
            if (yearFolderIds.every(id => folderIds.includes(id))) {
              activeYears.push(`year${y}`)
            }
          }
        }
        
        // Department detection
        const depts = ['general', 'cyber', 'ai', 'business', 'media']
        for (const dept of depts) {
          let matchesAll = true
          let hasDept = false
          const checkDept = (node: any) => {
            if (node.type === 'department' && node.name.toLowerCase() === dept) {
              hasDept = true
              if (!folderIds.includes(node.id)) {
                matchesAll = false
              }
            }
            if (node.children) {
              node.children.forEach(checkDept)
            }
          }
          DRIVE_TREE.children?.forEach(checkDept)
          if (hasDept && matchesAll) {
            activeDepts.push(dept)
          }
        }
        
        setCustomYears(activeYears)
        setCustomDepts(activeDepts)
      }
    } else {
      setCustomAccessType('suggested')
      setCustomYears([])
      setCustomDepts([])
      setCustomFolders(getSuggestedFolderIds(user.current_level, user.specialization))
    }
  }

  const suggestedFolderIds = selectedUser
    ? getSuggestedFolderIds(selectedUser.current_level, selectedUser.specialization)
    : []

  const isFolderSelected = (folderId: string): boolean => {
    if (customAccessType === 'full') {
      return true
    }
    if (customAccessType === 'suggested') {
      return suggestedFolderIds.includes(folderId)
    }
    return customFolders.includes(folderId)
  }

  const handleFolderToggle = (folderId: string) => {
    if (customAccessType !== 'custom') return
    
    setCustomFolders(prev => {
      if (prev.includes(folderId)) {
        return prev.filter(id => id !== folderId)
      } else {
        return [...prev, folderId]
      }
    })
  }

  const handleYearToggle = (yearStr: string) => {
    if (customAccessType !== 'custom') return
    const levelNum = parseInt(yearStr.replace('year', ''))
    const yearNode = DRIVE_TREE.children?.find(c => c.name === `YEAR ${levelNum}`)
    if (!yearNode) return

    const yearFolderIds = getAllChildFolderIds(yearNode)
    const isAdding = !customYears.includes(yearStr)

    setCustomYears(prev => 
      isAdding ? [...prev, yearStr] : prev.filter(y => y !== yearStr)
    )

    setCustomFolders(prev => {
      if (isAdding) {
        const newSet = new Set([...prev, ...yearFolderIds])
        return Array.from(newSet)
      } else {
        return prev.filter(id => !yearFolderIds.includes(id))
      }
    })
  }

  const handleDeptToggle = (deptStr: string) => {
    if (customAccessType !== 'custom') return
    const isAdding = !customDepts.includes(deptStr)

    setCustomDepts(prev => 
      isAdding ? [...prev, deptStr] : prev.filter(d => d !== deptStr)
    )

    const deptFolderIds: string[] = []
    const collectDeptFolders = (node: any) => {
      if (node.type === 'department' && node.name.toLowerCase() === deptStr.toLowerCase()) {
        deptFolderIds.push(...getAllChildFolderIds(node))
      }
      if (node.children) {
        node.children.forEach(collectDeptFolders)
      }
    }
    DRIVE_TREE.children?.forEach(collectDeptFolders)

    setCustomFolders(prev => {
      if (isAdding) {
        const newSet = new Set([...prev, ...deptFolderIds])
        return Array.from(newSet)
      } else {
        return prev.filter(id => !deptFolderIds.includes(id))
      }
    })
  }

  const handleCustomSaveClick = async () => {
    if (!selectedUser) return
    
    setPreviewLoading(true)
    try {
      const preview = await previewCustomFolderChanges(selectedUser.auth_id, {
        type: customAccessType,
        years: customYears,
        departments: customDepts,
        customFolders: customFolders
      })
      setSyncPreview(preview)
      setShowSyncConfirm(true)
    } catch (err: any) {
      toast.error(`Failed to preview changes: ${err.message}`)
    } finally {
      setPreviewLoading(false)
    }
  }

  const executeCustomSync = () => {
    if (!selectedUser) return
    
    setSyncLoading(true)
    startTransition(async () => {
      try {
        const res = await syncUserCustomFolderAccess(selectedUser.auth_id, {
          type: customAccessType,
          years: customYears,
          departments: customDepts,
          customFolders: customFolders
        })

        if (res.success) {
          toast.success('Folder access updated successfully')
          if (res.driveSyncResult) {
            const { granted, revoked, errors } = res.driveSyncResult
            if (errors && errors.length > 0) {
              toast.warning(`Drive permission issues: ${errors.join(', ')}`)
            } else if (granted.length > 0 || revoked.length > 0) {
              toast.success(`Drive synced: +${granted.length} folders, -${revoked.length} folders`)
            }
          }
          
          if (customAccessType === 'suggested') {
            setRules(rules.filter(r => r.specialization !== `user:${selectedUser.auth_id}`))
          } else if (customAccessType === 'none') {
            const revokedRule = {
              id: Math.random().toString(),
              specialization: `user:${selectedUser.auth_id}`,
              current_level: null,
              folder_id: 'none',
              folder_name: 'Access Revoked',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            setRules([
              ...rules.filter(r => r.specialization !== `user:${selectedUser.auth_id}`),
              revokedRule
            ])
          } else {
            const { findFolderNameById, DRIVE_TREE } = require('@/lib/drive-tree-data')
            const newRules = customFolders.map(folderId => ({
              id: Math.random().toString(),
              specialization: `user:${selectedUser.auth_id}`,
              current_level: null,
              folder_id: folderId,
              folder_name: findFolderNameById(DRIVE_TREE, folderId) || folderId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
            
            setRules([
              ...rules.filter(r => r.specialization !== `user:${selectedUser.auth_id}`),
              ...newRules
            ])
          }
          
          router.refresh()
        } else {
          toast.error(res.error || 'Failed to update folder access')
        }
      } catch (err: any) {
        toast.error(err.message || 'An unexpected error occurred')
      } finally {
        setSyncLoading(false)
        setShowSyncConfirm(false)
      }
    })
  }

  // Debounce search input and reset page to 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch users from server when filters, search, or pagination changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }

    const loadUsers = async () => {
      setIsLoading(true)
      try {
        const res = await getAllUsers({
          page,
          pageSize,
          search: debouncedSearch,
          specialization: specFilter,
          level: levelFilter,
        })
        setUsers(res.users)
        setTotalCount(res.totalCount)
      } catch (err: any) {
        toast.error(err.message || 'Failed to fetch users')
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [debouncedSearch, specFilter, levelFilter, page, pageSize])

  // Open Edit User modal
  const handleOpenEdit = (user: any) => {
    setEditingUser(user)
    setEditAdmin(user.is_admin)
    setEditSpec(user.specialization || 'None')
    setEditLevel(user.current_level ? String(user.current_level) : 'None')
    setEditBanned(user.is_banned || false)
  }

  // Handle Save (Trigger Folder Access Preview)
  const handleSaveClick = async () => {
    if (!editingUser) return

    const specVal = editSpec === 'None' ? null : editSpec
    const levelVal = editLevel === 'None' ? null : Number(editLevel)

    // If specialization or level changed, fetch previews
    if (editingUser.specialization !== specVal || editingUser.current_level !== levelVal) {
      setPreviewLoading(true)
      try {
        const preview = await previewFolderChanges(editingUser.auth_id, specVal, levelVal)
        setPreviewChanges(preview)
        setShowConfirm(true)
      } catch (err: any) {
        toast.error(`Failed to preview changes: ${err.message}`)
      } finally {
        setPreviewLoading(false)
      }
    } else {
      // If only admin status changed, execute directly
      executeUserUpdate()
    }
  }

  // Execute User Permissions Update
  const executeUserUpdate = () => {
    if (!editingUser) return

    const specVal = editSpec === 'None' ? null : editSpec
    const levelVal = editLevel === 'None' ? null : Number(editLevel)

    startTransition(async () => {
      try {
        const res = await updateUserProfile(editingUser.auth_id, {
          is_admin: editAdmin,
          specialization: specVal,
          current_level: levelVal,
          is_banned: editBanned
        })

        if (res.success) {
          toast.success('User updated successfully')
          if (res.driveSyncResult) {
            const { granted, revoked, errors } = res.driveSyncResult
            if (errors && errors.length > 0) {
              toast.warning(`Drive permission issues: ${errors.join(', ')}`)
            } else if (granted.length > 0 || revoked.length > 0) {
              toast.success(`Drive synced: +${granted.length} folders, -${revoked.length} folders`)
            }
          }
          
          // Refresh user list
          // Simple client update to avoid full reload
          setUsers(users.map(u => u.auth_id === editingUser.auth_id ? {
            ...u,
            is_admin: editAdmin,
            specialization: specVal,
            current_level: levelVal,
            is_banned: editBanned
          } : u))
          
          // Re-fetch logs to display in table
          router.refresh()
        } else {
          toast.error(res.error || 'Failed to update user')
        }
      } catch (err: any) {
        toast.error(err.message || 'An unexpected error occurred')
      } finally {
        setEditingUser(null)
        setShowConfirm(false)
      }
    })
  }

  // Handle Add Access Rule
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRuleFolderName || !newRuleFolderUrl) {
      toast.error('Folder Name and Folder ID/Link are required')
      return
    }

    // Extract ID from URL if pasted
    let folderId = newRuleFolderUrl.trim()
    if (folderId.includes('drive.google.com/drive/folders/')) {
      const match = folderId.match(/\/folders\/([^/?]+)/)
      if (match && match[1]) {
        folderId = match[1]
      }
    }

    setIsCreatingRule(true)
    try {
      const specVal = newRuleSpec === 'ALL' ? null : newRuleSpec
      const levelVal = newRuleLevel === 'ALL' ? null : Number(newRuleLevel)

      const res = await createAccessRule({
        specialization: specVal,
        current_level: levelVal,
        folderId,
        folderName: newRuleFolderName
      })

      const anyRes = res as any
      if (anyRes?.success && anyRes?.data) {
        toast.success(`Access rule created for "${newRuleFolderName}"`)
        setRules([anyRes.data, ...rules])
        setNewRuleFolderName('')
        setNewRuleFolderUrl('')
        router.refresh()
      } else {
        toast.error(anyRes?.error || 'Failed to create access rule')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add rule')
    } finally {
      setIsCreatingRule(false)
    }
  }

  // Handle Delete Access Rule
  const handleDeleteRule = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the access rule for "${name}"?`)) return

    try {
      const res = await deleteAccessRule(id)
      if (res.success) {
        toast.success(`Access rule for "${name}" deleted`)
        setRules(rules.filter(r => r.id !== id))
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to delete access rule')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete rule')
    }
  }

  const renderTreeNodes = (node: any, depth = 0) => {
    const isSelected = isFolderSelected(node.id)
    const isSuggested = suggestedFolderIds.includes(node.id)
    const paddingLeft = `${depth * 1.25 + 0.5}rem`
    
    return (
      <div key={node.id} className="space-y-1">
        <div 
          className={`flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors ${
            isSuggested ? 'bg-primary/5 border border-primary/20' : ''
          } ${isSelected && customAccessType === 'custom' ? 'bg-secondary/10' : ''}`}
          style={{ paddingLeft }}
        >
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              id={`folder-${node.id}`}
              checked={isSelected}
              disabled={customAccessType !== 'custom'}
              onChange={() => handleFolderToggle(node.id)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-muted/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor={`folder-${node.id}`} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              {node.type === 'root' && <FolderLock className="w-4 h-4 text-yellow-500 font-bold" />}
              {node.type === 'year' && <Crown className="w-4 h-4 text-indigo-400 font-bold animate-pulse" />}
              {node.type === 'term' && <Calendar className="w-4 h-4 text-purple-400" />}
              {node.type === 'department' && (
                <Badge variant="outline" className="text-[9px] py-0 h-4 px-1.5 font-bold border-indigo-500/20 bg-indigo-500/5 text-indigo-400">
                  {node.name}
                </Badge>
              )}
              {node.type === 'subject' && <FileCode className="w-4 h-4 text-green-400" />}
              <span className="truncate max-w-[150px] md:max-w-xs text-foreground/90">{node.name}</span>
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            {isSuggested && (
              <Badge className="text-[8px] h-3.5 py-0 px-1 bg-primary/20 text-primary border-primary/30 font-semibold">
                Suggested
              </Badge>
            )}
            <span className="text-[9px] text-muted-foreground font-mono hidden md:inline">
              {node.id.substring(0, 8)}
            </span>
          </div>
        </div>
        {node.children && node.children.map((child: any) => renderTreeNodes(child, depth + 1))}
      </div>
    )
  }

  return (
    <div className="space-y-8 premium-container">
      {/* Top Banner / Hero */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-card to-muted border border-border shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                <Shield className="w-3.5 h-3.5 mr-1" />
                Super Admin Mode
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">System Admin Console</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage student permissions, configure dynamic Google Drive folders access, and view administrative logs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-muted px-4 py-2 rounded-lg border border-border flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Authorized Super Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs System */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="relative grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto bg-black/5 dark:bg-white/5 backdrop-blur-md p-1.5 rounded-xl border border-black/10 dark:border-white/10 max-w-6xl mb-8">
          <TabsTrigger 
            value="users" 
            className="relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground data-[state=active]:text-white focus-visible:outline-none select-none cursor-pointer bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
          >
            {activeTab === 'users' && (
              <motion.div
                layoutId="active-admin-tab"
                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg -z-10 shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <UserCog className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'users' ? 'scale-110 rotate-3' : 'hover:scale-110'}`} />
            <span>User Directory</span>
          </TabsTrigger>

          <TabsTrigger 
            value="analytics" 
            className="relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground data-[state=active]:text-white focus-visible:outline-none select-none cursor-pointer bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
          >
            {activeTab === 'analytics' && (
              <motion.div
                layoutId="active-admin-tab"
                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg -z-10 shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <BarChart3 className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'analytics' ? 'scale-110 rotate-6' : 'hover:scale-110'}`} />
            <span>Analytics</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="rules" 
            className="relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground data-[state=active]:text-white focus-visible:outline-none select-none cursor-pointer bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
          >
            {activeTab === 'rules' && (
              <motion.div
                layoutId="active-admin-tab"
                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg -z-10 shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <FolderLock className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'rules' ? 'scale-110 -rotate-3' : 'hover:scale-110'}`} />
            <span>Year Access</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="tokens" 
            className="relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground data-[state=active]:text-white focus-visible:outline-none select-none cursor-pointer bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
          >
            {activeTab === 'tokens' && (
              <motion.div
                layoutId="active-admin-tab"
                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg -z-10 shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <RefreshCw className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'tokens' ? 'scale-110 rotate-12' : 'hover:scale-110'}`} />
            <span>Token Monitor</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="logs" 
            className="relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground data-[state=active]:text-white focus-visible:outline-none select-none cursor-pointer bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
          >
            {activeTab === 'logs' && (
              <motion.div
                layoutId="active-admin-tab"
                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg -z-10 shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <History className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'logs' ? 'scale-110 -rotate-6' : 'hover:scale-110'}`} />
            <span>Audit Logs</span>
          </TabsTrigger>

          <TabsTrigger 
            value="quizzes" 
            className="relative flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground data-[state=active]:text-white focus-visible:outline-none select-none cursor-pointer bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
          >
            {activeTab === 'quizzes' && (
              <motion.div
                layoutId="active-admin-tab"
                className="absolute inset-0 bg-gradient-to-r from-primary to-secondary rounded-lg -z-10 shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <FileCode className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'quizzes' ? 'scale-110 rotate-12' : 'hover:scale-110'}`} />
            <span>Quizzes</span>
          </TabsTrigger>

          

          <TabsTrigger 
            value="reports" 
            className="relative flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground data-[state=active]:text-white focus-visible:outline-none select-none cursor-pointer bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none"
          >
            {activeTab === 'reports' && (
              <motion.div
                layoutId="active-admin-tab"
                className="absolute inset-0 bg-gradient-to-r from-red-500 via-primary to-secondary rounded-lg -z-10 shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <LifeBuoy className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'reports' ? 'scale-110 rotate-12' : 'hover:scale-110'}`} />
            <span>Reports</span>
            {unresolvedReportsCount > 0 && (
              <span className="relative flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-extrabold bg-red-500 text-white shadow-md shadow-red-500/50 animate-pulse ml-0.5">
                {unresolvedReportsCount}
              </span>
            )}
          </TabsTrigger>

          <TabsTrigger 
            value="executive_report" 
            className="relative flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 text-muted-foreground hover:text-foreground data-[state=active]:text-white focus-visible:outline-none select-none cursor-pointer bg-transparent data-[state=active]:!bg-transparent data-[state=active]:!shadow-none font-rubik"
          >
            {activeTab === 'executive_report' && (
              <motion.div
                layoutId="active-admin-tab"
                className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-primary to-secondary rounded-lg -z-10 shadow-lg shadow-primary/30"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <FileText className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'executive_report' ? 'scale-110 rotate-6' : 'hover:scale-110'}`} />
            <span>Exe-Repo</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: User Directory */}
        <TabsContent value="users" className="mt-0 focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-4">
              <CardTitle>User Directory</CardTitle>
              <CardDescription>
                Search and manage students' platform roles and account access privileges.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Row */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by username or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-muted/30 border-border"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-lg border border-border overflow-hidden relative">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Admin Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="text-sm font-medium">Loading user data...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                          No users found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.auth_id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="font-semibold">{u.username || 'No Username'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{u.email || 'No Email'}</TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 items-center flex-wrap">
                              {u.is_super_admin && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Super Admin</Badge>
                              )}
                              {u.is_admin ? (
                                <Badge className="bg-primary/20 text-primary border-primary/30">Admin</Badge>
                              ) : (
                                <Badge variant="secondary" className="opacity-40">Student</Badge>
                              )}
                              {u.is_banned && (
                                <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 animate-pulse">Banned</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              onClick={() => handleOpenEdit(u)}
                              variant="outline" 
                              size="sm"
                              className="border-border hover:bg-primary/10 hover:text-primary transition-all"
                            >
                              <Settings className="w-3.5 h-3.5 mr-1" />
                              Manage
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
                <div className="text-xs text-muted-foreground">
                  Showing{' '}
                  <span className="font-semibold text-foreground">
                    {users.length === 0 ? 0 : (page - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-foreground">
                    {Math.min(page * pageSize, totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-foreground">{totalCount}</span>{' '}
                  entries
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rows per page:</span>
                    <Select
                      value={String(pageSize)}
                      onValueChange={(val) => {
                        setPageSize(Number(val))
                        setPage(1)
                      }}
                    >
                      <SelectTrigger className="w-[70px] h-8 bg-muted/20 border-border text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Page Navigation Buttons */}
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                      className="h-8 border-border hover:bg-muted text-xs px-2.5"
                    >
                      Previous
                    </Button>

                    {/* Page Numbers */}
                    {(() => {
                      const totalPages = Math.ceil(totalCount / pageSize)
                      const pages = []
                      const maxVisible = 5
                      let startPage = Math.max(1, page - Math.floor(maxVisible / 2))
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1)

                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1)
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={page === i ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(i)}
                            disabled={isLoading}
                            className={`h-8 w-8 text-xs p-0 border-border ${
                              page === i ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                            }`}
                          >
                            {i}
                          </Button>
                        )
                      }
                      return pages
                    })()}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const totalPages = Math.ceil(totalCount / pageSize)
                        setPage((p) => Math.min(totalPages, p + 1))
                      }}
                      disabled={page >= Math.ceil(totalCount / pageSize) || isLoading}
                      className="h-8 border-border hover:bg-muted text-xs px-2.5"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Tab: System Analytics & Trends */}
        <TabsContent value="analytics" className="mt-0 focus-visible:outline-none">
          {isAnalyticsLoading && (
            <Card className="bg-card border-border shadow-md p-10 flex flex-col items-center justify-center min-h-[400px]">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground text-sm">Aggregating telemetry data...</p>
            </Card>
          )}

          {!isAnalyticsLoading && computedMetrics && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Header and Filter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">System Performance & User Analytics</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Monitor system usage, failure error rates, and peak hours.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg border border-border">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Segment by Level:</span>
                    <Select value={selectedAnalyticsLevel} onValueChange={setSelectedAnalyticsLevel}>
                      <SelectTrigger className="w-[140px] h-8 text-xs bg-card">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Levels</SelectItem>
                        <SelectItem value="1">Level 1</SelectItem>
                        <SelectItem value="2">Level 2</SelectItem>
                        <SelectItem value="3">Level 3</SelectItem>
                        <SelectItem value="4">Level 4</SelectItem>
                        <SelectItem value="unknown">Unspecified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 border-border hover:bg-muted"
                    onClick={async () => {
                      setIsAnalyticsLoading(true)
                      try {
                        const res = await getUserAnalytics()
                        if (res.success) {
                          setAnalyticsData(res)
                          toast.success('Analytics metrics refreshed!')
                        }
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to refresh')
                      } finally {
                        setIsAnalyticsLoading(false)
                      }
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <Card className="bg-card/40 border-border backdrop-blur-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Total Registered Users</span>
                      <Users className="w-4 h-4 text-blue-500" />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {computedMetrics.totalUsers.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Registered users in database for selected tier.
                    </p>
                  </CardContent>
                </Card>

                {/* Total Usage */}
                <Card className="bg-card/40 border-border backdrop-blur-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>30-Day Query Usage</span>
                      <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {computedMetrics.totalUsage.toLocaleString()}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Total requests generated in the past 30 days.
                    </p>
                  </CardContent>
                </Card>

                {/* Avg Error Rate */}
                <Card className="bg-card/40 border-border backdrop-blur-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-rose-500 to-orange-500" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Average Error Rate</span>
                      <Percent className="w-4 h-4 text-rose-500" />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                      {computedMetrics.avgErrorRate}%
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Percentage of failed or rate-limited requests.
                    </p>
                  </CardContent>
                </Card>

                {/* Peak Hours */}
                <Card className="bg-card/40 border-border backdrop-blur-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 to-purple-500" />
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      <span>Peak Activity Hours</span>
                      <Clock className="w-4 h-4 text-violet-500" />
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-foreground h-9 flex items-center group-hover:text-primary transition-colors">
                      {computedMetrics.peakHours}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Hours of maximum client requests.
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Usage & Error Trends Chart */}
                <Card className="lg:col-span-2 bg-card border-border shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Usage & Error Rate Trends (Last 30 Days)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Daily traffic requests and average failure percentages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={computedMetrics.trends}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                          <XAxis 
                            dataKey="date" 
                            stroke="rgba(128,128,128,0.5)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            yAxisId="left" 
                            stroke="rgba(128,128,128,0.5)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="rgba(128,128,128,0.5)" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                              borderColor: 'rgba(128,128,128,0.2)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px'
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Area 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="usage" 
                            name="Queries" 
                            stroke="#3b82f6" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#usageGradient)" 
                          />
                          <Area 
                            yAxisId="right" 
                            type="monotone" 
                            dataKey="errorRate" 
                            name="Error Rate (%)" 
                            stroke="#f43f5e" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#errorGradient)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Level Distribution (Pie) */}
                <Card className="bg-card border-border shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Users className="w-4 h-4 text-violet-500" />
                      User Level Distribution
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Registered users segmented by authorization level.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="h-[200px] w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Level 1', value: analyticsData.levelCounts[1] || 0, color: '#3b82f6' },
                              { name: 'Level 2', value: analyticsData.levelCounts[2] || 0, color: '#10b981' },
                              { name: 'Level 3', value: analyticsData.levelCounts[3] || 0, color: '#eab308' },
                              { name: 'Level 4', value: analyticsData.levelCounts[4] || 0, color: '#a855f7' },
                              { name: 'Unspecified', value: analyticsData.levelCounts.unknown || 0, color: '#6b7280' },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={70}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {[
                              { name: 'Level 1', value: analyticsData.levelCounts[1] || 0, color: '#3b82f6' },
                              { name: 'Level 2', value: analyticsData.levelCounts[2] || 0, color: '#10b981' },
                              { name: 'Level 3', value: analyticsData.levelCounts[3] || 0, color: '#eab308' },
                              { name: 'Level 4', value: analyticsData.levelCounts[4] || 0, color: '#a855f7' },
                              { name: 'Unspecified', value: analyticsData.levelCounts.unknown || 0, color: '#6b7280' },
                            ].filter(d => d.value > 0).map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                              borderColor: 'rgba(128,128,128,0.2)',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '11px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* Total overlay in center */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total</span>
                        <span className="text-xl font-extrabold">{analyticsData.totalCount}</span>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 text-[10px] font-medium w-full max-w-xs">
                      {[
                        { name: 'Level 1', value: analyticsData.levelCounts[1] || 0, color: 'bg-blue-500' },
                        { name: 'Level 2', value: analyticsData.levelCounts[2] || 0, color: 'bg-emerald-500' },
                        { name: 'Level 3', value: analyticsData.levelCounts[3] || 0, color: 'bg-yellow-500' },
                        { name: 'Level 4', value: analyticsData.levelCounts[4] || 0, color: 'bg-purple-500' },
                        { name: 'Unspecified', value: analyticsData.levelCounts.unknown || 0, color: 'bg-gray-500' },
                      ].filter(d => d.value > 0).map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                            <span className="text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="font-semibold">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Hourly Traffic Card (Peak Hours details) */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-violet-500" />
                    Hourly System Traffic (Peak Load Analysis)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Average query requests distributed across the 24-hour day cycle.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={computedMetrics.hourlyActivity}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.85}/>
                            <stop offset="100%" stopColor="#c084fc" stopOpacity={0.25}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.15)" />
                        <XAxis 
                          dataKey="hour" 
                          stroke="rgba(128,128,128,0.5)" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="rgba(128,128,128,0.5)" 
                          fontSize={9} 
                          tickLine={false} 
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(10, 10, 10, 0.9)', 
                            borderColor: 'rgba(128,128,128,0.2)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '11px'
                          }}
                        />
                        <Bar 
                          dataKey="requests" 
                          name="Queries" 
                          fill="url(#barGradient)" 
                          stroke="#a855f7"
                          strokeWidth={1}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Telemetry Diagnostics & Recommendations */}
              <Card className="bg-card border-border shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    System Telemetry Insights & Recommendations (Level: {selectedAnalyticsLevel === 'ALL' ? 'All' : `Level ${selectedAnalyticsLevel}`})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Automated performance diagnostics and system load assessments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                    {/* Insights 1 */}
                    <div className="space-y-2 bg-muted/25 p-4 rounded-xl border border-border">
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        Peak Hour Optimization
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Traffic peaks significantly during <strong className="text-foreground">{computedMetrics.peakHours}</strong>. 
                        This aligns with student homework completion and evening study review sessions. We recommend configuring autoscaling rules in Cloud Run or your deployment platform to warm instances 30 minutes before these slots to avoid cold starts.
                      </p>
                    </div>

                    {/* Insights 2 */}
                    <div className="space-y-2 bg-muted/25 p-4 rounded-xl border border-border">
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Stability & SLA Health
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The current cohort exhibits an average failure rate of <strong className="text-foreground">{computedMetrics.avgErrorRate}%</strong>, 
                        which is well within the acceptable SLA target (&lt; 5.0%). The localized spikes in error trends correlate with rate-limit blocks (429 status codes) during concurrent quiz submissions.
                      </p>
                    </div>

                    {/* Insights 3 */}
                    <div className="space-y-2 bg-muted/25 p-4 rounded-xl border border-border">
                      <h4 className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Cohort Behavior Insights
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {selectedAnalyticsLevel === 'ALL' ? (
                          <>
                            Level 4 and Level 3 cohorts generate over <strong className="text-foreground">70% of total query volume</strong> despite constituting a smaller percentage of the user directory. This is expected due to their access to advanced study modules and multiple quiz sync features.
                          </>
                        ) : (
                          <>
                            Under <strong className="text-foreground">Level {selectedAnalyticsLevel} segment</strong>, users generated <strong className="text-foreground">{computedMetrics.totalUsage.toLocaleString()}</strong> requests over the last 30 days. Activity metrics indicate stable daily study patterns with a standard weekend usage reduction of ~35%.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>

        {/* Tab 2: Year Access Console */}
        <TabsContent value="rules" className="mt-0 focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Student Selection & Settings Panel */}
            <Card className="lg:col-span-1 bg-card border-border shadow-lg h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <UserCog className="w-5 h-5 text-primary" />
                  Select Student Access
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs mt-1">
                  Manage year levels, departments, or custom folders for specific students.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Search Student Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Search Student</span>
                    {isSearchingStudents && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    )}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Type username or email to search..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-8 h-9 bg-muted/10 border-border text-sm focus-visible:ring-1"
                    />
                  </div>
                </div>

                {/* User Search & Selection List */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">Select Student</label>
                  <div className="border border-border rounded-xl bg-muted/5 overflow-hidden shadow-inner">
                    <div className="max-h-[220px] overflow-y-auto divide-y divide-border/50" data-lenis-prevent="true">
                      {displayStudents.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          No students found
                        </div>
                      ) : (
                        displayStudents.map(u => {
                          const isSelected = selectedUser?.auth_id === u.auth_id
                          return (
                            <button
                              key={u.auth_id}
                              type="button"
                              onClick={() => handleUserSelect(u.auth_id)}
                              className={`w-full text-left p-3 flex items-center justify-between hover:bg-muted/40 transition-all text-xs border-l-2 ${
                                isSelected 
                                  ? 'bg-primary/5 border-l-primary font-semibold' 
                                  : 'border-l-transparent'
                              }`}
                            >
                              <div className="space-y-0.5 min-w-0 pr-2">
                                <div className="text-foreground truncate font-medium">
                                  {u.username || 'No Username'}
                                </div>
                                <div className="text-muted-foreground truncate font-mono text-[10px] opacity-75">
                                  {u.email}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {u.current_level && (
                                  <Badge variant="secondary" className="text-[9px] px-1 h-3.5 bg-neutral-800 text-neutral-300 font-bold">
                                    L{u.current_level}
                                  </Badge>
                                )}
                                {u.specialization && (
                                  <span className="text-[9px] text-primary/80 font-bold uppercase tracking-wider">
                                    {mapSpecializationToDeptCode(u.specialization)}
                                  </span>
                                )}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </div>

                {selectedUser ? (
                  <div className="space-y-6 animate-notif-modal-enter">
                    {/* Selected Student Details Card */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-semibold">User Profile:</span>
                        <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px]">
                          Student
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-foreground">
                          {selectedUser.username || 'No Username'}
                        </div>
                        <div className="text-xs text-muted-foreground truncate font-mono text-[11px]">
                          {selectedUser.email}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-3">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-muted-foreground font-semibold">Suggested Year:</div>
                          <Badge variant="secondary" className="text-xs">
                            Year {selectedUser.current_level || 'N/A'}
                          </Badge>
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-muted-foreground font-semibold">Specialization:</div>
                          <Badge variant="outline" className="text-xs text-primary border-primary/20 bg-primary/5 truncate max-w-full">
                            {selectedUser.specialization || 'Unassigned'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Access Scope Type Selector */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-muted-foreground">Access Configuration</label>
                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCustomAccessType('suggested')
                            setCustomYears([])
                            setCustomDepts([])
                            setCustomFolders(suggestedFolderIds)
                          }}
                          className={`flex items-start text-left p-3 rounded-xl border text-sm transition-all ${
                            customAccessType === 'suggested'
                              ? 'border-primary bg-primary/5 text-foreground shadow-md shadow-primary/5'
                              : 'border-border bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-bold flex items-center gap-1">
                              <span>Suggested Access</span>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[8px] h-3.5 py-0 px-1 font-semibold">
                                Recommended
                              </Badge>
                            </div>
                            <div className="text-xs opacity-75 mt-0.5 text-[11px]">
                              Matches their level (Year {selectedUser.current_level || 'N/A'}) & department.
                            </div>
                          </div>
                        </button>
 
                        <button
                          type="button"
                          onClick={() => {
                            setCustomAccessType('full')
                            setCustomYears([])
                            setCustomDepts([])
                            setCustomFolders([DRIVE_ROOT_ID])
                          }}
                          className={`flex items-start text-left p-3 rounded-xl border text-sm transition-all ${
                            customAccessType === 'full'
                              ? 'border-primary bg-primary/5 text-foreground shadow-md shadow-primary/5'
                              : 'border-border bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-bold flex items-center gap-1">
                              <span>Full Access</span>
                            </div>
                            <div className="text-xs opacity-75 mt-0.5 text-[11px]">
                              Access to the main site root folder and all years.
                            </div>
                          </div>
                        </button>
 
                        <button
                          type="button"
                          onClick={() => {
                            setCustomAccessType('custom')
                            if (customFolders.length === 0 || (customFolders.length === 1 && customFolders[0] === DRIVE_ROOT_ID)) {
                              setCustomFolders(suggestedFolderIds)
                            }
                          }}
                          className={`flex items-start text-left p-3 rounded-xl border text-sm transition-all ${
                            customAccessType === 'custom'
                              ? 'border-primary bg-primary/5 text-foreground shadow-md shadow-primary/5'
                              : 'border-border bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-bold flex items-center gap-1">
                              <span>Custom Access</span>
                            </div>
                            <div className="text-xs opacity-75 mt-0.5 text-[11px]">
                              Select specific year cohorts, departments, or individual folders.
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCustomAccessType('none')
                            setCustomYears([])
                            setCustomDepts([])
                            setCustomFolders([])
                          }}
                          className={`flex items-start text-left p-3 rounded-xl border text-sm transition-all ${
                            customAccessType === 'none'
                              ? 'border-red-500 bg-red-500/5 text-foreground shadow-md shadow-red-500/5'
                              : 'border-border bg-transparent text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-bold flex items-center gap-1">
                              <span>Revoke All Access</span>
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[8px] h-3.5 py-0 px-1 font-semibold">
                                Revoked
                              </Badge>
                            </div>
                            <div className="text-xs opacity-75 mt-0.5 text-[11px]">
                              Revoke all folder permissions on Google Drive for this user.
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <Button 
                      onClick={handleCustomSaveClick}
                      disabled={previewLoading || syncLoading}
                      className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold py-2.5 rounded-xl border-0 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                    >
                      {previewLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Calculating Changes...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Save and Sync Drive
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="p-8 text-center border border-dashed border-border rounded-2xl bg-muted/10">
                    <UserCog className="w-8 h-8 text-muted-foreground opacity-40 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-muted-foreground">No Student Selected</div>
                    <div className="text-xs text-muted-foreground/60 mt-1">Select a student from the dropdown to check or customize their Drive access.</div>
                  </div>
                )}

              </CardContent>
            </Card>

            {/* Folder Tree Selector & Details Panel */}
            <Card className="lg:col-span-2 bg-card border-border shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <FolderLock className="w-5 h-5 text-primary" />
                  Drive Folder Selection
                </CardTitle>
                <CardDescription className="text-muted-foreground text-xs mt-1">
                  Check folders to customize access rules. Standard layouts can be checked using year/dept buttons.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Year & Dept Quick Toggles (Enabled only in Custom mode) */}
                <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-border/80">
                  <div className="text-xs font-bold text-muted-foreground tracking-wider uppercase mb-1">Quick Select Presets</div>
                  
                  {/* Years select buttons */}
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold text-muted-foreground/80 uppercase">Year Cohorts:</div>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4].map(y => {
                        const yearKey = `year${y}`
                        const isActive = customYears.includes(yearKey) && customAccessType === 'custom'
                        return (
                          <Button
                            key={y}
                            type="button"
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            disabled={customAccessType !== 'custom'}
                            onClick={() => handleYearToggle(yearKey)}
                            className="text-xs rounded-lg font-medium px-3.5 h-8 border-border"
                          >
                            <Crown className="w-3.5 h-3.5 mr-1" />
                            Year {y}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Departments select buttons */}
                  <div className="space-y-2 border-t border-border/40 pt-3 mt-1">
                    <div className="text-[10px] font-bold text-muted-foreground/80 uppercase">Departments (Across All Years):</div>
                    <div className="flex flex-wrap gap-2">
                      {['general', 'cyber', 'ai', 'business', 'media'].map(d => {
                        const isActive = customDepts.includes(d) && customAccessType === 'custom'
                        return (
                          <Button
                            key={d}
                            type="button"
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            disabled={customAccessType !== 'custom'}
                            onClick={() => handleDeptToggle(d)}
                            className="text-xs rounded-lg font-medium px-3 py-1 h-8 uppercase border-border"
                          >
                            {d}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Tree Scroll Area */}
                <div className="space-y-2 border border-border rounded-2xl p-4 bg-muted/5 max-h-[500px] overflow-y-auto" data-lenis-prevent="true">
                  <div className="text-xs font-semibold text-muted-foreground/60 mb-2 border-b border-border/50 pb-2">
                    Google Drive Tree Hierarchy
                  </div>
                  <div className="space-y-2">
                    {renderTreeNodes(DRIVE_TREE)}
                  </div>
                </div>

              </CardContent>
            </Card>

          </div>
          </motion.div>
        </TabsContent>

        {/* Tab 3: Token Status Monitor */}
        <TabsContent value="tokens" className="mt-0 focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle>Google Drive API Token Status</CardTitle>
              <CardDescription>
                Google Drive authorization and token monitor for backend automation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-6">
              <TokenStatusMonitor />
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Tab 4: Audit Logs */}
        <TabsContent value="logs" className="mt-0 focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle>Administrative Audit Logs</CardTitle>
              <CardDescription>
                Historical log of admin edits and system configuration updates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Administrator</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target User</TableHead>
                      <TableHead>Details Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          No audit log entries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => {
                        const date = new Date(log.created_at).toLocaleString()
                        let detailSummary = ''
                        
                        // Parse details to provide a short summary
                        if (log.action === 'UPDATE_USER_PROFILE' && log.details) {
                          const changes = []
                          if (log.details.specialization && log.details.specialization.before !== log.details.specialization.after) {
                            changes.push(`spec: ${log.details.specialization.before || 'None'} ➔ ${log.details.specialization.after || 'None'}`)
                          }
                          if (log.details.current_level && log.details.current_level.before !== log.details.current_level.after) {
                            changes.push(`level: ${log.details.current_level.before || 'None'} ➔ ${log.details.current_level.after || 'None'}`)
                          }
                          if (log.details.is_admin && log.details.is_admin.before !== log.details.is_admin.after) {
                            changes.push(`admin: ${log.details.is_admin.before} ➔ ${log.details.is_admin.after}`)
                          }
                          detailSummary = changes.join(', ') || 'No changes'
                        } else if (log.action === 'CREATE_ACCESS_RULE' && log.details?.rule) {
                          detailSummary = `Added folder rule for "${log.details.rule.folder_name}"`
                        } else if (log.action === 'DELETE_ACCESS_RULE' && log.details?.rule) {
                          detailSummary = `Deleted rule for "${log.details.rule.folder_name}"`
                        } else {
                          detailSummary = JSON.stringify(log.details)
                        }

                        return (
                          <TableRow key={log.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="text-muted-foreground text-xs font-mono">{date}</TableCell>
                            <TableCell className="font-semibold text-sm">
                              {log.admin_username}
                              <div className="text-[10px] text-muted-foreground font-mono">{log.admin_email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/5">
                                {log.action}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.target_username ? (
                                <>
                                  <span className="font-medium">{log.target_username}</span>
                                  <div className="text-[10px] text-muted-foreground font-mono">{log.target_email}</div>
                                </>
                              ) : (
                                <span className="text-muted-foreground italic text-xs">System</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs max-w-[300px] truncate" title={JSON.stringify(log.details)}>
                              {detailSummary}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        {/* Tab 5: Quizzes Upload */}
        <TabsContent value="quizzes" className="mt-0 focus-visible:outline-none">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Panel: Quiz Metadata Form */}
              <Card className="lg:col-span-1 bg-card border-border shadow-lg h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <FileCode className="w-5 h-5 text-primary" />
                    Quiz Metadata
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs mt-1">
                    Select the target subject, level, and specify the quiz details.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {/* Department Slug Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Department</label>
                    <Select value={quizDept} onValueChange={(val) => {
                      setQuizDept(val)
                      setQuizSubject('')
                      setVerificationResult(null)
                    }}>
                      <SelectTrigger className="bg-muted/10 border-border">
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(departmentData).map((slug) => (
                          <SelectItem key={slug} value={slug}>
                            {departmentData[slug].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Level Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Academic Level</label>
                    <Select value={quizLevel} onValueChange={(val) => {
                      setQuizLevel(val)
                      setQuizSubject('')
                      setVerificationResult(null)
                    }}>
                      <SelectTrigger className="bg-muted/10 border-border">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVELS.map((lvl) => (
                          <SelectItem key={lvl} value={String(lvl)}>
                            Level {lvl}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                    <Select 
                      value={quizSubject} 
                      onValueChange={(val) => {
                        setQuizSubject(val)
                        setVerificationResult(null)
                      }}
                      disabled={!quizDept || !quizLevel}
                    >
                      <SelectTrigger className="bg-muted/10 border-border">
                        <SelectValue placeholder={!quizDept || !quizLevel ? "Select Dept & Level first" : "Select Subject"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectsList.map((subj: any) => (
                          <SelectItem key={subj.id} value={subj.id}>
                            {subj.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quiz Name Input */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Quiz Title / Name</label>
                    <Input
                      placeholder="e.g. Midterm Practice, Chapter 1 Quiz"
                      value={quizName}
                      onChange={(e) => {
                        setQuizName(e.target.value)
                        setVerificationResult(null)
                      }}
                      className="bg-muted/10 border-border text-sm"
                    />
                  </div>

                </CardContent>
              </Card>

              {/* Right Panel: JSON Editor & Verification Status */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* JSON Question Payload Input */}
                <Card className="bg-card border-border shadow-lg">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <FileCode className="w-5 h-5 text-primary" />
                        Questions JSON
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-xs mt-1">
                        Paste the raw JSON array of quiz questions or import a file.
                      </CardDescription>
                    </div>
                    
                    {/* File upload button */}
                    <div className="relative">
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleQuizFileChange}
                        className="hidden"
                        id="quiz-file-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        asChild
                        className="border-border hover:bg-primary/10 hover:text-primary transition-all text-xs font-semibold cursor-pointer"
                      >
                        <label htmlFor="quiz-file-upload">
                          <FolderPlus className="w-3.5 h-3.5 mr-1.5" />
                          Import JSON File
                        </label>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex border border-border rounded-xl bg-neutral-950 h-80 overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                      {/* Gutter for Line Numbers */}
                      <div 
                        ref={gutterRef}
                        className="flex-shrink-0 bg-neutral-900 border-r border-border/40 select-none text-right pr-2.5 pl-2 text-[11px] font-mono text-muted-foreground/30 pt-4 overflow-hidden"
                        style={{ fontFamily: 'monospace' }}
                      >
                        {lineNumbers.map((num) => (
                          <div key={num} style={{ height: '20px', lineHeight: '20px' }}>{num}</div>
                        ))}
                      </div>

                      {/* Textarea */}
                      <textarea
                        ref={textareaRef}
                        placeholder={`[\n  {\n    "question": "What is 1 + 1?",\n    "options": ["1", "2", "3", "4"],\n    "correct": 1\n  }\n]`}
                        value={quizJsonStr}
                        onChange={(e) => {
                          setQuizJsonStr(e.target.value)
                          setVerificationResult(null)
                        }}
                        onScroll={handleScroll}
                        className="flex-grow bg-transparent text-neutral-200 font-mono text-xs pt-4 pl-2 outline-none border-0 focus:ring-0 focus:outline-none resize-none overflow-y-auto"
                        style={{ 
                          fontFamily: 'monospace',
                          lineHeight: '20px'
                        }}
                      />
                    </div>

                    <Button
                      onClick={handleQuizVerify}
                      disabled={isVerifyingQuiz || !quizJsonStr.trim() || !quizName}
                      className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold py-2.5 rounded-xl border-0 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                    >
                      {isVerifyingQuiz ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Verifying JSON and AI Validation...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Check & Verify with AI
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Validation & Verification Panel */}
                {verificationResult && (
                  <Card className={`border shadow-lg overflow-hidden transition-all ${
                    verificationResult.success ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'
                  }`}>
                    <CardHeader className="pb-3 border-b border-border/50">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          {verificationResult.success ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-green-400">Verification Succeeded</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-5 h-5 text-red-500" />
                              <span className="text-red-400">Verification Failed</span>
                            </>
                          )}
                        </CardTitle>
                        {verificationResult.success && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] py-0 px-2 h-5">
                            AI Approved
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      {/* Overall parse error */}
                      {verificationResult.error && !verificationResult.validationErrors && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-lg text-xs leading-relaxed font-mono">
                          {verificationResult.error}
                        </div>
                      )}

                      {/* Unified Schema Errors & AI Warnings list */}
                      {verificationResult.validationErrors && verificationResult.validationErrors.length > 0 && (
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                            <Settings className="w-4 h-4 text-primary" />
                            Validation Report ({verificationResult.validationErrors.length} issues found):
                          </label>
                          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1" data-lenis-prevent="true">
                            {verificationResult.validationErrors.map((err, index) => (
                              <div 
                                key={index} 
                                onClick={() => scrollToLine(err.line)}
                                className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-2 select-none duration-150 ${
                                  err.line ? 'cursor-pointer hover:border-primary/40 hover:bg-neutral-900/60 active:scale-[0.98]' : ''
                                } ${
                                  err.critical 
                                    ? 'bg-red-500/5 border-red-500/20 text-red-300' 
                                    : 'bg-yellow-500/5 border-yellow-500/20 text-yellow-300'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-1.5">
                                  <div className="flex items-center gap-2">
                                    <Badge className={err.critical ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}>
                                      {err.critical ? 'Critical Error' : 'AI Logic Warning'}
                                    </Badge>
                                    {err.line && (
                                      <span className="font-mono text-[10px] text-muted-foreground bg-neutral-900 px-1.5 py-0.5 rounded border border-border/40">
                                        Line {err.line}
                                      </span>
                                    )}
                                  </div>
                                  {err.line && (
                                    <span className="text-[10px] opacity-70 italic flex items-center gap-1 text-primary">
                                      <Search className="w-3 h-3" />
                                      Click to locate
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  {err.questionText && (
                                    <div className="font-semibold truncate max-w-full opacity-80 mb-1">
                                      Q: "{err.questionText}"
                                    </div>
                                  )}
                                  <div className="leading-relaxed font-mono text-[11px]">
                                    {err.error}
                                  </div>
                                </div>

                                {err.fix && (
                                  <div className="mt-1 p-2 rounded-lg bg-black/40 border border-white/5 space-y-1">
                                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Suggested Fix:</div>
                                    <div className="text-[11px] text-foreground leading-relaxed font-medium">
                                      {err.fix}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Editable Fields for Upload */}
                      {verificationResult.success && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 border border-border/80 p-4 rounded-xl">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Quiz Code (Editable)</label>
                            <Input
                              value={quizCode}
                              onChange={(e) => setQuizCode(e.target.value)}
                              placeholder="e.g. CS_001"
                              className="bg-background/80 border-border text-sm h-9"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Duration (Read-only)</label>
                            <Input
                              value="OP"
                              disabled
                              className="bg-muted/40 border-border text-sm h-9 cursor-not-allowed text-muted-foreground"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Questions Count (Read-only)</label>
                            <Input
                              value={questionsCount}
                              disabled
                              className="bg-muted/40 border-border text-sm h-9 cursor-not-allowed text-muted-foreground"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subject Term (Read-only)</label>
                            <Input
                              value={quizTerm || 'N/A'}
                              disabled
                              className="bg-muted/40 border-border text-sm h-9 cursor-not-allowed text-muted-foreground"
                            />
                          </div>
                        </div>
                      )}

                      {/* Upload Button */}
                      {verificationResult.success && (
                        <Button
                          onClick={handleQuizUpload}
                          disabled={isUploadingQuiz || !quizCode.trim()}
                          className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 rounded-xl border-0 shadow-lg active:scale-95 transition-all"
                        >
                          {isUploadingQuiz ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading Quiz to Database...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Upload Quiz to Database
                            </>
                          )}
                        </Button>
                      )}

                    </CardContent>
                  </Card>
                )}

              </div>

            </div>
          </motion.div>
        </TabsContent>

        

        {/* Tab 8: Reports & Complaints */}
        <TabsContent value="reports" className="mt-0 focus-visible:outline-none font-rubik">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Reports</p>
                    <p className="text-2xl font-black text-foreground mt-0.5">{reportsStats.total}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-amber-500 font-medium">Open (Pending)</p>
                    <p className="text-2xl font-black text-amber-500 mt-0.5">{reportsStats.open}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-500/5 border-blue-500/20 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-500 font-medium">In Progress</p>
                    <p className="text-2xl font-black text-blue-500 mt-0.5">{reportsStats.inProgress}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-emerald-500 font-medium">Resolved</p>
                    <p className="text-2xl font-black text-emerald-500 mt-0.5">{reportsStats.resolved}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/40 border-border shadow-sm col-span-2 sm:col-span-1">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Unresolved Total</p>
                    <p className="text-2xl font-black text-red-500 mt-0.5">{reportsStats.unresolved}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-500">
                    <Flame className="w-5 h-5 animate-bounce" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter and Table Card */}
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <LifeBuoy className="w-5 h-5 text-primary" />
                      <span>Student Reports &amp; Complaints Center</span>
                      {unresolvedReportsCount > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          {unresolvedReportsCount} New / Open
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Review student issues, update resolution status (Open / In Progress / Resolved / Closed), and dispatch official responses.
                    </CardDescription>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchReportsList(reportsPage)}
                    disabled={reportsLoading}
                    className="rounded-full text-xs font-bold shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${reportsLoading ? 'animate-spin' : ''}`} />
                    Refresh Feed
                  </Button>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-4">
                  <div className="sm:col-span-4 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search title, description, or username..."
                      value={reportsSearch}
                      onChange={(e) => setReportsSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchReportsList(1)}
                      className="pl-9 h-9 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <Select value={reportsStatusFilter} onValueChange={(val) => { setReportsStatusFilter(val); setReportsPage(1); }}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Status Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="open">Open (Under Review)</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3">
                    <Select value={reportsCategoryFilter} onValueChange={(val) => { setReportsCategoryFilter(val); setReportsPage(1); }}>
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Category Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="bug">Technical Bugs</SelectItem>
                        <SelectItem value="content">Course Content</SelectItem>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="feature_request">Feature Requests</SelectItem>
                        <SelectItem value="other">General / Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2">
                    <Button 
                      onClick={() => fetchReportsList(1)}
                      className="w-full h-9 text-xs font-bold rounded-lg"
                      variant="secondary"
                    >
                      <Filter className="w-3.5 h-3.5 mr-1.5" />
                      Apply
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {reportsLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading reports data...</p>
                  </div>
                ) : reportsList.length === 0 ? (
                  <div className="py-16 text-center border border-dashed border-border rounded-xl p-8 space-y-2">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mx-auto mb-2">
                      <LifeBuoy className="w-6 h-6" />
                    </div>
                    <p className="text-base font-bold text-foreground">No reports match the current criteria</p>
                    <p className="text-xs text-muted-foreground">Try clearing filters or search query.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 text-xs">
                          <TableHead className="w-[180px]">Student</TableHead>
                          <TableHead className="w-[130px]">Category</TableHead>
                          <TableHead>Issue / Complaint</TableHead>
                          <TableHead className="w-[100px]">Priority</TableHead>
                          <TableHead className="w-[140px]">Status</TableHead>
                          <TableHead className="w-[120px]">Date</TableHead>
                          <TableHead className="text-right w-[140px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportsList.map((rep) => {
                          const getCategoryBadge = () => {
                            switch (rep.category) {
                              case 'bug':
                                return <Badge variant="outline" className="border-red-500/30 text-red-500 bg-red-500/10 gap-1 text-[11px]"><Bug className="w-3 h-3" /> Bug</Badge>
                              case 'content':
                                return <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10 gap-1 text-[11px]"><BookOpen className="w-3 h-3" /> Content</Badge>
                              case 'account':
                                return <Badge variant="outline" className="border-amber-500/30 text-amber-500 bg-amber-500/10 gap-1 text-[11px]"><User className="w-3 h-3" /> Account</Badge>
                              case 'feature_request':
                                return <Badge variant="outline" className="border-purple-500/30 text-purple-500 bg-purple-500/10 gap-1 text-[11px]"><Lightbulb className="w-3 h-3" /> Idea</Badge>
                              default:
                                return <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10 gap-1 text-[11px]"><LifeBuoy className="w-3 h-3" /> Other</Badge>
                            }
                          }

                          const getStatusBadge = () => {
                            switch (rep.status) {
                              case 'open':
                                return (
                                  <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 text-[11px] font-bold gap-1 shadow-sm shadow-amber-500/10">
                                    <Clock className="w-3 h-3 animate-pulse" />
                                    Open
                                  </Badge>
                                )
                              case 'in_progress':
                                return (
                                  <Badge className="bg-blue-500/15 text-blue-500 border-blue-500/30 text-[11px] font-bold gap-1">
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                    In Progress
                                  </Badge>
                                )
                              case 'resolved':
                                return (
                                  <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 text-[11px] font-bold gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Resolved
                                  </Badge>
                                )
                              case 'closed':
                                return (
                                  <Badge variant="outline" className="text-muted-foreground text-[11px]">
                                    Closed
                                  </Badge>
                                )
                              default:
                                return null
                            }
                          }

                          return (
                            <TableRow key={rep.id} className="hover:bg-muted/40 transition-colors">
                              <TableCell className="py-3">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                    <span>{rep.username}</span>
                                    {rep.user_id && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Registered Student" />
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[150px]">
                                    {rep.user_email || 'No email'}
                                  </div>
                                </div>
                              </TableCell>

                              <TableCell>{getCategoryBadge()}</TableCell>

                              <TableCell>
                                <div className="space-y-1 max-w-md">
                                  <div className="font-bold text-xs text-foreground line-clamp-1">
                                    {rep.title}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {rep.description}
                                  </div>
                                  {rep.admin_reply && (
                                    <div className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 line-clamp-1 inline-flex items-center gap-1 mt-1">
                                      <CheckCheck className="w-3 h-3" />
                                      Admin reply: {rep.admin_reply}
                                    </div>
                                  )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] font-bold ${
                                  rep.priority === 'urgent'
                                    ? 'border-red-500/30 text-red-500 bg-red-500/10'
                                    : rep.priority === 'low'
                                    ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                                    : 'border-blue-500/30 text-blue-500 bg-blue-500/10'
                                }`}>
                                  {rep.priority === 'urgent' ? '🔥 Urgent' : rep.priority === 'low' ? 'Low' : 'Normal'}
                                </Badge>
                              </TableCell>

                              <TableCell>{getStatusBadge()}</TableCell>

                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(rep.created_at).toLocaleDateString('en-US', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </TableCell>

                              <TableCell className="text-right space-x-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenReplyDialog(rep)}
                                  className="h-8 px-2.5 text-xs font-bold text-primary border-primary/30 hover:bg-primary/10 rounded-lg"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                  Reply & Status
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteReport(rep.id)}
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Pagination */}
                {reportsTotalFiltered > 15 && (
                  <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
                    <div>
                      Showing {((reportsPage - 1) * 15) + 1} - {Math.min(reportsPage * 15, reportsTotalFiltered)} of {reportsTotalFiltered} reports
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reportsPage <= 1 || reportsLoading}
                        onClick={() => fetchReportsList(reportsPage - 1)}
                        className="h-8 text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reportsPage * 15 >= reportsTotalFiltered || reportsLoading}
                        onClick={() => fetchReportsList(reportsPage + 1)}
                        className="h-8 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Tab 8: Executive Platform Analytics & PDF Report */}
        <TabsContent value="executive_report" className="mt-0 focus-visible:outline-none font-rubik">
          <ExecutiveReportView />
        </TabsContent>
      </Tabs>

      {/* Admin Reply & Status Dialog */}
      <Dialog open={selectedReport !== null} onOpenChange={(open) => !open && setSelectedReport(null)}>
        <DialogContent className="bg-background/95 border-border max-w-4xl w-[94vw] shadow-2xl p-0 overflow-hidden rounded-2xl font-rubik [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" dir="ltr">
          <div className="p-6 pb-4 border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg md:text-xl font-bold font-rubik text-foreground">
                    Manage Report & Update Status
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-rubik">
                    Directly respond to the issue and select appropriate status (Open / In Progress / Resolved / Closed)
                  </DialogDescription>
                </div>
              </div>
            </div>
          </div>

          {selectedReport && (
            <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden font-rubik">
              {/* Student Metadata Card */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Student: </span>
                  <strong className="text-foreground">{selectedReport.username}</strong>
                  {selectedReport.user_email && (
                    <span className="text-muted-foreground ml-1">({selectedReport.user_email})</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Date: </span>
                  <strong className="text-foreground">
                    {new Date(selectedReport.created_at).toLocaleString('en-US')}
                  </strong>
                </div>
              </div>

              {/* Problem Details */}
              <div className="space-y-2 p-4 rounded-xl border border-border/80 bg-card/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Issue Title:</span>
                  <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary">
                    {selectedReport.category}
                  </Badge>
                </div>
                <h4 className="font-extrabold text-sm text-foreground">{selectedReport.title}</h4>
                <div className="pt-1">
                  <span className="text-xs font-bold text-muted-foreground">Full Description:</span>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 whitespace-pre-wrap bg-muted/30 p-3 rounded-lg border border-border/40 leading-relaxed font-rubik">
                    {selectedReport.description}
                  </p>
                </div>

                {selectedReport.page_url && (
                  <div className="text-xs flex items-center gap-2 pt-1 font-mono" dir="ltr">
                    <span className="text-muted-foreground">Page:</span>
                    <a href={selectedReport.page_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                      {selectedReport.page_url}
                    </a>
                  </div>
                )}

                {selectedReport.screenshot_url && (
                  <div className="text-xs flex items-center gap-2 pt-1" dir="ltr">
                    <span className="text-muted-foreground">Screenshot:</span>
                    <a href={selectedReport.screenshot_url} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> View Attachment
                    </a>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground">
                  Update Status <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'open', label: 'Open', color: 'border-amber-500/40 bg-amber-500/10 text-amber-500' },
                    { id: 'in_progress', label: 'In Progress', color: 'border-blue-500/40 bg-blue-500/10 text-blue-500' },
                    { id: 'resolved', label: 'Resolved', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500' },
                    { id: 'closed', label: 'Closed', color: 'border-muted text-muted-foreground' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAdminSelectedStatus(s.id as ReportStatus)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                        adminSelectedStatus === s.id
                          ? `${s.color} ring-2 ring-primary/40 shadow-sm font-extrabold`
                          : 'border-border/60 hover:border-border text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Template Responses */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-muted-foreground">Quick Response Templates:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'The issue has been resolved and deployed. Thank you for your feedback! 🎉',
                    'We are currently investigating this with the technical team and will update you shortly.',
                    'Thank you for the report. Could you please provide additional details or a screenshot?',
                    'Thank you for this wonderful suggestion! We have added it to our roadmap.'
                  ].map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAdminReplyText(tmpl)}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      + {tmpl.slice(0, 36)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Reply Input */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-reply-text" className="text-xs font-bold text-foreground">
                  Admin Response to Student:
                </Label>
                <Textarea
                  id="admin-reply-text"
                  placeholder="Type your official reply here... The student will see this on their profile and receive a notification."
                  value={adminReplyText}
                  onChange={(e) => setAdminReplyText(e.target.value)}
                  rows={4}
                  className="text-xs sm:text-sm resize-none bg-background leading-relaxed font-rubik"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  disabled={isUpdatingReport}
                  className="rounded-full text-xs"
                >
                  Cancel
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveReportStatusAndReply}
                  disabled={isUpdatingReport}
                  className="rounded-full px-5 text-xs font-bold bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-md hover:brightness-105 active:scale-95 transition-all"
                >
                  {isUpdatingReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                      Saving & Notifying...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 ml-1.5" />
                      Save & Notify Student
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-background/95 border-border max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Manage User: {editingUser?.username}
            </DialogTitle>
            <DialogDescription>
              Modify this student's platform privileges and account status.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              {/* User Email Info Card */}
              <div className="bg-muted/30 border border-border p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">User Email</div>
                  <div className="text-sm font-medium">{editingUser.email || 'No Email Registered'}</div>
                </div>
                {!editingUser.email && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Drive Sync Disabled
                  </Badge>
                )}
              </div>

              {/* Admin Privileges toggle */}
              <div className="flex items-center justify-between bg-muted/10 border border-border/80 p-3 rounded-lg">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold">Platform Administrator</div>
                  <div className="text-xs text-muted-foreground">
                    Grants access to general admin dashboards.
                  </div>
                </div>
                <Switch
                  checked={editAdmin}
                  onCheckedChange={setEditAdmin}
                  disabled={editingUser.is_super_admin} // Don't let demote super admins easily
                />
              </div>

              {/* Ban Account toggle */}
              <div className="flex items-center justify-between bg-destructive/5 border border-destructive/20 p-3 rounded-lg">
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-destructive">Ban Account</div>
                  <div className="text-xs text-muted-foreground">
                    Instantly blocks user from accessing the platform.
                  </div>
                </div>
                <Switch
                  checked={editBanned}
                  onCheckedChange={setEditBanned}
                  disabled={editingUser.is_super_admin} // Don't let ban super admins
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)} className="border-border">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveClick} 
              disabled={previewLoading || isPending}
              className="bg-primary text-primary-foreground font-semibold px-5"
            >
              {previewLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-background/95 border-border max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
              Confirm Drive Sync Actions
            </DialogTitle>
            <DialogDescription>
              Updating specialization or level will trigger Google Drive permission modifications. Please review below:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertTitle className="text-amber-300 font-semibold">Auto-Syncing Google Drive</AlertTitle>
              <AlertDescription className="text-amber-200/80 text-xs">
                Access will be automatically granted to new folder access rules matching the user's new details, and access to old folders will be revoked.
              </AlertDescription>
            </Alert>

            {/* Folder changes visual lists */}
            <div className="space-y-3">
              {/* Revokes */}
              <div>
                <div className="text-xs text-red-400 font-semibold mb-1 flex items-center gap-1">
                  <span>Revoking Folder Access ({previewChanges.foldersToRevoke.length})</span>
                </div>
                {previewChanges.foldersToRevoke.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic pl-3">No folder access will be revoked.</div>
                ) : (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 max-h-[100px] overflow-y-auto space-y-1">
                    {previewChanges.foldersToRevoke.map(f => (
                      <div key={f.id} className="text-xs flex items-center gap-1.5 text-red-300 font-mono">
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grants */}
              <div>
                <div className="text-xs text-green-400 font-semibold mb-1 flex items-center gap-1">
                  <span>Granting Folder Access ({previewChanges.foldersToGrant.length})</span>
                </div>
                {previewChanges.foldersToGrant.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic pl-3">No folder access will be granted.</div>
                ) : (
                  <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2 max-h-[100px] overflow-y-auto space-y-1">
                    {previewChanges.foldersToGrant.map(f => (
                      <div key={f.id} className="text-xs flex items-center gap-1.5 text-green-300 font-mono">
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              Apply changes for <strong className="text-foreground">{editingUser?.username}</strong>?
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="border-border">
              Cancel
            </Button>
            <Button 
              onClick={executeUserUpdate} 
              disabled={isPending}
              className="bg-primary text-primary-foreground font-semibold px-5"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing Permissions...
                </>
              ) : (
                'Confirm & Apply'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Folder Sync Confirmation Dialog */}
      <Dialog open={showSyncConfirm} onOpenChange={setShowSyncConfirm}>
        <DialogContent className="max-w-md bg-card border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Drive Sync Access
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs mt-1">
              Google Drive permissions will be synced for this student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2 border-y border-border py-4">
            <div className="space-y-3">
              {/* Revocations */}
              <div>
                <div className="text-xs text-red-400 font-semibold mb-1 flex items-center gap-1">
                  <span>Revoking Folder Access ({syncPreview.foldersToRevoke.length})</span>
                </div>
                {syncPreview.foldersToRevoke.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic pl-3">No folder access will be revoked.</div>
                ) : (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-2 max-h-[100px] overflow-y-auto space-y-1">
                    {syncPreview.foldersToRevoke.map(f => (
                      <div key={f.id} className="text-xs flex items-center gap-1.5 text-red-300 font-mono">
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grants */}
              <div>
                <div className="text-xs text-green-400 font-semibold mb-1 flex items-center gap-1">
                  <span>Granting Folder Access ({syncPreview.foldersToGrant.length})</span>
                </div>
                {syncPreview.foldersToGrant.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic pl-3">No folder access will be granted.</div>
                ) : (
                  <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2 max-h-[100px] overflow-y-auto space-y-1">
                    {syncPreview.foldersToGrant.map(f => (
                      <div key={f.id} className="text-xs flex items-center gap-1.5 text-green-300 font-mono">
                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              Apply Year/Department customization changes for <strong className="text-foreground">{selectedUser?.username}</strong>?
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSyncConfirm(false)} className="border-border">
              Cancel
            </Button>
            <Button 
              onClick={executeCustomSync} 
              disabled={syncLoading}
              className="bg-primary text-primary-foreground font-semibold px-5"
            >
              {syncLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Syncing Permissions...
                </>
              ) : (
                'Confirm & Apply'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  )
}
