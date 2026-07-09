'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Send, Eye, Edit3, HelpCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import EditorToolbar from '@/components/EditorToolbar'
import SummaryRenderer from '@/components/SummaryRenderer'
import { createSummary, updateSummary, uploadSummaryImage } from '../actions'
import { toast } from 'sonner'

interface SummaryConsoleClientProps {
  initialData?: {
    code: string
    title: string
    content: string
    is_published: boolean
  }
}

export default function SummaryConsoleClient({ initialData }: SummaryConsoleClientProps) {
  const router = useRouter()
  const isEditMode = !!initialData

  const [title, setTitle] = useState(initialData?.title || '')
  const [content, setContent] = useState(initialData?.content || '')
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) {
      toast.error('Please enter a title for the summary')
      return
    }
    if (!content.trim()) {
      toast.error('Please write some content')
      return
    }

    setIsSaving(true)
    try {
      if (isEditMode && initialData) {
        await updateSummary(initialData.code, {
          title,
          content,
          is_published: publish
        })
        toast.success(`Summary updated successfully!`)
      } else {
        const result = await createSummary(title, content, publish)
        toast.success(`Summary created and ${publish ? 'published' : 'saved as draft'}!`)
        router.push(`/summaries/${result.code}`)
        return
      }
      router.push('/summaries')
      router.refresh()
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'An error occurred while saving.'
      toast.error(errMsg)
    } finally {
      setIsSaving(false)
    }
  }

  // Inject uploaded image URL into the editor content
  const handleImageUploaded = (url: string) => {
    const markdownImage = `\n![Uploaded Image](${url}#w=400px&align=center)\n`
    const textarea = textareaRef.current
    if (!textarea) return

    const startPos = textarea.selectionStart
    const endPos = textarea.selectionEnd
    const newValue = 
      textarea.value.substring(0, startPos) + 
      markdownImage + 
      textarea.value.substring(endPos)

    setContent(newValue)

    setTimeout(() => {
      textarea.focus()
      const newCursorPos = startPos + markdownImage.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  // Handle pasting image files directly from clipboard (e.g. screenshot or Google copy-paste)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault()
        const file = item.getAsFile()
        if (!file) continue

        const uploadToast = toast.loading('Uploading pasted image to storage...')
        const reader = new FileReader()
        reader.onloadend = async () => {
          try {
            const base64String = reader.result as string
            // Upload to Supabase Storage
            const publicUrl = await uploadSummaryImage(base64String, file.name || 'pasted_image.png')
            
            const markdownImage = `\n![Pasted Image](${publicUrl}#w=400px&align=center)\n`
            const textarea = textareaRef.current
            if (!textarea) return

            const startPos = textarea.selectionStart
            const endPos = textarea.selectionEnd
            const newValue = 
              textarea.value.substring(0, startPos) + 
              markdownImage + 
              textarea.value.substring(endPos)

            setContent(newValue)
            toast.dismiss(uploadToast)
            toast.success('Pasted image uploaded successfully!')
            
            setTimeout(() => {
              textarea.focus()
              const newCursorPos = startPos + markdownImage.length
              textarea.setSelectionRange(newCursorPos, newCursorPos)
            }, 50)
          } catch (err: unknown) {
            toast.dismiss(uploadToast)
            toast.error('Failed to upload pasted image.')
            console.error('Paste error:', err)
          }
        }
        reader.readAsDataURL(file)
        break
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild size="icon" variant="ghost" className="h-10 w-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl">
            <Link href="/summaries">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              {isEditMode ? 'Edit Summary' : 'Create Summary'}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              {isEditMode ? `Editing summary ${initialData.code}` : 'Draft your notes with support for math formulas and images'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="hover:bg-white/10 text-gray-300 hover:text-white rounded-xl px-4 py-2 border border-white/10"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white rounded-xl px-5 py-2 font-bold hover:scale-[1.02] transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {isEditMode && initialData.is_published ? 'Save & Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* Editor & Preview Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch min-h-[600px]">
        {/* Left Side: Editor */}
        <div className="flex flex-col space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-400">Summary Title</label>
            <Input
              placeholder="e.g. Math 101: Linear Algebra & Matrix Rotations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-violet-500/50 rounded-xl text-white text-lg font-bold py-5 w-full"
            />
          </div>

          <div className="flex-grow flex flex-col border border-white/10 rounded-xl overflow-hidden bg-zinc-950/40">
            {/* Editor Toolbar */}
            <EditorToolbar 
              textareaRef={textareaRef} 
              onChange={setContent} 
              onImageUploaded={handleImageUploaded}
            />

            {/* Mobile Tab Switcher */}
            <div className="lg:hidden p-2 bg-white/2 border-b border-white/5 flex justify-center">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'editor' | 'preview')} className="w-full">
                <TabsList className="bg-white/5 border border-white/5 rounded-lg w-full grid grid-cols-2">
                  <TabsTrigger value="editor" className="flex items-center gap-1.5 rounded-md text-xs"><Edit3 className="w-3.5 h-3.5" />Editor</TabsTrigger>
                  <TabsTrigger value="preview" className="flex items-center gap-1.5 rounded-md text-xs"><Eye className="w-3.5 h-3.5" />Preview</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Text Editor TextArea */}
            <div className="flex-grow relative min-h-[400px]">
              <textarea
                ref={textareaRef}
                placeholder="Write your summary here using Markdown. Use $ ... $ for inline math equations and $$ ... $$ for blocks."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                className={`w-full h-full min-h-[400px] p-4 bg-transparent text-gray-200 outline-none resize-none font-mono text-sm leading-relaxed ${activeTab !== 'editor' ? 'max-lg:hidden' : ''}`}
              />

              {/* Mobile Preview View */}
              {activeTab === 'preview' && (
                <div className="lg:hidden p-4 overflow-y-auto max-h-[500px]">
                  {title && <h1 className="text-3xl font-black text-white mb-6 tracking-tight border-b border-white/10 pb-3">{title}</h1>}
                  {content ? (
                    <SummaryRenderer content={content} />
                  ) : (
                    <p className="text-gray-500 italic text-sm">Write something to see the preview...</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Guide */}
          <Card className="bg-zinc-950 border-white/5 shadow-xl rounded-xl">
            <CardContent className="p-4 flex items-start gap-3">
              <HelpCircle className="w-6 h-6 text-violet-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400 space-y-1">
                <p className="font-bold text-white mb-1">Writing Cheat Sheet</p>
                <p>• <strong>Equations:</strong> Use <code>$f(x) = ax^2 + bx + c$</code> for math lines.</p>
                <p>• <strong>Tables:</strong> Insert a table structure using the toolbar button.</p>
                <p>• <strong>Images:</strong> Drag/drop or pick files to embed images instantly.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Desktop Live Preview */}
        <div className="hidden lg:flex flex-col space-y-2 h-full">
          <label className="text-sm font-bold text-gray-400 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-violet-400" />
            Live Preview
          </label>
          <div className="flex-grow border border-white/10 rounded-xl p-6 bg-zinc-950/20 backdrop-blur-sm overflow-y-auto max-h-[800px] shadow-2xl relative select-text">
            {title && (
              <h1 className="text-3xl font-black text-white mb-6 tracking-tight border-b border-white/10 pb-3">
                {title}
              </h1>
            )}
            {content ? (
              <SummaryRenderer content={content} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 italic text-sm">
                Write some markdown content to view the preview here...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
