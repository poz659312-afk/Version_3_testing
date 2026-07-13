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
import { createStudyRoom, joinStudyRoom } from './actions'
import { cn } from '@/lib/utils'
import { SpotlightCard } from '@/components/react-bits/spotlight-card'
import { BlurText } from '@/components/react-bits/blur-text'
import BorderGlow from '@/components/BorderGlow'


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
      <BorderGlow
        animated={true}
        glowColor="99 102 241"
        colors={['#6366f1', '#a855f7', '#3b82f6']}
        borderRadius={24}
        backgroundColor="transparent"
        className="ss-mesh-hero shadow-xl w-full"
      >
        <section className="relative overflow-hidden p-5 sm:p-7 lg:p-9">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-28 left-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <Badge className="w-fit bg-primary/10 text-primary border-primary/25 flex items-center gap-1.5 px-3 py-1 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  Collaborative Learning Hub
                </Badge>
                <BlurText
                  text="Study Teams & Spaces"
                  delay={100}
                  animateBy="word"
                  direction="top"
                  className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-foreground"
                />
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-muted-foreground text-sm sm:text-base max-w-2xl leading-relaxed"
                >
                  Browse, join, or create study spaces to collaborate on summaries, chat with peers, and solve quizzes together.
                </motion.p>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SpotlightCard
                spotlightColor="rgba(99, 102, 241, 0.1)"
                className="ss-glass-card rounded-2xl border border-border/40 hover:border-indigo-500/30 transition-all duration-300 shadow-md"
              >
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Matched Spaces</p>
                    <p className="text-2xl font-black text-foreground mt-1">{filteredRooms.length}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <BookOpen className="w-5 h-5" />
                  </div>
                </div>
              </SpotlightCard>
              
              <SpotlightCard
                spotlightColor="rgba(168, 85, 247, 0.1)"
                className="ss-glass-card rounded-2xl border border-border/40 hover:border-purple-500/30 transition-all duration-300 shadow-md"
              >
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Joined by You</p>
                    <p className="text-2xl font-black text-foreground mt-1">{joinedRoomsCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
              </SpotlightCard>

              <SpotlightCard
                spotlightColor="rgba(59, 130, 246, 0.1)"
                className="ss-glass-card rounded-2xl border border-border/40 hover:border-blue-500/30 transition-all duration-300 shadow-md"
              >
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Pending Requests</p>
                    <p className="text-2xl font-black text-foreground mt-1">{pendingRoomsCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
              </SpotlightCard>
            </div>
          </div>
        </section>
      </BorderGlow>

      <section className="rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm p-3 sm:p-4">
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
              <SpotlightCard
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
                className="ss-glass-card rounded-2xl h-full flex flex-col justify-between group cursor-pointer border border-border/40 hover:border-indigo-500/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-indigo-500/5"
                spotlightColor="rgba(99, 102, 241, 0.12)"
              >
                <div className="flex flex-col h-full justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <CardTitle className="text-base font-bold group-hover:text-primary transition-colors line-clamp-1">
                        {room.name}
                      </CardTitle>
                      <Badge className="bg-muted text-muted-foreground border-border text-[10px] font-medium flex items-center gap-1 h-5 py-0 px-2 shrink-0">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        {room.memberCount}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] mt-1.5">
                      {room.description || 'No description provided.'}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pb-3 pt-0">
                    <div className="flex flex-wrap gap-1.5">
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
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border/60 flex flex-row items-center justify-between gap-3">
                    <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                      Created {new Date(room.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <div className={cn(
                      "inline-flex items-center justify-center rounded-lg text-xs font-semibold h-8 px-3 transition-all duration-300 border shadow-xs select-none",
                      room.joinStatus === 'approved'
                        ? "border-border bg-background text-foreground group-hover:bg-primary group-hover:text-white group-hover:border-primary"
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
                  </CardFooter>
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
