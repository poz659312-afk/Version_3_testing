"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Video,
  BookOpen,
  ClipboardList,
  GraduationCap,
  ExternalLink,
  Play,
  Layers,
  Share2,
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { departmentData, type Department, type Subject } from "@/lib/department-data";
import { cn } from "@/lib/utils";
import React, { Suspense, memo, useState, useEffect, useRef } from "react";
import ErrorBoundary from "@/components/ErrorBoundary";
import AdBanner from "@/components/AdBanner";

interface Props {
  params: Promise<{ department: string; level: string; subject: string }>;
}

interface SectionType {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
  content: string | string[] | boolean | null | undefined;
  description: string;
  buttonText: string;
  redirectToDrive: boolean;
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", bounce: 0.3 }
  },
};

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { type: "spring", bounce: 0.3 }
  },
};

export default function SubjectPage({ params }: Props) {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"/>
        </div>
      }>
        <SubjectContent params={params} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Custom animated Segmented Controller Tab Button
const TabButton = memo(({ 
  section, 
  isActive, 
  onSelect 
}: { 
  section: SectionType; 
  isActive: boolean;
  onSelect: (tab: string) => void;
}) => {
  const IconComponent = section.icon;
  
  return (
    <button
      id={`tab-btn-${section.id}`}
      onClick={() => onSelect(section.id)}
      className="relative px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs font-medium transition-colors outline-none z-10 flex flex-col items-center justify-center gap-0.5 sm:gap-1 group min-w-[56px] sm:min-w-[76px]"
    >
      {isActive && (
        <motion.div
          layoutId="activeTabBadge"
          className={cn(
            "absolute inset-0 rounded-xl sm:rounded-2xl pointer-events-none shadow-sm border",
            section.id === "lectures" && "bg-primary/10 dark:bg-primary/20 border-primary/20",
            section.id === "sections" && "bg-secondary/10 dark:bg-secondary/20 border-secondary/20",
            section.id === "summaries" && "bg-accent/10 dark:bg-accent/20 border-accent/20",
            section.id === "videos" && "bg-primary/10 dark:bg-primary/20 border-primary/20",
            section.id === "quizzes" && "bg-secondary/10 dark:bg-secondary/20 border-secondary/20",
            section.id === "exams" && "bg-accent/10 dark:bg-accent/20 border-accent/20"
          )}
          transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
        />
      )}
      <IconComponent 
        className={cn(
          "w-3.5 h-3.5 sm:w-4 sm:h-4 z-10 transition-transform duration-300 group-hover:scale-110", 
          isActive ? section.iconColor : "text-muted-foreground group-hover:text-foreground"
        )} 
      />
      <span 
        className={cn(
          "text-[8.5px] sm:text-[10px] md:text-xs font-outfit tracking-tighter sm:tracking-tight z-10 leading-tight select-none", 
          isActive ? "text-foreground font-bold" : "text-muted-foreground/75 group-hover:text-foreground"
        )}
      >
        {section.title}
      </span>
    </button>
  );
});

TabButton.displayName = "TabButton";

// Copy link logic
const CopyLinkButton = memo(({ tabId }: { tabId: string }) => {
  const [copied, setCopied] = useState(false);

  const copyTabLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?tab=${tabId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      onClick={copyTabLink}
      variant="outline"
      size="sm"
      className="rounded-full shadow-sm bg-background border-border text-muted-foreground hover:bg-muted font-outfit text-xs"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 mr-1" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5 mr-1" />
          Share Link
        </>
      )}
    </Button>
  );
});

CopyLinkButton.displayName = "CopyLinkButton";

function TabsWrapper({ 
  sections, 
  subject, 
  resolvedParams 
}: { 
  sections: SectionType[]; 
  subject: Subject; 
  resolvedParams: { department: string; level: string; subject: string };
}) {
  const [currentTab, setCurrentTab] = useState("lectures");
  const [mounted, setMounted] = useState(false);
  const [dbQuizzes, setDbQuizzes] = useState<any[] | null>(null);
  const [quizzesLoading, setQuizzesLoading] = useState(true);

  // Swipe detection refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get("tab");
    if (tabParam && sections.some(s => s.id === tabParam)) {
      setCurrentTab(tabParam);
    }
  }, [sections]);

  useEffect(() => {
    if (!mounted) return;
    const fetchQuizzes = async () => {
      try {
        const { createBrowserClient } = await import('@/lib/supabase/client');
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from('quiz_department')
          .select('code, name, duration, questions_count')
          .eq('department_slug', resolvedParams.department)
          .eq('subject_id', resolvedParams.subject);

        if (!error && data) {
          setDbQuizzes(data);
        }
      } catch (err) {
        console.error("Failed to load quizzes from DB:", err);
      } finally {
        setQuizzesLoading(false);
      }
    };

    fetchQuizzes();
  }, [resolvedParams.department, resolvedParams.subject, mounted]);

  const dynamicSections = React.useMemo(() => {
    return sections.map(sec => {
      if (sec.id === 'quizzes') {
        const hasDbQuizzes = dbQuizzes && dbQuizzes.length > 0;
        const hasStaticQuizzes = (subject.materials.quizzes?.length || 0) > 0;
        return {
          ...sec,
          content: hasDbQuizzes || hasStaticQuizzes ? true : null
        };
      }
      return sec;
    });
  }, [sections, dbQuizzes, subject.materials.quizzes]);

  // Auto scroll active tab button into view on mobile/tablet
  useEffect(() => {
    if (mounted) {
      const activeElement = document.getElementById(`tab-btn-${currentTab}`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [currentTab, mounted]);

  const handleTabChange = (tabId: string) => {
    setCurrentTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabId);
    window.history.pushState({}, "", url);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null || 
      touchEndX.current === null || 
      touchStartY.current === null || 
      touchEndY.current === null
    ) return;

    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    
    // Trigger swipe only if horizontal movement is significant and larger than vertical scrolling
    if (Math.abs(distanceX) > 60 && Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
      const currentIndex = dynamicSections.findIndex(s => s.id === currentTab);
      if (currentIndex !== -1) {
        if (distanceX > 0 && currentIndex < dynamicSections.length - 1) {
          // Swipe left -> next tab
          handleTabChange(dynamicSections[currentIndex + 1].id);
        } else if (distanceX < 0 && currentIndex > 0) {
          // Swipe right -> previous tab
          handleTabChange(dynamicSections[currentIndex - 1].id);
        }
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  if (!mounted) return null;

  const activeSection = dynamicSections.find(s => s.id === currentTab) || dynamicSections[0];
  const IconComponent = activeSection.icon;

  return (
    <div className="w-full">
      {/* Pill Segmented Controller */}
      <div className="flex justify-center w-full mb-8 overflow-x-auto pb-4 scrollbar-hide px-4">
        <div className="flex bg-muted/30 p-1.5 rounded-full border border-border/50 backdrop-blur-md mx-auto">
          {dynamicSections.map((section) => (
            <TabButton 
              key={section.id} 
              section={section} 
              isActive={currentTab === section.id}
              onSelect={handleTabChange}
            />
          ))}
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card 
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="bg-card/40 border-border shadow-2xl backdrop-blur-lg md:backdrop-blur-3xl overflow-hidden rounded-[2rem] relative touch-pan-y"
          >
            <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 bg-gradient-to-br ${activeSection.color} blur-xl md:blur-3xl pointer-events-none rounded-full -mt-20 -mr-20`} />
            
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-6 pt-8 px-6 sm:px-8">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center relative group",
                      "bg-gradient-to-br border shadow-sm",
                      activeSection.color.replace('0.15', '1') // Ensure colors pop inside the Icon
                    )}
                  >
                    <IconComponent className={cn("w-7 h-7 relative z-10", activeSection.iconColor)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-outfit text-2xl font-bold tracking-tight">{activeSection.title}</span>
                    <span className="text-sm font-normal text-muted-foreground">{activeSection.description}</span>
                  </div>
                </CardTitle>
                <div className="hidden sm:block">
                  <CopyLinkButton tabId={activeSection.id} />
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-8 px-6 sm:px-8 pb-10">
              <TabContentRenderer 
                section={activeSection}
                subject={subject}
                resolvedParams={resolvedParams}
                dbQuizzes={dbQuizzes}
                quizzesLoading={quizzesLoading}
              />
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Beautiful Hover Action Content Renderer
const TabContentRenderer = memo(({ 
  section, 
  subject, 
  resolvedParams,
  dbQuizzes,
  quizzesLoading,
}: { 
  section: SectionType; 
  subject: Subject; 
  resolvedParams: { department: string; level: string; subject: string };
  dbQuizzes: any[] | null;
  quizzesLoading: boolean;
}) => {
  const extractDriveId = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("drive.google.com")) {
        if (urlObj.pathname.includes("/file/d/")) {
          const match = url.match(/\/file\/d\/([^\/]+)/);
          return match ? match[1] : url;
        } else if (urlObj.pathname.includes("/folders/")) {
          const match = url.match(/\/folders\/([^\/\?]+)/);
          return match ? match[1] : url;
        } else if (urlObj.searchParams.has("id")) {
          return urlObj.searchParams.get("id") || url;
        }
      }
      return url;
    } catch {
      return url;
    }
  };

  const extractPlaylistId = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        if (urlObj.pathname.includes("/playlist")) {
          return urlObj.searchParams.get("list") || "";
        } else if (urlObj.pathname.includes("/watch")) {
          return urlObj.searchParams.get("list") || "";
        }
      }
      return "";
    } catch {
      return "";
    }
  };

  const IconComponent = section.icon;

  const colorMap = {
    lectures: {
      hoverBorder: "hover:border-primary/50",
      hoverShadow: "hover:shadow-primary/10",
      gradient: "from-primary/0 via-primary/5 to-primary/10",
      text: "group-hover:text-primary",
      textStatic: "text-primary",
      bgLight: "bg-primary/10",
      borderLight: "border-primary/20",
    },
    sections: {
      hoverBorder: "hover:border-secondary/50",
      hoverShadow: "hover:shadow-secondary/10",
      gradient: "from-secondary/0 via-secondary/5 to-secondary/10",
      text: "group-hover:text-secondary",
      textStatic: "text-secondary",
      bgLight: "bg-secondary/10",
      borderLight: "border-secondary/20",
    },
    summaries: {
      hoverBorder: "hover:border-accent/50",
      hoverShadow: "hover:shadow-accent/10",
      gradient: "from-accent/0 via-accent/5 to-accent/10",
      text: "group-hover:text-accent",
      textStatic: "text-accent",
      bgLight: "bg-accent/10",
      borderLight: "border-accent/20",
    },
    exams: {
      hoverBorder: "hover:border-accent/50",
      hoverShadow: "hover:shadow-accent/10",
      gradient: "from-accent/0 via-accent/5 to-accent/10",
      text: "group-hover:text-accent",
      textStatic: "text-accent",
      bgLight: "bg-accent/10",
      borderLight: "border-accent/20",
    },
    videos: {
      hoverBorder: "hover:border-primary/50",
      hoverShadow: "hover:shadow-primary/10",
      gradient: "from-primary/0 via-primary/5 to-primary/10",
      text: "group-hover:text-primary",
      textStatic: "text-primary",
      bgLight: "bg-primary/10",
      borderLight: "border-primary/20",
    },
    quizzes: {
      hoverBorder: "hover:border-secondary/50",
      hoverShadow: "hover:shadow-secondary/10",
      gradient: "from-secondary/0 via-secondary/5 to-secondary/10",
      text: "group-hover:text-secondary",
      textStatic: "text-secondary",
      bgLight: "bg-secondary/10",
      borderLight: "border-secondary/20",
    }
  };

  const style = colorMap[section.id as keyof typeof colorMap] || colorMap.lectures;

  if (!section.content) {
    return (
      <div className="text-center py-16 flex flex-col items-center">
        <div className="p-6 bg-muted/40 rounded-full mb-6 relative">
          <div className={`absolute inset-0 border ${style.borderLight} animate-ping rounded-full opacity-20`} />
          <IconComponent className={cn("w-10 h-10 opacity-30", section.iconColor)} />
        </div>
        <h4 className="font-outfit text-lg font-bold mb-2">Module Offline</h4>
        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          The resources for <span className="text-foreground font-medium">{subject.name}</span> in this section are currently being assembled by the academic team. They will be pushed here soon.
        </p>
      </div>
    );
  }

  if (section.id === "quizzes") {
    if (quizzesLoading) {
      return (
        <div className="text-center py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin mb-4" />
          <span className="text-muted-foreground text-sm">Loading quizzes...</span>
        </div>
      );
    }

    const quizzesToDisplay = (dbQuizzes && dbQuizzes.length > 0)
      ? dbQuizzes.map(q => ({
          id: q.code,
          name: q.name,
          code: q.code,
          duration: q.duration,
          questions: q.questions_count
        }))
      : subject.materials.quizzes;

    if (!quizzesToDisplay || quizzesToDisplay.length === 0) {
      return (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="p-6 bg-muted/40 rounded-full mb-6 relative">
            <div className={`absolute inset-0 border ${style.borderLight} animate-ping rounded-full opacity-20`} />
            <IconComponent className={cn("w-10 h-10 opacity-30", section.iconColor)} />
          </div>
          <h4 className="font-outfit text-lg font-bold mb-2">Module Offline</h4>
          <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
            The resources for <span className="text-foreground font-medium">{subject.name}</span> in this section are currently being assembled by the academic team. They will be pushed here soon.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzesToDisplay.map((quiz, idx: number) => (
          <Link
            key={quiz.id}
            href={`/quiz/${resolvedParams.department}/${resolvedParams.subject}/${quiz.id}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className={cn(
                "group relative flex flex-col justify-between p-6 bg-card border border-border rounded-2xl transition-all duration-300 hover:shadow-xl overflow-hidden min-h-[140px]",
                style.hoverBorder,
                style.hoverShadow
              )}
            >
              {/* Neon Glow Overlay */}
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", style.gradient.replace('to-secondary/10', 'to-secondary/5').replace('to-primary/10', 'to-primary/5'))} />
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <h4 className={cn("font-bold font-outfit text-lg leading-tight mb-2 transition-colors", style.text)}>
                    {quiz.name}
                  </h4>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground font-outfit">
                    <span className="bg-muted px-2 py-0.5 rounded-md border border-border/50 text-foreground/80">{quiz.code}</span>
                    <span className="bg-muted px-2 py-0.5 rounded-md border border-border/50 text-foreground/80">{quiz.duration}</span>
                    <span className={cn("px-2 py-0.5 rounded-md border text-xs font-medium", style.bgLight, style.textStatic, style.borderLight)}>{quiz.questions} Q</span>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <div className={cn("flex items-center text-sm font-bold transition-colors", style.text)}>
                    Start Protocol <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    );
  }

  if (section.redirectToDrive) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Link 
          href={`/drive/${extractDriveId(typeof section.content === 'string' ? section.content : (Array.isArray(section.content) ? section.content[0] : ''))}`}
        >
          <div className={cn(
            "group relative w-full flex items-center justify-between p-6 sm:p-8 bg-card border border-border rounded-2xl transition-all duration-300 hover:shadow-2xl overflow-hidden cursor-pointer",
            style.hoverBorder,
            style.hoverShadow
          )}>
            <div className={cn("absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", style.gradient)} />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="w-14 h-14 bg-muted border border-border/50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <ExternalLink className={cn("w-7 h-7 text-muted-foreground transition-colors", style.text)} />
              </div>
              <div className="flex flex-col">
                <h4 className={cn("font-outfit font-bold text-xl text-foreground transition-colors", style.text)}>
                  {section.buttonText}
                </h4>
                <span className="text-muted-foreground text-sm font-medium">Access cloud drive database</span>
              </div>
            </div>
            <div className={cn("relative z-10 w-10 h-10 rounded-full flex items-center justify-center opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300", style.bgLight)}>
              <ChevronRight className={cn("w-5 h-5", style.textStatic)} />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Videos
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(() => {
        const videoContent = section.content;
        const renderVideoButton = (url: string, index?: number) => {
          const playlistId = extractPlaylistId(url);
          const isMultiple = Array.isArray(videoContent) && videoContent.length > 1;
          
          return (
            <Link key={index || 0} href={playlistId ? `/youtube/${playlistId}` : '#'}>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index || 0) * 0.1, duration: 0.4 }}
                className={cn(
                  "group relative flex items-center p-5 bg-card border border-border rounded-2xl transition-all duration-300 hover:shadow-xl overflow-hidden cursor-pointer",
                  style.hoverBorder,
                  style.hoverShadow
                )}
              >
                <div className={cn("absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", style.gradient)} />
                
                <div className={cn("w-12 h-12 border rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform shadow-[0_0_15px_0_rgba(var(--primary),0.2)]", style.bgLight, style.borderLight)}>
                  <Play className={cn("w-5 h-5 ml-1", style.textStatic)} />
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h4 className={cn("font-outfit font-bold text-foreground transition-colors", style.text)}>
                    {isMultiple ? `Video Playlist Sequence ${index! + 1}` : section.buttonText}
                  </h4>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Launch Visuals</span>
                </div>
              </motion.div>
            </Link>
          );
        };

        if (Array.isArray(videoContent)) {
          return videoContent.map((url, idx) => renderVideoButton(typeof url === 'string' ? url : '', idx));
        } else {
          return renderVideoButton(typeof videoContent === 'string' ? videoContent : '');
        }
      })()}
    </div>
  );
});

TabContentRenderer.displayName = "TabContentRenderer";

async function SubjectContent({ params }: Props) {
  const resolvedParams = await params;
  const dept = departmentData[resolvedParams.department];
  const levelNum = Number.parseInt(resolvedParams.level);

  if (!dept || !dept.levels[levelNum]) {
    notFound();
  }

  const level = dept.levels[levelNum];
  const subject = [...level.subjects.term1, ...level.subjects.term2].find(
    (s) => s.id === resolvedParams.subject
  );

  if (!subject) notFound();

  const yearSuffix = levelNum === 1 ? "st" : levelNum === 2 ? "nd" : levelNum === 3 ? "rd" : "th";

  const getPrerequisiteSubjects = () => {
    if (!subject.prerequisites || subject.prerequisites.length === 0) return null;

    const allSubjects: Subject[] = [];
    for (const level of Object.values(dept.levels)) {
      allSubjects.push(...level.subjects.term1, ...level.subjects.term2);
    }
    return subject.prerequisites
      .map((prereqId) => allSubjects.find((s) => s.id === prereqId))
      .filter((prereq): prereq is Subject => prereq !== undefined);
  };

  const prerequisiteSubjects = getPrerequisiteSubjects();

  const sections = [
    {
      id: "lectures",
      title: "Lectures",
      icon: BookOpen,
      color: "from-primary/15",
      iconColor: "text-primary",
      content: subject.materials.lectures,
      description: "Theoretical frameworks and notes",
      buttonText: "Open Lecture Materials",
      redirectToDrive: true,
    },
    {
      id: "sections",
      title: "Sections",
      icon: FileText,
      color: "from-secondary/15",
      iconColor: "text-secondary",
      content: subject.materials.sections,
      description: "Practice problems and section data",
      buttonText: "Open Section Materials",
      redirectToDrive: true,
    },
    {
      id: "summaries",
      title: "Summaries",
      icon: Layers,
      color: "from-accent/15",
      iconColor: "text-accent",
      content: subject.materials.summaries,
      description: "Quick reference study guides",
      buttonText: "Open Summary Materials",
      redirectToDrive: true,
    },
    {
      id: "videos",
      title: "Videos",
      icon: Video,
      color: "from-primary/15",
      iconColor: "text-primary",
      content: subject.materials.videos,
      description: "Comprehensive video lectures",
      buttonText: "Open Video Playlist",
      redirectToDrive: false,
    },
    {
      id: "quizzes",
      title: "Quizzes",
      icon: ClipboardList,
      color: "from-secondary/15",
      iconColor: "text-secondary",
      content: (subject.materials.quizzes?.length || 0) > 0 ? true : null,
      description: "Evaluate your knowledge",
      buttonText: "View Quizzes",
      redirectToDrive: false,
    },
    {
      id: "exams",
      title: "Last Exams",
      icon: GraduationCap,
      color: "from-accent/15",
      iconColor: "text-accent",
      content: subject.materials.exams,
      description: "Previous exam matrices",
      buttonText: subject.materials.exams ? "Open Last Exams" : "Coming Soon",
      redirectToDrive: true,
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-auto bg-background text-foreground font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 blur-xl md:blur-3xl pointer-events-none" />
      
      <div className="relative z-10 py-12 px-4 sm:px-6 min-h-screen">
        <div className="max-w-5xl mx-auto pb-20">
          
          {/* Back Navigation Header */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 flex justify-between items-center"
          >
            <Link href={`/specialization/${resolvedParams.department}/${resolvedParams.level}`}>
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30 rounded-full h-9 bg-background/50 border-border/50 backdrop-blur-md font-outfit transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to {levelNum}{yearSuffix} Year Data
              </Button>
            </Link>
          </motion.div>

          {/* Epic Glassmorphic Subject Hero Block */}
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="mb-10 relative overflow-hidden rounded-[2.5rem] bg-card border border-border shadow-2xl backdrop-blur-md"
          >
            {/* Ambient Background Shaders inside Hero */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/20 via-transparent to-transparent opacity-60 rounded-full blur-xl md:blur-3xl -mt-40 -mr-40 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 via-transparent to-transparent rounded-full blur-xl md:blur-3xl -mb-40 -ml-40 pointer-events-none" />
            
            <div className="relative p-8 sm:p-12 z-10 flex flex-col md:flex-row gap-10 items-center md:items-start justify-between">
              <div className="flex-1 space-y-6 text-center md:text-left">
                {/* Meta Badges */}
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-outfit text-sm tracking-wide rounded-lg">
                    {dept.name}
                  </Badge>
                  <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 px-3 py-1 font-outfit text-sm tracking-wide rounded-lg">
                    {levelNum}{yearSuffix} Year Level
                  </Badge>
                  <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 px-3 py-1 font-outfit text-sm tracking-wide rounded-lg flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    {subject.creditHours} Credits
                  </Badge>
                </div>
                
                {/* Title and Description */}
                <div>
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight font-outfit mb-4 leading-tight">
                    <span style={{ WebkitTextStroke: '1.2px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000 text-primary">
                      {subject.name}
                    </span>
                  </h1>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">
                    {subject.description}
                  </p>
                </div>
              </div>

              {/* Huge Icon Visual */}
              <div className="hidden lg:flex w-48 h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-[3rem] border border-primary/20 shadow-inner flex-shrink-0 items-center justify-center rotate-3 hover:rotate-6 hover:scale-105 transition-all duration-500 relative">
                {/* Decorative dots grid behind icon */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                <BookOpen className="w-24 h-24 text-primary relative z-10 drop-shadow-2xl" />
              </div>
            </div>
          </motion.div>

          {/* Prerequisites Action Card List */}
          {prerequisiteSubjects && (
            <motion.div
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-6 ml-2">
                <Layers className="w-5 h-5 text-secondary" />
                <h3 className="font-outfit font-bold text-xl text-foreground">Required Prerequisites</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prerequisiteSubjects.map((prereq, index) => (
                  <motion.div
                    key={prereq.id}
                    custom={index}
                    variants={tabVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Link
                      href={`/specialization/${resolvedParams.department}/${findSubjectLevel(dept, prereq.id)}/${prereq.id}`}
                    >
                      <div className="group relative overflow-hidden flex items-center justify-between p-5 rounded-2xl border border-border bg-card hover:border-secondary/40 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:shadow-secondary/5">
                        <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        
                        <div className="relative z-10">
                          <h4 className="font-bold font-outfit text-foreground group-hover:text-secondary transition-colors mb-1">
                            {prereq.name}
                          </h4>
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border/50">
                            {prereq.code}
                          </span>
                        </div>
                        
                        <div className="relative z-10 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                          <ChevronRight className="w-5 h-5 text-secondary" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Modern Interactive Dashboard Controller */}
          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <TabsWrapper 
              sections={sections}
              subject={subject}
              resolvedParams={resolvedParams}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function findSubjectLevel(dept: Department, subjectId: string): string {
  for (const [levelNum, level] of Object.entries(dept.levels)) {
    const allSubjects = [...level.subjects.term1, ...level.subjects.term2];
    if (allSubjects.some((s) => s.id === subjectId)) {
      return levelNum;
    }
  }
  return "1";
}
