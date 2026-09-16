'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { 
  Users, 
  Plus, 
  Search, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  Loader2,
  GraduationCap,
  Layers,
  Share2,
  Copy,
  Check,
  Clock,
  Filter,
  ArrowUpDown,
  RotateCcw,
  CheckCircle2
} from 'lucide-react'
import { createStudyRoom, joinStudyRoom, getRoomsList } from './actions'
import { cn } from '@/lib/utils'
import { ShinyText } from '@/components/react-bits/shiny-text'
import { createClient } from '@/lib/supabase/client'

interface StudySpacesDirectoryClientProps {
  initialRooms: any[]
  userSpecialization: string
  userLevel: number
  isAdmin: boolean
}

export default function StudySpacesDirectoryClient({
  initialRooms,
  userSpecialization,
  userLevel,
  isAdmin
}: StudySpacesDirectoryClientProps) {
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>(initialRooms)
  const [searchQuery, setSearchQuery] = useState('')
  const [tabFilter, setTabFilter] = useState<'all' | 'joined' | 'pending'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'members' | 'name'>('newest')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [isPending, setIsPending] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null)

  const formatRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffMs = Math.max(0, now.getTime() - d.getTime())
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays}d ago`
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return ''
    }
  }

  const handleCopyRoomLink = (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation()
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://chameleon-nu.vercel.app'
    const url = `${origin}/study-spaces/${roomId}`
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url)
    }
    setCopiedRoomId(roomId)
    toast.success('Study space link copied to clipboard!')
    setTimeout(() => setCopiedRoomId(null), 2000)
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync rooms state when initialRooms changes on the server
  useEffect(() => {
    setRooms(initialRooms || [])
  }, [initialRooms])

  useEffect(() => {
    const supabase = createClient()
    let debounceTimer: NodeJS.Timeout | null = null

    const fetchFreshRooms = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const userSession = sessionData?.session?.user
        if (!userSession) return

        const { data: roomsData, error: roomsError } = await supabase
          .from('study_rooms')
          .select(`
            *,
            study_room_members (
              user_id,
              status
            )
          `)
          .order('created_at', { ascending: false })

        if (roomsError) return

        const freshRooms = (roomsData || []).map((room: any) => {
          const approvedMembers = room.study_room_members?.filter((m: any) => m.status === 'approved') || []
          const memberRow = room.study_room_members?.find((m: any) => m.user_id === userSession.id)
          const joinStatus = memberRow ? memberRow.status : 'none'

          return {
            ...room,
            memberCount: approvedMembers.length,
            joinStatus,
            isJoined: joinStatus === 'approved'
          }
        })

        setRooms(freshRooms)
      } catch (err) {
        console.warn('Realtime rooms sync failed:', err)
      }
    }

    const debouncedFetch = (delay = 1500) => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        fetchFreshRooms()
      }, delay)
    }

    const channel = supabase
      .channel('study-spaces-directory')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_rooms' },
        () => {
          debouncedFetch(2500)
        }
      )
      .subscribe()

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      supabase.removeChannel(channel)
    }
  }, [])
  
  // Dialog state
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [newRoomVisibility, setNewRoomVisibility] = useState('public')
  const [newRoomJoinApproval, setNewRoomJoinApproval] = useState('immediate')

  const joinedRoomsCount = rooms.filter((room) => room.joinStatus === 'approved').length
  const pendingRoomsCount = rooms.filter((room) => room.joinStatus === 'pending').length

  // Filter and sort rooms dynamically
  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        if (tabFilter === 'joined' && room.joinStatus !== 'approved') return false
        if (tabFilter === 'pending' && room.joinStatus !== 'pending') return false

        if (selectedLevel !== 'all' && String(room.level_num) !== selectedLevel) return false

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchesName = (room.name || '').toLowerCase().includes(q)
          const matchesDesc = (room.description || '').toLowerCase().includes(q)
          const matchesSpec = (room.specialization || '').toLowerCase().includes(q)
          if (!matchesName && !matchesDesc && !matchesSpec) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'members') {
          return (b.memberCount || 0) - (a.memberCount || 0)
        }
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '')
        }
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      })
  }, [rooms, tabFilter, selectedLevel, searchQuery, sortBy])

  const handleResetFilters = () => {
    setSearchQuery('')
    setTabFilter('all')
    setSelectedLevel('all')
    setSortBy('newest')
  }

  const isFiltered = searchQuery.trim() !== '' || tabFilter !== 'all' || selectedLevel !== 'all' || sortBy !== 'newest'

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoomName.trim()) {
      toast.error('Room name is required')
      return
    }

    setIsPending(true)
    try {
      const res = await createStudyRoom(newRoomName, newRoomDesc, newRoomVisibility, newRoomJoinApproval)
      if (res.success && res.roomId) {
        toast.success(`Study Space "${newRoomName}" created successfully!`)
        setOpenCreate(false)
        setNewRoomName('')
        setNewRoomDesc('')
        setNewRoomVisibility('public')
        setNewRoomJoinApproval('immediate')
        router.push(`/study-spaces/${res.roomId}`)
      } else {
        toast.error(res.error || 'Failed to create study space')
      }
    } catch (err) {
      toast.error('An error occurred while creating study space.')
    } finally {
      setIsPending(false)
    }
  }

  const handleJoinRoom = async (roomId: string, roomName: string, isJoined: boolean, currentJoinStatus: string) => {
    if (isJoined || currentJoinStatus === 'approved') {
      router.push(`/study-spaces/${roomId}`)
      return
    }

    if (currentJoinStatus === 'pending') {
      toast.info('Your join request is still pending owner approval.')
      return
    }

    setIsPending(true)
    try {
      const res = await joinStudyRoom(roomId)
      if (res.success) {
        if (res.status === 'pending') {
          toast.success(`Join request sent for "${roomName}"! Waiting for owner's approval.`)
          setRooms(prev => prev.map(r => r.id === roomId ? { ...r, joinStatus: 'pending' } : r))
        } else {
          toast.success(`Joined space "${roomName}"!`)
          setRooms(prev => prev.map(r => r.id === roomId ? { ...r, joinStatus: 'approved' } : r))
          router.push(`/study-spaces/${roomId}`)
        }
      } else {
        toast.error(res.error || 'Failed to join study space')
      }
    } catch (err) {
      toast.error('An error occurred while joining study space.')
    } finally {
      setIsPending(false)
    }
  }

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="space-y-8 premium-container">
      <section className="relative overflow-hidden rounded-2xl border border-border/60 dark:border-white/[0.06] bg-card/40 dark:bg-[#0c0816]/70 backdrop-blur-md p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000004_1px,transparent_1px),linear-gradient(to_bottom,#00000004_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-80 h-80 rounded-full bg-primary/5 dark:bg-primary/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full bg-indigo-500/5 dark:bg-indigo-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <Badge className="w-fit bg-primary/10 text-primary border-primary/20 flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Collaborative Learning Hub
              </Badge>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground flex items-center">
                <ShinyText
                  text="Study Teams & Spaces"
                  disabled={false}
                  speed={4}
                  className="bg-clip-text"
                />
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed">
                Browse, join, or create study spaces to collaborate on summaries, chat with peers, and solve quizzes together.
              </p>
            </div>

            {isAdmin && (
              <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                <DialogTrigger asChild>
                  <Button className="ss-btn-shimmer text-white font-semibold shadow-lg hover:shadow-primary/20 transition-all cursor-pointer h-10 sm:h-11 px-4 sm:px-5">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Study Space
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border shadow-2xl">
                  <form onSubmit={handleCreateRoom}>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Create a Study Space</DialogTitle>
                      <DialogDescription className="text-xs mt-1 text-muted-foreground">
                        This space will be listed in the global directory and visible to all registered students.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-1.5">
                        <label htmlFor="room-name" className="text-xs font-semibold text-muted-foreground">Room Name</label>
                        <Input 
                          id="room-name"
                          placeholder="e.g. Data Science Exam Prep Group" 
                          value={newRoomName} 
                          onChange={e => setNewRoomName(e.target.value)}
                          disabled={isPending}
                          className="bg-muted/30 border-border text-sm"
                          maxLength={60}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="room-desc" className="text-xs font-semibold text-muted-foreground">Description (Optional)</label>
                        <Input 
                          id="room-desc"
                          placeholder="e.g. Reviewing neural networks and final term quizzes together." 
                          value={newRoomDesc} 
                          onChange={e => setNewRoomDesc(e.target.value)}
                          disabled={isPending}
                          className="bg-muted/30 border-border text-sm"
                          maxLength={180}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label htmlFor="room-visibility" className="text-xs font-semibold text-muted-foreground">Visibility</label>
                          <select 
                            id="room-visibility"
                            value={newRoomVisibility}
                            onChange={e => setNewRoomVisibility(e.target.value)}
                            disabled={isPending}
                            className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="room-approval" className="text-xs font-semibold text-muted-foreground">Join Setting</label>
                          <select 
                            id="room-approval"
                            value={newRoomJoinApproval}
                            onChange={e => setNewRoomJoinApproval(e.target.value)}
                            disabled={isPending}
                            className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          >
                            <option value="immediate">Immediate</option>
                            <option value="requires_approval">Needs Approval</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setOpenCreate(false)} 
                        disabled={isPending}
                        className="border-border hover:bg-muted text-sm cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isPending}
                        className="bg-gradient-to-r from-primary to-secondary text-white font-semibold cursor-pointer"
                      >
                        {isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Space'
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Interactive Metric Filter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => setTabFilter('all')}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 group shadow-sm cursor-pointer",
                tabFilter === 'all'
                  ? "border-indigo-500/60 bg-indigo-500/10 shadow-indigo-500/10 ring-2 ring-indigo-500/30 -translate-y-0.5"
                  : "border-border/60 dark:border-white/[0.05] bg-card/60 dark:bg-white/[0.02] hover:border-indigo-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04] hover:-translate-y-0.5"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <span>All Available</span>
                    {tabFilter === 'all' && <Badge className="bg-indigo-500/20 text-indigo-400 text-[9px] py-0 px-1.5 h-4 border-none">Active</Badge>}
                  </p>
                  <p className="text-3xl font-black text-foreground mt-1 tracking-tight">{rooms.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 group-hover:scale-105 transition-transform duration-300">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTabFilter('joined')}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 group shadow-sm cursor-pointer",
                tabFilter === 'joined'
                  ? "border-purple-500/60 bg-purple-500/10 shadow-purple-500/10 ring-2 ring-purple-500/30 -translate-y-0.5"
                  : "border-border/60 dark:border-white/[0.05] bg-card/60 dark:bg-white/[0.02] hover:border-purple-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04] hover:-translate-y-0.5"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <span>Joined by You</span>
                    {tabFilter === 'joined' && <Badge className="bg-purple-500/20 text-purple-400 text-[9px] py-0 px-1.5 h-4 border-none">Active</Badge>}
                  </p>
                  <p className="text-3xl font-black text-foreground mt-1 tracking-tight">{joinedRoomsCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/15 group-hover:scale-105 transition-transform duration-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTabFilter('pending')}
              className={cn(
                "relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 group shadow-sm cursor-pointer",
                tabFilter === 'pending'
                  ? "border-amber-500/60 bg-amber-500/10 shadow-amber-500/10 ring-2 ring-amber-500/30 -translate-y-0.5"
                  : "border-border/60 dark:border-white/[0.05] bg-card/60 dark:bg-white/[0.02] hover:border-amber-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04] hover:-translate-y-0.5"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                    <span>Pending Requests</span>
                    {tabFilter === 'pending' && <Badge className="bg-amber-500/20 text-amber-400 text-[9px] py-0 px-1.5 h-4 border-none">Active</Badge>}
                  </p>
                  <p className="text-3xl font-black text-foreground mt-1 tracking-tight">{pendingRoomsCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/15 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar Section */}
      <section className="rounded-2xl border border-border/80 dark:border-white/[0.06] bg-card/40 backdrop-blur-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/50 dark:bg-white/[0.03] rounded-xl border border-border/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setTabFilter('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none",
                tabFilter === 'all'
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              All Spaces
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold">{rooms.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setTabFilter('joined')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none",
                tabFilter === 'joined'
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              My Spaces
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold">{joinedRoomsCount}</span>
            </button>

            <button
              type="button"
              onClick={() => setTabFilter('pending')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap select-none",
                tabFilter === 'pending'
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              Pending Approval
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 font-bold">{pendingRoomsCount}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[11px] h-7 px-2.5 border-border bg-muted/40 flex items-center gap-1.5 text-muted-foreground font-medium">
              <GraduationCap className="w-3.5 h-3.5 text-primary" />
              {userSpecialization}
            </Badge>
            <Badge variant="outline" className="text-[11px] h-7 px-2.5 border-border bg-muted/40 flex items-center gap-1.5 text-muted-foreground font-medium">
              <Layers className="w-3.5 h-3.5 text-secondary" />
              Level {userLevel}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search by space name, topic, or description..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/80 border-border/80 focus-visible:ring-primary/50 text-xs sm:text-sm h-10 transition-all duration-200 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Level Filter Dropdown */}
            <select
              value={selectedLevel}
              onChange={e => setSelectedLevel(e.target.value)}
              className="bg-card border border-border/80 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10 cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-card border border-border/80 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-10 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="members">Most Members</option>
              <option value="name">Alphabetical</option>
            </select>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Rooms Grid or Empty State */}
      {filteredRooms.length === 0 ? (
        <Card className="bg-card border-border shadow-md py-16 sm:py-20 flex flex-col items-center justify-center text-center rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground">No Study Spaces Found</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1">
            {isFiltered
              ? 'No study spaces match your active filters and search query.'
              : 'There are no active study spaces right now. Check back soon or request your space!'}
          </CardDescription>
          {isFiltered && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="mt-4 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Clear Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="h-full"
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`${room.name}. Specialization: ${room.specialization}. Level ${room.level_num}. Member count: ${room.memberCount}.`}
                onClick={() => handleJoinRoom(room.id, room.name, room.isJoined, room.joinStatus)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleJoinRoom(room.id, room.name, room.isJoined, room.joinStatus);
                  }
                }}
                className={cn(
                  "relative overflow-hidden rounded-2xl h-full flex flex-col justify-between group cursor-pointer border backdrop-blur-xl transition-all duration-300 ease-out shadow-md hover:shadow-2xl hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  room.joinStatus === 'approved'
                    ? "border-emerald-500/20 hover:border-emerald-500/50 bg-card/50 dark:bg-[#0c0816]/60 hover:bg-muted/40"
                    : room.joinStatus === 'pending'
                      ? "border-amber-500/20 hover:border-amber-500/50 bg-card/50 dark:bg-[#0c0816]/60 hover:bg-muted/40"
                      : "border-border/50 dark:border-white/[0.06] hover:border-primary/50 bg-card/45 dark:bg-[#0c0816]/50 hover:bg-muted/40"
                )}
              >
                <div className="flex flex-col h-full justify-between p-6 relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold group-hover:text-primary transition-colors line-clamp-1 text-foreground">
                            {room.name}
                          </h3>
                          {room.joinStatus === 'approved' && (
                            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[9px] py-0 px-1.5 h-4 font-bold flex items-center gap-1 shrink-0">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Joined
                            </Badge>
                          )}
                          {room.joinStatus === 'pending' && (
                            <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[9px] py-0 px-1.5 h-4 font-bold flex items-center gap-1 shrink-0">
                              <Clock className="w-2.5 h-2.5" />
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleCopyRoomLink(e, room.id)}
                          title="Copy Link"
                          className="w-6 h-6 rounded-md bg-muted/60 hover:bg-primary/20 hover:text-primary border border-border/80 flex items-center justify-center transition-colors cursor-pointer text-muted-foreground"
                        >
                          {copiedRoomId === room.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3 h-3" />
                          )}
                        </button>
                        <Badge className="bg-muted border-border/85 dark:bg-white/[0.04] dark:border-white/[0.08] text-[10px] font-medium flex items-center gap-1 h-5 py-0 px-2 shrink-0">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          {room.memberCount}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {room.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="my-3.5 flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-indigo-500/20 bg-indigo-500/5 text-indigo-400 font-semibold">
                      {room.specialization}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] py-0 h-4 border-purple-500/20 bg-purple-500/5 text-purple-400 font-semibold">
                      Level {room.level_num}
                    </Badge>
                    <Badge variant="outline" className={`text-[9px] py-0 h-4 font-semibold ${
                      room.visibility === 'private' 
                        ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-400' 
                        : 'border-blue-500/20 bg-blue-500/5 text-blue-400'
                    }`}>
                      {room.visibility === 'private' ? 'Private' : 'Public'}
                    </Badge>
                    {room.join_approval === 'requires_approval' && (
                      <Badge variant="outline" className="text-[9px] py-0 h-4 border-red-500/20 bg-red-500/5 text-red-400 font-semibold">
                        Approval Req.
                      </Badge>
                    )}
                  </div>

                  <div className="w-full h-px bg-border/60 dark:bg-white/[0.06] my-2" />

                  <div className="pt-2 flex flex-row items-center justify-between gap-3">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1" suppressHydrationWarning>
                      <Clock className="w-3 h-3 text-muted-foreground/60" />
                      {formatRelativeTime(room.created_at)}
                    </span>
                    <div className={cn(
                      "inline-flex items-center justify-center rounded-lg text-xs font-semibold h-8 px-3 transition-all duration-300 border shadow-xs select-none",
                      room.joinStatus === 'approved'
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500"
                        : room.joinStatus === 'pending'
                          ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                          : "border-primary bg-primary text-primary-foreground group-hover:shadow-md group-hover:shadow-primary/20"
                    )}>
                      {room.joinStatus === 'approved' ? (
                        <>
                          Enter Space
                          <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
                        </>
                      ) : room.joinStatus === 'pending' ? (
                        'Pending Approval'
                      ) : (
                        room.join_approval === 'requires_approval' ? 'Request Access' : 'Join Group'
                      )}
                    </div>
                  </div>
                </div>

                {/* Decorative background watermark icon */}
                <GraduationCap className="absolute -right-6 -bottom-6 w-32 h-32 text-foreground/[0.015] group-hover:text-primary/[0.04] dark:text-foreground/[0.02] dark:group-hover:text-primary/[0.05] group-hover:scale-105 transition-all duration-500 ease-out pointer-events-none z-0" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

