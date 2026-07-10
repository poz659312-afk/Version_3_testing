'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  MessageSquare, 
  ArrowLeft, 
  Send, 
  BookOpen, 
  Award, 
  Swords, 
  Clock, 
  UserCheck, 
  LogOut, 
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Crown,
  Sparkles,
  Loader2,
  Plus
} from 'lucide-react'
import { 
  getRoomDetails, 
  leaveStudyRoom, 
  sendRoomMessage, 
  updateScratchpad, 
  startQuizChallenge,
  approveMember,
  rejectMember,
  removeMember,
  updateRoomSettings,
  deleteStudyRoom
} from '../actions'

interface StudySpaceClientProps {
  initialDetails: {
    room: any
    members: any[]
    messages: any[]
    challenges: any[]
    availableQuizzes: any[]
    currentUserId: string
  }
  roomId: string
}

export default function StudySpaceClient({
  initialDetails,
  roomId
}: StudySpaceClientProps) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Data states
  const [room, setRoom] = useState(initialDetails?.room || {})
  const [members, setMembers] = useState(initialDetails?.members || [])
  const [messages, setMessages] = useState(initialDetails?.messages || [])
  const [challenges, setChallenges] = useState(initialDetails?.challenges || [])
  const [availableQuizzes] = useState(initialDetails?.availableQuizzes || [])
  const currentUserId = initialDetails?.currentUserId

  const isOwner = room.created_by === currentUserId;

  const [settingsName, setSettingsName] = useState(room.name || '')
  const [settingsDesc, setSettingsDesc] = useState(room.description || '')
  const [settingsVisibility, setSettingsVisibility] = useState(room.visibility || 'public')
  const [settingsJoinApproval, setSettingsJoinApproval] = useState(room.join_approval || 'immediate')
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const handleApprove = async (userId: string) => {
    try {
      const res = await approveMember(roomId, userId)
      if (res.success) {
        toast.success('Member approved successfully!')
        setMembers(prev => prev.map(m => m.user?.auth_id === userId ? { ...m, status: 'approved' } : m))
      } else {
        toast.error(res.error || 'Failed to approve member')
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  const handleReject = async (userId: string) => {
    try {
      const res = await rejectMember(roomId, userId)
      if (res.success) {
        toast.success('Member request rejected.')
        setMembers(prev => prev.filter(m => m.user?.auth_id !== userId))
      } else {
        toast.error(res.error || 'Failed to reject request')
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from this space?')) return
    try {
      const res = await removeMember(roomId, userId)
      if (res.success) {
        toast.success('Member removed successfully.')
        setMembers(prev => prev.filter(m => m.user?.auth_id !== userId))
      } else {
        toast.error(res.error || 'Failed to remove member')
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settingsName.trim()) {
      toast.error('Space name is required')
      return
    }
    setIsSavingSettings(true)
    try {
      const res = await updateRoomSettings(
        roomId, 
        settingsName, 
        settingsDesc, 
        settingsVisibility, 
        settingsJoinApproval
      )
      if (res.success) {
        toast.success('Space settings updated successfully!')
        setRoom(prev => ({
          ...prev,
          name: settingsName,
          description: settingsDesc,
          visibility: settingsVisibility,
          join_approval: settingsJoinApproval
        }))
      } else {
        toast.error(res.error || 'Failed to update settings')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!confirm('WARNING: Are you absolutely sure you want to delete this study space? This action is irreversible.')) return
    setIsPending(true)
    try {
      const res = await deleteStudyRoom(roomId)
      if (res.success) {
        toast.success('Study space deleted successfully!')
        router.push('/study-spaces')
      } else {
        toast.error(res.error || 'Failed to delete space')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setIsPending(false)
    }
  }

  // Interaction states
  const [activeTab, setActiveTab] = useState('notes') // 'notes' | 'quizzes' | 'members' | 'settings'
  const [chatTab, setChatTab] = useState('all') // 'all' | 'questions'
  const [chatInput, setChatInput] = useState('')
  const [isQuestionInput, setIsQuestionInput] = useState(false)
  const [scratchpad, setScratchpad] = useState(room.scratchpad_content || '')
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  
  // Quiz launch states
  const [openChallenge, setOpenChallenge] = useState(false)
  const [selectedQuizCode, setSelectedQuizCode] = useState('')

  // Collaboration references
  const isEditingRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const lastSavedContentRef = useRef(room.scratchpad_content || '')

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time Subscriptions using Supabase Browser Client
  useEffect(() => {
    const supabase = createClient()

    // 1. Subscribe to Messages
    const messageChannel = supabase
      .channel('room-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_room_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload: any) => {
          const senderId = payload.new.user_id
          const member = members.find((m: any) => m.user?.auth_id === senderId)
          const username = member?.user?.username || 'Anonymous Student'
          
          const newMsg = {
            id: payload.new.id,
            content: payload.new.content,
            is_question: payload.new.is_question,
            created_at: payload.new.created_at,
            user_id: senderId,
            user: {
              username
            }
          }

          // Avoid duplicates (e.g. if local user inserted it and we already have it in state)
          setMessages((prev: any) => {
            if (prev.some((m: any) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    // 2. Subscribe to Scratchpad updates
    const scratchpadChannel = supabase
      .channel('room-scratchpad')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'study_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload: any) => {
          if (!isEditingRef.current) {
            const newContent = payload.new.scratchpad_content || ''
            setScratchpad(newContent)
            lastSavedContentRef.current = newContent
            setHasUnsavedChanges(false)
          }
        }
      )
      .subscribe()

    // 3. Subscribe to Challenges
    const challengesChannel = supabase
      .channel('room-challenges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_room_challenges',
          filter: `room_id=eq.${roomId}`
        },
        () => {
          // Re-fetch challenges list to get quiz details
          const reloadChallenges = async () => {
            try {
              const freshDetails = await getRoomDetails(roomId)
              setChallenges(freshDetails.challenges)
            } catch (err) {
              console.error('Failed to reload challenges:', err)
            }
          }
          reloadChallenges()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(scratchpadChannel)
      supabase.removeChannel(challengesChannel)
    }
  }, [roomId, members])

  // Save Scratchpad content to database (throttled/low egress)
  const saveScratchpadContent = async (val: string) => {
    if (val === lastSavedContentRef.current) {
      setHasUnsavedChanges(false)
      return
    }
    
    setIsSaving(true)
    try {
      const res = await updateScratchpad(roomId, val)
      if (res.success) {
        lastSavedContentRef.current = val
        setHasUnsavedChanges(false)
      } else {
        toast.error('Failed to auto-save notes.')
      }
    } catch (err) {
      console.error('Failed to sync notes:', err)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Scratchpad Changes: update state locally first without hitting the database on every keypress
  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setScratchpad(val)
    isEditingRef.current = true
    setHasUnsavedChanges(val !== lastSavedContentRef.current)

    // Lock the editor for real-time updates while actively typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      isEditingRef.current = false
    }, 3000)
  }

  // Handle message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const messageContent = chatInput
    const isQuestion = isQuestionInput
    
    setChatInput('')
    setIsQuestionInput(false)

    // Insert locally immediately for optimistic UI
    const optimisticMsg = {
      id: Math.random().toString(),
      content: messageContent,
      is_question: isQuestion,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      user: {
        username: 'You'
      }
    }
    setMessages((prev: any) => [...prev, optimisticMsg])

    const res = await sendRoomMessage(roomId, messageContent, isQuestion)
    if (!res.success) {
      toast.error('Failed to send message.')
    }
  }

  const handleLaunchChallenge = async () => {
    if (!selectedQuizCode) {
      toast.error('Please select a quiz')
      return
    }

    setIsPending(true)
    try {
      const res = await startQuizChallenge(roomId, selectedQuizCode)
      if (res.success) {
        toast.success('Live Quiz Battle started!')
        setOpenChallenge(false)
        setSelectedQuizCode('')
      } else {
        toast.error(res.error || 'Failed to start challenge')
      }
    } catch (err) {
      toast.error('An error occurred while launching challenge.')
    } finally {
      setIsPending(false)
    }
  }

  const handleLeaveRoom = () => {
    if (!confirm('Are you sure you want to leave this study space?')) return

    setIsPending(true)
    const performLeave = async () => {
      try {
        const res = await leaveStudyRoom(roomId)
        if (res.success) {
          toast.success('Left the study space.')
          router.push('/study-spaces')
        } else {
          toast.error(res.error || 'Failed to leave space')
        }
      } catch (err) {
        toast.error('An error occurred while leaving space.')
      } finally {
        setIsPending(false)
      }
    }
    performLeave()
  }

  // Filter Q&A questions
  const displayedMessages = chatTab === 'all' 
    ? messages 
    : messages.filter((m: any) => m.is_question)

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => router.push('/study-spaces')}
            className="border-border hover:bg-muted cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{room.name}</h1>
              <Badge variant="outline" className="text-[9px] py-0 h-4 border-primary/20 bg-primary/5 text-primary">
                Level {room.level_num}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{room.description || 'Collaborative study space.'}</p>
          </div>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/study-spaces/${roomId}/report`)}
            className="border-border hover:bg-muted text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-primary" />
            Space Report
          </Button>
        </div>
      </div>

      {/* Main Study Space Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[70vh]">
        
        {/* LEFT COMPONENT: Live Chat & Q&A Board (lg:col-span-5) */}
        <Card className="lg:col-span-5 bg-card border-border shadow-md flex flex-col justify-between overflow-hidden h-[75vh]">
          <CardHeader className="pb-2 border-b border-border flex flex-row items-center justify-between shrink-0">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary" />
                Live Discussion
              </CardTitle>
              <CardDescription className="text-[10px]">Discuss subjects and clear doubts.</CardDescription>
            </div>
            {/* Chat vs Q&A Toggle Buttons */}
            <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg border border-border">
              <Button 
                variant="ghost" 
                size="xs" 
                onClick={() => setChatTab('all')}
                className={`text-[10px] h-6 px-2 rounded-md ${chatTab === 'all' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground'}`}
              >
                Chat
              </Button>
              <Button 
                variant="ghost" 
                size="xs" 
                onClick={() => setChatTab('questions')}
                className={`text-[10px] h-6 px-2 rounded-md ${chatTab === 'questions' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground'}`}
              >
                Q&A Wall
              </Button>
            </div>
          </CardHeader>
          
          {/* Messages Feed */}
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                <HelpCircle className="w-10 h-10 text-muted-foreground/30 mb-2" />
                <p className="text-xs">
                  {chatTab === 'questions' 
                    ? 'No questions posted on the Q&A wall yet.' 
                    : 'No messages yet. Say hello to get started!'}
                </p>
              </div>
            ) : (
              displayedMessages.map((msg: any) => {
                const isSelf = msg.user_id === currentUserId
                return (
                  <div 
                    key={msg.id} 
                    className={`flex gap-2 items-start max-w-[90%] ${isSelf ? 'flex-row-reverse self-end ml-auto' : 'self-start mr-auto'}`}
                  >
                    {/* User profile image/avatar */}
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0 mt-1" title={msg.user?.username || 'Student'}>
                      {msg.user?.profile_image ? (
                        <img src={msg.user.profile_image} alt={msg.user.username} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {(msg.user?.username || 'S').substring(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-muted-foreground font-semibold px-1 mb-0.5">
                        {msg.user?.username || 'Student'}
                      </span>
                      <div 
                        className={`p-2.5 rounded-xl text-xs border shadow-sm leading-relaxed ${
                          msg.is_question 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
                            : isSelf 
                              ? 'bg-primary text-primary-foreground border-primary/20' 
                              : 'bg-muted/40 border-border text-foreground'
                        }`}
                      >
                        {msg.is_question && (
                          <Badge className="bg-amber-500 text-white font-semibold text-[8px] h-4 py-0 px-1 mb-1 flex items-center gap-0.5 w-fit">
                            <HelpCircle className="w-2.5 h-2.5" />
                            QUESTION
                          </Badge>
                        )}
                        <p>{msg.content}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatBottomRef} />
          </CardContent>
          
          {/* Chat Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-muted/20 shrink-0">
            <div className="flex gap-2 items-center">
              <Input 
                placeholder={isQuestionInput ? "Type your study question..." : "Send a message..."}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="bg-card border-border text-xs flex-1"
                maxLength={400}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="bg-primary text-primary-foreground h-9 w-9 shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <input 
                type="checkbox"
                id="is-question"
                checked={isQuestionInput}
                onChange={e => setIsQuestionInput(e.target.checked)}
                className="rounded border-border text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer bg-card"
              />
              <label htmlFor="is-question" className="text-[10px] text-muted-foreground font-medium cursor-pointer select-none">
                Post as Q&A Question (Highlights in orange)
              </label>
            </div>
          </form>
        </Card>

        {/* CENTER COMPONENT: Collaborative Workspaces (lg:col-span-7) */}
        <Card className="lg:col-span-7 bg-card border-border shadow-md flex flex-col justify-between h-[75vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Workspace
                  </CardTitle>
                  <CardDescription className="text-[10px]">Notes scratchpad, quiz battles, and member moderation.</CardDescription>
                </div>
                <TabsList className="bg-muted/50 border border-border p-0.5 rounded-lg h-8">
                  <TabsTrigger value="notes" className="text-xs h-7 rounded-md data-[state=active]:bg-card">
                    Scratchpad
                  </TabsTrigger>
                  <TabsTrigger value="quizzes" className="text-xs h-7 rounded-md data-[state=active]:bg-card">
                    Quiz Battles
                  </TabsTrigger>
                  <TabsTrigger value="members" className="text-xs h-7 rounded-md data-[state=active]:bg-card">
                    Members ({members.filter((m: any) => m.status === 'approved').length})
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs h-7 rounded-md data-[state=active]:bg-card">
                    Settings
                  </TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-4">
              {/* Tab 1: Live Scratchpad */}
              <TabsContent value="notes" className="h-full mt-0 focus-visible:outline-none flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border shrink-0">
                  <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Collaborative Notes
                  </span>
                  <div className="flex items-center gap-2">
                    {isSaving ? (
                      <span className="text-[9px] text-primary flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                      </span>
                    ) : hasUnsavedChanges ? (
                      <Button 
                        size="xs" 
                        variant="default"
                        onClick={() => saveScratchpadContent(scratchpad)}
                        className="h-6 text-[9px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer"
                      >
                        Save Changes *
                      </Button>
                    ) : (
                      <span className="text-[9px] text-emerald-500 flex items-center gap-0.5 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
                <Textarea 
                  placeholder="Collaborate on summaries, outline lectures, or copy notes here. Click Save or click out to sync changes with group members!"
                  value={scratchpad}
                  onChange={handleScratchpadChange}
                  onBlur={() => saveScratchpadContent(scratchpad)}
                  className="w-full flex-1 border-none focus-visible:ring-0 resize-none bg-muted/10 rounded-xl p-3 text-xs leading-relaxed"
                />
              </TabsContent>
              
              {/* Tab 2: Quiz Battles */}
              <TabsContent value="quizzes" className="h-full mt-0 focus-visible:outline-none flex flex-col justify-between">
                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 border-b border-border shrink-0">
                    <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                      <Swords className="w-4 h-4 text-rose-500 animate-bounce" />
                      Active quiz Challenges
                    </span>
                    
                    {/* Launch Quiz Battle dialog */}
                    <Dialog open={openChallenge} onOpenChange={setOpenChallenge}>
                      <DialogTrigger asChild>
                        <Button size="xs" className="h-6 text-[10px] bg-rose-500 text-white hover:bg-rose-600 font-semibold cursor-pointer">
                          <Plus className="w-3 h-3 mr-1" />
                          Start Challenge
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border shadow-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-bold">Start a Quiz Challenge</DialogTitle>
                          <DialogDescription className="text-xs mt-1 text-muted-foreground">
                            Start a shared quiz challenge. Members will be notified and can solve the quiz together.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Select Quiz</label>
                            <Select value={selectedQuizCode} onValueChange={setSelectedQuizCode}>
                              <SelectTrigger className="bg-muted/30 border-border text-sm">
                                <SelectValue placeholder="Choose a department quiz..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableQuizzes.length === 0 ? (
                                  <SelectItem value="none" disabled>No quizzes available for your level</SelectItem>
                                ) : (
                                  availableQuizzes.map((q: any) => (
                                    <SelectItem key={q.code} value={q.code}>
                                      {q.name} ({q.questions_count} Qs)
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setOpenChallenge(false)}
                            disabled={isPending}
                            className="border-border hover:bg-muted text-sm cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleLaunchChallenge}
                            disabled={isPending}
                            className="bg-rose-500 text-white hover:bg-rose-600 font-semibold text-sm cursor-pointer"
                          >
                            {isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Launching...
                              </>
                            ) : (
                              'Launch Challenge'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {/* Challenges List */}
                  {challenges.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                      <Swords className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs">No active challenges. Start one to compete with your team!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {challenges.map((c: any) => {
                        const quizLink = `/quiz/${c.quiz?.department_slug}/${c.quiz?.subject_id}/${c.quiz_code}`
                        return (
                          <div 
                            key={c.id}
                            className="p-3 bg-muted/20 border border-border rounded-xl flex items-center justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <h4 className="text-xs font-bold text-foreground line-clamp-1">{c.quiz?.name || 'Quiz'}</h4>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                {c.quiz?.questions_count} Qs • Started by {c.starter?.username || 'Student'}
                              </p>
                            </div>
                            <Button 
                              size="xs" 
                              onClick={() => router.push(quizLink)}
                              className="bg-rose-500 text-white hover:bg-rose-600 font-semibold text-[10px] h-7 px-3.5 cursor-pointer shrink-0"
                            >
                              Solve Quiz
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
              {/* Tab 3: Members Tab */}
              <TabsContent value="members" className="flex-1 overflow-y-auto p-4 mt-0 focus-visible:outline-none">
                <div className="space-y-6">
                  {/* Active Members Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Members</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {members.filter((m: any) => m.status === 'approved').map((member: any) => {
                        const user = member.user
                        const isCreator = member.role === 'creator'
                        const isSelf = user?.auth_id === currentUserId
                        if (!user) return null

                        return (
                          <div 
                            key={user.auth_id}
                            onClick={() => {
                              setSelectedProfile(user)
                              setShowProfileModal(true)
                            }}
                            className="p-3 bg-muted/20 border border-border rounded-xl flex items-center gap-3 relative overflow-hidden group hover:border-primary/30 transition-all cursor-pointer animate-notif-modal-enter"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                              {user.profile_image ? (
                                <img src={user.profile_image} alt={user.username} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div className="space-y-0.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                  {user.username}
                                </span>
                                {isCreator && (
                                  <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{user.specialization}</p>
                              <p className="text-[9px] text-indigo-400 font-semibold">Level {user.current_level}</p>
                            </div>

                            {/* KICK BUTTON FOR OWNER */}
                            {isOwner && !isSelf && !isCreator && (
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveMember(user.auth_id)
                                }}
                                className="text-red-500 hover:text-red-650 hover:bg-red-500/10 h-8 w-8 p-0 rounded-md shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ✕
                              </Button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Pending Requests Section for Owner */}
                  {isOwner && members.some((m: any) => m.status === 'pending') && (
                    <div className="space-y-3 pt-4 border-t border-border">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        Pending Approvals
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {members.filter((m: any) => m.status === 'pending').map((member: any) => {
                          const user = member.user
                          if (!user) return null

                          return (
                            <div 
                              key={user.auth_id}
                              onClick={() => {
                                setSelectedProfile(user)
                                setShowProfileModal(true)
                              }}
                              className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl flex flex-col gap-3 relative overflow-hidden group hover:border-yellow-500/40 transition-all cursor-pointer animate-notif-modal-enter"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center overflow-hidden shrink-0">
                                  {user.profile_image ? (
                                    <img src={user.profile_image} alt={user.username} className="w-full h-full object-cover" />
                                  ) : (
                                    <Users className="w-4 h-4 text-yellow-500" />
                                  )}
                                </div>
                                <div className="space-y-0.5 flex-1 min-w-0">
                                  <span className="text-xs font-bold text-foreground line-clamp-1">
                                    {user.username}
                                  </span>
                                  <p className="text-[9px] text-muted-foreground line-clamp-1">{user.specialization}</p>
                                  <p className="text-[9px] text-indigo-400 font-semibold">Level {user.current_level}</p>
                                </div>
                              </div>

                              <div className="flex gap-2 w-full mt-1">
                                <Button
                                  size="xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleApprove(user.auth_id)
                                  }}
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold text-xs h-8 cursor-pointer"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleReject(user.auth_id)
                                  }}
                                  className="flex-1 border-border hover:bg-muted text-red-500 text-xs h-8 cursor-pointer"
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 4: Settings Tab */}
              <TabsContent value="settings" className="flex-1 overflow-y-auto p-4 mt-0 focus-visible:outline-none">
                {isOwner ? (
                  <form onSubmit={handleSaveSettings} className="space-y-4 max-w-md">
                    <div className="space-y-1.5">
                      <label htmlFor="settings-name" className="text-xs font-semibold text-muted-foreground">Space Name</label>
                      <Input 
                        id="settings-name"
                        value={settingsName}
                        onChange={e => setSettingsName(e.target.value)}
                        className="bg-muted/30 border-border text-xs"
                        disabled={isSavingSettings || isPending}
                        maxLength={60}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="settings-desc" className="text-xs font-semibold text-muted-foreground">Description</label>
                      <Textarea 
                        id="settings-desc"
                        value={settingsDesc}
                        onChange={e => setSettingsDesc(e.target.value)}
                        className="bg-muted/30 border-border text-xs min-h-[80px]"
                        disabled={isSavingSettings || isPending}
                        maxLength={180}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label htmlFor="settings-visibility" className="text-xs font-semibold text-muted-foreground">Visibility</label>
                        <select 
                          id="settings-visibility"
                          value={settingsVisibility}
                          onChange={e => setSettingsVisibility(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          disabled={isSavingSettings || isPending}
                        >
                          <option value="public">Public</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="settings-approval" className="text-xs font-semibold text-muted-foreground">Join Setting</label>
                        <select 
                          id="settings-approval"
                          value={settingsJoinApproval}
                          onChange={e => setSettingsJoinApproval(e.target.value)}
                          className="w-full bg-muted/30 border border-border rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                          disabled={isSavingSettings || isPending}
                        >
                          <option value="immediate">Immediate</option>
                          <option value="requires_approval">Needs Approval</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex gap-2">
                        <Button 
                          type="submit"
                          disabled={isSavingSettings || isPending}
                          size="sm"
                          className="bg-primary text-white text-xs font-semibold cursor-pointer"
                        >
                          {isSavingSettings ? 'Saving...' : 'Save Settings'}
                        </Button>
                        <Button 
                          type="button"
                          variant="destructive"
                          onClick={handleDeleteRoom}
                          disabled={isPending}
                          size="sm"
                          className="text-xs font-semibold cursor-pointer"
                        >
                          Delete Study Space
                        </Button>
                      </div>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => setShowLeaveDialog(true)}
                        disabled={isPending}
                        size="sm"
                        className="text-xs font-semibold cursor-pointer border-red-500/20 text-red-405 hover:bg-red-500/10 shrink-0"
                      >
                        Leave Space
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4 max-w-md">
                    <Card className="bg-muted/20 border-border">
                      <CardHeader className="p-4">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Space Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3 text-xs">
                        <div>
                          <span className="text-muted-foreground block font-medium">Name:</span>
                          <span className="font-semibold text-foreground">{room.name}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block font-medium">Description:</span>
                          <span className="text-foreground">{room.description || 'No description provided.'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <span className="text-muted-foreground block font-medium">Visibility:</span>
                            <span className="font-semibold text-foreground uppercase text-[10px]">{room.visibility || 'public'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block font-medium">Join Requirement:</span>
                            <span className="font-semibold text-foreground uppercase text-[10px]">{room.join_approval === 'requires_approval' ? 'Approval Req.' : 'Immediate'}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <div className="pt-2">
                      <Button 
                        type="button"
                        variant="destructive"
                        onClick={() => setShowLeaveDialog(true)}
                        disabled={isPending}
                        size="sm"
                        className="w-full text-xs font-semibold cursor-pointer"
                      >
                        Leave Study Space
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Leave Space Verification Dialog */}
      <Dialog open={showLeaveDialog} onOpenChange={(open) => {
        setShowLeaveDialog(open)
        if (!open) setConfirmLeave(false)
      }}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-500">
              <LogOut className="w-5 h-5" />
              Leave Study Space
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 text-muted-foreground">
              Are you sure you want to leave this study space? You will lose access to the shared scratchpad and chat history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex items-start gap-2.5">
            <input 
              type="checkbox"
              id="confirm-leave-checkbox"
              checked={confirmLeave}
              onChange={e => setConfirmLeave(e.target.checked)}
              className="rounded border-border text-red-500 focus:ring-red-500 h-4 w-4 mt-0.5 cursor-pointer bg-muted/40"
            />
            <label htmlFor="confirm-leave-checkbox" className="text-xs text-foreground font-medium cursor-pointer select-none leading-relaxed">
              I understand that I am leaving "{room.name}" and confirm I want to proceed.
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowLeaveDialog(false)
                setConfirmLeave(false)
              }}
              className="border-border hover:bg-muted text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleLeaveRoom}
              disabled={!confirmLeave || isPending}
              className="text-xs font-semibold cursor-pointer"
            >
              Confirm & Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Profile Inspection Dialog */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-sm">
          {selectedProfile && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center text-center space-y-3 pb-2 border-b border-border">
                  <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
                    {selectedProfile.profile_image ? (
                      <img src={selectedProfile.profile_image} alt={selectedProfile.username} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold">{selectedProfile.username}</DialogTitle>
                    <Badge variant="secondary" className="text-[10px] mt-1 bg-primary/10 text-primary border-primary/20">
                      Student Account
                    </Badge>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-3 py-2 text-xs leading-relaxed">
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground font-medium">Specialization:</span>
                  <span className="font-semibold text-foreground">{selectedProfile.specialization || 'General'}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground font-medium">Academic Level:</span>
                  <span className="font-semibold text-indigo-400">Level {selectedProfile.current_level || 1}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground font-medium">Email Address:</span>
                  <span className="font-semibold text-foreground break-all">{selectedProfile.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-1.5">
                  <span className="text-muted-foreground font-medium">Phone Number:</span>
                  <span className="font-semibold text-foreground">{selectedProfile.phone_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Coins Balance:</span>
                  <span className="font-semibold text-yellow-500">{selectedProfile.coins || 0} Coins</span>
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button 
                  onClick={() => setShowProfileModal(false)}
                  className="w-full bg-muted border-border hover:bg-muted/80 text-foreground cursor-pointer text-xs"
                >
                  Close Profile
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
