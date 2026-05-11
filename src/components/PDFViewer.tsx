"use client"

import type React from "react"
<<<<<<< HEAD

import { useState } from "react"
=======
import { useState, useEffect, useRef, useCallback } from "react"
>>>>>>> 16d5d685 (Performance optimizations)
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Upload, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

<<<<<<< HEAD
export default function PDFViewer() {
  const [pdfUrl, setPdfUrl] = useState("")
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
=======
// Import pdfjs-dist
import * as pdfjsLib from "pdfjs-dist"

// Initialize the worker without blocking the main thread
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

export default function PDFViewer() {
  const [pdfUrl, setPdfUrl] = useState("")
  const [zoom, setZoom] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)
>>>>>>> 16d5d685 (Performance optimizations)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
    }
  }

<<<<<<< HEAD
=======
  // Memoize the document loading process
  useEffect(() => {
    if (!pdfUrl) return
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const doc = await loadingTask.promise
        setPdfDoc(doc)
      } catch (error) {
        console.error("Error loading PDF:", error)
      }
    }
    loadPdf()
  }, [pdfUrl])

  // Memoize the rendering process
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return

    try {
      const page = await pdfDoc.getPage(1) // Render first page for preview
      const viewport = page.getViewport({ scale: zoom, rotation })
      
      const canvas = canvasRef.current
      const context = canvas.getContext("2d", { alpha: false }) // Optimize canvas context
      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      }

      // Cancel previous render task if it exists
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }

      renderTaskRef.current = page.render(renderContext)
      await renderTaskRef.current.promise
    } catch (error: any) {
      if (error?.name !== "RenderingCancelledException") {
        console.error("Error rendering PDF page:", error)
      }
    }
  }, [pdfDoc, zoom, rotation])

  useEffect(() => {
    renderPage()
  }, [renderPage])

>>>>>>> 16d5d685 (Performance optimizations)
  return (
    <div className="h-full flex flex-col">
      <Card className="bg-white/[0.02] border-white/[0.08] backdrop-blur-lg flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className=" flex items-center gap-3">
            <FileText className="w-6 h-6" />
<<<<<<< HEAD
            PDF Viewer
=======
            PDF Viewer Preview
>>>>>>> 16d5d685 (Performance optimizations)
          </CardTitle>

          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="bg-white/[0.05] border-white/[0.15] "
              />
            </div>

            {pdfUrl && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
<<<<<<< HEAD
                  onClick={() => setZoom(Math.max(50, zoom - 25))}
=======
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
>>>>>>> 16d5d685 (Performance optimizations)
                  className="border-white/[0.15]  hover:bg-white/[0.05]"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
<<<<<<< HEAD
                  onClick={() => setZoom(Math.min(200, zoom + 25))}
=======
                  onClick={() => setZoom(Math.min(3.0, zoom + 0.25))}
>>>>>>> 16d5d685 (Performance optimizations)
                  className="border-white/[0.15]  hover:bg-white/[0.05]"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="border-white/[0.15]  hover:bg-white/[0.05]"
                >
                  <RotateCw className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

<<<<<<< HEAD
        <CardContent className="flex-1 flex flex-col">
=======
        <CardContent className="flex-1 flex flex-col overflow-auto relative items-center justify-center">
>>>>>>> 16d5d685 (Performance optimizations)
          {pdfUrl ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
<<<<<<< HEAD
              className="flex-1 bg-white/[0.03] rounded-lg border border-white/[0.08] overflow-hidden"
            >
              <iframe src={`${pdfUrl}#zoom=${zoom}&rotate=${rotation}`} className="w-full h-full" title="PDF Viewer" />
=======
              className="bg-white/[0.03] rounded-lg border border-white/[0.08] overflow-auto flex items-center justify-center max-h-full p-4"
              style={{ minHeight: "300px", minWidth: "100%" }}
            >
              <canvas ref={canvasRef} className="max-w-full h-auto shadow-lg" />
>>>>>>> 16d5d685 (Performance optimizations)
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
<<<<<<< HEAD
              className="flex-1 flex items-center justify-center bg-white/[0.03] rounded-lg border-2 border-dashed border-white/[0.15]"
=======
              className="flex-1 w-full flex items-center justify-center bg-white/[0.03] rounded-lg border-2 border-dashed border-white/[0.15]"
>>>>>>> 16d5d685 (Performance optimizations)
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
