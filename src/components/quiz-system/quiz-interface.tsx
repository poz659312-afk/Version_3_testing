"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Layers,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Play,
  CheckCircle,
  XCircle,
  Timer,
  Zap,
  Star,
  Target,
  Eye,
  Sparkles,
  Brain,
  Lightbulb,
  BookOpen,
  Cable,
  Snail,
  Infinity as InfinityIcon,
  User,
  Code,
  AlertCircle,
  Calculator as CalculatorIcon,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { getStudentSession } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Dialog as ImageDialog, DialogContent as ImageDialogContent } from "@/components/ui/dialog";
import Calculator from "@/components/Calculator";
import { InlineMath, BlockMath } from "react-katex";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { recordQuizCompletionAction } from "@/app/quiz/actions";
import { normalizeLatexMath } from "@/lib/quiz-math-normalizer";
import GradientWaves from "@/components/GradientWaves";
import { useTheme } from "@/components/theme-provider";
import { useColorTheme } from "@/components/color-theme-provider";

interface QuizQuestion {
  numb: number;
  question: string;
  type: string;
  answer: string;
  options: string[];
  image?: string | null;
  table?: string | null;
  explanation?: string | null;
}

interface QuizData {
  id: string;
  name: string;
  code: string;
  duration: number;
  jsonFile: string;
}

interface QuizInterfaceProps {
  quizData: QuizData;
  onExit: () => void;
  initialQuestions?: QuizQuestion[];
}

const durations = [
  { label: "Lightning", value: 1, icon: Zap, description: "1 Minute" },
  { label: "Short", value: 5, icon: Star, description: "5 Minutes" },
  { label: "Standard", value: 10, icon: Cable, description: "10 Minutes" },
  { label: "Extended", value: 15, icon: Clock, description: "15 Minutes" },
  { label: "Indolent", value: 30, icon: Snail, description: "30 Minutes" },
  { label: "Unlimited", value: 0, icon: InfinityIcon, description: "No Time Limit" },
];

const quizModes = [
  {
    id: "instant",
    name: "Instant Feedback",
    icon: Lightbulb,
    description: "See Answers & Explanations Immediately",
  },
  {
    id: "traditional",
    name: "Traditional Mode",
    icon: Brain,
    description: "Complete All Questions First Then See Results",
  },
];

// Helper functions to parse CSS colors (Hex, HSL, RGB) to clean Hex
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function parseCssColorToHex(val: string, fallback: string): string {
  if (!val || typeof val !== 'string') return fallback;
  const trimmed = val.trim();
  if (trimmed.startsWith('#')) return trimmed;
  
  const hslMatch = trimmed.match(/(?:hsl\s*\(\s*)?([\d.]+)(?:deg)?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?\s*\)?/i);
  if (hslMatch) {
    const h = parseFloat(hslMatch[1]);
    const s = parseFloat(hslMatch[2]);
    const l = parseFloat(hslMatch[3]);
    return hslToHex(h, s, l);
  }

  const rgbMatch = trimmed.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  return fallback;
}

// Color Theme Wave Palettes (Exact match to active globals.css theme palettes)
type ThemeWaveColors = {
  dark: { horizon: string; wave: string; crest: string };
  light: { horizon: string; wave: string; crest: string };
};

const THEME_WAVE_PALETTES: Record<string, ThemeWaveColors> = {
  default: {
    dark: { horizon: "#1c1404", wave: "#fdb827", crest: "#d8970e" },
    light: { horizon: "#fef9c3", wave: "#fdb827", crest: "#d8970e" },
  },
  volcano: {
    dark: { horizon: "#2c0b04", wave: "#ff4724", crest: "#fb7e13" },
    light: { horizon: "#ffedd5", wave: "#ff4724", crest: "#fb7e13" },
  },
  nightowl: {
    dark: { horizon: "#040d21", wave: "#1f89f5", crest: "#c842ef" },
    light: { horizon: "#e0f2fe", wave: "#1f89f5", crest: "#c842ef" },
  },
  skyblue: {
    dark: { horizon: "#031c30", wave: "#0da1e7", crest: "#61f0ff" },
    light: { horizon: "#e0f2fe", wave: "#0da1e7", crest: "#61f0ff" },
  },
  sunset: {
    dark: { horizon: "#260414", wave: "#e92063", crest: "#fa7b14" },
    light: { horizon: "#ffe4e6", wave: "#e92063", crest: "#fa7b14" },
  },
  forest: {
    dark: { horizon: "#041f0e", wave: "#16a249", crest: "#7bb422" },
    light: { horizon: "#dcfce7", wave: "#16a249", crest: "#7bb422" },
  },
  ocean: {
    dark: { horizon: "#03152e", wave: "#0075f5", crest: "#17a1ba" },
    light: { horizon: "#e0f2fe", wave: "#0075f5", crest: "#17a1ba" },
  },
  lavender: {
    dark: { horizon: "#16052e", wave: "#8c3df5", crest: "#bb47bd" },
    light: { horizon: "#f3e8ff", wave: "#8c3df5", crest: "#bb47bd" },
  },
  rose: {
    dark: { horizon: "#290414", wave: "#ee4599", crest: "#dc1c4b" },
    light: { horizon: "#ffe4e6", wave: "#ee4599", crest: "#dc1c4b" },
  },
  amber: {
    dark: { horizon: "#241002", wave: "#dc7706", crest: "#f59e0b" },
    light: { horizon: "#fef3c7", wave: "#dc7706", crest: "#f59e0b" },
  },
  mint: {
    dark: { horizon: "#032116", wave: "#36d399", crest: "#19bd9b" },
    light: { horizon: "#d1fae5", wave: "#36d399", crest: "#19bd9b" },
  },
  crimson: {
    dark: { horizon: "#29030b", wave: "#dc143c", crest: "#e22c3c" },
    light: { horizon: "#ffe4e6", wave: "#dc143c", crest: "#e22c3c" },
  },
  indigo: {
    dark: { horizon: "#0e0c29", wave: "#6366f1", crest: "#4f46e5" },
    light: { horizon: "#e0e7ff", wave: "#6366f1", crest: "#4f46e5" },
  },
  emerald: {
    dark: { horizon: "#032114", wave: "#36d399", crest: "#16a249" },
    light: { horizon: "#d1fae5", wave: "#36d399", crest: "#16a249" },
  },
  coral: {
    dark: { horizon: "#290a04", wave: "#ff7352", crest: "#fa7b61" },
    light: { horizon: "#ffedd5", wave: "#ff7352", crest: "#fa7b61" },
  },
  diamond: {
    dark: { horizon: "#031e29", wave: "#24edff", crest: "#0ba7db" },
    light: { horizon: "#cffafe", wave: "#24edff", crest: "#0ba7db" },
  },
  luxury: {
    dark: { horizon: "#211802", wave: "#ffc000", crest: "#500c73" },
    light: { horizon: "#fef9c3", wave: "#ffc000", crest: "#500c73" },
  },
  cyberpunk: {
    dark: { horizon: "#240316", wave: "#ff1493", crest: "#00c5e6" },
    light: { horizon: "#fdf2f8", wave: "#ff1493", crest: "#00c5e6" },
  },
  matrix: {
    dark: { horizon: "#021202", wave: "#00e600", crest: "#66ff66" },
    light: { horizon: "#dcfce7", wave: "#00e600", crest: "#0c310c" },
  },
  nebula: {
    dark: { horizon: "#1c0329", wave: "#ad2bf2", crest: "#f94e1f" },
    light: { horizon: "#f3e8ff", wave: "#ad2bf2", crest: "#f94e1f" },
  },
  glacier: {
    dark: { horizon: "#051a26", wave: "#66d9ff", crest: "#ccf2ff" },
    light: { horizon: "#e0f2fe", wave: "#66d9ff", crest: "#2c3f54" },
  },
  solaris: {
    dark: { horizon: "#240d02", wave: "#ffa200", crest: "#ed3507" },
    light: { horizon: "#ffedd5", wave: "#ffa200", crest: "#ed3507" },
  },
};

// Detect mobile devices and reduced motion
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches || isMobile);
    
    const listener = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches || isMobile);
    mediaQuery.addEventListener('change', listener);
    window.addEventListener('resize', checkMobile);
    
    return () => {
      mediaQuery.removeEventListener('change', listener);
      window.removeEventListener('resize', checkMobile);
    };
  }, [isMobile]);
  
  return { prefersReducedMotion: prefersReducedMotion || isMobile, isMobile };
}

// Helper function to shuffle an array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Helper function to shuffle options for each question
const shuffleOptions = (questionsList: QuizQuestion[]): QuizQuestion[] => {
  return questionsList.map((q) => ({
    ...q,
    options: shuffleArray(q.options),
  }));
};

// Helper to format LaTeX mathematically-like strings with inline and block KaTeX rendering
function SafeInlineMath({ math }: { math: string }) {
  try {
    return <InlineMath math={math} errorColor="#ef4444" renderError={() => <span className="text-muted-foreground font-mono text-xs">{math}</span>} />;
  } catch (_) {
    return <span className="font-mono text-xs">{math}</span>;
  }
}

function formatTextWithLatex(text?: string | null) {
  if (!text) return text;
  const normalized = normalizeLatexMath(text);
  const parts = normalized.split(/(\${1,2}[^$]+\${1,2})/g);
  return parts.map((part, i) => {
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
      const math = part.slice(2, -2).trim();
      return (
        <span key={i} className="inline-block my-1 px-2.5 py-1 rounded-xl bg-background/50 dark:bg-background/40 border border-white/15 dark:border-white/10 text-foreground shadow-sm align-middle" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
          <SafeInlineMath math={math} />
        </span>
      );
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      const math = part.slice(1, -1).trim();
      return (
        <span key={i} className="inline px-2 py-0.5 rounded-lg bg-background/40 dark:bg-background/30 border border-white/15 dark:border-white/10 text-foreground font-medium shadow-xs align-middle mx-0.5" style={{ wordBreak: 'break-word', whiteSpace: 'normal', display: 'inline-flex', alignItems: 'center' }}>
          <SafeInlineMath math={math} />
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function cleanOptionText(text?: string | null): string {
  if (!text) return "";
  const stripped = text.replace(/^[A-Z]\s*[\).\-]\s*/i, "");
  return normalizeLatexMath(stripped);
}

// Dedicated Reference Table Viewer component supporting LaTeX Arrays and GFM Tables
function TableRenderer({ tableContent }: { tableContent?: string | null }) {
  if (!tableContent) return null;
  const content = tableContent.trim();
  const isLatex = content.includes('\\begin{') || content.includes('\\hline') || content.startsWith('$$');
  const isMarkdownTable = content.includes('|') && content.includes('\n');

  if (isLatex) {
    let cleanLatex = content;
    if (cleanLatex.startsWith('$$') && cleanLatex.endsWith('$$')) {
      cleanLatex = cleanLatex.slice(2, -2).trim();
    } else if (cleanLatex.startsWith('$') && cleanLatex.endsWith('$')) {
      cleanLatex = cleanLatex.slice(1, -1).trim();
    }
    return (
      <div className="w-full overflow-x-auto py-4 px-2 flex justify-center items-center">
        <div className="text-foreground text-sm sm:text-base font-medium">
          <BlockMath math={cleanLatex} errorColor="#ef4444" renderError={() => <div className="whitespace-pre-wrap font-mono text-xs">{cleanLatex}</div>} />
        </div>
      </div>
    );
  }

  if (isMarkdownTable) {
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
    const headerLine = lines[0];
    const dataLines = lines.filter((_, idx) => idx !== 0 && !lines[idx].match(/^\|?\s*[-:]+[-| :]*\|?$/));

    const parseRow = (line: string) => {
      const trimmed = line.replace(/^\|/, '').replace(/\|$/, '');
      return trimmed.split('|').map(c => c.trim());
    };

    const headers = parseRow(headerLine);
    const rows = dataLines.map(parseRow);

    return (
      <div className="w-full overflow-x-auto rounded-2xl border border-white/15 dark:border-white/10 shadow-lg bg-background/50 backdrop-blur-md">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-white/15 dark:border-white/10 bg-primary/10 text-foreground font-bold">
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 text-xs uppercase tracking-wider font-extrabold text-primary">
                  {formatTextWithLatex(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className={cn("hover:bg-primary/5 transition-colors", rIdx % 2 === 1 ? "bg-muted/20 dark:bg-white/[0.02]" : "bg-transparent")}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-4 py-2.5 font-medium text-foreground">
                    {formatTextWithLatex(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-muted/20 border border-white/10 font-mono text-sm leading-relaxed whitespace-pre-wrap">
      {formatTextWithLatex(content)}
    </div>
  );
}

// Memoized Option Button Component with sleek border-free glass aesthetic
const OptionButton = memo(function OptionButton({ 
  option, 
  index, 
  isSelected, 
  isCorrectOption, 
  showFeedback, 
  isQuestionAnswered, 
  onSelect, 
  isMobile 
}: {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrectOption: boolean;
  showFeedback: boolean;
  isQuestionAnswered: boolean;
  onSelect: (option: string) => void;
  isMobile: boolean;
}) {
  const letter = String.fromCharCode(65 + index);

  return (
    <motion.button
      key={index}
      initial={!isMobile ? { opacity: 0, y: 15 } : false}
      animate={!isMobile ? { opacity: 1, y: 0 } : {}}
      transition={!isMobile ? { delay: index * 0.04 } : {}}
      whileHover={!showFeedback && !isQuestionAnswered && !isMobile ? { scale: 1.01, y: -2 } : {}}
      whileTap={!isQuestionAnswered && !isMobile ? { scale: 0.99 } : {}}
      onClick={() => !isQuestionAnswered && onSelect(option)}
      disabled={isQuestionAnswered}
      className={cn(
        "w-full flex items-center gap-3.5 md:gap-5 text-left select-none group focus:outline-none disabled:cursor-not-allowed transition-all duration-200",
        isQuestionAnswered && "cursor-not-allowed"
      )}
    >
      {/* Letter Box */}
      <div
        className={cn(
          "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl font-bold text-base md:text-lg transition-all duration-200 select-none shrink-0 shadow-sm backdrop-blur-xl",
          showFeedback
            ? isCorrectOption
              ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10"
              : isSelected
              ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40 shadow-rose-500/10"
              : "bg-background/40 dark:bg-background/30 text-muted-foreground border border-white/10 opacity-60"
            : isSelected
            ? "bg-primary text-primary-foreground border border-primary shadow-md shadow-primary/20 scale-105"
            : "bg-background/60 dark:bg-background/40 text-foreground border border-white/15 dark:border-white/10 group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary"
        )}
      >
        {letter}
      </div>

      {/* Option Content Box */}
      <div
        className={cn(
          "flex-1 p-4 md:p-5 rounded-2xl transition-all duration-200 relative overflow-hidden backdrop-blur-xl select-none flex items-center justify-between shadow-sm",
          showFeedback
            ? isCorrectOption
              ? "bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 border border-emerald-500/50 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/30"
              : isSelected
              ? "bg-rose-500/15 text-rose-950 dark:text-rose-200 border border-rose-500/50 shadow-md shadow-rose-500/10 ring-1 ring-rose-500/30"
              : "bg-background/30 dark:bg-background/20 text-foreground/70 border border-white/10 opacity-60"
            : isSelected
            ? "bg-primary/15 text-foreground border border-primary/50 shadow-lg shadow-primary/10 ring-2 ring-primary/30"
            : "bg-background/50 dark:bg-background/40 text-foreground border border-white/15 dark:border-white/10 hover:border-primary/40 hover:bg-background/70 hover:shadow-md"
        )}
      >
        <span className="text-base md:text-lg font-medium leading-relaxed flex-1">
          {formatTextWithLatex(cleanOptionText(option))}
        </span>
        
        {showFeedback && isCorrectOption && (
          <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 ml-3 animate-in zoom-in" />
        )}
        {showFeedback && isSelected && !isCorrectOption && (
          <XCircle className="w-6 h-6 text-rose-500 shrink-0 ml-3 animate-in zoom-in" />
        )}
      </div>
    </motion.button>
  );
});

// Confetti Fireworks (for correct instant answer)
const ConfettiParticles = memo(function ConfettiParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 32 }, (_, i) => ({
      id: i,
      angle: (i / 32) * 360,
      distance: 90 + Math.random() * 140,
      size: 4 + Math.random() * 8,
      color: ["#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"][i % 8],
      delay: Math.random() * 0.25,
      shape: i % 3,
    })),
  []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.distance;
        const y = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
            animate={{
              x,
              y: y + 50,
              opacity: [1, 1, 0],
              scale: [0, 1.4, 0.2],
              rotate: [0, 720],
            }}
            transition={{ duration: 1.1 + p.delay, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "50%",
              top: "45%",
              width: p.size,
              height: p.shape === 1 ? p.size * 2 : p.size,
              borderRadius: p.shape === 0 ? "50%" : p.shape === 1 ? "3px" : "1px",
              backgroundColor: p.color,
            }}
          />
        );
      })}
    </div>
  );
});

export default function QuizInterface({
  quizData,
  onExit,
  initialQuestions,
}: QuizInterfaceProps) {
  const { prefersReducedMotion, isMobile } = useReducedMotion();
  
  // Theme & Dark Mode dynamic detection for GradientWaves
  const { resolvedTheme, theme } = useTheme();
  const { colorTheme } = useColorTheme();
  const [isDark, setIsDark] = useState(true);
  const [liveThemeColors, setLiveThemeColors] = useState<{ horizon: string; wave: string; crest: string } | null>(null);

  useEffect(() => {
    const updateThemeColors = () => {
      const isDarkDom = document.documentElement.classList.contains("dark");
      const current = resolvedTheme || theme;
      const darkActive = isDarkDom || current === "dark";
      setIsDark(darkActive);

      const staticPalette = THEME_WAVE_PALETTES[colorTheme] || THEME_WAVE_PALETTES.default;
      const baseColors = darkActive ? staticPalette.dark : staticPalette.light;

      try {
        const computed = window.getComputedStyle(document.documentElement);
        const rawPrimary = computed.getPropertyValue("--primary");
        const rawSecondary = computed.getPropertyValue("--secondary");
        const rawAccent = computed.getPropertyValue("--accent");

        if (rawPrimary && rawPrimary.trim().length > 0) {
          const livePrimary = parseCssColorToHex(rawPrimary, baseColors.wave);
          const liveSecondary = parseCssColorToHex(rawSecondary || rawAccent, baseColors.crest);
          setLiveThemeColors({
            horizon: baseColors.horizon,
            wave: livePrimary,
            crest: liveSecondary,
          });
          return;
        }
      } catch {}

      setLiveThemeColors(baseColors);
    };

    updateThemeColors();

    const observer = new MutationObserver(updateThemeColors);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });
    return () => observer.disconnect();
  }, [resolvedTheme, theme, colorTheme]);

  const staticFallback = THEME_WAVE_PALETTES[colorTheme] || THEME_WAVE_PALETTES.default;
  const waveColors = liveThemeColors || (isDark ? staticFallback.dark : staticFallback.light);

  const [currentStep, setCurrentStep] = useState<"setup" | "quiz" | "results" | "review">("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [score, setScore] = useState(0);
  const [currentCombo, setCurrentCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [selectedMode, setSelectedMode] = useState("traditional");
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState<{ [key: number]: boolean }>({});
  const [quizStatus, setQuizStatus] = useState<"completed" | "timed-out">("completed");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [currentTable, setCurrentTable] = useState<string | null>(null);

  const handleShowTable = (table?: string | null) => {
    if (table) {
      setCurrentTable(table);
      setShowTableDialog(true);
    }
  };
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [confirmExitCheckbox, setConfirmExitCheckbox] = useState(false);
  const [enableNavigation, setEnableNavigation] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  
  // Quantum Warp Transition State
  const [isWarpingToQuiz, setIsWarpingToQuiz] = useState(false);
  const [warpPhase, setWarpPhase] = useState<"idle" | "charging" | "hyperjump" | "bloom">("idle");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submissionInProgress = useRef(false);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    correctAudioRef.current = new Audio("/audio/duolingo-correct.mp3");
    wrongAudioRef.current = new Audio("/audio/duolingo-wrong.mp3");
    correctAudioRef.current.preload = "auto";
    wrongAudioRef.current.preload = "auto";
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [showBannedDialog, setShowBannedDialog] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getStudentSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        if (session.is_banned) {
          setIsBanned(true);
          setShowBannedDialog(true);
          return;
        }
      }
    };
    
    sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
    checkAuth();
  }, [quizData.code]);
  
  const handleBannedLogout = async () => {
    try {
      const client = createBrowserClient();
      await client.auth.signOut({ scope: 'global' });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/auth/signin";
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = "/auth/signin";
    }
  };

  const loadQuestions = useCallback(async () => {
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(shuffleOptions(initialQuestions));
      return;
    }
    try {
      const response = await fetch(quizData.jsonFile);
      const data = await response.json();
      setQuestions(shuffleOptions(data));
    } catch (error) {
      console.error("Failed to load questions:", error);
      setQuestions(shuffleOptions([
        {
          numb: 1,
          question: "Sample question - What is 2 + 2?",
          type: "Mathematics",
          answer: "4",
          options: ["2", "3", "4", "5"],
          image: null,
        },
      ]));
    }
  }, [quizData.jsonFile, initialQuestions]);

  useEffect(() => {
    loadQuestions();
    
    if (currentStep === "quiz") {
      const savedAnswers = sessionStorage.getItem(`quiz_${quizData.code}_answers`);
      if (savedAnswers) {
        setUserAnswers(JSON.parse(savedAnswers));
      }
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (currentStep === "setup") {
        sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
      }
    };
  }, [loadQuestions, currentStep, quizData.code]);

  useEffect(() => {
    if (currentStep === "quiz" && Object.keys(userAnswers).length > 0) {
      sessionStorage.setItem(`quiz_${quizData.code}_answers`, JSON.stringify(userAnswers));
    }
  }, [userAnswers, quizData.code, currentStep]);
  
  useEffect(() => {
    if (currentStep === "setup") {
      sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
    }
  }, [currentStep, quizData.code]);

  const startQuiz = async () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    
    if (isBanned) {
      setShowBannedDialog(true);
      return;
    }

    if (prefersReducedMotion) {
      sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
      localStorage.removeItem(`quiz_${quizData.id}_result`);
      localStorage.removeItem(`quiz_${quizData.code}_result`);
      
      submissionInProgress.current = false;
      setQuizSubmitted(false);
      setScore(0);
      setCurrentCombo(0);
      setMaxCombo(0);
      
      setUserAnswers({});
      setAnswerRevealed({});
      setShowAnswer(false);
      setCurrentQuestion(0);
      
      setCurrentStep("quiz");

      if (selectedDuration > 0) {
        setTimeLeft(selectedDuration * 60);
      } else {
        setTimeLeft(Number.MAX_SAFE_INTEGER);
      }
      return;
    }

    // Trigger Hyper-Quantum Warp Transition Sequence
    setIsWarpingToQuiz(true);
    setWarpPhase("charging");

    setTimeout(() => {
      setWarpPhase("hyperjump");
    }, 450);

    setTimeout(() => {
      sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
      localStorage.removeItem(`quiz_${quizData.id}_result`);
      localStorage.removeItem(`quiz_${quizData.code}_result`);
      
      submissionInProgress.current = false;
      setQuizSubmitted(false);
      setScore(0);
      setCurrentCombo(0);
      setMaxCombo(0);
      
      setUserAnswers({});
      setAnswerRevealed({});
      setShowAnswer(false);
      setCurrentQuestion(0);
      
      setCurrentStep("quiz");

      if (selectedDuration > 0) {
        setTimeLeft(selectedDuration * 60);
      } else {
        setTimeLeft(Number.MAX_SAFE_INTEGER);
      }

      setWarpPhase("bloom");
    }, 950);

    setTimeout(() => {
      setIsWarpingToQuiz(false);
      setWarpPhase("idle");
    }, 1550);
  };

  const selectAnswer = useCallback((answer: string) => {
    if (selectedMode === "instant" && userAnswers[currentQuestion] !== undefined) {
      return;
    }

    setUserAnswers(prev => {
      const updated = {
        ...prev,
        [currentQuestion]: answer,
      };
      sessionStorage.setItem(`quiz_${quizData.code}_answers`, JSON.stringify(updated));
      return updated;
    });

    if (selectedMode === "instant") {
      setShowAnswer(true);
      setAnswerRevealed(prev => ({
        ...prev,
        [currentQuestion]: true,
      }));

      const isAnswerCorrect = answer === questions[currentQuestion]?.answer;
      if (isAnswerCorrect) {
        setShowConfetti(true);
        try { correctAudioRef.current?.play(); } catch {}
        setTimeout(() => { setShowConfetti(false); }, 1800);
        setCurrentCombo(prev => {
          const nextCombo = prev + 1;
          setMaxCombo(max => Math.max(max, nextCombo));
          return nextCombo;
        });
      } else {
        setShakeCard(true);
        try { wrongAudioRef.current?.play(); } catch {}
        setTimeout(() => { setShakeCard(false); }, 600);
        setCurrentCombo(0);
      }
    }
  }, [selectedMode, currentQuestion, userAnswers, quizData.code, questions]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setQuizStatus("completed");
      setCurrentStep("results");
    }
  }, [currentQuestion, questions.length]);

  const prevQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  }, [currentQuestion]);

  const handleShowImage = useCallback((imageUrl: string | null | undefined) => {
    if (imageUrl) {
      setCurrentImage(imageUrl);
      setShowImageDialog(true);
    }
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const saveScoreToSupabase = async (finalScore: number, status: "completed" | "timed-out") => {
    if (submissionInProgress.current && quizSubmitted) return;
    
    submissionInProgress.current = true;
    setQuizSubmitted(true);
    
    try {
      const session = await getStudentSession();
      if (!session) return;

      const quizId = quizData.code;
      let challengeId: string | null = null;
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        challengeId = urlParams.get("challengeId");
      }

      const result = await recordQuizCompletionAction({
        quizId,
        finalScore,
        totalQuestions: questions.length,
        status,
        answeringMode: selectedMode,
        durationSelected: selectedDuration,
        challengeId
      });

      if (!result.success) {
        console.error("Error saving quiz data to server:", result.error);
      } else {
        if (result.earnedCoins > 0) {
          toast.success(`Congratulations! You earned ${result.earnedCoins} coins!`, {
            icon: "🪙",
            duration: 5000,
          });
          await getStudentSession(true);
        }
      }
    } catch (error) {
      console.error("Unexpected error saving quiz data:", error);
    }
  };

  const saveScore = (finalScore: number, status: "completed" | "timed-out", finalMaxCombo: number) => {
    const quizResult = {
      quizId: quizData.code,
      score: finalScore,
      totalQuestions: questions.length,
      status: status,
      timestamp: new Date().toISOString(),
      answers: userAnswers,
      mode: selectedMode,
      duration: selectedDuration,
      maxCombo: finalMaxCombo,
    };

    localStorage.setItem(
      `quiz_${quizData.id}_result`,
      JSON.stringify(quizResult)
    );
  };

  const finishQuiz = useCallback((answersToUse = userAnswers) => {
    if (submissionInProgress.current) return;
    submissionInProgress.current = true;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    let correctAnswers = 0;
    let tempCombo = 0;
    let calculatedMaxCombo = 0;
    
    questions.forEach((question, index) => {
      const userAnswer = answersToUse[index]?.trim();
      const correctAnswer = question.answer?.trim();
      if (userAnswer === correctAnswer) {
        correctAnswers++;
        tempCombo++;
        if (tempCombo > calculatedMaxCombo) calculatedMaxCombo = tempCombo;
      } else {
        tempCombo = 0;
      }
    });

    setScore(correctAnswers);
    setMaxCombo(calculatedMaxCombo);
    setCurrentStep("results");
    sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
    saveScore(correctAnswers, quizStatus, calculatedMaxCombo);
    saveScoreToSupabase(correctAnswers, quizStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, userAnswers, quizStatus, quizData.code]);

  const getScoreMessage = () => {
    const percentage = Math.round((score / questions.length) * 100);
    if (percentage >= 90) return { message: "Outstanding! Perfect Mastery! 🏆", color: "text-amber-400" };
    if (percentage >= 80) return { message: "Excellent Work! Superb! 🌟", color: "text-emerald-400" };
    if (percentage >= 70) return { message: "Great Job! Keep it Up! 😎", color: "text-blue-400" };
    if (percentage >= 60) return { message: "Good Effort! Keep Practicing! 📚", color: "text-indigo-400" };
    return { message: "Keep Studying! You Will Conquer It! 💪", color: "text-rose-400" };
  };

  useEffect(() => {
    if (currentStep === "quiz" && selectedDuration > 0) {
      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentStep, selectedDuration]);

  const handleTimeExpired = useCallback(() => {
    if (submissionInProgress.current) return;
    submissionInProgress.current = true;
    
    setUserAnswers(currentAnswers => {
      let correctAnswers = 0;
      let tempCombo = 0;
      let calculatedMaxCombo = 0;
      questions.forEach((question, index) => {
        const userAnswer = currentAnswers[index]?.trim();
        const correctAnswer = question.answer?.trim();
        if (userAnswer === correctAnswer) {
          correctAnswers++;
          tempCombo++;
          if (tempCombo > calculatedMaxCombo) calculatedMaxCombo = tempCombo;
        } else {
          tempCombo = 0;
        }
      });

      setQuizStatus("timed-out");
      setScore(correctAnswers);
      setMaxCombo(calculatedMaxCombo);
      setCurrentStep("results");
      
      const quizResult = {
        quizId: quizData.code,
        score: correctAnswers,
        totalQuestions: questions.length,
        status: "timed-out" as const,
        timestamp: new Date().toISOString(),
        answers: currentAnswers,
        mode: selectedMode,
        duration: selectedDuration,
        maxCombo: calculatedMaxCombo,
      };
      localStorage.setItem(`quiz_${quizData.id}_result`, JSON.stringify(quizResult));
      saveScoreToSupabase(correctAnswers, "timed-out");
      return currentAnswers;
    });
  }, [questions, quizData.code, quizData.id, selectedDuration, selectedMode]);

  useEffect(() => {
    if (timeLeft === 0 && currentStep === "quiz" && selectedDuration > 0) {
      handleTimeExpired();
    }
  }, [timeLeft, currentStep, selectedDuration, handleTimeExpired]);

  useEffect(() => {
    if (selectedMode === "traditional" && currentStep === "quiz") {
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        const userAnswer = userAnswers[index]?.trim();
        const correctAnswer = question.answer?.trim();
        if (userAnswer === correctAnswer) correctAnswers++;
      });
      setScore(correctAnswers);
    }
  }, [userAnswers, selectedMode, currentStep, questions]);

  useEffect(() => {
    if (currentStep === "results" && quizStatus === "completed" && !submissionInProgress.current) {
      finishQuiz(userAnswers);
    }
  }, [currentStep, quizStatus, userAnswers, finishQuiz]);

  useEffect(() => {
    if (currentStep === "quiz") {
      const hasAnswer = userAnswers[currentQuestion] !== undefined;
      const wasRevealed = answerRevealed[currentQuestion] || false;
      setShowAnswer(selectedMode === "instant" && hasAnswer && wasRevealed);
    }
  }, [currentQuestion, currentStep, userAnswers, answerRevealed, selectedMode]);

  // GradientWaves Background Component Wrapper (Full-page, non-interactive, theme-adapted, consistent rich saturation)
  const BackgroundWaves = (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden select-none">
      <GradientWaves
        horizonColor={waveColors.horizon}
        waveColor={waveColors.wave}
        crestColor={waveColors.crest}
        speed={isWarpingToQuiz ? 0.75 : 0.3}
        amplitude={isWarpingToQuiz ? 2.5 : 2.2}
        waveScale={0.6}
        waveRatio={0.9}
        swell={isWarpingToQuiz ? 34 : 28}
        turbulence={isWarpingToQuiz ? 20 : 16}
        tilt={1.11}
        zoom={1.0}
        height={5.5}
        fogDepth={15}
        detail="low"
        brightness={isDark ? 0.9 : 1.05}
        opacity={isDark ? 0.9 : 0.8}
        mouseInteraction={false}
        parallaxStrength={0}
        grain
        grainIntensity={0.02}
      />
      {/* Light ambient glass tint - constant uniform saturation and tone */}
      <div className="absolute inset-0 bg-background/25 dark:bg-background/40 pointer-events-none" />
    </div>
  );

  // Creative 3D Quantum Cyber-Warp Transition Portal Overlay (GPU-Accelerated & Mobile-Optimized)
  const QuantumWarpPortal = (
    <AnimatePresence>
      {isWarpingToQuiz && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[120] pointer-events-none flex items-center justify-center overflow-hidden"
          style={{ willChange: "opacity" }}
        >
          {/* Subtle Ambient Radial Flare (Hardware-accelerated gradient without heavy gaussian blur passes) */}
          <motion.div
            animate={
              warpPhase === "hyperjump"
                ? { scale: [1, 1.8, 2.4], opacity: [0.25, 0.6, 0] }
                : { scale: [0.9, 1.1], opacity: [0.1, 0.3] }
            }
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute w-[90vw] max-w-[500px] h-[90vw] max-h-[500px] rounded-full bg-[radial-gradient(circle,rgba(var(--primary),0.35)_0%,rgba(var(--primary),0.08)_50%,transparent_70%)]"
            style={{ transform: "translateZ(0)", willChange: "transform, opacity" }}
          />

          {/* Dynamic Concentric Shockwave Rings */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360, scale: warpPhase === "hyperjump" ? [1, 1.3, 1.6] : [0.95, 1.05, 0.95] }}
              transition={{ rotate: { repeat: Infinity, duration: 3, ease: "linear" }, scale: { duration: 0.6 } }}
              className="w-56 h-56 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border border-dashed border-primary/50 flex items-center justify-center"
              style={{ transform: "translateZ(0)", willChange: "transform" }}
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                className="w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full border border-primary/40"
                style={{ transform: "translateZ(0)", willChange: "transform" }}
              />
            </motion.div>

            {/* Central Holographic Capsule & Mascot */}
            <div className="absolute flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.7, y: 10 }}
                animate={
                  warpPhase === "hyperjump"
                    ? { scale: [1, 1.25, 0.8], y: [0, -20, 0] }
                    : { scale: 1, y: 0 }
                }
                transition={{ duration: 0.4 }}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl bg-background/90 backdrop-blur-md border border-primary/60 shadow-[0_0_40px_rgba(var(--primary),0.35)] flex items-center justify-center p-3 relative overflow-hidden"
                style={{ transform: "translateZ(0)", willChange: "transform" }}
              >
                <img
                  src="/images/chameleon/06_chameleon_excited.webp"
                  alt="Warp Mascot"
                  loading="eager"
                  className="w-full h-full object-contain drop-shadow-md"
                />
                {/* Laser scanning line */}
                <motion.div
                  animate={{ y: [-35, 65, -35] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                  className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                  style={{ transform: "translateZ(0)" }}
                />
              </motion.div>

              {/* Cyber HUD Text */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                <span className="inline-block px-3.5 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary font-mono text-[11px] sm:text-xs font-black tracking-widest uppercase shadow-md shadow-primary/15 backdrop-blur-sm">
                  {warpPhase === "hyperjump" ? "⚡ ENGAGING SESSION ⚡" : "SYNCHRONIZING EXAM MATRIX..."}
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  /* ────────────────────────── STEP 1: SETUP SCREEN ────────────────────────── */
  if (currentStep === "setup") {
    return (
      <>
        {BackgroundWaves}
        {QuantumWarpPortal}

        {/* Auth Dialog */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="bg-background/80 backdrop-blur-2xl border border-white/15 dark:border-white/10 rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6 text-primary" />
                Authentication Required
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm pt-2">
                You need to be signed in to take this quiz and record your progress.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-6">
              <Button 
                onClick={() => { window.location.href = "/auth/signin"; }}
                className="w-full py-3 text-base font-semibold rounded-2xl bg-primary text-primary-foreground hover:opacity-90 shadow-md"
              >
                Sign In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAuthDialog(false)}
                className="w-full py-3 text-base rounded-2xl border-white/15 dark:border-white/10 hover:bg-muted/40"
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>



        {/* Banned Dialog */}
        <Dialog open={showBannedDialog} onOpenChange={() => {}}>
          <DialogContent className="bg-background/80 backdrop-blur-2xl border border-rose-500/40 rounded-3xl p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-rose-500">
                <XCircle className="w-6 h-6" />
                Account Restricted
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm pt-2">
                Your account is currently suspended from taking quizzes. Contact support for assistance.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <Button 
                onClick={handleBannedLogout}
                className="w-full py-3 text-base rounded-2xl bg-rose-600 hover:bg-rose-700 text-white"
              >
                Sign Out
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <motion.div
          animate={
            isWarpingToQuiz
              ? { scale: 0.88, rotateX: 20, y: -25, filter: "blur(8px)", opacity: 0.15 }
              : { scale: 1, rotateX: 0, y: 0, filter: "blur(0px)", opacity: 1 }
          }
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="relative min-h-screen w-full flex flex-col items-center justify-center py-10 px-4 md:px-8"
          style={{ perspective: 1200 }}
        >
          
          {/* Header Brand */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center flex flex-col items-center gap-2 z-10"
          >
            <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/images/Duolingo.svg"
                alt="Chameleon Quiz"
                width={170}
                height={40}
                className="h-10 w-auto drop-shadow-md"
              />
            </Link>
            <span className="text-xs font-bold uppercase tracking-widest text-primary/80 bg-primary/10 px-3 py-1 rounded-full border border-primary/20 backdrop-blur-md mt-1">
              Interactive Assessment Mode
            </span>
          </motion.div>

          {/* Setup Main Glass Panel */}
          <div className="relative z-10 w-full max-w-5xl">
            <div className="bg-background/40 dark:bg-background/30 backdrop-blur-2xl border border-white/15 dark:border-white/10 shadow-2xl rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden">
              
              {/* Back navigation */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
                    window.history.back();
                  }}
                  className="rounded-full px-4 border border-white/15 dark:border-white/10 bg-background/50 hover:bg-background/80 text-foreground transition-all"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Badge
                  variant="outline"
                  className="text-xs md:text-sm px-4 py-1.5 border-primary/30 text-primary bg-primary/10 rounded-full font-semibold"
                >
                  Code: {quizData.code}
                </Badge>
              </div>

              {/* Title & Info */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-4 text-primary shadow-lg shadow-primary/15"
                >
                  <Target className="w-8 h-8 md:w-10 md:h-10" />
                </motion.div>
                <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-tight mb-3">
                  {quizData.name}
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto font-medium">
                  Configure your session parameters and start your dynamic mastery journey.
                </p>

                {quizData.id === "ai-generated" && (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 max-w-xl mx-auto mt-5 text-center text-xs md:text-sm text-amber-500 dark:text-amber-300 font-medium leading-relaxed backdrop-blur-md">
                    <span className="font-bold block mb-1">⚠️ AI Generated Practice Session</span>
                    This quiz is for study and practice purposes only. Session results are not recorded in official academic records.
                  </div>
                )}
              </div>

              {/* Settings Configuration Grid */}
              <div className="space-y-8">
                {/* 1. Mode Selection */}
                <div>
                  <label className="text-base md:text-lg font-bold mb-3.5 flex items-center text-foreground">
                    <Sparkles className="w-5 h-5 mr-2.5 text-primary" />
                    Quiz Experience Mode
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quizModes.map((mode) => {
                      const IconComponent = mode.icon;
                      const isChosen = selectedMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setSelectedMode(mode.id)}
                          className={cn(
                            "p-5 rounded-2xl transition-all duration-200 text-left relative overflow-hidden backdrop-blur-xl group flex items-start gap-4 shadow-sm",
                            isChosen
                              ? "bg-primary/15 border border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                              : "bg-background/40 dark:bg-background/25 border border-white/15 dark:border-white/10 hover:border-primary/40 hover:bg-background/60"
                          )}
                        >
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                            isChosen ? "bg-primary text-primary-foreground shadow-md" : "bg-primary/10 text-primary group-hover:bg-primary/20"
                          )}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-base font-bold text-foreground mb-1">{mode.name}</div>
                            <div className="text-xs md:text-sm text-muted-foreground font-medium">{mode.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Duration Selection */}
                <div>
                  <label className="text-base md:text-lg font-bold mb-3.5 flex items-center text-foreground">
                    <Timer className="w-5 h-5 mr-2.5 text-primary" />
                    Session Time Limit
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {durations.map((duration) => {
                      const IconComponent = duration.icon;
                      const isChosen = selectedDuration === duration.value;
                      return (
                        <button
                          key={duration.value}
                          onClick={() => setSelectedDuration(duration.value)}
                          className={cn(
                            "p-4 rounded-2xl transition-all duration-200 text-center backdrop-blur-xl flex flex-col items-center justify-center shadow-sm",
                            isChosen
                              ? "bg-primary/15 border border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10 scale-[1.02]"
                              : "bg-background/40 dark:bg-background/25 border border-white/15 dark:border-white/10 hover:border-primary/40 hover:bg-background/60"
                          )}
                        >
                          <IconComponent className={cn(
                            "w-6 h-6 mb-2 transition-colors",
                            isChosen ? "text-primary scale-110" : "text-muted-foreground"
                          )} />
                          <div className="text-sm font-bold text-foreground mb-0.5">{duration.label}</div>
                          <div className="text-[11px] text-muted-foreground">{duration.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Navigation Mode */}
                <div>
                  <label className="text-base md:text-lg font-bold mb-3.5 flex items-center text-foreground">
                    <Layers className="w-5 h-5 mr-2.5 text-primary" />
                    Navigation Policy
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setEnableNavigation(true)}
                      className={cn(
                        "p-5 rounded-2xl transition-all duration-200 text-left backdrop-blur-xl flex items-start gap-4 shadow-sm",
                        enableNavigation
                          ? "bg-primary/15 border border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                          : "bg-background/40 dark:bg-background/25 border border-white/15 dark:border-white/10 hover:border-primary/40 hover:bg-background/60"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        enableNavigation ? "bg-primary text-primary-foreground shadow-md" : "bg-primary/10 text-primary"
                      )}>
                        <ArrowRight className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-foreground mb-1">Free Navigation</div>
                        <div className="text-xs md:text-sm text-muted-foreground font-medium">
                          Move back and forth between questions at any time (Practice style).
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => setEnableNavigation(false)}
                      className={cn(
                        "p-5 rounded-2xl transition-all duration-200 text-left backdrop-blur-xl flex items-start gap-4 shadow-sm",
                        !enableNavigation
                          ? "bg-primary/15 border border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/10"
                          : "bg-background/40 dark:bg-background/25 border border-white/15 dark:border-white/10 hover:border-primary/40 hover:bg-background/60"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        !enableNavigation ? "bg-primary text-primary-foreground shadow-md" : "bg-primary/10 text-primary"
                      )}>
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-base font-bold text-foreground mb-1">Strict Exam Mode</div>
                        <div className="text-xs md:text-sm text-muted-foreground font-medium">
                          Answer to unlock the next question sequentially (Standard test style).
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 4. Overview Metrics */}
                <div className="p-6 rounded-2xl bg-background/30 dark:bg-background/20 backdrop-blur-xl border border-white/10">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl md:text-3xl font-black text-foreground mb-0.5">{questions.length}</div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Total Questions</div>
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-black text-foreground mb-0.5">{selectedDuration === 0 ? "∞" : `${selectedDuration}m`}</div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Duration</div>
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-black text-primary mb-0.5">{enableNavigation ? "Free" : "Strict"}</div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Navigation</div>
                    </div>
                    <div>
                      <div className="text-2xl md:text-3xl font-black text-foreground mb-0.5">{selectedMode === "instant" ? "Instant" : "Traditional"}</div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Feedback</div>
                    </div>
                  </div>
                </div>

                {/* Start Action Button */}
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <button
                    onClick={startQuiz}
                    disabled={isWarpingToQuiz}
                    className={cn(
                      "w-full py-5 text-lg md:text-xl font-bold rounded-2xl transition-all duration-200 flex items-center justify-center select-none shadow-xl",
                      isWarpingToQuiz
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:brightness-110 shadow-primary/25"
                    )}
                  >
                    <Play className="w-6 h-6 mr-3 fill-current" />
                    {isWarpingToQuiz ? "Initializing Session..." : "Begin Quiz Adventure"}
                  </button>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  /* ────────────────────────── STEP 2: QUIZ ACTIVE SCREEN ────────────────────────── */
  if (currentStep === "quiz") {
    const currentQ = questions[currentQuestion];
    const isAnswered = userAnswers[currentQuestion] !== undefined;
    const isCorrect = userAnswers[currentQuestion] === currentQ?.answer;

    return (
      <>
        {BackgroundWaves}

        {/* Exit Confirmation Dialog */}
        <Dialog 
          open={showExitConfirm} 
          onOpenChange={(open) => {
            setShowExitConfirm(open);
            if (!open) setConfirmExitCheckbox(false);
          }}
        >
          <DialogContent className="bg-background/95 backdrop-blur-2xl border border-white/15 dark:border-white/10 max-w-md w-[92vw] sm:w-full rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-xl sm:text-2xl font-black flex items-center gap-3 text-rose-500">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500 shrink-0">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <span>Exit Current Session?</span>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Leaving now will discard all your scored answers and ongoing combo streak in this session.
              </DialogDescription>
            </DialogHeader>
            
            <div className="my-4 flex items-start gap-3 p-4 bg-rose-500/5 border border-rose-500/15 rounded-2xl">
              <input
                id="confirm-exit-checkbox"
                type="checkbox"
                checked={confirmExitCheckbox}
                onChange={(e) => setConfirmExitCheckbox(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-500 shrink-0"
              />
              <label htmlFor="confirm-exit-checkbox" className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium cursor-pointer select-none">
                I understand that active quiz progress and session answers will be lost.
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 w-full">
              <Button
                variant="outline"
                onClick={() => {
                  setShowExitConfirm(false);
                  setConfirmExitCheckbox(false);
                }}
                className="w-full h-11 rounded-2xl text-sm font-semibold border-white/15 dark:border-white/10 hover:bg-muted/40 order-2 sm:order-1"
              >
                Continue Quiz
              </Button>
              <Button
                onClick={() => {
                  setShowExitConfirm(false);
                  sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
                  onExit();
                }}
                disabled={!confirmExitCheckbox}
                className={cn(
                  "w-full h-11 rounded-2xl text-sm font-bold transition-all order-1 sm:order-2",
                  confirmExitCheckbox
                    ? "bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                )}
              >
                Exit Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Full-page Quiz Layout */}
        <div className="relative min-h-screen w-full flex flex-col justify-between py-6 px-4 md:px-8">
          
          {/* Top Control Layer */}
          <div className="relative z-30 max-w-5xl mx-auto w-full h-11 md:h-12 flex items-center justify-between">
            {/* Exit button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowExitConfirm(true)}
              className="rounded-full h-11 w-11 border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 backdrop-blur-md shadow-sm transition-all"
            >
              <span className="text-lg font-bold">✖</span>
            </Button>

            {/* Dynamic Floating Pill Island (Overlay: does not push content down) */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 z-50 flex flex-col items-center">
              {isIslandExpanded && (
                <div
                  className="fixed inset-0 z-0 bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsIslandExpanded(false);
                  }}
                />
              )}
              <motion.div
                layout
                onClick={() => setIsIslandExpanded(!isIslandExpanded)}
                initial={{ borderRadius: 32 }}
                animate={{
                  width: isIslandExpanded ? (isMobile ? 310 : 360) : (selectedDuration > 0 ? 190 : 140),
                  height: isIslandExpanded ? 160 : 44,
                  borderRadius: isIslandExpanded ? 24 : 32,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="relative z-10 bg-background/80 dark:bg-background/70 backdrop-blur-2xl border border-white/15 dark:border-white/10 shadow-2xl cursor-pointer overflow-hidden flex flex-col"
              >
                {/* Collapsed Pill */}
                <motion.div
                  layout
                  className={cn(
                    "w-full h-[44px] flex items-center justify-between px-4.5",
                    isIslandExpanded ? "opacity-0 absolute" : "opacity-100 relative"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground text-sm font-bold">
                      {currentQuestion + 1}/{questions.length}
                    </span>
                  </div>
                  
                  {selectedDuration > 0 ? (
                    <div className="flex items-center gap-1.5 text-primary">
                      <Clock className="w-4 h-4 animate-pulse" />
                      <span className="font-mono text-sm font-bold tracking-wider">
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <InfinityIcon className="w-4 h-4" />
                    </div>
                  )}
                </motion.div>

                {/* Expanded Island Card */}
                <motion.div
                  layout
                  animate={{ opacity: isIslandExpanded ? 1 : 0 }}
                  className={cn(
                    "w-full h-full p-5 flex flex-col justify-between",
                    !isIslandExpanded && "pointer-events-none absolute"
                  )}
                >
                  <div className="flex justify-between items-start w-full">
                    <div>
                      <h3 className="text-foreground font-bold text-base line-clamp-1">{quizData.name}</h3>
                      <p className="text-muted-foreground text-xs uppercase tracking-wider mt-0.5">{currentQ?.type}</p>
                    </div>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center bg-primary/10 text-primary">
                      {selectedDuration > 0 ? <Timer className="w-4 h-4" /> : <InfinityIcon className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  <div className="w-full space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
                      <span>Overall Progress</span>
                      <span className="text-foreground">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-background/50 rounded-full h-2 overflow-hidden border border-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.4 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                    
                    {selectedDuration > 0 && (
                      <div className="flex justify-between items-center pt-1.5 border-t border-white/10 text-xs">
                        <span className="text-muted-foreground">Time Left:</span>
                        <span className="font-mono text-primary font-bold">{formatTime(timeLeft)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* Quick Calculator Shortcut */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCalculator(!showCalculator)}
              className="rounded-full h-11 w-11 border border-white/15 dark:border-white/10 bg-background/50 hover:bg-background/80 text-foreground backdrop-blur-md shadow-sm transition-all"
            >
              <CalculatorIcon className="w-5 h-5 text-primary" />
            </Button>
          </div>

          {/* Question Card Center Stage */}
          <div className="relative z-10 w-full max-w-5xl mx-auto my-6 flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.25 }}
                className="relative"
              >
                {showConfetti && <ConfettiParticles />}

                <motion.div
                  animate={shakeCard ? { x: [-6, 6, -6, 6, -3, 3, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className="bg-background/40 dark:bg-background/30 backdrop-blur-2xl border border-white/15 dark:border-white/10 shadow-2xl rounded-3xl md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden"
                >
                  {/* Question Header & Type Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {currentQ?.type && (
                        <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 bg-background/50 text-muted-foreground rounded-full border border-white/10">
                          {currentQ.type}
                        </span>
                      )}
                      {selectedMode === "instant" && currentCombo >= 2 && (
                        <span className="text-xs font-black uppercase tracking-wider px-3 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/35 rounded-full flex items-center gap-1">
                          🔥 {currentCombo}x Streak
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {currentQ?.table && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowTable(currentQ.table)}
                          className="rounded-full px-3.5 h-8 border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary transition-all text-xs font-bold shadow-xs flex items-center gap-1.5 animate-in fade-in"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Reference Table</span>
                        </Button>
                      )}

                      {currentQ?.image && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowImage(currentQ.image)}
                          className="rounded-full px-4 border-white/15 bg-background/60 hover:bg-background text-primary transition-all text-xs"
                        >
                          <Code className="w-3.5 h-3.5 mr-1.5" />
                          Code Reference
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-relaxed">
                      {formatTextWithLatex(currentQ?.question)}
                    </h2>
                  </div>

                  {/* Options List */}
                  <div className="space-y-3.5 md:space-y-4">
                    {currentQ?.options.map((option, index) => {
                      const isSelected = userAnswers[currentQuestion] === option;
                      const isCorrectOption = option === currentQ.answer;
                      const showFeedback = selectedMode === "instant" && showAnswer;
                      const isQuestionAnswered = selectedMode === "instant" && userAnswers[currentQuestion] !== undefined;

                      return (
                        <OptionButton
                          key={index}
                          option={option}
                          index={index}
                          isSelected={isSelected}
                          isCorrectOption={isCorrectOption}
                          showFeedback={showFeedback}
                          isQuestionAnswered={isQuestionAnswered}
                          onSelect={selectAnswer}
                          isMobile={isMobile}
                        />
                      );
                    })}
                  </div>

                  {/* Instant Feedback Mascot Card (Responsive Stack: Top Mascot Row + 100% Width Explanation + Bottom Button) */}
                  {selectedMode === "instant" && showAnswer && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "mt-6 p-4 sm:p-6 rounded-3xl backdrop-blur-2xl relative overflow-hidden border shadow-xl flex flex-col gap-4",
                        isCorrect
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-200"
                          : "bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-200"
                      )}
                    >
                      {/* Top Header Row: Mascot + Status Title + Streak */}
                      <div className="flex items-center gap-3.5 sm:gap-4 w-full">
                        <div className="shrink-0 flex items-center justify-center">
                          <img
                            src={isCorrect ? "/images/chameleon/10_chameleon_success.png" : "/images/chameleon/08_chameleon_angry.webp"}
                            alt={isCorrect ? "Success Chameleon" : "Angry Chameleon"}
                            loading="lazy"
                            decoding="async"
                            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain drop-shadow-xl select-none"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-tight">
                              {isCorrect ? "Brilliant! You got it right!" : "Incorrect Choice"}
                            </h4>
                            {isCorrect && currentCombo >= 2 && (
                              <span className="px-2.5 py-0.5 bg-amber-500 text-white text-xs font-black rounded-full shadow-sm">
                                🔥 {currentCombo}x
                              </span>
                            )}
                          </div>

                          {!isCorrect && (
                            <p className="text-xs sm:text-sm md:text-base font-bold mt-1 text-foreground/90 leading-snug">
                              Correct Answer: <span className="underline decoration-rose-500 font-extrabold">{formatTextWithLatex(cleanOptionText(currentQ?.answer))}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Explanation Block (Spans 100% full width with zero squeezing) */}
                      {currentQ?.explanation && (
                        <div className="w-full text-xs sm:text-sm md:text-base font-medium leading-relaxed bg-background/50 dark:bg-background/40 p-3.5 sm:p-4 rounded-2xl border border-white/10 text-foreground break-words">
                          <span className="font-bold block mb-1 text-[11px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                            Explanation:
                          </span>
                          {formatTextWithLatex(currentQ.explanation)}
                        </div>
                      )}

                      {/* Bottom Footer Row: Continue Button */}
                      {!enableNavigation && (
                        <div className="w-full pt-1 flex justify-end">
                          <Button
                            onClick={nextQuestion}
                            className="w-full sm:w-auto px-7 py-2.5 h-11 rounded-2xl font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-md transition-all flex items-center justify-center gap-2"
                          >
                            <span>{currentQuestion === questions.length - 1 ? "Finish Quiz" : "Continue"}</span>
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Floating Bottom Control Dock */}
          <div className="relative z-30 max-w-4xl mx-auto w-full pt-2">
            <div className="bg-background/60 dark:bg-background/40 backdrop-blur-2xl border border-white/15 dark:border-white/10 rounded-full px-5 py-3 shadow-2xl flex items-center justify-between">
              {enableNavigation ? (
                <Button
                  variant="ghost"
                  onClick={prevQuestion}
                  disabled={currentQuestion === 0}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-background/60 transition-all"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
              ) : (
                <div className="w-20" />
              )}

              {/* Central Question indicator */}
              <div className="text-xs md:text-sm font-bold text-muted-foreground">
                <span className="text-foreground">{currentQuestion + 1}</span> of {questions.length}
              </div>

              {selectedMode === "traditional" || enableNavigation ? (
                <Button
                  onClick={nextQuestion}
                  disabled={!enableNavigation && !isAnswered}
                  className="rounded-full px-6 py-2.5 text-sm font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-md shadow-primary/20 transition-all"
                >
                  {currentQuestion === questions.length - 1 ? (
                    <>
                      <Trophy className="w-4 h-4 mr-1.5" />
                      Finish
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </>
                  )}
                </Button>
              ) : (
                <div className="w-20" />
              )}
            </div>
          </div>
        </div>

        {/* Calculator Overlay */}
        <AnimatePresence>
          {showCalculator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
              onClick={() => setShowCalculator(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-md bg-background/90 backdrop-blur-2xl border border-white/15 dark:border-white/10 rounded-3xl p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                    <CalculatorIcon className="w-5 h-5 text-primary" />
                    Scientific Calculator
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCalculator(false)}
                    className="rounded-full h-8 w-8 hover:bg-muted"
                  >
                    ✖
                  </Button>
                </div>
                <Calculator />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Dialog */}
        <ImageDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <ImageDialogContent className="bg-background/90 backdrop-blur-2xl border border-white/15 dark:border-white/10 max-w-4xl rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Code Reference</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageDialog(false)}
                className="rounded-full px-3"
              >
                ✖
              </Button>
            </div>
            {currentImage && (
              <div className="relative w-full h-96 bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage}
                  alt="Code reference"
                  className="max-w-full max-h-full object-contain p-2"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Refer to this snippet to answer Question #{currentQuestion + 1}
            </p>
          </ImageDialogContent>
        </ImageDialog>

        {/* Table Reference Modal Dialog */}
        <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
          <DialogContent className="bg-background/95 dark:bg-background/90 backdrop-blur-2xl border border-white/15 dark:border-white/10 max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/10 space-y-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center border border-primary/25">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-foreground">Reference Table / Data</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Academic reference matrix or dataset for Question #{currentQuestion + 1}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="my-4 max-h-[65vh] overflow-y-auto pr-1">
              <TableRenderer tableContent={currentTable} />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <Button
                onClick={() => setShowTableDialog(false)}
                className="px-5 py-2 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-110"
              >
                Close Table
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  /* ────────────────────────── STEP 3: RESULTS SCREEN ────────────────────────── */
  if (currentStep === "results") {
    const percentage = Math.round((score / questions.length) * 100);
    const scoreInfo = getScoreMessage();
    
    let formattedTimeTaken = "Unlimited";
    if (selectedDuration > 0) {
      const totalSeconds = (selectedDuration * 60) - timeLeft;
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      formattedTimeTaken = `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    
    const isPassing = percentage >= 60;

    return (
      <>
        {BackgroundWaves}

        <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-4xl"
          >
            <div className="bg-background/40 dark:bg-background/30 backdrop-blur-2xl border border-white/15 dark:border-white/10 shadow-2xl rounded-3xl md:rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden text-center">
              
              {/* Victory Mascot Showcase */}
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220, damping: 18 }}
                className="relative w-40 h-40 md:w-52 md:h-52 mx-auto mb-6 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-90" />
                <Image
                  src="/images/chameleon/16_chameleon_victory.png"
                  alt="Victory Mascot"
                  width={220}
                  height={220}
                  className="w-full h-full object-contain drop-shadow-2xl select-none"
                  priority
                />
              </motion.div>

              <Badge 
                className={cn(
                  "mb-4 text-xs font-bold px-4 py-1.5 rounded-full border shadow-sm",
                  quizStatus === "timed-out" 
                    ? "bg-amber-500/15 text-amber-500 border-amber-500/40" 
                    : "bg-primary/20 text-primary border-primary/40"
                )}
              >
                {quizStatus === "timed-out" ? "Timer Expired" : "Assessment Complete"}
              </Badge>

              <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-2">
                {scoreInfo.message}
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-medium max-w-lg mx-auto mb-8">
                {percentage === 100 
                  ? "Flawless score! You have completely mastered this content." 
                  : isPassing 
                  ? "Great job! You achieved a passing score on this session."
                  : "Keep practicing! Review your answers and try again to improve."}
              </p>

              {/* Big Score Circular Gauge & Stats Grid */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-14 my-8">
                
                {/* Circular Meter */}
                <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center shrink-0">
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" stroke="currentColor" className="text-muted/20" strokeWidth="8" fill="transparent" />
                    <motion.circle
                      cx="60" cy="60" r="52"
                      className="stroke-primary"
                      strokeWidth="8"
                      fill="transparent"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - percentage / 100) }}
                      transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-5xl md:text-6xl font-black text-foreground">
                      {percentage}<span className="text-3xl md:text-4xl text-primary">%</span>
                    </span>
                    <span className="text-xs uppercase tracking-widest font-bold text-muted-foreground mt-1">
                      Final Score
                    </span>
                  </div>
                </div>

                {/* Stat Tiles */}
                <div className="grid grid-cols-2 gap-3.5 md:gap-4 w-full md:w-auto">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md text-left flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400">{score}</div>
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Correct</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-md text-left flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-black text-rose-600 dark:text-rose-400">{questions.length - score}</div>
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Incorrect</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 backdrop-blur-md text-left flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Timer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-lg md:text-xl font-black text-foreground">{formattedTimeTaken}</div>
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Duration</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md text-left flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xl md:text-2xl font-black text-amber-500">{maxCombo} 🔥</div>
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Max Streak</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-8 max-w-xl mx-auto">
                <Button
                  onClick={() => setCurrentStep("review")}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-base font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Review Answers
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem(`quiz_${quizData.id}_result`);
                    localStorage.removeItem(`quiz_${quizData.code}_result`);
                    submissionInProgress.current = false;
                    setQuizSubmitted(false);
                    setScore(0);
                    setCurrentCombo(0);
                    setMaxCombo(0);
                    setCurrentStep("setup");
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-base font-bold border-white/15 dark:border-white/10 hover:bg-background/80"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Quiz
                </Button>
                <Button
                  variant="ghost"
                  onClick={onExit}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl text-base font-bold hover:bg-muted/40"
                >
                  Exit
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  /* ────────────────────────── STEP 4: REVIEW SCREEN ────────────────────────── */
  if (currentStep === "review") {
    return (
      <>
        {BackgroundWaves}

        <div className="relative min-h-screen w-full py-12 px-4 md:px-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Review Header Bar */}
            <div className="flex items-center justify-between mb-8">
              <Button
                onClick={() => setCurrentStep("results")}
                className="rounded-full px-5 py-2.5 text-sm font-bold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 backdrop-blur-md transition-all shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
              <Badge
                variant="outline"
                className="text-sm px-4 py-1.5 border-primary/30 text-primary bg-primary/10 rounded-full font-semibold"
              >
                Detailed Answer Breakdown
              </Badge>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight mb-2">
                Session Questions Review
              </h1>
              <p className="text-muted-foreground text-sm md:text-base font-medium">
                Analyze your responses and view thorough explanations for each question.
              </p>
            </div>

            {/* Answer Cards List */}
            <div className="space-y-6">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === question.answer;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={cn(
                      "bg-background/40 dark:bg-background/30 backdrop-blur-2xl border shadow-xl rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all",
                      isCorrect ? "border-emerald-500/30" : "border-rose-500/30"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs px-3 py-1 rounded-full font-bold",
                            isCorrect ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                          )}
                        >
                          Question {index + 1}
                        </Badge>
                        <Badge variant="outline" className="text-xs px-3 py-1 rounded-full border-white/10 text-muted-foreground bg-background/50">
                          {question.type}
                        </Badge>
                        {question.table && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowTable(question.table)}
                            className="rounded-full px-3 h-7 text-xs border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3 mr-1" />
                            View Table
                          </Button>
                        )}
                        {question.image && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowImage(question.image)}
                            className="rounded-full px-3 h-7 text-xs border-white/15 bg-background/60"
                          >
                            <Code className="w-3 h-3 mr-1" />
                            View Code
                          </Button>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isCorrect ? (
                          <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
                            <XCircle className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Question Prompt */}
                    <h3 className="text-lg md:text-xl font-bold text-foreground mb-6 leading-relaxed">
                      {formatTextWithLatex(question.question)}
                    </h3>

                    {/* Response comparison */}
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-background/40 border border-white/10">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          Your Selected Answer:
                        </span>
                        <p className={cn("text-base font-bold", isCorrect ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {userAnswer ? formatTextWithLatex(cleanOptionText(userAnswer)) : "No answer provided"}
                        </p>
                      </div>

                      {!isCorrect && (
                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                            Correct Answer:
                          </span>
                          <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                            {formatTextWithLatex(cleanOptionText(question.answer))}
                          </p>
                        </div>
                      )}

                      {question.explanation && (
                        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                          <span className="text-xs font-bold text-amber-500 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                            <Lightbulb className="w-4 h-4" /> Explanation:
                          </span>
                          <p className="text-sm font-medium text-foreground/85 leading-relaxed">
                            {formatTextWithLatex(question.explanation)}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => setCurrentStep("results")}
                className="px-8 py-3.5 rounded-2xl text-base font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-md"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Results
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="px-8 py-3.5 rounded-2xl text-base font-bold border-white/15 dark:border-white/10 hover:bg-background/80"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Return to Subjects
              </Button>
            </div>
          </div>
        </div>

        {/* Image Dialog */}
        <ImageDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <ImageDialogContent className="bg-background/90 backdrop-blur-2xl border border-white/15 dark:border-white/10 max-w-4xl rounded-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Code Reference</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageDialog(false)}
                className="rounded-full px-3"
              >
                ✖
              </Button>
            </div>
            {currentImage && (
              <div className="relative w-full h-96 bg-gray-950 rounded-2xl overflow-hidden flex items-center justify-center border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage}
                  alt="Code reference"
                  className="max-w-full max-h-full object-contain p-2"
                />
              </div>
            )}
          </ImageDialogContent>
        </ImageDialog>

        {/* Table Reference Modal Dialog */}
        <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
          <DialogContent className="bg-background/95 dark:bg-background/90 backdrop-blur-2xl border border-white/15 dark:border-white/10 max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
            <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/10 space-y-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center border border-primary/25">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-foreground">Reference Table / Data</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Academic reference matrix or dataset
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="my-4 max-h-[65vh] overflow-y-auto pr-1">
              <TableRenderer tableContent={currentTable} />
            </div>

            <div className="pt-3 border-t border-white/10 flex justify-end">
              <Button
                onClick={() => setShowTableDialog(false)}
                className="px-5 py-2 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-110"
              >
                Close Table
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
