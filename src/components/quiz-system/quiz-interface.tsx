"use client";

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { determineQuizLevel } from "@/lib/quiz-level";
import {
  Clock,
  Layers,
  Trophy,
  ArrowLeft,
  ArrowRight,
  Play,
  CheckCircle,
  XCircle,
  Palette,
  Timer,
  Zap,
  Star,
  Award,
  Target,
  Eye,
  Sparkles,
  Brain,
  Lightbulb,
  BookOpen,
  Cable,
  Snail,
  Infinity,
  User,
  Code,
  AlertCircle,
  Calculator as CalculatorIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createBrowserClient } from "@/lib/supabase/client";
import { getStudentSession } from "@/lib/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Dialog as ImageDialog, DialogContent as ImageDialogContent } from "@/components/ui/dialog";
import Calculator from "@/components/Calculator";
import "katex/dist/katex.min.css";
import { InlineMath } from "react-katex";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";


interface QuizQuestion {
  numb: number;
  question: string;
  type: string;
  answer: string;
  options: string[];
  image?: string | null;
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
  { label: "Standard (DEF)", value: 10, icon: Cable, description: "10 Minutes" },
  { label: "Extended", value: 15, icon: Clock, description: "15 Minutes" },
  { label: "Indolent", value: 30, icon: Snail, description: "30 Minutes" },
  { label: "Unlimited", value: 0, icon: Infinity, description: "No Time Limit" },
];

const quizModes = [
  {
    id: "instant",
    name: "Instant Feedback",
    icon: Lightbulb,
    description: "See Answers Immediately with Explain",
    color: "from-yellow-500/[0.15]",
  },
  {
    id: "traditional",
    name: "Traditional Mode",
    icon: Brain,
    description: "Answer All Questions Then See Results",
    color: "from-indigo-500/[0.15]",
  },
];

// Detect mobile devices and reduced motion
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    };
    checkMobile();
    
    // Check reduced motion preference
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

// Helper to format LaTeX mathematically-like strings with inline code styling
function formatTextWithLatex(text?: string | null) {
  if (!text) return text;
  const parts = text.split(/(\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1);
      return (
        <span key={i} className="inline px-1.5 py-0.5 rounded bg-muted border border-border text-indigo-200 shadow-sm align-middle" style={{ wordBreak: 'break-word', whiteSpace: 'normal', display: 'inline' }}>
          <InlineMath math={math} />
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

// Memoized Option Button Component
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
      initial={!isMobile ? { opacity: 0, y: 20 } : false}
      animate={!isMobile ? { opacity: 1, y: 0 } : {}}
      transition={!isMobile ? { delay: index * 0.05 } : {}}
      whileHover={!showFeedback && !isQuestionAnswered && !isMobile ? { scale: 1.01 } : {}}
      whileTap={!isQuestionAnswered && !isMobile ? { y: 3 } : {}}
      onClick={() => !isQuestionAnswered && onSelect(option)}
      disabled={isQuestionAnswered}
      className={cn(
        "w-full flex items-center gap-3 md:gap-4 text-left select-none group focus:outline-none disabled:cursor-not-allowed active:translate-y-[3px] transition-all",
        isQuestionAnswered && "cursor-not-allowed"
      )}
    >
      {/* Letter Box (Fixed Square, Non-stretching) */}
      <div
        className={cn(
          "w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-2xl border-2 border-b-[5px] font-bold text-lg md:text-xl transition-all select-none shrink-0 bg-background text-foreground",
          showFeedback
            ? isCorrectOption
              ? "border-green-500 bg-green-500/10 border-b-green-600 text-green-700 dark:text-green-400 shadow-sm"
              : isSelected
              ? "border-red-500 bg-red-500/10 border-b-red-600 text-red-700 dark:text-red-400 shadow-sm"
              : "border-border border-b-muted bg-muted/20 opacity-60"
            : isSelected
            ? "border-primary bg-primary/10 border-b-primary text-primary shadow-sm"
            : "border-border border-b-muted group-hover:border-primary/50 group-hover:bg-muted/40 group-hover:text-primary group-active:border-b-[2px]"
        )}
      >
        {letter}
      </div>

      {/* Option Text Box */}
      <div
        className={cn(
          "flex-1 p-4 md:p-6 rounded-2xl border-2 border-b-[5px] transition-all relative overflow-hidden bg-background text-foreground select-none flex items-center justify-between",
          showFeedback
            ? isCorrectOption
              ? "border-green-500 bg-green-500/10 border-b-green-600 text-green-700 dark:text-green-400 shadow-sm"
              : isSelected
              ? "border-red-500 bg-red-500/10 border-b-red-600 text-red-700 dark:text-red-400 shadow-sm"
              : "border-border border-b-muted bg-muted/20 opacity-60"
            : isSelected
            ? "border-primary bg-primary/10 border-b-primary shadow-sm"
            : "border-border border-b-muted group-hover:border-primary/50 group-hover:bg-muted/40 group-active:border-b-[2px]"
        )}
      >
        <AnimatePresence>
          {showFeedback && isCorrectOption && !isMobile && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-4 right-4"
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
            </motion.div>
          )}
          {showFeedback && isSelected && !isCorrectOption && !isMobile && (
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-4 right-4"
            >
              <XCircle className="w-8 h-8 text-red-400" />
            </motion.div>
          )}
        </AnimatePresence>

        <span className="text-base md:text-lg font-medium leading-relaxed">{formatTextWithLatex(option)}</span>
        
        {showFeedback && isCorrectOption && isMobile && (
          <CheckCircle className="w-6 h-6 text-green-400 shrink-0 ml-2" />
        )}
        {showFeedback && isSelected && !isCorrectOption && isMobile && (
          <XCircle className="w-6 h-6 text-red-400 shrink-0 ml-2" />
        )}
      </div>
    </motion.button>
  );
});


// â”€â”€ Confetti Fireworks (correct answer) â”€â”€
const ConfettiParticles = memo(function ConfettiParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      angle: (i / 30) * 360,
      distance: 80 + Math.random() * 120,
      size: 4 + Math.random() * 8,
      color: ["#22c55e", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#06b6d4", "#f97316", "#14b8a6"][i % 8],
      delay: Math.random() * 0.3,
      shape: i % 3,
    })),
  []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Center burst */}
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
              y: y + 60,
              opacity: [1, 1, 0],
              scale: [0, 1.5, 0.3],
              rotate: [0, 720],
            }}
            transition={{ duration: 1 + p.delay, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "50%",
              top: "40%",
              width: p.size,
              height: p.shape === 1 ? p.size * 2 : p.size,
              borderRadius: p.shape === 0 ? "50%" : p.shape === 1 ? "2px" : "1px",
              backgroundColor: p.color,
            }}
          />
        );
      })}
      {/* Sparkle stars */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`star-${i}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], rotate: [0, 180] }}
          transition={{ duration: 0.8, delay: 0.2 + i * 0.15 }}
          style={{
            position: "absolute",
            left: `${25 + i * 12}%`,
            top: `${30 + (i % 2) * 20}%`,
            fontSize: 24,
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  );
});


export default function QuizInterface({
  quizData,
  onExit,
  initialQuestions,
}: QuizInterfaceProps) {
  // Detect mobile and reduced motion
  const { prefersReducedMotion, isMobile } = useReducedMotion();
  
  const [currentStep, setCurrentStep] = useState<
    "setup" | "quiz" | "results" | "review"
  >("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedDuration, setSelectedDuration] = useState(10);
  const [selectedMode, setSelectedMode] = useState("traditional");
  const [showSettings, setShowSettings] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState<{
    [key: number]: boolean;
  }>({});
  const [quizStatus, setQuizStatus] = useState<
    "completed" | "timed-out"
  >("completed");
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [attemptsToday, setAttemptsToday] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);
  const [showAttemptsDialog, setShowAttemptsDialog] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [confirmExitCheckbox, setConfirmExitCheckbox] = useState(false);
  const [enableNavigation, setEnableNavigation] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submissionInProgress = useRef(false);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
  const supabase = createBrowserClient();

  // Pre-load audio files
  useEffect(() => {
    correctAudioRef.current = new Audio("/audio/duolingo-correct.mp3");
    wrongAudioRef.current = new Audio("/audio/duolingo-wrong.mp3");
    correctAudioRef.current.preload = "auto";
    wrongAudioRef.current.preload = "auto";
  }, []);

  // Check authentication status
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [showBannedDialog, setShowBannedDialog] = useState(false);
  
  // Memoize checkQuizAttempts to avoid unnecessary recreations
  const checkQuizAttempts = useCallback(async (): Promise<void> => {
    try {
      const session = await getStudentSession();
      if (!session) {
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const { error, count } = await supabase
        .from("quiz_data")
        .select("*", { count: "exact", head: true })
        .eq("auth_id", session.auth_id)
        .eq("quiz_id", quizData.code)
        .gte("solved_at", todayISO);

      if (error) {
        console.error("Error checking quiz attempts:", error);
        return;
      }

      const attemptsCount = count || 0;
      setAttemptsToday(attemptsCount);
      setMaxAttemptsReached(attemptsCount >= 5);
    } catch (error) {
      console.error("Unexpected error checking attempts:", error);
    }
  }, [supabase, quizData.code]);
  
  useEffect(() => {
    const checkAuth = async () => {
      const session = await getStudentSession();
      setIsAuthenticated(!!session);
      
      if (session) {
        // ✅ Check if user is banned
        if (session.is_banned) {
          console.log("ðŸš« User is banned, forcing logout");
          setIsBanned(true);
          setShowBannedDialog(true);
          return;
        }
        
        await checkQuizAttempts();
      }
    };
    
    // Clear session storage when component first mounts (on page load)
    sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
    
    checkAuth();
  }, [checkQuizAttempts, quizData.code]);
  
  // ✅ Force logout if banned
  const handleBannedLogout = async () => {
    try {
      const supabase = createBrowserClient();
      await supabase.auth.signOut({ scope: 'global' });
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/auth/signin";
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = "/auth/signin";
    }
  };

  // Memoize loadQuestions
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
    
    // Load answers from session storage when starting quiz
    if (currentStep === "quiz") {
      const savedAnswers = sessionStorage.getItem(`quiz_${quizData.code}_answers`);
      if (savedAnswers) {
        setUserAnswers(JSON.parse(savedAnswers));
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Clear session storage when component unmounts (page refresh/navigation)
      if (currentStep === "setup") {
        sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
      }
    };
  }, [loadQuestions, currentStep, quizData.code]);

  // Save answers to session storage whenever they change during quiz
  useEffect(() => {
    if (currentStep === "quiz" && Object.keys(userAnswers).length > 0) {
      sessionStorage.setItem(`quiz_${quizData.code}_answers`, JSON.stringify(userAnswers));
    }
  }, [userAnswers, quizData.code, currentStep]);
  
  // Clear session storage when going back to setup
  useEffect(() => {
    if (currentStep === "setup") {
      sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
    }
  }, [currentStep, quizData.code]);

  // Themes are now handled globally via CSS variables

  // checkQuizAttempts and loadQuestions moved to useCallback above

  // Function to handle image display
  // Moved to useCallback above

  const startQuiz = async () => {
    if (!isAuthenticated) {
      setShowAuthDialog(true);
      return;
    }
    
    // ✅ Check if user is banned
    if (isBanned) {
      setShowBannedDialog(true);
      return;
    }
    
    // Check attempts before starting
    await checkQuizAttempts();
    
    if (maxAttemptsReached) {
      setShowAttemptsDialog(true);
      return;
    }
    
    // Clear any previous session storage when starting a new quiz
    sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
    setUserAnswers({});
    setAnswerRevealed({});
    setShowAnswer(false);
    setCurrentQuestion(0);
    
    setCurrentStep("quiz");

    if (selectedDuration > 0) {
      // Only set timer for non-unlimited durations
      setTimeLeft(selectedDuration * 60);
    } else {
      // For unlimited duration, set a very large number or skip timer completely
      setTimeLeft(Number.MAX_SAFE_INTEGER); // Effectively unlimited
    }
  };

  // Memoized callbacks for better performance
  const selectAnswer = useCallback((answer: string) => {
    // ðŸ”’ ÙÙŠ Instant Mode: Ù…Ù…Ù†ÙˆØ¹ ØªØºÙŠÙŠØ± Ø§Ù„Ø¥Ø¬Ø§Ø¨Ø© Ø¨Ø¹Ø¯ Ù…Ø§ ØªØ¬Ø§ÙˆØ¨
    if (selectedMode === "instant" && userAnswers[currentQuestion] !== undefined) {
      return;
    }

    // Batch state updates using functional updates
    setUserAnswers(prev => {
      const updated = {
        ...prev,
        [currentQuestion]: answer,
      };
      // Save to session storage immediately
      sessionStorage.setItem(`quiz_${quizData.code}_answers`, JSON.stringify(updated));
      return updated;
    });

    if (selectedMode === "instant") {
      setShowAnswer(true);
      setAnswerRevealed(prev => ({
        ...prev,
        [currentQuestion]: true,
      }));

      // Play sound and trigger animations
      const isAnswerCorrect = answer === questions[currentQuestion]?.answer;
      if (isAnswerCorrect) {
        setShowConfetti(true);
        try { correctAudioRef.current?.play(); } catch {}
        setTimeout(() => { setShowConfetti(false); }, 1800);
      } else {
        setShakeCard(true);
        try { wrongAudioRef.current?.play(); } catch {}
        setTimeout(() => { setShakeCard(false); }, 600);
      }
    }
  }, [selectedMode, currentQuestion, userAnswers, quizData.code, questions]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      // ✅ On last question, finish the quiz
      setQuizStatus("completed");
      // Use a ref or direct call without dependency
      setCurrentStep("results");
    }
  }, [currentQuestion, questions.length]);

  const prevQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      const prevQuestionIndex = currentQuestion - 1;
      setCurrentQuestion(prevQuestionIndex);
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

  // Updated saveScoreToSupabase function with all required fields
  const saveScoreToSupabase = async (finalScore: number, status: "completed" | "timed-out") => {
    // Additional guard against double submission
    if (submissionInProgress.current && quizSubmitted) {
      console.log("Submission already in progress, skipping database save");
      return;
    }
    
    // Set flags to prevent further submissions
    submissionInProgress.current = true;
    setQuizSubmitted(true);
    
    try {
      const session = await getStudentSession();
      if (!session) {
        console.error("No user session found");
        return;
      }

      // Use the quiz code directly instead of trying to parse it as an integer
      const quizId = quizData.code;
      
      // ✅ Calculate percentage correctly to avoid rounding issues
      const scorePercentage = Math.round((finalScore / questions.length) * 100);
      
      console.log(`📊 Score Calculation: ${finalScore} correct out of ${questions.length} = ${scorePercentage}%`);
      
      const quizResult = {
        auth_id: session.auth_id,
        quiz_id: quizId,
        score: scorePercentage,
        how_finished: status,
        answering_mode: selectedMode,
        duration_selected: selectedDuration === 0 ? "Unlimited" : `${selectedDuration} minutes`,
        total_questions: questions.length,
        quiz_level: determineQuizLevel(quizId), // Use the imported function here
      };

      
      const { data, error } = await supabase
        .from("quiz_data")
        .insert([quizResult])
        .select();

      if (error) {
        console.error("Error saving quiz data to Supabase:", error.message);
      } else {
        // Update attempts count after successful submission
        setAttemptsToday(prev => prev + 1);
        setMaxAttemptsReached(attemptsToday + 1 >= 5);

        // 🪙 Give coins = finalscore * 1.5
        const earnedCoins = finalScore * 1.5;
        if (Math.ceil(earnedCoins) > 0) {
          const { data: userData } = await supabase
            .from("chameleons")
            .select("coins")
            .eq("auth_id", session.auth_id)
            .single();
          
          if (userData) {
            await supabase
              .from("chameleons")
              .update({ coins: (userData.coins || 0) + Math.ceil(earnedCoins) })
              .eq("auth_id", session.auth_id);
            
            
            toast.success(`Congratulations! You earned ${earnedCoins} coins!`, {
              icon: "🪙",
              duration: 5000,
            });
            
            
            // Refresh session to update UI across the app
            await getStudentSession(true);
          }
        }
      }
    } catch (error) {
      console.error("Unexpected error saving quiz data:", error);
    }
  };

  // Updated saveScore function for localStorage
  const saveScore = (finalScore: number, status: "completed" | "timed-out") => {
    const quizResult = {
      quizId: quizData.code,
      score: finalScore,
      totalQuestions: questions.length,
      status: status,
      timestamp: new Date().toISOString(),
      answers: userAnswers,
      mode: selectedMode,
      duration: selectedDuration,
    };

    localStorage.setItem(
      `quiz_${quizData.id}_result`,
      JSON.stringify(quizResult)
    );
  };

  const finishQuiz = useCallback((answersToUse = userAnswers) => {
    // Use ref to prevent double execution
    if (submissionInProgress.current) {
      console.log("Submission already in progress");
      return;
    }
    
    // Set flag immediately
    submissionInProgress.current = true;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Calculate score using the passed answers
    let correctAnswers = 0;
    
    questions.forEach((question, index) => {
      const userAnswer = answersToUse[index];
      const correctAnswer = question.answer;
      
      // Check for whitespace issues
      const userAnswerLength = userAnswer?.length || 0;
      const correctAnswerLength = correctAnswer?.length || 0;
      
      // Trim whitespace from both answers
      const trimmedUserAnswer = userAnswer?.trim();
      const trimmedCorrectAnswer = correctAnswer?.trim();
      const isMatch = trimmedUserAnswer === trimmedCorrectAnswer;
            
      if (isMatch) {
        correctAnswers++;
      }
    });

    setScore(correctAnswers);
    setCurrentStep("results");

    // Clear session storage after finishing
    sessionStorage.removeItem(`quiz_${quizData.code}_answers`);

    // Save to localStorage and database
    saveScore(correctAnswers, quizStatus);
    saveScoreToSupabase(correctAnswers, quizStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, userAnswers, quizStatus, quizData.code]);

  // formatTime moved to useCallback above

  const getScoreMessage = () => {
    const percentage = Math.round((score / questions.length) * 100);
    if (percentage >= 90)
      return {
        message: "Outstanding! Perfect mastery! 🏆",
        color: "text-yellow-400",
      };
    if (percentage >= 80)
      return {
        message: "Excellent work! Well done! 🌟",
        color: "text-green-400",
      };
    if (percentage >= 70)
      return { message: "Great job! Keep it up! 😎‘", color: "text-blue-400" };
    if (percentage >= 60)
      return {
        message: "Good effort! Room for improvement! 📚",
        color: "-400",
      };
    return {
      message: "Keep studying! You'll do better next time! 💪",
      color: "text-red-400",
    };
  };

  // Effect to manage the countdown interval
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

  // Separate effect to handle timer expiration
  useEffect(() => {
    if (timeLeft === 0 && currentStep === "quiz" && selectedDuration > 0) {
      handleTimeExpired();
    }
  }, [timeLeft, currentStep, selectedDuration]);

  const handleTimeExpired = () => {
    // Use ref to prevent double execution
    if (submissionInProgress.current) {
      console.log("Time expired submission already in progress");
      return;
    }
    
    // Set the flag immediately
    submissionInProgress.current = true;
    console.log("Time expired, handling quiz completion");
    
    // Use functional update to get the latest userAnswers
    setUserAnswers(currentAnswers => {
      // Calculate score using current answers
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        const userAnswer = currentAnswers[index];
        const correctAnswer = question.answer;
        const trimmedUserAnswer = userAnswer?.trim();
        const trimmedCorrectAnswer = correctAnswer?.trim();
        const isMatch = trimmedUserAnswer === trimmedCorrectAnswer;
        
        
        if (isMatch) {
          correctAnswers++;
        }
      });

      console.log(`â° Final Score (Timed Out): ${correctAnswers} out of ${questions.length}`);

      // Update state
      setQuizStatus("timed-out");
      setScore(correctAnswers);
      setCurrentStep("results");
      
      // Save to localStorage
      const quizResult = {
        quizId: quizData.code,
        score: correctAnswers,
        totalQuestions: questions.length,
        status: "timed-out" as const,
        timestamp: new Date().toISOString(),
        answers: currentAnswers,
        mode: selectedMode,
        duration: selectedDuration,
      };
      localStorage.setItem(
        `quiz_${quizData.id}_result`,
        JSON.stringify(quizResult)
      );
      
      // Save to database
      saveScoreToSupabase(correctAnswers, "timed-out");
      
      return currentAnswers;
    });
  };

  useEffect(() => {
    if (selectedMode === "traditional" && currentStep === "quiz") {
      // Calculate current score based on all answered questions
      let correctAnswers = 0;
      questions.forEach((question, index) => {
        // ✅ Normalize answers by trimming whitespace for accurate comparison
        const userAnswer = userAnswers[index]?.trim();
        const correctAnswer = question.answer?.trim();
        
        if (userAnswer === correctAnswer) {
          correctAnswers++;
        }
      });
      setScore(correctAnswers); // Update score in real-time
    }
  }, [userAnswers, selectedMode, currentStep, questions]);

  // ✅ Handle quiz completion when moving to results
  useEffect(() => {
    if (currentStep === "results" && quizStatus === "completed" && !submissionInProgress.current) {
      finishQuiz(userAnswers);
    }
  }, [currentStep, quizStatus, userAnswers, finishQuiz]);

  // Update showAnswer when navigating between questions
  useEffect(() => {
    if (currentStep === "quiz") {
      const hasAnswer = userAnswers[currentQuestion] !== undefined;
      const wasRevealed = answerRevealed[currentQuestion] || false;
      
      // Show answer only if it was previously revealed (in instant mode)
      if (selectedMode === "instant" && hasAnswer && wasRevealed) {
        setShowAnswer(true);
      } else {
        setShowAnswer(false);
      }
    }
  }, [currentQuestion, currentStep, userAnswers, answerRevealed, selectedMode]);

  if (currentStep === "setup") {
    return (
      <>
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center py-16 px-4">
        {/* Auth Dialog */}
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogContent className="/80 backdrop-blur-md border-border ">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <User className="w-6 h-6" />
                Authentication Required
              </DialogTitle>
              <DialogDescription className="text-foreground/70">
                You need to be logged in to start this quiz. Please sign in to continue.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
                <Button 
                    onClick={() => { window.location.href = "/auth/signin"; }}
                    className="w-full py-3 text-lg bg-primary text-primary-foreground hover:bg-white hover:text-primary transition-colors"
                >
                Sign In
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAuthDialog(false)}
                  className="w-full py-3 text-lg border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                Cancel
                </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Attempts Dialog */}
        <Dialog open={showAttemptsDialog} onOpenChange={setShowAttemptsDialog}>
          <DialogContent className="/80 backdrop-blur-md border-border ">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-yellow-400" />
                Maximum Attempts Reached
              </DialogTitle>
              <DialogDescription className="text-foreground/70">
                You have already used {attemptsToday} out of 5 attempts for this quiz today. 
                Please try again tomorrow.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
                <Button 
                onClick={() => setShowAttemptsDialog(false)}
                className="w-full py-3 text-lg"
                style={{
                  color: "white",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "white";
                }}
                >
                Okay
                </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Banned Dialog */}
        <Dialog open={showBannedDialog} onOpenChange={() => {}}>
          <DialogContent className="/80 backdrop-blur-md border-red-500/50 ">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-red-400">
                <XCircle className="w-6 h-6" />
                Account Banned
              </DialogTitle>
              <DialogDescription className="text-foreground/70">
                Your account has been banned. You cannot access quizzes or other features. 
                Please contact support if you believe this is a mistake.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
                <Button 
                onClick={handleBannedLogout}
                className="w-full py-3 text-lg bg-red-600 hover:bg-red-700"
                >
                <XCircle className="w-5 h-5 mr-2" />
                Logout
                </Button>
            </div>
          </DialogContent>
        </Dialog>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-xl md:blur-3xl" />

        {/* Official Duolingo Logo Outside the Card */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 z-10 text-center flex flex-col items-center gap-2"
        >
          <Link href="/">
            <Image
              src="/images/Duolingo.svg"
              alt="Duolingo Logo"
              width={180}
              height={42}
              className="h-11 w-auto opacity-95 hover:opacity-100 transition-all hover:scale-105 active:scale-95"
            />
          </Link>
          <span className="text-xs font-semibold text-muted-foreground/80 tracking-wider uppercase mt-1">
            Interactive Learning System
          </span>
        </motion.div>

        <div className="relative z-10 w-full max-w-4xl transition-all duration-300 opacity-100 quiz-card">
          <Card className="bg-background/40 border border-border/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
            <CardHeader className="text-center pb-8 pt-8 px-8 relative">
              <div className="absolute top-6 left-6 z-20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
                    window.history.back();
                  }}
                  className="text-foreground/90 hover:bg-muted border border-border rounded-full px-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>

              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                className="mt-6 mb-2"
              >
                <div className="flex items-center justify-center mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center",
                      "bg-gradient-to-tr from-primary/30 to-primary/10 border-2 border-primary/20",
                      "backdrop-blur-[2px] shadow-lg"
                    )}
                  >
                    <Target className="w-10 h-10 text-primary" />
                  </motion.div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-4 text-foreground tracking-tight leading-tight">
                  {quizData.name}
                </h1>
                <Badge
                  variant="outline"
                  className="text-base px-6 py-2.5 border-primary/20 text-foreground/90 backdrop-blur-sm bg-primary/10 rounded-full"
                >
                  Code: {quizData.code}
                </Badge>

                {quizData.id === "ai-generated" && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 max-w-xl mx-auto mt-6 text-center text-xs md:text-[13px] text-amber-400/90 font-medium leading-relaxed shadow-sm">
                    <span className="font-bold text-amber-300 block mb-1 text-sm">⚠️ Important Notice for AI-Generated Quizzes</span>
                    This quiz is for practice and study purposes only; grades are unofficial and will not be recorded in your academic history.
                    <br />
                    Please note that going back or refreshing the page will permanently lose your active quiz questions and session.
                  </div>
                )}
              </motion.div>
            </CardHeader>

            <CardContent className="space-y-8 text-foreground px-8 pb-10">
              {/* Quiz Mode Selection */}
              <div>
                <label className="text-lg font-bold mb-4 flex items-center text-foreground/90">
                  <Sparkles className="w-5 h-5 mr-3 text-primary" />
                  Choose Quiz Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizModes.map((mode) => {
                    const IconComponent = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => setSelectedMode(mode.id)}
                        className={cn(
                          "p-6 rounded-2xl border-2 border-b-[5px] transition-all text-left bg-background relative overflow-hidden select-none active:border-b-2 active:translate-y-[3px]",
                          selectedMode === mode.id
                            ? "border-primary bg-primary/5 border-b-primary shadow-inner"
                            : "border-border border-b-muted hover:border-primary/50 hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-start gap-4 relative z-10">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-xl flex items-center justify-center",
                              "border border-primary/20 bg-primary/10"
                            )}
                          >
                            <IconComponent className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-foreground mb-1">
                              {mode.name}
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">
                              {mode.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selection */}
              <div>
                <label className="text-lg font-bold mb-4 flex items-center text-foreground/90">
                  <Timer className="w-5 h-5 mr-3 text-primary" />
                  Select Duration
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {durations.map((duration) => {
                    const IconComponent = duration.icon || Clock;
                    return (
                      <button
                        key={duration.value}
                        onClick={() => setSelectedDuration(duration.value)}
                        className={cn(
                          "p-5 rounded-2xl border-2 border-b-[5px] transition-all text-center bg-background relative overflow-hidden select-none active:border-b-2 active:translate-y-[3px]",
                          selectedDuration === duration.value
                            ? "border-primary bg-primary/5 border-b-primary shadow-inner"
                            : "border-border border-b-muted hover:border-primary/50 hover:bg-muted/40"
                        )}
                      >
                        <div className="relative z-10">
                          <IconComponent
                            className={cn(
                              "w-8 h-8 mx-auto mb-2.5 transition-colors",
                              selectedDuration === duration.value ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <div className="text-base font-bold text-foreground mb-0.5">
                            {duration.label}
                          </div>
                          <div className="text-xs text-muted-foreground font-medium">
                            {duration.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation settings Selection */}
              <div>
                <label className="text-lg font-bold mb-4 flex items-center text-foreground/90">
                  <Layers className="w-5 h-5 mr-3 text-primary" />
                  Quiz Navigation Mode
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => setEnableNavigation(true)}
                    className={cn(
                      "p-6 rounded-2xl border-2 border-b-[5px] transition-all text-left bg-background relative overflow-hidden select-none active:border-b-2 active:translate-y-[3px]",
                      enableNavigation
                        ? "border-primary bg-primary/5 border-b-primary shadow-inner"
                        : "border-border border-b-muted hover:border-primary/50 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-primary/20 bg-primary/10">
                        <ArrowRight className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-foreground mb-1">
                          Free Navigation
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          Move back and forth between questions freely (practice mode)
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setEnableNavigation(false)}
                    className={cn(
                      "p-6 rounded-2xl border-2 border-b-[5px] transition-all text-left bg-background relative overflow-hidden select-none active:border-b-2 active:translate-y-[3px]",
                      !enableNavigation
                        ? "border-primary bg-primary/5 border-b-primary shadow-inner"
                        : "border-border border-b-muted hover:border-primary/50 hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-primary/20 bg-primary/10">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-foreground mb-1">
                          Strict Navigation
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          Answer to unlock next question, cannot go back (exam mode)
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quiz Info */}
              <div className="bg-muted/30 p-6 rounded-2xl border border-border/60 backdrop-blur-sm">
                <h3 className="font-bold mb-4 text-foreground/90 text-lg">
                  Quiz Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-black text-foreground mb-0.5">
                      {questions.length}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Questions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground mb-0.5">
                      {selectedDuration === 0 ? "∞" : `${selectedDuration}m`}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Duration</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-primary mb-0.5">
                      {enableNavigation ? "Free" : "Strict"}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-foreground mb-0.5">
                      {selectedMode === "instant" ? "Instant" : "Traditional"}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mode</div>
                  </div>
                </div>
                
                {/* Attempts counter */}
                {isAuthenticated && (
                  <div className="mt-6 pt-4 border-t border-border/60">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm font-medium">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Attempts today: <strong className="text-foreground">{attemptsToday}</strong>/5</span>
                      {maxAttemptsReached && (
                        <Badge variant="destructive" className="ml-2 rounded-full px-2.5">
                          Limit Reached
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Start Button */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="pt-2"
              >
                <button
                  onClick={startQuiz}
                  disabled={maxAttemptsReached}
                  className={cn(
                    "w-full py-5 text-xl font-bold rounded-2xl border-2 border-b-[5px] transition-all flex items-center justify-center select-none shadow-lg",
                    maxAttemptsReached 
                      ? "bg-muted text-muted-foreground border-muted cursor-not-allowed" 
                      : "bg-primary text-primary-foreground border-primary border-b-indigo-700 dark:border-b-indigo-900 active:border-b-2 active:translate-y-[3px] hover:brightness-105"
                  )}
                >
                  <Play className="w-6 h-6 mr-3 fill-current" />
                  {maxAttemptsReached ? "Maximum Attempts Reached" : "Start Quiz Adventure"}
                </button>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    );
  }

  if (currentStep === "quiz") {
    const currentQ = questions[currentQuestion];
    const isAnswered = userAnswers[currentQuestion] !== undefined;
    const isCorrect = userAnswers[currentQuestion] === currentQ?.answer;

    return (
      <>
      <Dialog 
        open={showExitConfirm} 
        onOpenChange={(open) => {
          setShowExitConfirm(open);
          if (!open) setConfirmExitCheckbox(false);
        }}
        modal={false}
      >
        <DialogContent className="bg-background/90 backdrop-blur-xl border border-border/60 max-w-md rounded-[2rem] p-6 shadow-2xl z-[10001]">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-2xl font-black flex items-center gap-3 text-red-500 dark:text-red-400">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              Exit Quiz?
            </DialogTitle>
            <DialogDescription className="text-foreground/80 font-medium text-base leading-relaxed">
              Are you sure you want to end this session? You will lose all your answered questions, scored points, and current progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-6 flex items-start gap-3.5 p-4 bg-red-500/[0.03] dark:bg-red-950/[0.05] border border-red-500/10 rounded-2xl">
            <input
              id="confirm-exit-checkbox"
              type="checkbox"
              checked={confirmExitCheckbox}
              onChange={(e) => setConfirmExitCheckbox(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-border text-red-600 focus:ring-red-500 cursor-pointer accent-red-500"
            />
            <label htmlFor="confirm-exit-checkbox" className="text-sm text-foreground/80 leading-relaxed font-semibold cursor-pointer select-none">
              I understand that I will lose all my progress and active session answers permanently.
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => {
                setShowExitConfirm(false);
                sessionStorage.removeItem(`quiz_${quizData.code}_answers`);
                onExit();
              }}
              disabled={!confirmExitCheckbox}
              className={cn(
                "w-full py-4 text-base font-bold rounded-2xl border-2 transition-all flex items-center justify-center select-none shadow-md order-2 sm:order-1",
                confirmExitCheckbox
                  ? "bg-red-600 text-white border-red-600 border-b-[4px] border-b-red-800 active:border-b-2 active:translate-y-[2px] hover:brightness-105"
                  : "bg-muted text-muted-foreground border-muted cursor-not-allowed"
              )}
            >
              Yes, Exit Session
            </button>
            <button
              onClick={() => {
                setShowExitConfirm(false);
                setConfirmExitCheckbox(false);
              }}
              className="w-full py-4 text-base font-bold rounded-2xl border-2 border-b-[4px] border-border hover:bg-muted bg-background/50 text-foreground active:border-b-2 active:translate-y-[2px] order-1 sm:order-2"
            >
              Keep Playing
            </button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Backdrop blur and dimming overlay */}
      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10000] bg-black/60 pointer-events-auto cursor-pointer"
            style={{
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
            onClick={() => {
              setShowExitConfirm(false);
              setConfirmExitCheckbox(false);
            }}
          />
        )}
      </AnimatePresence>

      <div 
        className={cn(
          "relative min-h-screen w-full overflow-hidden flex flex-col justify-between",
          showExitConfirm && "select-none pointer-events-none"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-xl md:blur-3xl" />

        {/* Floating close/exit button */}
        <div className="absolute top-6 left-6 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowExitConfirm(true)}
            className="text-red-500 hover:text-red-600 rounded-full h-10 w-10 border border-red-500/20 hover:border-red-500/40 bg-red-500/10 hover:bg-red-500/20 backdrop-blur shadow-sm hover:bg-red-500/15 transition-all duration-300"
          >
            <span className="text-xl font-bold">✖</span>
          </Button>
        </div>

        {/* Dynamic Island (iPhone 17 Pro Max Style) */}
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
          <motion.div
            layout
            onClick={() => setIsIslandExpanded(!isIslandExpanded)}
            initial={{ borderRadius: 32 }}
            animate={{
              width: isIslandExpanded ? 340 : (selectedDuration > 0 ? 180 : 140),
              height: isIslandExpanded ? 160 : 44,
              borderRadius: isIslandExpanded ? 24 : 32,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="bg-background/90 backdrop-blur-xl border border-border shadow-2xl cursor-pointer overflow-hidden flex flex-col"
          >
            {/* Collapsed State */}
            <motion.div
              layout
              className={cn(
                "w-full h-[44px] flex items-center justify-between px-4",
                isIslandExpanded ? "opacity-0 absolute" : "opacity-100 relative"
              )}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground text-sm font-medium">
                  {currentQuestion + 1}/{questions.length}
                </span>
              </div>
              
              {selectedDuration > 0 ? (
                <div className="flex items-center gap-1.5 text-primary">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span className="font-mono text-sm font-semibold tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-primary">
                  <Infinity className="w-4 h-4" />
                </div>
              )}
            </motion.div>

            {/* Expanded State */}
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
                  <h3 className="text-foreground font-semibold text-lg line-clamp-1">{quizData.name}</h3>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider mt-1">{currentQ?.type}</p>
                </div>
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-muted/20 text-primary">
                  {selectedDuration > 0 ? <Timer className="w-5 h-5" /> : <Infinity className="w-5 h-5" />}
                </div>
              </div>
              
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground/70">Progress</span>
                  <span className="text-foreground font-medium">{Math.round(((currentQuestion) / questions.length) * 100)}%</span>
                </div>
                {/* Progress Bar inside island */}
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestion) / questions.length) * 100}%` }}
                    transition={{ duration: 0.5, type: "spring" }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                
                {selectedDuration > 0 && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground text-xs">Time Remaining</span>
                    <span className="font-mono text-primary font-semibold text-sm">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Space below dynamic island */}
        <div className="pt-24 pb-8" />

        {/* Question Card */}
        <div className={cn(
          "relative px-4 md:px-6 flex-1 flex items-center justify-center",
          showAnswer && selectedMode === "instant" ? "z-[9999]" : "z-10"
        )}>
          <div className="w-full max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {/* Fireworks overlay for correct answers */}
                <AnimatePresence>
                  {showConfetti && <ConfettiParticles />}
                </AnimatePresence>
                <motion.div
                  animate={shakeCard ? { x: [-6, 6, -6, 6, -3, 3, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                <Card className="bg-background/40 border border-border/60 backdrop-blur-xl shadow-2xl rounded-[2.5rem] overflow-hidden transition-all duration-300 pt-0 gap-0">
                  <CardHeader className="p-0">
                    <div className="w-full px-8 pt-8 pb-6 rounded-b-[2rem] border-b-[5px] border-primary/10 border-b-primary/20 bg-primary/[0.02] dark:bg-primary/[0.04] backdrop-blur-md relative overflow-hidden">
                      {/* Subtle decorative glow */}
                      <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
                      
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                          Question {currentQuestion + 1}
                        </span>
                        {currentQ?.type && (
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest px-2.5 py-1 bg-muted text-muted-foreground rounded-full">
                            {currentQ.type}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-start gap-4 relative z-10">
                        <CardTitle className="text-lg md:text-xl leading-relaxed font-bold flex-1 tracking-tight text-primary">
                          {formatTextWithLatex(currentQ?.question)}
                        </CardTitle>
                        {currentQ?.image && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="shrink-0"
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowImage(currentQ.image)}
                              className="ml-4 border-border hover:bg-muted bg-background text-primary transition-colors rounded-full px-4"
                            >
                              <Code className="w-4 h-4 mr-2" />
                              Show Code
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="px-8 pt-7 pb-3">
                    <div className="space-y-4 md:space-y-5">
                      {currentQ?.options.map((option, index) => {
                        const isSelected =
                          userAnswers[currentQuestion] === option;
                        const isCorrectOption = option === currentQ.answer;
                        const showFeedback =
                          selectedMode === "instant" && showAnswer;
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

                    {selectedMode === "instant" && showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "mt-6 p-5 rounded-[1.8rem] border-2 border-b-[5px] flex flex-col md:flex-row gap-5 items-start md:items-center relative z-[9999] overflow-hidden backdrop-blur-xl",
                          isCorrect
                            ? "bg-green-500/10 dark:bg-green-950/20 border-green-500/30 text-green-700 dark:text-green-400 border-b-green-600/40"
                            : "bg-red-500/10 dark:bg-red-950/20 border-red-500/30 text-red-700 dark:text-red-400 border-b-red-600/40"
                        )}
                      >
                        {/* Glow effect */}
                        <div className={cn(
                          "absolute -right-20 -bottom-20 w-48 h-48 rounded-full blur-[60px] opacity-35",
                          isCorrect ? "bg-green-500/20" : "bg-red-500/20"
                        )} />

                        {/* Mascot Icon */}
                        <div className="flex-shrink-0 flex items-center justify-center p-1 relative z-10">
                          {isCorrect ? (
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="drop-shadow-md animate-bounce">
                              <circle cx="12" cy="12" r="11" fill="#58cc02" />
                              <ellipse cx="9" cy="10.5" rx="2.5" ry="3" fill="white" />
                              <ellipse cx="15" cy="10.5" rx="2.5" ry="3" fill="white" />
                              <circle cx="9" cy="11" r="1" fill="#1a1a1a" />
                              <circle cx="15" cy="11" r="1" fill="#1a1a1a" />
                              <path d="M 9.5,14 Q 12,16.5 14.5,14" stroke="#ff9600" strokeWidth="2" fill="none" strokeLinecap="round" />
                              <path d="M 5,5 Q 4,2 7,4" fill="#58cc02" />
                              <path d="M 19,5 Q 20,2 17,4" fill="#58cc02" />
                            </svg>
                          ) : (
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
                              <circle cx="12" cy="12" r="11" fill="#58cc02" />
                              <ellipse cx="9" cy="10.5" rx="2.5" ry="3" fill="white" />
                              <ellipse cx="15" cy="10.5" rx="2.5" ry="3" fill="white" />
                              <path d="M 8,11 Q 9,10 10,11" stroke="#1a1a1a" strokeWidth="1" fill="none" />
                              <path d="M 14,11 Q 15,10 16,11" stroke="#1a1a1a" strokeWidth="1" fill="none" />
                              <path d="M 10.5,15 Q 12,13.5 13.5,15" stroke="#ff9600" strokeWidth="2" fill="none" strokeLinecap="round" />
                            </svg>
                          )}
                        </div>

                        <div className="flex-1 space-y-2 relative z-10">
                          <div className="flex items-center gap-2">
                            {isCorrect ? (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            )}
                            <h4 className="text-xl font-black tracking-tight">
                              {isCorrect ? "You got it! Superb!" : "Incorrect Answer"}
                            </h4>
                          </div>
                          {!isCorrect && (
                            <p className="text-base font-bold">
                              Correct Answer: <span className="underline">{formatTextWithLatex(currentQ?.answer)}</span>
                            </p>
                          )}
                          {currentQ?.explanation && (
                            <div className="text-xs md:text-sm font-medium leading-relaxed opacity-90 max-w-2xl mt-2 bg-black/5 dark:bg-black/20 p-3.5 rounded-2xl border border-black/5">
                              <span className="font-bold block mb-1 text-xs uppercase tracking-wider text-foreground/75">Explanation:</span>
                              {formatTextWithLatex(currentQ.explanation)}
                            </div>
                          )}
                        </div>

                        {/* Next Button inside Feedback (Instant Mode) */}
                        {!enableNavigation && (
                          <div className="ml-auto mt-4 md:mt-0 relative z-[9999]">
                            <Button
                              onClick={nextQuestion}
                              className="px-6 py-2.5 md:px-8 text-sm md:text-base font-bold rounded-xl shadow-sm transition-all bg-foreground text-background hover:scale-105 active:scale-95 relative z-[9999]"
                            >
                              {currentQuestion === questions.length - 1 ? "Finish" : "Continue"}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        {/* Navigation */}
        <div className="relative z-10 px-4 md:px-6 pb-12 mt-6">
          <div className="max-w-4xl mx-auto flex justify-between items-center bg-background/30 dark:bg-black/30 backdrop-blur-xl border border-white/10 p-2 md:p-3 rounded-full shadow-lg">
            {enableNavigation ? (
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="border-transparent hover:bg-white/10 px-6 py-3 md:px-8 bg-transparent rounded-full font-medium transition-all"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                <span className="hidden sm:inline">Previous</span>
              </Button>
            ) : (
              <div className="w-[100px] sm:w-[130px]" />
            )}

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => setShowCalculator(!showCalculator)}
                className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/10 hover:bg-white/20 bg-background/50 dark:bg-white/5 backdrop-blur-md transition-all shadow-md flex justify-center items-center p-0"
                variant="ghost"
              >
                <CalculatorIcon className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
              </Button>
            </motion.div>

            {selectedMode === "traditional" || enableNavigation ? (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={nextQuestion}
                  disabled={!enableNavigation && !isAnswered}
                  className="px-6 py-3 md:px-10 text-base md:text-lg font-semibold rounded-full shadow-lg border border-white/10 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {currentQuestion === questions.length - 1 ? (
                    <>
                      <Trophy className="w-5 h-5 mr-2 hidden sm:inline" />
                      Finish
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Next</span>
                      <ArrowRight className="w-5 h-5 sm:ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <div className="w-[100px] sm:w-[130px]" />
            )}
          </div>
        </div>

        {/* Calculator Overlay */}
        <AnimatePresence>
          {showCalculator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 pointer-events-auto"
              style={{
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
              onClick={() => setShowCalculator(false)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.92, opacity: 0, y: 15 }}
                transition={{
                  type: "spring",
                  damping: 26,
                  stiffness: 320
                }}
                className="w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-background/90 backdrop-blur-xl border border-border/80 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-border/40">
                    <h3 className="font-bold text-xl flex items-center gap-2 text-foreground">
                      <CalculatorIcon className="w-6 h-6 text-primary" />
                      Calculator
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowCalculator(false)}
                      className="text-foreground/70 hover:bg-muted hover:text-foreground rounded-full w-9 h-9 p-0 transition-colors"
                    >
                      ✖
                    </Button>
                  </div>
                  <Calculator />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Dialog */}
        <ImageDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <ImageDialogContent className="bg-background/90 backdrop-blur-md border-border max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold ">Code Reference</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageDialog(false)}
                className="bg-primary text-primary-foreground hover:bg-white hover:text-primary transition-colors px-4 py-2 rounded-md"
              >
                ✖
              </Button>
            </div>
            {currentImage && (
              <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage}
                  alt="Code reference"
                  className="max-w-full max-h-full object-contain"
                  loading="eager"
                  style={{ imageRendering: 'crisp-edges' }}
                  onError={(e) => {
                    console.error('Failed to load image:', currentImage);
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class=" text-center p-8">
                          <p class="text-red-400 mb-2">❌ Failed to load image</p>
                          <p class="text-sm text-muted-foreground">${currentImage}</p>
                        </div>
                      `;
                    }
                  }}
                  onLoad={() => console.log('✅ Image loaded:', currentImage)}
                />
              </div>
            )}
            <p className="text-sm text-foreground/70 mt-4 text-center">
              Refer to this code snippet to answer the question num.{currentQuestion + 1}
            </p>
          </ImageDialogContent>
        </ImageDialog>
      </div>
      </>
    );
  }

  if (currentStep === "results") {
    const percentage = Math.round((score / questions.length) * 100);
    const scoreInfo = getScoreMessage();
    
    // Calculate time taken
    let formattedTimeTaken = "Unlimited";
    if (selectedDuration > 0) {
      const totalSeconds = (selectedDuration * 60) - timeLeft;
      const mins = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;
      formattedTimeTaken = `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    
    // Score based animations
    const isPerfect = percentage === 100;
    const isPassing = percentage >= 60;
    
    return (
      <>
        <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 md:p-8 overflow-hidden bg-background">
          
          {/* Ambient Background Glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ duration: 1 }}
              className="absolute -top-1/4 -right-1/4 w-3/4 h-3/4 rounded-full blur-[40px] md:blur-[100px] will-change-transform md:blur-[180px] will-change-[transform,opacity] bg-primary"
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute -bottom-1/4 -left-1/4 w-3/4 h-3/4 rounded-full blur-[40px] md:blur-[100px] will-change-transform md:blur-[180px] will-change-[transform,opacity] bg-primary"
            />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-4xl"
          >
            {/* Success Confetti Effect (for passing scores) */}
            {isPassing && !prefersReducedMotion && (
              <div className="absolute inset-0 pointer-events-none -z-10 flex justify-center">
                 {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 0, x: 0, opacity: 1, scale: 0 }}
                      animate={{ 
                        y: [0, -300 - Math.random() * 200, 500], 
                        x: (Math.random() - 0.5) * 500,
                        opacity: [0, 1, 1, 0],
                        scale: [0, Math.random() * 0.5 + 0.5, 0]
                      }}
                      transition={{ 
                        duration: 3 + Math.random() * 2, 
                        ease: "easeOut",
                        delay: Math.random() * 0.5
                      }}
                      className="absolute rounded-full w-3 h-3 will-change-[transform,opacity]"
                      style={{ 
                        backgroundColor: ["#22c55e", "#3b82f6", "#eab308", "#a855f7", "#ec4899"][i % 5]
                      }}
                    />
                 ))}
              </div>
            )}

            <Card className="relative overflow-hidden border-border/60 bg-background/40 backdrop-blur-xl shadow-2xl rounded-[2.5rem]">
              {/* Glass reflection line */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <CardHeader className="pt-12 pb-6 text-center text-foreground z-10 relative">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                  className="mx-auto mb-8 relative"
                >
                  <div className="relative inline-flex items-center justify-center p-6 rounded-full bg-background border border-border/50 shadow-xl overflow-hidden group">
                    {isPerfect ? (
                      <Trophy className="w-20 h-20 md:w-28 md:h-28 text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                    ) : isPassing ? (
                      <Award className="w-20 h-20 md:w-28 md:h-28 text-primary drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                    ) : (
                      <Target className="w-20 h-20 md:w-28 md:h-28 text-muted-foreground/80 drop-shadow-md" />
                    )}

                    {isPassing && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="absolute -top-2 -right-2 hidden sm:block"
                      >
                        <Sparkles className="w-8 h-8 text-primary" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Badge 
                       className={cn(
                         "mb-4 text-xs font-semibold px-3 py-1 shadow-sm border",
                         quizStatus === "timed-out" ? "bg-orange-500/15 text-orange-500 border-orange-500/40" : "bg-primary/20 text-primary border-primary/40"
                       )}
                    >
                       {quizStatus === "timed-out" ? "Timer Expired" : "Mission Accomplished"}
                    </Badge>
                  </motion.div>
                  
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-3xl md:text-5xl font-black tracking-tight"
                  >
                    {scoreInfo.message}
                  </motion.h2>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-muted-foreground text-lg md:text-xl font-medium max-w-lg mx-auto"
                  >
                    {isPerfect 
                      ? "Flawless victory! You have mastered this domain." 
                      : isPassing 
                        ? "Great job! Keep pushing your limits to achieve perfection."
                        : "Every failure is a stepping stone to success. Review and retry!"}
                  </motion.p>
                </div>
              </CardHeader>

              <CardContent className="px-6 md:px-12 pb-12 relative z-10">
                {/* Big Circular Score */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 my-8 md:my-12">
                  
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                    className="relative w-56 h-56 md:w-64 md:h-64 flex items-center justify-center"
                  >
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 120 120">
                      {/* Background Track */}
                      <circle cx="60" cy="60" r="54" stroke="currentColor" className="text-muted/20" strokeWidth="8" fill="transparent" />
                      
                      {/* Foreground Progress */}
                      <motion.circle
                        cx="60" cy="60" r="54"
                        className="stroke-primary will-change-[stroke-dashoffset]"
                        strokeWidth="8"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 54}
                        initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - percentage / 100) }}
                        transition={{ duration: 1.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>

                    <div className="flex flex-col items-center justify-center absolute inset-0 space-y-1">
                      <motion.span 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5 }}
                        className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60"
                      >
                        {percentage}<span className="text-4xl md:text-5xl">%</span>
                      </motion.span>
                      <span className="text-sm md:text-base font-bold text-muted-foreground uppercase tracking-widest">
                        Total Score
                      </span>
                    </div>
                  </motion.div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 md:gap-6 w-full md:w-auto">
                    {/* Correct Answers */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 }}
                      className="flex border border-border/50 items-center p-4 md:p-5 rounded-2xl bg-muted/20 backdrop-blur-sm shadow-sm group hover:scale-[1.02] transition-all"
                    >
                      <div className="p-3 md:p-4 rounded-xl bg-green-500/10 mr-4 group-hover:bg-green-500/20 transition-colors">
                        <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
                      </div>
                      <div>
                        <div className="text-2xl md:text-3xl font-black">{score}</div>
                        <div className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Correct</div>
                      </div>
                    </motion.div>

                    {/* Incorrect Answers */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                      className="flex border border-border/50 items-center p-4 md:p-5 rounded-2xl bg-muted/20 backdrop-blur-sm shadow-sm group hover:scale-[1.02] transition-all"
                    >
                      <div className="p-3 md:p-4 rounded-xl bg-red-500/10 mr-4 group-hover:bg-red-500/20 transition-colors">
                        <XCircle className="w-6 h-6 md:w-8 md:h-8 text-red-500" />
                      </div>
                      <div>
                        <div className="text-2xl md:text-3xl font-black">{questions.length - score}</div>
                        <div className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Incorrect</div>
                      </div>
                    </motion.div>

                    {/* Questions Total */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 }}
                      className="flex border border-border/50 items-center p-4 md:p-5 rounded-2xl bg-muted/20 backdrop-blur-sm shadow-sm group hover:scale-[1.02] transition-all"
                    >
                      <div className="p-3 md:p-4 rounded-xl bg-blue-500/10 mr-4 group-hover:bg-blue-500/20 transition-colors">
                        <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
                      </div>
                      <div>
                        <div className="text-2xl md:text-3xl font-black">{questions.length}</div>
                        <div className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Questions</div>
                      </div>
                    </motion.div>

                    {/* Time Taken */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 }}
                      className="flex border border-border/50 items-center p-4 md:p-5 rounded-2xl bg-muted/20 backdrop-blur-sm shadow-sm group hover:scale-[1.02] transition-all"
                    >
                      <div className="p-3 md:p-4 rounded-xl mr-4 transition-colors bg-primary/20">
                        <Timer className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-black whitespace-nowrap">{formattedTimeTaken}</div>
                        <div className="text-xs md:text-sm font-semibold text-muted-foreground uppercase tracking-wider">Duration</div>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 md:max-w-2xl md:mx-auto"
                >
                  <button
                    onClick={() => setCurrentStep("review")}
                    className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-2xl border-2 border-b-[5px] border-primary border-b-indigo-700 dark:border-b-indigo-900 bg-primary text-primary-foreground transition-all active:border-b-2 active:translate-y-[3px] flex items-center justify-center group shadow-md hover:brightness-105"
                  >
                    <Eye className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Review Answers
                  </button>
                  <button
                    onClick={() => setCurrentStep("setup")}
                    className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-2xl border-2 border-b-[5px] border-primary border-b-primary/50 bg-transparent text-primary hover:bg-primary/5 transition-all active:border-b-2 active:translate-y-[3px] flex items-center justify-center group shadow-md"
                  >
                    <Play className="w-5 h-5 mr-2 group-hover:translate-x-1 transition-transform" />
                    Retry Quiz
                  </button>
                  <button
                    onClick={onExit}
                    className="w-full sm:w-auto h-14 px-8 text-lg font-bold rounded-2xl border-2 border-b-[5px] border-border border-b-muted bg-transparent text-muted-foreground hover:bg-muted/30 transition-all active:border-b-2 active:translate-y-[3px] flex items-center justify-center group shadow-md"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Exit
                  </button>
                </motion.div>

              </CardContent>
            </Card>
          </motion.div>
        </div>
      </>
    );
  }

  if (currentStep === "review") {

    return (
      <>
      <div className="relative min-h-screen w-full overflow-hidden pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-xl md:blur-3xl" />

        <div className="relative z-10 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
              >
                <button
                  onClick={() => setCurrentStep("results")}
                  className="px-6 py-2.5 text-sm font-bold rounded-2xl border-2 border-b-[5px] border-primary border-b-primary/50 bg-primary/10 text-primary hover:bg-primary/20 transition-all active:border-b-2 active:translate-y-[3px] flex items-center justify-center shadow-sm animate-nav-enter"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Results
                </button>
                <Badge
                  variant="outline"
                  className="text-lg px-6 py-2 border-primary/20 text-foreground/80 bg-primary/5 rounded-full"
                >
                  Answer Review
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl md:text-5xl font-black mb-4 tracking-tight"
              >
                Your Quiz Answers
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-muted-foreground font-medium"
              >
                Review your performance and learn from the correct answers
              </motion.p>
            </div>

            {/* Answer blocks */}
            <div className="grid gap-6">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = userAnswer === question.answer;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className={cn(
                        "bg-background/20 border-2 backdrop-blur-xl transition-all rounded-[2rem] overflow-hidden shadow-md",
                        isCorrect
                          ? "border-green-500/20 bg-green-500/[0.03]"
                          : "border-red-500/20 bg-red-500/[0.03]"
                      )}
                    >
                      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <Badge
                                variant="outline"
                                className="text-xs px-3 py-1 border-primary/20 text-primary bg-primary/5 rounded-full"
                              >
                                Question {index + 1}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs px-3 py-1 border-border text-foreground/70 bg-muted/20 rounded-full"
                              >
                                {question.type}
                              </Badge>
                              {question.image && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShowImage(question.image)}
                                  className="border-border hover:bg-muted bg-background/50 rounded-full px-3 h-7 text-xs"
                                >
                                  <Code className="w-3 h-3 mr-1" />
                                  View Code
                                </Button>
                              )}
                            </div>
                            <CardTitle className="text-xl md:text-2xl leading-relaxed font-black tracking-tight text-foreground">
                              {formatTextWithLatex(question.question)}
                            </CardTitle>
                          </div>
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: index * 0.05 + 0.2 }}
                            className="ml-4 flex-shrink-0"
                          >
                            {isCorrect ? (
                              <div className="w-12 h-12 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center shadow-inner">
                                <CheckCircle className="w-6 h-6 text-green-400" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-red-500/10 border-2 border-red-400 flex items-center justify-center shadow-inner">
                                <XCircle className="w-6 h-6 text-red-400" />
                              </div>
                            )}
                          </motion.div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-3">
                          {/* User's answer */}
                          <div className="p-4 rounded-2xl border border-border/50 bg-background/30 shadow-inner">
                            <div className="flex items-center gap-2 mb-1.5">
                              <BookOpen className="w-4.5 h-4.5 text-muted-foreground" />
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                Your Answer:
                              </span>
                            </div>
                            <p
                              className={cn(
                                "text-lg font-bold",
                                isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                              )}
                            >
                              {userAnswer ? formatTextWithLatex(userAnswer) : "No answer selected"}
                            </p>
                          </div>

                          {/* Correct answer (if different) */}
                          {!isCorrect && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-4 rounded-2xl border border-green-500/20 bg-green-500/[0.03] shadow-inner"
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <Lightbulb className="w-4.5 h-4.5 text-green-500" />
                                <span className="text-xs font-bold text-green-500 uppercase tracking-wider">
                                  Correct Answer:
                                </span>
                              </div>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatTextWithLatex(question.answer)}
                              </p>
                            </motion.div>
                          )}

                          {/* Explanation section */}
                          {question.explanation && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.02]"
                            >
                              <div className="flex items-start gap-2.5">
                                <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider block mb-1">
                                    Explanation:
                                  </span>
                                  <p className="text-foreground/80 text-sm font-medium leading-relaxed">
                                    {formatTextWithLatex(question.explanation)}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-12"
            >
              <Card className="bg-background/40 border border-border/60 backdrop-blur-xl rounded-[2.5rem] shadow-xl overflow-hidden">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-black mb-6 tracking-tight">
                    Quiz Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="p-4 rounded-2xl bg-green-500/[0.05] border border-green-500/20">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <div className="text-2xl font-black text-green-500 mb-0.5">
                        {score}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Correct Answers
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-red-500/[0.05] border border-red-500/20">
                      <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-black text-red-500 mb-0.5">
                        {questions.length - score}
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Incorrect Answers
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/[0.05] border border-primary/20">
                      <Target className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-black text-primary mb-0.5">
                        {Math.round((score / questions.length) * 100)}%
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Final Score</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setCurrentStep("results")}
                      className="px-8 py-3.5 text-base font-bold rounded-2xl border-2 border-b-[5px] border-primary border-b-indigo-700 dark:border-b-indigo-900 bg-primary text-primary-foreground transition-all active:border-b-2 active:translate-y-[3px] flex items-center justify-center shadow-md hover:brightness-105"
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Back to Results
                    </button>
                    <button
                      onClick={() => window.history.back()}
                      className="px-8 py-3.5 text-base font-bold rounded-2xl border-2 border-b-[5px] border-primary border-b-primary/50 bg-transparent text-primary hover:bg-primary/5 transition-all active:border-b-2 active:translate-y-[3px] flex items-center justify-center shadow-md"
                    >
                      <BookOpen className="w-5 h-5 mr-2" />
                      Back to Course
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Image Dialog */}
        <ImageDialog open={showImageDialog} onOpenChange={setShowImageDialog}>
          <ImageDialogContent className="bg-background/90 backdrop-blur-md border-border max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold ">Code Reference</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageDialog(false)}
                className="bg-primary text-primary-foreground hover:bg-white hover:text-primary transition-colors px-4 py-2 rounded-md shadow-sm"
              >
                ✖
              </Button>
            </div>
            {currentImage && (
              <div className="relative w-full h-96 bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImage}
                  alt="Code reference"
                  className="max-w-full max-h-full object-contain"
                  loading="eager"
                  style={{ imageRendering: 'crisp-edges' }}
                  onError={(e) => {
                    console.error('Failed to load image:', currentImage);
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class=" text-center p-8">
                          <p class="text-red-400 mb-2">❌ Failed to load image</p>
                          <p class="text-sm text-muted-foreground">${currentImage}</p>
                        </div>
                      `;
                    }
                  }}
                  onLoad={() => console.log('✅ Image loaded:', currentImage)}
                />
              </div>
            )}
            <p className="text-sm text-foreground/70 mt-4 text-center">
              Refer to this code snippet to answer the question num.{currentQuestion + 1}
            </p>
          </ImageDialogContent>
        </ImageDialog>
      </div>
      </>
    );
  }
  return null;
}
