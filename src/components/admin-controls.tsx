"use client"

import React, { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Edit, Trash2, Loader2, CheckCircle, AlertTriangle } from "lucide-react"
import { getStudentSession } from "@/lib/auth"
import { useToast } from "@/components/ToastProvider"

interface FileActionsProps {
  fileId: string
  fileName: string
  onDeleted: () => void
  onRenamed: () => void
}

export function FileActions({ fileId, fileName, onDeleted, onRenamed }: FileActionsProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newName, setNewName] = useState(fileName)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [renameSuccess, setRenameSuccess] = useState(false)
  const { addToast } = useToast()

  const handleRename = async () => {
    if (newName.trim() === fileName) {
      setShowRenameDialog(false)
      return
    }

    if (!newName.trim()) {
      addToast("Please enter a valid name", "error")
      return
    }

    setIsRenaming(true)
    setRenameSuccess(false)

    try {
      const session = await getStudentSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/google-drive/rename/${fileId}?authId=${session.auth_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to rename file')
      }

      setRenameSuccess(true)
      
      // Auto-refresh immediately after successful rename
      onRenamed()
      
      // Show success animation for a moment
      setTimeout(() => {
        setShowRenameDialog(false)
        setRenameSuccess(false)
        addToast(`Renamed to "${newName.trim()}"`, "success")
      }, 1000)

    } catch (error) {
      console.error("Error renaming file:", error)
      addToast(error instanceof Error ? error.message : 'Failed to rename file', "error")
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const session = await getStudentSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/google-drive/delete/${fileId}?authId=${session.auth_id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete file')
      }

      // Auto-refresh immediately after successful delete
      onDeleted()
      
      // Show success and then close dialog
      setTimeout(() => {
        setShowDeleteDialog(false)
        addToast(`"${fileName}" has been deleted`, "success")
      }, 1500)

    } catch (error) {
      console.error("Error deleting file:", error)
      addToast(error instanceof Error ? error.message : 'Failed to delete file', "error")
      setIsDeleting(false)
    }
  }

  const openRenameDialog = () => {
    setNewName(fileName)
    setShowRenameDialog(true)
    setRenameSuccess(false)
  }

  return (
    <>
      <div className="flex flex-col gap-1 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={openRenameDialog}
          className="w-full justify-start h-9 text-xs font-medium hover:bg-amber-500/10 hover:text-amber-500"
        >
          <Edit className="w-4 h-4 mr-2" />
          Rename
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full justify-start h-9 text-xs font-medium hover:bg-red-500/10 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="/90 backdrop-blur-xl border-border  max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Rename File
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter a new name for "{fileName}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newFileName" className="text-foreground/80">
                New Name
              </Label>
              <Input
                id="newFileName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-muted border-border  placeholder:text-muted-foreground focus:border-amber-500/50 focus:ring-amber-500/20"
                placeholder="Enter new name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRenaming && !renameSuccess) {
                    handleRename()
                  }
                }}
                disabled={isRenaming || renameSuccess}
              />
            </div>

            {(isRenaming || renameSuccess) && (
              <div className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-1 duration-200">
                {isRenaming && (
                  <>
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    <span className="text-amber-400">Renaming in progress...</span>
                  </>
                )}
                {renameSuccess && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-400">Renamed successfully!</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameDialog(false)
                setNewName(fileName)
                setRenameSuccess(false)
              }}
              disabled={isRenaming}
              className="bg-transparent border-border  hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isRenaming || renameSuccess || !newName.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600  border-0"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Renaming...
                </>
              ) : renameSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Renamed!
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2 hover:text-amber-600" />
                  Rename
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="/90 backdrop-blur-xl border-red-500/20  max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete File
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete "{fileName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isDeleting && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-in fade-in slide-in-from-bottom-1 duration-200">
              <Trash2 className="w-5 h-5 text-red-500 animate-pulse" />
              <div>
                <p className="text-red-400 font-medium">Deleting in progress...</p>
                <p className="text-red-300/60 text-sm">Please wait while we remove the file</p>
              </div>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="bg-transparent border-border  hover:bg-muted hover:text-foreground/80"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700  border-0"
            >
              {isDeleting ? (
                <>
                  <Trash2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2 hover:text-red-600" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// AdminControls is now deprecated - replaced by CreateActions component
// Keeping this for backward compatibility but it no longer renders anything
interface AdminControlsProps {
  currentFolderId: string
  onFileUploaded: () => void
  onFileDeleted: () => void
  onFileRenamed: () => void
}

export function AdminControls({ }: AdminControlsProps) {
  // This component is now empty as CreateActions handles all admin creation functionality
  return null
}

interface FolderActionsProps {
  folderId: string
  folderName: string
  onDeleted: () => void
  onRenamed: () => void
}

export function FolderActions({ folderId, folderName, onDeleted, onRenamed }: FolderActionsProps) {
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [newName, setNewName] = useState(folderName)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [renameSuccess, setRenameSuccess] = useState(false)
  const { addToast } = useToast()

  const handleRename = async () => {
    if (newName.trim() === folderName) {
      setShowRenameDialog(false)
      return
    }

    if (!newName.trim()) {
      addToast("Please enter a valid folder name", "error")
      return
    }

    setIsRenaming(true)
    setRenameSuccess(false)

    try {
      const session = await getStudentSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/google-drive/rename/${folderId}?authId=${session.auth_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to rename folder')
      }

      setRenameSuccess(true)
      
      // Auto-refresh immediately after successful rename
      onRenamed()
      
      // Show success animation for a moment
      setTimeout(() => {
        setShowRenameDialog(false)
        setRenameSuccess(false)
        addToast(`Folder renamed to "${newName.trim()}"`, "success")
      }, 1000)

    } catch (error) {
      console.error("Error renaming folder:", error)
      addToast(error instanceof Error ? error.message : 'Failed to rename folder', "error")
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const session = await getStudentSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/google-drive/delete/${folderId}?authId=${session.auth_id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete folder')
      }

      // Auto-refresh immediately after successful delete
      onDeleted()
      
      // Show success and then close dialog
      setTimeout(() => {
        setShowDeleteDialog(false)
        addToast(`Folder "${folderName}" has been deleted`, "success")
      }, 1500)

    } catch (error) {
      console.error("Error deleting folder:", error)
      addToast(error instanceof Error ? error.message : 'Failed to delete folder', "error")
      setIsDeleting(false)
    }
  }

  const openRenameDialog = () => {
    setNewName(folderName)
    setShowRenameDialog(true)
    setRenameSuccess(false)
  }

  return (
    <>
      <div className="flex flex-col gap-1 w-full">
        <Button
          variant="ghost"
          size="sm"
          onClick={openRenameDialog}
          className="w-full justify-start h-9 text-xs font-medium hover:bg-blue-500/10 hover:text-blue-400"
        >
          <Edit className="w-4 h-4 mr-2" />
          Rename Folder
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full justify-start h-9 text-xs font-medium hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Folder
        </Button>
      </div>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="/90 backdrop-blur-xl border-border  max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Rename Folder
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter a new name for "{folderName}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newFolderName" className="text-foreground/80">
                New Name
              </Label>
              <Input
                id="newFolderName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-muted border-border  placeholder:text-muted-foreground focus:border-blue-500/50 focus:ring-blue-500/20"
                placeholder="Enter new folder name..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isRenaming && !renameSuccess) {
                    handleRename()
                  }
                }}
                disabled={isRenaming || renameSuccess}
              />
            </div>

            {(isRenaming || renameSuccess) && (
              <div className="flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-1 duration-200">
                {isRenaming && (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-blue-400">Renaming folder...</span>
                  </>
                )}
                {renameSuccess && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-400">Folder renamed successfully!</span>
                  </>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRenameDialog(false)}
              disabled={isRenaming || renameSuccess}
              className="bg-transparent border-border  hover:bg-muted hover:text-foreground/80"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isRenaming || renameSuccess || !newName.trim()}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600  border-0"
            >
              {isRenaming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Renaming...
                </>
              ) : renameSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Renamed!
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2 hover:text-amber-600" />
                  Rename Folder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="/90 backdrop-blur-xl border-border  max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Delete Folder
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete the folder "{folderName}"? 
              <br /><br />
              <span className="text-red-400 font-medium">Warning: This will also delete all files and subfolders inside this folder. This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              disabled={isDeleting}
              className="bg-transparent border-border  hover:bg-muted hover:text-foreground/80"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700  border-0"
            >
              {isDeleting ? (
                <>
                  <Trash2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Folder
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface RenameFileDialogProps {
  fileId: string
  fileName: string
  isOpen: boolean
  onClose: () => void
  onRenamed: () => void
}

export function RenameFileDialog({ fileId, fileName, isOpen, onClose, onRenamed }: RenameFileDialogProps) {
  const [newName, setNewName] = useState(fileName)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameSuccess, setRenameSuccess] = useState(false)
  const { addToast } = useToast()

  React.useEffect(() => {
    if (isOpen) {
      setNewName(fileName)
      setRenameSuccess(false)
    }
  }, [isOpen, fileName])

  const handleRename = async () => {
    if (newName.trim() === fileName) {
      onClose()
      return
    }

    if (!newName.trim()) {
      addToast("Please enter a valid name", "error")
      return
    }

    setIsRenaming(true)
    setRenameSuccess(false)

    try {
      const session = await getStudentSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/google-drive/rename/${fileId}?authId=${session.auth_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to rename file')
      }

      setRenameSuccess(true)
      onRenamed()
      
      setTimeout(() => {
        onClose()
        addToast(`Renamed to "${newName.trim()}"`, "success")
      }, 1000)

    } catch (error) {
      console.error("Error renaming file:", error)
      addToast(error instanceof Error ? error.message : 'Failed to rename file', "error")
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-slate-200/60 dark:border-white/10 max-w-md shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl p-6">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400" />
        
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-500 dark:text-amber-400 shadow-[0_8px_30px_rgb(245,158,11,0.15)] animate-bounce duration-1000">
            <Edit className="w-6 h-6" />
          </div>
          
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl font-black italic tracking-tight bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent uppercase">
              Rename File
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-muted-foreground/80 font-medium mt-1">
              Enter a new name for "{fileName}"
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newFileName" className="text-slate-700 dark:text-foreground/85 text-xs font-bold uppercase tracking-wider">
              File Name
            </Label>
            <Input
              id="newFileName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/30 focus:border-amber-500/50 focus:ring-amber-500/20 h-11 rounded-xl"
              placeholder="Enter new name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRenaming && !renameSuccess) {
                  handleRename()
                }
              }}
              disabled={isRenaming || renameSuccess}
            />
          </div>

          {(isRenaming || renameSuccess) && (
            <div className="flex items-center justify-center gap-2 text-sm py-2">
              {isRenaming && (
                <>
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-amber-500 dark:text-amber-400/90 font-medium">Renaming in progress...</span>
                </>
              )}
              {renameSuccess && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 dark:text-green-400 font-medium">Renamed successfully!</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex sm:flex-row justify-between w-full border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRenaming}
            className="flex-1 bg-transparent border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground text-slate-700 dark:text-foreground/80 text-sm font-semibold rounded-xl h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={isRenaming || renameSuccess || !newName.trim()}
            className="flex-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:to-orange-600 border-0 text-white font-semibold shadow-lg shadow-amber-500/10 rounded-xl h-11"
          >
            {isRenaming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Renaming...
              </>
            ) : renameSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Renamed!
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Rename
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteFileDialogProps {
  fileId: string
  fileName: string
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
}

export function DeleteFileDialog({ fileId, fileName, isOpen, onClose, onDeleted }: DeleteFileDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { addToast } = useToast()

  React.useEffect(() => {
    if (isOpen) {
      setIsDeleting(false)
    }
  }, [isOpen])

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const session = await getStudentSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/google-drive/delete/${fileId}?authId=${session.auth_id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete file')
      }

      onDeleted()
      
      setTimeout(() => {
        onClose()
        addToast(`"${fileName}" has been deleted`, "success")
      }, 1500)

    } catch (error) {
      console.error("Error deleting file:", error)
      addToast(error instanceof Error ? error.message : 'Failed to delete file', "error")
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <AlertDialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-slate-200/60 dark:border-red-500/15 max-w-md shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl p-6">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-500 via-red-500 to-orange-600" />
        
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-500 shadow-[0_8px_30px_rgb(239,68,68,0.15)] animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <AlertDialogHeader className="items-center text-center">
            <AlertDialogTitle className="text-2xl font-black italic tracking-tight bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 bg-clip-text text-transparent uppercase">
              Delete File
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-muted-foreground/80 font-medium mt-2 max-w-xs leading-relaxed">
              Are you sure you want to delete <span className="text-slate-900 dark:text-foreground font-bold break-all">"{fileName}"</span>? This action is permanent and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {isDeleting && (
          <div className="flex items-center justify-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-xl my-2 w-full animate-pulse">
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            <div className="text-left">
              <p className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">Deleting File</p>
              <p className="text-slate-500 dark:text-muted-foreground/60 text-[10px] mt-0.5">Removing file from storage</p>
            </div>
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0 flex sm:flex-row justify-between w-full border-t border-slate-100 dark:border-white/5 pt-4 mt-4">
          <AlertDialogCancel 
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 bg-transparent border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground text-slate-700 dark:text-foreground/80 text-sm font-semibold rounded-xl h-11 mt-0"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:to-rose-700 border-0 text-white font-semibold shadow-lg shadow-red-500/10 rounded-xl h-11"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Confirm Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface RenameFolderDialogProps {
  folderId: string
  folderName: string
  isOpen: boolean
  onClose: () => void
  onRenamed: () => void
}

export function RenameFolderDialog({ folderId, folderName, isOpen, onClose, onRenamed }: RenameFolderDialogProps) {
  const [newName, setNewName] = useState(folderName)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameSuccess, setRenameSuccess] = useState(false)
  const { addToast } = useToast()

  React.useEffect(() => {
    if (isOpen) {
      setNewName(folderName)
      setRenameSuccess(false)
    }
  }, [isOpen, folderName])

  const handleRename = async () => {
    if (newName.trim() === folderName) {
      onClose()
      return
    }

    if (!newName.trim()) {
      addToast("Please enter a valid folder name", "error")
      return
    }

    setIsRenaming(true)
    setRenameSuccess(false)

    try {
      const session = await getStudentSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/google-drive/rename/${folderId}?authId=${session.auth_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to rename folder')
      }

      setRenameSuccess(true)
      onRenamed()
      
      setTimeout(() => {
        onClose()
        addToast(`Folder renamed to "${newName.trim()}"`, "success")
      }, 1000)

    } catch (error) {
      console.error("Error renaming folder:", error)
      addToast(error instanceof Error ? error.message : 'Failed to rename folder', "error")
    } finally {
      setIsRenaming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-slate-200/60 dark:border-white/10 max-w-md shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl p-6">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />
        
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/15 dark:to-indigo-500/15 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-500 dark:text-blue-400 shadow-[0_8px_30px_rgb(59,130,246,0.15)] animate-bounce duration-1000">
            <Edit className="w-6 h-6" />
          </div>
          
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-2xl font-black italic tracking-tight bg-gradient-to-r from-blue-500 via-indigo-455 to-cyan-500 bg-clip-text text-transparent uppercase">
              Rename Folder
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-muted-foreground/80 font-medium mt-1">
              Enter a new name for "{folderName}"
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newFolderName" className="text-slate-700 dark:text-foreground/85 text-xs font-bold uppercase tracking-wider">
              Folder Name
            </Label>
            <Input
              id="newFolderName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/30 focus:border-blue-500/50 focus:ring-blue-500/20 h-11 rounded-xl"
              placeholder="Enter new folder name..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRenaming && !renameSuccess) {
                  handleRename()
                }
              }}
              disabled={isRenaming || renameSuccess}
            />
          </div>

          {(isRenaming || renameSuccess) && (
            <div className="flex items-center justify-center gap-2 text-sm py-2">
              {isRenaming && (
                <>
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-blue-500 dark:text-blue-400/90 font-medium">Renaming folder...</span>
                </>
              )}
              {renameSuccess && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 dark:text-green-400 font-medium">Folder renamed successfully!</span>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex sm:flex-row justify-between w-full border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isRenaming || renameSuccess}
            className="flex-1 bg-transparent border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground text-slate-700 dark:text-foreground/80 text-sm font-semibold rounded-xl h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={isRenaming || renameSuccess || !newName.trim()}
            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 text-white font-semibold shadow-lg shadow-blue-500/10 rounded-xl h-11"
          >
            {isRenaming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Renaming...
              </>
            ) : renameSuccess ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Renamed!
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Rename Folder
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteFolderDialogProps {
  folderId: string
  folderName: string
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
}

export function DeleteFolderDialog({ folderId, folderName, isOpen, onClose, onDeleted }: DeleteFolderDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { addToast } = useToast()

  React.useEffect(() => {
    if (isOpen) {
      setIsDeleting(false)
    }
  }, [isOpen])

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const session = await getStudentSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/google-drive/delete/${folderId}?authId=${session.auth_id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete folder')
      }

      onDeleted()
      
      setTimeout(() => {
        onClose()
        addToast(`Folder "${folderName}" has been deleted`, "success")
      }, 1500)

    } catch (error) {
      console.error("Error deleting folder:", error)
      addToast(error instanceof Error ? error.message : 'Failed to delete folder', "error")
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <AlertDialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-slate-200/60 dark:border-red-500/15 max-w-md shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl p-6">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-500 via-red-500 to-orange-600" />
        
        <div className="flex flex-col items-center text-center pt-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/30 flex items-center justify-center mb-4 text-red-500 shadow-[0_8px_30px_rgb(239,68,68,0.15)] animate-pulse">
            <AlertTriangle className="w-6 h-6" />
          </div>
          
          <AlertDialogHeader className="items-center text-center">
            <AlertDialogTitle className="text-2xl font-black italic tracking-tight bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 bg-clip-text text-transparent uppercase">
              Delete Folder
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-muted-foreground/80 font-medium mt-2 max-w-xs leading-relaxed">
              Are you sure you want to delete the folder <span className="text-slate-900 dark:text-foreground font-bold break-all">"{folderName}"</span>? 
              <br />
              <span className="text-red-800 dark:text-red-400/90 text-xs font-semibold block mt-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 p-3 rounded-xl leading-relaxed">
                Warning: This will permanently delete the folder and all files and subfolders inside it.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {isDeleting && (
          <div className="flex items-center justify-center gap-3 p-4 bg-red-500/5 border border-red-500/10 rounded-xl my-2 w-full animate-pulse">
            <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
            <div className="text-left">
              <p className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider">Deleting Folder</p>
              <p className="text-slate-500 dark:text-muted-foreground/60 text-[10px] mt-0.5">Removing folder hierarchy from storage</p>
            </div>
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0 flex sm:flex-row justify-between w-full border-t border-slate-100 dark:border-white/5 pt-4 mt-4">
          <AlertDialogCancel 
            disabled={isDeleting}
            onClick={onClose}
            className="flex-1 bg-transparent border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground text-slate-700 dark:text-foreground/80 text-sm font-semibold rounded-xl h-11 mt-0"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 hover:from-red-600 hover:to-rose-700 border-0 text-white font-semibold shadow-lg shadow-red-500/10 rounded-xl h-11"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Confirm Delete
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
