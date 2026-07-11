"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Upload, ZoomIn, ZoomOut, RotateCw, Plus, ExternalLink, Loader2 } from "lucide-react"

// Import pdfjs-dist
import * as pdfjsLib from "pdfjs-dist"

// Initialize the worker without blocking the main thread
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

interface PDFViewerProps {
  initialUrl?: string
  fileName?: string
  driveFileId?: string
  onAddToStudySpace?: () => void
}

export default function PDFViewer({ initialUrl = "", fileName = "", driveFileId = "", onAddToStudySpace }: PDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState(initialUrl)
  const [zoom, setZoom] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
    }
  }

  // Update URL if initialUrl changes
  useEffect(() => {
    if (initialUrl) {
      setPdfUrl(initialUrl)
    }
  }, [initialUrl])

  // Load the document
  useEffect(() => {
    if (!pdfUrl) return
    setLoading(true)
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const doc = await loadingTask.promise
        setPdfDoc(doc)
        setNumPages(doc.numPages)
      } catch (error) {
        console.error("Error loading PDF:", error)
      } finally {
        setLoading(false)
      }
    }
    loadPdf()
  }, [pdfUrl])

  return (
    <div className="h-full flex flex-col">
      <Card className="bg-white/[0.02] border-white/[0.08] backdrop-blur-lg flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-4 shrink-0 flex flex-row items-center justify-between flex-wrap gap-4 border-b border-white/[0.08]">
          <CardTitle className="flex items-center gap-3 max-w-[60%]">
            <FileText className="w-6 h-6 text-primary shrink-0" />
            <span className="truncate text-sm sm:text-base font-bold text-foreground">{fileName || "PDF Viewer Preview"}</span>
          </CardTitle>

          <div className="flex gap-2 items-center">
            {driveFileId && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-white/[0.15] hover:bg-white/[0.05] cursor-pointer text-xs flex items-center gap-1.5 h-9 rounded-xl text-foreground shrink-0"
              >
                <a href={`https://drive.google.com/file/d/${driveFileId}/view`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open in Drive
                </a>
              </Button>
            )}

            {onAddToStudySpace && (
              <Button
                onClick={onAddToStudySpace}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold cursor-pointer h-9 px-4 rounded-xl flex items-center gap-1.5 shadow-lg shadow-primary/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add to Study Space
              </Button>
            )}
          </div>

          <div className="flex gap-3 flex-wrap w-full">
            {!initialUrl && (
              <div className="flex-1 min-w-[200px]">
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="bg-white/[0.05] border-white/[0.15] text-xs text-foreground"
                />
              </div>
            )}

            {pdfUrl && (
              <div className="flex gap-2 w-full justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="border-white/[0.15] hover:bg-white/[0.05] cursor-pointer text-foreground"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="flex items-center text-xs font-bold text-muted-foreground px-2">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(Math.min(3.0, zoom + 0.25))}
                  className="border-white/[0.15] hover:bg-white/[0.05] cursor-pointer text-foreground"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="border-white/[0.15] hover:bg-white/[0.05] cursor-pointer text-foreground"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col items-center gap-4 bg-black/10 ss-chat-scrollbar min-h-0 relative" data-lenis-prevent>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-primary">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-xs font-bold">Loading document...</span>
              </div>
            </div>
          ) : pdfUrl && pdfDoc ? (
            <div className="w-full flex flex-col items-center gap-4 py-2">
              {Array.from({ length: numPages }, (_, index) => (
                <PDFPage
                  key={index + 1}
                  pdfDoc={pdfDoc}
                  pageNumber={index + 1}
                  zoom={zoom}
                  rotation={rotation}
                />
              ))}
            </div>
          ) : pdfUrl && !pdfDoc ? (
            <div className="flex-grow flex items-center justify-center">
              <span className="text-sm font-semibold text-muted-foreground">Unable to load PDF document</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 w-full flex items-center justify-center bg-white/[0.03] rounded-lg border-2 border-dashed border-white/[0.15]"
            >
              <div className="text-center">
                <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg mb-2">Upload a PDF file</p>
                <p className="text-muted-foreground text-sm">Drag and drop or click to browse</p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface PDFPageProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy
  pageNumber: number
  zoom: number
  rotation: number
}

function PDFPage({ pdfDoc, pageNumber, zoom, rotation }: PDFPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const render = async () => {
      if (!canvasRef.current) return
      setLoading(true)
      try {
        const page = await pdfDoc.getPage(pageNumber)
        if (!active) return

        const viewport = page.getViewport({ scale: zoom, rotation })
        const canvas = canvasRef.current
        const context = canvas.getContext("2d", { alpha: false })
        if (!context || !active) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }

        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
        }

        renderTaskRef.current = page.render(renderContext)
        await renderTaskRef.current.promise
        if (active) {
          setLoading(false)
        }
      } catch (error: any) {
        if (error?.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNumber}:`, error)
        }
      }
    }

    render()

    return () => {
      active = false
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [pdfDoc, pageNumber, zoom, rotation])

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.08] p-3 flex flex-col items-center shadow-lg relative min-h-[150px]">
      <div className="absolute top-1 right-2 text-[9px] font-black text-muted-foreground select-none">
        Page {pageNumber}
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      )}
      <canvas ref={canvasRef} className="max-w-full h-auto shadow-sm rounded-lg" />
    </div>
  )
}
