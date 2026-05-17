import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Download,
  Square,
  X
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import QuizInterface from "./quiz-system/quiz-interface";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLenis } from "lenis/react";
import { useColorTheme } from "@/components/color-theme-provider";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

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

function MermaidElement({ chart }: { chart: string }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [svg, setSvg] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [mermaidInstance, setMermaidInstance] = useState<any>(null);
  const elementIdRef = useRef(`mermaid-${Math.floor(Math.random() * 100000)}`);

  useEffect(() => {
    import("mermaid").then((m) => {
      setMermaidInstance(m.default);
    }).catch((err) => {
      console.error("Failed to load mermaid:", err);
      setError(true);
    });
  }, []);

  useEffect(() => {
    if (!mermaidInstance || !chart) return;
    let isMounted = true;
    
    const renderChart = async () => {
      try {
        // Re-initialize mermaid with the current active theme colors dynamically
        mermaidInstance.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          securityLevel: "loose",
          suppressErrorRendering: true,
          themeVariables: isDark ? {
            background: "#0b0f19",
            primaryColor: "#1e1b4b",
            primaryTextColor: "#ffffff",
            lineColor: "#6366f1",
            actorBorder: "#6366f1",
            signalColor: "#ffffff",
            nodeBorder: "#4338ca",
            mainBkg: "#0f172a",
          } : {
            background: "#f8fafc",
            primaryColor: "#e0e7ff",
            primaryTextColor: "#1e1b4b",
            lineColor: "#4f46e5",
            actorBorder: "#4f46e5",
            signalColor: "#1e1b4b",
            nodeBorder: "#c7d2fe",
            mainBkg: "#ffffff",
          }
        });

        let sanitized = chart.trim();
        // Correct typical LLM syntax mistakes on the fly:
        // 1. Fix clashing arrows like "-->|text|> B" or "-->|text|>B" to "-->|text| B"
        sanitized = sanitized.replace(/\|>/g, '|');
        sanitized = sanitized.replace(/-->\s*\|([^|]+)\|\s*>\s*([a-zA-Z0-9_-]+)/g, '-->|$1| $2');
        sanitized = sanitized.replace(/-->\s*\|([^|]+)\|\s*>\s*/g, '-->|$1| ');

        // 2. Normalize arrow syntax (e.g. -> and ---> to standard -->)
        sanitized = sanitized.replace(/(\s+)-\s*>\s*/g, '$1--> ');
        sanitized = sanitized.replace(/(\s+)-{3,}>\s*/g, '$1--> ');
        
        // 3. Auto-quote all bracketed node labels [Some Text] if they are not already quoted
        sanitized = sanitized.replace(/([a-zA-Z0-9_-]+)\[\s*([^"\]]+)\s*\]/g, (match, id, label) => {
          const trimmed = label.trim();
          if (!trimmed.startsWith('"') && !trimmed.endsWith('"')) {
            return `${id}["${trimmed}"]`;
          }
          return match;
        });

        // 4. Auto-quote all rounded node labels (Some Text) if they are not already quoted
        sanitized = sanitized.replace(/([a-zA-Z0-9_-]+)\(\s*([^"\]\)]+)\s*\)/g, (match, id, label) => {
          const trimmed = label.trim();
          if (!trimmed.startsWith('"') && !trimmed.endsWith('"')) {
            return `${id}("${trimmed}")`;
          }
          return match;
        });
        
        // 5. Fallback for unquoted special characters inside labels
        sanitized = sanitized.replace(/([a-zA-Z0-9_-]+)\[\s*([^"\]]*[\(\):,/\-+#].*?)\s*\]/g, '$1["$2"]');

        // Append theme suffix to prevent element ID conflicts in DOM cache
        const uniqueId = `${elementIdRef.current}-${isDark ? 'dark' : 'light'}`;
        
        const renderResult = mermaidInstance.render(uniqueId, sanitized);
        let renderedSvg = "";
        if (renderResult instanceof Promise) {
          const res = await renderResult;
          renderedSvg = res.svg;
        } else {
          renderedSvg = renderResult;
        }
        if (isMounted) {
          setSvg(renderedSvg);
          setError(false);
        }
      } catch (err) {
        console.error("Mermaid Render Error:", err);
        if (isMounted) {
          setError(true);
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart, mermaidInstance, isDark]);

  if (error) {
    return (
      <pre className="bg-black/40 rounded-xl p-4 my-3 overflow-x-auto border border-red-500/20 text-red-400 font-mono text-xs">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div className={cn(
      "my-4 rounded-xl border p-4 overflow-hidden relative group transition-colors duration-200",
      isDark 
        ? "border-indigo-500/20 bg-[#0b0f19]/80 shadow-lg text-white mermaid-dark" 
        : "border-slate-200 bg-slate-50/80 shadow-md text-slate-900 mermaid-light"
    )}>
      <div className={cn(
        "flex items-center justify-between mb-3 border-b pb-2",
        isDark ? "border-white/5" : "border-slate-200"
      )} data-pdf-exclude="true">
        <div className="flex items-center gap-2">
          <span className={cn(
            "flex h-2 w-2 rounded-full animate-pulse",
            isDark ? "bg-indigo-500" : "bg-indigo-600"
          )} />
          <span className={cn(
            "text-[11px] font-bold uppercase tracking-wider",
            isDark ? "text-indigo-300" : "text-indigo-600"
          )}>
            📊 Architectural Flow
          </span>
        </div>
        <button 
          onClick={() => setShowRaw(!showRaw)}
          className={cn(
            "text-[10px] px-2.5 py-1 rounded-md transition-all font-semibold",
            isDark 
              ? "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10" 
              : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-600/10"
          )}
        >
          {showRaw ? "Show Graph" : "Show Code"}
        </button>
      </div>

      {showRaw ? (
        <pre className={cn(
          "rounded-xl p-4 my-1 overflow-x-auto border font-mono text-xs",
          isDark 
            ? "bg-black/40 border-white/5 text-green-300/80" 
            : "bg-slate-100 border-slate-200 text-slate-800"
        )}>
          <code>{chart}</code>
        </pre>
      ) : (
        <div className={cn(
          "flex justify-center items-center py-4 rounded-xl overflow-x-auto border transition-colors duration-200",
          isDark ? "bg-black/20 border-white/5" : "bg-white border-slate-200/60"
        )}>
          {svg ? (
            <div 
              className={cn(
                "w-full max-w-full flex justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-w-4xl filter drop-shadow-sm transition-all duration-200",
                isDark ? "[&>svg]:text-white text-white" : "[&>svg]:text-slate-900 text-slate-900"
              )}
              dangerouslySetInnerHTML={{ __html: svg }} 
            />
          ) : (
            <div className="flex items-center gap-2 py-4">
              <Loader2 className={cn("w-4 h-4 animate-spin", isDark ? "text-indigo-400" : "text-indigo-600")} />
              <span className="text-xs text-muted-foreground">Rendering dynamic diagram...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIModal({ isOpen, onClose, file }: AIModalProps) {
  const { colorTheme } = useColorTheme();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      toast.success("AI Generation Stopped.");
    }
  };

  const sendMessage = async (userText: string, task?: string) => {
    if (!userText.trim() && !task) return;
    
    // Abort any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
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
        signal: controller.signal,
        body: JSON.stringify({ 
          fileId: file.id, 
          task, 
          language,
          messages: newMessages 
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to process AI request";
        try {
          const errData = await response.json();
          errorMsg = errData.error || errorMsg;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      // Handle Quiz generation as static JSON response
      if (task === 'quiz') {
        const data = await response.json();
        const assistantContent = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
        setMessages(prev => [...prev, { role: "assistant", content: assistantContent }]);
        toast.success("Quiz generated successfully!");
        setLoading(false);
        return;
      }

      // Stream summaries and chat responses via SSE
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No readable stream reader available on response");
      }

      const decoder = new TextDecoder();
      let done = false;
      let assistantText = "";
      
      // Push an empty assistant message to write the incoming stream chunks into
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let buffer = "";

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          buffer += chunkStr;
          
          // Reassemble split chunks correctly by splitting at newlines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Retain incomplete line in buffer

          for (const line of lines) {
            const cleanedLine = line.trim();
            if (!cleanedLine) continue;
            
            if (cleanedLine.startsWith("data: ")) {
              const dataStr = cleanedLine.slice(6).trim();
              if (dataStr === "[DONE]") continue;

              try {
                const parsed = JSON.parse(dataStr);
                const contentChunk = parsed.choices?.[0]?.delta?.content || "";
                if (contentChunk) {
                  assistantText += contentChunk;
                  setMessages(prev => {
                    const next = [...prev];
                    if (next.length > 0) {
                      next[next.length - 1] = {
                        ...next[next.length - 1],
                        content: assistantText
                      };
                    }
                    return next;
                  });
                }
              } catch (_) {
                // Ignore incomplete SSE json chunks
              }
            }
          }
        }
      }

      // Parse final remnants of buffer if any
      const cleanedBuffer = buffer.trim();
      if (cleanedBuffer.startsWith("data: ")) {
        try {
          const parsed = JSON.parse(cleanedBuffer.slice(6).trim());
          const contentChunk = parsed.choices?.[0]?.delta?.content || "";
          if (contentChunk) {
            assistantText += contentChunk;
            setMessages(prev => {
              const next = [...prev];
              if (next.length > 0) {
                next[next.length - 1] = {
                  ...next[next.length - 1],
                  content: assistantText
                };
              }
              return next;
            });
          }
        } catch (_) {}
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const pdfContentRef = useRef<HTMLDivElement>(null);

  const downloadAsPDF = async (content: string, msgElement?: HTMLElement | null) => {
    const toastId = toast.loading("Preparing native PDF...");
    try {
      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      
      const themeColorMap: Record<string, string> = {
        default: "#eab308", // Golden Amber
        volcano: "#ef4444", // Volcano Red-Orange
        nightowl: "#3b82f6", // Deep Blue
        skyblue: "#0ea5e9", // Sky Blue
        sunset: "#ec4899", // Vibrant Sunset Pink
        forest: "#22c55e", // Forest Green
        ocean: "#0066f4", // Ocean Blue
        lavender: "#8b5cf6", // Lavender Purple
        rose: "#ec4899", // Rose Pink
        amber: "#d97706", // Amber Orange
        mint: "#10b981", // Mint Green
        crimson: "#dc143c", // Crimson Red
        indigo: "#6366f1", // Indigo Blue
        emerald: "#10b981", // Emerald Green
        coral: "#ff7f50", // Coral Orange
      };
      
      const activeThemeColor = themeColorMap[colorTheme] || themeColorMap.default;

      let bodyHtml = '';
      if (msgElement) {
        // Clone to avoid modifying the actual UI
        const clone = msgElement.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('[data-pdf-exclude]').forEach(el => el.remove());
        
        // Ensure white text in dark mode is converted to dark text for the PDF
        clone.querySelectorAll('*').forEach(el => {
          (el as HTMLElement).style.color = '';
          (el as HTMLElement).style.backgroundColor = '';
        });
        
        bodyHtml = clone.innerHTML;
      } else {
        bodyHtml = content.replace(/\n/g, '<br/>');
      }

      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const fileName = file?.name?.split('.')[0] || 'summary';

      // Inject full CSS including KaTeX for native vector rendering
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${fileName}_chameleon_summary</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            body { 
              font-family: 'Inter', system-ui, sans-serif; 
              color: #111827; 
              padding: 40px 50px; 
              line-height: 1.6;
              font-size: 14px;
              background: white;
            }
            .header {
              margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid ${activeThemeColor};
            }
            .header-flex { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
            .header-img { width: 45px; height: 45px; border-radius: 10px; }
            .title { font-size: 26px; font-weight: 900; color: ${activeThemeColor}; letter-spacing: -0.5px; margin: 0; }
            .subtitle { font-size: 11px; color: #6b7280; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; }
            .meta { display: flex; gap: 20px; padding: 12px 16px; background: #f8fafc; border-radius: 8px; font-size: 12px; color: #6b7280; }
            .meta strong { color: #374151; }
            
            /* PDF Markdown Styles & High-Contrast overrides for White Background */
            .content, .content p, .content li, 
            .content span:not([class*="mermaid"] *), 
            .content div:not([class*="mermaid"] *) {
              color: #1f2937 !important; /* Force high-contrast dark gray text, excluding Mermaid diagram contents */
            }
            
            /* Preserve KaTeX specific internal colors */
            .content .katex, .content .katex * {
              color: inherit !important;
            }
            
            .content h2 { 
              font-size: 22px !important; 
              font-weight: 800 !important; 
              color: ${activeThemeColor} !important; 
              margin: 36px 0 18px !important; 
              padding-left: 14px !important; 
              border-left: 5px solid ${activeThemeColor} !important; /* Premium left theme accent bar! */
              padding-bottom: 2px !important;
            }
            .content h2 * {
              color: ${activeThemeColor} !important;
            }
            
            .content h3 { 
              font-size: 17px !important; 
              font-weight: 700 !important; 
              color: ${activeThemeColor} !important; 
              margin: 28px 0 12px !important; 
              border-bottom: 1px dashed #e5e7eb !important; /* Dashed separator for sub-sections */
              padding-bottom: 5px !important;
            }
            .content h3 * {
              color: ${activeThemeColor} !important;
            }
            
            .content h4 { 
              font-size: 14px !important; 
              font-weight: 700 !important; 
              color: #374151 !important; 
              margin: 16px 0 8px !important; 
            }
            .content h4 * {
              color: #374151 !important;
            }
            
            .content strong { 
              font-weight: 700 !important; 
              color: #111827 !important; 
            }
            .content strong * {
              color: #111827 !important;
              font-weight: 700 !important;
            }
            
            .content em { 
              color: #4338ca !important; 
              font-style: italic !important; 
            }
            .content em * {
              color: #4338ca !important;
              font-style: italic !important;
            }
            
            .content table { 
              width: 100% !important; 
              border-collapse: collapse !important; 
              margin: 24px 0 !important; 
              font-size: 13px !important; 
              break-inside: avoid !important; 
            }
            
            .content th { 
              background-color: ${activeThemeColor}14 !important; /* Soft theme color table header background */
              color: ${activeThemeColor} !important; 
              padding: 12px 16px !important; 
              text-align: left !important; 
              font-weight: 700 !important; 
              border: 1px solid ${activeThemeColor}33 !important; 
            }
            .content th * {
              color: ${activeThemeColor} !important;
            }
            
            .content td { 
              padding: 10px 16px !important; 
              border: 1px solid #e5e7eb !important; 
              color: #374151 !important; 
            }
            .content td * {
              color: #374151 !important;
            }
            
            .content tr:nth-child(even) { 
              background-color: #f8fafc !important; 
            }
            
            .content blockquote { 
              border-left: 5px solid ${activeThemeColor} !important; 
              padding: 14px 20px !important; 
              margin: 20px 0 !important; 
              background-color: ${activeThemeColor}0d !important; /* Very transparent theme background */
              border-radius: 0 8px 8px 0 !important; 
              color: ${activeThemeColor} !important; 
              font-weight: 500 !important; 
              font-style: italic !important; 
            }
            .content blockquote * {
              color: ${activeThemeColor} !important;
            }
            
            .content ul { 
              padding-left: 28px !important; 
              margin: 16px 0 !important; 
              list-style-type: disc !important;
            }
            
            .content ol { 
              padding-left: 28px !important; 
              margin: 16px 0 !important; 
              list-style-type: decimal !important;
            }
            
            .content li { 
              margin: 10px 0 !important; /* Premium vertical padding for breathing room */
              padding-left: 4px !important;
              color: #374151 !important; 
              display: list-item !important;
              line-height: 1.6 !important;
            }
            
            .content li * {
              color: #374151 !important;
            }
            
            /* Hide the screen-only custom bullet circles in the PDF list items */
            .content li > span.shrink-0,
            .content li > span.mt-1\.5 {
              display: none !important;
            }
            
            .content hr { 
              border: none !important; 
              border-top: 2px solid #e5e7eb !important; 
              margin: 24px 0 !important; 
            }
            
            .content code { 
              background-color: #f1f5f9 !important; 
              color: #4338ca !important; 
              padding: 2px 6px !important; 
              border-radius: 4px !important; 
              font-size: 13px !important; 
              font-family: monospace !important; 
              border: 1px solid #e2e8f0 !important; 
              display: inline-block !important;
            }
            .content code * {
              color: #4338ca !important;
            }
            
            .content pre { 
              background-color: #f8fafc !important; 
              padding: 16px !important; 
              border-radius: 8px !important; 
              border: 1px solid #e5e7eb !important; 
              overflow-x: auto !important; 
              margin: 16px 0 !important; 
            }
            
            .content pre code { 
              background-color: transparent !important; 
              padding: 0 !important; 
              color: #334155 !important; 
              border: none !important; 
            }
            .content pre code * {
              color: #334155 !important;
            }
            
             .katex { 
              font-size: 1.15em !important; 
              line-height: 1.5 !important;
            }
            
            .content .katex-display {
              font-size: 0.95em !important;
              font-weight: 800 !important;
              margin: 18px 0 !important;
              padding: 10px 14px !important;
              background: #f8fafc !important;
              border-radius: 12px !important;
              border-left: 4px solid ${activeThemeColor} !important;
              text-align: center !important;
              display: block !important;
              overflow-x: auto !important;
              overflow-y: hidden !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            .content .katex-display::-webkit-scrollbar {
              display: none !important;
            }
            .content .katex-display .katex * {
              font-weight: 800 !important;
            }
            
            /* Prevent ugly splitting of layout cards across pages */
            .content h2, .content h3, .content h4, .content table, .content blockquote, .content pre, .katex-display {
              break-inside: avoid !important;
              page-break-inside: avoid !important;
            }
            
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid ${activeThemeColor}2b; display: flex; align-items: center; justify-content: space-between; page-break-inside: avoid; }
            .footer-flex { display: flex; align-items: center; gap: 10px; }
            .footer-img { width: 24px; height: 24px; border-radius: 6px; }
            .footer-text { font-size: 12px; color: #6b7280; font-weight: 600; }
            .footer-link { font-size: 12px; color: ${activeThemeColor}; font-weight: 700; }
            
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
              
              /* Force clean white background for all printed Mermaid diagram containers and their inner divs */
              .mermaid-dark, .mermaid-light,
              .mermaid-dark > div, .mermaid-light > div {
                background: #ffffff !important;
                border: 1px solid #e2e8f0 !important;
                color: #000000 !important;
                box-shadow: none !important;
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
              .mermaid-dark svg, .mermaid-light svg {
                filter: none !important;
                background: transparent !important;
              }
              /* Explicitly style all printed diagram node shapes to be soft gray/blue with slate outlines */
              .mermaid-dark rect, .mermaid-light rect,
              .mermaid-dark polygon, .mermaid-light polygon,
              .mermaid-dark circle, .mermaid-light circle,
              .mermaid-dark [class*="node"] rect, .mermaid-light [class*="node"] rect,
              .mermaid-dark [class*="node"] polygon, .mermaid-light [class*="node"] polygon,
              .mermaid-dark [class*="node"] circle, .mermaid-light [class*="node"] circle,
              .mermaid-dark path.node, .mermaid-light path.node {
                fill: #f1f5f9 !important;
                stroke: #cbd5e1 !important;
                stroke-width: 1.5px !important;
              }
              /* Color all printed connector lines and arrows to be dark slate gray */
              .mermaid-dark path.edgePath, .mermaid-light path.edgePath,
              .mermaid-dark .edgePath .path, .mermaid-light .edgePath .path,
              .mermaid-dark .edgePath path, .mermaid-light .edgePath path,
              .mermaid-dark marker path, .mermaid-light marker path,
              .mermaid-dark .arrowheadPath, .mermaid-light .arrowheadPath {
                stroke: #475569 !important;
                fill: #475569 !important;
                stroke-width: 1.5px !important;
              }
              /* Force ALL text elements, spans, and tspans inside the printed diagram to be pitch black! */
              .mermaid-dark text, .mermaid-light text,
              .mermaid-dark tspan, .mermaid-light tspan,
              .mermaid-dark span, .mermaid-light span,
              .mermaid-dark div, .mermaid-light div,
              .mermaid-dark [class*="label"] *, .mermaid-light [class*="label"] * {
                color: #000000 !important;
                fill: #000000 !important;
                font-weight: 700 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-flex">
              <img src="${window.location.origin}/images/chameleon.png" class="header-img" onerror="this.style.display='none'" />
              <div>
                <h1 class="title">Chameleon AI Summary</h1>
                <div class="subtitle">AI-Powered Academic Assistant</div>
              </div>
            </div>
            <div class="meta">
              <span>📄 <strong>${file?.name || 'Document'}</strong></span>
              <span>📅 ${dateStr}</span>
              <span>🌐 ${language}</span>
            </div>
          </div>
          
          <div class="content">
            ${bodyHtml}
          </div>
          
          <div class="footer">
            <div class="footer-flex">
              <img src="${window.location.origin}/images/chameleon.png" class="footer-img" onerror="this.style.display='none'" />
              <span class="footer-text">Generated with Chameleon AI</span>
            </div>
            <span class="footer-link">chameleon-nu.vercel.app</span>
          </div>
          
          <script>
            // Ensure document fonts are loaded before triggering print dialog
            window.onload = function() {
              if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(function() {
                  setTimeout(function() {
                    window.print();
                  }, 800);
                });
              } else {
                setTimeout(function() {
                  window.print();
                }, 1000);
              }
            }
          </script>
        </body>
        </html>
      `;

      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        
        // Dynamic styling injection: Clone all sheets from parent (e.g. Tailwind, KaTeX styles)
        const parentStyles = document.querySelectorAll('link[rel="stylesheet"], style');
        parentStyles.forEach(styleNode => {
          iframeDoc.head.appendChild(styleNode.cloneNode(true));
        });
        
        iframeDoc.close();
      }

      // Cleanup iframe after a delay
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 25000);

      toast.success("Ready! Select 'Save as PDF' in the print dialog.", { id: toastId });
    } catch (err) {
      console.error("PDF Export Error:", err);
      toast.error("Failed to generate PDF.", { id: toastId });
    }
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
    <style dangerouslySetInnerHTML={{ __html: `
      /* Force Dialog Portal and Blur Overlay to hover above absolutely everything! */
      div[data-radix-portal] {
        z-index: 999999 !important;
      }
      .fixed.inset-0.backdrop-blur-md,
      [data-aria-hidden="true"] ~ div[data-radix-portal] > div {
        z-index: 999998 !important;
      }

      .ai-markdown-content .katex-display {
        font-size: 1.1em !important;
        font-weight: 800 !important;
        margin: 18px 0 !important;
        padding: 10px 14px !important;
        background: rgba(99, 102, 241, 0.05) !important;
        border-radius: 12px !important;
        border-left: 4px solid var(--theme-primary, #6366f1) !important;
        text-align: center !important;
        display: block !important;
        overflow-x: auto !important;
        overflow-y: hidden !important;
      }
      .ai-markdown-content .katex-display .katex * {
        font-weight: 800 !important;
      }

      /* Hide Mermaid syntax errors & bomb icon SVGs globally and completely */
      #mermaid-error-svg, 
      [id*="mermaid-error"], 
      [id*="error-svg"],
      .mermaid-err,
      .error-icon, 
      .error-text,
      .error-icon * {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
      }
    `}} />
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()} 
        className="w-[96vw] sm:w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 overflow-hidden bg-[#0A0A0B]/95 backdrop-blur-2xl border-white/10 shadow-[0_0_50px_-12px_rgba(79,70,229,0.3)] rounded-2xl sm:rounded-3xl pointer-events-auto z-[999999]"
      >
        <DialogHeader className="p-3 sm:p-5 border-b border-white/5 bg-white/[0.02] shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl blur opacity-30 animate-pulse" />
                <div className="relative p-2 sm:p-2.5 bg-background border border-white/10 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                </div>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-sm sm:text-lg font-bold tracking-tight text-white/90 truncate">Chameleon AI</DialogTitle>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                   <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-green-500/10 border-green-500/20 text-green-400 font-bold uppercase tracking-wider shrink-0">Online</Badge>
                   <span className="text-[9px] sm:text-[10px] text-muted-foreground/80 truncate max-w-[100px] sm:max-w-[200px] font-medium">{file.name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 sm:h-8 text-[9px] sm:text-[10px] gap-1 sm:gap-2 border-white/10 bg-white/5 hover:bg-white/10 transition-all rounded-full px-2.5 sm:px-3">
                    <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline">Preview</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 sm:w-80 p-3 bg-background/95 backdrop-blur-xl border-border rounded-2xl shadow-2xl" align="end">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Context Preview</h4>
                  {renderPreview()}
                </PopoverContent>
              </Popover>

              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[85px] sm:w-[100px] h-7 sm:h-8 text-[9px] sm:text-[10px] bg-white/5 border-white/10 rounded-full focus:ring-indigo-500/20 px-2 sm:px-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border">
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value} className="text-[9px] sm:text-[10px]">{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-7 sm:h-8 w-[1px] bg-white/10 mx-0.5 sm:mx-1" />
              
              <Badge variant="outline" className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20 text-indigo-400 px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold rounded-full">
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
                        className="flex-col gap-3 h-auto py-5 bg-muted/30 dark:bg-white/5 border-border dark:border-white/5 hover:bg-amber-500/5 dark:hover:bg-amber-500/10 hover:border-amber-500/30 text-foreground transition-all rounded-2xl group shadow-lg"
                        onClick={() => sendMessage("", "quiz")}
                      >
                        <div className="p-3 bg-amber-500/10 rounded-xl group-hover:bg-amber-500/20 transition-colors">
                          <Brain className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400">Generate Quiz</span>
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
                        "p-5 rounded-2xl text-sm shadow-sm border border-border group relative overflow-hidden",
                        msg.role === "user" 
                          ? "bg-indigo-600 text-white rounded-tr-none border-indigo-500/50" 
                          : "bg-muted/50 rounded-tl-none max-w-none"
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
                                   let parsedQuestions = null;
                                   
                                   if (typeof msg.content === 'object' && msg.content !== null) {
                                     parsedQuestions = msg.content;
                                   } else {
                                     try {
                                       // Strip any markdown json formatting backticks
                                       const cleaned = msg.content.replace(/```json|```/g, '').trim();
                                       parsedQuestions = JSON.parse(cleaned);
                                     } catch (parseErr) {
                                       parsedQuestions = JSON.parse(msg.content);
                                     }
                                   }

                                   if (!parsedQuestions || !Array.isArray(parsedQuestions)) {
                                     if (parsedQuestions && parsedQuestions.questions) {
                                       parsedQuestions = parsedQuestions.questions;
                                     } else {
                                       throw new Error("Parsed data is not a valid questions array");
                                     }
                                   }
                                   
                                   const quizData = {
                                     id: "ai-generated",
                                     name: `AI Quiz: ${file.name}`,
                                     code: "AI_QUIZ",
                                     duration: 10,
                                     jsonFile: "",
                                     questions: parsedQuestions
                                   };
                                   
                                   localStorage.setItem("ai-quiz-data", JSON.stringify(quizData));
                                   localStorage.setItem("ai-quiz-back-link", window.location.pathname);
                                   
                                   toast.success("Redirecting to dedicated quiz page...");
                                   onClose();
                                   
                                   setTimeout(() => {
                                     try {
                                       router.push("/quiz/ai/generated/ai-quiz");
                                     } catch (routerErr) {
                                       window.location.href = "/quiz/ai/generated/ai-quiz";
                                     }
                                   }, 50);
                                 } catch (e) {
                                   console.error("Quiz Parse/Redirect Error:", e);
                                   toast.error("Redirecting directly...");
                                   onClose();
                                   setTimeout(() => {
                                     try {
                                       router.push("/quiz/ai/generated/ai-quiz");
                                     } catch (routerErr) {
                                       window.location.href = "/quiz/ai/generated/ai-quiz";
                                     }
                                   }, 50);
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
                            <div id={`msg-content-${idx}`} data-msg-content="true" className="ai-markdown-content">
                                <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[[rehypeKatex, { strict: false }]]}
                                components={{
                                  h2: ({ children }) => (
                                    <h2 className="text-base font-extrabold text-indigo-400 mt-6 mb-2 pb-2 border-b border-indigo-500/20 flex items-center gap-2">{children}</h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-sm font-bold text-indigo-300/90 mt-4 mb-1.5">{children}</h3>
                                  ),
                                  h4: ({ children }) => (
                                    <h4 className="text-sm font-semibold text-white/80 mt-3 mb-1">{children}</h4>
                                  ),
                                  p: ({ children }) => (
                                    <p className="text-[13px] text-white/80 leading-relaxed my-1.5">{children}</p>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-bold text-white">{children}</strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className="italic text-indigo-300/80">{children}</em>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="space-y-1 my-2 ml-1">{children}</ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="space-y-1 my-2 ml-1 list-decimal list-inside">{children}</ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="text-[13px] text-white/75 flex items-start gap-2">
                                      <span className="text-indigo-400 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400/60" />
                                      <span className="flex-1">{children}</span>
                                    </li>
                                  ),
                                  hr: () => (
                                    <hr className="border-none h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent my-5" />
                                  ),
                                  a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 font-medium">{children}</a>
                                  ),
                                  table: ({ children }) => (
                                    <div className="overflow-x-auto my-4 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                                      <table className="w-full text-xs border-collapse">{children}</table>
                                    </div>
                                  ),
                                  thead: ({ children }) => (
                                    <thead className="bg-indigo-500/15">{children}</thead>
                                  ),
                                  th: ({ children }) => (
                                    <th className="text-indigo-300 px-4 py-2.5 text-left font-bold border-b border-indigo-500/20 text-xs uppercase tracking-wider">{children}</th>
                                  ),
                                  td: ({ children }) => (
                                    <td className="px-4 py-2.5 border-b border-border/30 text-xs text-white/70">{children}</td>
                                  ),
                                  tr: ({ children }) => (
                                    <tr className="hover:bg-white/[0.02] transition-colors">{children}</tr>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-[3px] border-indigo-500 bg-indigo-500/[0.07] rounded-r-xl px-4 py-3 my-3 text-indigo-200 font-medium text-[13px] italic">{children}</blockquote>
                                  ),
                                  pre: ({ children }) => {
                                    const isMermaid = React.Children.toArray(children).some(
                                      (child: any) => 
                                        child?.props?.className?.includes('language-mermaid') || 
                                        child?.props?.language === 'mermaid'
                                    );
                                    if (isMermaid) {
                                      return <>{children}</>;
                                    }
                                    return (
                                      <pre className="bg-black/40 rounded-xl p-4 my-3 overflow-x-auto border border-white/5 shadow-inner">{children}</pre>
                                    );
                                  },
                                  code: ({ className, children, ...props }) => {
                                    const isInline = !className;
                                    const match = /language-(\w+)/.exec(className || '');
                                    const language = match ? match[1] : '';

                                    if (!isInline && language === 'mermaid') {
                                      return (
                                        <MermaidElement chart={String(children).replace(/\n$/, '')} />
                                      );
                                    }

                                    return isInline ? (
                                      <code className="bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded-md text-xs font-mono border border-indigo-500/10" {...props}>{children}</code>
                                    ) : (
                                      <code className={cn("block text-xs font-mono text-green-300/90", className)} {...props}>{children}</code>
                                    );
                                  },
                                }}
                              >
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                            {msg.role === 'assistant' && (
                              <div data-pdf-exclude="true" className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-7 text-[10px] gap-1.5 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10 transition-all rounded-lg"
                                  onClick={() => {
                                    const bubble = document.getElementById(`msg-content-${idx}`);
                                    downloadAsPDF(msg.content, bubble);
                                  }}
                                >
                                  <Download className="w-3 h-3" />
                                  Download PDF
                                </Button>
                              </div>
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
                {loading ? (
                  <Button 
                    size="icon" 
                    onClick={stopGeneration}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white shadow-lg shadow-red-500/25 animate-pulse transition-all border border-red-500/30"
                  >
                    <Square className="w-4 h-4 fill-current text-white" />
                  </Button>
                ) : (
                  <Button 
                    size="icon" 
                    onClick={() => sendMessage(input)}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl transition-all",
                      input.trim() ? "bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20" : "bg-muted text-muted-foreground"
                    )}
                    disabled={!input.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-tighter opacity-50">
                AI can make mistakes. Verify important info.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
