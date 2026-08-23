'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder,
  FolderPlus,
  FolderOpen,
  UploadCloud,
  FileText,
  Heart,
  Coins,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Loader2,
  FileCheck,
  ChevronRight,
  ChevronDown,
  Check,
  Search,
  BookOpen,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Contributor, Summary } from '@/lib/types'
import { ACADEMIC_TRACKS, ALL_SUBJECTS_LIST, TrackDefinition } from '@/lib/course-subjects'
import { toast } from 'sonner'
import {
  createContributorProfile,
  createContributorSubfolderAction,
  deleteContributorSubfolderAction,
  updateSummaryAction,
  deleteSummaryAction
} from '../actions'

interface ContributorDashboardClientProps {
  session: any
  initialContributor: Contributor | null
  initialSummaries: Summary[]
  initialSubfolders: Array<{ id: string; name: string }>
}

export default function ContributorDashboardClient({
  session,
  initialContributor,
  initialSummaries,
  initialSubfolders
}: ContributorDashboardClientProps) {
  const [contributor, setContributor] = useState<Contributor | null>(initialContributor)
  const [summaries, setSummaries] = useState<Summary[]>((initialSummaries || []).filter(Boolean))
  const [subfolders, setSubfolders] = useState<Array<{ id: string; name: string }>>((initialSubfolders || []).filter(Boolean))

  // Folder navigation (null means Root / All folders)
  const [activeSubfolder, setActiveSubfolder] = useState<{ id: string; name: string } | null>(null)

  // Profile setup modal state
  const [profileDisplayName, setProfileDisplayName] = useState(session?.username || '')
  const [profileUsername, setProfileUsername] = useState(
    session?.username ? session.username.toLowerCase().replace(/[^a-z0-9_]/g, '') : ''
  )
  const [profileBio, setProfileBio] = useState('')
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadTrack, setUploadTrack] = useState<'DS' | 'AI' | 'HA' | 'CS' | 'BA' | 'MA'>('DS')
  const [uploadSubjectName, setUploadSubjectName] = useState('Data Structures and Algorithms')
  const [isSubjectMenuOpen, setIsSubjectMenuOpen] = useState(false)
  const [subjectSearchQuery, setSubjectSearchQuery] = useState('')
  const [isCustomSubject, setIsCustomSubject] = useState(false)
  const [uploadFolderId, setUploadFolderId] = useState<string>('root')
  const [isFolderMenuOpen, setIsFolderMenuOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [uploadStatusText, setUploadStatusText] = useState<string>('')

  // Subfolder modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // Edit summary state
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubjectName, setEditSubjectName] = useState('')
  const [editStatus, setEditStatus] = useState<'published' | 'draft' | 'archived'>('published')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const subjectMenuRef = useRef<HTMLDivElement>(null)
  const folderMenuRef = useRef<HTMLDivElement>(null)

  // Close menus on outside click & lock body scroll when upload modal is open
  useEffect(() => {
    if (isUploadOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow || 'unset'
      }
    }
  }, [isUploadOpen])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (subjectMenuRef.current && !subjectMenuRef.current.contains(e.target as Node)) {
        setIsSubjectMenuOpen(false)
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setIsFolderMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Open upload modal with pre-selected folder
  const openUploadModal = (targetFolderId?: string) => {
    if (targetFolderId) {
      setUploadFolderId(targetFolderId)
    } else if (activeSubfolder) {
      setUploadFolderId(activeSubfolder.id)
    } else {
      setUploadFolderId('root')
    }
    setUploadProgress(0)
    setUploadStatusText('')
    setIsSubjectMenuOpen(false)
    setIsFolderMenuOpen(false)
    setSubjectSearchQuery('')
    setIsUploadOpen(true)
  }

  // Handle Track change in upload modal
  const handleTrackSelect = (trackCode: 'DS' | 'AI' | 'HA' | 'CS' | 'BA' | 'MA') => {
    setUploadTrack(trackCode)
    const trackObj = ACADEMIC_TRACKS.find(t => t.code === trackCode)
    if (trackObj && trackObj.subjects.length > 0) {
      setUploadSubjectName(trackObj.subjects[0])
      setIsCustomSubject(false)
      setSubjectSearchQuery('')
    }
  }

  // Handle Profile Creation
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profileDisplayName.trim() || !profileUsername.trim()) {
      toast.error('Please fill in your Display Name and Username.')
      return
    }

    setIsSubmittingProfile(true)
    try {
      const created = await createContributorProfile({
        displayName: profileDisplayName,
        username: profileUsername,
        bio: profileBio,
        avatarUrl: session?.profile_image
      })
      setContributor(created)
      toast.success('🎉 Contributor Profile created successfully! Google Drive folder initialized.')
    } catch (err: any) {
      console.error('Error creating profile:', err)
      toast.error(err?.message || 'Failed to create Contributor Profile.')
    } finally {
      setIsSubmittingProfile(false)
    }
  }

  // Handle Create Subfolder
  const handleCreateSubfolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Folder name cannot be empty.')
      return
    }

    setIsCreatingFolder(true)
    try {
      const res = await createContributorSubfolderAction(newFolderName)
      setSubfolders(prev => [...prev, res])
      setNewFolderName('')
      setIsFolderModalOpen(false)
      toast.success(`📁 Folder "${res.name}" created in Google Drive!`)
    } catch (err: any) {
      console.error('Subfolder creation error:', err)
      toast.error(err?.message || 'Failed to create subfolder.')
    } finally {
      setIsCreatingFolder(false)
    }
  }

  // Handle Delete Subfolder
  const handleDeleteSubfolder = async (folderId: string, folderName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete folder "${folderName}" from Google Drive? Any summaries inside will be moved to your root folder.`)) {
      try {
        await deleteContributorSubfolderAction(folderId)
        setSubfolders(prev => prev.filter(f => f.id !== folderId))
        if (activeSubfolder?.id === folderId) {
          setActiveSubfolder(null)
        }
        if (contributor?.drive_folder_id) {
          setSummaries(prev => prev.map(s => s?.drive_folder_id === folderId ? { ...s, drive_folder_id: contributor.drive_folder_id } : s))
        }
        toast.success(`📁 Folder "${folderName}" deleted from Google Drive.`)
      } catch (err: any) {
        console.error('Delete folder error:', err)
        toast.error(err?.message || 'Failed to delete folder.')
      }
    }
  }

  // Handle Summary Upload with Real-Time Progress Bar
  const handleUploadSummary = (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadTitle.trim()) {
      toast.error('Please enter a summary title.')
      return
    }
    if (!uploadSubjectName.trim()) {
      toast.error('Please select or enter the subject name.')
      return
    }
    if (!uploadFile) {
      toast.error('Please select a document file to upload.')
      return
    }

    setIsUploading(true)
    setUploadProgress(5)
    setUploadStatusText('Preparing file for upload...')

    const formData = new FormData()
    formData.append('title', uploadTitle.trim())
    formData.append('description', '')
    formData.append('subjectId', uploadSubjectName.trim())

    const folderParam = (uploadFolderId === 'root' || !uploadFolderId) ? (contributor?.drive_folder_id || '') : uploadFolderId
    formData.append('parentFolderId', folderParam)
    formData.append('file', uploadFile)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/summaries/upload')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 90)
        setUploadProgress(Math.max(10, percent))
        const loadedMb = (event.loaded / (1024 * 1024)).toFixed(1)
        const totalMb = (event.total / (1024 * 1024)).toFixed(1)
        setUploadStatusText(`Uploading to Google Drive (${loadedMb} MB / ${totalMb} MB)...`)
      }
    }

    xhr.onload = () => {
      setIsUploading(false)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText)
          if (res.success && res.summary) {
            setUploadProgress(100)
            setUploadStatusText('Completed!')
            setSummaries(prev => [res.summary, ...prev.filter(Boolean)])
            
            // Reset form
            setUploadTitle('')
            setUploadFile(null)
            setIsUploadOpen(false)
            toast.success(`🎉 Summary "${res.summary.title}" uploaded to Google Drive & published!`)
            return
          }
          toast.error(res.error || 'Failed to upload summary.')
        } catch (parseErr) {
          toast.error('Failed to parse server response.')
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText)
          toast.error(errRes.error || `Upload failed with status ${xhr.status}`)
        } catch {
          toast.error(`Upload failed with status ${xhr.status}`)
        }
      }
    }

    xhr.onerror = () => {
      setIsUploading(false)
      toast.error('Network error during upload. Please check your connection and try again.')
    }

    xhr.send(formData)
  }

  // Handle Edit Summary
  const handleOpenEdit = (summary: Summary) => {
    setEditingSummary(summary)
    setEditTitle(summary.title)
    setEditSubjectName(summary.subject_id || '')
    setEditStatus(summary.status)
  }

  const handleSaveEdit = async () => {
    if (!editingSummary) return
    if (!editTitle.trim()) {
      toast.error('Title is required.')
      return
    }

    setIsSavingEdit(true)
    try {
      const updated = await updateSummaryAction(editingSummary.id, {
        title: editTitle.trim(),
        subjectId: editSubjectName.trim(),
        status: editStatus
      })

      setSummaries(prev => prev.map(s => (s && s.id === updated.id ? updated : s)).filter(Boolean))
      setEditingSummary(null)
      toast.success('Summary updated successfully.')
    } catch (err: any) {
      console.error('Edit error:', err)
      toast.error(err?.message || 'Failed to update summary.')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Handle Delete Summary
  const handleDeleteSummary = async (summaryId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? It will also be deleted permanently from Google Drive.`)) {
      try {
        await deleteSummaryAction(summaryId)
        setSummaries(prev => prev.filter(s => s && s.id !== summaryId))
        toast.success('Summary and file removed from Google Drive.')
      } catch (err: any) {
        console.error('Delete error:', err)
        toast.error(err?.message || 'Failed to delete summary.')
      }
    }
  }

  // Safe data calculations
  const validSummaries = (summaries || []).filter(Boolean)
  const totalVotes = validSummaries.reduce((acc, s) => acc + (s?.votes || 0), 0)
  const totalEarnedCoins = validSummaries.reduce((acc, s) => acc + (s?.earned_coins || 0), 0)

  const displayedSummaries = activeSubfolder
    ? validSummaries.filter(s => s?.drive_folder_id === activeSubfolder.id)
    : validSummaries

  const activeTrackObj = ACADEMIC_TRACKS.find(t => t.code === uploadTrack) || ACADEMIC_TRACKS[0]
  const filteredSubjects = activeTrackObj.subjects.filter(s =>
    s.toLowerCase().includes(subjectSearchQuery.toLowerCase().trim())
  )

  const selectedFolderName = uploadFolderId === 'root'
    ? '📁 Root Folder (Default)'
    : `📂 ${subfolders.find(f => f.id === uploadFolderId)?.name || 'Subfolder'}`

  // Setup form if Contributor profile doesn't exist
  if (!contributor) {
    return (
      <div className="max-w-md mx-auto py-12">
        <Card className="border-2 border-primary/30 bg-card shadow-2xl rounded-3xl p-6">
          <CardHeader className="text-center pb-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-7 h-7" />
            </div>
            <CardTitle className="text-2xl font-black text-foreground font-outfit">
              Set Up Contributor Profile
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Publish personal summaries to your Google Drive and receive Coins when students support your work.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleCreateProfile} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Display Name</label>
              <Input
                value={profileDisplayName}
                onChange={e => setProfileDisplayName(e.target.value)}
                placeholder="e.g. Ahmed Mohamed"
                className="rounded-xl border-border focus:border-primary h-10 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">@</span>
                <Input
                  value={profileUsername}
                  onChange={e => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ahmed_mohamed"
                  className="pl-7 rounded-xl border-border focus:border-primary h-10 text-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Bio (Optional)</label>
              <Textarea
                value={profileBio}
                onChange={e => setProfileBio(e.target.value)}
                placeholder="e.g. FCDS Class of 2026 | AI Summaries"
                className="rounded-xl border-border focus:border-primary resize-none h-18 text-xs"
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmittingProfile}
              className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black py-5 text-xs shadow-md shadow-primary/20"
            >
              {isSubmittingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Initializing Profile & Drive Folder...
                </>
              ) : (
                'Create Profile'
              )}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-7">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5 text-xs font-bold">
          <Link href="/summaries">
            <ArrowLeft className="w-4 h-4" />
            Back to Summaries
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5 text-xs font-bold border-border hover:border-primary/50">
            <Link href={`/contributors/${contributor.username}`} target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              Public Profile
            </Link>
          </Button>

          <Button
            onClick={() => openUploadModal()}
            size="sm"
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-1.5 text-xs shadow-md shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Upload Summary
          </Button>
        </div>
      </div>

      {/* Contributor Profile & Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile Card */}
        <Card className="lg:col-span-2 rounded-3xl border-2 border-border bg-card p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="w-14 h-14 border-2 border-primary shadow-md">
              <AvatarImage src={contributor.avatar_url || session?.profile_image} />
              <AvatarFallback className="bg-primary/20 text-primary font-black text-lg">
                {contributor.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground font-outfit">
                  {contributor.display_name}
                </h2>
                <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black">
                  Contributor
                </Badge>
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                @{contributor.username}
              </p>
              {contributor.bio && (
                <p className="text-xs text-muted-foreground pt-1">
                  {contributor.bio}
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 truncate mr-2">
              <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">Root Folder: <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">{contributor.drive_folder_id}</code></span>
            </div>
            <Button
              onClick={() => setIsFolderModalOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-bold h-7 gap-1 border-border shrink-0"
            >
              <FolderPlus className="w-3 h-3 text-primary" />
              New Subfolder
            </Button>
          </div>
        </Card>

        {/* Economics Card */}
        <Card className="rounded-3xl border-2 border-primary/30 bg-card p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Contributor Economics
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Published</span>
              <span className="text-base font-black text-foreground">{validSummaries.length} Summaries</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Supports</span>
              <div className="flex items-center gap-1 text-base font-black text-primary">
                <Heart className="w-3.5 h-3.5 fill-primary text-primary" />
                <span>{totalVotes}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Coins (60%)</span>
              <div className="flex items-center gap-1 text-base font-black text-primary">
                <Coins className="w-3.5 h-3.5" />
                <span>+{totalEarnedCoins.toLocaleString()} 🪙</span>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 rounded-xl bg-primary/10 border border-primary/20 text-[10px] text-muted-foreground">
            💡 100 Coins per support (60 credited to you, 40 platform fee).
          </div>
        </Card>
      </div>

      {/* Subfolder Browser */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-black text-foreground">
            <FolderOpen className="w-4 h-4 text-primary" />
            <span>Google Drive Folders</span>
            {activeSubfolder && (
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                <ChevronRight className="w-3 h-3" />
                <button onClick={() => setActiveSubfolder(null)} className="underline hover:text-primary">All</button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-primary font-bold">{activeSubfolder.name}</span>
              </span>
            )}
          </div>

          {activeSubfolder && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => openUploadModal(activeSubfolder.id)}
                size="sm"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-7 gap-1 shadow-sm"
              >
                <Plus className="w-3 h-3" />
                Upload into &quot;{activeSubfolder.name}&quot;
              </Button>
              <Button
                onClick={() => handleDeleteSubfolder(activeSubfolder.id, activeSubfolder.name)}
                variant="outline"
                size="sm"
                className="rounded-full text-red-500 hover:bg-red-500/10 border-red-500/30 text-xs h-7 gap-1"
                title="Delete this subfolder"
              >
                <Trash2 className="w-3 h-3" />
                Delete Folder
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          <button
            onClick={() => setActiveSubfolder(null)}
            className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
              activeSubfolder === null
                ? 'bg-primary/15 border-primary shadow-sm'
                : 'bg-card border-border hover:border-primary/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <Folder className={`w-4 h-4 ${activeSubfolder === null ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="text-[10px] font-bold text-muted-foreground">{validSummaries.length} files</span>
            </div>
            <span className="text-xs font-bold text-foreground truncate">📁 All Summaries</span>
          </button>

          {subfolders.map(folder => {
            const count = validSummaries.filter(s => s?.drive_folder_id === folder.id).length
            const isSelected = activeSubfolder?.id === folder.id
            return (
              <div
                key={folder.id}
                onClick={() => setActiveSubfolder(isSelected ? null : folder)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer group relative ${
                  isSelected
                    ? 'bg-primary/15 border-primary shadow-sm'
                    : 'bg-card border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Folder className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-muted-foreground">{count} files</span>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSubfolder(folder.id, folder.name, e)}
                      className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/15 transition-colors opacity-60 hover:opacity-100"
                      title="Delete folder from Google Drive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground truncate">📂 {folder.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summaries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground font-outfit">
            {activeSubfolder ? `Summaries in "${activeSubfolder.name}"` : 'My Summaries'} ({displayedSummaries.length})
          </h3>

          <Button
            onClick={() => openUploadModal()}
            size="sm"
            className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-7 gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Summary
          </Button>
        </div>

        {displayedSummaries.length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed border-border bg-card p-10 text-center space-y-3">
            <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
            <h4 className="text-sm font-bold text-foreground">
              {activeSubfolder ? `No files in "${activeSubfolder.name}"` : 'No summaries uploaded yet'}
            </h4>
            <Button
              onClick={() => openUploadModal(activeSubfolder?.id)}
              size="sm"
              className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs"
            >
              Upload Summary
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedSummaries.map(summary => (
              <Card
                key={summary.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-md flex flex-col justify-between space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] font-bold">
                      {summary.subject_id || 'General'}
                    </Badge>
                    <Badge
                      className={`text-[9px] font-bold ${
                        summary.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {summary.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-bold text-foreground line-clamp-2">
                    {summary.title}
                  </h4>

                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5 font-mono">
                    <FileCheck className="w-3 h-3 text-primary" />
                    <span className="truncate">{summary.file_name}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="flex items-center gap-1 font-bold text-primary">
                      <Heart className="w-3 h-3 fill-primary text-primary" />
                      {summary.votes || 0}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      +{summary.earned_coins || 0} 🪙
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                      title="Open in Google Drive"
                    >
                      <a href={summary.drive_url || `https://drive.google.com/file/d/${summary.drive_file_id}/view`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>

                    <Button
                      onClick={() => handleOpenEdit(summary)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground"
                      title="Edit metadata"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      onClick={() => handleDeleteSummary(summary.id, summary.title)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full text-red-500 hover:bg-red-500/10"
                      title="Delete summary"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL: CHAMELEON TOUR STYLE UPLOAD MODAL (WITH CURVE & MARLINE CHARACTER)
          ========================================================================= */}
      <Dialog open={isUploadOpen} onOpenChange={(open) => !isUploading && setIsUploadOpen(open)}>
        <DialogContent className="max-w-2xl bg-transparent border-0 shadow-none p-0 overflow-visible">
          <div className="relative w-full flex items-center justify-center">
            {/* Overhanging Marline Mascot Illustration balanced size and shifted further right */}
            <div className="hidden sm:block absolute right-[-60px] sm:right-[-80px] md:right-[-100px] lg:right-[-145px] top-1/2 -translate-y-1/2 z-30 pointer-events-none drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
              <motion.div
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="relative w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-[340px] lg:h-[340px] flex items-center justify-center"
              >
                <Image
                  src="/images/chameleon/04_chameleon_reading.webp"
                  alt="Marline Reading Summaries"
                  width={340}
                  height={340}
                  className="object-contain"
                  priority
                />
              </motion.div>
            </div>

            {/* Modal Card with Radial Curve Cutout and Theme Border */}
            <div
              className="relative z-20 w-full bg-card text-card-foreground border-2 border-primary/35 rounded-3xl sm:rounded-[2.4rem] shadow-2xl p-5 sm:p-6 md:p-7 overflow-visible"
              style={{
                maskImage: 'radial-gradient(circle 165px at calc(100% - 10px) 50%, transparent 164px, black 165px)',
                WebkitMaskImage: 'radial-gradient(circle 165px at calc(100% - 10px) 50%, transparent 164px, black 165px)'
              }}
            >
              {/* Continuous Theme Border Arc along the circular cutout */}
              <div
                className="hidden sm:block absolute pointer-events-none rounded-full border-2 border-primary/35 z-30"
                style={{
                  width: '330px',
                  height: '330px',
                  right: 'calc(-165px + 10px)',
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              />

              {/* Header */}
              <div className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b border-border/60 max-w-full sm:max-w-[70%]">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide bg-primary/15 text-primary border border-primary/30">
                    ✨ UPLOAD SUMMARY
                  </span>
                </div>
              </div>

              {/* Form Content on the left / center */}
              <form onSubmit={handleUploadSummary} className="space-y-3 max-w-full sm:max-w-[70%]">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Summary Title</label>
                  <Input
                    value={uploadTitle}
                    onChange={e => setUploadTitle(e.target.value)}
                    placeholder="e.g. Full Midterm Review & Solved Questions"
                    className="rounded-xl border-border focus:border-primary h-8 text-xs bg-background/80"
                    disabled={isUploading}
                    required
                  />
                </div>

                {/* Track Selector: 6 Tracks (DS, AI, HA, CS, BA, MA) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Track / Department</label>
                  <div className="grid grid-cols-6 gap-1">
                    {(['DS', 'AI', 'HA', 'CS', 'BA', 'MA'] as const).map(trackCode => (
                      <button
                        key={trackCode}
                        type="button"
                        disabled={isUploading}
                        onClick={() => handleTrackSelect(trackCode)}
                        className={`py-1 rounded-xl text-[11px] font-black transition-all ${
                          uploadTrack === trackCode
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted/70 border border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {trackCode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Ultra-Sleek Subject Selector Menu */}
                <div className="space-y-1" ref={subjectMenuRef}>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-foreground">Subject Name</label>
                    <button
                      type="button"
                      onClick={() => setIsCustomSubject(!isCustomSubject)}
                      className="text-[10px] font-bold text-primary hover:underline"
                    >
                      {isCustomSubject ? 'Choose from list' : '+ Custom subject'}
                    </button>
                  </div>

                  {isCustomSubject ? (
                    <Input
                      value={uploadSubjectName}
                      onChange={e => setUploadSubjectName(e.target.value)}
                      placeholder="Type subject name..."
                      className="rounded-xl border-border focus:border-primary h-8 text-xs bg-background/80"
                      disabled={isUploading}
                      required
                    />
                  ) : (
                    <div className="relative">
                      {/* Trigger Button */}
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => setIsSubjectMenuOpen(!isSubjectMenuOpen)}
                        className="w-full h-8 px-2.5 rounded-xl border border-border bg-background/80 hover:border-primary/60 text-foreground text-xs font-bold flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate text-[11px]">{uploadSubjectName || 'Select a subject...'}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${isSubjectMenuOpen ? 'rotate-180 text-primary' : ''}`} />
                      </button>

                      {/* Inline Expandable Subject List */}
                      <AnimatePresence>
                        {isSubjectMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden pt-1.5"
                          >
                            <div
                              className="rounded-2xl border-2 border-primary/30 bg-muted/40 p-2 space-y-1.5 shadow-inner"
                              onWheel={(e) => e.stopPropagation()}
                              onTouchMove={(e) => e.stopPropagation()}
                            >
                              {/* Search inside menu */}
                              <div className="relative">
                                <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={subjectSearchQuery}
                                  onChange={(e) => setSubjectSearchQuery(e.target.value)}
                                  placeholder="Search subject..."
                                  className="w-full h-6 pl-7 pr-2 rounded-lg bg-background border border-border text-[11px] font-bold focus:outline-none focus:border-primary text-foreground placeholder:text-muted-foreground"
                                  autoFocus
                                />
                              </div>

                              {/* List of items with isolated scroll */}
                              <div
                                className="overflow-y-auto space-y-0.5 pr-1 scrollbar-thin max-h-36 overscroll-contain"
                                onWheel={(e) => e.stopPropagation()}
                              >
                                {filteredSubjects.map(subj => (
                                  <button
                                    key={subj}
                                    type="button"
                                    onClick={() => {
                                      setUploadSubjectName(subj)
                                      setIsSubjectMenuOpen(false)
                                      setSubjectSearchQuery('')
                                    }}
                                    className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                                      uploadSubjectName === subj
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'hover:bg-primary/15 hover:text-primary text-foreground'
                                    }`}
                                  >
                                    <span className="truncate">{subj}</span>
                                    {uploadSubjectName === subj && <Check className="w-3 h-3 ml-1 shrink-0" />}
                                  </button>
                                ))}

                                {filteredSubjects.length === 0 && (
                                  <div className="p-2 text-center text-xs text-muted-foreground space-y-1">
                                    <span className="block text-[10px]">No subject matched &quot;{subjectSearchQuery}&quot;</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUploadSubjectName(subjectSearchQuery.trim())
                                        setIsSubjectMenuOpen(false)
                                        setSubjectSearchQuery('')
                                      }}
                                      className="px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-black text-[10px]"
                                    >
                                      Use &quot;{subjectSearchQuery.trim()}&quot; as custom
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Subfolder Destination Menu (if subfolders exist) */}
                {subfolders.length > 0 && (
                  <div className="space-y-1" ref={folderMenuRef}>
                    <label className="text-[11px] font-bold text-foreground">Drive Destination Folder</label>
                    <div className="relative">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => setIsFolderMenuOpen(!isFolderMenuOpen)}
                        className="w-full h-8 px-2.5 rounded-xl border border-border bg-background/80 hover:border-primary/60 text-foreground text-xs font-bold flex items-center justify-between transition-all group"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <Folder className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate text-[11px]">{selectedFolderName}</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform duration-200 ${isFolderMenuOpen ? 'rotate-180 text-primary' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isFolderMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="overflow-hidden pt-1.5"
                          >
                            <div
                              className="rounded-2xl border-2 border-primary/30 bg-muted/40 p-1.5 space-y-0.5 max-h-36 overflow-y-auto overscroll-contain shadow-inner"
                              onWheel={(e) => e.stopPropagation()}
                              onTouchMove={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setUploadFolderId('root')
                                  setIsFolderMenuOpen(false)
                                }}
                                className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                                  uploadFolderId === 'root'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-primary/15 hover:text-primary text-foreground'
                                }`}
                              >
                                <span>📁 Root Folder (Default)</span>
                                {uploadFolderId === 'root' && <Check className="w-3 h-3 ml-1 shrink-0" />}
                              </button>
                              {subfolders.map(f => (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => {
                                    setUploadFolderId(f.id)
                                    setIsFolderMenuOpen(false)
                                  }}
                                  className={`w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                                    uploadFolderId === f.id
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-primary/15 hover:text-primary text-foreground'
                                  }`}
                                >
                                  <span className="truncate">📂 {f.name}</span>
                                  {uploadFolderId === f.id && <Check className="w-3 h-3 ml-1 shrink-0" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Document File Dropzone */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-foreground">Document File (Max 50MB)</label>
                  <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-2.5 text-center cursor-pointer relative bg-muted/20">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                      disabled={isUploading}
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadFile(e.target.files[0])
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                      required
                    />
                    <div className="flex items-center justify-center gap-2">
                      <UploadCloud className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-[11px] font-bold text-foreground truncate max-w-[200px]">
                        {uploadFile ? uploadFile.name : 'Choose PDF, Word or PPT'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Upload Progress Bar */}
                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-1 pt-1"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        {uploadStatusText}
                      </span>
                      <span className="text-primary font-black text-xs">{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-1.5 rounded-full bg-muted" />
                  </motion.div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => setIsUploadOpen(false)}
                    className="rounded-xl text-xs h-8 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs shadow-md shadow-primary/20 h-8 px-4"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Uploading...
                      </>
                    ) : (
                      'Upload Summary'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: CREATE GOOGLE DRIVE SUBFOLDER
          ========================================================================= */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="max-w-xs rounded-3xl border-2 border-border bg-card p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground font-outfit">
              Create Subfolder
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Folder Name</label>
              <Input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="e.g. Data Structures"
                className="rounded-xl border-border focus:border-primary h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFolderModalOpen(false)}
              className="rounded-xl text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubfolder}
              disabled={isCreatingFolder}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-8"
            >
              {isCreatingFolder ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: EDIT SUMMARY METADATA
          ========================================================================= */}
      <Dialog open={!!editingSummary} onOpenChange={open => !open && setEditingSummary(null)}>
        <DialogContent className="max-w-sm rounded-3xl border-2 border-border bg-card p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-black text-foreground font-outfit">
              Edit Summary
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Title</label>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Subject Name</label>
              <Input
                value={editSubjectName}
                onChange={e => setEditSubjectName(e.target.value)}
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value as any)}
                className="w-full h-9 px-3 rounded-xl border border-border bg-background text-foreground text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSummary(null)}
              className="rounded-xl text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs h-8"
            >
              {isSavingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
