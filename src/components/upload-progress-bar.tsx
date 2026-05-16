// [PERF] Optimized: removed framer-motion — replaced with CSS transitions
"use client"

import React from 'react'
import { X, Upload, CheckCircle, XCircle, RotateCcw, Trash2 } from 'lucide-react'
import { useUpload } from './upload-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function UploadProgressBar() {
  const { uploads, cancelUpload, clearCompleted, retryUpload } = useUpload()

  // Only show if there are active uploads
  const hasActiveUploads = uploads.some(u => u.status === 'uploading' || u.status === 'pending')
  const hasCompletedUploads = uploads.some(u => u.status === 'completed')

  if (uploads.length === 0) return null

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  if (!hasActiveUploads) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-lg z-50 animate-notif-modal-enter">
      <Card className="/90 bg-background/90 border-border shadow-2xl w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Uploads</span>
            </div>
            {hasCompletedUploads && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearCompleted}
                className="h-6 w-6 p-0 text-muted-foreground hover: hover:bg-muted"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="space-y-2 animate-notif-item-enter"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground/90 truncate" title={upload.file.name}>
                      {upload.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(upload.file.size)}
                      {upload.endTime && upload.startTime && (
                        <span className="ml-2">
                          • {formatTime(upload.endTime - upload.startTime)}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {upload.status === 'uploading' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => cancelUpload(upload.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/20"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                    {upload.status === 'error' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => retryUpload(upload.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-400 hover:bg-blue-500/20"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                    {upload.status === 'completed' && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                    {upload.status === 'error' && (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`capitalize ${
                      upload.status === 'completed' ? 'text-green-400' :
                      upload.status === 'error' ? 'text-red-400' :
                      upload.status === 'uploading' ? 'text-blue-400' :
                      'text-muted-foreground'
                    }`}>
                      {upload.status}
                    </span>
                    <span className="text-muted-foreground">{upload.progress}%</span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ease-out ${
                        upload.status === 'completed' ? 'bg-green-500' :
                        upload.status === 'error' ? 'bg-red-500' :
                        'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>

                  {upload.error && (
                    <p className="text-xs text-red-400 mt-1">{upload.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}