'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem 
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Bold, Italic, Link as LinkIcon, Image as ImageIcon, 
  Table as TableIcon, List, ListOrdered, Code, Sigma, 
  HelpCircle, Type, ChevronDown, Palette, Loader2, BarChart2,
  Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react'
import { uploadSummaryImage } from '@/app/summaries/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onChange: (value: string) => void
  onImageUploaded?: (url: string) => void
  editorDir?: 'rtl' | 'ltr'
  setEditorDir?: (dir: 'rtl' | 'ltr') => void
}

export default function EditorToolbar({ 
  textareaRef, onChange, onImageUploaded, editorDir, setEditorDir 
}: EditorToolbarProps) {
  const [showMathHelper, setShowMathHelper] = useState(false)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Table Generator Form State
  const [tableRows, setTableRows] = useState(3)
  const [tableCols, setTableCols] = useState(3)

  // Image Settings Form State
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageSourceType, setImageSourceType] = useState<'upload' | 'url'>('upload')
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('Image')
  const [imageWidth, setImageWidth] = useState('400px')
  const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>('center')

  // Diagrams Helper State
  const [showDiagramHelper, setShowDiagramHelper] = useState(false)

  // Insert markdown helper function
  const insertText = (before: string, after: string = '', defaultValue: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.focus()
    const startPos = textarea.selectionStart
    const endPos = textarea.selectionEnd
    const selectedText = textarea.value.substring(startPos, endPos)
    const textToInsert = before + (selectedText || defaultValue) + after

    // Use document.execCommand first for native undo/redo and focus preservation
    try {
      textarea.focus()
      textarea.setSelectionRange(startPos, endPos)
      const success = document.execCommand('insertText', false, textToInsert)
      if (success) {
        onChange(textarea.value)
        return
      }
    } catch (e) {
      console.warn('execCommand failed, falling back to manual replacement:', e)
    }

    const newValue = 
      textarea.value.substring(0, startPos) + 
      textToInsert + 
      textarea.value.substring(endPos)

    onChange(newValue)

    // Focus and select back
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = startPos + before.length + (selectedText || defaultValue).length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  // Handle local image file upload to Supabase storage
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const uploadToast = toast.loading('Uploading image to storage...')

    const reader = new FileReader()
    reader.onloadend = async () => {
      try {
        const base64String = reader.result as string
        // Call Server Action to upload image to Supabase bucket
        const publicUrl = await uploadSummaryImage(base64String, file.name)
        
        setImageUrl(publicUrl)
        setImageSourceType('url') // Switch to URL tab to show result
        if (onImageUploaded) {
          onImageUploaded(publicUrl)
        }
        toast.dismiss(uploadToast)
        toast.success('Image uploaded successfully! You can now adjust its settings.')
      } catch (err: unknown) {
        console.error('Upload error details:', err)
        toast.dismiss(uploadToast)
        toast.error('Failed to upload image. Fallback to base64.')
        const base64String = reader.result as string
        setImageUrl(base64String)
        setImageSourceType('url')
      } finally {
        setIsUploading(false)
      }
    }
    reader.readAsDataURL(file)
  }

  // Insert image with custom width and position hash parameters
  const handleInsertImage = () => {
    if (!imageUrl) {
      toast.error('Please enter an image URL or upload a file')
      return
    }

    const hashParams = `w=${imageWidth}&align=${imageAlign}`
    const finalUrl = `${imageUrl}#${hashParams}`
    
    insertText(`![${imageAlt}](`, ')', finalUrl)
    
    // Reset state
    setImageUrl('')
    setImageAlt('Image')
    setShowImageDialog(false)
    toast.success('Image inserted successfully!')
  }

  // Generate markdown table dynamically based on rows and columns
  const handleGenerateTable = () => {
    if (tableRows <= 0 || tableCols <= 0) {
      toast.error('Rows and columns must be greater than 0')
      return
    }

    let markdownTable = '\n'
    // Header Row
    markdownTable += '|'
    for (let c = 1; c <= tableCols; c++) {
      markdownTable += ` Header ${c} |`
    }
    markdownTable += '\n|'
    // Separator Row
    for (let c = 1; c <= tableCols; c++) {
      markdownTable += ' :--- |'
    }
    markdownTable += '\n'
    // Data Rows
    for (let r = 1; r <= tableRows; r++) {
      markdownTable += '|'
      for (let c = 1; c <= tableCols; c++) {
        markdownTable += ` Cell ${r}.${c} |`
      }
      markdownTable += '\n'
    }
    markdownTable += '\n'

    insertText(markdownTable)
    setShowTableDialog(false)
    toast.success('Table template inserted!')
  }

  const mathSnippets = [
    { name: 'Inline Equation', before: '$', after: '$', default: 'f(x) = x^2' },
    { name: 'Block Equation', before: '\n$$\n', after: '\n$$\n', default: 'f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx' },
    { name: 'Fraction', before: '\\frac{', after: '}{b}', default: 'a' },
    { name: 'Square Root', before: '\\sqrt{', after: '}', default: 'x' },
    { name: 'Summation', before: '\\sum_{i=1}^{', after: '} x_i', default: 'n' },
    { name: 'Integral', before: '\\int_{', after: '}^{b} f(x) dx', default: 'a' },
    { name: 'Superscript', before: 'x^{', after: '}', default: '2' },
    { name: 'Subscript', before: 'x_{', after: '}', default: 'i' },
    { name: 'Greek Alpha', before: '\\alpha', after: '', default: '' },
    { name: 'Greek Beta', before: '\\beta', after: '', default: '' },
    { name: 'Greek Theta', before: '\\theta', after: '', default: '' },
    { name: 'Greek Pi', before: '\\pi', after: '', default: '' },
  ]

  const diagramSnippets = [
    {
      name: 'Flowchart (TD)',
      before: '\n```mermaid\ngraph TD\n    A[Start] --> B[Process]\n    B --> C{Decision}\n    C -->|Yes| D[Result 1]\n    C -->|No| E[Result 2]\n```\n',
      after: '',
      default: ''
    },
    {
      name: 'Flowchart (LR)',
      before: '\n```mermaid\ngraph LR\n    A[Start] --> B(Step 1)\n    B --> C(Step 2)\n    C --> D[Finish]\n```\n',
      after: '',
      default: ''
    },
    {
      name: 'Pie Chart',
      before: '\n```mermaid\npie title Distribution\n    "Category A" : 40\n    "Category B" : 30\n    "Category C" : 30\n```\n',
      after: '',
      default: ''
    },
    {
      name: 'Bar / XY Chart',
      before: '\n```mermaid\nxychart-beta\n    title "XY Chart"\n    x-axis [Mon, Tue, Wed, Thu, Fri]\n    y-axis "Values" 0 --> 100\n    bar [40, 60, 80, 50, 95]\n    line [40, 60, 80, 50, 95]\n```\n',
      after: '',
      default: ''
    },
    {
      name: 'Sequence Diagram',
      before: '\n```mermaid\nsequenceDiagram\n    User->>Browser: Request\n    Browser->>Server: API Call\n    Server-->>Browser: Response\n    Browser-->>User: Show Data\n```\n',
      after: '',
      default: ''
    },
    {
      name: 'Mindmap',
      before: '\n```mermaid\nmindmap\n  root((Project))\n    Design\n      UI/UX\n      Prototypes\n    Development\n      Frontend\n      Backend\n```\n',
      after: '',
      default: ''
    }
  ]

  const fontFamilies = [
    { name: 'Cairo (Arabic)', value: 'Cairo, var(--font-cairo), sans-serif' },
    { name: 'Outfit (English Headers)', value: 'Outfit, var(--font-outfit), sans-serif' },
    { name: 'Rubik (Modern Arabic)', value: 'Rubik, var(--font-rubik), sans-serif' },
    { name: 'Noto Arabic', value: 'Noto_Sans_Arabic, var(--font-noto-arabic), sans-serif' },
    { name: 'Rock Salt (Comic/Handwritten)', value: 'Rock_Salt, var(--font-rock-salt), cursive' },
    { name: 'Monospace', value: 'Roboto_Mono, var(--font-geist-mono), monospace' },
  ]

  const fontSizes = [
    { name: 'Small (12px)', value: '12px' },
    { name: 'Normal (16px)', value: '16px' },
    { name: 'Medium (20px)', value: '20px' },
    { name: 'Large (24px)', value: '24px' },
    { name: 'Huge (32px)', value: '32px' },
  ]

  const fontColors = [
    { name: 'Default', value: '' },
    { name: 'Violet Glow', value: '#c084fc' },
    { name: 'Fuchsia Glow', value: '#f472b6' },
    { name: 'Electric Blue', value: '#60a5fa' },
    { name: 'Emerald Mint', value: '#34d399' },
    { name: 'Sunset Gold', value: '#fbbf24' },
    { name: 'Neon Red', value: '#f87171' },
  ]

  const formattingSnippets = [
    { icon: Bold, label: 'Bold', action: () => insertText('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insertText('*', '*', 'italic text') },
    { icon: Underline, label: 'Underline', action: () => insertText('<u>', '</u>', 'underlined text') },
    { icon: Strikethrough, label: 'Strikethrough', action: () => insertText('~~', '~~', 'strikethrough text') },
    { icon: Type, label: 'Heading 1', action: () => insertText('# ', '\n', 'Heading 1') },
    { icon: Type, label: 'Heading 2', action: () => insertText('## ', '\n', 'Heading 2') },
    { icon: List, label: 'Bullet List', action: () => insertText('- ', '', 'List item') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertText('1. ', '', 'List item') },
    { icon: Code, label: 'Code Block', action: () => insertText('\n```js\n', '\n```\n', 'const test = "hello";') },
    { icon: LinkIcon, label: 'Link', action: () => insertText('[Link Title](', ')', 'https://example.com') },
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-white/10 bg-white/5 rounded-t-xl">
      {/* Basic Formatting */}
      {formattingSnippets.map((item, idx) => (
        <Button
          key={idx}
          type="button"
          size="icon"
          variant="ghost"
          onMouseDown={(e) => {
            e.preventDefault()
            item.action()
          }}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
          title={item.label}
        >
          <item.icon className="w-4.5 h-4.5" />
        </Button>
      ))}

      {/* Font Family Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-400 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1 border border-white/5"
          >
            <span>Font</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-950 border-white/10 text-white z-50">
          {fontFamilies.map((font, idx) => (
            <DropdownMenuItem
              key={idx}
              onSelect={(e) => {
                e.preventDefault()
                insertText(`<span style="font-family: ${font.value}">`, '</span>', 'text')
              }}
              className="text-xs hover:bg-violet-600 focus:bg-violet-600 cursor-pointer"
            >
              {font.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Size Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-400 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1 border border-white/5"
          >
            <span>Size</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-950 border-white/10 text-white z-50">
          {fontSizes.map((size, idx) => (
            <DropdownMenuItem
              key={idx}
              onSelect={(e) => {
                e.preventDefault()
                insertText(`<span style="font-size: ${size.value}">`, '</span>', 'text')
              }}
              className="text-xs hover:bg-violet-600 focus:bg-violet-600 cursor-pointer"
            >
              {size.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Font Color Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-gray-400 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1 border border-white/5"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Color</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-950 border-white/10 text-white z-50">
          {fontColors.map((color, idx) => (
            <DropdownMenuItem
              key={idx}
              onSelect={(e) => {
                e.preventDefault()
                if (color.value) {
                  insertText(`<span style="color: ${color.value}">`, '</span>', 'colored text')
                } else {
                  insertText('<span>', '</span>', 'text')
                }
              }}
              className="text-xs hover:bg-violet-600 focus:bg-violet-600 cursor-pointer flex items-center gap-2"
            >
              {color.value && <div className="w-3.5 h-3.5 rounded-full border border-white/20" style={{ backgroundColor: color.value }} />}
              {color.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="h-4 w-px bg-white/10 my-auto mx-1" />

      {/* Text Alignments & RTL/LTR Blocks */}
      <div className="flex items-center gap-0.5">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onMouseDown={(e) => {
            e.preventDefault()
            insertText('<div style="text-align: left">', '</div>', 'left align')
          }}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
          title="Align Left (Line)"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onMouseDown={(e) => {
            e.preventDefault()
            insertText('<div style="text-align: center">', '</div>', 'centered text')
          }}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
          title="Align Center (Line)"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onMouseDown={(e) => {
            e.preventDefault()
            insertText('<div style="text-align: right">', '</div>', 'right align')
          }}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
          title="Align Right (Line)"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onMouseDown={(e) => {
            e.preventDefault()
            insertText('<div style="text-align: justify">', '</div>', 'justified text')
          }}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
          title="Align Justify (Line)"
        >
          <AlignJustify className="w-4 h-4" />
        </Button>
      </div>

      {/* Editor Typing Direction Toggle (RTL / LTR) */}
      {setEditorDir && (
        <>
          <div className="h-4 w-px bg-white/10 my-auto mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => {
              e.preventDefault()
              setEditorDir(editorDir === 'rtl' ? 'ltr' : 'rtl')
            }}
            className="h-8 text-xs text-gray-400 hover:text-white hover:bg-white/10 px-2 rounded-md flex items-center gap-1.5 border border-white/5"
            title="Toggle Editor Typing Direction (RTL / LTR)"
          >
            <span className="text-[10px] font-mono text-gray-500">Writing:</span>
            <span className="text-[10px] font-bold font-mono text-violet-400">
              {editorDir === 'rtl' ? 'RTL' : 'LTR'}
            </span>
          </Button>
        </>
      )}

      <div className="h-4 w-px bg-white/10 my-auto mx-1" />

      {/* Flexible Table Generator Dialog */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
            title="Create Flexible Table"
          >
            <TableIcon className="w-4.5 h-4.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-sm z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-violet-400">
              <TableIcon className="w-5 h-5" />
              Build Flexible Table
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Generate a custom size table template inside your document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rows" className="text-right text-sm">Rows</Label>
              <Input
                id="rows"
                type="number"
                min={1}
                max={20}
                value={tableRows}
                onChange={(e) => setTableRows(parseInt(e.target.value) || 1)}
                className="col-span-3 bg-white/5 border-white/10 text-white rounded-lg focus:border-violet-500/50"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cols" className="text-right text-sm">Columns</Label>
              <Input
                id="cols"
                type="number"
                min={1}
                max={15}
                value={tableCols}
                onChange={(e) => setTableCols(parseInt(e.target.value) || 1)}
                className="col-span-3 bg-white/5 border-white/10 text-white rounded-lg focus:border-violet-500/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={handleGenerateTable}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold rounded-xl py-2"
            >
              Generate & Insert Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Settings Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
            title="Insert & Format Image"
          >
            <ImageIcon className="w-4.5 h-4.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-zinc-950 border-white/10 text-white rounded-2xl max-w-md z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-violet-400">
              <ImageIcon className="w-5 h-5" />
              Format & Insert Image
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-xs">
              Configure image settings, upload a file, or insert from a URL with custom sizing and positioning.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            {/* Source Selection Tabs */}
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setImageSourceType('upload')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                  imageSourceType === 'upload' ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setImageSourceType('url')}
                className={cn(
                  "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all",
                  imageSourceType === 'url' ? "bg-violet-600 text-white" : "text-gray-400 hover:text-white"
                )}
              >
                Image URL
              </button>
            </div>

            {/* Source Content */}
            {imageSourceType === 'upload' ? (
              <div className="space-y-2">
                <Label className="text-xs text-gray-400">Select Image File</Label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="dialog-image-picker"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleImageFileChange}
                  />
                  <Button
                    type="button"
                    disabled={isUploading}
                    onClick={() => document.getElementById('dialog-image-picker')?.click()}
                    className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl py-5 font-bold flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        Choose & Upload Image
                      </>
                    )}
                  </Button>
                </div>
                {imageUrl && (
                  <p className="text-[10px] text-emerald-400 font-mono break-all line-clamp-1">
                    Uploaded: {imageUrl}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="image-url" className="text-xs text-gray-400">Image Address (URL)</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-white/5 border-white/10 text-white rounded-lg focus:border-violet-500/50"
                />
              </div>
            )}

            {/* Alt text / Description */}
            <div className="space-y-1.5">
              <Label htmlFor="image-alt" className="text-xs text-gray-400">Alt Text (Description)</Label>
              <Input
                id="image-alt"
                placeholder="Enter description"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="bg-white/5 border-white/10 text-white rounded-lg focus:border-violet-500/50"
              />
            </div>

            {/* Width settings */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Width (Size)</Label>
              <div className="grid grid-cols-5 gap-1.5">
                {['200px', '300px', '400px', '500px', '100%'].map((w) => (
                  <button
                    type="button"
                    key={w}
                    onClick={() => setImageWidth(w)}
                    className={cn(
                      "py-1 text-[10px] font-bold rounded border transition-all",
                      imageWidth === w 
                        ? "bg-violet-500/20 border-violet-500 text-violet-300" 
                        : "bg-white/2 border-white/5 text-gray-400 hover:text-white"
                    )}
                  >
                    {w === '100%' ? 'Full' : w}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Custom:</span>
                <Input
                  placeholder="e.g. 250px or 60%"
                  value={imageWidth}
                  onChange={(e) => setImageWidth(e.target.value)}
                  className="h-8 bg-white/5 border-white/10 text-white rounded-md text-xs py-0 px-2"
                />
              </div>
            </div>

            {/* Alignment / Position */}
            <div className="space-y-2">
              <Label className="text-xs text-gray-400">Position & Wrap Text</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setImageAlign('left')}
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-all",
                    imageAlign === 'left'
                      ? "bg-violet-500/20 border-violet-500 text-violet-300"
                      : "bg-white/2 border-white/5 text-gray-400 hover:text-white"
                  )}
                >
                  <span className="text-xs">⬅ Left</span>
                  <span className="text-[9px] font-normal text-gray-500">(Wrap Text Right)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageAlign('center')}
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-all",
                    imageAlign === 'center'
                      ? "bg-violet-500/20 border-violet-500 text-violet-300"
                      : "bg-white/2 border-white/5 text-gray-400 hover:text-white"
                  )}
                >
                  <span className="text-xs">↕ Center</span>
                  <span className="text-[9px] font-normal text-gray-500">(No wrap / Block)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageAlign('right')}
                  className={cn(
                    "py-2 px-3 text-xs font-bold rounded-lg border flex flex-col items-center gap-1 transition-all",
                    imageAlign === 'right'
                      ? "bg-violet-500/20 border-violet-500 text-violet-300"
                      : "bg-white/2 border-white/5 text-gray-400 hover:text-white"
                  )}
                >
                  <span className="text-xs">Right ➡</span>
                  <span className="text-[9px] font-normal text-gray-500">(Wrap Text Left)</span>
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

      <div className="h-4 w-px bg-white/10 my-auto mx-1" />

      {/* Math / LaTeX Helper */}
      <Popover open={showMathHelper} onOpenChange={setShowMathHelper}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-violet-500/30 text-violet-400 hover:text-white hover:bg-violet-600/20 flex items-center gap-1 px-2.5 rounded-md text-xs"
            title="Math Equations Assistant"
          >
            <Sigma className="w-3.5 h-3.5" />
            <span>Math (LaTeX)</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-zinc-950 border-white/10 p-3 text-white rounded-xl shadow-2xl z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-violet-300 flex items-center gap-1.5">
                <Sigma className="w-4 h-4" />
                Equation Assistant
              </h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-zinc-950 border-white/10 text-xs text-gray-300 space-y-2 p-3 z-50">
                  <p className="font-bold text-white">LaTeX Equations Quick Info:</p>
                  <p>1. <strong>Inline Math:</strong> Wrap with single dollar sign <code>$e=mc^2$</code> to embed in a sentence.</p>
                  <p>2. <strong>Block Math:</strong> Wrap with double dollar signs <code>$$ ... $$</code> for centered standalone formulas.</p>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {mathSnippets.map((snippet, idx) => (
                <Button
                  key={idx}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertText(snippet.before, snippet.after, snippet.default)
                    setShowMathHelper(false)
                  }}
                  className="justify-start text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-md font-mono py-1 px-2 h-auto"
                >
                  {snippet.name}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Diagrams / Charts Helper */}
      <Popover open={showDiagramHelper} onOpenChange={setShowDiagramHelper}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-violet-500/30 text-violet-400 hover:text-white hover:bg-violet-600/20 flex items-center gap-1 px-2.5 rounded-md text-xs"
            title="Diagrams & Charts Assistant"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Diagrams & Charts</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-zinc-950 border-white/10 p-3 text-white rounded-xl shadow-2xl z-50">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-violet-300 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4" />
                Diagram & Chart Builder
              </h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10 rounded-full">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-zinc-950 border-white/10 text-xs text-gray-300 space-y-2 p-3 z-50">
                  <p className="font-bold text-white">How Diagrams Work:</p>
                  <p>Select a diagram, chart, or map template from the list. It will insert a <code>mermaid</code> code block. The editor will render it live into beautiful diagrams!</p>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {diagramSnippets.map((snippet, idx) => (
                <Button
                  key={idx}
                  type="button"
                  size="sm"
                  variant="ghost"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    insertText(snippet.before, snippet.after, snippet.default)
                    setShowDiagramHelper(false)
                  }}
                  className="justify-start text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-md font-mono py-1.5 px-2 h-auto"
                >
                  {snippet.name}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
