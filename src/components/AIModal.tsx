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
import { getStudentSession } from "@/lib/auth";

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

const preprocessMathContent = (content: string) => {
  if (!content) return "";
  
  // Replace simple slash divisions and asterisks in LaTeX blocks with proper vertical fractions and clean dots
  let processed = content;
  
  // Match mathematical equations between $ and $ or $$ and $$
  processed = processed.replace(/(\$\$?)([\s\S]*?)(\$\$?)/g, (match, d1, math, d2) => {
    let cleanedMath = math;
    
    // 1. Convert simple asterisks * to \cdot
    cleanedMath = cleanedMath.replace(/\*/g, " \\cdot ");
    
    // 2. Convert simple division slashes (/) inside math blocks to proper \frac blocks
    // Pattern A: (numerator) / (denominator) -> \frac{numerator}{denominator}
    cleanedMath = cleanedMath.replace(/\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, "\\frac{$1}{$2}");
    
    // Pattern B: (numerator) / variable_or_number
    cleanedMath = cleanedMath.replace(/\(([^)]+)\)\s*\/\s*([a-zA-Z0-9_^{}]+)/g, "\\frac{$1}{$2}");
    
    // Pattern C: variable_or_number / (denominator)
    cleanedMath = cleanedMath.replace(/([a-zA-Z0-9_^{}]+)\s*\/\s*\(([^)]+)\)/g, "\\frac{$1}{$2}");
    
    // Pattern D: simple variable / simple variable (e.g. A/B or z^2/E^2)
    cleanedMath = cleanedMath.replace(/([a-zA-Z0-9_^{}]+)\s*\/\s*([a-zA-Z0-9_^{}]+)/g, "\\frac{$1}{$2}");
    
    // 3. Force full display style (\displaystyle) for large mathematical font sizes and beautiful vertical fraction heights
    if (!cleanedMath.includes("\\displaystyle")) {
      cleanedMath = " \\displaystyle " + cleanedMath;
    }
    
    return `${d1}${cleanedMath}${d2}`;
  });
  
  return processed;
};

export default function AIModal({ isOpen, onClose, file }: AIModalProps) {
  const { colorTheme } = useColorTheme();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  
  const themeClasses: Record<string, { 
    text: string; bg: string; border: string; bullet: string; heading: string; codeBg: string; inlineCodeText: string; accent: string;
    primary: string; primary600: string; primary700: string; primary800: string; ring: string; focusBorder: string; textHoverBg: string; 
    gradientBg: string; userBorder: string; userShadow: string; sendShadow: string; cardHover: string; cardTextHover: string;
  }> = {
    default: {
      text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", bullet: "bg-indigo-400/60", heading: "text-indigo-400", codeBg: "bg-indigo-500/15", inlineCodeText: "text-indigo-300", accent: "#4f46e5",
      primary: "bg-indigo-500", primary600: "bg-indigo-600", primary700: "bg-indigo-700", primary800: "bg-indigo-800",
      ring: "focus:ring-indigo-500/20", focusBorder: "focus:border-indigo-500/50",
      textHoverBg: "hover:text-indigo-400 hover:bg-indigo-500/10",
      gradientBg: "bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-600/90 dark:to-indigo-800/90",
      userBorder: "border-indigo-500/30", userShadow: "shadow-indigo-600/10",
      sendShadow: "shadow-indigo-500/20", cardHover: "hover:bg-indigo-500/10 hover:border-indigo-500/30", cardTextHover: "group-hover:text-indigo-400"
    },
    volcano: {
      text: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", bullet: "bg-orange-500/60", heading: "text-orange-400", codeBg: "bg-orange-500/15", inlineCodeText: "text-orange-300", accent: "#f97316",
      primary: "bg-orange-500", primary600: "bg-orange-600", primary700: "bg-orange-700", primary800: "bg-orange-800",
      ring: "focus:ring-orange-500/20", focusBorder: "focus:border-orange-500/50",
      textHoverBg: "hover:text-orange-400 hover:bg-orange-500/10",
      gradientBg: "bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-500/90 dark:to-orange-600/90",
      userBorder: "border-orange-500/30", userShadow: "shadow-orange-500/10",
      sendShadow: "shadow-orange-500/20", cardHover: "hover:bg-orange-500/10 hover:border-orange-500/30", cardTextHover: "group-hover:text-orange-400"
    },
    nightowl: {
      text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", bullet: "bg-sky-400/60", heading: "text-sky-400", codeBg: "bg-sky-500/15", inlineCodeText: "text-sky-300", accent: "#0ea5e9",
      primary: "bg-sky-500", primary600: "bg-sky-600", primary700: "bg-sky-700", primary800: "bg-sky-800",
      ring: "focus:ring-sky-500/20", focusBorder: "focus:border-sky-500/50",
      textHoverBg: "hover:text-sky-400 hover:bg-sky-500/10",
      gradientBg: "bg-gradient-to-br from-sky-600 to-sky-700 dark:from-sky-600/90 dark:to-sky-800/90",
      userBorder: "border-sky-500/30", userShadow: "shadow-sky-600/10",
      sendShadow: "shadow-sky-500/20", cardHover: "hover:bg-sky-500/10 hover:border-sky-500/30", cardTextHover: "group-hover:text-sky-400"
    },
    skyblue: {
      text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20", bullet: "bg-sky-400/60", heading: "text-sky-400", codeBg: "bg-sky-500/15", inlineCodeText: "text-sky-300", accent: "#38bdf8",
      primary: "bg-sky-500", primary600: "bg-sky-600", primary700: "bg-sky-700", primary800: "bg-sky-800",
      ring: "focus:ring-sky-500/20", focusBorder: "focus:border-sky-500/50",
      textHoverBg: "hover:text-sky-400 hover:bg-sky-500/10",
      gradientBg: "bg-gradient-to-br from-sky-600 to-sky-700 dark:from-sky-600/90 dark:to-sky-800/90",
      userBorder: "border-sky-500/30", userShadow: "shadow-sky-600/10",
      sendShadow: "shadow-sky-500/20", cardHover: "hover:bg-sky-500/10 hover:border-sky-500/30", cardTextHover: "group-hover:text-sky-400"
    },
    sunset: {
      text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", bullet: "bg-rose-400/60", heading: "text-rose-400", codeBg: "bg-rose-500/15", inlineCodeText: "text-rose-300", accent: "#f43f5e",
      primary: "bg-rose-500", primary600: "bg-rose-600", primary700: "bg-rose-700", primary800: "bg-rose-800",
      ring: "focus:ring-rose-500/20", focusBorder: "focus:border-rose-500/50",
      textHoverBg: "hover:text-rose-400 hover:bg-rose-500/10",
      gradientBg: "bg-gradient-to-br from-rose-600 to-rose-700 dark:from-rose-600/90 dark:to-rose-800/90",
      userBorder: "border-rose-500/30", userShadow: "shadow-rose-600/10",
      sendShadow: "shadow-rose-500/20", cardHover: "hover:bg-rose-500/10 hover:border-rose-500/30", cardTextHover: "group-hover:text-rose-400"
    },
    forest: {
      text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", bullet: "bg-emerald-400/60", heading: "text-emerald-400", codeBg: "bg-emerald-500/15", inlineCodeText: "text-emerald-300", accent: "#16a34a",
      primary: "bg-emerald-500", primary600: "bg-emerald-600", primary700: "bg-emerald-700", primary800: "bg-emerald-800",
      ring: "focus:ring-emerald-500/20", focusBorder: "focus:border-emerald-500/50",
      textHoverBg: "hover:text-emerald-400 hover:bg-emerald-500/10",
      gradientBg: "bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-600/90 dark:to-emerald-800/90",
      userBorder: "border-emerald-500/30", userShadow: "shadow-emerald-600/10",
      sendShadow: "shadow-emerald-500/20", cardHover: "hover:bg-emerald-500/10 hover:border-emerald-500/30", cardTextHover: "group-hover:text-emerald-400"
    },
    ocean: {
      text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", bullet: "bg-blue-400/60", heading: "text-blue-400", codeBg: "bg-blue-500/15", inlineCodeText: "text-blue-300", accent: "#2563eb",
      primary: "bg-blue-500", primary600: "bg-blue-600", primary700: "bg-blue-700", primary800: "bg-blue-800",
      ring: "focus:ring-blue-500/20", focusBorder: "focus:border-blue-500/50",
      textHoverBg: "hover:text-blue-400 hover:bg-blue-500/10",
      gradientBg: "bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-600/90 dark:to-blue-800/90",
      userBorder: "border-blue-500/30", userShadow: "shadow-blue-600/10",
      sendShadow: "shadow-blue-500/20", cardHover: "hover:bg-blue-500/10 hover:border-blue-500/30", cardTextHover: "group-hover:text-indigo-400"
    },
    lavender: {
      text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", bullet: "bg-purple-400/60", heading: "text-purple-400", codeBg: "bg-purple-500/15", inlineCodeText: "text-purple-300", accent: "#a78bfa",
      primary: "bg-purple-500", primary600: "bg-purple-600", primary700: "bg-purple-700", primary800: "bg-purple-800",
      ring: "focus:ring-purple-500/20", focusBorder: "focus:border-purple-500/50",
      textHoverBg: "hover:text-purple-400 hover:bg-purple-500/10",
      gradientBg: "bg-gradient-to-br from-purple-600 to-purple-700 dark:from-purple-600/90 dark:to-purple-800/90",
      userBorder: "border-purple-500/30", userShadow: "shadow-purple-600/10",
      sendShadow: "shadow-purple-500/20", cardHover: "hover:bg-purple-500/10 hover:border-purple-500/30", cardTextHover: "group-hover:text-purple-400"
    },
    rose: {
      text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", bullet: "bg-rose-400/60", heading: "text-rose-400", codeBg: "bg-rose-500/15", inlineCodeText: "text-rose-300", accent: "#ec4899",
      primary: "bg-rose-500", primary600: "bg-rose-600", primary700: "bg-rose-700", primary800: "bg-rose-800",
      ring: "focus:ring-rose-500/20", focusBorder: "focus:border-rose-500/50",
      textHoverBg: "hover:text-rose-400 hover:bg-rose-500/10",
      gradientBg: "bg-gradient-to-br from-rose-600 to-rose-700 dark:from-rose-600/90 dark:to-rose-800/90",
      userBorder: "border-rose-500/30", userShadow: "shadow-rose-600/10",
      sendShadow: "shadow-rose-500/20", cardHover: "hover:bg-rose-500/10 hover:border-rose-500/30", cardTextHover: "group-hover:text-rose-400"
    },
    amber: {
      text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", bullet: "bg-amber-400/60", heading: "text-amber-400", codeBg: "bg-amber-500/15", inlineCodeText: "text-amber-300", accent: "#d97706",
      primary: "bg-amber-500", primary600: "bg-amber-600", primary700: "bg-amber-700", primary800: "bg-amber-800",
      ring: "focus:ring-amber-500/20", focusBorder: "focus:border-amber-500/50",
      textHoverBg: "hover:text-amber-400 hover:bg-amber-500/10",
      gradientBg: "bg-gradient-to-br from-amber-600 to-amber-700 dark:from-amber-600/90 dark:to-amber-800/90",
      userBorder: "border-amber-500/30", userShadow: "shadow-amber-600/10",
      sendShadow: "shadow-amber-500/20", cardHover: "hover:bg-amber-500/10 hover:border-amber-500/30", cardTextHover: "group-hover:text-amber-400"
    },
    mint: {
      text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", bullet: "bg-emerald-400/60", heading: "text-emerald-400", codeBg: "bg-emerald-500/15", inlineCodeText: "text-emerald-300", accent: "#10b981",
      primary: "bg-emerald-500", primary600: "bg-emerald-600", primary700: "bg-emerald-700", primary800: "bg-emerald-800",
      ring: "focus:ring-emerald-500/20", focusBorder: "focus:border-emerald-500/50",
      textHoverBg: "hover:text-emerald-400 hover:bg-emerald-500/10",
      gradientBg: "bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-600/90 dark:to-emerald-800/90",
      userBorder: "border-emerald-500/30", userShadow: "shadow-emerald-600/10",
      sendShadow: "shadow-emerald-500/20", cardHover: "hover:bg-emerald-500/10 hover:border-emerald-500/30", cardTextHover: "group-hover:text-emerald-400"
    },
    crimson: {
      text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", bullet: "bg-red-400/60", heading: "text-red-400", codeBg: "bg-red-500/15", inlineCodeText: "text-red-300", accent: "#dc143c",
      primary: "bg-red-500", primary600: "bg-red-600", primary700: "bg-red-700", primary800: "bg-red-800",
      ring: "focus:ring-red-500/20", focusBorder: "focus:border-red-500/50",
      textHoverBg: "hover:text-red-400 hover:bg-red-500/10",
      gradientBg: "bg-gradient-to-br from-red-600 to-red-700 dark:from-red-600/90 dark:to-red-800/90",
      userBorder: "border-red-500/30", userShadow: "shadow-red-600/10",
      sendShadow: "shadow-red-500/20", cardHover: "hover:bg-red-500/10 hover:border-red-500/30", cardTextHover: "group-hover:text-red-400"
    },
    indigo: {
      text: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20", bullet: "bg-indigo-400/60", heading: "text-indigo-400", codeBg: "bg-indigo-500/15", inlineCodeText: "text-indigo-300", accent: "#6366f1",
      primary: "bg-indigo-500", primary600: "bg-indigo-600", primary700: "bg-indigo-700", primary800: "bg-indigo-800",
      ring: "focus:ring-indigo-500/20", focusBorder: "focus:border-indigo-500/50",
      textHoverBg: "hover:text-indigo-400 hover:bg-indigo-500/10",
      gradientBg: "bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-600/90 dark:to-indigo-800/90",
      userBorder: "border-indigo-500/30", userShadow: "shadow-indigo-600/10",
      sendShadow: "shadow-indigo-500/20", cardHover: "hover:bg-indigo-500/10 hover:border-indigo-500/30", cardTextHover: "group-hover:text-indigo-400"
    },
    emerald: {
      text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", bullet: "bg-emerald-400/60", heading: "text-emerald-400", codeBg: "bg-emerald-500/15", inlineCodeText: "text-emerald-300", accent: "#10b981",
      primary: "bg-emerald-500", primary600: "bg-emerald-600", primary700: "bg-emerald-700", primary800: "bg-emerald-800",
      ring: "focus:ring-emerald-500/20", focusBorder: "focus:border-emerald-500/50",
      textHoverBg: "hover:text-emerald-400 hover:bg-emerald-500/10",
      gradientBg: "bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-600/90 dark:to-emerald-800/90",
      userBorder: "border-emerald-500/30", userShadow: "shadow-emerald-600/10",
      sendShadow: "shadow-emerald-500/20", cardHover: "hover:bg-emerald-500/10 hover:border-emerald-500/30", cardTextHover: "group-hover:text-emerald-400"
    },
    coral: {
      text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", bullet: "bg-orange-400/60", heading: "text-orange-400", codeBg: "bg-orange-500/15", inlineCodeText: "text-orange-300", accent: "#ff7f50",
      primary: "bg-orange-500", primary600: "bg-orange-600", primary700: "bg-orange-700", primary800: "bg-orange-800",
      ring: "focus:ring-orange-500/20", focusBorder: "focus:border-orange-500/50",
      textHoverBg: "hover:text-orange-400 hover:bg-orange-500/10",
      gradientBg: "bg-gradient-to-br from-orange-600 to-orange-700 dark:from-orange-600/90 dark:to-orange-800/90",
      userBorder: "border-orange-500/30", userShadow: "shadow-orange-600/10",
      sendShadow: "shadow-orange-500/20", cardHover: "hover:bg-orange-500/10 hover:border-orange-500/30", cardTextHover: "group-hover:text-orange-400"
    }
  };

  const activeClasses = themeClasses[colorTheme] || themeClasses.default;
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  
  const loadingMessages = [
    "Our AI is deeply analyzing your academic file...",
    "Extracting critical core formulas and equations...",
    "Synthesizing high-density glassmorphic structures...",
    "Injecting interactive university-level exam distractors...",
    "Assembling your premium educational study guide..."
  ];
  const [loadingStep, setLoadingStep] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const session = await getStudentSession();
        if (session) {
          setSessionUser(session);
        }
      } catch (err) {
        console.error("Failed to load student session in AIModal:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

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

        // Flawlessly inject absolute SVG overrides directly inside each Mermaid SVG to force clean white backgrounds and black text for print
        clone.querySelectorAll('svg').forEach(svgEl => {
          const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
          style.innerHTML = `
            rect, polygon, circle, path.node, [class*="label"] rect, .edgeLabel rect, .label rect, rect.label-container, rect.edgeLabel {
              fill: #ffffff !important;
              background-color: #ffffff !important;
              background: #ffffff !important;
              stroke: #94a3b8 !important;
              stroke-width: 1.5px !important;
            }
            foreignObject, foreignObject div, foreignObject span, foreignObject *, .edgeLabel span, .label div, div.label {
              background: #ffffff !important;
              background-color: #ffffff !important;
              color: #000000 !important;
            }
            text, tspan, span, div, *, [class*="label"] *, .edgeLabel * {
              color: #000000 !important;
              fill: #000000 !important;
              font-weight: 800 !important;
            }
            path.edgePath, .edgePath .path, .edgePath path, marker path, .arrowheadPath {
              stroke: #475569 !important;
              fill: #475569 !important;
              stroke-width: 1.5px !important;
            }
          `;
          svgEl.appendChild(style);
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
          <title>${fileName}_neuri_summary</title>
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
              font-size: 24px !important; 
              font-weight: 900 !important; 
              color: ${activeThemeColor} !important; 
              margin: 48px 0 20px !important; 
              padding-left: 16px !important; 
              border-left: 6px solid ${activeThemeColor} !important; 
              padding-bottom: 4px !important;
              border-top: 2px dashed #cbd5e1 !important;
              padding-top: 24px !important;
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
                border: 1px solid #cbd5e1 !important;
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
                fill: #ffffff !important;
                stroke: #94a3b8 !important;
                stroke-width: 1.5px !important;
              }
              /* RESET ALL MERMAID DIAGRAM LABELS AND SHAPES TO PREVENT DARK/BLACK BOXES DURING PRINT */
              svg .edgeLabel rect, svg .label rect, svg rect.label-container, svg rect.edgeLabel,
              svg .edgeLabel span, svg foreignObject div, svg foreignObject span, svg .label div,
              svg [class*="label"] rect, svg [class*="label"] div, svg [class*="label"] span,
              .mermaid-dark .edgeLabel rect, .mermaid-light .edgeLabel rect,
              .mermaid-dark .label rect, .mermaid-light .label rect,
              .mermaid-dark .edgeLabel span, .mermaid-light .edgeLabel span,
              .mermaid-dark foreignObject div, .mermaid-light foreignObject div,
              .mermaid-dark foreignObject span, .mermaid-light foreignObject span {
                fill: #ffffff !important;
                background-color: #ffffff !important;
                background: #ffffff !important;
                color: #000000 !important;
                stroke: #cbd5e1 !important;
                border-color: #cbd5e1 !important;
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
              .mermaid-dark [class*="label"] *, .mermaid-light [class*="label"] *,
              svg .edgeLabel text, svg .edgeLabel tspan, svg .label text, svg .label tspan,
              .mermaid-dark .edgeLabel *, .mermaid-light .edgeLabel * {
                color: #000000 !important;
                fill: #000000 !important;
                font-weight: 700 !important;
              }
              /* Dash dividers for sections in printout */
              .content hr {
                border: none !important;
                border-top: 2px dashed #94a3b8 !important;
                margin: 36px 0 !important;
                height: 0 !important;
                display: block !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-flex">
              <img src="${window.location.origin}/images/Neuri/ai main.png" class="header-img" onerror="this.style.display='none'" />
              <div>
                <h1 class="title">Neuri AI Summary</h1>
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
              <span class="footer-text">Generated with Chameleon Native AI (Neuri)</span>
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

      /* Hide default absolute DialogClose button to prevent overlap */
      button.absolute.right-4.top-4,
      [data-state="open"] button.absolute.right-4.top-4 {
        display: none !important;
        opacity: 0 !important;
        visibility: hidden !important;
        pointer-events: none !important;
      }
    `}} />
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        onPointerDownOutside={(e) => e.preventDefault()} 
        className={cn(
          "w-[96vw] sm:w-full max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col p-0 overflow-hidden backdrop-blur-2xl border rounded-2xl sm:rounded-3xl pointer-events-auto z-[999999] transition-all duration-500",
          isDark ? "bg-[#070708]/96 border-white/5" : "bg-white/96 border-black/10"
        )}
        style={{ 
          borderColor: `${activeClasses.accent}25`,
          boxShadow: `0 0 60px -10px ${activeClasses.accent}25`
        }}
      >
        {/* Soft dynamic ambient glow centered in the background of the window */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.06] blur-[150px] transition-all duration-700" 
          style={{ 
            background: `radial-gradient(circle at 50% 50%, ${activeClasses.accent}, transparent 70%)` 
          }} 
        />
        
        <DialogHeader className={cn("p-3 sm:p-5 border-b shrink-0 relative z-10", isDark ? "border-white/5 bg-white/[0.01]" : "border-black/5 bg-black/[0.01]")}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-xl blur opacity-35 animate-pulse" style={{ backgroundColor: activeClasses.accent }} />
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border rounded-xl overflow-hidden shadow-md" style={{ backgroundColor: activeClasses.accent, borderColor: `${activeClasses.accent}40` }}>
                  <img src="/images/Neuri/ai main.png" alt="Neuri Logo" className="w-full h-full object-cover" />
                </div>
              </div>
              <div className="min-w-0">
                <DialogTitle className={cn("text-sm sm:text-lg font-bold tracking-tight truncate", isDark ? "text-white/90" : "text-slate-900")}>Neuri AI</DialogTitle>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                   <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-green-500/10 border-green-500/20 text-green-400 font-bold uppercase tracking-wider shrink-0">Online</Badge>
                   <span className="text-[9px] sm:text-[10px] text-muted-foreground/80 truncate max-w-[100px] sm:max-w-[200px] font-medium">{file.name}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-7 sm:h-8 text-[9px] sm:text-[10px] gap-1 sm:gap-2 transition-all rounded-full px-2.5 sm:px-3", isDark ? "border-white/10 bg-white/5 hover:bg-white/10" : "border-black/10 bg-black/5 hover:bg-black/10")}>
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
                <SelectTrigger className={cn("w-[85px] sm:w-[100px] h-7 sm:h-8 text-[9px] sm:text-[10px] rounded-full px-2 sm:px-3 focus:ring-offset-0 focus:ring-0 focus:ring-transparent", isDark ? "bg-white/5 border-white/10 focus:border-white/20" : "bg-black/5 border-black/10 focus:border-black/20", activeClasses.ring)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-border">
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value} className="text-[9px] sm:text-[10px]">{lang.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className={cn("h-7 sm:h-8 w-[1px] mx-0.5 sm:mx-1", isDark ? "bg-white/10" : "bg-black/10")} />
              
              <Badge variant="outline" className={cn("px-2 sm:px-3 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-bold rounded-full border shadow-sm", isDark ? "bg-white/[0.02]" : "bg-black/[0.02]", activeClasses.border, activeClasses.text)}>
                PRO
              </Badge>

              <div className={cn("h-7 sm:h-8 w-[1px] mx-0.5 sm:mx-1", isDark ? "bg-white/10" : "bg-black/10")} />

              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-7 w-7 sm:h-8 sm:w-8 rounded-full transition-all flex items-center justify-center shrink-0", isDark ? "hover:bg-white/5 text-muted-foreground hover:text-white" : "hover:bg-black/5 text-muted-foreground hover:text-black")}
                onClick={onClose}
              >
                <X className="w-3.5 h-3.5 sm:w-4 h-4" />
              </Button>
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
                  <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 py-8 md:py-12 max-w-4xl mx-auto w-full">
                    {/* Left Column: Mascot standing beautifully */}
                    <div className="relative shrink-0 flex items-center justify-center animate-fade-in">
                      <img 
                        src="/images/Neuri/ai (4).png" 
                        alt="AI Tutor Mascot" 
                        className="w-36 h-36 sm:w-44 sm:h-44 md:w-60 md:h-60 object-contain transition-transform duration-500 hover:scale-105" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/Neuri/ai (4).png";
                          (e.target as HTMLImageElement).className = "w-16 h-16 object-contain opacity-50";
                        }}
                      />
                    </div>
                    
                    {/* Right Column: Welcoming text and action cards */}
                    <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left min-w-0">
                      <h4 className={cn("text-xl sm:text-2xl font-black mb-2 sm:mb-3 tracking-tight", isDark ? "text-white/90" : "text-slate-900")}>
                        How can I help with this file?
                      </h4>
                      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed font-medium">
                        I've analyzed <span className="font-bold" style={{ color: activeClasses.accent }}>{file.name}</span>. 
                        Try one of these powerful actions to get started:
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                        <Button 
                          variant="outline" 
                          className={cn("flex-col gap-2.5 sm:gap-3 h-auto py-3.5 sm:py-5 transition-all rounded-2xl group shadow-lg", isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5", activeClasses.cardHover)}
                          onClick={() => sendMessage("", "summarize")}
                        >
                          <div className={cn("p-2 sm:p-3 rounded-xl transition-colors", activeClasses.bg)}>
                            <Sparkles className={cn("w-5 h-5 sm:w-6 sm:h-6", activeClasses.text)} />
                          </div>
                          <span className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors", activeClasses.cardTextHover)}>Summarize</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          className={cn("flex-col gap-2.5 sm:gap-3 h-auto py-3.5 sm:py-5 transition-all rounded-2xl group shadow-lg", isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5", activeClasses.cardHover)}
                          onClick={() => sendMessage("", "quiz")}
                        >
                          <div className={cn("p-2 sm:p-3 rounded-xl transition-colors", activeClasses.bg)}>
                            <Brain className={cn("w-5 h-5 sm:w-6 sm:h-6", activeClasses.text)} />
                          </div>
                          <span className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors", activeClasses.cardTextHover)}>Generate Quiz</span>
                        </Button>
                      </div>
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
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm overflow-hidden",
                      msg.role === "user" ? "bg-primary text-primary-foreground border-border" : ""
                    )} style={msg.role === "assistant" ? { backgroundColor: activeClasses.accent, borderColor: `${activeClasses.accent}40` } : undefined}>
                      {msg.role === "user" ? (
                        sessionUser?.profile_image ? (
                          <img src={sessionUser.profile_image} alt={sessionUser.username || "User"} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-4 h-4" />
                        )
                      ) : (
                        <img src="/images/Neuri/ai main.png" alt="Neuri AI" className="w-5 h-5 object-contain" />
                      )}
                    </div>
                    <div className={cn(
                      "flex flex-col gap-1 max-w-[90%] md:max-w-[85%]",
                      msg.role === "user" ? "items-end" : "items-start"
                    )}>
                      <div 
                        className={cn(
                          "p-6 rounded-2xl text-sm shadow-md border group relative overflow-hidden transition-all duration-300",
                          msg.role === "user" 
                            ? cn("text-white rounded-tr-none border", activeClasses.gradientBg, activeClasses.userBorder, activeClasses.userShadow) 
                            : "bg-muted/30 dark:bg-white/[0.01] backdrop-blur-md rounded-tl-none max-w-none border-border dark:border-white/5 shadow-black/5"
                        )}
                        style={msg.role === 'assistant' ? { borderLeft: `4px solid ${activeClasses.accent}` } : undefined}
                      >
                        {msg.role === 'assistant' && (
                          <div 
                            className="absolute -right-16 -top-16 w-36 h-36 rounded-full blur-3xl opacity-[0.06] pointer-events-none transition-all duration-500" 
                            style={{ backgroundColor: activeClasses.accent }}
                          />
                        )}
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
                            <div id={`msg-content-${idx}`} data-msg-content="true" className="ai-markdown-content relative animate-fade-in">
                              {/* Inject dynamic KaTeX styling overrides based on theme */}
                              <style>{`
                                #msg-content-${idx} .katex-display,
                                #msg-content-${idx} p > .katex:only-child,
                                #msg-content-${idx} p > .katex:first-child:last-child {
                                  display: block !important;
                                  clear: both !important;
                                  width: 100% !important;
                                  text-align: center !important;
                                  font-size: 1.32em !important;
                                  margin: 2.2rem 0 !important;
                                  padding: 28px 18px 20px 18px !important;
                                  background: rgba(255, 255, 255, 0.015) !important;
                                  border-radius: 16px !important;
                                  border: 1px solid ${activeClasses.accent}20 !important;
                                  border-left: 4px solid ${activeClasses.accent} !important;
                                  overflow-x: auto !important;
                                  overflow-y: hidden !important;
                                  box-shadow: 0 6px 24px -4px rgba(0, 0, 0, 0.4), inset 0 1px 1px 0 rgba(255, 255, 255, 0.05) !important;
                                  backdrop-filter: blur(8px) !important;
                                  position: relative !important;
                                }
                                #msg-content-${idx} .katex-display::before,
                                #msg-content-${idx} p > .katex:only-child::before,
                                #msg-content-${idx} p > .katex:first-child:last-child::before {
                                  content: 'FORMULA';
                                  position: absolute;
                                  top: 8px;
                                  left: 14px;
                                  font-size: 7.5px;
                                  font-weight: 800;
                                  letter-spacing: 0.15em;
                                  opacity: 0.45;
                                  color: ${activeClasses.accent};
                                }
                                #msg-content-${idx} .katex {
                                  display: inline-block !important;
                                  white-space: nowrap !important;
                                  font-size: 1.2em !important;
                                  color: #ffffff !important;
                                  padding: 2px 6px !important;
                                  background: ${activeClasses.accent}0d !important;
                                  border-radius: 6px !important;
                                  margin: 2px 0 !important;
                                }
                                #msg-content-${idx} .katex .mathnormal {
                                  color: ${activeClasses.accent} !important;
                                  font-weight: 700 !important;
                                }
                              `}</style>
                              <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[[rehypeKatex, { strict: false }]]}
                                components={{
                                  h2: ({ children }) => (
                                    <div className="w-full">
                                      {/* Gorgeous, glowing, custom separator line automatically rendered BEFORE any main heading h2! */}
                                      <div className="relative my-12 flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center">
                                          <div className="w-full h-px" style={{ backgroundImage: `linear-gradient(to right, transparent, ${activeClasses.accent}40, ${activeClasses.accent}40, transparent)` }} />
                                        </div>
                                        <div className={cn("relative w-2.5 h-2.5 rounded-full border shadow-md shadow-black/30 shrink-0 animate-pulse", activeClasses.bullet)} style={{ borderColor: `${activeClasses.accent}60` }} />
                                      </div>
                                      
                                      <h2 className={cn("text-2xl md:text-3xl font-black mt-6 mb-4 pb-3 flex items-center gap-3 tracking-tight transition-all duration-300", activeClasses.heading)}>
                                        {children}
                                      </h2>
                                    </div>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className={cn("text-xs font-extrabold mt-6 mb-3 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm border uppercase tracking-wider transition-all duration-300 hover:scale-[1.02]", activeClasses.bg, activeClasses.text, activeClasses.border)}>
                                      <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", activeClasses.bullet)} />
                                      {children}
                                    </h3>
                                  ),
                                  h4: ({ children }) => (
                                    <h4 className={cn("text-xs font-bold uppercase tracking-widest mt-5 mb-2 flex items-center gap-2", isDark ? "text-white/90" : "text-slate-800")}>
                                      <span className={cn("w-1.5 h-px", isDark ? "bg-white/30" : "bg-slate-300")} />
                                      {children}
                                    </h4>
                                  ),
                                  p: ({ children }) => (
                                    <p className={cn("text-[13.5px] leading-relaxed my-2", isDark ? "text-white/80" : "text-slate-800")}>{children}</p>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className={cn(
                                      "font-extrabold px-2 py-0.5 rounded-lg border text-[13px] inline-flex items-center gap-1 my-0.5 transition-all shadow-sm duration-300 hover:scale-[1.03]",
                                      activeClasses.text, activeClasses.border
                                    )} style={{ backgroundColor: `${activeClasses.accent}0d` }}>{children}</strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className={cn("italic font-medium", isDark ? "text-white/90" : "text-slate-900")}>{children}</em>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="space-y-2.5 my-4 ml-1 list-none">{children}</ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className={cn("space-y-2.5 my-4 ml-4 list-decimal list-outside", isDark ? "text-white/70" : "text-slate-700")}>{children}</ol>
                                  ),
                                  li: ({ children }) => {
                                    return (
                                      <li className={cn("text-[13.5px] flex items-start gap-3 my-2 leading-relaxed transition-all duration-300 group/li transform hover:translate-x-1", isDark ? "text-white/80 hover:text-white" : "text-slate-800 hover:text-slate-950")}>
                                        <span className={cn("mt-2.5 shrink-0 w-1.5 h-1.5 rounded-full shadow-sm shadow-black/20 transition-all duration-300 group-hover/li:scale-150 group-hover/li:shadow-lg", activeClasses.bullet)} style={{ boxShadow: `0 0 8px ${activeClasses.accent}` }} />
                                        <span className="flex-1 transition-all duration-300">{children}</span>
                                      </li>
                                    );
                                  },
                                  hr: () => (
                                    <div className="relative my-10 flex items-center justify-center">
                                      <div className="absolute inset-0 flex items-center">
                                        <div className="w-full h-px" style={{ backgroundImage: `linear-gradient(to right, transparent, ${activeClasses.accent}40, ${activeClasses.accent}40, transparent)` }} />
                                      </div>
                                      <div className={cn("relative w-2.5 h-2.5 rounded-full border shadow-md shadow-black/30 shrink-0 animate-pulse", activeClasses.bullet)} style={{ borderColor: `${activeClasses.accent}60` }} />
                                    </div>
                                  ),
                                  a: ({ href, children }) => (
                                    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("hover:opacity-80 underline underline-offset-4 font-semibold transition-all", activeClasses.text)}>{children}</a>
                                  ),
                                  table: ({ children }) => (
                                    <div className={cn("overflow-x-auto my-8 rounded-2xl border shadow-xl transition-all duration-300 backdrop-blur-sm", activeClasses.border, isDark ? "shadow-black/20 hover:shadow-black/30" : "shadow-black/5 hover:shadow-black/10")} style={{ backgroundColor: `${activeClasses.accent}03` }}>
                                      <table className="w-full text-[13px] border-collapse">{children}</table>
                                    </div>
                                  ),
                                  thead: ({ children }) => (
                                    <thead style={{ backgroundColor: `${activeClasses.accent}14` }}>{children}</thead>
                                  ),
                                  th: ({ children }) => (
                                    <th className={cn("px-5 py-3.5 text-left font-black border-b text-[11px] uppercase tracking-widest", activeClasses.text, activeClasses.border)}>{children}</th>
                                  ),
                                  td: ({ children }) => (
                                    <td className={cn("px-5 py-3 border-b text-[12.5px] leading-relaxed font-semibold", isDark ? "border-white/[0.04] text-white/70" : "border-black/[0.04] text-slate-750")}>{children}</td>
                                  ),
                                  tr: ({ children }) => (
                                    <tr className={cn("transition-colors duration-200", isDark ? "hover:bg-white/[0.03]" : "hover:bg-black/[0.02]")}>{children}</tr>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className={cn("relative border-l-4 rounded-r-2xl px-6 py-4.5 my-6 font-semibold text-[13.5px] italic shadow-md shadow-black/10 leading-relaxed backdrop-blur-md overflow-hidden", isDark ? "text-white/90 border-white/5" : "text-slate-900 border-black/5")} style={{ borderLeftColor: activeClasses.accent, backgroundImage: `linear-gradient(to right, ${activeClasses.accent}0c, transparent)` }}>
                                      <div className="absolute -top-1 -right-1 text-4xl opacity-5 select-none pointer-events-none font-serif">“</div>
                                      {children}
                                    </blockquote>
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
                                      <pre className={cn("rounded-xl p-4 my-3 overflow-x-auto border shadow-inner", isDark ? "bg-black/40 border-white/5" : "bg-black/[0.03] border-black/5 text-slate-800")}>{children}</pre>
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
                                      <code className={cn("px-1.5 py-0.5 rounded-md text-xs font-mono border", activeClasses.codeBg, activeClasses.inlineCodeText, activeClasses.border)} {...props}>{children}</code>
                                    ) : (
                                      <code className={cn("block text-xs font-mono", isDark ? "text-green-300/90" : "text-emerald-700", className)} {...props}>{children}</code>
                                    );
                                  },
                                }}
                              >
                                {preprocessMathContent(msg.content)}
                              </ReactMarkdown>
                            </div>
                            {msg.role === 'assistant' && (
                              <div data-pdf-exclude="true" className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className={cn("h-7 text-[10px] gap-1.5 text-muted-foreground transition-all rounded-lg", activeClasses.textHoverBg)}
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
                  <div className={cn(
                    "w-full flex flex-col items-center justify-center p-8 my-6 border rounded-3xl shadow-2xl backdrop-blur-md animate-fade-in relative overflow-hidden",
                    isDark ? "bg-white/[0.02] border-white/5" : "bg-black/[0.02] border-black/5"
                  )}>
                    <style>{`
                      @keyframes scan {
                        0% { top: 0%; opacity: 0.2; }
                        50% { top: 96%; opacity: 1; filter: drop-shadow(0 0 10px ${activeClasses.accent}); }
                        100% { top: 0%; opacity: 0.2; }
                      }
                    `}</style>
                    
                    {/* Glowing pulse ring around the premium Document container */}
                    <div className="relative w-42 h-44 mb-6 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group bg-muted/20 flex flex-col items-center justify-center p-6">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10 pointer-events-none" />
                      
                      {/* Breathtaking Glassmorphic Document Mockup */}
                      <div className={cn(
                        "relative w-22 h-30 rounded-xl border-2 flex flex-col p-3 transition-transform duration-500 group-hover:scale-105 shadow-xl z-20",
                        isDark ? "bg-white/[0.03] border-white/10" : "bg-black/[0.02] border-black/10"
                      )}>
                        {/* Document Title bar lines */}
                        <div className="w-8 h-2 rounded-full mb-3" style={{ backgroundColor: `${activeClasses.accent}30` }} />
                        {/* Text lines mockup */}
                        <div className="space-y-2">
                          <div className={cn("w-full h-1.5 rounded-full", isDark ? "bg-white/10" : "bg-black/10")} />
                          <div className={cn("w-11/12 h-1.5 rounded-full", isDark ? "bg-white/10" : "bg-black/10")} />
                          <div className={cn("w-4/5 h-1.5 rounded-full", isDark ? "bg-white/10" : "bg-black/10")} />
                          <div className={cn("w-10/12 h-1.5 rounded-full", isDark ? "bg-white/10" : "bg-black/10")} />
                        </div>
                        {/* Premium dynamic document/file icon in the middle */}
                        <div className="mt-auto flex items-center justify-between">
                          <FileText className={cn("w-5 h-5", activeClasses.text)} />
                          <span className={cn("text-[8px] font-black uppercase tracking-widest", activeClasses.text)}>
                            {file?.name?.split('.').pop() || "PDF"}
                          </span>
                        </div>
                      </div>

                      {/* Scanning neon laser line effect! */}
                      <div className="absolute inset-x-0 h-1 top-0 z-30 pointer-events-none" style={{ animation: "scan 2.5s ease-in-out infinite", backgroundImage: `linear-gradient(to right, transparent, ${activeClasses.accent}, transparent)` }} />
                    </div>

                    <div className="flex flex-col items-center gap-3.5 text-center max-w-md">
                      <div className="flex items-center gap-2">
                        <Loader2 className={cn("w-4.5 h-4.5 animate-spin", activeClasses.text)} />
                        <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-white/40" : "text-slate-500")}>Processing Document</span>
                      </div>
                      
                      {/* Dynamic Cycling Loading Message */}
                      <p className={cn("text-[14.5px] font-semibold transition-all duration-500 animate-fade-in px-4 min-h-[44px] flex items-center justify-center", isDark ? "text-white/95" : "text-slate-900")}>
                        {loadingMessages[loadingStep]}
                      </p>

                      <div className="flex gap-1.5 justify-center mt-1">
                        {loadingMessages.map((_, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all duration-300",
                              i === loadingStep ? cn("w-5", activeClasses.bullet) : (isDark ? "bg-white/10" : "bg-slate-300")
                            )} 
                          />
                        ))}
                      </div>
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
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(input);
                    }
                  }}
                  placeholder="Ask Neuri anything about this file..."
                  className={cn(
                    "h-14 pl-12 pr-16 bg-muted/40 border-border rounded-2xl transition-all shadow-inner", 
                    activeClasses.ring, 
                    activeClasses.focusBorder
                  )}
                  disabled={loading}
                />
                <div 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors"
                  style={{ color: isInputFocused ? activeClasses.accent : undefined }}
                >
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
                      input.trim() ? cn("text-white shadow-lg", activeClasses.primary600, activeClasses.primary700, activeClasses.sendShadow) : "bg-muted text-muted-foreground"
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
