'use client'

import { useState, useEffect } from 'react'
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
  Layers
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
  const [rooms, setRooms] = useState(initialRooms || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync rooms state when initialRooms changes on the server
  useEffect(() => {
    setRooms(initialRooms || [])
  }, [initialRooms])

  useEffect(() => {
    const supabase = createClient()

    // Hidden background auto-refresh every 12 seconds querying Supabase directly (bypasses Server Actions & Next.js cache)
    const interval = setInterval(async () => {
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

        if (roomsError) {
          console.warn('Failed to fetch rooms in background:', roomsError)
          return
        }

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
        console.warn('Background rooms sync failed:', err)
      }
    }, 12000)

    return () => clearInterval(interval)
  }, [])
  
  // Dialog state
  const [openCreate, setOpenCreate] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomDesc, setNewRoomDesc] = useState('')
  const [newRoomVisibility, setNewRoomVisibility] = useState('public')
  const [newRoomJoinApproval, setNewRoomJoinApproval] = useState('immediate')

  // Filter rooms by search query
  const filteredRooms = rooms.filter(room => 
    (room.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.description && room.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  const joinedRoomsCount = rooms.filter((room) => room.joinStatus === 'approved').length
  const pendingRoomsCount = rooms.filter((room) => room.joinStatus === 'pending').length

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative overflow-hidden rounded-xl border border-border/60 dark:border-white/[0.05] bg-card/60 dark:bg-white/[0.02] backdrop-blur-md p-5 transition-all duration-300 hover:border-indigo-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04] hover:-translate-y-0.5 group shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Matched Spaces</p>
                  <p className="text-3xl font-black text-foreground mt-1 tracking-tight">{filteredRooms.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 group-hover:scale-105 transition-transform duration-300">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-border/60 dark:border-white/[0.05] bg-card/60 dark:bg-white/[0.02] backdrop-blur-md p-5 transition-all duration-300 hover:border-purple-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04] hover:-translate-y-0.5 group shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Joined by You</p>
                  <p className="text-3xl font-black text-foreground mt-1 tracking-tight">{joinedRoomsCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/15 group-hover:scale-105 transition-transform duration-300">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-border/60 dark:border-white/[0.05] bg-card/60 dark:bg-white/[0.02] backdrop-blur-md p-5 transition-all duration-300 hover:border-blue-500/30 hover:bg-muted/50 dark:hover:bg-white/[0.04] hover:-translate-y-0.5 group shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Pending Requests</p>
                  <p className="text-3xl font-black text-foreground mt-1 tracking-tight">{pendingRoomsCount}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/15 group-hover:scale-105 transition-transform duration-300">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 dark:border-white/[0.06] bg-card/40 backdrop-blur-sm p-4">
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search study spaces by name or description..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/80 border-border/80 focus-visible:ring-primary/50 text-sm h-10 transition-all duration-200"
            />
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
      </section>

      {filteredRooms.length === 0 ? (
        <Card className="bg-card border-border shadow-md py-16 sm:py-20 flex flex-col items-center justify-center text-center rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <CardTitle className="text-lg sm:text-xl font-bold text-foreground">No Study Spaces Found</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm mt-1">
            There are no active study spaces matching your search. Create the first space to study with your classmates!
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="h-full"
            >
              <div
                role="button"
                tabIndex={0}
                aria-label={`${room.name}. Specialization: ${room.specialization}. Level ${room.level_num}. Member count: ${room.memberCount}. Status: ${
                  room.joinStatus === 'approved'
                    ? 'Joined. Click to enter.'
                    : room.joinStatus === 'pending'
                      ? 'Pending approval.'
                      : room.join_approval === 'requires_approval'
                        ? 'Requires approval. Click to request access.'
                        : 'Public group. Click to join.'
                }`}
                onClick={() => handleJoinRoom(room.id, room.name, room.isJoined, room.joinStatus)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleJoinRoom(room.id, room.name, room.isJoined, room.joinStatus);
                  }
                }}
                className="relative overflow-hidden rounded-2xl h-full flex flex-col justify-between group cursor-pointer border border-border/50 dark:border-white/[0.06] bg-card/45 dark:bg-[#0c0816]/50 backdrop-blur-xl hover:border-primary/50 hover:bg-muted/40 dark:hover:bg-[#0f0a1c]/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none hover:-translate-y-1 transition-all duration-300 ease-out shadow-md hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="flex flex-col h-full justify-between p-6 relative z-10">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-base font-bold group-hover:text-primary transition-colors line-clamp-1 text-foreground">
                        {room.name}
                      </h3>
                      <Badge className="bg-muted border-border/85 dark:bg-white/[0.04] dark:border-white/[0.08] text-[10px] font-medium flex items-center gap-1 h-5 py-0 px-2 shrink-0">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {room.memberCount}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {room.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="my-4 flex flex-wrap gap-1.5">
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
                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                      Created {new Date(room.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <div className={cn(
                      "inline-flex items-center justify-center rounded-lg text-xs font-semibold h-8 px-3 transition-all duration-300 border shadow-xs select-none",
                      room.joinStatus === 'approved'
                        ? "border-border bg-muted/30 dark:border-white/[0.08] dark:bg-white/[0.02] text-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary"
                        : room.joinStatus === 'pending'
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
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
