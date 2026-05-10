"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import ScrollAnimatedSection from "@/components/scroll-animated-section"
import Script from "next/script"
import {
  Check,
  ArrowRight,
  Star,
  Brain,
  Shield,
  Cloud,
  Database,
  Hospital,
  BookOpen,
  Award,
  BookOpenCheck,
  Users,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Globe,
  TrendingUp,
  Sun,
  Moon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import MagicSearch from "@/components/magic-search"
import CountUp from "@/components/CountUp"
import { getStudentSession } from "@/lib/auth"
import { formatTAName } from "@/lib/ta-utils"
import Image from "next/image"
import AdBanner from "@/components/AdBanner"
import LottieAnimation from "@/components/lottie-animation"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useTheme } from "next-themes"

import HeroGeometric from "@/components/hero-geometric"

interface LevelStat {
  level: number
  count: number
}

interface UserStats {
  totalUsers: number
  levels: LevelStat[]
  timestamp: string
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState<string>("")
  const [userLevel, setUserLevel] = useState<number>(1)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [key, setKey] = useState(0)
  const [quizCount, setQuizCount] = useState<number | null>(null)
  const [solvedQuizzes, setSolvedQuizzes] = useState<number | null>(null)
  const { setTheme, theme } = useTheme()

  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 500], [0, 200])
  const y2 = useTransform(scrollY, [0, 500], [0, -150])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const scale = useTransform(scrollY, [0, 400], [1, 0.9])

  useEffect(() => {
    setMounted(true)
    const loadSession = async () => {
      const session = await getStudentSession()
      if (session) {
        setUsername(session.username)
        setUserLevel(session.current_level || 1)
      }
    }
    loadSession()
  }, [])

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/stats/users')
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
        setKey(prev => prev + 1)
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setIsLoadingStats(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchUserStats()
  }

  useEffect(() => {
    fetchUserStats()
    const fetchQuizStats = async () => {
      try {
        const response = await fetch('/api/stats/quizzes')
        if (response.ok) {
          const data = await response.json()
          setQuizCount(data.totalQuizzes)
          setSolvedQuizzes(data.solvedQuizzes + 30000)
        }
      } catch (error) {
        setQuizCount(140)
        setSolvedQuizzes(30000)
      }
    }
    fetchQuizStats()
  }, [])

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const specializations = [
    {
      id: "computing-data-sciences",
      icon: Cloud,
      title: "Computing and Data Sciences",
      description: "Comprehensive foundational courses covering essential academic subjects and critical thinking skills.",
      courses: 45,
      students: "+2k students getting enrolled",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      glowColor: "rgba(59, 130, 246, 0.6)",
    },
    {
      id: "cybersecurity",
      icon: Shield,
      title: "Cyber Security",
      description: "Advanced security protocols, ethical hacking, and digital forensics to protect digital assets.",
      courses: 32,
      students: "+1.8k students getting enrolled",
      color: "bg-red-500/10 text-red-400 border-red-500/20",
      glowColor: "rgba(239, 68, 68, 0.6)",
    },
    {
      id: "artificial-intelligence",
      icon: Brain,
      title: "Artificial Intelligence",
      description: "Machine learning, neural networks, and AI development for the future of technology.",
      courses: 28,
      students: "+2.0k students getting enrolled",
      color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      glowColor: "rgba(168, 85, 247, 0.6)",
    },
    {
      id: "media-analytics",
      icon: BookOpen,
      title: "Media Analytics",
      description: "Full-stack development, programming languages, and modern software engineering practices.",
      courses: 52,
      students: "+300 students getting enrolled",
      color: "bg-green-500/10 text-green-400 border-green-500/20",
      glowColor: "rgba(34, 197, 94, 0.6)",
    },
    {
      id: "business-analytics",
      icon: Database,
      title: "Business Analytics",
      description: "Management, finance, marketing, and entrepreneurship for modern business growth.",
      courses: 24,
      students: "400+ students getting enrolled",
      color: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      glowColor: "rgba(249, 115, 22, 0.6)",
    },
    {
      id: "healthcare-informatics",
      icon: Hospital,
      title: "Healthcare Informatics",
      description: "Global politics, diplomacy, and international affairs for comprehensive understanding.",
      courses: 18,
      students: "+200 students getting enrolled",
      color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
      glowColor: "rgba(236, 72, 153, 0.6)",
    },
  ]

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden w-full relative">
      <main className="flex-1">

        {/* Hero Section */}
        <section className="w-full relative overflow-hidden">
          <div className="relative z-10">
            <HeroGeometric badge="Chameleon FCDS" title1="Master Your" title2="Future Skills" />
          </div>

          <div className="container mx-auto px-4 md:px-6 relative -mt-20 md:-mt-32 lg:-mt-40 z-20">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative mx-auto max-w-5xl"
            >
              {/* <div className="text-center mb-8">
                <p className="text-sm md:text-base text-muted-foreground/70 font-mono">
                  Powered by <span className="text-primary font-semibold">Levi Ackerman</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 mb-20 z-20 relative">
                  <Link href="/specialization">
                      <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-lg shadow-primary/20">
                      Start Learning Today
                      <ArrowRight className="ml-2 size-4" />
                      </Button>
                  </Link>
                  <Link href="/specialization">
                      <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base bg-background/50 backdrop-blur-sm">
                      View All Courses
                      </Button>
                  </Link>
                </div>
              </div> */}
              
              <div className="rounded-xl shadow-2xl border border-border/40 bg-gradient-to-b from-background to-muted/40 backdrop-blur-xl md:backdrop-blur-3xl min-h-[400px] flex flex-col items-center justify-center relative mt-16 p-8">
                 {/* Internal element to stand in for image */}
                 <div className="absolute inset-0 rounded-xl overflow-hidden bg-gradient-to-tr from-transparent via-primary/5 to-transparent pointer-events-none"></div>
                 
                 <div className="z-10 flex flex-col items-center w-full max-w-2xl space-y-8 relative">
                    <div className="text-center space-y-4">
                        <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-widest mb-2">
                           Global Search
                        </Badge>
                        <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter">
                           Find anything in seconds
                        </h3>
                        <p className="text-muted-foreground md:text-lg">
                           Instantly navigate through massive knowledge domains, student records, and complex routing paths.
                        </p>
                    </div>
                    <div className="w-full flex justify-center">
                        <MagicSearch />
                    </div>
                 </div>

                 <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/10 dark:ring-white/10 pointer-events-none"></div>
              </div>
              <div className="absolute -bottom-10 -right-10 z-[999] pointer-events-none h-[300px] w-[300px] rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-2xl md:blur-3xl opacity-70"></div>
              <div className="absolute -top-10 -left-10 z-[999] pointer-events-none h-[300px] w-[300px] rounded-full bg-gradient-to-br from-secondary/30 to-primary/30 blur-2xl md:blur-3xl opacity-70"></div>
            </motion.div>
          </div>
        </section>

                {/* New Creative: Future Vision Section */}
        <section className="w-full py-24 md:py-40 bg-background dark:bg-black relative overflow-hidden transition-colors duration-500">
           {/* Cinematic Background Mesh */}
           <div className="absolute inset-0 -z-10 overflow-hidden">
             <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
             <div className="absolute inset-0 bg-[radial-gradient(#00000010_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:32px_32px] opacity-40"></div>
           </div>

           <div className="container mx-auto px-4 md:px-6 relative">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                <div className="lg:col-span-7 space-y-10 order-2 lg:order-1 text-left relative z-10">
                   <div className="space-y-6">
                      <div className="flex items-center justify-between gap-4 mb-4">
                         <Badge variant="outline" className="rounded-full px-6 py-2 border-primary/30 bg-primary/5 text-primary text-sm font-black uppercase tracking-[0.3em] backdrop-blur-md">
                            Futuristic Vision
                         </Badge>
                      </div>
                      <h2 className="text-5xl md:text-6xl lg:text-7xl font-black italic tracking-tighter leading-[0.8] uppercase text-black dark:text-white">
                        Shaping The <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-[0_0_30px_rgba(var(--primary),0.5)]">Future</span> <br/>
                        <span style={{ WebkitTextStroke: '1.2px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000 dark:border-white/10 border-black/10">Of Learning</span>
                      </h2>
                      <p className="text-xl md:text-2xl text-muted-foreground/80 max-w-xl leading-relaxed font-light italic">
                        An immersive educational ecosystem designed to bridge the gap between academic theory and global industry mastery.
                      </p>
                   </div>
                   
                   <div className="flex flex-wrap gap-6 pt-6">
                      <Button size="lg" className="rounded-full h-14 px-10 text-lg shadow-xl shadow-primary/20 group">
                         Explore Our Vision
                         <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                      
                      <div className="flex items-center gap-4 px-6 border-l border-white/10">
                         <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                               <div key={i} className="size-10 rounded-full border-2 border-black bg-muted-foreground/20 overflow-hidden backdrop-blur-md">
                                  <Image src={`https://i.pravatar.cc/100?u=${i}`} width={40} height={40} alt="user" />
                               </div>
                            ))}
                         </div>
                         <div className="text-sm font-medium text-muted-foreground">
                            Joined by <span className="text-black dark:text-white font-bold">+20k</span> students
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-5 relative order-1 lg:order-2 flex justify-center lg:justify-end">
                   {/* Cinematic Lottie Portal */}
                   <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center group">
                      <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse group-hover:bg-primary/30 transition-all duration-700"></div>
                      
                      {/* Floating HUD elements */}
                      <div className="absolute top-0 right-0 p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-float z-20 hidden md:block">
                         <div className="flex items-center gap-3">
                            <div className="size-3 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-black tracking-widest uppercase opacity-70">Core Protocol Active</span>
                         </div>
                      </div>
                      
                      <div className="w-full h-full flex items-center justify-center overflow-visible">
                         <LottieAnimation 
                           src="/images/XBJe1gGgJo.lottie"
                           className="w-full h-full scale-110 md:scale-125 drop-shadow-[0_0_50px_rgba(var(--primary),0.2)]"
                           width="450px"
                           height="450px"
                         />
                      </div>
                   </div>
                </div>
             </div>
           </div>
        </section>

        {/* Specializations Section (How It Works) */}
        <ScrollAnimatedSection animation="fadeIn" className="w-full py-20 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_40%,transparent_100%)]"></div>

          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                Specializations
              </Badge>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-[0.8] uppercase">
                {username ? (
                  <>
                    <span className="text-primary">{formatTAName(username, userLevel).split(' ')[0]}</span><br/>
                    <span style={{ WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000">Learning Path</span>
                  </>
                ) : (
                  <>
                    Choose Your <br/>
                    <span style={{ WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000">Adventure</span>
                  </>
                )}
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                 Transform your skills systematically across massive knowledge domains. Look into our active routes.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
              {specializations.map((spec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Link href={`/specialization/${spec.id}`}>
                    <div 
                      className="group relative h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-2 hover:scale-[1.03]"
                      onMouseMove={(e) => {
                        const target = e.currentTarget;
                        requestAnimationFrame(() => {
                          const rect = target.getBoundingClientRect();
                          target.style.setProperty("--x", `${e.clientX - rect.left}px`);
                          target.style.setProperty("--y", `${e.clientY - rect.top}px`);
                        });
                      }}
                    >
                      {/* High-performance masked border spotlight */}
                      <div 
                        className="absolute -inset-[1.5px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none will-change-[mask-image,opacity]"
                        style={{
                          background: `radial-gradient(350px circle at var(--x) var(--y), ${spec.glowColor}, transparent 80%)`,
                          WebkitMaskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                          maskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                          padding: '1.5px',
                        }}
                      />
                      
                      <Card className="relative h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-colors duration-500 group-hover:bg-muted/20">
                          <CardHeader>
                              <div className={`inline-flex items-center justify-center size-12 rounded-lg border ${spec.color} mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                  <spec.icon className="w-6 h-6" />
                              </div>
                              <CardTitle className="text-xl mb-2">{spec.title}</CardTitle>
                              <CardDescription className="text-muted-foreground">{spec.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                              <div className="flex items-center justify-between mb-4">
                                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                      <span className="flex items-center gap-1.5"><BookOpen className="size-4 text-primary"/> {spec.courses} Courses Validated</span>
                                      <span className="flex items-center gap-1.5"><Users className="size-4 text-secondary"/> {spec.students}</span>
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollAnimatedSection>

        {/* New Creative: Core Innovation Section */}
        <section className="w-full py-24 md:py-32 relative overflow-hidden bg-background">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-4 mb-16">
              <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-widest">
                Academic Excellence
              </Badge>
              <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-[0.8] uppercase">
                Master Your <br/>
                <span style={{ WebkitTextStroke: '1.2px rgba(var(--primary),0.3)' }} className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Curriculum</span>
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                A comprehensive educational ecosystem designed to streamline your learning journey and boost academic performance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: BookOpenCheck,
                  title: "Smart Quizzes",
                  description: "AI-powered assessments that adapt to your learning pace and identify knowledge gaps.",
                  color: "text-blue-500",
                  bg: "bg-blue-500/10 border-blue-500/20",
                },
                {
                  icon: Brain,
                  title: "AI Assistant",
                  description: "Get instant answers to your academic questions with our intelligent chatbot.",
                  color: "text-purple-500",
                  bg: "bg-purple-500/10 border-purple-500/20",
                },
                {
                  icon: Cloud,
                  title: "Cloud Materials",
                  description: "Access study materials, lectures, and resources from anywhere, anytime.",
                  color: "text-green-500",
                  bg: "bg-green-500/10 border-green-500/20",
                },
                {
                  icon: Award,
                  title: "Certifications",
                  description: "Earn recognized certificates as you complete courses and pass assessments.",
                  color: "text-orange-500",
                  bg: "bg-orange-500/10 border-orange-500/20",
                },
                {
                  icon: Shield,
                  title: "Secure Platform",
                  description: "Your data is protected with enterprise-grade security and encryption.",
                  color: "text-red-500",
                  bg: "bg-red-500/10 border-red-500/20",
                },
                {
                  icon: TrendingUp,
                  title: "Progress Tracking",
                  description: "Monitor your growth with detailed analytics and performance insights.",
                  color: "text-cyan-500",
                  bg: "bg-cyan-500/10 border-cyan-500/20",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <Card className={`h-full border ${feature.bg} bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group`}>
                    <CardHeader>
                      <div className={`inline-flex items-center justify-center size-12 rounded-lg border ${feature.bg} ${feature.color} mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        <ScrollAnimatedSection animation="slideInFromBottom" className="w-full py-20 md:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black italic tracking-tighter leading-[0.8] uppercase">
                Frequently Asked <br/>
                <span style={{ WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000">Questions</span>
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                Find answers to common questions about our platform.
              </p>
            </div>

            <div className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    question: "How does the grading system work?",
                    answer: "You are given immediate feedback upon finishing a quiz. All data is synchronized seamlessly securely across our network to determine your final level."
                  },
                  {
                    question: "Can I switch specializations?",
                    answer: "Yes, you have the flexibility to explore different domains and specializations at any point through the portal."
                  },
                  {
                    question: "Is there a limit to how many courses I can take?",
                    answer: "No limits! Chameleon encourages continuous exploration up to level completion."
                  }
                ].map((faq, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <AccordionItem value={`item-${i}`} className="border-b border-border/40 py-2">
                      <AccordionTrigger className="text-left font-medium hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </div>
          </div>
        </ScrollAnimatedSection>

        {/* CTA Section */}
        <ScrollAnimatedSection animation="scaleIn" className="w-full py-20 md:py-32 bg-background text-foreground border-y border-border/40 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px] md:blur-[150px] pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/20 rounded-full blur-[100px] md:blur-[150px] pointer-events-none"></div>

          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black italic tracking-tighter">
                Ready to Join Chameleon?
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Join thousands of satisfied students who have streamlined their learning paths and boosted productivity with our robust platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <Link href="/specialization">
                    <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 text-base">
                    Start Exploring
                    <ArrowRight className="ml-2 size-4" />
                    </Button>
                </Link>
              </div>
            </div>
          </div>
        </ScrollAnimatedSection>

      </main>

      {/* Footer */}
      <footer className="w-full py-12 border-t border-border bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-4 space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center md:text-left">
              <div>
                <div className="text-2xl font-black italic tracking-tighter text-foreground/80 rock-salt mb-2">Chameleon<span className="text-primary text-xl">.</span></div>
                <p className="text-muted-foreground text-sm max-w-xs">
                    Empowering learners worldwide with cutting-edge education.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground/70 mb-3">Platform</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/specialization" className="hover:text-foreground transition-colors">Specializations</Link></li>
                  <li><Link href="/youtube" className="hover:text-foreground transition-colors">YouTube</Link></li>
                  <li><Link href="/store" className="hover:text-foreground transition-colors">Store</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground/70 mb-3">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                  <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground/70 mb-3">Connect</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="mailto:tokyo9900777@gmail.com" className="hover:text-foreground transition-colors">Contact Us</a></li>
                  <li><a href="https://youtube.com/@ChameleonFCDS" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">YouTube Channel</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-border/40 pt-8 text-xs text-muted-foreground text-center">
                &copy; {new Date().getFullYear()} Chameleon FCDS. All rights reserved.
            </div>
        </div>
      </footer>
    </div>
  )
}
