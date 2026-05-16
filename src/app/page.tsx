"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"

const ScrollAnimatedSection = dynamic(() => import("@/components/scroll-animated-section"), { ssr: true })
// Lottie animation removed from homepage for performance; use static fallback instead
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
// MagicSearch removed — replaced by a themed chameleon image below
import { getStudentSession } from "@/lib/auth"
import { formatTAName } from "@/lib/ta-utils"
import Image from "next/image"
import HeroGeometric from "@/components/hero-geometric"
import { Pacifico } from "next/font/google";

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
  display: "swap",
})

export default function HomePage() {
  const [username, setUsername] = useState<string>("")
  const [userLevel, setUserLevel] = useState<number>(1)

  useEffect(() => {
    const loadSession = async () => {
      const session = await getStudentSession()
      if (session) {
        setUsername(session.username)
        setUserLevel(session.current_level || 1)
      }
    }
    loadSession()
  }, [])

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
  ];

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden w-full relative">
      <main className="flex-1">

        {/* Hero Section */}
        <section className="w-full relative overflow-hidden">
          <HeroGeometric badge="Chameleon FCDS" title1="Master Your" title2="Future Skills">
            <div className="flex flex-col items-center w-full max-w-5xl">
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 z-20 relative">
                <Link href="/specialization">
                    <Button size="lg" className="rounded-full h-12 px-8 text-base shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow">
                    Start Learning Today
                    <ArrowRight className="ml-2 size-4" />
                    </Button>
                </Link>
                <Link href="/specialization">
                    <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5 transition-colors">
                    View All Courses
                    </Button>
                </Link>
              </div>
              
              <div className="rounded-2xl shadow-2xl border border-white/10 dark:border-white/5 backdrop-blur-xl md:backdrop-blur-3xl flex items-center justify-center relative p-2 md:p-4 bg-white/5 dark:bg-black/5 w-full transform hover:scale-[1.01] transition-transform duration-500">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 rounded-3xl blur-xl opacity-50 -z-10 animate-pulse"></div>
                <div className="inline-block rounded-xl overflow-hidden bg-gradient-to-r from-primary to-secondary w-full relative">
                  <Image src="/images/new_chameleom.png" alt="Chameleon" width={1200} height={720} className="block w-full h-auto object-cover rounded-xl" priority />
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl pointer-events-none"></div>
                </div>
              </div>
            </div>
          </HeroGeometric>
        </section>

        {/* New Creative: Future Vision Section */}
        <section className="w-full py-24 md:py-40 bg-background dark:bg-black relative overflow-hidden transition-colors duration-500">
           {/* Cinematic Background Mesh */}
           <div className="absolute inset-0 -z-10 overflow-hidden">
             <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
             <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-secondary/15 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
             <div className="absolute inset-0 bg-[radial-gradient(#00000015_1px,transparent_1px)] dark:bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-60"></div>
           </div>

           <div className="container mx-auto px-4 md:px-6 relative">
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6 space-y-10 order-2 lg:order-1 text-left relative z-10">
                   <div className="space-y-6">
                      <div className="flex items-center justify-start gap-4 mb-4">
                         <Badge variant="outline" className="rounded-full px-6 py-2 border-primary/30 bg-primary/5 text-primary text-sm font-black uppercase tracking-[0.3em] backdrop-blur-md">
                            Futuristic Vision
                         </Badge>
                      </div>
                      <h2 className="text-5xl md:text-6xl lg:text-7xl font-black italic tracking-tighter leading-[0.9] uppercase text-black dark:text-white">
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
                      
                      <div className="flex items-center gap-4 px-6 border-l border-border">
                         <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                               <div key={i} className="size-10 rounded-full border-2 border-background bg-muted-foreground/20 overflow-hidden backdrop-blur-md">
                                  <Image src={`https://i.pravatar.cc/100?u=${i}`} width={40} height={40} alt="user" />
                               </div>
                            ))}
                         </div>
                         <div className="text-sm font-medium text-muted-foreground">
                            Joined by <span className="text-foreground font-bold">+4k</span> students
                         </div>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-6 relative order-1 lg:order-2 flex justify-center lg:justify-end mt-10 lg:mt-0">
                   <div className="relative w-full max-w-[550px] aspect-square flex items-center justify-center group">
                      <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse group-hover:bg-primary/30 transition-all duration-700"></div>
                                            
                      {/* Floating Decorative Elements */}
                      <motion.div 
                        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} 
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-10 right-0 z-20 bg-background/80 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-xl flex items-center gap-4"
                      >
                         <div className="bg-green-500/20 p-3 rounded-full text-green-500"><Check className="w-5 h-5"/></div>
                         <div>
                            <p className="font-bold text-sm">Course Completed</p>
                            <p className="text-xs text-muted-foreground">Machine Learning 101</p>
                         </div>
                      </motion.div>

                      <motion.div 
                        animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }} 
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute bottom-10 left-0 z-20 bg-background/80 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-xl flex items-center gap-4"
                      >
                         <div className="bg-primary/20 p-3 rounded-full text-primary"><Star className="w-5 h-5"/></div>
                         <div>
                            <p className="font-bold text-sm">Achievement Unlocked</p>
                            <p className="text-xs text-muted-foreground">Top 5% Performer</p>
                         </div>
                      </motion.div>

                      <div className="w-full h-full flex items-center justify-center overflow-visible relative z-10">
                         <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-secondary/10 rounded-full blur-3xl -z-10"></div>
                         <Image
                           src="/images/elearning.png"
                           alt="E-Learning"
                           width={450}
                           height={450}
                           className="object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
              {specializations.map((spec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1, type: "spring", stiffness: 100 }}
                >
                  <Link href={`/specialization/${spec.id}`}>
                    <div 
                      className="group relative h-full transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-3"
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
                        className="absolute -inset-[2px] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none will-change-[mask-image,opacity]"
                        style={{
                          background: `radial-gradient(400px circle at var(--x) var(--y), ${spec.glowColor}, transparent 80%)`,
                          WebkitMaskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                          maskImage: `linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)`,
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                          padding: '2px',
                        }}
                      />
                      
                      <Card className="relative h-full overflow-hidden border border-border/50 bg-background/50 dark:bg-black/40 backdrop-blur-xl transition-all duration-500 group-hover:bg-background/80 dark:group-hover:bg-black/80 rounded-2xl group-hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:group-hover:shadow-[0_8px_30px_rgba(255,255,255,0.05)]">
                          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-${spec.color.split('-')[1]}-500/10 rounded-bl-full -z-10 transition-all duration-500 group-hover:scale-150`}></div>
                          <CardHeader className="relative z-10 pb-4">
                              <div className={`inline-flex items-center justify-center size-14 rounded-xl border ${spec.color} bg-background mb-5 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 shadow-sm`}>
                                  <spec.icon className="w-7 h-7" />
                              </div>
                              <CardTitle className="text-2xl mb-2 font-bold group-hover:text-primary transition-colors">{spec.title}</CardTitle>
                              <CardDescription className="text-muted-foreground text-sm leading-relaxed">{spec.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="relative z-10">
                              <div className="flex flex-col gap-3 text-sm font-medium mt-2">
                                  <div className="flex items-center gap-3 bg-muted/50 p-2.5 rounded-lg border border-border/50 group-hover:border-border transition-colors">
                                      <div className="bg-primary/10 p-1.5 rounded-md"><BookOpen className="size-4 text-primary"/></div>
                                      <span className="text-foreground/80">{spec.courses} Comprehensive Courses</span>
                                  </div>
                                  <div className="flex items-center gap-3 bg-muted/50 p-2.5 rounded-lg border border-border/50 group-hover:border-border transition-colors">
                                      <div className="bg-secondary/10 p-1.5 rounded-md"><Users className="size-4 text-secondary"/></div>
                                      <span className="text-foreground/80">{spec.students}</span>
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

        {/* Minimal & Creative Section: Master Your Curriculum */}
        <section className="w-full py-24 md:py-32 bg-background border-t border-border/20">
          <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
              <div className="space-y-4">
                <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-xs font-medium uppercase tracking-widest">
                  Ecosystem
                </Badge>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter leading-[0.9] uppercase" >
                  Master Your <span className="text-primary">Curriculum</span>
                </h2>
              </div>
              <p className="text-muted-foreground md:text-lg max-w-sm font-light leading-relaxed">
                A highly refined suite of tools designed to quietly boost your academic performance.
              </p>
            </div>

            <div className="flex flex-col border-t border-border/40">
              {[
                {
                  icon: BookOpenCheck,
                  title: "Smart Quizzes",
                  description: "Adaptive assessments that silently learn your pace.",
                  color: "text-blue-500",
                },
                {
                  icon: Brain,
                  title: "Neural Assistant",
                  description: "Your invisible 24/7 intelligent academic tutor.",
                  color: "text-purple-500",
                },
                {
                  icon: Cloud,
                  title: "Cloud Sync",
                  description: "All your materials, perfectly synced across devices.",
                  color: "text-green-500",
                },
                {
                  icon: TrendingUp,
                  title: "Hyper Analytics",
                  description: "Beautifully visualized data of your growth.",
                  color: "text-cyan-500",
                },
                {
                  icon: Shield,
                  title: "Fort Knox Security",
                  description: "Uncompromising privacy and data encryption.",
                  color: "text-red-500",
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <div className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 md:p-8 border-b border-border/40 hover:bg-muted/30 transition-colors duration-500 cursor-pointer overflow-hidden">
                    {/* Animated minimalist hover line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-500 origin-center"></div>
                    
                    <div className="flex items-center gap-6 md:gap-12 relative z-10">
                      <div className={`p-4 rounded-full bg-background border border-border/50 group-hover:border-primary/20 transition-colors duration-500 shadow-sm group-hover:shadow-md ${feature.color}`}>
                        <feature.icon className="w-6 h-6 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                          {feature.title}
                        </h3>
                        {/* The description smoothly fades in and slides right on desktop hover */}
                        <p className="text-muted-foreground mt-2 md:mt-0 md:absolute md:left-[350px] md:top-1/2 md:-translate-y-1/2 md:opacity-0 md:-translate-x-4 group-hover:md:opacity-100 group-hover:md:translate-x-0 transition-all duration-500 md:whitespace-nowrap">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center justify-center size-10 rounded-full border border-border group-hover:bg-primary group-hover:border-primary transition-colors duration-500 mt-4 md:mt-0">
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-hover:-rotate-45 transition-all duration-500" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>


        {/* FAQ Section */}
        <section className="w-full py-24 md:py-32 relative overflow-hidden bg-background">
          {/* Subtle background decoration */}
          <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none"></div>
          
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
              
              {/* Left Column: Sticky Header */}
              <div className="lg:col-span-5 lg:sticky lg:top-32 space-y-6">
                <Badge className="rounded-full px-5 py-2 text-sm font-black tracking-widest uppercase bg-primary/10 text-primary border-primary/20 backdrop-blur-md" variant="outline">
                  Got Questions?
                </Badge>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black italic tracking-tighter leading-[0.9] uppercase">
                  Frequently <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Asked</span> <br/>
                  <span style={{ WebkitTextStroke: '1px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000 dark:border-white/10 border-black/10">Questions</span>
                </h2>
                <p className="text-muted-foreground md:text-lg max-w-md leading-relaxed font-light">
                  Everything you need to know about Chameleon, our courses, and how we can help you master your future skills.
                </p>
                <div className="pt-4 flex items-center gap-4">
                   <div className="flex -space-x-4">
                      {[
                        "https://lh3.googleusercontent.com/a/ACg8ocLhwaGT2q706GW79FoYeUOLTnea_J16frk-iF_sdwVWXPFbRZHCuw=s96-c",
                        "https://lh3.googleusercontent.com/a/ACg8ocI87mLGlaw-BeaMHVCw0E31dK079PSDmVZGr6euDHZVdUMjvL4=s96-c",
                        "https://lh3.googleusercontent.com/a/ACg8ocLqdUuvQpZyTB9B0Hejxr-_xNtuhSiRuNBoIQEiEYRjCOuPMA=s96-c",
                        "https://lh3.googleusercontent.com/a/ACg8ocIqvMK1NFBDwahyZwA-7R0pMRE1pIVHWTIXHRtfyyjn32aKnb0=s96-c",
                        "https://lh3.googleusercontent.com/a/ACg8ocIgZlQ4l-OfX-oXubSHKWfmWiWFaHLtayMGdOC9lt58DvPDCw=s96-c",
                        "https://lh3.googleusercontent.com/a/ACg8ocK7QODDPWNlDeHbf-rKnOrxD3JMlcM1L6iZflELzDUFIqS_MQ=s96-c",
                        "https://lh3.googleusercontent.com/a/ACg8ocKaiA0mVK8hNzaIkraNQa9_9okFyVcDVfV0vwn6ubtUBVxCfW86=s96-c",
                      ].map((imgSrc, i) => (
                         <div key={i} className="size-12 rounded-full border-2 border-background overflow-hidden relative z-10 hover:z-20 transition-transform hover:scale-110 bg-muted/20">
                            <img src={imgSrc} width={48} height={48} alt={`support-${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                         </div>
                      ))}
                   </div>
                   <div className="text-sm font-medium">
                      <p className="text-foreground">Still have questions?</p>
                      <a href="mailto:tokyo9900777@gmail.com" className="text-primary hover:underline">Contact our support</a>
                   </div>
                </div>
              </div>

              {/* Right Column: Accordion */}
              <div className="lg:col-span-7">
                <Accordion type="single" collapsible className="w-full flex flex-col gap-4">
                  {[
                    {
                      question: "How does the grading system work?",
                      answer: "You are given immediate feedback upon finishing a quiz. All data is synchronized seamlessly and securely across our network to determine your final level and suggest the next best steps."
                    },
                    {
                      question: "Can I switch specializations mid-course?",
                      answer: "Yes, you have the flexibility to explore different domains. Chameleon allows you to pivot your specialization at any point through your dashboard, keeping your core progress intact."
                    },
                    {
                      question: "Is there a limit to how many courses I can take?",
                      answer: "Absolutely no limits! Chameleon encourages continuous exploration. You can enroll in as many tracks as you wish until you hit your level completion goals."
                    },
                    {
                      question: "Are the certificates recognized by employers?",
                      answer: "Our curriculum is co-designed with industry experts. Earning a Chameleon certification demonstrates a proven mastery of skills that top-tier companies actively look for."
                    },
                    {
                      question: "How does the AI Assistant help me?",
                      answer: "The integrated AI acts as your personal tutor. It can explain complex concepts, help debug code, and provide personalized study materials based on your unique learning pace."
                    }
                  ].map((faq, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                      <AccordionItem 
                        value={`item-${i}`} 
                        className="group border border-border/40 rounded-2xl bg-background/40 backdrop-blur-sm overflow-hidden data-[state=open]:bg-muted/30 data-[state=open]:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                      >
                        <AccordionTrigger className="text-left px-6 py-5 hover:no-underline [&[data-state=open]>div>svg]:rotate-180 [&[data-state=open]>div]:bg-primary [&[data-state=open]>div]:text-primary-foreground [&[data-state=open]]:text-primary">
                          <span className="font-bold text-lg leading-tight transition-colors duration-300 pr-8">{faq.question}</span>
                          {/* Custom Icon handled by Radix automatically, but we can override or use the default one. The default chevron is usually enough, but we styled the text and borders heavily. */}
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-5 pt-0">
                          <div className="text-muted-foreground leading-relaxed text-base border-l-2 border-primary/20 pl-4 ml-1">
                            {faq.answer}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </motion.div>
                  ))}
                </Accordion>
              </div>
              
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-24 md:py-40 bg-background text-foreground relative overflow-hidden border-t border-border/40">
          {/* Animated Background Gradients for CTA */}
          <div className="absolute inset-0 overflow-hidden">
             <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 dark:bg-primary/40 rounded-full blur-[120px] animate-pulse"></div>
             <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary/15 dark:bg-secondary/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
             <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] dark:opacity-10 mix-blend-overlay"></div>
          </div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, type: "spring" }}
              className="flex flex-col items-center justify-center space-y-8 text-center max-w-4xl mx-auto border border-border/50 bg-background/50 dark:bg-white/5 backdrop-blur-2xl p-10 md:p-16 rounded-[3rem] shadow-xl dark:shadow-2xl"
            >
              <Badge variant="outline" className="rounded-full px-6 py-2 border-primary/50 bg-primary/10 text-primary text-sm font-black uppercase tracking-[0.2em]">
                 Get Started
              </Badge>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-black italic tracking-tighter uppercase leading-[0.9]">
                <span className="transition-all duration-1000 dark:border-white/10 border-black/10">Ready to Join</span> <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Chameleon?</span>
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl font-light leading-relaxed">
                Join thousands of satisfied students who have streamlined their learning paths and boosted productivity with our robust platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full sm:w-auto">
                <Link href="/specialization" className="w-full sm:w-auto">
                    <Button size="lg" className="w-full rounded-full h-14 px-10 text-lg shadow-[0_0_30px_rgba(var(--primary),0.3)] hover:shadow-[0_0_50px_rgba(var(--primary),0.5)] transition-all bg-primary text-primary-foreground hover:scale-105">
                      Start Exploring
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </Link>
                <Link href="/about" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full rounded-full h-14 px-10 text-lg border-border text-foreground hover:bg-muted/50 transition-all bg-background/50">
                      Learn More
                    </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

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
