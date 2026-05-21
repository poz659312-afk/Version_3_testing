"use client"

import { useState } from "react"
import { useDynamicMetadata } from "@/lib/dynamic-metadata"
import { pageMetadata } from "@/lib/metadata"
import ScrollAnimatedSection from "@/components/scroll-animated-section"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sparkles,
  BookOpen,
  Award,
  Trophy,
  Database,
  BrainCircuit,
  ArrowRight,
  Clock,
  Flame,
  Zap,
  User,
  Calculator,
  HelpCircle,
  GraduationCap,
  ChevronDown,
  Info,
  Shield,
  FileText,
  Search,
  CheckCircle2,
  Layers,
  FolderOpen
} from "lucide-react"

// Types for navigation and sections
interface ManualTab {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<string>("welcome")
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  // Points Calculator States
  const [correctAnswers, setCorrectAnswers] = useState<number>(10)
  const [selectedDuration, setSelectedDuration] = useState<string>("15")
  const [selectedMode, setSelectedMode] = useState<string>("instant")
  const [selectedCompletion, setSelectedCompletion] = useState<string>("completed")

  // Bind dynamic page metadata
  useDynamicMetadata({ ...pageMetadata.manual, path: "/manual" })

  // Calculator lookup maps
  const durationBonuses: Record<string, number> = {
    "1": 5.0,
    "5": 4.5,
    "15": 4.0,
    "30": 3.5,
    "60": 3.0,
    "unlimited": 2.5,
  }

  const modeBonuses: Record<string, number> = {
    traditional: 1.2,
    instant: 1.5,
  }

  const completionBonuses: Record<string, number> = {
    completed: 2.0,
    timeout: 1.5,
  }

  // Scoring formula: (Correct Answers + Duration + Mode + Completion) / 10
  const calcCorrect = Number(correctAnswers) || 0
  const calcDuration = durationBonuses[selectedDuration] || 0
  const calcMode = modeBonuses[selectedMode] || 0
  const calcCompletion = completionBonuses[selectedCompletion] || 0

  const calculatedPoints = ((calcCorrect + calcDuration + calcMode + calcCompletion) / 10).toFixed(2)

  const tabs: ManualTab[] = [
    { id: "welcome", title: "Welcome & Onboarding", icon: Sparkles, color: "from-primary to-secondary" },
    { id: "quizzes", title: "Interactive Quizzes", icon: BrainCircuit, color: "from-secondary to-accent" },
    { id: "tournaments", title: "Leaderboards & Tournaments", icon: Trophy, color: "from-accent to-primary" },
    { id: "drive", title: "Google Drive Materials", icon: FolderOpen, color: "from-primary to-accent" },
    { id: "ai", title: "AI Assistant (Explo & Workspace)", icon: Zap, color: "from-secondary to-primary" },
    { id: "profile", title: "Dashboard & Achievements", icon: User, color: "from-accent to-secondary" },
  ]

  const faqs = [
    {
      q: "Why didn't my score update on the tournament leaderboard?",
      a: "Only your first attempt on any quiz counts toward the tournament leaderboard. This prevent score inflation from users retaking the same quiz to get higher scores. Retakes will update your personal progress history and dashboard stats, but they will not change your competitive ranking."
    },
    {
      q: "How does the time bonus affect my score?",
      a: "Choosing a shorter time limit awards a higher time bonus (up to +5 points for a 1-minute challenge). However, running out of time before completing the quiz results in a 'Timed Out' status, which awards a slightly lower completion bonus (+1.5 points instead of +2.0 points for full completion)."
    },
    {
      q: "How do I access Google Drive files if it says unauthorized?",
      a: "Make sure you log in to your account first. The Google Drive page is a protected route. If access tokens expire, our system automatically runs a token refresh cycle behind the scenes. Simply reload the page or click 'Re-authenticate' in the admin panel if the issue persists."
    },
    {
      q: "Can Explo scan Arabic documents and images?",
      a: "Yes! Explo is a bilingual assistant built specifically for FCDS students. It supports Arabic and English questions. You can upload images of study material, assignments, or handwritten notes, and Explo will use Google Gemini to analyze and answer questions based on the visual content."
    },
    {
      q: "What files can I upload to Workspace AI?",
      a: "Workspace AI supports .pdf, .docx, .txt, .md, .csv, and standard images. It processes documents on the fly to help you summarize chapters, ask deep questions, and even generate practice quizzes based directly on your study materials."
    }
  ]

  const specializations = [
    { name: "Computing and Data Sciences", code: "CDS", desc: "Core computer science algorithms, mathematical principles, data mining, and database engineering." },
    { name: "Cybersecurity", code: "CYS", desc: "Digital security architectures, ethical hacking, cryptography, digital forensics, and network defense." },
    { name: "Intelligent Systems", code: "AI", desc: "Machine learning engineering, deep learning neural networks, robotics, and automation logic." },
    { name: "Media Analytics", code: "MA", desc: "Full-stack web applications, frontend design architectures, software development methodologies, and user interfaces." },
    { name: "Business Analytics", code: "BA", desc: "Data-driven business decisions, marketing structures, financial metrics, and executive strategies." },
    { name: "Healthcare Informatics", code: "HI", desc: "Medical data management systems, clinical computing architectures, and technology-driven patient care." }
  ]

  return (
    <div className="min-h-screen relative overflow-hidden font-rubik">
      {/* Dynamic Theme Glow Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "12s" }} />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.03]"
          style={{ backgroundImage: "url(/images/Background.png)" }}
        />
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Page Header */}
        <div className="text-center mb-12 mt-8">
          <ScrollAnimatedSection animation="slideUp">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border/40 backdrop-blur-md mb-4 hover:scale-[1.03] transition-all">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs md:text-sm text-foreground/80 font-medium">Interactive User Manual</span>
            </div>
          </ScrollAnimatedSection>

          <ScrollAnimatedSection animation="slideUp" delay={0.15}>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              How to Use{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Chameleon FCDS
              </span>
            </h1>
          </ScrollAnimatedSection>

          <ScrollAnimatedSection animation="slideUp" delay={0.3}>
            <p className="text-sm md:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
              Your ultimate companion to navigate courses, conquer quiz challenges, track competitive leaderboard rankings, and leverage cutting-edge AI assistants.
            </p>
          </ScrollAnimatedSection>
        </div>

        {/* Desktop Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left Sidebar Navigation */}
          <div className="lg:col-span-4 sticky top-24 z-20">
            <ScrollAnimatedSection animation="slideInFromLeft" duration={0.6}>
              <Card className="bg-card/40 border-border/40 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden">
                <div className="p-4 md:p-6 border-b border-border/40 bg-muted/20">
                  <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
                    <Layers className="w-5 h-5 text-primary" />
                    Guide Navigation
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Select a topic to read instructions</p>
                </div>
                <div className="p-3 space-y-1">
                  {tabs.map((tab) => {
                    const TabIcon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 group ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/10 font-semibold"
                            : "hover:bg-muted/50 text-foreground/75 hover:text-foreground"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg transition-colors ${
                          isActive ? "bg-primary-foreground/20 text-primary-foreground" : `bg-muted text-foreground`
                        }`}>
                          <TabIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm flex-1">{tab.title}</span>
                        <ArrowRight className={`w-4 h-4 transition-transform duration-200 ${
                          isActive ? "translate-x-1 opacity-100" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                        }`} />
                      </button>
                    )
                  })}
                </div>
              </Card>
            </ScrollAnimatedSection>
          </div>

          {/* Right Main Content Panel */}
          <div className="lg:col-span-8">
            <Card className="bg-card/25 border-border/30 backdrop-blur-lg shadow-2xl rounded-3xl min-h-[500px] overflow-hidden">
              <div className="p-6 md:p-8">
                {/* WELCOME TAB */}
                {activeTab === "welcome" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Welcome to Chameleon FCDS</h2>
                        <p className="text-xs text-muted-foreground">The digital learning ecosystem for FCDS students</p>
                      </div>
                    </div>

                    <p className="text-foreground/80 leading-relaxed font-rubik text-sm md:text-base">
                      Chameleon FCDS is a state-of-the-art educational platform built specifically for computing and data science undergraduates. We integrate learning modules, automated Google Drive lecture access, smart quizzes, competitive tournaments, and custom AI tools in a single unified interface.
                    </p>

                    <div className="grid md:grid-cols-2 gap-4 my-6">
                      <div className="p-4 bg-muted/30 border border-border/40 rounded-xl flex gap-3">
                        <div className="p-2 bg-primary/20 text-primary rounded-lg h-fit">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Create Profile</h4>
                          <p className="text-xs text-muted-foreground mt-1">Register using your credentials or sign in easily with Google OAuth.</p>
                        </div>
                      </div>

                      <div className="p-4 bg-muted/30 border border-border/40 rounded-xl flex gap-3">
                        <div className="p-2 bg-secondary/20 text-secondary rounded-lg h-fit">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">Choose Your Specialization</h4>
                          <p className="text-xs text-muted-foreground mt-1">Navigate specialized learning pathways corresponding to your FCDS departments.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary" />
                        FCDS Specialization Pathways
                      </h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        {specializations.map((spec) => (
                          <div key={spec.code} className="p-3.5 border border-border/30 rounded-xl bg-muted/10 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-semibold text-xs tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">{spec.code}</span>
                              <span className="text-[10px] text-muted-foreground">FCDS Dep.</span>
                            </div>
                            <h4 className="text-sm font-bold text-foreground mb-1">{spec.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{spec.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* QUIZZES TAB */}
                {activeTab === "quizzes" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-secondary to-accent text-primary-foreground">
                        <BrainCircuit className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Interactive Quiz System</h2>
                        <p className="text-xs text-muted-foreground">Train your coding and analytical skills</p>
                      </div>
                    </div>

                    <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                      Test your academic knowledge with 140+ quizzes spanning Level 1 and Level 2 topics. Earn tournament points by answering questions and adapting your strategies.
                    </p>

                    <div className="space-y-4">
                      <h3 className="font-bold text-base flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Quiz Modes & Time Options
                      </h3>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 border border-border/40 rounded-2xl bg-muted/10 space-y-2">
                          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Instant Feedback Mode
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            See correct answers immediately after each question submission. Helpful for learning. Awards a **+1.5 points** bonus at completion.
                          </p>
                        </div>

                        <div className="p-4 border border-border/40 rounded-2xl bg-muted/10 space-y-2">
                          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            Traditional Mode
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Submit the whole quiz before checking your final score and review. Harder format. Awards a **+1.2 points** bonus.
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-muted/20 border border-border/40 rounded-2xl space-y-3">
                        <h4 className="font-bold text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          Time Constraints Bonuses
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Selecting shorter time limits adds a high intensity bonus. Ensure you submit before the clock expires!
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">
                            <div className="font-bold text-primary">1 Min</div>
                            <div className="text-[10px] text-muted-foreground">+5.0 Pts</div>
                          </div>
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">
                            <div className="font-bold text-primary">5 Min</div>
                            <div className="text-[10px] text-muted-foreground">+4.5 Pts</div>
                          </div>
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">
                            <div className="font-bold text-primary">15 Min</div>
                            <div className="text-[10px] text-muted-foreground">+4.0 Pts</div>
                          </div>
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">
                            <div className="font-bold text-primary">30 Min</div>
                            <div className="text-[10px] text-muted-foreground">+3.5 Pts</div>
                          </div>
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">
                            <div className="font-bold text-primary">60 Min</div>
                            <div className="text-[10px] text-muted-foreground">+3.0 Pts</div>
                          </div>
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">
                            <div className="font-bold text-primary">Unlimited</div>
                            <div className="text-[10px] text-muted-foreground">+2.5 Pts</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Calculator Widget */}
                    <div className="mt-8 p-6 bg-gradient-to-br from-primary/10 to-secondary/15 rounded-3xl border border-primary/20 space-y-4">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-primary animate-bounce" />
                        <h3 className="font-bold text-base text-foreground">Interactive Points Calculator</h3>
                        <Badge className="bg-primary/20 text-primary border border-primary/30 text-[10px]">Real-Time Simulator</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Calculate potential Tournament points. Points formula: `(Correct Answers + Duration + Mode + Completion) / 10`.
                      </p>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-foreground/80 block mb-1">Correct Answers ({correctAnswers})</label>
                            <input
                              type="range"
                              min="0"
                              max="30"
                              value={correctAnswers}
                              onChange={(e) => setCorrectAnswers(Number(e.target.value))}
                              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-foreground/80 block mb-1">Quiz Duration</label>
                            <select
                              value={selectedDuration}
                              onChange={(e) => setSelectedDuration(e.target.value)}
                              className="w-full bg-card/50 border border-border/40 text-xs rounded-lg p-2.5 outline-none text-foreground focus:ring-1 focus:ring-primary"
                            >
                              <option value="1">1 Minute Challenge (+5.0)</option>
                              <option value="5">5 Minutes Speed Test (+4.5)</option>
                              <option value="15">15 Minutes Balanced (+4.0)</option>
                              <option value="30">30 Minutes Thorough (+3.5)</option>
                              <option value="60">60 Minutes Deep Dive (+3.0)</option>
                              <option value="unlimited">Unlimited Mode (+2.5)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-semibold text-foreground/80 block mb-1">Quiz Mode</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setSelectedMode("traditional")}
                                className={`text-xs py-2 border rounded-lg transition-colors ${
                                  selectedMode === "traditional"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card/40 border-border/40 hover:bg-muted text-foreground"
                                }`}
                              >
                                Traditional (+1.2)
                              </button>
                              <button
                                onClick={() => setSelectedMode("instant")}
                                className={`text-xs py-2 border rounded-lg transition-colors ${
                                  selectedMode === "instant"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card/40 border-border/40 hover:bg-muted text-foreground"
                                }`}
                              >
                                Instant (+1.5)
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-foreground/80 block mb-1">Completion Status</label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => setSelectedCompletion("completed")}
                                className={`text-xs py-2 border rounded-lg transition-colors ${
                                  selectedCompletion === "completed"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card/40 border-border/40 hover:bg-muted text-foreground"
                                }`}
                              >
                                Completed (+2.0)
                              </button>
                              <button
                                onClick={() => setSelectedCompletion("timeout")}
                                className={`text-xs py-2 border rounded-lg transition-colors ${
                                  selectedCompletion === "timeout"
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-card/40 border-border/40 hover:bg-muted text-foreground"
                                }`}
                              >
                                Timed Out (+1.5)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border border-primary/20 rounded-2xl bg-card/60 flex items-center justify-between shadow-inner">
                        <div className="text-xs font-semibold text-muted-foreground">Estimated Tournament Points</div>
                        <div className="text-3xl font-black text-primary tracking-tight font-mono">{calculatedPoints}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TOURNAMENTS TAB */}
                {activeTab === "tournaments" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-accent to-primary text-primary-foreground">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Leaderboards & Tournaments</h2>
                        <p className="text-xs text-muted-foreground">Compete against your peers in real-time championships</p>
                      </div>
                    </div>

                    <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                      Join FCDS championships, test your skills, and earn rewards based on scoring, streaks, and engagement. The current tournament period runs from **October 11, 2025** to **January 11, 2026**.
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 border border-border/40 rounded-2xl bg-muted/10 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                          Fair-Play Guard System
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          To maintain competition integrity, **only your first attempt** on any quiz adds tournament points to the leaderboards. Retakes can improve your level badge and personal score stats, but your initial attempt score is locked for the competitive rank.
                        </p>
                      </div>

                      <div className="p-4 border border-border/40 rounded-2xl bg-muted/10 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" />
                          Competitive Leaderboards
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          The leaderboard system keeps separate records for **Level 1** and **Level 2** users. Complete Level 1 milestones to unlock higher Level 2 challenges. Use filters on the Tournament page to toggle between top 10 users and your personal relative ranking position.
                        </p>
                      </div>

                      <div className="p-5 border border-primary/20 bg-primary/5 rounded-3xl space-y-3">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-primary" />
                          Tournament Rewards
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs p-2.5 border-b border-border/30">
                            <span className="font-medium text-foreground/85 flex items-center gap-1.5">
                              🥇 1st Place Champion
                            </span>
                            <Badge className="bg-primary text-primary-foreground font-semibold">Chameleon Ultimate Hoodie</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs p-2.5 border-b border-border/30">
                            <span className="font-medium text-foreground/85 flex items-center gap-1.5">
                              🔥 3-Time Streak Winner
                            </span>
                            <Badge className="bg-secondary text-primary-foreground font-semibold">1,000 L.E Cash Prize</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs p-2.5">
                            <span className="font-medium text-foreground/85 flex items-center gap-1.5">
                              🎫 Full Participation
                            </span>
                            <Badge className="bg-accent text-primary-foreground font-semibold">Admin Panel Access Privilege</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* DRIVE TAB */}
                {activeTab === "drive" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Google Drive Integration</h2>
                        <p className="text-xs text-muted-foreground">Access your lecture slide decks and files seamlessly</p>
                      </div>
                    </div>

                    <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                      Access all department slides, sheets, and assignments securely. Our system maps Google Drive structures to folders in a user-friendly browser format.
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 border border-border/40 rounded-2xl bg-muted/10 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Database className="w-4 h-4 text-primary" />
                          Secure Time-Limited Tokens
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          For file safety, download and viewing URLs use secure Google Cloud API keys with temporary time windows. If a download fails, reloading the browser regenerates a fresh signature token automatically.
                        </p>
                      </div>

                      <div className="p-4 border border-border/40 rounded-2xl bg-muted/10 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          OAuth 2.0 Credentials
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your profile authentication credentials links directly to the files. An automated cron background worker runs every 30 minutes to clean and refresh Google access permissions, preserving active sessions.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI TAB */}
                {activeTab === "ai" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">AI Assistant Suite</h2>
                        <p className="text-xs text-muted-foreground">Leverage Explo Chatbot and Workspace AI</p>
                      </div>
                    </div>

                    <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                      Chameleon FCDS features deep AI tools to support students 24/7. These tools are built using Google Gemini and custom retrieval models (RAG).
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 border border-primary/20 rounded-2xl bg-primary/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-primary flex items-center gap-1.5">
                            <BrainCircuit className="w-4 h-4 text-primary" />
                            1. EXPLO Chatbot (/explo)
                          </h4>
                          <Badge className="bg-primary/20 text-primary text-[10px]">Bilingual & Interactive</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Explo is the official campus assistant. Chat in Arabic or English to query courses, available internships, college FAQ, and university grants.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-center text-[10px] text-foreground font-semibold">
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">🗣️ Speech-to-Text Input</div>
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">📷 Image Attachment Scans</div>
                        </div>
                      </div>

                      <div className="p-4 border border-secondary/20 rounded-2xl bg-secondary/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-secondary flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-secondary" />
                            2. Workspace AI (/ai)
                          </h4>
                          <Badge className="bg-secondary/20 text-secondary text-[10px]">Document Intelligence</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your private study assistant. Upload lecture files (.pdf, .docx, .txt, .csv) or scan equations to get summaries, answers, and auto-generated quizzes instantly.
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] text-foreground font-semibold">
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">📚 RAG Document Search</div>
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">📝 Auto Quiz Maker</div>
                          <div className="p-2 border border-border/20 rounded-lg bg-card/40">📂 File Summarizer</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PROFILE TAB */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                      <div className="p-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-primary-foreground">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">Dashboard & Achievements</h2>
                        <p className="text-xs text-muted-foreground">Manage your settings and collect academic rewards</p>
                      </div>
                    </div>

                    <p className="text-foreground/80 leading-relaxed text-sm md:text-base">
                      Your personalized Dashboard monitors your progress, quiz history, first attempt percentages, level status, and certificates.
                    </p>

                    <div className="space-y-4">
                      <div className="p-4 border border-border/40 rounded-2xl bg-muted/10 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Award className="w-4 h-4 text-primary" />
                          Academic Certifications
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Completing all required quizzes for a specialization unlocks prestigious completion certificates. Earning these badges showcases your dedication and validates your skills for portfolios.
                        </p>
                      </div>

                      <div className="p-4 border border-border/40 rounded-2xl bg-muted/10 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary" />
                          Student Level Distribution
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Your profile shows your current learning level (Level 1, Level 2). View real-time charts illustrating enrollment across FCDS departments on your profile page to see how you rank against fellow students.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <ScrollAnimatedSection animation="slideUp" className="max-w-4xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold flex items-center justify-center gap-2 text-foreground">
              <HelpCircle className="w-6 h-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">Troubleshoot your problems and learn more</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = expandedFaq === index
              return (
                <Card
                  key={index}
                  className="bg-card/30 border-border/40 backdrop-blur-md overflow-hidden rounded-xl"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full p-4 md:p-5 flex items-center justify-between text-left font-semibold text-sm md:text-base text-foreground/90 hover:text-primary transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`} />
                  </button>
                  <div className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[300px] border-t border-border/30 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                  }`}>
                    <div className="p-4 md:p-5 bg-muted/10 text-xs md:text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </ScrollAnimatedSection>

        {/* Dynamic Theme Banner */}
        <ScrollAnimatedSection animation="slideUp" className="max-w-4xl mx-auto text-center mb-16">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
            <h3 className="text-xl md:text-2xl font-bold mb-3">Theme Adaptive Styling</h3>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto mb-6">
              This manual page is fully integrated with your current appearance settings. Use the theme selector dropdown in the navigation header to test dark/light modes and select any color palette.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => document.getElementById("welcome")?.scrollIntoView({ behavior: "smooth" })}
                className="bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/25 transition-all rounded-xl text-xs px-5"
              >
                Back to Top
              </Button>
            </div>
          </Card>
        </ScrollAnimatedSection>
      </div>
    </div>
  )
}
