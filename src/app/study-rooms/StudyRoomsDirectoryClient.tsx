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
  MessageSquare, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react'
import { createStudyRoom, joinStudyRoom } from './actions'

interface StudyRoomsDirectoryClientProps {
  initialRooms: any[]
  userSpecialization: string
  userLevel: number
  isAdmin: boolean
}

export default function StudyRoomsDirectoryClient({
  initialRooms,
  userSpecialization,
  userLevel,
  isAdmin
}: StudyRoomsDirectoryClientProps) {
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
        router.push(`/study-rooms/${res.roomId}`)
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
      router.push(`/study-rooms/${roomId}`)
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
          router.push(`/study-rooms/${roomId}`)
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
      {/* Hero Banner */}
      <div className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-br from-card to-muted border border-border shadow-lg overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                Collaborative Learning
              </Badge>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Study Teams & Spaces</h1>
            <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
              Browse, join, or create study spaces to collaborate on summaries, chat with peers, and solve quizzes together.
            </p>
          </div>
          
          {/* Create Room Button Trigger */}
          {isAdmin && (
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-lg hover:shadow-primary/20 transition-all cursor-pointer">
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
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 bg-muted/20 p-3 rounded-xl border border-border">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search study spaces by name or description..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border text-sm"
          />
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <Card className="bg-card border-border shadow-md py-20 flex flex-col items-center justify-center text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <CardTitle className="text-lg font-bold text-foreground">No Study Spaces Found</CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-sm mt-1">
            There are no active study spaces matching your search. Create the first space to study with your classmates!
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="bg-card border-border shadow-md hover:border-primary/30 transition-all duration-300 h-full flex flex-col justify-between group">
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
                <CardFooter className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                    Created {new Date(room.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <Button 
                    size="sm" 
                    variant={room.joinStatus === 'approved' ? "outline" : (room.joinStatus === 'pending' ? "secondary" : "default")}
                    disabled={isPending}
                    onClick={() => handleJoinRoom(room.id, room.name, room.isJoined, room.joinStatus)}
                    className="h-8 text-xs font-semibold cursor-pointer border-border hover:bg-muted group/btn"
                  >
                    {room.joinStatus === 'approved' ? (
                      <>
                        Enter Space
                        <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
                      </>
                    ) : room.joinStatus === 'pending' ? (
                      'Pending Approval'
                    ) : (
                      room.join_approval === 'requires_approval' ? 'Request Access' : 'Join Group'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
