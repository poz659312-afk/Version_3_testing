'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent
} from '@/components/ui/tooltip'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Pilcrow,
  Quote,
  FileCode,
  List,
  ListOrdered,
  ListChecks,
  Minus,
  ChevronDown,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowLeftRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Sigma,
  BarChart2,
  AlertCircle,
  Eraser,
  HelpCircle,
  Loader2,
  Undo,
  Redo,
  Sparkles,
  Eye,
  Type
} from 'lucide-react'
import { uploadSummaryImage } from '@/app/summaries/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  onChange: (value: string) => void
  onImageUploaded?: (url: string) => void
  editorDir?: 'rtl' | 'ltr'
  setEditorDir?: (dir: 'rtl' | 'ltr') => void
}

export default function EditorToolbar({
  textareaRef,
  onChange,
  onImageUploaded,
  editorDir = 'ltr',
  setEditorDir
}: EditorToolbarProps) {
  // --- Dialog & Popover States ---
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const [showMathPopover, setShowMathPopover] = useState(false)
  const [showDiagramPopover, setShowDiagramPopover] = useState(false)
  const [showCalloutPopover, setShowCalloutPopover] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)

  // --- Table Generator State ---
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)
  const [gridHoverRows, setGridHoverRows] = useState(3)
  const [gridHoverCols, setGridHoverCols] = useState(3)

  // --- Image Formatter & Upload State ---
  const [isUploading, setIsUploading] = useState(false)
  const [imageSourceType, setImageSourceType] = useState<'upload' | 'url'>('upload')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('Image description')
  const [imageWidth, setImageWidth] = useState('400px')
  const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>('center')

  // --- Link Insertion State ---
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  // --- Track Selection Range to prevent losing cursor state ---
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 })

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const saveSelection = () => {
      if (document.activeElement === textarea) {
        selectionRef.current = {
          start: textarea.selectionStart,
          end: textarea.selectionEnd
        }
      }
    }

    const events = ['keyup', 'mouseup', 'focus', 'blur', 'input', 'select']
    events.forEach((ev) => textarea.addEventListener(ev, saveSelection))

    return () => {
      events.forEach((ev) => textarea.removeEventListener(ev, saveSelection))
    }
  }, [textareaRef])

  // --- Core Smart Text Insertion Engine ---
  const insertText = useCallback(
    (
      before: string,
      after: string = '',
      defaultValue: string = '',
      selectInserted: boolean = true
    ) => {
      const textarea = textareaRef.current
      if (!textarea) return

      let startPos = textarea.selectionStart
      let endPos = textarea.selectionEnd

      // Fallback to tracked selection if focus shifted to popover/dialog
      if (document.activeElement !== textarea) {
        startPos = selectionRef.current.start
        endPos = selectionRef.current.end
      }

      const currentVal = textarea.value
      const selectedText = currentVal.substring(startPos, endPos)
      const middleText = selectedText || defaultValue
      const textToInsert = before + middleText + after

      const newValue =
        currentVal.substring(0, startPos) +
        textToInsert +
        currentVal.substring(endPos)

      onChange(newValue)

      // Calculate cursor / selection positions
      let newStart = startPos + before.length
      let newEnd = newStart + middleText.length

      if (!selectedText && !selectInserted) {
        newStart = startPos + textToInsert.length
        newEnd = newStart
      }

      selectionRef.current = { start: newStart, end: newEnd }

      // Focus back and highlight inserted placeholder or restore cursor
      requestAnimationFrame(() => {
        textarea.focus()
        textarea.setSelectionRange(newStart, newEnd)
        textarea.dispatchEvent(new Event('input', { bubbles: true }))
      })
    },
    [textareaRef, onChange]
  )

  // --- Undo & Redo Handlers ---
  const handleUndo = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    try {
      document.execCommand('undo')
      onChange(textarea.value)
    } catch {
      toast.error('Undo not supported')
    }
  }, [textareaRef, onChange])

  const handleRedo = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.focus()
    try {
      document.execCommand('redo')
      onChange(textarea.value)
    } catch {
      toast.error('Redo not supported')
    }
  }, [textareaRef, onChange])

  // --- Strip Formatting Helper ---
  const handleClearFormatting = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    let startPos = textarea.selectionStart
    let endPos = textarea.selectionEnd
    if (document.activeElement !== textarea) {
      startPos = selectionRef.current.start
      endPos = selectionRef.current.end
    }

    const currentVal = textarea.value
    const selectedText = currentVal.substring(startPos, endPos)
    if (!selectedText) {
      toast.info('Select text to clear formatting')
      return
    }

    // Strip common Markdown formatting
    const cleanedText = selectedText
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/<u>(.*?)<\/u>/gi, '$1')
      .replace(/<mark>(.*?)<\/mark>/gi, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/^-\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')

    const newValue =
      currentVal.substring(0, startPos) + cleanedText + currentVal.substring(endPos)

    onChange(newValue)
    toast.success('Formatting cleared from selection')
  }, [textareaRef, onChange])

  // --- Image File Upload Handler ---
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const uploadToast = toast.loading('Uploading image to cloud storage...')

    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string
        const publicUrl = await uploadSummaryImage(base64String, file.name)

        setImageUrl(publicUrl)
        setImageSourceType('url')
        if (onImageUploaded) {
          onImageUploaded(publicUrl)
        }
        toast.dismiss(uploadToast)
        toast.success('Image uploaded successfully!')
      } catch (err) {
        console.error('Upload error:', err)
        toast.dismiss(uploadToast)
        toast.error('Failed to upload to cloud bucket. Using local preview.')
        const base64String = reader.result as string
        setImageUrl(base64String)
        setImageSourceType('url')
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // --- Apply & Insert Image ---
  const handleInsertImage = () => {
    if (!imageUrl.trim()) {
      toast.error('Please provide an image URL or upload a file')
      return
    }

    const hashParams = `w=${imageWidth}&align=${imageAlign}`
    const finalUrl = `${imageUrl.trim()}#${hashParams}`

    insertText(`![${imageAlt || 'Image'}](`, `)`, finalUrl)

    // Reset Form
    setImageUrl('')
    setImageAlt('Image description')
    setShowImageDialog(false)
    toast.success('Image inserted with custom sizing!')
  }

  // --- Generate Markdown Table ---
  const handleGenerateTable = (rows: number, cols: number) => {
    if (rows <= 0 || cols <= 0) {
      toast.error('Rows and columns must be at least 1')
      return
    }

    let tableMd = '\n'
    tableMd += '|'
    for (let c = 1; c <= cols; c++) {
      tableMd += ` Header ${c} |`
    }
    tableMd += '\n|'
    for (let c = 1; c <= cols; c++) {
      tableMd += ' :--- |'
    }
    tableMd += '\n'
    for (let r = 1; r <= rows; r++) {
      tableMd += '|'
      for (let c = 1; c <= cols; c++) {
        tableMd += ` Cell ${r}.${c} |`
      }
      tableMd += '\n'
    }
    tableMd += '\n'

    insertText(tableMd, '', '', false)
    setShowTableDialog(false)
    toast.success(`Table (${rows}x${cols}) inserted!`)
  }

  // --- Insert Link Handler ---
  const handleInsertLink = () => {
    const url = linkUrl.trim() || 'https://example.com'
    const title = linkTitle.trim() || 'Link Text'
    insertText(`[${title}](`, ')', url)
    setLinkTitle('')
    setLinkUrl('')
    setShowLinkPopover(false)
    toast.success('Link inserted!')
  }

  // --- Snippet Presets Data ---
  const fontFamilies = [
    { name: 'Cairo (Arabic Headers)', value: 'cairo' },
    { name: 'Outfit (Modern Clean)', value: 'outfit' },
    { name: 'Rubik (Sans-Serif)', value: 'rubik' },
    { name: 'Noto Arabic (Traditional)', value: 'noto' },
    { name: 'Rock Salt (Comic/Hand)', value: 'rock-salt' },
    { name: 'Monospace (Code Focus)', value: 'mono' }
  ]

  const fontSizes = [
    { name: 'Small (12px)', value: 'sm' },
    { name: 'Normal (16px)', value: '' },
    { name: 'Medium (20px)', value: 'md' },
    { name: 'Large (24px)', value: 'lg' },
    { name: 'Huge (32px)', value: 'xl' }
  ]

  const fontColors = [
    { name: 'Default White', value: '', hex: '#ffffff' },
    { name: 'Violet Glow', value: 'violet', hex: '#c084fc' },
    { name: 'Fuchsia Glow', value: 'fuchsia', hex: '#f472b6' },
    { name: 'Electric Blue', value: 'blue', hex: '#60a5fa' },
    { name: 'Emerald Mint', value: 'emerald', hex: '#34d399' },
    { name: 'Sunset Gold', value: 'gold', hex: '#fbbf24' },
    { name: 'Neon Red', value: 'red', hex: '#f87171' },
    { name: 'Cyan Spark', value: 'cyan', hex: '#38bdf8' },
    { name: 'Rose Pink', value: 'rose', hex: '#fb7185' }
  ]

  const mathCategories = [
    {
      category: 'Basic Formulas',
      items: [
        { name: 'Inline Math', before: '$', after: '$', default: 'f(x) = x^2' },
        { name: 'Block Formula', before: '\n$$\n', after: '\n$$\n', default: 'f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx' }
      ]
    },
    {
      category: 'Calculus & Operations',
      items: [
        { name: 'Fraction', before: '\\frac{', after: '}{b}', default: 'a' },
        { name: 'Square Root', before: '\\sqrt{', after: '}', default: 'x' },
        { name: 'Summation', before: '\\sum_{i=1}^{', after: '} x_i', default: 'n' },
        { name: 'Integral', before: '\\int_{', after: '}^{b} f(x) dx', default: 'a' },
        { name: 'Limit', before: '\\lim_{x \\to ', after: '} f(x)', default: '\\infty' },
        { name: 'Partial Derivative', before: '\\frac{\\partial ', after: '}{\\partial x}', default: 'y' }
      ]
    },
    {
      category: 'Greek Letters',
      items: [
        { name: 'Alpha (α)', before: '\\alpha', after: '', default: '' },
        { name: 'Beta (β)', before: '\\beta', after: '', default: '' },
        { name: 'Gamma (γ)', before: '\\gamma', after: '', default: '' },
        { name: 'Theta (θ)', before: '\\theta', after: '', default: '' },
        { name: 'Lambda (λ)', before: '\\lambda', after: '', default: '' },
        { name: 'Pi (π)', before: '\\pi', after: '', default: '' },
        { name: 'Sigma (σ)', before: '\\sigma', after: '', default: '' },
        { name: 'Infinity (∞)', before: '\\infty', after: '', default: '' }
      ]
    }
  ]

  const diagramPresets = [
    {
      name: 'Flowchart (Top-Down)',
      desc: 'Process & decision flow',
      code: '\n```mermaid\ngraph TD\n    A[Start] --> B[Process]\n    B --> C{Decision}\n    C -->|Yes| D[Result 1]\n    C -->|No| E[Result 2]\n```\n'
    },
    {
      name: 'Flowchart (Left-Right)',
      desc: 'Horizontal progression',
      code: '\n```mermaid\ngraph LR\n    A[Step 1] --> B[Step 2]\n    B --> C[Step 3]\n    C --> D[Done]\n```\n'
    },
    {
      name: 'Sequence Diagram',
      desc: 'Interactions over time',
      code: '\n```mermaid\nsequenceDiagram\n    User->>Client: Request Data\n    Client->>Server: API Call\n    Server-->>Client: JSON Response\n    Client-->>User: Render UI\n```\n'
    },
    {
      name: 'Pie Chart',
      desc: 'Proportional breakdown',
      code: '\n```mermaid\npie title Data Distribution\n    "Category A" : 45\n    "Category B" : 30\n    "Category C" : 25\n```\n'
    },
    {
      name: 'Bar / Line Chart',
      desc: 'XY coordinates & values',
      code: '\n```mermaid\nxychart-beta\n    title "Performance Metric"\n    x-axis [Mon, Tue, Wed, Thu, Fri]\n    y-axis "Score" 0 --> 100\n    bar [50, 70, 85, 60, 95]\n    line [50, 70, 85, 60, 95]\n```\n'
    },
    {
      name: 'Mindmap',
      desc: 'Hierarchical concept map',
      code: '\n```mermaid\nmindmap\n  root((Summary Overview))\n    Key Points\n      Topic 1\n      Topic 2\n    Resources\n      Links\n      Docs\n```\n'
    }
  ]

  const calloutPresets = [
    { type: 'NOTE', icon: 'ℹ️', label: 'Note Callout', color: 'border-blue-500/50 text-blue-400', template: '\n> [!NOTE]\n> Write helpful note context here.\n' },
    { type: 'TIP', icon: '💡', label: 'Tip Callout', color: 'border-emerald-500/50 text-emerald-400', template: '\n> [!TIP]\n> Add a pro-tip or best practice here.\n' },
    { type: 'IMPORTANT', icon: '📌', label: 'Important Callout', color: 'border-purple-500/50 text-purple-400', template: '\n> [!IMPORTANT]\n> Key information that must be read.\n' },
    { type: 'WARNING', icon: '⚠️', label: 'Warning Callout', color: 'border-amber-500/50 text-amber-400', template: '\n> [!WARNING]\n> Potential issue or warning alert.\n' },
    { type: 'CAUTION', icon: '🚨', label: 'Caution Callout', color: 'border-red-500/50 text-red-400', template: '\n> [!CAUTION]\n> High risk or destructive action warning.\n' }
  ]

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/10 bg-zinc-950/90 backdrop-blur-md rounded-t-xl text-gray-200 select-none">
        
        {/* --- GROUP 1: History / Undo & Redo --- */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleUndo()
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <Undo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Undo (Ctrl+Z)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleRedo()
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <Redo className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Redo (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-4 w-px bg-white/10 my-auto mx-1 shrink-0" />

        {/* --- GROUP 2: Inline Formatting --- */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('**', '**', 'bold text')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <Bold className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Bold (**text**)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('*', '*', 'italic text')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <Italic className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Italic (*text*)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('<u>', '</u>', 'underlined text')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <Underline className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Underline (&lt;u&gt;text&lt;/u&gt;)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('~~', '~~', 'strikethrough text')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <Strikethrough className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Strikethrough (~~text~~)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('`', '`', 'code')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md font-mono"
              >
                <Code className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Inline Code (`code`)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('<mark>', '</mark>', 'highlighted text')
                }}
                className="h-8 w-8 text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10 rounded-md"
              >
                <Highlighter className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Highlight Marker (&lt;mark&gt;)</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-4 w-px bg-white/10 my-auto mx-1 shrink-0" />

        {/* --- GROUP 3: Headings & Block Dropdown --- */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-gray-300 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1 border border-white/5"
                >
                  <Type className="w-3.5 h-3.5 text-violet-400" />
                  <span>Headings</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Text Headings & Blocks</TooltipContent>
          </Tooltip>
          <DropdownMenuContent className="w-48 bg-zinc-950 border-white/10 text-white p-1 z-50">
            <DropdownMenuLabel className="text-[10px] text-gray-500 uppercase tracking-wider px-2 py-1">Headings</DropdownMenuLabel>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault()
                insertText('# ', '\n', 'Heading 1', false)
              }}
              className="flex items-center gap-2 text-xs font-bold text-violet-300 cursor-pointer focus:bg-violet-600/30"
            >
              <Heading1 className="w-4 h-4" />
              Heading 1 (H1)
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault()
                insertText('## ', '\n', 'Heading 2', false)
              }}
              className="flex items-center gap-2 text-xs font-semibold text-purple-300 cursor-pointer focus:bg-violet-600/30"
            >
              <Heading2 className="w-4 h-4" />
              Heading 2 (H2)
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault()
                insertText('### ', '\n', 'Heading 3', false)
              }}
              className="flex items-center gap-2 text-xs text-indigo-300 cursor-pointer focus:bg-violet-600/30"
            >
              <Heading3 className="w-4 h-4" />
              Heading 3 (H3)
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault()
                insertText('#### ', '\n', 'Heading 4', false)
              }}
              className="flex items-center gap-2 text-xs text-blue-300 cursor-pointer focus:bg-violet-600/30"
            >
              <Heading4 className="w-4 h-4" />
              Heading 4 (H4)
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuLabel className="text-[10px] text-gray-500 uppercase tracking-wider px-2 py-1">Blocks</DropdownMenuLabel>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault()
                insertText('> ', '\n', 'Quote text', false)
              }}
              className="flex items-center gap-2 text-xs cursor-pointer focus:bg-violet-600/30"
            >
              <Quote className="w-4 h-4 text-emerald-400" />
              Blockquote
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault()
                insertText('\n```javascript\n', '\n```\n', '// Write code here')
              }}
              className="flex items-center gap-2 text-xs cursor-pointer focus:bg-violet-600/30"
            >
              <FileCode className="w-4 h-4 text-amber-400" />
              Code Block (JS)
            </DropdownMenuItem>
            <DropdownMenuItem
              onMouseDown={(e) => {
                e.preventDefault()
                insertText('<details>\n<summary>Spoiler Title</summary>\n\n', '\n\n</details>\n', 'Hidden details content')
              }}
              className="flex items-center gap-2 text-xs cursor-pointer focus:bg-violet-600/30"
            >
              <Eye className="w-4 h-4 text-fuchsia-400" />
              Spoiler / Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* --- GROUP 4: Lists & Rules --- */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('- ', '', 'List item', false)
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <List className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Bullet List (- item)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('1. ', '', 'Numbered item', false)
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Numbered List (1. item)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('- [ ] ', '', 'Task item', false)
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <ListChecks className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Task Checklist (- [ ] item)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('\n---\n', '', '', false)
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Horizontal Line (---)</TooltipContent>
          </Tooltip>
        </div>

        <div className="h-4 w-px bg-white/10 my-auto mx-1 shrink-0" />

        {/* --- GROUP 5: Typography & Colors --- */}

        {/* Font Family Selector */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-gray-300 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1 border border-white/5"
                >
                  <span>Font</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Font Family</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-56 bg-zinc-950 border-white/10 text-white p-1 z-50 flex flex-col gap-0.5" align="start">
            <div className="px-2 py-1 text-[10px] text-gray-500 font-bold uppercase">Select Font Family</div>
            {fontFamilies.map((font, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText(`<span data-font="${font.value}">`, '</span>', 'styled text')
                }}
                className="justify-start text-xs hover:bg-violet-600 focus:bg-violet-600 text-left h-8 font-normal text-gray-300 hover:text-white border-none"
              >
                {font.name}
              </Button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Font Size Selector */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-gray-300 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1 border border-white/5"
                >
                  <span>Size</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Text Size</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-48 bg-zinc-950 border-white/10 text-white p-1 z-50 flex flex-col gap-0.5" align="start">
            <div className="px-2 py-1 text-[10px] text-gray-500 font-bold uppercase">Select Text Size</div>
            {fontSizes.map((size, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                onMouseDown={(e) => {
                  e.preventDefault()
                  if (size.value) {
                    insertText(`<span data-size="${size.value}">`, '</span>', 'sized text')
                  } else {
                    insertText('<span>', '</span>', 'normal text')
                  }
                }}
                className="justify-start text-xs hover:bg-violet-600 focus:bg-violet-600 text-left h-8 font-normal text-gray-300 hover:text-white border-none"
              >
                {size.name}
              </Button>
            ))}
          </PopoverContent>
        </Popover>

        {/* Text Color Picker */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-gray-300 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1 border border-white/5"
                >
                  <Palette className="w-3.5 h-3.5 text-fuchsia-400" />
                  <span>Color</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Text Color Palette</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-56 bg-zinc-950 border-white/10 text-white p-2 z-50 flex flex-col gap-1" align="start">
            <div className="text-[10px] text-gray-500 font-bold uppercase px-1">Select Text Color</div>
            <div className="grid grid-cols-1 gap-0.5">
              {fontColors.map((color, idx) => (
                <Button
                  key={idx}
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    if (color.value) {
                      insertText(`<span data-color="${color.value}">`, '</span>', 'colored text')
                    } else {
                      insertText('<span>', '</span>', 'white text')
                    }
                  }}
                  className="justify-start text-xs hover:bg-violet-600/40 text-left h-8 font-normal text-gray-300 hover:text-white flex items-center gap-2 border-none px-2 rounded-md"
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-4 w-px bg-white/10 my-auto mx-1 shrink-0" />

        {/* --- GROUP 6: Alignment & Direction --- */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('<div style="text-align: left">\n', '\n</div>', 'left text')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Align Left</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('<div style="text-align: center">\n', '\n</div>', 'centered text')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Align Center</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('<div style="text-align: right">\n', '\n</div>', 'right text')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Align Right</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText('<div style="text-align: justify">\n', '\n</div>', 'justified text')
                }}
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
              >
                <AlignJustify className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Align Justify</TooltipContent>
          </Tooltip>
        </div>

        {/* RTL / LTR Toggle */}
        {setEditorDir && (
          <>
            <div className="h-4 w-px bg-white/10 my-auto mx-1 shrink-0" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    setEditorDir(editorDir === 'rtl' ? 'ltr' : 'rtl')
                  }}
                  className="h-8 text-xs text-gray-300 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1.5 border border-white/5"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[10px] font-mono text-gray-400">Dir:</span>
                  <span className="text-[10px] font-bold font-mono text-violet-300 uppercase">
                    {editorDir}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Toggle Typing Direction (RTL / LTR)</TooltipContent>
            </Tooltip>
          </>
        )}

        <div className="h-4 w-px bg-white/10 my-auto mx-1 shrink-0" />

        {/* --- GROUP 7: Media & Advanced Helpers --- */}

        {/* Link Popover */}
        <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
                >
                  <LinkIcon className="w-4 h-4 text-blue-400" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Insert Hyperlink</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-72 bg-zinc-950 border-white/10 text-white p-3 rounded-xl shadow-2xl z-50 space-y-3">
            <div className="font-bold text-xs text-blue-300 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4" /> Insert Hyperlink
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-[10px] text-gray-400">Link Title</Label>
                <Input
                  placeholder="e.g. Documentation"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="h-8 bg-white/5 border-white/10 text-xs text-white rounded-md mt-1"
                />
              </div>
              <div>
                <Label className="text-[10px] text-gray-400">Target URL</Label>
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 bg-white/5 border-white/10 text-xs text-white rounded-md mt-1"
                />
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleInsertLink}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg py-1.5"
            >
              Insert Link
            </Button>
          </PopoverContent>
        </Popover>

        {/* Image Dialog */}
        <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Format & Insert Image</TooltipContent>
          </Tooltip>
          <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-md z-50">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-violet-400">
                <ImageIcon className="w-5 h-5" />
                Format & Upload Image
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                Upload image files to cloud storage or insert external URLs with custom sizing & alignment.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Upload vs URL Tabs */}
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setImageSourceType('upload')}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                    imageSourceType === 'upload' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  )}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageSourceType('url')}
                  className={cn(
                    'flex-1 py-1.5 text-xs font-semibold rounded-md transition-all',
                    imageSourceType === 'url' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                  )}
                >
                  External URL
                </button>
              </div>

              {imageSourceType === 'upload' ? (
                <div className="space-y-2">
                  <Label className="text-xs text-gray-400">Choose Image File</Label>
                  <input
                    type="file"
                    id="toolbar-image-picker"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleImageFileChange}
                  />
                  <Button
                    type="button"
                    disabled={isUploading}
                    onClick={() => document.getElementById('toolbar-image-picker')?.click()}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl py-5 font-bold flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        Uploading Image...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        Browse & Upload
                      </>
                    )}
                  </Button>
                  {imageUrl && (
                    <p className="text-[10px] text-emerald-400 font-mono break-all truncate">
                      Ready: {imageUrl}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="image-url-input" className="text-xs text-gray-400">Direct Image URL</Label>
                  <Input
                    id="image-url-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-lg"
                  />
                </div>
              )}

              {/* Alt Text */}
              <div className="space-y-1.5">
                <Label htmlFor="image-alt-input" className="text-xs text-gray-400">Alt Text (Accessibility & Caption)</Label>
                <Input
                  id="image-alt-input"
                  placeholder="e.g. Diagram of cellular respiration"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="bg-white/5 border-white/10 text-white text-xs rounded-lg"
                />
              </div>

              {/* Size / Width */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Image Width</Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['200px', '300px', '400px', '500px', '100%'].map((w) => (
                    <button
                      type="button"
                      key={w}
                      onClick={() => setImageWidth(w)}
                      className={cn(
                        'py-1 text-[10px] font-bold rounded border transition-all',
                        imageWidth === w
                          ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                      )}
                    >
                      {w === '100%' ? 'Full' : w}
                    </button>
                  ))}
                </div>
                <Input
                  placeholder="Custom width (e.g. 250px or 60%)"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value)}
                  className="h-8 bg-white/5 border-white/10 text-white text-xs rounded-lg mt-1"
                />
              </div>

              {/* Alignment */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Position & Text Wrapping</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageAlign('left')}
                    className={cn(
                      'py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center gap-0.5 transition-all',
                      imageAlign === 'left'
                        ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                    )}
                  >
                    <span>Left Float</span>
                    <span className="text-[9px] font-normal text-gray-500">(Wrap right)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlign('center')}
                    className={cn(
                      'py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center gap-0.5 transition-all',
                      imageAlign === 'center'
                        ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                    )}
                  >
                    <span>Center Block</span>
                    <span className="text-[9px] font-normal text-gray-500">(No wrap)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageAlign('right')}
                    className={cn(
                      'py-2 px-2 text-xs font-bold rounded-lg border flex flex-col items-center gap-0.5 transition-all',
                      imageAlign === 'right'
                        ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                        : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                    )}
                  >
                    <span>Right Float</span>
                    <span className="text-[9px] font-normal text-gray-500">(Wrap left)</span>
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={handleInsertImage}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl py-2"
              >
                Apply & Insert Image
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Table Dialog & Matrix Builder */}
        <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
                >
                  <TableIcon className="w-4 h-4 text-purple-400" />
                </Button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Build Table Structure</TooltipContent>
          </Tooltip>
          <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-sm z-50">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-purple-400">
                <TableIcon className="w-5 h-5" />
                Build Custom Table
              </DialogTitle>
              <DialogDescription className="text-gray-400 text-xs">
                Hover matrix grid or specify rows and columns.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Visual Matrix Hover Grid (10x8 max) */}
              <div className="space-y-1.5 text-center">
                <Label className="text-xs text-gray-400">
                  Quick Select: <span className="font-bold text-violet-300">{gridHoverRows} x {gridHoverCols}</span> Table
                </Label>
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center gap-1">
                  {Array.from({ length: 6 }).map((_, rIdx) => (
                    <div key={rIdx} className="flex gap-1">
                      {Array.from({ length: 8 }).map((_, cIdx) => {
                        const isHovered = rIdx + 1 <= gridHoverRows && cIdx + 1 <= gridHoverCols
                        return (
                          <div
                            key={cIdx}
                            onMouseEnter={() => {
                              setGridHoverRows(rIdx + 1)
                              setGridHoverCols(cIdx + 1)
                            }}
                            onClick={() => {
                              handleGenerateTable(rIdx + 1, cIdx + 1)
                            }}
                            className={cn(
                              'w-5 h-5 rounded-sm border cursor-pointer transition-all',
                              isHovered
                                ? 'bg-violet-500 border-violet-300 shadow-sm scale-105'
                                : 'bg-zinc-900 border-white/10 hover:border-violet-500/50'
                            )}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/10" />
                <span className="flex-shrink mx-2 text-[10px] text-gray-500 uppercase font-mono">Or specify numbers</span>
                <div className="flex-grow border-t border-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rows-input" className="text-xs text-gray-400">Rows</Label>
                  <Input
                    id="rows-input"
                    type="number"
                    min={1}
                    max={20}
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="cols-input" className="text-xs text-gray-400">Columns</Label>
                  <Input
                    id="cols-input"
                    type="number"
                    min={1}
                    max={15}
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                    className="bg-white/5 border-white/10 text-white text-xs rounded-lg mt-1"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                onClick={() => handleGenerateTable(tableRows, tableCols)}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-bold rounded-xl py-2"
              >
                Generate & Insert Table
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Math / LaTeX Assistant */}
        <Popover open={showMathPopover} onOpenChange={setShowMathPopover}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-violet-500/40 text-violet-300 hover:text-white hover:bg-violet-600/20 flex items-center gap-1 px-2.5 rounded-md text-xs font-semibold"
                >
                  <Sigma className="w-3.5 h-3.5" />
                  <span>Math (LaTeX)</span>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">LaTeX Math Equations Assistant</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 bg-zinc-950 border-white/10 p-3 text-white rounded-xl shadow-2xl z-50 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="font-bold text-xs text-violet-300 flex items-center gap-1.5">
                <Sigma className="w-4 h-4 text-violet-400" />
                Equation & Symbol Snippets
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">$...$ or $$...$$</span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {mathCategories.map((cat, cIdx) => (
                <div key={cIdx} className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{cat.category}</div>
                  <div className="grid grid-cols-2 gap-1">
                    {cat.items.map((item, iIdx) => (
                      <Button
                        key={iIdx}
                        type="button"
                        size="sm"
                        variant="ghost"
                        onMouseDown={(e) => {
                          e.preventDefault()
                          insertText(item.before, item.after, item.default)
                          setShowMathPopover(false)
                        }}
                        className="justify-start text-[11px] text-gray-300 hover:text-white hover:bg-violet-600/30 rounded-md font-mono py-1 px-2 h-auto text-left"
                      >
                        {item.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Diagrams & Charts Popover */}
        <Popover open={showDiagramPopover} onOpenChange={setShowDiagramPopover}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-fuchsia-500/40 text-fuchsia-300 hover:text-white hover:bg-fuchsia-600/20 flex items-center gap-1 px-2.5 rounded-md text-xs font-semibold"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Diagrams</span>
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Mermaid Diagrams & Charts</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 bg-zinc-950 border-white/10 p-3 text-white rounded-xl shadow-2xl z-50 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="font-bold text-xs text-fuchsia-300 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-fuchsia-400" />
                Mermaid Diagram Presets
              </h4>
              <span className="text-[10px] text-gray-500 font-mono">Live Rendered</span>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {diagramPresets.map((diag, dIdx) => (
                <button
                  key={dIdx}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertText(diag.code, '', '', false)
                    setShowDiagramPopover(false)
                    toast.success(`${diag.name} inserted!`)
                  }}
                  className="w-full text-left p-2 rounded-lg bg-white/5 hover:bg-fuchsia-600/20 border border-white/5 hover:border-fuchsia-500/40 transition-all group"
                >
                  <div className="text-xs font-bold text-gray-200 group-hover:text-fuchsia-300">{diag.name}</div>
                  <div className="text-[10px] text-gray-400">{diag.desc}</div>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Callout Alerts Popover */}
        <Popover open={showCalloutPopover} onOpenChange={setShowCalloutPopover}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-amber-400 hover:text-white hover:bg-white/10 rounded-md"
                >
                  <AlertCircle className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">GitHub Callout Alerts</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 bg-zinc-950 border-white/10 p-2 text-white rounded-xl shadow-2xl z-50 space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase">Insert Callout Alert</div>
            {calloutPresets.map((call, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  insertText(call.template, '', '', false)
                  setShowCalloutPopover(false)
                }}
                className={cn(
                  'w-full text-left px-2.5 py-1.5 rounded-md border flex items-center gap-2 text-xs font-semibold transition-all hover:bg-white/10',
                  call.color
                )}
              >
                <span>{call.icon}</span>
                <span>{call.label}</span>
              </button>
            ))}
          </PopoverContent>
        </Popover>

        <div className="h-4 w-px bg-white/10 my-auto mx-1 shrink-0" />

        {/* --- GROUP 8: Utilities & Help --- */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleClearFormatting()
                }}
                className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Clear Formatting from Selection</TooltipContent>
          </Tooltip>

          <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
                  >
                    <HelpCircle className="w-4 h-4 text-violet-400" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Markdown Shortcuts & Documentation</TooltipContent>
            </Tooltip>
            <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-lg z-50">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-violet-400">
                  <Sparkles className="w-5 h-5" />
                  Editor Markdown Cheat Sheet
                </DialogTitle>
                <DialogDescription className="text-gray-400 text-xs">
                  Quick reference for keyboard shortcuts and supported formatting syntax.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs max-h-80 overflow-y-auto pr-1">
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                  <div className="font-bold text-violet-300">Basic Formatting</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px] font-mono text-gray-300">
                    <div><code>**bold**</code> → <strong>bold</strong></div>
                    <div><code>*italic*</code> → <em>italic</em></div>
                    <div><code>~~strikethrough~~</code> → <del>strike</del></div>
                    <div><code>`code`</code> → <code>code</code></div>
                    <div><code>&lt;u&gt;underline&lt;/u&gt;</code> → <u>underline</u></div>
                    <div><code>&lt;mark&gt;highlight&lt;/mark&gt;</code> → <mark className="bg-amber-400/30 text-amber-200 px-1 rounded">marker</mark></div>
                  </div>
                </div>

                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                  <div className="font-bold text-violet-300">Math & LaTeX Equations</div>
                  <p className="text-gray-400 text-[11px]">
                    Wrap inline equations in <code>$e = mc^2$</code> and block formulas in <code>$$\n \int f(x) dx \n$$</code>.
                  </p>
                </div>

                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                  <div className="font-bold text-violet-300">Mermaid Diagrams</div>
                  <p className="text-gray-400 text-[11px]">
                    Wrap diagram code in <code>```mermaid ... ```</code> block. Supported types include Flowcharts, Sequence Diagrams, Pie Charts, XY Charts, and Mindmaps.
                  </p>
                </div>

                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl space-y-1.5">
                  <div className="font-bold text-violet-300">Images & Custom Sizing</div>
                  <p className="text-gray-400 text-[11px]">
                    Format: <code>![Alt Text](URL#w=300px&align=center)</code>. Alignment options: <code>left</code>, <code>center</code>, <code>right</code>.
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => setShowHelpDialog(false)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl py-2"
                >
                  Close Documentation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

      </div>
    </TooltipProvider>
  )
}
