'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLenis } from 'lenis/react'
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
  ArrowDown, 
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
  Plus,
  Shield,
  ShieldOff,
  Trash2,
  Tv,
  BrainCircuit,
  VolumeX,
  Volume2,
  FolderOpen,
  Pin,
  Trophy,
  Flame,
  Hourglass,
  Play,
  Pause,
  ExternalLink,
  ChevronRight,
  Settings
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
  deleteStudyRoom,
  toggleMemberRole,
  setFocusStatus,
  updateStudyTime,
  toggleMessageReaction,
  createRoomPoll,
  voteOnPoll,
  togglePinPoll,
  createDailyChallenge,
  updateDailyChallengeProgress,
  createChatQuiz,
  submitQuizAnswer,
  removeRoomResource,
  incrementResourceViews
} from '../actions'
import dynamic from 'next/dynamic'

const PDFViewer = dynamic(() => import('@/components/PDFViewer'), { ssr: false })

const formatMessageTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - d.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    
    if (d.toDateString() === now.toDateString()) {
      return timeStr
    } else if (diffDays <= 1) {
      return `Yesterday, ${timeStr}`
    } else {
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`
    }
  } catch (e) {
    return ''
  }
}

interface StudySpaceClientProps {
  initialDetails: any
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
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [challenges, setChallenges] = useState(initialDetails?.challenges || [])
  const [polls, setPolls] = useState<any[]>(initialDetails?.polls || [])
  const [dailyChallenges, setDailyChallenges] = useState<any[]>(initialDetails?.dailyChallenges || [])
  const [chatQuizzes, setChatQuizzes] = useState<any[]>(initialDetails?.chatQuizzes || [])
  const [resources, setResources] = useState<any[]>(initialDetails?.resources || [])
  const [messageReactions, setMessageReactions] = useState<any[]>(initialDetails?.messageReactions || [])
  const [availableQuizzes] = useState(initialDetails?.availableQuizzes || [])
  const currentUserId = initialDetails?.currentUserId

  const isOwner = room.created_by === currentUserId

  const [settingsName, setSettingsName] = useState(room.name || '')
  const [settingsDesc, setSettingsDesc] = useState(room.description || '')
  const [settingsVisibility, setSettingsVisibility] = useState(room.visibility || 'public')
  const [settingsJoinApproval, setSettingsJoinApproval] = useState(room.join_approval || 'immediate')
  const [settingsOnlyAdminsChat, setSettingsOnlyAdminsChat] = useState(room.only_admins_can_send_messages || false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const [selectedProfile, setSelectedProfile] = useState<any>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Confirmation dialog states
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPromoteDialog, setShowPromoteDialog] = useState(false)
  const [pendingActionUser, setPendingActionUser] = useState<any>(null)
  const [pendingPromoteRole, setPendingPromoteRole] = useState<'admin' | 'member'>('admin')
  const [confirmDeleteText, setConfirmDeleteText] = useState('')

  const currentMember = members.find((m: any) => m.user?.auth_id === currentUserId)
  const isAdmin = currentMember?.role === 'admin'
  const canManage = isOwner || isAdmin

  // --- FOCUS MODE STATES ---
  const [isFocusing, setIsFocusing] = useState(currentMember?.is_focusing || false)
  const [focusTimerDuration, setFocusTimerDuration] = useState<number>(25) // Default 25 min Pomodoro
  const [focusTimerRemaining, setFocusTimerRemaining] = useState<number>(0)
  const [focusTimerInterval, setFocusTimerInterval] = useState<any>(null)

  // --- STUDY TRACKER STATE ---
  const [studySecondsElapsed, setStudySecondsElapsed] = useState<number>(0)
  const lastEgressTimeRef = useRef<number>(Date.now())

  // --- TAB NAVIGATION ---
  const [activeTab, setActiveTab] = useState('notes') // 'notes' | 'quizzes' | 'polls' | 'daily' | 'resources' | 'members' | 'settings'
  const [chatTab, setChatTab] = useState('all') // 'all' | 'questions'
  const [chatInput, setChatInput] = useState('')
  const [isQuestionInput, setIsQuestionInput] = useState(false)

  // --- MENTIONS STATE & HELPERS ---
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)

  const approvedMembers = useMemo(() => {
    return members.filter((m: any) => m.status === 'approved' && m.user)
  }, [members])

  const filteredSuggestions = useMemo(() => {
    const list = [
      {
        user: {
          username: 'all',
          profile_image: null,
          specialization: 'Mention everyone in this space'
        }
      },
      ...approvedMembers
    ]
    if (!suggestionQuery) return list
    return list.filter((m: any) => 
      m.user?.username?.toLowerCase().includes(suggestionQuery.toLowerCase())
    )
  }, [approvedMembers, suggestionQuery])

  const handleMentionClick = (username: string) => {
    const matchedMember = members.find((m: any) => m.user?.username?.toLowerCase() === username.toLowerCase())
    if (matchedMember?.user) {
      setSelectedProfile(matchedMember.user)
      setShowProfileModal(true)
    }
  }

  const renderMessageContent = (content: string) => {
    const mentionRegex = /@([\w.-]+)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      const matchIndex = match.index
      const username = match[1]

      if (matchIndex > lastIndex) {
        parts.push(content.slice(lastIndex, matchIndex))
      }

      if (username.toLowerCase() === 'all') {
        parts.push(
          <span key={matchIndex} className="text-amber-400 font-bold bg-amber-400/10 px-1 py-0.5 rounded">
            @all
          </span>
        )
      } else {
        const matchedMember = members.find((m: any) => m.user?.username?.toLowerCase() === username.toLowerCase())
        if (matchedMember?.user) {
          parts.push(
            <button
              key={matchIndex}
              type="button"
              onClick={() => handleMentionClick(username)}
              className="font-semibold px-1 py-0.5 rounded cursor-pointer transition-colors text-sky-400 hover:text-sky-300 bg-sky-400/10 hover:bg-sky-400/20"
            >
              @{username}
            </button>
          )
        } else {
          parts.push(`@${username}`)
        }
      }

      lastIndex = mentionRegex.lastIndex
    }

    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    return parts.length > 0 ? parts : content
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setChatInput(val)

    const caretPos = e.target.selectionStart || 0
    const textBeforeCaret = val.slice(0, caretPos)
    const lastAtIdx = textBeforeCaret.lastIndexOf('@')

    if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCaret[lastAtIdx - 1] === ' ')) {
      const query = textBeforeCaret.slice(lastAtIdx + 1)
      if (query.includes(' ')) {
        setShowSuggestions(false)
      } else {
        setSuggestionQuery(query)
        setShowSuggestions(true)
        setSelectedSuggestionIndex(0)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (username: string) => {
    const val = chatInput
    const lastAtIdx = val.lastIndexOf('@')
    if (lastAtIdx !== -1) {
      const beforeAt = val.slice(0, lastAtIdx)
      const afterAt = val.slice(lastAtIdx)
      const spaceIdx = afterAt.indexOf(' ')
      const restOfText = spaceIdx !== -1 ? afterAt.slice(spaceIdx) : ''
      const newText = beforeAt + '@' + username + (restOfText || ' ')
      setChatInput(newText)
    }
    setShowSuggestions(false)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => (prev + 1) % filteredSuggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedSuggestionIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const selected = filteredSuggestions[selectedSuggestionIndex]
        selectSuggestion(selected.user.username)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setShowSuggestions(false)
      }
    }
  }

  const [scratchpad, setScratchpad] = useState(room.scratchpad_content || '')
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  
  // --- QUIZ LAUNCH STATES ---
  const [openChallenge, setOpenChallenge] = useState(false)
  const [selectedQuizCode, setSelectedQuizCode] = useState('')

  // --- POLL CREATOR STATES ---
  const [pollQuestion, setPollQuestion] = useState('')
  const [pollOptions, setPollOptions] = useState(['', ''])
  const [pollMultiChoice, setPollMultiChoice] = useState(false)
  const [openPollCreator, setOpenPollCreator] = useState(false)

  // --- DAILY CHALLENGE CREATOR STATES ---
  const [dcTitle, setDcTitle] = useState('')
  const [dcDesc, setDcDesc] = useState('')
  const [dcXp, setDcXp] = useState(100)
  const [openDcCreator, setOpenDcCreator] = useState(false)

  // --- CHAT QUIZ CREATOR STATES ---
  const [quizQuestion, setQuizQuestion] = useState('')
  const [quizOptions, setQuizOptions] = useState(['', '', '', ''])
  const [quizAnswer, setQuizAnswer] = useState('')
  const [quizCountdown, setQuizCountdown] = useState(30)
  const [openQuizCreator, setOpenQuizCreator] = useState(false)

  // --- RESOURCE PREVIEWER STATE ---
  const [previewPdfFile, setPreviewPdfFile] = useState<any>(null)

  const lenis = useLenis()

  const anyModalOpen = !!(
    showProfileModal ||
    showRemoveDialog ||
    showDeleteDialog ||
    showPromoteDialog ||
    showLeaveDialog ||
    openChallenge ||
    openPollCreator ||
    openDcCreator ||
    openQuizCreator ||
    previewPdfFile
  )

  useEffect(() => {
    if (anyModalOpen) {
      if (lenis) lenis.stop()
      document.documentElement.classList.add('lenis-stopped')
    } else {
      if (lenis) lenis.start()
      document.documentElement.classList.remove('lenis-stopped')
    }
    return () => {
      if (lenis) lenis.start()
      document.documentElement.classList.remove('lenis-stopped')
    }
  }, [anyModalOpen, lenis])

  // Collaboration references
  const isEditingRef = useRef(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const lastSavedContentRef = useRef(room.scratchpad_content || '')

  // Sound Synth Helper
  const playSystemSound = (type: 'message' | 'focus-end' | 'success') => {
    if (typeof window === 'undefined') return
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)

      if (type === 'message') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.08)
      } else if (type === 'focus-end') {
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(440, audioCtx.currentTime) // A4
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.4) // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.5)
      } else if (type === 'success') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime) // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1) // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2) // G5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.4)
      }
    } catch (err) {
      console.warn('Audio synthesis failed:', err)
    }
  }

  // Auto-scroll chat inside container to bottom (prevents browser viewport scroll shifts)
  const isFirstScrollRef = useRef(true)
  useEffect(() => {
    const scroll = () => {
      const container = chatContainerRef.current
      if (!container) return
      if (isFirstScrollRef.current) {
        container.scrollTop = container.scrollHeight
        isFirstScrollRef.current = false
      } else {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }
    }

    // Scroll immediately and after a short paint delay to handle DOM rendering correctly
    scroll()
    const timer = setTimeout(scroll, 100)
    return () => clearTimeout(timer)
  }, [messages, chatTab])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    // Show button if user has scrolled up by more than 200px from the bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 200
    setShowScrollButton(!isNearBottom)
  }

  const handleScrollToBottom = () => {
    const container = chatContainerRef.current
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowSuggestions(false)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [])

  // --- STUDY TRACKER STOPWATCH ---
  useEffect(() => {
    const studyTimer = setInterval(() => {
      setStudySecondsElapsed(prev => {
        const nextVal = prev + 1
        // Auto-save/egress study time to database every 3 minutes (180 seconds)
        if (nextVal > 0 && nextVal % 180 === 0) {
          const delta = nextVal - (nextVal - 180)
          updateStudyTime(roomId, delta).then(res => {
            if (res.success) {
              // Soft refresh members data
              getRoomDetails(roomId).then(d => setMembers(d.members))
            }
          })
        }
        return nextVal
      })
    }, 1000)

    // Unmount or window blur: send final study time session delta
    return () => {
      clearInterval(studyTimer)
      const now = Date.now()
      const deltaSec = Math.floor((now - lastEgressTimeRef.current) / 1000)
      if (deltaSec > 5) {
        updateStudyTime(roomId, deltaSec)
      }
    }
  }, [roomId])

  // --- FOCUS MODE POMODORO DECREMENTER ---
  useEffect(() => {
    if (isFocusing && currentMember?.focus_timer_ends_at) {
      const endsAt = new Date(currentMember.focus_timer_ends_at).getTime()
      
      const updateTimer = () => {
        const remaining = Math.max(0, Math.floor((endsAt - Date.now()) / 1000))
        setFocusTimerRemaining(remaining)
        
        if (remaining <= 0) {
          setIsFocusing(false)
          setFocusStatus(roomId, false)
          playSystemSound('focus-end')
          toast.success('Your focus session has finished! Welcome back to normal mode.')
          clearInterval(intervalId)
        }
      }
      
      updateTimer()
      const intervalId = setInterval(updateTimer, 1000)
      return () => clearInterval(intervalId)
    } else {
      setFocusTimerRemaining(0)
    }
  }, [isFocusing, currentMember])

  // --- REAL-TIME SUBSCRIPTIONS ---
  useEffect(() => {
    const supabase = createClient()

    // 1. Messages and Message Reactions Channel
    const messageChannel = supabase
      .channel('room-messages-v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_messages', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const senderId = payload.new.user_id
          const sender = members.find((m: any) => m.user?.auth_id === senderId)
          const username = sender?.user?.username || 'Anonymous Student'
          const profile_image = sender?.user?.profile_image || null

          const newMsg = {
            id: payload.new.id,
            content: payload.new.content,
            is_question: payload.new.is_question,
            created_at: payload.new.created_at,
            user_id: senderId,
            user: { username, profile_image }
          }

          setMessages((prev: any[]) => {
            if (prev.some((m: any) => m.id === newMsg.id)) return prev
            // Remove optimistic messages that match the content
            const filtered = prev.filter((m: any) => {
              if (String(m.id).startsWith('optimistic-') && m.content === newMsg.content && m.user_id === newMsg.user_id) {
                return false
              }
              // Check for temp-quiz message matching the new content
              const tempQuizMatch = String(m.id).startsWith('optimistic-') && m.content.match(/^\[QUIZ:optimistic-quiz-[\w-]+\] (.*)/)
              const newQuizMatch = newMsg.content.match(/^\[QUIZ:([\w-]+)\] (.*)/)
              if (tempQuizMatch && newQuizMatch && tempQuizMatch[1] === newQuizMatch[1]) {
                return false
              }
              return true
            })
            // Play sound if not focusing
            if (!isFocusing && senderId !== currentUserId) {
              playSystemSound('message')
            }
            return [...filtered, newMsg]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_message_reactions' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newReaction = payload.new
            setMessageReactions((prev: any[]) => {
              if (prev.some(r => r.message_id === newReaction.message_id && r.user_id === newReaction.user_id && r.emoji === newReaction.emoji)) return prev
              return [...prev, newReaction]
            })
          } else if (payload.eventType === 'DELETE') {
            const oldReaction = payload.old
            setMessageReactions((prev: any[]) => {
              return prev.filter(r => !(r.message_id === oldReaction.message_id && r.user_id === oldReaction.user_id && r.emoji === oldReaction.emoji))
            })
          }
        }
      )
      .subscribe()

    // 2. Scratchpad update channel
    const scratchpadChannel = supabase
      .channel('room-scratchpad-v2')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'study_rooms', filter: `id=eq.${roomId}` },
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

    // 3. Member changes (focus, streaks, time tracking)
    const membersChannel = supabase
      .channel('room-members-v2')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_members', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            setMembers((prev: any[]) => {
              return prev.map(m => {
                if (m.user?.auth_id === updated.user_id) {
                  return {
                    ...m,
                    total_study_time: updated.total_study_time,
                    current_streak: updated.current_streak,
                    longest_streak: updated.longest_streak,
                    last_active_at: updated.last_active_at,
                    last_study_date: updated.last_study_date,
                    weekly_study_time: updated.weekly_study_time,
                    is_focusing: updated.is_focusing,
                    focus_timer_ends_at: updated.focus_timer_ends_at,
                    status: updated.status,
                    role: updated.role
                  }
                }
                return m
              })
            })
          } else {
            // For inserts or deletes, perform a soft reload
            getRoomDetails(roomId).then(d => setMembers(d.members))
          }
        }
      )
      .subscribe()

    // 4. Polls & Votes
    const pollsChannel = supabase
      .channel('room-polls-v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_polls', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const newPoll = {
            ...payload.new,
            votes: []
          }
          setPolls((prev: any[]) => {
            // Filter out optimistic equivalents
            const filtered = prev.filter(p => !(String(p.id).startsWith('optimistic-') && p.question === newPoll.question))
            if (filtered.some(p => p.id === newPoll.id)) return filtered
            return [newPoll, ...filtered]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'study_room_polls', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const updatedPoll = payload.new
          setPolls((prev: any[]) => {
            return prev.map(p => {
              if (p.id === updatedPoll.id) {
                return {
                  ...p,
                  question: updatedPoll.question,
                  options: updatedPoll.options,
                  is_multiple_choice: updatedPoll.is_multiple_choice,
                  is_pinned: updatedPoll.is_pinned
                }
              }
              return p
            })
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'study_room_polls', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const deletedPoll = payload.old
          setPolls((prev: any[]) => prev.filter(p => p.id !== deletedPoll.id))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_poll_votes' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newVote = payload.new
            setPolls((prev: any[]) => {
              return prev.map(p => {
                if (p.id === newVote.poll_id) {
                  const votes = p.votes || []
                  if (votes.some((v: any) => v.user_id === newVote.user_id)) return p
                  return {
                    ...p,
                    votes: [...votes, newVote]
                  }
                }
                return p
              })
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedVote = payload.new
            setPolls((prev: any[]) => {
              return prev.map(p => {
                if (p.id === updatedVote.poll_id) {
                  const votes = p.votes || []
                  return {
                    ...p,
                    votes: votes.map((v: any) => v.user_id === updatedVote.user_id ? updatedVote : v)
                  }
                }
                return p
              })
            })
          } else if (payload.eventType === 'DELETE') {
            const deletedVote = payload.old
            setPolls((prev: any[]) => {
              return prev.map(p => {
                if (p.id === deletedVote.poll_id) {
                  const votes = p.votes || []
                  return {
                    ...p,
                    votes: votes.filter((v: any) => v.user_id !== deletedVote.user_id)
                  }
                }
                return p
              })
            })
          }
        }
      )
      .subscribe()

    // 5. Daily Challenges
    const dcChannel = supabase
      .channel('room-dc-v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_daily_challenges', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const newChallenge = {
            ...payload.new,
            progress: []
          }
          setDailyChallenges((prev: any[]) => {
            const filtered = prev.filter(c => !(String(c.id).startsWith('optimistic-') && c.title === newChallenge.title))
            if (filtered.some(c => c.id === newChallenge.id)) return filtered
            return [newChallenge, ...filtered]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'study_room_daily_challenges', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const deletedChallenge = payload.old
          setDailyChallenges((prev: any[]) => prev.filter(c => c.id !== deletedChallenge.id))
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'study_room_challenge_progress' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newProgress = payload.new
            setDailyChallenges((prev: any[]) => {
              return prev.map(c => {
                if (c.id === newProgress.challenge_id) {
                  const progressList = c.progress || []
                  if (progressList.some((p: any) => p.user_id === newProgress.user_id)) return c
                  return {
                    ...c,
                    progress: [...progressList, newProgress]
                  }
                }
                return c
              })
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedProgress = payload.new
            setDailyChallenges((prev: any[]) => {
              return prev.map(c => {
                if (c.id === updatedProgress.challenge_id) {
                  const progressList = c.progress || []
                  return {
                    ...c,
                    progress: progressList.map((p: any) => p.user_id === updatedProgress.user_id ? updatedProgress : p)
                  }
                }
                return c
              })
            })
          }
        }
      )
      .subscribe()

    // 6. Quizzes
    const quizzesChannel = supabase
      .channel('room-quizzes-v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_quizzes', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const newQuiz = {
            ...payload.new,
            answers: []
          }
          setChatQuizzes((prev: any[]) => {
            const filtered = prev.filter(q => !String(q.id).startsWith('optimistic-'))
            if (filtered.some((q: any) => q.id === newQuiz.id)) return filtered
            return [newQuiz, ...filtered]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_quiz_answers' },
        (payload: any) => {
          const newAnswer = payload.new
          setChatQuizzes((prev: any[]) => {
            return prev.map((q: any) => {
              if (q.id === newAnswer.quiz_id) {
                const existingAnswers = q.answers || []
                if (existingAnswers.some((a: any) => a.user_id === newAnswer.user_id)) return q
                return {
                  ...q,
                  answers: [...existingAnswers, newAnswer]
                }
              }
              return q
            })
          })
        }
      )
      .subscribe()

    // 7. Resources
    const resourcesChannel = supabase
      .channel('room-resources-v2')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_room_resources', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const newResource = payload.new
          setResources((prev: any[]) => {
            if (prev.some(r => r.id === newResource.id)) return prev
            return [newResource, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'study_room_resources', filter: `room_id=eq.${roomId}` },
        (payload: any) => {
          const deletedResource = payload.old
          setResources((prev: any[]) => prev.filter(r => r.id !== deletedResource.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messageChannel)
      supabase.removeChannel(scratchpadChannel)
      supabase.removeChannel(membersChannel)
      supabase.removeChannel(pollsChannel)
      supabase.removeChannel(dcChannel)
      supabase.removeChannel(quizzesChannel)
      supabase.removeChannel(resourcesChannel)
    }
  }, [roomId, members, isFocusing])

  // --- ACTIONS HANDLERS ---
  
  const handleApprove = async (userId: string) => {
    try {
      const res = await approveMember(roomId, userId)
      if (res.success) {
        toast.success('Member approved successfully!')
        setMembers((prev: any[]) => prev.map((m: any) => m.user?.auth_id === userId ? { ...m, status: 'approved' } : m))
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
        setMembers((prev: any[]) => prev.filter((m: any) => m.user?.auth_id !== userId))
      } else {
        toast.error(res.error || 'Failed to reject request')
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  const handleRemoveMember = async (userId: string) => {
    setIsPending(true)
    try {
      const res = await removeMember(roomId, userId)
      if (res.success) {
        toast.success('Member removed successfully.')
        setMembers((prev: any[]) => prev.filter((m: any) => m.user?.auth_id !== userId))
      } else {
        toast.error(res.error || 'Failed to remove member')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setIsPending(false)
      setShowRemoveDialog(false)
      setPendingActionUser(null)
    }
  }

  const handleToggleRole = async (userId: string, newRole: 'admin' | 'member') => {
    setIsPending(true)
    try {
      const res = await toggleMemberRole(roomId, userId, newRole)
      if (res.success) {
        toast.success(newRole === 'admin' ? 'Member promoted to Admin!' : 'Admin demoted to Member.')
        setMembers((prev: any[]) => prev.map((m: any) => m.user?.auth_id === userId ? { ...m, role: newRole } : m))
      } else {
        toast.error(res.error || 'Failed to update role')
      }
    } catch (err) {
      toast.error('An error occurred.')
    } finally {
      setIsPending(false)
      setShowPromoteDialog(false)
      setPendingActionUser(null)
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
        settingsJoinApproval,
        settingsOnlyAdminsChat
      )
      if (res.success) {
        toast.success('Space settings updated successfully!')
        setRoom((prev: any) => ({
          ...prev,
          name: settingsName,
          description: settingsDesc,
          visibility: settingsVisibility,
          join_approval: settingsJoinApproval,
          only_admins_can_send_messages: settingsOnlyAdminsChat
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
      setShowDeleteDialog(false)
      setConfirmDeleteText('')
    }
  }

  // --- SAVE SCRATCHPAD CONTENT ---
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

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setScratchpad(val)
    isEditingRef.current = true
    setHasUnsavedChanges(val !== lastSavedContentRef.current)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      isEditingRef.current = false
    }, 3000)
  }

  // --- CHAT MESSAGE HANDLING ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const messageContent = chatInput
    const isQuestion = isQuestionInput
    
    setShowSuggestions(false)
    setChatInput('')
    setIsQuestionInput(false)

    // Optimistic insert
    const optimisticMsgId = 'optimistic-' + Math.random().toString()
    const optimisticMsg = {
      id: optimisticMsgId,
      content: messageContent,
      is_question: isQuestion,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      user: {
        username: currentMember?.user?.username || 'You',
        profile_image: currentMember?.user?.profile_image || null
      }
    }
    setMessages((prev: any) => [...prev, optimisticMsg])

    const res = await sendRoomMessage(roomId, messageContent, isQuestion)
    if (!res.success) {
      toast.error('Failed to send message.')
      setMessages((prev: any[]) => prev.filter(m => m.id !== optimisticMsgId))
    }
  }

  // --- CHAT REACTION HANDLERS ---
  const handleMessageReaction = async (messageId: string, emoji: string) => {
    // Optimistic reaction toggle
    const existing = messageReactions.find(r => r.message_id === messageId && r.user_id === currentUserId && r.emoji === emoji)
    if (existing) {
      setMessageReactions((prev: any[]) => prev.filter(r => !(r.message_id === messageId && r.user_id === currentUserId && r.emoji === emoji)))
    } else {
      const tempReaction = { message_id: messageId, user_id: currentUserId, emoji }
      setMessageReactions((prev: any[]) => [...prev, tempReaction])
    }

    const res = await toggleMessageReaction(messageId, emoji)
    if (!res.success) {
      toast.error('Failed to update reaction.')
      // Revert optimistic changes
      if (existing) {
        setMessageReactions((prev: any[]) => [...prev, existing])
      } else {
        setMessageReactions((prev: any[]) => prev.filter(r => !(r.message_id === messageId && r.user_id === currentUserId && r.emoji === emoji)))
      }
    }
  }

  // --- FOCUS MODE TOGGLE ---
  const handleToggleFocusMode = async () => {
    const nextFocusState = !isFocusing
    const res = await setFocusStatus(roomId, nextFocusState, nextFocusState ? focusTimerDuration : undefined)
    if (res.success) {
      setIsFocusing(nextFocusState)
      toast.success(nextFocusState ? `Focus Mode activated! Timer set for ${focusTimerDuration}m.` : 'Focus Mode deactivated.')
      playSystemSound('success')
    } else {
      toast.error(res.error || 'Failed to update focus status')
    }
  }

  // --- POLL CREATOR ---
  const handleCreatePoll = async () => {
    if (!pollQuestion.trim()) {
      toast.error('Poll question is required')
      return
    }
    const validOptions = pollOptions.filter(o => o.trim() !== '')
    if (validOptions.length < 2) {
      toast.error('Please specify at least 2 choices')
      return
    }

    const questionText = pollQuestion
    const optionsText = validOptions
    const isMulti = pollMultiChoice

    setPollQuestion('')
    setPollOptions(['', ''])
    setPollMultiChoice(false)
    setOpenPollCreator(false)

    // Optimistic insert
    const tempPollId = 'optimistic-poll-' + Math.random().toString()
    const optimisticPoll = {
      id: tempPollId,
      room_id: roomId,
      question: questionText,
      options: optionsText,
      is_multiple_choice: isMulti,
      is_pinned: false,
      created_by: currentUserId,
      created_at: new Date().toISOString(),
      votes: []
    }
    setPolls((prev: any[]) => [optimisticPoll, ...prev])

    const res = await createRoomPoll(roomId, questionText, optionsText, isMulti)
    if (!res.success) {
      toast.error(res.error || 'Failed to create poll')
      setPolls((prev: any[]) => prev.filter(p => p.id !== tempPollId))
    }
  }

  const handleVoteOnPoll = async (pollId: string, optionIndex: number) => {
    const poll = polls.find(p => p.id === pollId)
    if (!poll) return

    const myVoteRow = poll.votes?.find((v: any) => v.user_id === currentUserId)
    let selected: number[] = []

    if (poll.is_multiple_choice) {
      const prev = myVoteRow?.selected_options || []
      if (prev.includes(optionIndex)) {
        selected = prev.filter((o: number) => o !== optionIndex)
      } else {
        selected = [...prev, optionIndex]
      }
    } else {
      selected = [optionIndex]
    }

    // Optimistically update poll votes
    setPolls((prev: any[]) => {
      return prev.map(p => {
        if (p.id === pollId) {
          const votes = p.votes || []
          const existingVote = votes.find((v: any) => v.user_id === currentUserId)
          let nextVotes
          if (existingVote) {
            nextVotes = votes.map((v: any) => v.user_id === currentUserId ? { ...v, selected_options: selected } : v)
          } else {
            nextVotes = [...votes, { poll_id: pollId, user_id: currentUserId, selected_options: selected }]
          }
          return {
            ...p,
            votes: nextVotes
          }
        }
        return p
      })
    })

    const res = await voteOnPoll(pollId, selected)
    if (!res.success) {
      toast.error(res.error || 'Failed to submit vote')
      // Restore previous votes from backend
      getRoomDetails(roomId).then(d => setPolls(d.polls))
    }
  }

  const handleTogglePinPoll = async (pollId: string, isPinned: boolean) => {
    // Optimistically toggle pin
    setPolls((prev: any[]) => {
      return prev.map(p => {
        if (p.id === pollId) {
          return { ...p, is_pinned: !isPinned }
        }
        return p
      })
    })

    const res = await togglePinPoll(pollId, !isPinned)
    if (res.success) {
      toast.success(!isPinned ? 'Poll pinned to top!' : 'Poll unpinned.')
    } else {
      toast.error(res.error || 'Failed to toggle pin')
      // Revert pin
      setPolls((prev: any[]) => {
        return prev.map(p => {
          if (p.id === pollId) {
            return { ...p, is_pinned: isPinned }
          }
          return p
        })
      })
    }
  }

  // --- DAILY CHALLENGE PROGRESS ---
  const handleCreateDailyChallenge = async () => {
    if (!dcTitle.trim()) {
      toast.error('Challenge title is required')
      return
    }

    const titleText = dcTitle
    const descText = dcDesc
    const xpVal = dcXp

    setDcTitle('')
    setDcDesc('')
    setDcXp(100)
    setOpenDcCreator(false)

    // Optimistic insert
    const tempChallengeId = 'optimistic-challenge-' + Math.random().toString()
    const optimisticChallenge = {
      id: tempChallengeId,
      room_id: roomId,
      title: titleText,
      description: descText,
      xp_reward: xpVal,
      challenge_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      progress: []
    }
    setDailyChallenges((prev: any[]) => [optimisticChallenge, ...prev])

    const res = await createDailyChallenge(roomId, titleText, descText, xpVal)
    if (!res.success) {
      toast.error(res.error || 'Failed to create challenge')
      setDailyChallenges((prev: any[]) => prev.filter(c => c.id !== tempChallengeId))
    }
  }

  const handleProgressSliderChange = async (challengeId: string, progressVal: number) => {
    // Optimistic progress slider update
    setDailyChallenges((prev: any[]) => {
      return prev.map(c => {
        if (c.id === challengeId) {
          const progressList = c.progress || []
          const myProg = progressList.find((p: any) => p.user_id === currentUserId)
          let nextProgList
          if (myProg) {
            nextProgList = progressList.map((p: any) => p.user_id === currentUserId ? { ...p, progress: progressVal, is_completed: progressVal >= 100 } : p)
          } else {
            nextProgList = [...progressList, { challenge_id: challengeId, user_id: currentUserId, progress: progressVal, is_completed: progressVal >= 100 }]
          }
          return { ...c, progress: nextProgList }
        }
        return c
      })
    })

    const res = await updateDailyChallengeProgress(challengeId, progressVal)
    if (res.success) {
      if (progressVal >= 100) {
        toast.success('Challenge completed! Coins awarded!')
        playSystemSound('success')
      }
    } else {
      toast.error(res.error || 'Failed to update progress')
      getRoomDetails(roomId).then(d => setDailyChallenges(d.dailyChallenges))
    }
  }

  // --- CHAT QUIZ SUBMISSION ---
  const handleCreateChatQuiz = async () => {
    if (!quizQuestion.trim() || !quizAnswer.trim()) {
      toast.error('Question and correct answer are required')
      return
    }
    const validOptions = quizOptions.filter(o => o.trim() !== '')
    if (validOptions.length < 2) {
      toast.error('Please specify at least 2 choices')
      return
    }

    const questionText = quizQuestion
    const optionsText = validOptions
    const answerText = quizAnswer

    setQuizQuestion('')
    setQuizOptions(['', '', '', ''])
    setQuizAnswer('')
    setOpenQuizCreator(false)

    // Optimistic insert quiz and matching reference message
    const tempQuizId = 'optimistic-quiz-' + Math.random().toString()
    const tempMsgId = 'optimistic-msg-' + Math.random().toString()

    const optimisticQuiz = {
      id: tempQuizId,
      room_id: roomId,
      created_by: currentUserId,
      question: questionText,
      options: optionsText,
      correct_answer: answerText,
      countdown_seconds: null,
      ends_at: null,
      answers: []
    }
    setChatQuizzes((prev: any[]) => [optimisticQuiz, ...prev])

    const optimisticMsg = {
      id: tempMsgId,
      content: `[QUIZ:${tempQuizId}] ${questionText}`,
      is_question: false,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      user: {
        username: currentMember?.user?.username || 'You',
        profile_image: currentMember?.user?.profile_image || null
      }
    }
    setMessages((prev: any) => [...prev, optimisticMsg])

    const res = await createChatQuiz(roomId, questionText, optionsText, answerText)
    if (!res.success) {
      toast.error(res.error || 'Failed to create quiz')
      setChatQuizzes((prev: any[]) => prev.filter(q => q.id !== tempQuizId))
      setMessages((prev: any[]) => prev.filter(m => m.id !== tempMsgId))
    }
  }

  const handleSubmitQuizAnswer = async (quizId: string, choiceText: string) => {
    // Optimistic answer
    setChatQuizzes((prev: any[]) => {
      return prev.map(q => {
        if (q.id === quizId) {
          const answers = q.answers || []
          if (answers.some((a: any) => a.user_id === currentUserId)) return q
          const optimisticAnswer = {
            quiz_id: quizId,
            user_id: currentUserId,
            answer: choiceText,
            is_correct: choiceText === q.correct_answer,
            score: choiceText === q.correct_answer ? 10 : 0,
            submitted_at: new Date().toISOString()
          }
          return {
            ...q,
            answers: [...answers, optimisticAnswer]
          }
        }
        return q
      })
    })

    const q = chatQuizzes.find(x => x.id === quizId)
    const isCorrect = q ? choiceText === q.correct_answer : false
    if (isCorrect) {
      toast.success('Correct! +10 Coins added!')
      playSystemSound('success')
    } else {
      toast.error('Incorrect answer! Keep studying!')
    }

    const res = await submitQuizAnswer(quizId, choiceText)
    if (!res.success) {
      toast.error(res.error || 'Failed to submit answer')
      // Revert optimistic answer
      setChatQuizzes((prev: any[]) => {
        return prev.map(q => {
          if (q.id === quizId) {
            const answers = q.answers || []
            return {
              ...q,
              answers: answers.filter((a: any) => a.user_id !== currentUserId)
            }
          }
          return q
        })
      })
    }
  }

  // --- LEAVE SPACE ---
  const performLeave = async () => {
    setIsPending(true)
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
      setShowLeaveDialog(false)
      setConfirmLeave(false)
    }
  }

  // --- QUIZ CHALLENGE BATTLE ---
  const handleLaunchChallenge = async () => {
    if (availableQuizzes.length === 0) {
      toast.error('No quizzes are available for this space right now.')
      return
    }
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

  // --- RESOURCE REMOVING ---
  const handleRemoveResource = async (resourceId: string) => {
    const res = await removeRoomResource(roomId, resourceId)
    if (res.success) {
      toast.success('Resource detached successfully.')
    } else {
      toast.error(res.error || 'Failed to detach resource')
    }
  }

  // --- LEADERBOARD COMPUTATION ---
  const leaderboardMembers = useMemo(() => {
    return [...members]
      .filter((m: any) => m.status === 'approved')
      .sort((a, b) => (b.total_study_time || 0) - (a.total_study_time || 0))
  }, [members])

  // --- MESSAGES FILTERING ---
  const displayedMessages = chatTab === 'all' 
    ? messages 
    : messages.filter((m: any) => m.is_question)

  // --- PREVENT EXPIRING CHAT QUIZZES COUNTDOWN RENDER ---
  const isQuizExpired = (quiz: any) => {
    return false
  }

  if (!mounted) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="space-y-6">
      
      {/* 1. Header with Stats & Focus Mode */}
      <div className="ss-mesh-hero relative overflow-hidden rounded-3xl border border-border/70 p-5 sm:p-6 bg-gradient-to-br from-primary/5 via-secondary/5 to-card backdrop-blur-md">
        <div className="absolute -top-20 right-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push('/study-spaces')}
              className="border-border/80 hover:bg-muted cursor-pointer shrink-0 h-9 w-9 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">{room.name}</h1>
                <Badge variant="outline" className="text-[10px] py-0 h-5 border-primary/20 bg-primary/5 text-primary font-bold">
                  Level {room.level_num}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-medium">{room.description || 'Collaborative study space.'}</p>
            </div>
          </div>
          
          {/* Active study tracker / streaks */}
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Streak Indicator */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-2xl shadow-sm">
              <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold leading-tight">MY STREAK</span>
                <span className="text-xs font-black text-amber-500">{currentMember?.current_streak || 0} Days</span>
              </div>
            </div>

            {/* Focus Session Stopwatch */}
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-2xl shadow-sm">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-[10px] text-muted-foreground block font-bold leading-tight">ACTIVE SESSION</span>
                <span className="text-xs font-black text-indigo-400">
                  {Math.floor(studySecondsElapsed / 60)}m {studySecondsElapsed % 60}s
                </span>
              </div>
            </div>

            {/* Focus Mode Trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className={`cursor-pointer rounded-2xl h-10 px-4 text-xs font-bold transition-all shadow-lg flex items-center gap-2 ${
                    isFocusing 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                      : 'bg-primary hover:bg-primary/95 text-primary-foreground shadow-primary/20'
                  }`}
                >
                  <BrainCircuit className="w-4 h-4" />
                  {isFocusing ? 'Stop Focusing' : 'Focus Mode'}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border shadow-2xl max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-primary" />
                    Focus Mode Config
                  </DialogTitle>
                  <DialogDescription className="text-xs mt-1 text-muted-foreground">
                    Activate Focus Mode to filter notifications, hide chat bubbles, and concentrate on your tasks.
                  </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3">
                  <label className="text-xs font-bold text-muted-foreground">Pomodoro Timer (Minutes)</label>
                  <Select 
                    value={String(focusTimerDuration)} 
                    onValueChange={(val) => setFocusTimerDuration(Number(val))}
                    disabled={isFocusing}
                  >
                    <SelectTrigger className="bg-muted/30 border-border">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 Minutes</SelectItem>
                      <SelectItem value="25">25 Minutes (Recommended)</SelectItem>
                      <SelectItem value="50">50 Minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleToggleFocusMode}
                    className="w-full bg-primary text-white hover:bg-primary/90 text-xs font-semibold cursor-pointer"
                  >
                    {isFocusing ? 'Deactivate Focus Mode' : 'Start Focus Ticker'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/study-spaces/${roomId}/report`)}
              className="border-border hover:bg-primary hover:text-white text-xs h-10 px-4 rounded-2xl cursor-pointer flex items-center gap-1.5 "
            >
              <Award className="w-4 h-4 text-primary" />
              Report
            </Button>
          </div>
        </div>

        {/* Focus Active bar */}
        {isFocusing && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between gap-4 animate-pulse">
            <span className="text-xs font-bold text-rose-500 flex items-center gap-2">
              <VolumeX className="w-4 h-4" />
              Focus Mode Active (Chat notification sounds muffled)
            </span>
            {focusTimerRemaining > 0 && (
              <span className="text-xs font-black text-rose-500">
                Remaining: {Math.floor(focusTimerRemaining / 60)}:
                {String(focusTimerRemaining % 60).padStart(2, '0')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 2. Main content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 sm:gap-6">
        
        {/* Left Column: Live Discussion */}
        <Card className="xl:col-span-5 bg-card/40 border-border/60 backdrop-blur-md rounded-3xl flex flex-col justify-between overflow-hidden h-[500px] sm:h-[600px] xl:h-[75vh] max-h-[500px] sm:max-h-[600px] xl:max-h-[75vh]">
          <CardHeader className="pb-2 border-b border-border flex flex-row items-center justify-between shrink-0">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-primary" />
                Live Discussion
              </CardTitle>
              <CardDescription className="text-[10px]">Discuss subjects and clear doubts.</CardDescription>
            </div>
            
            <div className="flex gap-1 bg-muted/50 p-0.5 rounded-lg border border-border">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setChatTab('all')}
                className={`text-[10px] h-6 px-2.5 rounded-md cursor-pointer ${chatTab === 'all' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground'}`}
              >
                Chat
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setChatTab('questions')}
                className={`text-[10px] h-6 px-2.5 rounded-md cursor-pointer ${chatTab === 'questions' ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground'}`}
              >
                Q&A
              </Button>
            </div>
          </CardHeader>
          
          <div className="flex-1 relative min-h-0">
            <CardContent 
              ref={chatContainerRef} 
              onScroll={handleScroll}
              className="h-full overflow-y-auto ss-chat-scrollbar p-3 sm:p-4 space-y-3" 
              data-lenis-prevent
            >

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
                  const msgReactions = messageReactions.filter(r => r.message_id === msg.id)
                  
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-2 items-start w-full ${isSelf ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0 mt-1 cursor-pointer" title={msg.user?.username || 'Student'}>
                        {msg.user?.profile_image ? (
                          <img src={msg.user.profile_image} alt={msg.user.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {(msg.user?.username || 'S').substring(0, 1).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                        <div className={`flex items-center gap-1.5 mb-0.5 ${isSelf ? 'flex-row-reverse' : ''}`}>
                          <span className="text-[9px] text-muted-foreground font-semibold px-1">
                            {msg.user?.username || 'Student'}
                          </span>
                          {msg.created_at && (
                            <span className="text-[8px] text-muted-foreground/60 font-medium">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          )}
                        </div>
                        
                        <div 
                          className={`p-2.5 rounded-2xl text-xs border shadow-sm leading-relaxed relative group break-words max-w-[72vw] sm:max-w-[260px] ${
                            msg.content.startsWith('[QUIZ:')
                              ? 'bg-indigo-500/5 border-indigo-500/20 text-foreground w-[72vw] sm:w-[340px] max-w-[72vw] sm:max-w-[340px]'
                              : msg.is_question 
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200' 
                                : isSelf 
                                  ? 'bg-primary text-primary-foreground border-primary/20' 
                                  : 'bg-muted/40 border-border text-foreground'
                          }`}
                        >
                          {(() => {
                            const quizMatch = msg.content.match(/^\[QUIZ:([\w-]+)\] (.*)/)
                            if (quizMatch) {
                              const quizId = quizMatch[1]
                              const q = chatQuizzes.find((x: any) => x.id === quizId)
                              if (!q) {
                                return (
                                  <div className="p-1 flex items-center gap-2 text-indigo-400">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span className="text-[10px] font-semibold">Loading Quiz Battle...</span>
                                  </div>
                                )
                              }
                              
                              const myAnswer = q.answers?.find((a: any) => a.user_id === currentUserId)
                              const isExpired = isQuizExpired(q)
                              
                              return (
                                <div className="space-y-2 min-w-[200px] sm:min-w-[280px]">
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-[9px] font-black text-indigo-400 flex items-center gap-1">
                                      <BrainCircuit className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                                      QUIZ BATTLE
                                    </span>
                                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${isExpired ? 'bg-muted text-muted-foreground' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                      {isExpired ? 'Expired' : 'Active'}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-bold text-foreground leading-relaxed">{q.question}</h4>
                                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                                    {q.options.map((opt: string, idx: number) => {
                                      const isCorrectChoice = opt === q.correct_answer
                                      const hasVotedThis = myAnswer?.answer === opt
                                      return (
                                        <Button
                                          key={idx}
                                          size="sm"
                                          variant={hasVotedThis ? (isCorrectChoice ? 'default' : 'destructive') : 'outline'}
                                          disabled={!!myAnswer || isExpired}
                                          onClick={() => handleSubmitQuizAnswer(q.id, opt)}
                                          className="h-7 text-[9px] font-semibold text-left justify-start px-2.5 rounded-lg cursor-pointer"
                                        >
                                          {opt}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            }
                            
                            return (
                              <>
                                {msg.is_question && (
                                  <Badge className="bg-amber-500 text-white font-semibold text-[8px] h-4 py-0 px-1 mb-1.5 flex items-center gap-0.5 w-fit">
                                    <HelpCircle className="w-2.5 h-2.5" />
                                    QUESTION
                                  </Badge>
                                )}
                                <p className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</p>
                              </>
                            )
                          })()}

                          {/* Quiet reaction popover */}
                          <div className="absolute top-[-14px] right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-card border border-border/80 px-1.5 py-0.5 rounded-lg shadow-md">
                            {['👍', '❤️', '🔥', '🚀', '🎉', '🦎', '👎'].map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleMessageReaction(msg.id, emoji)}
                                className="hover:scale-125 transition-transform text-xs cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Displayed reactions */}
                        {msgReactions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {Array.from(new Set(msgReactions.map(r => r.emoji))).map(emoji => {
                              const count = msgReactions.filter(r => r.emoji === emoji).length
                              const reactedByMe = msgReactions.some(r => r.emoji === emoji && r.user_id === currentUserId)
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleMessageReaction(msg.id, emoji)}
                                  className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                                    reactedByMe 
                                      ? 'bg-primary/10 border-primary text-primary' 
                                      : 'bg-muted/30 border-border text-muted-foreground'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}

            </CardContent>

            <AnimatePresence>
              {showScrollButton && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute bottom-4 right-4 z-40"
                >
                  <Button
                    type="button"
                    onClick={handleScrollToBottom}
                    size="icon"
                    className="rounded-full w-9 h-9 bg-primary/95 text-primary-foreground hover:bg-primary shadow-lg border border-border cursor-pointer transition-colors"
                    aria-label="Scroll to bottom"
                  >
                    <ArrowDown className="w-5 h-5" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border bg-muted/20 shrink-0">
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                {showSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute bottom-full mb-2 left-0 w-full max-h-48 overflow-y-auto bg-card/95 border border-border/80 rounded-2xl shadow-2xl z-50 p-1.5 backdrop-blur-md" data-lenis-prevent>
                    <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider border-b border-border/40">
                      Mention Space Members
                    </div>
                    {filteredSuggestions.map((suggestion: any, index: number) => {
                      const isSelected = index === selectedSuggestionIndex
                      const user = suggestion.user
                      return (
                        <div
                          key={user.username}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectSuggestion(user.username);
                          }}
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-primary text-primary-foreground font-bold' 
                              : 'text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                            {user.profile_image ? (
                              <img src={user.profile_image} alt={user.username} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-3 h-3 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-semibold block truncate">
                              @{user.username}
                            </span>
                            {user.specialization && (
                              <span className={`text-[9px] block truncate ${isSelected ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                                {user.specialization}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <Input 
                  placeholder={
                    room.only_admins_can_send_messages && !canManage 
                      ? "Only admins can send messages in this chat..." 
                      : isQuestionInput 
                        ? "Type your study question..." 
                        : "Send a message..."
                  }
                  value={chatInput}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  className="bg-card border-border text-xs w-full rounded-xl h-9 animate-none"
                  maxLength={400}
                  disabled={room.only_admins_can_send_messages && !canManage}
                />
              </div>
              <Button 
                type="submit" 
                size="icon" 
                className="bg-primary text-primary-foreground h-9 w-9 shrink-0 cursor-pointer rounded-xl"
                disabled={room.only_admins_can_send_messages && !canManage}
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <input 
                  type="checkbox"
                  id="is-question"
                  checked={isQuestionInput}
                  onChange={e => setIsQuestionInput(e.target.checked)}
                  className="rounded border-border text-amber-500 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer bg-card"
                  disabled={room.only_admins_can_send_messages && !canManage}
                />
                <label htmlFor="is-question" className="text-[10px] text-muted-foreground font-medium cursor-pointer select-none">
                  Highlight as Q&A Question
                </label>
              </div>

              {/* Inline Quiz battle creator trigger */}
              {canManage && (
                <button
                  type="button"
                  onClick={() => setOpenQuizCreator(true)}
                  className="text-[9px] font-black text-indigo-400 hover:text-indigo-500 transition-colors uppercase cursor-pointer"
                >
                  + Add Quiz Question
                </button>
              )}
            </div>
          </form>
        </Card>

        {/* Right Column: Workspace Tabs */}
        <Card className="xl:col-span-7 bg-card/40 border-border/60 backdrop-blur-md rounded-3xl flex flex-col justify-between min-h-[440px] sm:min-h-[560px] xl:h-[75vh]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
            <CardHeader className="pb-2 border-b border-border shrink-0">
              <div className="flex flex-col gap-3">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary" />
                    Workspace
                  </CardTitle>
                  <CardDescription className="text-[10px]">Notes scratchpad, quiz battles, polls and drive libraries.</CardDescription>
                </div>
                <div className="flex items-start gap-2">
                  {/* 6 tabs in 2 rows of 3 */}
                  <TabsList className="grid grid-cols-3 gap-0.5 bg-muted/50 border border-border p-0.5 rounded-lg h-auto flex-1">
                    <TabsTrigger value="notes" className="text-[10px] h-7 rounded-md data-[state=active]:bg-card px-2 cursor-pointer">
                      Scratchpad
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="text-[10px] h-7 rounded-md data-[state=active]:bg-card px-2 cursor-pointer">
                      Quiz Battles
                    </TabsTrigger>
                    <TabsTrigger value="polls" className="text-[10px] h-7 rounded-md data-[state=active]:bg-card px-2 cursor-pointer">
                      Live Polls {polls.length > 0 && <span className="ml-0.5 opacity-70">({polls.length})</span>}
                    </TabsTrigger>
                    <TabsTrigger value="daily" className="text-[10px] h-7 rounded-md data-[state=active]:bg-card px-2 cursor-pointer">
                      Daily Tasks
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="text-[10px] h-7 rounded-md data-[state=active]:bg-card px-2 cursor-pointer">
                      Resources {resources.length > 0 && <span className="ml-0.5 opacity-70">({resources.length})</span>}
                    </TabsTrigger>
                    <TabsTrigger value="members" className="text-[10px] h-7 rounded-md data-[state=active]:bg-card px-2 cursor-pointer">
                      Leaderboard
                    </TabsTrigger>
                  </TabsList>
                  {/* Settings gear icon */}
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`shrink-0 w-8 h-8 mt-0.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-card border-primary text-primary'
                        : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                    title="Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4" data-lenis-prevent>
              
              {/* Tab 1: Scratchpad */}
              <TabsContent value="notes" className="h-full mt-0 focus-visible:outline-none flex flex-col">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border shrink-0">
                  <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Collaborative Notes
                  </span>
                  <div className="flex items-center gap-2">
                    {!canManage ? (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 font-bold">
                        Read Only
                      </span>
                    ) : isSaving ? (
                      <span className="text-[9px] text-primary flex items-center gap-1 font-bold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Saving...
                      </span>
                    ) : hasUnsavedChanges ? (
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => saveScratchpadContent(scratchpad)}
                        className="h-6 text-[9px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer rounded-lg"
                      >
                        Save Changes *
                      </Button>
                    ) : (
                      <span className="text-[9px] text-emerald-500 flex items-center gap-0.5 font-bold">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                        Saved
                      </span>
                    )}
                  </div>
                </div>
                <Textarea 
                  placeholder={
                    !canManage 
                      ? "Only admins can edit notes in this space." 
                      : "Collaborate on summaries, outline lectures, or copy notes here. Click Save or click out to sync changes with group members!"
                  }
                  value={scratchpad}
                  onChange={handleScratchpadChange}
                  onBlur={() => canManage && saveScratchpadContent(scratchpad)}
                  className="w-full flex-1 border-none focus-visible:ring-0 resize-none bg-muted/15 rounded-2xl p-3.5 text-xs leading-relaxed"
                  readOnly={!canManage}
                />
              </TabsContent>
              
              {/* Tab 2: Quiz Battles */}
              <TabsContent value="quizzes" className="h-full mt-0 focus-visible:outline-none flex flex-col">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                      <Swords className="w-4 h-4 text-rose-500 animate-bounce" />
                      Active Quiz Challenges
                    </span>
                    
                    {canManage && (
                      <Dialog open={openChallenge} onOpenChange={setOpenChallenge}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            disabled={availableQuizzes.length === 0}
                            className="h-6 text-[10px] bg-rose-500 text-white hover:bg-rose-600 font-bold cursor-pointer rounded-lg"
                          >
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
                            className="border-border hover:bg-muted text-sm cursor-pointer"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleLaunchChallenge}
                            disabled={isPending || availableQuizzes.length === 0 || !selectedQuizCode}
                            className="bg-rose-500 text-white hover:bg-rose-600 font-semibold text-sm cursor-pointer"
                          >
                            Launch
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
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
                              <p className="text-[10px] text-muted-foreground">
                                {c.quiz?.questions_count} Qs • Started by {c.starter?.username || 'Student'}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => router.push(quizLink)}
                              className="bg-rose-500 text-white hover:bg-rose-600 font-bold text-[10px] h-7 px-3.5 cursor-pointer rounded-lg shrink-0"
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
              
              {/* Tab 3: Live Polls */}
              <TabsContent value="polls" className="h-full mt-0 focus-visible:outline-none flex flex-col">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground">Live Room Polls</span>
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => setOpenPollCreator(true)}
                        className="h-6 text-[10px] bg-primary text-primary-foreground font-bold cursor-pointer rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        New Poll
                      </Button>
                    )}
                  </div>

                  {polls.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                      <Pin className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs">No active polls. Create one to collect member opinions!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {polls.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)).map((poll: any) => {
                        const totalVotes = poll.votes?.length || 0
                        const myVote = poll.votes?.find((v: any) => v.user_id === currentUserId)
                        
                        return (
                          <div 
                            key={poll.id} 
                            className={`p-4 rounded-2xl border transition-all ${
                              poll.is_pinned 
                                ? 'bg-primary/5 border-primary/30 shadow-sm' 
                                : 'bg-muted/20 border-border/80'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <h4 className="text-xs font-bold text-foreground">{poll.question}</h4>
                              <div className="flex items-center gap-1.5">
                                {canManage && (
                                  <button
                                    onClick={() => handleTogglePinPoll(poll.id, poll.is_pinned)}
                                    className={`p-1 hover:bg-white/10 rounded cursor-pointer ${poll.is_pinned ? 'text-primary' : 'text-muted-foreground'}`}
                                  >
                                    <Pin className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <span className="text-[9px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground">
                                  {totalVotes} Votes
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              {poll.options.map((opt: string, idx: number) => {
                                const optionVotes = poll.votes?.filter((v: any) => v.selected_options?.includes(idx)) || []
                                const pct = totalVotes > 0 ? Math.round((optionVotes.length / totalVotes) * 100) : 0
                                const isSelected = myVote?.selected_options?.includes(idx)

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => handleVoteOnPoll(poll.id, idx)}
                                    className={`relative p-2.5 rounded-xl border flex items-center justify-between overflow-hidden cursor-pointer transition-all hover:bg-white/[0.04] ${
                                      isSelected ? 'border-primary/50' : 'border-border/50 bg-white/[0.01]'
                                    }`}
                                  >
                                    {/* Progress background bar */}
                                    <div
                                      className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all pointer-events-none"
                                      style={{ width: `${pct}%` }}
                                    />
                                    
                                    <span className="text-xs font-semibold relative z-10">{opt}</span>
                                    <span className="text-xs font-black relative z-10 text-primary">{pct}%</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 4: Daily Challenges */}
              <TabsContent value="daily" className="h-full mt-0 focus-visible:outline-none flex flex-col">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground">Space Daily Tasks</span>
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => setOpenDcCreator(true)}
                        className="h-6 text-[10px] bg-primary text-primary-foreground font-bold cursor-pointer rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Daily Task
                      </Button>
                    )}
                  </div>

                  {dailyChallenges.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                      <Trophy className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs">No active daily tasks yet. Define goals to keep members aligned!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dailyChallenges.map((challenge: any) => {
                        const myProgress = challenge.progress?.find((p: any) => p.user_id === currentUserId)
                        const currentProgressVal = myProgress?.progress || 0

                        return (
                          <div key={challenge.id} className="p-4 bg-muted/20 border border-border/80 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <h4 className="text-xs font-black text-foreground">{challenge.title}</h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{challenge.description}</p>
                              </div>
                              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-bold text-[9px]">
                                +{challenge.xp_reward} Coins
                              </Badge>
                            </div>

                            {/* Progress bar and slider */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-muted-foreground font-semibold">Your Progress</span>
                                <span className="font-black text-primary">{currentProgressVal}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={currentProgressVal}
                                onChange={(e) => handleProgressSliderChange(challenge.id, Number(e.target.value))}
                                className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 5: Drive Resources Library */}
              <TabsContent value="resources" className="h-full mt-0 focus-visible:outline-none flex flex-col">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground">Google Drive Attachments</span>
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => router.push('/drive')}
                        className="h-6 text-[10px] bg-primary text-primary-foreground font-bold cursor-pointer rounded-lg"
                      >
                        Browse Chameleon Drive
                      </Button>
                    )}
                  </div>

                  {resources.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-xs">No Drive files attached. Open Chameleon Drive to link PDFs!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resources.map((file: any) => (
                        <div
                          key={file.id}
                          className="p-3 bg-muted/20 border border-border/80 rounded-2xl flex flex-col justify-between gap-3 relative group"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                              <FolderOpen className="w-4 h-4 text-red-500" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-foreground truncate">{file.name}</h4>
                              <p className="text-[9px] text-muted-foreground mt-0.5">
                                {file.size ? `${Math.round(Number(file.size) / 1024)} KB` : 'PDF Document'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                            <Button
                              size="sm"
                              onClick={() => {
                                incrementResourceViews(file.id)
                                setPreviewPdfFile(file)
                              }}
                              className="flex-1 bg-primary text-white hover:bg-primary/95 text-[10px] h-7 rounded-lg cursor-pointer font-bold"
                            >
                              Open Preview
                            </Button>
                            
                            {file.web_view_link && (
                              <a
                                href={file.web_view_link}
                                target="_blank"
                                rel="noreferrer"
                                className="shrink-0 h-7 w-7 rounded-lg border border-border flex items-center justify-center hover:bg-white/5 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                              </a>
                            )}

                            {canManage && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveResource(file.id)}
                                className="text-red-500 hover:bg-red-500/10 shrink-0 h-7 w-7 p-0 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Tab 6: Study Consistency Leaderboard */}
              <TabsContent value="members" className="flex-1 overflow-y-auto p-2 mt-0 focus-visible:outline-none" data-lenis-prevent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      Consistency Leaderboard
                    </span>
                  </div>

                  <div className="space-y-2">
                    {leaderboardMembers.map((member: any, index: number) => {
                      const user = member.user
                      if (!user) return null
                      const totalMins = Math.round((member.total_study_time || 0) / 60)
                      const isTop3 = index < 3

                      return (
                        <div 
                          key={user.auth_id}
                          className="p-3 bg-muted/20 border border-border rounded-xl flex items-center justify-between gap-4 hover:border-primary/20 transition-all cursor-pointer"
                          onClick={() => {
                            setSelectedProfile(user)
                            setShowProfileModal(true)
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                              index === 0 ? 'bg-yellow-500 text-yellow-950' :
                              index === 1 ? 'bg-slate-300 text-slate-900' :
                              index === 2 ? 'bg-amber-600 text-amber-50' : 'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>
                            
                            <div className="w-8 h-8 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                              {user.profile_image ? (
                                <img src={user.profile_image} alt={user.username} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-3.5 h-3.5 text-primary" />
                              )}
                            </div>

                            <div>
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
                                {user.username}
                                {member.role === 'creator' && <Crown className="w-3 h-3 text-yellow-500" />}
                              </h4>
                              <p className="text-[9px] text-muted-foreground">{user.specialization}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-right">
                            <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 rounded-full border border-amber-500/10">
                              <Flame className="w-3.5 h-3.5" />
                              <span>{member.current_streak || 0}d</span>
                            </div>
                            <div>
                              <span className="text-xs font-black text-foreground block">{totalMins}m</span>
                              <span className="text-[9px] text-muted-foreground uppercase block font-bold tracking-wider">STUDIED</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 7: Settings Tab */}
              <TabsContent value="settings" className="flex-1 overflow-y-auto p-2 mt-0 focus-visible:outline-none space-y-5" data-lenis-prevent>
                {canManage ? (
                  <>
                    {/* ── Pending Join Requests ── */}
                    {members.filter((m: any) => m.status === 'pending').length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-border">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-amber-500">
                            Pending Requests ({members.filter((m: any) => m.status === 'pending').length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {members
                            .filter((m: any) => m.status === 'pending')
                            .map((m: any) => (
                              <div key={m.user?.auth_id} className="flex items-center justify-between gap-3 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                                    {m.user?.profile_image
                                      ? <img src={m.user.profile_image} alt={m.user.username} className="w-full h-full object-cover" />
                                      : <span className="text-[10px] font-bold text-muted-foreground">{(m.user?.username || 'S').substring(0, 1).toUpperCase()}</span>
                                    }
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate">{m.user?.username || 'Unknown'}</p>
                                    <p className="text-[9px] text-muted-foreground truncate">{m.user?.specialization || ''}</p>
                                  </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApprove(m.user?.auth_id)}
                                    className="h-7 px-2.5 text-[10px] bg-green-500 hover:bg-green-600 text-white font-bold cursor-pointer"
                                  >
                                    <UserCheck className="w-3 h-3 mr-1" /> Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleReject(m.user?.auth_id)}
                                    className="h-7 px-2.5 text-[10px] font-bold cursor-pointer"
                                  >
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* ── Active Members Management ── */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-border">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-bold text-muted-foreground">
                          Members ({members.filter((m: any) => m.status === 'approved').length})
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {members
                          .filter((m: any) => m.status === 'approved')
                          .map((m: any) => {
                            const isSelf = m.user?.auth_id === currentUserId
                            const isCreator = m.role === 'creator'
                            return (
                              <div key={m.user?.auth_id} className="flex items-center justify-between gap-2 p-2.5 bg-muted/20 border border-border rounded-xl">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-border flex items-center justify-center overflow-hidden shrink-0">
                                    {m.user?.profile_image
                                      ? <img src={m.user.profile_image} alt={m.user.username} className="w-full h-full object-cover" />
                                      : <span className="text-[10px] font-bold text-muted-foreground">{(m.user?.username || 'S').substring(0, 1).toUpperCase()}</span>
                                    }
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                                      {m.user?.username || 'Unknown'}
                                      {isCreator && <Crown className="w-3 h-3 text-yellow-500 shrink-0" />}
                                      {m.role === 'admin' && !isCreator && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
                                    </p>
                                    <p className="text-[9px] text-muted-foreground capitalize">{isCreator ? 'Owner' : m.role}</p>
                                  </div>
                                </div>
                                {!isSelf && !isCreator && (
                                  <div className="flex gap-1.5 shrink-0">
                                    {isOwner && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setPendingActionUser(m)
                                          setPendingPromoteRole(m.role === 'admin' ? 'member' : 'admin')
                                          setShowPromoteDialog(true)
                                        }}
                                        className="h-7 px-2 text-[10px] border-border cursor-pointer hover:bg-primary hover:text-white"
                                      >
                                        {m.role === 'admin' ? <ShieldOff className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => {
                                        setPendingActionUser(m)
                                        setShowRemoveDialog(true)
                                      }}
                                      className="h-7 px-2 text-[10px] cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* ── Space Settings Form ── */}
                    <div className="space-y-3 pt-1 border-t border-border/60">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Space Settings</span>
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

                        <div className="flex items-center space-x-2 pt-2">
                          <input
                            type="checkbox"
                            id="settings-admins-only"
                            checked={settingsOnlyAdminsChat}
                            onChange={e => setSettingsOnlyAdminsChat(e.target.checked)}
                            className="w-4 h-4 rounded border-border text-primary bg-muted/30 focus:ring-primary cursor-pointer"
                            disabled={isSavingSettings || isPending}
                          />
                          <label htmlFor="settings-admins-only" className="text-xs font-semibold text-muted-foreground cursor-pointer select-none">
                            Only admins can send messages in chat
                          </label>
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
                            {isOwner && (
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={isPending}
                                size="sm"
                                className="text-xs font-semibold cursor-pointer"
                              >
                                Delete Study Space
                              </Button>
                            )}
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
                    </div>
                  </>
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
                        <div className="grid grid-cols-3 gap-2 pt-2">
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-medium">Visibility:</span>
                            <span className="font-semibold text-foreground uppercase text-[9px]">{room.visibility || 'public'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-medium">Join setting:</span>
                            <span className="font-semibold text-foreground uppercase text-[9px]">{room.join_approval === 'requires_approval' ? 'Approval Req.' : 'Immediate'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-medium">Chat Restriction:</span>
                            <span className="font-semibold text-foreground uppercase text-[9px]">{room.only_admins_can_send_messages ? 'Admins Only' : 'Everyone'}</span>
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

      {/* --- LIVE POLL CREATOR DIALOG --- */}
      <Dialog open={openPollCreator} onOpenChange={setOpenPollCreator}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Create Room Poll</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Poll Question</label>
              <Input
                placeholder="What do you think about...?"
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                className="bg-muted/30 border-border text-xs"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground block">Options</label>
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={e => {
                      const next = [...pollOptions]
                      next[i] = e.target.value
                      setPollOptions(next)
                    }}
                    className="bg-muted/30 border-border text-xs flex-1"
                  />
                  {pollOptions.length > 2 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}
                      className="text-red-500 px-2 cursor-pointer"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPollOptions([...pollOptions, ''])}
                className="text-[10px] cursor-pointer mt-1"
              >
                + Add Option
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="multi-choice-check"
                checked={pollMultiChoice}
                onChange={e => setPollMultiChoice(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-4 w-4 bg-card"
              />
              <label htmlFor="multi-choice-check" className="text-xs text-muted-foreground font-semibold">
                Multiple Choice (Allow voting for multiple options)
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPollCreator(false)}>Cancel</Button>
            <Button onClick={handleCreatePoll} className="bg-primary text-white hover:bg-primary/90 font-semibold text-xs">Create Poll</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DAILY CHALLENGE CREATOR DIALOG --- */}
      <Dialog open={openDcCreator} onOpenChange={setOpenDcCreator}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Daily Space Task</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Task Title</label>
              <Input
                placeholder="Study 30 Minutes today"
                value={dcTitle}
                onChange={e => setDcTitle(e.target.value)}
                className="bg-muted/30 border-border text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Description</label>
              <Textarea
                placeholder="Log at least 30 mins inside active sessions..."
                value={dcDesc}
                onChange={e => setDcDesc(e.target.value)}
                className="bg-muted/30 border-border text-xs min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDcCreator(false)}>Cancel</Button>
            <Button onClick={handleCreateDailyChallenge} className="bg-primary text-white hover:bg-primary/90 font-semibold text-xs">Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- INLINE CHAT QUIZ CREATOR DIALOG --- */}
      <Dialog open={openQuizCreator} onOpenChange={setOpenQuizCreator}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add Live Chat Quiz</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Quiz Question</label>
              <Input
                placeholder="What is the derivative of x^2?"
                value={quizQuestion}
                onChange={e => setQuizQuestion(e.target.value)}
                className="bg-muted/30 border-border text-xs"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground block">Options</label>
              {quizOptions.map((opt, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input
                    placeholder={`Choice ${i + 1}`}
                    value={opt}
                    onChange={e => {
                      const next = [...quizOptions]
                      next[i] = e.target.value
                      setQuizOptions(next)
                    }}
                    className="bg-muted/30 border-border text-xs flex-1 animate-notif-modal-enter"
                  />
                  <input
                    type="radio"
                    name="correct-choice-radio"
                    checked={quizAnswer !== '' && quizAnswer === opt}
                    onChange={() => setQuizAnswer(opt)}
                    className="h-4 w-4 text-primary focus:ring-primary bg-card"
                    title="Mark as correct answer"
                  />
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenQuizCreator(false)}>Cancel</Button>
            <Button onClick={handleCreateChatQuiz} className="bg-primary text-white hover:bg-primary/90 font-semibold text-xs">Post Quiz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- PDF VIEWER MODAL PREVIEW --- */}
      <Dialog open={!!previewPdfFile} onOpenChange={(open) => {
        if (!open) setPreviewPdfFile(null)
      }}>
        <DialogContent className="max-w-4xl h-[85vh] bg-background/95 backdrop-blur-xl border-border p-4 flex flex-col" data-lenis-prevent>
          <DialogHeader className="shrink-0 pb-2 border-b border-border">
            <DialogTitle className="text-sm font-bold text-foreground">
              PDF Previewer
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden min-h-0 pt-3">
            {previewPdfFile && (
              <PDFViewer
                initialUrl={`/api/google-drive/download?fileId=${previewPdfFile.file_id}&authId=${currentUserId}`}
                fileName={previewPdfFile.name}
                driveFileId={previewPdfFile.file_id}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Preexisting Dialog Modals (Moderation & Confirmations) */}
      
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
              onClick={performLeave}
              disabled={!confirmLeave || isPending}
              className="text-xs font-semibold cursor-pointer"
            >
              {isPending ? 'Leaving...' : 'Confirm & Leave'}
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

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={(open) => {
        setShowRemoveDialog(open)
        if (!open) setPendingActionUser(null)
      }}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-500">
              <Trash2 className="w-5 h-5" />
              Remove Member
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 text-muted-foreground">
              Are you sure you want to remove <span className="font-bold text-foreground">{pendingActionUser?.username}</span> from this study space? They will need to rejoin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRemoveDialog(false)
                setPendingActionUser(null)
              }}
              className="border-border hover:bg-muted text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => pendingActionUser && handleRemoveMember(pendingActionUser.auth_id)}
              disabled={isPending}
              className="text-xs font-semibold cursor-pointer"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Study Space Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open)
        if (!open) setConfirmDeleteText('')
      }}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-red-500">
              <AlertCircle className="w-5 h-5" />
              Delete Study Space
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 text-muted-foreground">
              This action is <span className="font-bold text-red-400">irreversible</span>. All messages, challenges, and members data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <label className="text-xs text-muted-foreground font-medium">
              Type <span className="font-bold text-foreground">DELETE</span> to confirm:
            </label>
            <Input 
              value={confirmDeleteText}
              onChange={e => setConfirmDeleteText(e.target.value)}
              placeholder="Type DELETE"
              className="bg-muted/30 border-border text-xs"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false)
                setConfirmDeleteText('')
              }}
              className="border-border hover:bg-muted text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteRoom}
              disabled={confirmDeleteText !== 'DELETE' || isPending}
              className="text-xs font-semibold cursor-pointer"
            >
              {isPending ? 'Deleting...' : 'Permanently Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote / Demote Confirmation Dialog */}
      <Dialog open={showPromoteDialog} onOpenChange={(open) => {
        setShowPromoteDialog(open)
        if (!open) setPendingActionUser(null)
      }}>
        <DialogContent className="bg-card border-border shadow-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className={`text-lg font-bold flex items-center gap-2 ${pendingPromoteRole === 'admin' ? 'text-blue-400' : 'text-orange-400'}`}>
              {pendingPromoteRole === 'admin' ? <Shield className="w-5 h-5 hover:text-white" /> : <ShieldOff className="w-5 h-5 hover:text-white" />}
              {pendingPromoteRole === 'admin' ? 'Promote to Admin' : 'Demote to Member'}
            </DialogTitle>
            <DialogDescription className="text-xs mt-1 text-muted-foreground">
              {pendingPromoteRole === 'admin' 
                ? <>Are you sure you want to promote <span className="font-bold text-foreground">{pendingActionUser?.username}</span> to Admin? They will be able to manage members and space settings.</>
                : <>Are you sure you want to demote <span className="font-bold text-foreground">{pendingActionUser?.username}</span> back to a regular Member?</>
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPromoteDialog(false)
                setPendingActionUser(null)
              }}
              className="border-border hover:bg-muted text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => pendingActionUser && handleToggleRole(pendingActionUser.auth_id, pendingPromoteRole)}
              disabled={isPending}
              className={`text-xs font-semibold cursor-pointer text-white ${
                pendingPromoteRole === 'admin' 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
