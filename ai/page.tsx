'use client'

import { useChat } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { Send, UploadCloud, BrainCircuit, FileText, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import mammoth from 'mammoth'

export default function AIPage() {
    const { messages, status, sendMessage } = useChat({
      transport: new TextStreamChatTransport({ api: '/api/ai/chat' }),
  })

  // Mock `isLoading` purely for backwards compatibility styling
  const isLoading = status === 'submitted' || status === 'streaming';
  
  const [input, setInput] = useState('')
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setInput(e.target.value)

  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [extractedText, setExtractedText] = useState('')
  const [fileStatus, setFileStatus] = useState<{name: string, type: 'text' | 'image' | 'loading' | null}>({ name: '', type: null })

  // Extract text from PDFs using server route to avoid Next.js Webpack polyfill issues
  const extractPdf = async (file: File) => {
    const formData = new FormData()
    formData.append('document', file)
    const res = await fetch('/api/ai/extract-pdf', { method: 'POST', body: formData })
    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Failed to parse PDF: ${res.statusText} - ${errText}`)
    }
    const data = await res.json()
    return data.text || '';
  }

  // Handle all file uploads
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileStatus({ name: file.name, type: 'loading' })
    try {
        let textResult = '';

        if (file.type.includes('image')) {
            // Handle Images via API route
            const formData = new FormData()
            formData.append('image', file)
            const res = await fetch('/api/ai/image-to-text', { method: 'POST', body: formData })
            const data = await res.json()
            textResult = `[IMAGE CONTEXT: ${file.name}]\nDescription: ${data.text}`
            setFileStatus({ name: file.name, type: 'image' })
        } else if (file.type === 'application/pdf') {
            textResult = await extractPdf(file)
            if (textResult) {
                textResult = `[DOCUMENT CONTEXT: ${file.name}]\n${textResult.substring(0, 3000)}...` // limit to save HF free tier limits
                setFileStatus({ name: file.name, type: 'text' })
            } else {
                throw new Error("Text returned empty from PDF.")
            }
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            const arrayBuffer = await file.arrayBuffer()
            const result = await mammoth.extractRawText({ arrayBuffer })
            textResult = `[DOCUMENT CONTEXT: ${file.name}]\n${result.value.substring(0, 3000)}...`
            setFileStatus({ name: file.name, type: 'text' })
        } else {
            // Raw text fallback (.txt, .md, .csv, json)
            const result = await file.text()
            textResult = `[FILE CONTEXT: ${file.name}]\n${result.substring(0, 3000)}...`
            setFileStatus({ name: file.name, type: 'text' })
        }

        setExtractedText(textResult)
    } catch (error: any) {
        console.error('Extraction error:', error)
        alert(`Failed to process file. ${error?.message || ''}`)
        setFileStatus({ name: '', type: null })
        setExtractedText('')
    }
    
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

const extendedHandleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {       
    e.preventDefault()
    if (!(input || '').trim() && !extractedText) return

    const combinedContent = extractedText
        ? `${extractedText}\n\nUSER PROMPT: ${input || ''}`
        : input || '';

    sendMessage({
        content: combinedContent,
        role: 'user'
    })

    // Clear context immediately after submission
    setInput('')
    setExtractedText('')
    setFileStatus({ name: '', type: null })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto p-4 md:p-6 bg-background">
      <header className="flex items-center space-x-3 pb-6 border-b">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-primary" />
        </div>
        <div>
            <h1 className="text-2xl font-bold">Workspace AI</h1>
            <p className="text-sm text-muted-foreground">Chat, summarize files, analyze images, and generate quizzes (RAG enabled)</p>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto pt-6 pb-32 space-y-6 scroll-smooth">
        {messages.length === 0 && (
            <div className="text-center text-muted-foreground mt-20 flex flex-col items-center gap-4">
                <BrainCircuit className="w-16 h-16 opacity-20" />
                <p>Hello! I am your AI assistant.<br/>Ask me to generate a quiz, or upload a document/image to analyze it.</p>
            </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-5 py-4 shadow-sm ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 border'
            }`}>
              <div className="text-xs font-semibold mb-2 opacity-70 flex items-center gap-2">
                {m.role === 'user' ? 'You' : 'AI Assistant'}
              </div>
              <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:text-zinc-50 max-w-none">
                <ReactMarkdown>{(m.content || '').replace(/\[((?:FILE|DOCUMENT|IMAGE) CONTEXT: .*?)\].+USER PROMPT:/s, '(Sent attached file)\n\n')}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-muted/50 border max-w-[85%] rounded-2xl px-5 py-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground text-sm">Thinking...</span>
                </div>
            </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t p-4 md:px-0 z-10">
          <div className="max-w-4xl mx-auto flex flex-col gap-2">
            
            {/* Attachment Preview (Client-side lightweight RAG context) */}
            {fileStatus.type && (
                <div className="flex items-center gap-2 bg-muted/60 border px-3 py-2 rounded-lg w-fit ml-12">
                    {fileStatus.type === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                     fileStatus.type === 'image' ? <ImageIcon className="w-4 h-4 text-primary" /> : 
                     <FileText className="w-4 h-4 text-primary" />}
                    <span className="text-sm font-medium pr-2 text-foreground truncate max-w-[200px]">
                        {fileStatus.type === 'loading' ? 'Processing...' : fileStatus.name}
                    </span>
                    {fileStatus.type !== 'loading' && (
                        <button onClick={() => { setExtractedText(''); setFileStatus({name:'', type:null}) }} className="hover:bg-muted-foreground/20 p-1 rounded-full">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}

            <form onSubmit={extendedHandleSubmit} className="flex items-end gap-2 px-4 md:px-0">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload}
                    className="hidden" 
                    accept=".txt,.md,.csv,.json,.pdf,.docx,image/*"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={fileStatus.type === 'loading'}
                    className="p-3 shrink-0 rounded-xl border bg-muted/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                    title="Upload File (PDF, DOCX, Images, Text)"
                >
                    <UploadCloud className="w-5 h-5" />
                </button>
                <textarea
                    value={input}
                    onChange={handleInputChange}
                    className="w-full flex-1 rounded-xl border bg-background px-4 py-3 min-h-[50px] max-h-[150px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm"
                    placeholder="Ask something, generate a quiz, or summarize a file... (Enter to send)"
                    onKeyDown={(e) => {
                        if(e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            extendedHandleSubmit(e as any);
                        }
                    }}
                />
                <button 
                    type="submit" 
                    disabled={isLoading || (!input && !extractedText) || fileStatus.type === 'loading'} 
                    className="p-3 shrink-0 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                    title="Send Message"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
          </div>
      </div>
    </div>
  )
}

