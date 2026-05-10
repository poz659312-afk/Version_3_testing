// specialization/department/level/page.tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { notFound, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BookOpen, Calendar, CheckCircle } from "lucide-react"
import { departmentData } from "@/lib/department-data"
import React, { Suspense, useEffect, useState } from "react"
import ErrorBoundary from "@/components/ErrorBoundary"
// import AdBanner from "@/components/AdBanner"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ department: string; level: string }>
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export default function LevelPage({ params }: Props) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading level...</div>}>
        <LevelContent params={params} />
      </Suspense>
    </ErrorBoundary>
  )
}

async function LevelContent({ params }: Props) {
  const resolvedParams = await params
  return <LevelContentClient department={resolvedParams.department} level={resolvedParams.level} />
}

function LevelContentClient({ department, level }: { department: string; level: string }) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("term1")
  const [showTermIndicator, setShowTermIndicator] = useState(false)
  const [indicatorTerm, setIndicatorTerm] = useState("")
  
  const dept = departmentData[department]
  const levelNum = Number.parseInt(level)

  if (!dept || !dept.levels[levelNum]) {
    notFound()
  }

  const levelData = dept.levels[levelNum]
  const yearSuffix = levelNum === 1 ? "st" : levelNum === 2 ? "nd" : levelNum === 3 ? "rd" : "th"

  // Handle URL parameter and set default when none exists
  useEffect(() => {
    const mode = searchParams.get("mode")
    if (mode === "term2") {
      setActiveTab("term2")
      setIndicatorTerm("Second Term")
      setShowTermIndicator(true)
      
      // Reduced from 3000 to 1500ms
      const timer = setTimeout(() => {
        setShowTermIndicator(false)
      }, 1500)
      
      return () => clearTimeout(timer)
    } else if (mode === "term1") {
      setActiveTab("term1")
      setIndicatorTerm("First Term")
      setShowTermIndicator(true)
      
      // Reduced from 3000 to 1500ms
      const timer = setTimeout(() => {
        setShowTermIndicator(false)
      }, 1500)
      
      return () => clearTimeout(timer)
    } else {
      // If no mode parameter exists, default to term1 and update URL
      window.history.replaceState({}, '', `?mode=term1`);
      setActiveTab("term1")
    }
  }, [searchParams])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground specialization-page">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 blur-xl md:blur-3xl" />

      {/* Term Selection Indicator with faster animation */}
      {showTermIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}  // Reduced distance
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}  // Added explicit shorter duration
          className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
        >
            <div className="bg-white/[0.1] border border-white/[0.2] backdrop-blur-md rounded-lg px-4 py-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className=" text-sm md:text-base font-small">{indicatorTerm} is Active</span>
            </div>
        </motion.div>
      )}

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button - faster transition */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}  // Reduced distance
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}  // Reduced duration and delay
            className="mb-8"
          >
            <Link href={`/specialization/${department}`}>
              <Button
                variant="ghost"
                className="text-muted-foreground hover: hover:bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {dept.name}
              </Button>
            </Link>
          </motion.div>

          {/* Header */}
          <div className="text-center mb-12">
            <motion.h1
              custom={0}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-4xl md:text-6xl font-bold  mb-6 tracking-tight"
            >
              <span style={{ WebkitTextStroke: '1.2px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000 dark:border-white/10 border-black/10">{dept.name}</span>
              <br />
              <span className={cn("text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]")}>
                {levelNum}
                {yearSuffix} Year
              </span>
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Complete curriculum organized by academic terms
            </motion.p>

            {/* Quick Navigation Links */}
            
          </div>

          {/* Tabs */}
          <motion.div custom={3} variants={fadeUpVariants} initial="hidden" animate="visible">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
                <TabsTrigger
                  value="term1"
                  className="flex items-center gap-2 data-[state=active]:bg-white/[0.1] data-[state=active]: text-muted-foreground"
                  onClick={() => {
                    // Use router.push instead of Link
                    window.history.pushState({}, '', `?mode=term1`);
                    handleTabChange("term1");
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  First Term
                </TabsTrigger>
                <TabsTrigger
                  value="term2"
                  className="flex items-center gap-2 data-[state=active]:bg-white/[0.1] data-[state=active]: text-muted-foreground"
                  onClick={() => {
                    // Use router.push instead of Link
                    window.history.pushState({}, '', `?mode=term2`);
                    handleTabChange("term2");
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  Second Term
                </TabsTrigger>
              </TabsList>

              <TabsContent value="term1">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {levelData.subjects.term1.map((subject: any, index: number) => (
                    <motion.div
                      key={subject.id}
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Link href={`/specialization/${department}/${level}/${subject.id}`}>
                        <Card className="h-full bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.15] transition-all duration-500 group cursor-pointer backdrop-blur-sm">
                          <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.3 }}
                                className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/[0.15] to-transparent border border-white/[0.15] flex items-center justify-center backdrop-blur-sm"
                              >
                                <BookOpen className="w-5 h-5 text-blue-400" />
                              </motion.div>
                              <Badge variant="outline" className="bg-white/[0.03] border-white/[0.1] text-muted-foreground">
                                Term 1
                              </Badge>
                            </div>
                            <CardTitle className="text-lg font-semibold  group-hover:text-foreground/90 transition-colors">
                              {subject.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-sm mb-4 group-hover:text-foreground/70 transition-colors">
                              {subject.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs bg-white/[0.03] border-white/[0.1] text-muted-foreground"
                              >
                                {subject.creditHours} Credits
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs bg-white/[0.03] border-white/[0.1] text-muted-foreground"
                              >
                                5 Sections
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="term2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {levelData.subjects.term2.map((subject: any, index: number) => (
                    <motion.div
                      key={subject.id}
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <Link href={`/specialization/${department}/${level}/${subject.id}`}>
                        <Card className="h-full bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-white/[0.15] transition-all duration-500 group cursor-pointer backdrop-blur-sm">
                          <CardHeader>
                            <div className="flex items-center gap-3 mb-2">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.3 }}
                                className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500/[0.15] to-transparent border border-white/[0.15] flex items-center justify-center backdrop-blur-sm"
                              >
                                <BookOpen className="w-5 h-5 text-green-400" />
                              </motion.div>
                              <Badge variant="outline" className="bg-white/[0.03] border-white/[0.1] text-muted-foreground">
                                Term 2
                              </Badge>
                            </div>
                            <CardTitle className="text-lg font-semibold  group-hover:text-foreground/90 transition-colors">
                              {subject.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-muted-foreground text-sm mb-4 group-hover:text-foreground/70 transition-colors">
                              {subject.description}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs bg-white/[0.03] border-white/[0.1] text-muted-foreground"
                              >
                                {subject.creditHours} Credits
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs bg-white/[0.03] border-white/[0.1] text-muted-foreground"
                              >
                                5 Sections
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>

          {/* <div className="mt-12">
            <AdBanner dataAdSlot="8021269551" />
          </div> */}
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none" />
    </div>
  )
}
