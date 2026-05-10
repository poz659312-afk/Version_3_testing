import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  FileText, 
  Brain, 
  Loader2, 
  RefreshCw, 
  AlertCircle,
  Send,
  User as UserIcon,
  Bot,
  Download
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import QuizInterface from "./quiz-system/quiz-interface";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLenis } from "lenis/react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
    mimeType: string;
    size?: number;
    thumbnailLink?: string;
  } | null;
}

const languages = [
  { value: "English", label: "English" },
  { value: "Arabic", label: "العربية (Arabic)" },
  { value: "French", label: "Français (French)" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "German", label: "Deutsch (German)" },
];

export default function AIModal({ isOpen, onClose, file }: AIModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setMessages([]);
      setError(null);
      setLoading(false);
      setActiveTask(null);
      // Don't clear quizQuestions here — quiz overlay may still be open
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const lenis = useLenis();

  // Hard-lock background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      if (lenis) lenis.stop();
      const scrollY = window.scrollY;
      document.body.style.setProperty('position', 'fixed', 'important');
      document.body.style.setProperty('top', `-${scrollY}px`, 'important');
      document.body.style.setProperty('width', '100%', 'important');
      document.body.style.setProperty('overflow', 'hidden', 'important');
      document.body.style.setProperty('touch-action', 'none', 'important');
      document.documentElement.classList.add('lenis-stopped');
    } else {
      if (lenis) lenis.start();
      const scrollY = document.body.style.top;
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.documentElement.classList.remove('lenis-stopped');
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      if (lenis) lenis.start();
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('touch-action');
      document.documentElement.classList.remove('lenis-stopped');
    };
  }, [isOpen, lenis]);

  if (!file) return null;

  const sendMessage = async (userText: string, task?: string) => {
    if (!userText.trim() && !task) return;
    
    const newMessages: Message[] = [...messages];
    if (userText.trim()) {
      newMessages.push({ role: "user", content: userText });
      setMessages(newMessages);
      setInput("");
    }

    setLoading(true);
    setError(null);
    if (task) setActiveTask(task);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileId: file.id, 
          task, 
          language,
          messages: newMessages 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process AI request");
      }

      const assistantContent = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
      setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
      
      if (task === 'quiz') {
        toast.success("Quiz generated successfully!");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadAsPDF = async (content: string) => {
    /* 
    // Temporarily disabled due to installation issues on the environment
    try {
      toast.loading("Preparing PDF...");
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(79, 70, 229);
      doc.text("Chameleon AI - File Summary", 20, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`File: ${file?.name}`, 20, 30);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 35);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 40, 190, 40);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      
      const cleanText = content
        .replace(/[#*`]/g, '')
        .replace(/\n\n/g, '\n');
        
      const splitText = doc.splitTextToSize(cleanText, 170);
      doc.text(splitText, 20, 50);
      
      doc.save(`${file?.name?.split('.')[0]}_summary.pdf`);
      toast.success("PDF Downloaded!");
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF. Please ensure jspdf is installed.");
    }
    */
    toast.error("PDF download is being configured. Please try again in a moment.");
  };

  const renderPreview = () => {
    if (file.mimeType.startsWith("image/")) {
      return (
        <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-muted/20 group">
          <img 
            src={file.thumbnailLink?.replace("=s220", "=s1000") || "/placeholder-image.png"} 
            alt={file.name}
            className="object-contain w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      );
    }

    if (file.mimeType === "application/pdf" || 
        file.mimeType.includes("document") || 
        file.mimeType.includes("msword") ||
        file.mimeType.includes("presentation") ||
        file.mimeType.includes("sheet")) {
      return (
        <div className="relative aspect-[4/3] lg:aspect-video rounded-xl overflow-hidden border border-border bg-muted/20">
          <iframe 
            src={`https://drive.google.com/file/d/${file.id}/view?usp=sharing`} 
            className="w-full h-full border-none"
            title="File Preview"
            allow="autoplay"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-7 text-[10px] bg-background/80 backdrop-blur hover:bg-background"
              onClick={() => window.open(`https://drive.google.com/file/d/${file.id}/view`, '_blank')}
            >
              Open in New Tab
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border bg-muted/10 text-muted-foreground">
        <FileText className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">{file.name}</p>
        <p className="text-xs opacity-60">Preview not available</p>
      </div>
    );
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()} 
        className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-[#0A0A0B]/95 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] rounded-3xl sm:mx-4 pointer-events-auto"
      >
        <DialogHeader className="p-4 sm:p-5 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl blur opacity-30 animate-pulse" />
                <div className="relative p-2.5 bg-background border border-white/10 rounded-xl">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight text-white/90">Chameleon AI</DialogTitle>
                <div className="flex items-center gap-2 mt-0.5">
                   <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-green-500/10 border-green-500/20 text-green-400 font-bold uppercase tracking-wider">Online</Badge>
                   <span className="text-[10px] text-muted-foreground/80 truncate max-w-[200px] font-medium">{file.name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] gap-2 border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-full">
                    <FileText className="w-3.5 h-3.5" />
                    Preview
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3 bg-background/95 backdrop-blur-xl border-border rounded-2xl shadow-2xl" align="end">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Context Preview</h4>
                  {renderPreview()}
                </PopoverContent>
              </Popover>

              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[100px] h-8 text-[10px] bg-white/5 border-white/10 rounded-full focus:ring-indigo-500/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border">
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value} className="text-[10px]">{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-8 w-[1px] bg-white/10 mx-1" />
              
              <Badge variant="outline" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-400 px-3 py-1 text-[10px] font-bold rounded-full">
                PRO
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {/* Main Content Area */}
          <div 
            className="flex-1 flex flex-col bg-transparent relative overflow-y-auto custom-scrollbar"
            data-lenis-prevent="true"
          >
            <div className="flex-1 px-4 py-6 sm:px-8">
              <div className="max-w-3xl mx-auto space-y-8">
                {messages.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="relative mb-8">
                      <div className="absolute -inset-4 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                      <div className="relative w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center shadow-inner">
                        <Bot className="w-10 h-10 text-indigo-400" />
                      </div>
                    </div>
                    <h4 className="text-2xl font-black mb-3 text-white/90 tracking-tight">How can I help with this file?</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mb-10 leading-relaxed font-medium">
                      I've analyzed <span className="text-indigo-400 font-bold">{file.name}</span>. 
                      Try one of these powerful actions to get started:
                    </p>
                    
                    <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                      <Button 
                        variant="outline" 
                        className="flex-col gap-3 h-auto py-5 bg-white/5 border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all rounded-2xl group shadow-lg"
                        onClick={() => sendMessage("", "summarize")}
                      >
                        <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                          <Sparkles className="w-6 h-6 text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-indigo-400">Summarize</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-col gap-3 h-auto py-5 bg-white/5 border-white/5 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all rounded-2xl group shadow-lg"
                        onClick={() => sendMessage("", "quiz")}
                      >
                        <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                          <Brain className="w-6 h-6 text-amber-400" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-amber-400">Generate Quiz</span>
                      </Button>
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      msg.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-border shadow-sm",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    )}>
                      {msg.role === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4 text-indigo-400" />}
                    </div>
                    <div className={cn(
                      "flex flex-col gap-1 max-w-[85%]",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm shadow-sm border border-border group relative",
                        msg.role === "user" 
                          ? "bg-indigo-600 text-white rounded-tr-none border-indigo-500/50" 
                          : "bg-muted/50 rounded-tl-none prose prose-sm dark:prose-invert max-w-none prose-headings:text-indigo-400"
                      )}>
                        {activeTask === 'quiz' && idx === messages.length - 1 && msg.role === 'assistant' ? (
                          <div className="flex flex-col items-center gap-4 py-4">
                            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                              <Brain className="w-8 h-8 text-amber-400" />
                            </div>
                            <p className="text-sm font-semibold text-center">Quiz Generated Successfully!</p>
                            <p className="text-xs text-muted-foreground text-center">Click the button below to start your quiz in full-screen mode.</p>
                            <Button
                              onClick={() => {
                                try {
                                  setQuizQuestions(JSON.parse(msg.content));
                                  setShowQuiz(true);
                                  onClose();
                                } catch (e) {
                                  toast.error("Failed to parse quiz data.");
                                }
                              }}
                              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl gap-2 shadow-lg shadow-amber-500/20"
                            >
                              <Brain className="w-4 h-4" />
                              Launch Quiz
                            </Button>
                          </div>
                        ) : (
                          <>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                            {msg.role === 'assistant' && activeTask === 'summarize' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="absolute -bottom-10 right-0 h-8 text-[10px] gap-1.5 text-muted-foreground hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => downloadAsPDF(msg.content)}
                              >
                                <Download className="w-3 h-3" />
                                Download PDF
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 px-1">
                        {msg.role === 'user' ? 'You' : 'Assistant'}
                      </span>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-sm">
                      <div className="h-4 bg-muted rounded-full w-3/4" />
                      <div className="h-4 bg-muted rounded-full w-full" />
                      <div className="h-4 bg-muted rounded-full w-2/3" />
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                    <Button variant="ghost" size="sm" onClick={() => sendMessage("")} className="h-7 ml-auto text-xs bg-destructive/20 hover:bg-destructive/30">
                      Retry
                    </Button>
                  </div>
                )}
                
                <div ref={scrollRef} className="h-4" />
              </div>
            </div>

            {/* Chat Input Area */}
            <div className="p-6 bg-background/80 backdrop-blur-md border-t border-border sticky bottom-0">
              <div className="max-w-3xl mx-auto relative group">
                <Input 
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask Chameleon AI anything about this file..."
                  className="h-14 pl-12 pr-16 bg-muted/40 border-border focus:ring-indigo-500/20 focus:border-indigo-500/50 rounded-2xl transition-all shadow-inner"
                  disabled={loading}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-400 transition-colors">
                  <Bot className="w-5 h-5" />
                </div>
                <Button 
                  size="icon" 
                  onClick={() => sendMessage(input)}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl transition-all",
                    input.trim() ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20" : "bg-muted text-muted-foreground"
                  )}
                  disabled={loading || !input.trim()}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-tighter opacity-50">
                AI can make mistakes. Verify important info.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Separate Full-Screen Quiz Overlay */}
    {showQuiz && quizQuestions && file && (
      <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl overflow-y-auto" data-lenis-prevent="true">
        <div className="max-w-4xl mx-auto py-8 px-4">
          <QuizInterface 
            quizData={{ 
              id: "ai-generated", 
              name: `AI Quiz: ${file.name}`, 
              code: "AI_QUIZ", 
              duration: 10, 
              jsonFile: "" 
            }} 
            onExit={() => {
              setShowQuiz(false);
              setQuizQuestions(null);
              setActiveTask(null);
            }}
            initialQuestions={quizQuestions} 
          />
        </div>
      </div>
    )}
    </>
  );
}
