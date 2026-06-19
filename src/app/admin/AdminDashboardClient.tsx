'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
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
import { toast } from 'sonner'
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
  CheckCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  UserCheck
} from 'lucide-react'
import { 
  updateUserProfile, 
  previewFolderChanges, 
  createAccessRule, 
  deleteAccessRule,
  getAllUsers
} from './actions'
import TokenStatusMonitor from '@/components/TokenStatusMonitor'

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
  
  // Data States
  const [users, setUsers] = useState(initialUsers)
  const [rules, setRules] = useState(initialRules)
  const [logs, setLogs] = useState(initialLogs)

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
          current_level: levelVal
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
            current_level: levelVal
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

      if (res.success && res.data) {
        toast.success(`Access rule created for "${newRuleFolderName}"`)
        setRules([res.data, ...rules])
        setNewRuleFolderName('')
        setNewRuleFolderUrl('')
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to create access rule')
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

  return (
    <div className="space-y-8 premium-container">
      {/* Top Banner / Hero */}
      <div className="relative p-6 rounded-2xl bg-gradient-to-r from-neutral-900 via-zinc-950 to-neutral-950 border border-neutral-800 shadow-2xl overflow-hidden">
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
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 bg-muted/80 p-1 rounded-xl border border-border max-w-2xl mb-6">
          <TabsTrigger value="users" className="flex items-center gap-2 rounded-lg py-2">
            <UserCog className="w-4 h-4" />
            <span>User Directory</span>
          </TabsTrigger>
          <TabsTrigger value="rules" className="flex items-center gap-2 rounded-lg py-2">
            <FolderLock className="w-4 h-4" />
            <span>Folder Rules</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex items-center gap-2 rounded-lg py-2">
            <RefreshCw className="w-4 h-4" />
            <span>Token Monitor</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2 rounded-lg py-2">
            <History className="w-4 h-4" />
            <span>Audit Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: User Directory */}
        <TabsContent value="users" className="space-y-6">
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-4">
              <CardTitle>User Directory</CardTitle>
              <CardDescription>
                Search and manage students' roles, specializations, and levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search & Filters Row */}
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
                
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground font-medium">Filter:</span>
                  </div>

                  {/* Specialization Select */}
                  <Select value={specFilter} onValueChange={(val) => {
                    setSpecFilter(val)
                    setPage(1)
                  }}>
                    <SelectTrigger className="w-[180px] bg-muted/20 border-border">
                      <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Specializations</SelectItem>
                      {SPECIALIZATIONS.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Level Select */}
                  <Select value={levelFilter} onValueChange={(val) => {
                    setLevelFilter(val)
                    setPage(1)
                  }}>
                    <SelectTrigger className="w-[130px] bg-muted/20 border-border">
                      <SelectValue placeholder="Academic Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Levels</SelectItem>
                      {LEVELS.map(l => (
                        <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-lg border border-border overflow-hidden relative">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Admin Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                            <span className="text-sm font-medium">Loading user data...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                          No users found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((u) => (
                        <TableRow key={u.auth_id} className="hover:bg-muted/10 transition-colors">
                          <TableCell className="font-semibold">{u.username || 'No Username'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{u.email || 'No Email'}</TableCell>
                          <TableCell>
                            {u.specialization ? (
                              <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">
                                {u.specialization}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {u.current_level ? (
                              <Badge variant="secondary" className="bg-neutral-800 text-neutral-300">
                                Level {u.current_level}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1.5 items-center">
                              {u.is_super_admin && (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Super Admin</Badge>
                              )}
                              {u.is_admin ? (
                                <Badge className="bg-primary/20 text-primary border-primary/30">Admin</Badge>
                              ) : (
                                <Badge variant="secondary" className="opacity-40">Student</Badge>
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
        </TabsContent>

        {/* Tab 2: Folder Access Rules */}
        <TabsContent value="rules" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Create Access Rule Form */}
            <Card className="lg:col-span-1 bg-card border-border shadow-md h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-primary" />
                  Create Rule
                </CardTitle>
                <CardDescription>
                  Map specializations or levels to Google Drive folders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddRule} className="space-y-4">
                  {/* Specialization Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Specialization</label>
                    <Select value={newRuleSpec} onValueChange={setNewRuleSpec}>
                      <SelectTrigger className="bg-muted/10 border-border">
                        <SelectValue placeholder="Select Specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Specializations</SelectItem>
                        {SPECIALIZATIONS.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Level Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Academic Level</label>
                    <Select value={newRuleLevel} onValueChange={setNewRuleLevel}>
                      <SelectTrigger className="bg-muted/10 border-border">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Levels</SelectItem>
                        {LEVELS.map(l => (
                          <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Folder Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Folder Name</label>
                    <Input
                      placeholder="e.g. Data Science Level 2 Lectures"
                      value={newRuleFolderName}
                      onChange={(e) => setNewRuleFolderName(e.target.value)}
                      className="bg-muted/10 border-border"
                    />
                  </div>

                  {/* Folder URL or ID */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground">Google Drive Folder ID or Link</label>
                    <Input
                      placeholder="Paste folder link or ID..."
                      value={newRuleFolderUrl}
                      onChange={(e) => setNewRuleFolderUrl(e.target.value)}
                      className="bg-muted/10 border-border"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Pasting a Google Drive folder link will automatically parse out the folder ID.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold py-2.5 rounded-lg border-0 shadow-lg hover:brightness-110 active:scale-95 transition-all"
                    disabled={isCreatingRule}
                  >
                    {isCreatingRule ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding Rule...
                      </>
                    ) : (
                      <>
                        <FolderPlus className="w-4 h-4 mr-2" />
                        Add Access Rule
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Access Rules Table */}
            <Card className="lg:col-span-2 bg-card border-border shadow-md">
              <CardHeader>
                <CardTitle>Folder Access Rules</CardTitle>
                <CardDescription>
                  Current folders matched to student configurations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Target Criteria</TableHead>
                        <TableHead>Folder Details</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                            No access rules configured yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        rules.map((r) => (
                          <TableRow key={r.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="space-y-1">
                              <div className="flex flex-wrap gap-1.5">
                                {r.specialization ? (
                                  <Badge variant="outline" className="border-primary/20 text-primary">
                                    {r.specialization}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="opacity-40">Any Specialization</Badge>
                                )}
                                {r.current_level ? (
                                  <Badge variant="secondary">Level {r.current_level}</Badge>
                                ) : (
                                  <Badge variant="secondary" className="opacity-40">Any Level</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="space-y-1 max-w-[250px]">
                              <div className="font-semibold text-sm truncate">{r.folder_name}</div>
                              <div className="text-xs text-muted-foreground font-mono truncate">{r.folder_id}</div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                onClick={() => handleDeleteRule(r.id, r.folder_name)}
                                variant="destructive"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* Tab 3: Token Status Monitor */}
        <TabsContent value="tokens" className="space-y-6">
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
        </TabsContent>

        {/* Tab 4: Audit Logs */}
        <TabsContent value="logs" className="space-y-6">
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
        </TabsContent>
      </Tabs>

      {/* Edit User Dialog */}
      <Dialog open={editingUser !== null} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-background/95 border-border max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              Manage User: {editingUser?.username}
            </DialogTitle>
            <DialogDescription>
              Modify this student's platform privileges and Google Drive folder mappings.
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

              {/* Specialization select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Specialization</label>
                <Select value={editSpec} onValueChange={setEditSpec}>
                  <SelectTrigger className="bg-muted/10 border-border">
                    <SelectValue placeholder="Select Specialization" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None (General)</SelectItem>
                    {SPECIALIZATIONS.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Academic level select */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">Academic Level</label>
                <Select value={editLevel} onValueChange={setEditLevel}>
                  <SelectTrigger className="bg-muted/10 border-border">
                    <SelectValue placeholder="Select Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None (Unassigned)</SelectItem>
                    {LEVELS.map(l => (
                      <SelectItem key={l} value={String(l)}>Level {l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  )
}
