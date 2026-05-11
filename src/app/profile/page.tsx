"use client"

import { useEffect, useState } from "react"
import { getStudentSession } from "@/lib/auth"
import { createBrowserClient } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, User, BookOpen, Star, Award, Calendar, GraduationCap, Shield, Edit3, LogOut, Save, X, TrendingUp, Mail, Phone, Video, FileText, Trophy, Palette, Check, Sun, Moon, Laptop, Coins, ShoppingBag, Zap, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ToastProvider"
import Image from "next/image"
import { useAddNotification } from "@/components/notification"
import { DeleteAccountDialog } from "@/components/delete-account-dialog"
import { departmentData, departmentKeyMap, type Subject } from '@/lib/department-data'
import AdBanner from "@/components/AdBanner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "next-themes"
import { useColorTheme } from "@/components/color-theme-provider"
import { motion, AnimatePresence } from "framer-motion"


interface QuizQuestion {
  correct: boolean;
  question_text: string;
}

// Dot Plot with KDE Visualization Component
function ProgressDotPlot({ quizData }: { quizData: any[] }) {
  if (!quizData.length) return null;

  // Process quiz data for visualization
  const processData = () => {
    // Filter and sort by date
    const sortedData = [...quizData]
      .filter(attempt => attempt.score !== undefined && attempt.score !== null)
      .sort((a, b) => new Date(a.solved_at || a.created_at).getTime() - new Date(b.solved_at || b.created_at).getTime());
    
    if (sortedData.length === 0) return [];
    
    return sortedData.map((attempt, index) => {
      return {
        trial: index + 1,
        score: Math.round(Number(attempt.score)),
        date: new Date(attempt.solved_at || attempt.created_at).toLocaleDateString(),
        quizTitle: attempt.quiz_title || "Quiz",
        totalQuestions: attempt.total_questions || "N/A"
      };
    });
  };

  const data = processData();
  if (data.length === 0) return null;

  const maxTrial = data.length;

  return (
    <Card className="bg-card border-border shadow-xl mt-8">
      <CardHeader>
        <CardTitle className="text-2xl font-outfit font-extrabold italic tracking-tight text-foreground flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          Progress Over <span className="text-primary">Attempts</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground font-outfit">
          Your performance across quiz attempts with real-time trend visualization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-2">
            <span>100</span>
            <span>75</span>
            <span>50</span>
            <span>25</span>
            <span>0</span>
          </div>
          
          {/* Main chart area */}
          <div className="ml-8 h-full relative">
            {/* Horizontal grid lines */}
            {[0, 25, 50, 75, 100].map((score) => (
              <div 
                key={score}
                className="absolute left-0 right-0 border-t border-border"
                style={{ top: `${100 - score}%` }}
              />
            ))}
            
            {/* Connection lines between dots */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
              {data.slice(0, -1).map((point, i) => {
                const nextPoint = data[i + 1];
                return (
                  <line
                    key={i}
                    x1={`${(point.trial / maxTrial) * 100}%`}
                    y1={`${100 - point.score}%`}
                    x2={`${(nextPoint.trial / maxTrial) * 100}%`}
                    y2={`${100 - nextPoint.score}%`}
                    stroke="var(--primary)"
                    strokeOpacity="0.5"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            
            {/* Data points */}
            {data.map((point, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 rounded-full bg-primary border-2 border-background shadow-md transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{
                  left: `${(point.trial / maxTrial) * 100}%`,
                  top: `${100 - point.score}%`
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-popover text-popover-foreground text-xs p-2 rounded whitespace-nowrap shadow-xl z-20 font-outfit border border-border">
                  <div className="font-bold text-primary">{point.quizTitle}</div>
                  <div>Trial {point.trial}: <span className="font-bold">{point.score}%</span></div>
                  <div className="text-muted-foreground">Date: {point.date}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* X-axis labels */}
          <div className="ml-8 mt-2 flex justify-between text-xs text-muted-foreground">
            <span>Trial 1</span>
            <span>Trial {Math.floor(maxTrial/2)}</span>
            <span>Trial {maxTrial}</span>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground font-outfit">
          <p style={{marginTop: "3rem"}}>This protocol visualization tracks your performance over sequential attempts.</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-primary"></span>
            <span>Identifier for each attempt</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="w-4 h-0.5 bg-primary/50"></span>
            <span>Progress vector mapping performance trend</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to get user's registered subjects based on level and department
function getUserSubjects(level: number, specialization: string, currentTerm: 'term1' | 'term2' = 'term1'): Subject[] {
  console.log('🔍 getUserSubjects called with:', { level, specialization, currentTerm })
  
  const departmentKey = departmentKeyMap[specialization] || departmentKeyMap[specialization?.toLowerCase()]
  console.log('✅ Mapped department key:', departmentKey, 'from specialization:', specialization)
  
  if (!departmentKey) {
    console.error('❌ No department key found for specialization:', specialization)
    return []
  }
  
  if (!departmentData[departmentKey]) {
    console.error('❌ Department not found in departmentData:', departmentKey)
    return []
  }
  
  const department = departmentData[departmentKey]
  
  if (!department.levels[level]) {
    console.error('❌ Level not found:', level)
    return []
  }
  
  const subjects = department.levels[level].subjects[currentTerm] || []
  return subjects
}

// Helper function to extract Google Drive folder ID from URL and create internal drive link
function createDriveLink(googleDriveUrl: string, driveId: string = 'ee201328c6b4'): string {
  if (!googleDriveUrl || googleDriveUrl === '' || googleDriveUrl === ' ') {
    return '#'
  }
  
  const folderIdMatch = googleDriveUrl.match(/folders\/([a-zA-Z0-9_-]+)/)
  if (folderIdMatch && folderIdMatch[1]) {
    const folderId = folderIdMatch[1]
    return `/drive/${driveId}/${folderId}`
  }
  return googleDriveUrl
}

function getCurrentTerm(): 'term1' | 'term2' {
  const now = new Date()
  const month = now.getMonth() + 1 
  if (month >= 2 && month <= 8) {
    return 'term2'
  }
  return 'term1'
}

function ColorThemeSelector() {
  const { colorTheme, setColorTheme } = useColorTheme()

  const colorThemes = [
    { value: "default", label: "Default (Gold)", colors: ["44 98% 57%", "44 90% 45%", "44 85% 35%"] },
    { value: "volcano", label: "Volcano", colors: ["14 100% 57%", "24 95% 53%", "14 100% 57%"] },
    { value: "nightowl", label: "Night Owl", colors: ["207 90% 54%", "286 85% 60%", "171 100% 41%"] },
    { value: "skyblue", label: "Sky Blue", colors: ["199 89% 48%", "204 96% 27%", "186 100% 69%"] },
    { value: "sunset", label: "Sunset", colors: ["340 82% 52%", "25 95% 53%", "291 64% 42%"] },
    { value: "forest", label: "Forest", colors: ["142 76% 36%", "84 68% 42%", "173 58% 39%"] },
    { value: "ocean", label: "Ocean", colors: ["212 100% 48%", "188 78% 41%", "199 89% 48%"] },
    { value: "lavender", label: "Lavender", colors: ["262 83% 58%", "291 47% 51%", "280 67% 80%"] },
    { value: "rose", label: "Rose", colors: ["330 81% 60%", "346 77% 49%", "350 89% 60%"] },
    { value: "amber", label: "Amber", colors: ["32 95% 44%", "38 92% 50%", "45 93% 47%"] },
    { value: "mint", label: "Mint", colors: ["158 64% 52%", "168 76% 42%", "160 84% 39%"] },
    { value: "crimson", label: "Crimson", colors: ["348 83% 47%", "356 75% 53%", "340 82% 52%"] },
    { value: "indigo", label: "Indigo", colors: ["239 84% 67%", "243 75% 59%", "249 95% 63%"] },
    { value: "emerald", label: "Emerald", colors: ["158 64% 52%", "142 76% 36%", "152 60% 53%"] },
    { value: "coral", label: "Coral", colors: ["16 100% 66%", "14 91% 68%", "351 95% 71%"] },
  ]

  return (
    <Card className="bg-card border-border mb-6 shadow-xl">
      <CardHeader>
        <CardTitle className="font-outfit font-bold italic flex items-center gap-2">
          <Palette className="size-5 text-primary"/> Color Theme
        </CardTitle>
        <CardDescription className="font-outfit text-muted-foreground">Choose your favorite color palette globally</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {colorThemes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setColorTheme(theme.value as any)}
              className={`relative p-4 border-2 rounded-lg transition-all hover:border-primary/50 ${
                colorTheme === theme.value ? "border-primary bg-primary/10" : "border-border/30 bg-muted/20"
              }`}
            >
              <div className="space-y-3">
                <div className="flex gap-1 justify-center">
                  {theme.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="h-8 w-8 rounded-full border border-background shadow-sm"
                      style={{ backgroundColor: `hsl(${color})` }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-center font-outfit text-foreground">{theme.label}</p>
              </div>
              {colorTheme === theme.value && (
                <div className="absolute top-2 right-2">
                  <Check className="size-4 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ThemeModeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const themeOptions = [
    { value: "light", label: "Light", icon: <Sun className="size-8 mb-2" /> },
    { value: "dark", label: "Dark", icon: <Moon className="size-8 mb-2" /> },
    { value: "system", label: "System", icon: <Laptop className="size-8 mb-2" /> }
  ]

  return (
    <Card className="bg-card border-border shadow-xl">
      <CardHeader>
        <CardTitle className="font-outfit font-bold italic flex items-center gap-2">
          <Laptop className="size-5 text-primary"/> Appearance Mode
        </CardTitle>
        <CardDescription className="font-outfit text-muted-foreground">Select Light/Dark interface</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-lg transition-all ${
                theme === opt.value 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border/30 bg-muted/20 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {opt.icon}
              <span className="font-medium font-outfit">{opt.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<any>(null)
  const [quizData, setQuizData] = useState<any[]>([])
  const [paginatedData, setPaginatedData] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    username: "",
    age: ""
  })
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    age?: string;
    general?: string;
  }>({})
  const { addToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const addNotification = useAddNotification()
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [showSeconds, setShowSeconds] = useState<boolean>(true)
  const [showDate, setShowDate] = useState<boolean>(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Sync time format and settings with storage
    const savedFormat = localStorage.getItem('chameleon_time_format') as '12h' | '24h'
    if (savedFormat) setTimeFormat(savedFormat)
    
    const savedSeconds = localStorage.getItem('chameleon_show_seconds')
    if (savedSeconds !== null) setShowSeconds(savedSeconds === 'true')
    
    const savedDate = localStorage.getItem('chameleon_show_date')
    if (savedDate !== null) setShowDate(savedDate === 'true')

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    
    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chameleon_time_format') setTimeFormat(e.newValue as '12h' | '24h')
      if (e.key === 'chameleon_show_seconds') setShowSeconds(e.newValue === 'true')
      if (e.key === 'chameleon_show_date') setShowDate(e.newValue === 'true')
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(timer)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const toggleTimeFormat = () => {
    const newFormat = timeFormat === '12h' ? '24h' : '12h'
    setTimeFormat(newFormat)
    localStorage.setItem('chameleon_time_format', newFormat)
    addToast(`Clock format switched to ${newFormat}`, "success")
  }

  const toggleShowSeconds = () => {
    const newValue = !showSeconds
    setShowSeconds(newValue)
    localStorage.setItem('chameleon_show_seconds', String(newValue))
    addToast(`Seconds display ${newValue ? 'enabled' : 'disabled'}`, "success")
  }

  const toggleShowDate = () => {
    const newValue = !showDate
    setShowDate(newValue)
    localStorage.setItem('chameleon_show_date', String(newValue))
    addToast(`Date display ${newValue ? 'enabled' : 'disabled'}`, "success")
  }

  const formatCurrentTime = (date: Date) => {
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: timeFormat === '12h'
    })
    
    if (showDate) {
      const dateString = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
      return `${dateString} • ${timeString}`
    }
    
    return timeString
  }

  useEffect(() => {
    const loadProfileData = async () => {
      const session = await getStudentSession()
      if (!session) {
        setIsRedirecting(true)
        router.push("/auth/signin")
        return
      }

      setUserData(session)
      // Initialize edit form with current data
      setEditForm({
        username: session.username || "",
        age: String(session.age || "")
      })

      const supabase = createBrowserClient()

      // Fetch deletion status AND existence check in single query (was previously 2 separate queries)
      const { data: freshUserData } = await supabase
        .from("chameleons")
        .select("auth_id, deletion_scheduled_at")
        .eq("auth_id", session.auth_id)
        .maybeSingle()

      // Check if user account was deleted (not found in database)
      if (!freshUserData) {
        console.log("🗑️ User account has been deleted, clearing local storage...")
        localStorage.clear()
        sessionStorage.clear()
        document.cookie.split(";").forEach((c) => {
          const eqPos = c.indexOf("=")
          const name = eqPos > -1 ? c.substr(0, eqPos) : c
          document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        })
        setIsRedirecting(true)
        router.push("/auth/signin")
        return
      }

      setUserData((prev: any) => ({
        ...prev,
        deletion_scheduled_at: freshUserData.deletion_scheduled_at
      }))

      // Get ALL quiz attempts for stats computation
      const { count: totalQuizCount } = await supabase
        .from("quiz_data")
        .select('*', { count: 'exact', head: true })
        .eq("auth_id", session.auth_id)

      // Get user's last 5 quizzes for display (paginated)
      const { data: pageData, error: pageError } = await supabase
        .from("quiz_data")
        .select('*')
        .eq("auth_id", session.auth_id)
        .order("solved_at", { ascending: false })
        .range(0, 4)

      if (pageError) {
        console.error("Error loading quiz data:", pageError)
      }

      setQuizData(pageData || [])
      setPaginatedData(pageData || [])
      setHasMore((pageData?.length || 0) === 5 && (totalQuizCount || 0) > 5)
      setPage(0)
      setLoading(false)
    }

    loadProfileData()
  }, [router])

  const loadMoreQuizzes = async () => {
    if (!userData || !userData.auth_id || loadingMore || !hasMore) return
    setLoadingMore(true)
    
    const nextPage = page + 1
    const supabase = createBrowserClient()
    const { data: moreData, error } = await supabase
      .from("quiz_data")
      .select('*')
      .eq("auth_id", userData.auth_id)
      .order("solved_at", { ascending: false })
      .range(nextPage * 5, (nextPage + 1) * 5 - 1)
      
    if (moreData && moreData.length > 0) {
      setPaginatedData(prev => [...prev, ...moreData])
      setPage(nextPage)
      setHasMore(moreData.length === 5)
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
      })
      
      const supabase = createBrowserClient()
      await supabase.auth.signOut({ scope: 'global' })
      window.location.href = '/'
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditForm({
      username: userData.username,
      age: userData.age.toString()
    })
    setIsEditing(false)
    setValidationErrors({})
  }

  const validateForm = () => {
    const errors: { username?: string; age?: string; general?: string } = {}

    const hasUsernameChanged = editForm.username.trim() !== userData.username
    const hasAgeChanged = parseInt(editForm.age) !== userData.age

    if (!hasUsernameChanged && !hasAgeChanged) {
      errors.general = "At least one field must be changed to save"
    }

    if (!editForm.username.trim()) {
      errors.username = "Username is required"
    } else if (editForm.username.trim().length < 3) {
      errors.username = "Username must be at least 3 characters long"
    }

    const ageNum = parseInt(editForm.age)
    if (!editForm.age.trim()) {
      errors.age = "Age is required"
    } else if (isNaN(ageNum) || ageNum < 1) {
      errors.age = "Please enter a valid age"
    } else if (ageNum > 99) {
      errors.age = "Age cannot exceed 99 years"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveEdit = async () => {
    if (!validateForm()) {
      addToast("Please fix the validation errors before saving.", "error")
      return
    }

    setIsSaving(true)
    const supabase = createBrowserClient()
    
    try {
      const { data, error } = await supabase
        .from("chameleons")
        .update({
          username: editForm.username.trim(),
          age: parseInt(editForm.age)
        })
        .eq("auth_id", userData.auth_id)
        .select()

      if (error) {
        console.error("Error updating profile:", error)
        addToast("Failed to update profile. Please try again.", "error")
        return
      }

      if (data && data.length > 0) {
        const updatedUserData = { ...userData, ...data[0] }
        setUserData(updatedUserData)
        setIsEditing(false)
        setValidationErrors({})
        addToast("Profile updated successfully!", "success")
        
        addNotification(
          userData.auth_id,
          "Profile Updated",
          "System",
          "success",
          "Your profile information has been successfully updated!",
          "false"
        )
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      addToast("Failed to update profile. Please try again.", "error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }))

    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  // Show loading while checking authentication or redirecting
  if (loading || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-4">User not found</h2>
          <Button asChild>
            <Link href="/auth/signin">Go to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-outfit">
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6 mt-8 mx-auto max-w-6xl">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6"
          >
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2 font-outfit text-foreground items-center flex gap-3">
                <Button 
                  onClick={() => window.history.back()}
                  variant="outline"
                  size="icon"
                  className="rounded-full h-8 w-8 text-muted-foreground mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                Settings
              </h1>
              <p className="text-muted-foreground font-outfit">
                Manage your account identity, security preferences, and themes.
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-4 bg-muted/40 p-2 rounded-2xl border border-border/50">
              <div className="px-4 text-center border-r border-border/50">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-0.5">Global Clock</p>
                <p className="text-lg font-bold font-mono text-primary tabular-nums" suppressHydrationWarning>
                  {formatCurrentTime(currentTime)}
                </p>
              </div>
              <Button 
                onClick={toggleTimeFormat}
                variant="ghost" 
                size="sm" 
                className="rounded-xl font-bold font-outfit text-xs px-3 hover:bg-primary/10 hover:text-primary transition-all"
              >
                Switch to {timeFormat === '12h' ? '24h' : '12h'}
              </Button>
            </div>
          </motion.div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid bg-muted border border-border">
              <TabsTrigger value="profile" className="flex items-center gap-2 font-outfit data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <User className="size-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="academic" className="flex items-center gap-2 font-outfit data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="size-4" />
                <span className="hidden sm:inline">Academic Tracking</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2 font-outfit data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Palette className="size-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-2 font-outfit data-[state=active]:bg-background data-[state=active]:shadow-sm text-red-500 data-[state=active]:text-red-500">
                <Shield className="size-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Profile */}
            <TabsContent value="profile" className="space-y-6 outline-none">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* Profile Header Image Display */}
                <div className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-lg bg-card border border-border shadow-md gap-4">
                <div className="flex items-center gap-4">
                  <div 
                    className={`relative rounded-full shadow-lg ${userData.is_admin ? 'w-24 h-24' : 'w-20 h-20'} bg-primary/20 flex items-center justify-center border-4 border-background`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden bg-background flex items-center justify-center">
                      {userData.profile_image ? (
                        <Image
                          src={userData.profile_image}
                          alt="Profile"
                          width={96}
                          height={96}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-outfit font-extrabold text-2xl text-foreground">{userData.username}</h3>
                    <p className="text-sm text-muted-foreground font-outfit">Identity synchronizer active</p>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 font-bold">
                    <Coins className="w-4 h-4" />
                    <span>{userData.coins?.toLocaleString() || 0} Coins</span>
                  </div>
                  <Button 
                    onClick={handleLogout}
                    variant="destructive"
                    className="rounded-full shadow-sm font-outfit"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>

              {/* Achievements Showcase */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-card border-border shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-outfit font-extrabold italic tracking-tight text-foreground flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-primary" />
                      Achievement <span className="text-primary">Gallery</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground font-outfit">
                      Showcase of your earned and purchased badges from the Store.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!userData.inventory || userData.inventory.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                        <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">You haven't collected any badges yet.</p>
                        <Button asChild variant="outline" className="rounded-full">
                          <Link href="/store">Visit the Store</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {userData.inventory.map((itemId: string, index: number) => {
                          // Dynamic mapping based on the items in store/page.tsx
                          const badgeInfo: Record<string, any> = {
                            "badge-quiz-master": { name: "Quiz Master", color: "text-yellow-500 bg-yellow-500/10", icon: Award },
                            "badge-speed-demon": { name: "Speed Demon", color: "text-blue-500 bg-blue-500/10", icon: Zap },
                            "badge-pro-solver": { name: "Pro Solver", color: "text-purple-500 bg-purple-500/10", icon: ShieldCheck }
                          }
                          const info = badgeInfo[itemId] || { name: "Achievement", color: "text-muted-foreground bg-muted", icon: Trophy }
                          const Icon = info.icon

                          return (
                            <motion.div 
                              key={itemId} 
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + (index * 0.1) }}
                              className="flex flex-col items-center p-4 rounded-2xl bg-muted/30 border border-border group transition-all hover:bg-muted/50 hover:scale-105 active:scale-95"
                            >
                              <div className={`p-3 rounded-full ${info.color} mb-3 shadow-inner`}>
                                <Icon className="w-8 h-8" />
                              </div>
                              <span className="text-xs font-bold text-center group-hover:text-primary transition-colors">{info.name}</span>
                            </motion.div>
                          )
                        })}
                        <Link href="/store" className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-border hover:bg-muted/30 transition-all group">
                           <div className="p-3 rounded-full bg-muted mb-3 group-hover:scale-110 transition-transform">
                              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                           </div>
                           <span className="text-xs font-bold text-muted-foreground">More...</span>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Profile Edit Action Card */}
              <Card className="bg-card border-border shadow-xl h-full">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-outfit font-extrabold italic tracking-tight text-foreground">
                    Identity <span className="text-primary">Attributes</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-outfit">User credentials and attributes</CardDescription>
                  {validationErrors.general && (
                    <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-red-500 text-sm text-center font-outfit">{validationErrors.general}</p>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border transition-all hover:bg-muted">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Mail className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-outfit">Access Endpoint</p>
                        <p className="text-foreground font-medium font-outfit">{userData.email || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border transition-all hover:bg-muted">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Phone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-outfit">Secure Comms</p>
                        <p className="text-foreground font-medium font-outfit">{userData.phone_number || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border transition-all hover:bg-muted">
                      <div className="p-3 rounded-full bg-primary/10">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="username" className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-outfit">Designation</Label>
                        {isEditing ? (
                          <>
                            <Input
                              id="username"
                              name="username"
                              value={editForm.username}
                              onChange={handleInputChange}
                              className={`bg-background border-2 border-border text-foreground focus:border-primary focus:ring-primary/20 font-outfit ${validationErrors.username ? 'border-red-500' : ''}`}
                            />
                            {validationErrors.username && (
                              <p className="text-red-500 text-xs mt-1 font-outfit">{validationErrors.username}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-foreground font-medium font-outfit">{userData.username}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border transition-all hover:bg-muted">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="age" className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1 font-outfit">Cycle Count</Label>
                        {isEditing ? (
                          <>
                            <Input
                              id="age"
                              name="age"
                              type="number"
                              value={editForm.age}
                              onChange={handleInputChange}
                              className={`bg-background border-2 border-border text-foreground focus:border-primary focus:ring-primary/20 font-outfit ${validationErrors.age ? 'border-red-500' : ''}`}
                            />
                            {validationErrors.age && (
                              <p className="text-red-500 text-xs mt-1 font-outfit">{validationErrors.age}</p>
                            )}
                          </>
                        ) : (
                          <p className="text-foreground font-medium font-outfit">{userData.age}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border transition-all hover:bg-muted">
                      <div className="p-3 rounded-full bg-primary/10">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-outfit">Core Class</p>
                        <p className="text-foreground font-medium font-outfit">{userData.specialization}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border transition-all hover:bg-muted">
                      <div className="p-3 rounded-full bg-primary/10">
                        <GraduationCap className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-outfit">Authority Level</p>
                        <p className="text-foreground font-medium font-outfit">Level {userData.current_level}</p>
                      </div>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="flex justify-end gap-2 font-outfit pt-4 border-t border-border mt-6">
                      <Button 
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="rounded-full transition-all px-8"
                      >
                        <X className="w-4 h-4 mr-2" /> Abort
                      </Button>
                      <Button 
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="rounded-full bg-primary min-w-[120px] text-primary-foreground font-bold shadow-md transition-all"
                      >
                        {isSaving ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="w-4 h-4 mr-2" />} Sync
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end pt-4 border-t border-border mt-6">
                      <Button 
                        onClick={handleEdit}
                        variant="secondary"
                        className="rounded-full min-w-[200px] font-outfit font-bold transition-all"
                      >
                        <Edit3 className="w-4 h-4 mr-2" /> Modify Attributes
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>


            {/* TAB 2: Academic Tracking */}
            <TabsContent value="academic" className="space-y-6 outline-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >

              {/* Progress Visualization */}
              <ProgressDotPlot quizData={quizData} />

              {/* Registered Subjects */}
              <Card className="bg-card border-border shadow-xl">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-outfit font-extrabold italic tracking-tight text-foreground flex items-center justify-center gap-3">
                    <BookOpen className="w-6 h-6 text-primary" />
                    Enrolled <span className="text-primary">Subjects</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-outfit">
                    {getCurrentTerm() === 'term1' ? 'Sector 1' : 'Sector 2'} modules • Authority Level {userData.current_level} • {userData.specialization}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const currentTerm = getCurrentTerm()
                    const subjects = getUserSubjects(userData.current_level, userData.specialization, currentTerm)
                    const departmentKey = departmentKeyMap[userData.specialization] || departmentKeyMap[userData.specialization?.toLowerCase()] || 'computing-data-sciences'
                    
                    if (subjects.length === 0) {
                      return (
                        <div className="text-center py-12 text-muted-foreground font-outfit bg-muted/30 rounded-lg">
                          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                          <p className="text-lg font-bold mb-4">No subjects found for your level and department</p>
                        </div>
                      )
                    }
                    
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subjects.map((subject, index) => (
                          <motion.div 
                            key={subject.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.05 }}
                            className="p-6 rounded-2xl bg-muted/30 border border-border hover:border-primary/40 hover:shadow-md transition-all duration-300 group relative overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-primary/10" />
                            {/* Subject Header */}
                            <div className="mb-4 relative z-10 border-b border-border pb-3">
                              <h3 className="text-foreground font-outfit font-bold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-1">
                                {subject.name}
                              </h3>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-outfit">{subject.code}</p>
                                <div className="flex gap-2">
                                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-outfit font-bold">
                                    {subject.creditHours} CR
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {/* Subject Description */}
                            <p className="text-sm text-muted-foreground mb-6 line-clamp-2 min-h-[40px] font-outfit">
                              {subject.description}
                            </p>
                            
                            {/* Material Links */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 relative z-10">
                              {subject.materials.lectures && subject.materials.lectures.trim() !== '' && (
                                <Button asChild size="sm" variant="default" className="h-9 rounded-md font-outfit font-bold text-[11px] transition-all">
                                  <Link href={createDriveLink(subject.materials.lectures)}><BookOpen className="w-3 h-3 mr-1" /> LECTURES</Link>
                                </Button>
                              )}
                              {subject.materials.sections && subject.materials.sections.trim() !== '' && (
                                <Button asChild size="sm" variant="outline" className="h-9 rounded-md border text-primary font-outfit font-bold text-[11px] transition-all hover:bg-primary/10">
                                  <Link href={createDriveLink(subject.materials.sections)}><FileText className="w-3 h-3 mr-1" /> SECTIONS</Link>
                                </Button>
                              )}
                              {subject.materials.quizzes && subject.materials.quizzes.length > 0 && (
                                <Button asChild size="sm" variant="outline" className="h-9 rounded-md border text-primary font-outfit font-bold text-[11px] transition-all hover:bg-primary/10">
                                  <Link href={`/specialization/${departmentKey}/${userData.current_level}/${subject.id}?tab=quizzes`}><Trophy className="w-3 h-3 mr-1" /> QUIZZES</Link>
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>

              {/* Quiz Database Logs */}
              <Card className="bg-card border-border shadow-xl h-full mt-8">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl font-outfit font-extrabold italic tracking-tight text-foreground">
                    Network <span className="text-primary">Activity Logs</span>
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-outfit">
                    Recent synchronization logs and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto custom-scrollbar" style={{maxHeight: '30rem'}}>
                  {paginatedData.length > 0 ? (
                    <div className="space-y-4">
                      {paginatedData.map((attempt, index) => {
                        let themeColor = 'hsl(var(--primary))'; 
                        if (attempt.chosen_theme) {
                          switch(attempt.chosen_theme) {
                            case "Ocean": themeColor = '#0066cc'; break;
                            case "Forest": themeColor = '#228B22'; break;
                            case "Sunset": themeColor = '#FF6B35'; break;
                          }
                        }
                        
                        return (
                          <div
                            key={attempt.id || index}
                            className="p-4 rounded-lg border border-border relative overflow-hidden bg-muted/30"
                          >
                            <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: themeColor }} />
                            <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center pl-2">
                              <div>
                                <h3 className="text-foreground font-outfit font-bold">Quiz #{attempt.quiz_id}</h3>
                                <div className="text-sm text-foreground/80 font-outfit font-medium">Score: <span className="text-primary">{Math.round(attempt.score || 0)}%</span></div>
                              </div>
                              <div className="text-xs text-muted-foreground font-outfit mt-2 md:mt-0 flex items-center bg-background px-2 py-1 rounded-md border border-border">
                                <Calendar className="w-3 h-3 inline mr-2 text-muted-foreground"/>
                                {new Date(attempt.created_at || attempt.solved_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {hasMore && (
                        <Button variant="secondary" onClick={loadMoreQuizzes} disabled={loadingMore} className="w-full mt-4">
                          {loadingMore ? <LoadingSpinner size="sm"/> : 'Load Older Logs'}
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground font-outfit bg-muted/20 border border-dashed rounded-lg">
                      <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p>No activity logs found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>


            {/* TAB 3: Appearance */}
            <TabsContent value="appearance" className="space-y-6 outline-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="bg-card border-border shadow-xl mb-6">
                  <CardHeader>
                    <CardTitle className="font-outfit font-bold italic flex items-center gap-2">
                      <Calendar className="size-5 text-primary"/> Time & Temporal Settings
                    </CardTitle>
                    <CardDescription className="font-outfit text-muted-foreground">Configure how time is displayed across your node interface</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-0 p-0 bg-muted/20 border-t border-border/50 divide-y divide-border/50">
                    {/* Time Format Toggle */}
                    <div className="flex items-center justify-between p-6">
                      <div className="space-y-1">
                        <p className="font-bold font-outfit text-foreground">Clock Format</p>
                        <p className="text-xs text-muted-foreground font-outfit">Toggle between 12-hour and 24-hour global indexing</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${timeFormat === '12h' ? 'text-primary' : 'text-muted-foreground'}`}>12H</span>
                        <Button 
                          onClick={toggleTimeFormat}
                          variant="outline" 
                          size="sm" 
                          className="w-16 h-8 rounded-full border-2 p-0 relative overflow-hidden group border-primary/30"
                        >
                           <motion.div 
                            animate={{ x: timeFormat === '12h' ? -16 : 16 }}
                            className="w-6 h-6 rounded-full bg-primary shadow-lg shadow-primary/40 relative z-10"
                           />
                        </Button>
                        <span className={`text-xs font-bold ${timeFormat === '24h' ? 'text-primary' : 'text-muted-foreground'}`}>24H</span>
                      </div>
                    </div>

                    {/* Show Seconds Toggle */}
                    <div className="flex items-center justify-between p-6">
                      <div className="space-y-1">
                        <p className="font-bold font-outfit text-foreground">Show Seconds</p>
                        <p className="text-xs text-muted-foreground font-outfit">Display real-time seconds in the clock</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${!showSeconds ? 'text-primary' : 'text-muted-foreground'}`}>OFF</span>
                        <Button 
                          onClick={toggleShowSeconds}
                          variant="outline" 
                          size="sm" 
                          className="w-16 h-8 rounded-full border-2 p-0 relative overflow-hidden group border-primary/30"
                        >
                           <motion.div 
                            animate={{ x: !showSeconds ? -16 : 16 }}
                            className="w-6 h-6 rounded-full bg-primary shadow-lg shadow-primary/40 relative z-10"
                           />
                        </Button>
                        <span className={`text-xs font-bold ${showSeconds ? 'text-primary' : 'text-muted-foreground'}`}>ON</span>
                      </div>
                    </div>

                    {/* Show Date Toggle */}
                    <div className="flex items-center justify-between p-6">
                      <div className="space-y-1">
                        <p className="font-bold font-outfit text-foreground">Show Date & Day</p>
                        <p className="text-xs text-muted-foreground font-outfit">Display the current date and day of the week</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${!showDate ? 'text-primary' : 'text-muted-foreground'}`}>OFF</span>
                        <Button 
                          onClick={toggleShowDate}
                          variant="outline" 
                          size="sm" 
                          className="w-16 h-8 rounded-full border-2 p-0 relative overflow-hidden group border-primary/30"
                        >
                           <motion.div 
                            animate={{ x: !showDate ? -16 : 16 }}
                            className="w-6 h-6 rounded-full bg-primary shadow-lg shadow-primary/40 relative z-10"
                           />
                        </Button>
                        <span className={`text-xs font-bold ${showDate ? 'text-primary' : 'text-muted-foreground'}`}>ON</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <ColorThemeSelector />
                <ThemeModeSelector />
              </motion.div>
            </TabsContent>


            {/* TAB 4: Security (Danger Zone) */}
            <TabsContent value="professional" className="space-y-6 outline-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                {userData.deletion_scheduled_at && (
                <div className="p-4 rounded-xl bg-red-500/10 border-2 border-red-500 shadow-sm mb-6">
                  <h3 className="text-red-500 font-bold mb-2 font-outfit flex items-center gap-2"><Shield className="w-4 h-4"/> DELETION SCHEDULED</h3>
                  <p className="font-outfit text-sm text-foreground">Your account is queued for termination on: <span className="font-bold">{new Date(userData.deletion_scheduled_at).toLocaleDateString()}</span>. Proceed with cancellation below if this was a mistake.</p>
                </div>
              )}

              <Card className="bg-background border-red-500/30 shadow-lg shadow-red-500/5">
                <CardHeader className="pb-6 border-b border-border/50">
                  <CardTitle className="text-xl font-outfit font-extrabold tracking-tight text-red-500 flex items-center gap-2">
                    <Shield className="w-5 h-5"/> Protocol Termination
                  </CardTitle>
                  <CardDescription className="text-muted-foreground font-outfit uppercase text-[10px] tracking-[0.1em]">
                    Secure identity deletion node
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 font-outfit">
                    <p className="text-foreground text-sm mb-4">
                      ⚠️ <span className="italic font-bold text-red-500">"SOMETIMES WE NEED TO INITIALIZE A SYSTEM WIPE."</span> 
                    </p>
                    <p className="text-muted-foreground text-[11px] leading-relaxed">
                      Executing account termination will purge all synchronized attempt data, encrypted notifications, and identity footprints. 
                      A 14-day protocol window allows for manual restoration if necessary.
                    </p>
                  </div>
                  
                  <div className="flex justify-end">
                    <DeleteAccountDialog
                      userId={userData.user_id}
                      username={userData.username}
                      quizCount={quizData.length}
                      deletionScheduledAt={userData.deletion_scheduled_at}
                      onDeletionScheduled={() => {
                        window.location.reload()
                      }}
                      onDeletionCancelled={() => {
                        window.location.reload()
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  )
}
