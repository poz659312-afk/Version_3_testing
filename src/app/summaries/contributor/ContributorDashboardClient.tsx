'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder,
  FolderPlus,
  UploadCloud,
  FileText,
  Heart,
  Coins,
  Settings,
  Plus,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  User,
  Loader2,
  FileCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Contributor, Summary, User as UserType } from '@/lib/types'
import { toast } from 'sonner'
import {
  createContributorProfile,
  updateContributorProfile,
  createContributorSubfolderAction,
  uploadSummaryAction,
  updateSummaryAction,
  deleteSummaryAction
} from '../actions'

const SUBJECT_OPTIONS = [
  { id: 'CDS', name: 'Computer & Data Science (CDS)' },
  { id: 'AI', name: 'Artificial Intelligence (AI)' },
  { id: 'CYS', name: 'Cybersecurity (CYS)' },
  { id: 'MA', name: 'Media Analytics (MA)' },
  { id: 'BA', name: 'Business Analytics (BA)' },
  { id: 'HI', name: 'Health Informatics (HI)' },
  { id: 'MATH', name: 'Mathematics & Calculus' },
  { id: 'PROG', name: 'Programming & OOP' },
  { id: 'DS', name: 'Data Structures & Algorithms' },
  { id: 'DB', name: 'Database Systems' },
  { id: 'GENERAL', name: 'General / University Requirements' },
]

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
  const [summaries, setSummaries] = useState<Summary[]>(initialSummaries)
  const [subfolders, setSubfolders] = useState<Array<{ id: string; name: string }>>(initialSubfolders)

  // Profile setup modal state
  const [isCreatingProfile, setIsCreatingProfile] = useState(false)
  const [profileDisplayName, setProfileDisplayName] = useState(session?.username || '')
  const [profileUsername, setProfileUsername] = useState(
    session?.username ? session.username.toLowerCase().replace(/[^a-z0-9_]/g, '') : ''
  )
  const [profileBio, setProfileBio] = useState('')
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false)

  // Upload summary modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadDesc, setUploadDesc] = useState('')
  const [uploadSubject, setUploadSubject] = useState('CDS')
  const [uploadFolderId, setUploadFolderId] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Subfolder modal state
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // Edit summary state
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editStatus, setEditStatus] = useState<'published' | 'draft' | 'archived'>('published')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

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

  // Handle Summary Upload
  const handleUploadSummary = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadTitle.trim()) {
      toast.error('Please enter a summary title.')
      return
    }
    if (!uploadFile) {
      toast.error('Please select a document file to upload.')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('title', uploadTitle.trim())
      formData.append('description', uploadDesc.trim())
      formData.append('subjectId', uploadSubject)
      formData.append('parentFolderId', uploadFolderId || (contributor?.drive_folder_id || ''))
      formData.append('file', uploadFile)

      const newSummary = await uploadSummaryAction(formData)
      setSummaries(prev => [newSummary, ...prev])

      // Reset form
      setUploadTitle('')
      setUploadDesc('')
      setUploadFile(null)
      setIsUploadOpen(false)
      toast.success(`🎉 Summary "${newSummary.title}" uploaded to Google Drive & published!`)
    } catch (err: any) {
      console.error('Summary upload error:', err)
      toast.error(err?.message || 'Failed to upload summary.')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle Edit Summary
  const handleOpenEdit = (summary: Summary) => {
    setEditingSummary(summary)
    setEditTitle(summary.title)
    setEditDesc(summary.description || '')
    setEditSubject(summary.subject_id || 'CDS')
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
        description: editDesc.trim(),
        subjectId: editSubject,
        status: editStatus
      })

      setSummaries(prev => prev.map(s => (s.id === updated.id ? updated : s)))
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
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteSummaryAction(summaryId)
        setSummaries(prev => prev.filter(s => s.id !== summaryId))
        toast.success('Summary removed.')
      } catch (err: any) {
        console.error('Delete error:', err)
        toast.error(err?.message || 'Failed to delete summary.')
      }
    }
  }

  // If Contributor Profile does NOT exist yet, render initial setup form
  if (!contributor) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <Card className="border-2 border-amber-500/30 bg-card shadow-2xl rounded-3xl p-6 sm:p-8">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-black text-foreground font-outfit">
              Set Up Contributor Profile
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              As a Chameleon Admin, you can publish your personal summaries to Google Drive and receive Coins when students support your work.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleCreateProfile} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Display Name</label>
              <Input
                value={profileDisplayName}
                onChange={e => setProfileDisplayName(e.target.value)}
                placeholder="e.g. Ahmed Mohamed"
                className="rounded-xl border-border focus:border-amber-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Username (Unique handle)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">@</span>
                <Input
                  value={profileUsername}
                  onChange={e => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="ahmed_mohamed"
                  className="pl-8 rounded-xl border-border focus:border-amber-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Bio / Specialization (Optional)</label>
              <Textarea
                value={profileBio}
                onChange={e => setProfileBio(e.target.value)}
                placeholder="e.g. FCDS Class of 2026 | AI & Data Science Summaries"
                className="rounded-xl border-border focus:border-amber-500 resize-none h-24"
              />
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-muted-foreground space-y-1">
              <span className="font-bold text-amber-600 dark:text-amber-400 block">📁 Automatic Google Drive Integration:</span>
              <span>A dedicated root folder will be created in Google Drive for your uploaded summaries.</span>
            </div>

            <Button
              type="submit"
              disabled={isSubmittingProfile}
              className="w-full rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black py-6 text-sm shadow-lg shadow-amber-500/20"
            >
              {isSubmittingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating Contributor Profile...
                </>
              ) : (
                'Create Profile & Initialize Drive Folder'
              )}
            </Button>
          </form>
        </Card>
      </div>
    )
  }

  // Contributor Profile is active
  const totalVotes = summaries.reduce((acc, s) => acc + (s.votes || 0), 0)
  const totalEarnedCoins = summaries.reduce((acc, s) => acc + (s.earned_coins || 0), 0)

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button asChild variant="ghost" size="sm" className="rounded-full gap-1.5 text-xs font-bold">
          <Link href="/summaries">
            <ArrowLeft className="w-4 h-4" />
            Back to Summaries
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="rounded-full gap-1.5 text-xs font-bold border-border">
            <Link href={`/contributors/${contributor.username}`} target="_blank">
              <ExternalLink className="w-3.5 h-3.5" />
              View Public Profile
            </Link>
          </Button>

          <Button
            onClick={() => setIsUploadOpen(true)}
            size="sm"
            className="rounded-full bg-amber-500 hover:bg-amber-600 text-black font-black gap-1.5 text-xs shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            Upload Summary
          </Button>
        </div>
      </div>

      {/* Contributor Profile Header & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-2 rounded-3xl border-2 border-border bg-card p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16 border-2 border-amber-500 shadow-md">
              <AvatarImage src={contributor.avatar_url || session?.profile_image} />
              <AvatarFallback className="bg-amber-500/20 text-amber-500 font-black text-xl">
                {contributor.display_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-foreground font-outfit">
                  {contributor.display_name}
                </h2>
                <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-black">
                  Contributor
                </Badge>
              </div>
              <p className="text-xs font-bold text-muted-foreground">
                @{contributor.username}
              </p>
              {contributor.bio && (
                <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                  {contributor.bio}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-amber-500" />
              <span>Drive Root Folder: <code className="px-2 py-0.5 rounded bg-muted font-mono text-[11px]">{contributor.drive_folder_id}</code></span>
            </div>
            <Button
              onClick={() => setIsFolderModalOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-bold h-7 gap-1 border-border"
            >
              <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
              New Subfolder
            </Button>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="rounded-3xl border-2 border-amber-500/30 bg-card p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-wider text-muted-foreground mb-4">
              Contributor Economics
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Published</span>
                <span className="text-lg font-black text-foreground">{summaries.length} Summaries</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Supports Received</span>
                <div className="flex items-center gap-1.5 text-lg font-black text-amber-600 dark:text-amber-400">
                  <Heart className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{totalVotes}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Coins Earned (60%)</span>
                <div className="flex items-center gap-1.5 text-lg font-black text-amber-500">
                  <Coins className="w-4 h-4" />
                  <span>+{totalEarnedCoins.toLocaleString()} 🪙</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-muted-foreground">
            💡 Students spend 100 Coins to support a summary (60 Coins credited to you, 40 Coins platform fee).
          </div>
        </Card>
      </div>

      {/* Subfolders list (if any) */}
      {subfolders.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-amber-500" />
            Your Google Drive Subfolders ({subfolders.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {subfolders.map(f => (
              <span
                key={f.id}
                className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border text-xs font-bold text-foreground flex items-center gap-2"
              >
                <Folder className="w-3.5 h-3.5 text-amber-500" />
                {f.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* My Summaries List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-foreground font-outfit">
            My Summaries ({summaries.length})
          </h3>

          <Button
            onClick={() => setIsUploadOpen(true)}
            size="sm"
            className="rounded-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs h-8 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Summary
          </Button>
        </div>

        {summaries.length === 0 ? (
          <Card className="rounded-3xl border-2 border-dashed border-border bg-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-foreground">No summaries uploaded yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Upload your personal course summary documents to Google Drive and make them accessible to students.
            </p>
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="rounded-full bg-amber-500 hover:bg-amber-600 text-black font-black text-xs"
            >
              Upload Your First Summary
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {summaries.map(summary => (
              <Card
                key={summary.id}
                className="rounded-3xl border-2 border-border bg-card p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                      {summary.subject_id || 'General'}
                    </Badge>
                    <Badge
                      className={`text-[10px] font-bold ${
                        summary.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {summary.status.toUpperCase()}
                    </Badge>
                  </div>

                  <h4 className="text-base font-bold text-foreground line-clamp-2">
                    {summary.title}
                  </h4>

                  {summary.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {summary.description}
                    </p>
                  )}

                  <div className="text-[11px] text-muted-foreground flex items-center gap-2 pt-1 font-mono">
                    <FileCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span className="truncate">{summary.file_name}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Heart className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {summary.votes} supports
                    </span>
                    <span className="text-muted-foreground">
                      +{summary.earned_coins} 🪙
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
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
                      className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-foreground"
                      title="Edit metadata"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>

                    <Button
                      onClick={() => handleDeleteSummary(summary.id, summary.title)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full text-red-500 hover:bg-red-500/10"
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
          MODAL: UPLOAD SUMMARY TO GOOGLE DRIVE
          ========================================================================= */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-2 border-amber-500/30 bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-foreground font-outfit">
              Upload Summary Document
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              The file will be uploaded directly to your Google Drive folder and metadata saved to Chameleon.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSummary} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Summary Title</label>
              <Input
                value={uploadTitle}
                onChange={e => setUploadTitle(e.target.value)}
                placeholder="e.g. Data Structures Midterm Full Review"
                className="rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Subject / Specialization</label>
              <Select value={uploadSubject} onValueChange={setUploadSubject}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Track" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {SUBJECT_OPTIONS.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subfolders.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Google Drive Subfolder (Optional)</label>
                <Select value={uploadFolderId} onValueChange={setUploadFolderId}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Root Folder (Default)" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="">Root Folder (Default)</SelectItem>
                    {subfolders.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        📁 {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Description / Chapters Covered (Optional)</label>
              <Textarea
                value={uploadDesc}
                onChange={e => setUploadDesc(e.target.value)}
                placeholder="Key concepts, trees, graphs, sorting algorithms with solved exams..."
                className="rounded-xl resize-none h-20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Document File (PDF, DOCX, etc.)</label>
              <div className="border-2 border-dashed border-border hover:border-amber-500/50 rounded-2xl p-4 text-center cursor-pointer relative bg-muted/20">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0])
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <UploadCloud className="w-8 h-8 text-amber-500" />
                  <span className="text-xs font-bold text-foreground">
                    {uploadFile ? uploadFile.name : 'Click or drag file to upload'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    PDF, Word, or PowerPoint (Stored in Google Drive)
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsUploadOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUploading}
                className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shadow-md shadow-amber-500/20"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Uploading to Google Drive...
                  </>
                ) : (
                  'Upload & Publish'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: CREATE GOOGLE DRIVE SUBFOLDER
          ========================================================================= */}
      <Dialog open={isFolderModalOpen} onOpenChange={setIsFolderModalOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-2 border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground font-outfit">
              Create Google Drive Subfolder
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add an organizational subfolder inside your Drive folder (e.g. "Data Structures").
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Folder Name</label>
              <Input
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="e.g. Artificial Intelligence"
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFolderModalOpen(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubfolder}
              disabled={isCreatingFolder}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs"
            >
              {isCreatingFolder ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Create Folder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: EDIT SUMMARY METADATA
          ========================================================================= */}
      <Dialog open={!!editingSummary} onOpenChange={open => !open && setEditingSummary(null)}>
        <DialogContent className="max-w-lg rounded-3xl border-2 border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-foreground font-outfit">
              Edit Summary Metadata
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Title</label>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Subject</label>
              <Select value={editSubject} onValueChange={setEditSubject}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  {SUBJECT_OPTIONS.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Status</label>
              <Select value={editStatus} onValueChange={v => setEditStatus(v as any)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="published">Published (Visible to students)</SelectItem>
                  <SelectItem value="draft">Draft (Hidden from students)</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Description</label>
              <Textarea
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                className="rounded-xl resize-none h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingSummary(null)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs"
            >
              {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
