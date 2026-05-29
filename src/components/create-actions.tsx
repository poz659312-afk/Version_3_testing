"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

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
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Plus,
  FolderPlus,
  Upload,
  Loader2,
  Shield,
  AlertCircle,
  CloudUpload,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/components/ToastProvider"
import { useUpload } from "./upload-context"
import { useColorTheme } from "@/components/color-theme-provider"

interface CreateActionsProps {
  currentFolderId: string
  onFileCreated?: () => void
  userSession: { auth_id: string } | null
}

export function CreateActions({ currentFolderId, onFileCreated, userSession }: CreateActionsProps) {
  const { colorTheme } = useColorTheme()
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [uploadedCount, setUploadedCount] = useState(0)
  const [folderName, setFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [isAutoClosing, setIsAutoClosing] = useState(false)
  const [hasGoogleAuth, setHasGoogleAuth] = useState<boolean | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()
  const { uploadFile, uploads } = useUpload()

  // Set up upload refresh callback
  React.useEffect(() => {
    // This effect ensures the refresh callback is available for uploads
    // The actual callback setup happens in the upload context when uploadFile is called
  }, [onFileCreated])

  // Check if user has Google Drive authentication
  useEffect(() => {
    const checkAuthentication = async () => {
      if (!userSession?.auth_id) {
        setHasGoogleAuth(false)
        return
      }

      try {
        const response = await fetch(`/api/google-drive/check-access?authId=${userSession.auth_id}`)
        const result = await response.json()

        if (response.ok && result.hasAccess) {
          setHasGoogleAuth(true)
          setAuthError(null)
        } else {
          setHasGoogleAuth(false)
          setAuthError(result.error || 'Authentication required')
        }
      } catch (err) {
        console.error('Error checking authentication:', err)
        setHasGoogleAuth(false)
        setAuthError('Failed to check authentication status')
      }
    }

    checkAuthentication()
  }, [userSession?.auth_id])

  const handleAuthenticate = async () => {
    if (!userSession?.auth_id) return

    try {
      const response = await fetch('/api/google-drive/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authId: userSession.auth_id,
          isAdmin: true
        })
      })

      const result = await response.json()

      if (response.ok && result.data?.authUrl) {
        window.location.href = result.data.authUrl
      } else {
        throw new Error(result.error || 'Failed to get auth URL')
      }
    } catch (err) {
      console.error('Authentication error:', err)
      addToast('Failed to start authentication process', 'error')
    }
  }

  const handleCreateFolder = async () => {
    
    if (!folderName.trim()) {
      addToast("Please enter a folder name", "error")
      return
    }

    setIsCreatingFolder(true)
    try {
      const response = await fetch('/api/google-drive/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderName: folderName.trim(),
          parentFolderId: currentFolderId,
          authId: userSession?.auth_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create folder')
      }

      await response.json()
      
      addToast(`Folder "${folderName}" created successfully`, "success")
      
      // Auto-refresh immediately after successful creation
      onFileCreated?.()
      
      // Show refresh message and auto-close
      setIsAutoClosing(true)
      setTimeout(() => {
        setFolderName("")
        setShowCreateFolder(false)
        setIsAutoClosing(false)
      }, 1000)
    } catch (error) {
      console.error('Error creating folder:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder'
      
      // Check if it's an authentication error
      if (errorMessage.includes('authentication') || errorMessage.includes('auth')) {
        setHasGoogleAuth(false)
        setAuthError('Google Drive authentication required')
        addToast('Authentication required. Please connect your Google Drive.', "error")
      } else {
        addToast(errorMessage, "error")
      }
    } finally {
      setIsCreatingFolder(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file || !userSession?.auth_id) return

    try {
      await uploadFile(file, currentFolderId, userSession.auth_id, () => {
        // Auto-refresh immediately after successful upload
        onFileCreated?.()
      })
      // The upload context will handle progress and notifications
    } catch (error) {
      console.error('Error initiating upload:', error)
      // Error handling is done in the upload context
    }
  }

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setSelectedFiles(files)
      setShowUploadDialog(true)
    }
  }, [])

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadSelectedFiles = async () => {
    if (selectedFiles.length === 0 || isUploading) return

    setIsUploading(true)
    setUploadedCount(0)
    setUploadProgress({})

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const fileKey = `${file.name}-${file.size}-${i}`
        
        // Set file as starting upload
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))
        
        try {
          await handleFileUpload(file)
          
          // Mark file as completed
          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))
          setUploadedCount(prev => prev + 1)
          
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
          // Mark file as failed
          setUploadProgress(prev => ({ ...prev, [fileKey]: -1 }))
        }
      }
      
      // Close dialog and reset states
      setTimeout(() => {
        setSelectedFiles([])
        setShowUploadDialog(false)
        setUploadProgress({})
        setUploadedCount(0)
        addToast(`Successfully uploaded ${uploadedCount} file(s)`, "success")
      }, 1000)
      
    } catch (error) {
      console.error('Error uploading files:', error)
      addToast('Some files failed to upload', "error")
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Create folder in Google Drive
  const createFolder = async (folderName: string, parentId: string): Promise<string> => {
    try {
      const response = await fetch('/api/google-drive/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName,
          parentFolderId: parentId,
          authId: userSession?.auth_id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to create folder: ${folderName}`)
      }

      const result = await response.json()
      return result.id
    } catch (error) {
      console.error(`Error creating folder ${folderName}:`, error)
      throw error
    }
  }

  // Check if there are any active uploads (pending or uploading)
  const hasActiveUploads = uploads.some(upload => 
    upload.status === 'pending' || upload.status === 'uploading'
  )

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      const filesArray = Array.from(selectedFiles)
      setSelectedFiles(filesArray)
      setShowUploadDialog(true)
    }
    // Reset the input so the same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFolderChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) {
      addToast('No files selected. Please select a folder with files.', 'error')
      return
    }

    try {
      addToast('Starting folder upload...', 'info')

      console.log('Selected files count:', selectedFiles.length)

      // Get the folder name from the first file's path
      const firstFile = selectedFiles[0] as File & { webkitRelativePath?: string }
      console.log('First file:', firstFile)
      console.log('First file name:', firstFile.name)
      console.log('First file webkitRelativePath:', firstFile.webkitRelativePath)

      const relativePath = firstFile.webkitRelativePath || firstFile.name

      if (!relativePath.includes('/')) {
        // This shouldn't happen for folder uploads, but handle it
        addToast('Please select a folder, not individual files', 'error')
        return
      }

      // Extract the root folder name (e.g., "mama" from "mama/text1.txt")
      const rootFolderName = relativePath.split('/')[0]

      console.log(`Creating root folder: ${rootFolderName}`)

      // Create the root folder in the current directory
      const rootFolderId = await createFolder(rootFolderName, currentFolderId)

      addToast(`Created folder "${rootFolderName}"`, 'info')

      // Group files by their folder paths and create subfolders as needed
      const folderStructure: { [path: string]: string } = {} // path -> folderId
      folderStructure[''] = rootFolderId // root folder

      const filesArray = Array.from(selectedFiles) as (File & { webkitRelativePath?: string })[]

      // First pass: create all necessary folders
      for (const file of filesArray) {
        const relativePath = file.webkitRelativePath || file.name
        const pathParts = relativePath.split('/')

        if (pathParts.length < 2) continue // skip root level files for now

        // Remove the filename to get the folder path
        const folderPath = pathParts.slice(0, -1).join('/')
        const folderName = pathParts[pathParts.length - 2] // parent folder name

        if (!folderStructure[folderPath]) {
          // Need to create this folder
          const parentPath = pathParts.slice(0, -2).join('/')
          const parentId = folderStructure[parentPath] || rootFolderId

          console.log(`Creating subfolder: ${folderName} in parent: ${parentId}`)
          const folderId = await createFolder(folderName, parentId)
          folderStructure[folderPath] = folderId
        }
      }

      // Second pass: upload all files to their correct folders
      let uploadedCount = 0
      for (const file of filesArray) {
        console.log(`Processing file ${uploadedCount + 1}/${filesArray.length}:`, {
          name: file?.name,
          size: file?.size,
          type: file?.type,
          webkitRelativePath: file?.webkitRelativePath,
          isFile: file instanceof File,
          fileExists: !!file
        })

        if (!file || !(file instanceof File)) {
          console.error('Invalid file object:', file)
          continue
        }

        const relativePath = file.webkitRelativePath || file.name
        const pathParts = relativePath.split('/')

        let parentId: string
        if (pathParts.length < 2) {
          // File in root folder
          parentId = rootFolderId
          console.log(`Uploading root file: ${file.name} to ${parentId}`)
        } else {
          // File in subfolder
          const folderPath = pathParts.slice(0, -1).join('/')
          parentId = folderStructure[folderPath]

          if (!parentId) {
            console.error(`No parent folder found for path: ${folderPath}`)
            continue
          }

          console.log(`Uploading file: ${file.name} to folder: ${folderPath} (${parentId})`)
        }

        try {
          await uploadFile(file, parentId, userSession?.auth_id || '', () => {
            onFileCreated?.()
          })
          uploadedCount++
          console.log(`Successfully uploaded ${uploadedCount}/${filesArray.length}: ${file.name}`)
        } catch (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError)
          // Continue with other files instead of failing the entire upload
        }
      }

      addToast(`Successfully uploaded ${uploadedCount} files to "${rootFolderName}" with folder structure!`, 'success')
    } catch (error) {
      console.error('Error uploading folder:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload folder'
      addToast(`Folder upload failed: ${errorMessage}`, 'error')
    }

    // Reset the input
    if (folderInputRef.current) {
      folderInputRef.current.value = ''
    }
  }

  // Show authentication requirement if user doesn't have Google auth
  if (hasGoogleAuth === false) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-3 rounded-lg"
          >
            <div className="hover:scale-115 transition-transform flex items-center gap-1.5 font-bold">
              <Shield className="w-4 h-4" />
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-slate-200/60 dark:border-white/10 max-w-md shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl p-6">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400" />
          
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-500 dark:text-amber-400 shadow-[0_8px_30px_rgb(245,158,11,0.15)] animate-bounce duration-1000">
              <Shield className="w-6 h-6" />
            </div>
            
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl font-black italic tracking-tight bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent uppercase">
                Authentication Required
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-muted-foreground/80 font-medium mt-1">
                You need to connect your Google Drive to upload files
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="space-y-4 py-4">
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span className="text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">Individual Credentials</span>
              </div>
              <p className="text-amber-900/80 dark:text-amber-200/80 text-xs leading-relaxed">
                As an admin, you must authenticate with your own Google account. Files you upload will be owned by your Google account.
              </p>
            </div>

            {authError && (
              <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                <p className="text-red-700 dark:text-red-300 text-xs font-medium">{authError}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex sm:flex-row justify-between w-full border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="flex-1 bg-transparent border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground text-slate-700 dark:text-foreground/80 text-sm font-semibold rounded-xl h-11"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={handleAuthenticate}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-0 text-white font-semibold shadow-lg shadow-amber-500/10 rounded-xl h-11"
            >
              <Shield className="w-4 h-4 mr-2" />
              Connect Drive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Show loading state while checking authentication
  if (hasGoogleAuth === null) {
    return (
      <Button
        size="sm"
        disabled
        className="bg-muted border-border text-muted-foreground"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    )
  }

  return (
    <>
      {/* Simple dialog-based approach instead of dropdown */}
      <div className="relative flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              size="sm"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-9 px-3 rounded-lg text-white font-bold"
            >
              <div className="hover:rotate-90 transition-transform duration-300">
                <Plus className="w-4 h-4" />
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-slate-200/60 dark:border-white/10 max-w-sm shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl p-6">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary via-primary/80 to-accent" />
            
            <div className="flex flex-col items-center text-center pt-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30 flex items-center justify-center mb-4 text-primary shadow-[0_8px_30px_rgba(var(--primary),0.15)] animate-bounce duration-1000">
                <Plus className="w-6 h-6" />
              </div>
              
              <DialogHeader className="items-center text-center">
                <DialogTitle className="text-2xl font-black italic tracking-tight bg-gradient-to-r from-primary via-primary/85 to-accent bg-clip-text text-transparent uppercase">
                  Create New
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-muted-foreground/80 font-medium mt-1">
                  Choose what you&apos;d like to create
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="grid gap-3 py-4 mt-2">
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setShowCreateFolder(true)
                  }}
                  className="bg-primary/5 hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/20 border border-primary/20 hover:border-primary/45 text-slate-800 dark:text-primary hover:text-slate-900 dark:hover:text-primary-foreground/90 rounded-xl py-3 justify-start px-4 h-12 font-semibold transition-all duration-300 hover:scale-[1.02] w-full"
                  variant="outline"
                >
                  <FolderPlus className="w-5 h-5 mr-3 text-primary" />
                  New Folder
                </Button>
              </DialogClose>
              
              <DialogClose asChild>
                <Button
                  onClick={() => {
                    setShowUploadDialog(true)
                  }}
                  className="bg-accent/5 hover:bg-accent/10 dark:bg-accent/10 dark:hover:bg-accent/20 border border-accent/20 hover:border-accent/45 text-slate-800 dark:text-accent hover:text-slate-900 dark:hover:text-accent-foreground/90 rounded-xl py-3 justify-start px-4 h-12 font-semibold transition-all duration-300 hover:scale-[1.02] w-full"
                  variant="outline"
                >
                  <Upload className="w-5 h-5 mr-3 text-accent" />
                  Upload Files
                </Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>

      {/* Animated upload indicator */}
      {hasActiveUploads && (
        <div
          className="relative animate-in fade-in zoom-in duration-200"
          title={`${uploads.filter(u => u.status === 'pending' || u.status === 'uploading').length} file(s) uploading`}
        >
          <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
            <CloudUpload className="w-3 h-3 animate-spin" />
          </div>
          {/* Pulsing ring */}
          <div
            className="absolute inset-0 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-ping opacity-20"
          />
        </div>
      )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        multiple={true}
        aria-label="Upload files"
      />

      {/* Hidden folder input */}
      <input
        ref={folderInputRef}
        type="file"
        onChange={handleFolderChange}
        className="hidden"
        multiple={true}
        {...({ webkitdirectory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        aria-label="Upload folder"
      />

      {/* File Upload Dialog with Drag & Drop */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-slate-200/60 dark:border-white/10 max-w-2xl shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl p-6">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500" />
          
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-500/15 dark:to-pink-500/15 border border-purple-500/30 flex items-center justify-center mb-4 text-purple-500 dark:text-purple-400 shadow-[0_8px_30px_rgba(168,85,247,0.15)] animate-bounce duration-1000">
              <CloudUpload className="w-6 h-6" />
            </div>
            
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl font-black italic tracking-tight bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent uppercase">
                Upload Files
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-muted-foreground/80 font-medium mt-1">
                Drag and drop files here or click to browse
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="space-y-4 py-4">
            {/* Drag and Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 overflow-hidden
                ${isDragActive 
                  ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-[0_0_30px_rgba(var(--primary),0.1)]' 
                  : 'border-slate-200 dark:border-white/10 hover:border-primary/50 hover:bg-slate-50/50 dark:hover:bg-black/20'
                }
              `}
            >
              <div
                className={`space-y-4 ${isDragActive ? 'scale-105' : 'scale-100'} transition-transform duration-200`}
              >
                <div className="flex justify-center">
                  <div
                    className={`
                      w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-200
                      ${isDragActive 
                        ? 'bg-primary/20 border-primary text-primary -translate-y-1' 
                        : 'bg-slate-100 dark:bg-black/40 border-slate-200 dark:border-white/5 text-slate-500 dark:text-muted-foreground'
                      }
                    `}
                  >
                    <CloudUpload className="w-8 h-8" />
                  </div>
                </div>
                
                <div>
                  <h3 className={`text-lg font-bold mb-1 ${isDragActive ? 'text-primary' : 'text-slate-900 dark:text-slate-100'}`}>
                    {isDragActive ? 'Drop files here' : 'Select Files'}
                  </h3>
                  <p className="text-slate-500 dark:text-muted-foreground text-sm">
                    {isDragActive 
                      ? 'Release to upload files' 
                      : 'Drag and drop files here, or click to browse'
                    }
                  </p>
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="bg-transparent border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground text-slate-700 dark:text-foreground/80 rounded-xl font-semibold h-10"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
              </div>
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-foreground/70 flex justify-between items-center">
                  <span>Selected Files ({selectedFiles.length})</span>
                  {isUploading && (
                    <span className="text-xs text-primary animate-pulse font-semibold">
                      Uploading {uploadedCount}/{selectedFiles.length}
                    </span>
                  )}
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2 bg-slate-50/50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-xl p-3 custom-scrollbar">
                  {selectedFiles.map((file, index) => {
                    const fileKey = `${file.name}-${file.size}-${index}`
                    const progress = uploadProgress[fileKey]
                    const isFileUploading = progress !== undefined && progress >= 0 && progress < 100
                    const isFileCompleted = progress === 100
                    const isFileFailed = progress === -1
                    
                    return (
                      <div
                        key={fileKey}
                        className="relative animate-in fade-in slide-in-from-left-2 duration-200 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-black/20 rounded-xl border border-slate-200/50 dark:border-white/5 relative overflow-hidden">
                          {/* Progress background */}
                          {isFileUploading && (
                            <div 
                              className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          )}
                          {isFileCompleted && (
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10" />
                          )}
                          {isFileFailed && (
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10" />
                          )}
                          
                          <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                            <div className="flex-shrink-0">
                              {isFileCompleted ? (
                                <div className="w-5 h-5 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center text-green-500">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                </div>
                              ) : isFileFailed ? (
                                <div className="w-5 h-5 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </div>
                              ) : isFileUploading ? (
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                  <FileText className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-slate-500 dark:text-muted-foreground/75 font-medium">
                                  {formatFileSize(file.size)}
                                </p>
                                {isFileUploading && (
                                  <p className="text-xs text-primary font-bold">
                                    {progress}%
                                  </p>
                                )}
                                {isFileCompleted && (
                                  <p className="text-xs text-green-500 dark:text-green-400 font-bold">
                                    Completed
                                  </p>
                                )}
                                {isFileFailed && (
                                  <p className="text-xs text-red-500 dark:text-red-400 font-bold">
                                    Failed
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          {!isUploading && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="h-8 w-8 p-0 text-slate-400 dark:text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg relative z-10"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex sm:flex-row justify-between w-full border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!isUploading) {
                  setShowUploadDialog(false)
                  setSelectedFiles([])
                  setUploadProgress({})
                  setUploadedCount(0)
                }
              }}
              disabled={isUploading}
              className="flex-1 bg-transparent border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground text-slate-700 dark:text-foreground/80 text-sm font-semibold rounded-xl h-11"
            >
              {isUploading ? 'Uploading...' : 'Cancel'}
            </Button>
            <Button
              onClick={uploadSelectedFiles}
              disabled={selectedFiles.length === 0 || isUploading}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 border-0 text-white font-semibold shadow-lg shadow-purple-500/10 rounded-xl h-11"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {uploadedCount}/{selectedFiles.length} Uploaded
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>
                    Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ''}Files
                  </span>
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={showCreateFolder} onOpenChange={(open) => {
        if (!isAutoClosing) {
          setShowCreateFolder(open)
        }
      }}>
        <DialogContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-slate-200/60 dark:border-white/10 max-w-md shadow-lg dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden rounded-2xl p-6">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500" />
          
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/15 dark:to-indigo-500/15 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-500 dark:text-blue-400 shadow-[0_8px_30px_rgba(59,130,246,0.15)] animate-bounce duration-1000">
              <FolderPlus className="w-6 h-6" />
            </div>
            
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl font-black italic tracking-tight bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent uppercase">
                Create New Folder
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-muted-foreground/80 font-medium mt-1">
                Enter a name for your new folder
              </DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folderName" className="text-slate-700 dark:text-foreground/80 text-xs font-bold uppercase tracking-wider">
                Folder Name
              </Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name..."
                className="bg-slate-50/50 dark:bg-black/40 border-slate-200 dark:border-white/10 text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground/30 focus:border-blue-500/50 focus:ring-blue-500/20 h-11 rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreatingFolder) {
                    handleCreateFolder()
                  }
                }}
                disabled={isCreatingFolder || isAutoClosing}
              />
            </div>
            
            {isAutoClosing && (
              <div
                className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 animate-in fade-in slide-in-from-bottom-1 duration-200"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>The page will be refreshed for loading the new content...</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 flex sm:flex-row justify-between w-full border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!isAutoClosing) {
                  setShowCreateFolder(false)
                  setFolderName("")
                }
              }}
              disabled={isCreatingFolder || isAutoClosing}
              className="flex-1 bg-transparent border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground text-slate-700 dark:text-foreground/80 text-sm font-semibold rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={isCreatingFolder || isAutoClosing || !folderName.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 border-0 text-white font-semibold shadow-lg shadow-blue-500/10 rounded-xl h-11"
            >
              {isCreatingFolder ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Folder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
