// specialization/[department]/program-electives/page.tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, GraduationCap, Sparkles, AlertCircle } from "lucide-react"
import { departmentData } from "@/lib/department-data"
import { getProgramElectivesForDepartment } from "@/lib/electives-data"
import React, { Suspense } from "react"
import ErrorBoundary from "@/components/ErrorBoundary"
import { cn } from "@/lib/utils"

interface Props {
  params: Promise<{ department: string }>
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export default function ProgramElectivesPage({ params }: Props) {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-secondary/30 border-t-secondary rounded-full animate-spin"/>
        </div>
      }>
        <ProgramElectivesContent params={params} />
      </Suspense>
    </ErrorBoundary>
  )
}

async function ProgramElectivesContent({ params }: Props) {
  const resolvedParams = await params
  return <ProgramElectivesClient department={resolvedParams.department} />
}

function ProgramElectivesClient({ department }: { department: string }) {
  const dept = departmentData[department]

  if (!dept) {
    notFound()
  }

  const programElectives = getProgramElectivesForDepartment(department)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground specialization-page font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-secondary/10 blur-xl md:blur-3xl" />

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-8"
          >
            <Link href={`/specialization/${department}`}>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-secondary hover:bg-secondary/10 border border-white/[0.08] backdrop-blur-sm transition-colors cursor-pointer"
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
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              <span
                style={{ WebkitTextStroke: '1.2px currentColor', WebkitTextFillColor: 'transparent' }}
                className="transition-all duration-1000 text-secondary"
              >
                {dept.name}
              </span>
              <br />
              <span className={cn("text-transparent bg-clip-text bg-gradient-to-r from-secondary via-secondary/80 to-primary drop-shadow-[0_0_30px_rgba(var(--secondary),0.3)]")}>
                Program Electives
              </span>
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Specialized program elective courses designed specifically for {dept.name} students
            </motion.p>

            <motion.div
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center gap-2"
            >
              <Badge variant="outline" className="px-3.5 py-1.5 bg-secondary/10 text-secondary border-secondary/25 font-semibold text-xs rounded-full">
                {programElectives.length} Department Electives
              </Badge>
              <Badge variant="outline" className="px-3.5 py-1.5 bg-white/[0.03] border-white/10 text-muted-foreground text-xs rounded-full">
                3 Credits Each
              </Badge>
            </motion.div>
          </div>

          {/* Subjects Grid matching [level]/page.tsx exactly */}
          {programElectives.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50 text-secondary" />
              <p className="text-base font-medium">No program electives registered for this department.</p>
            </div>
          ) : (
            <motion.div
              custom={3}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {programElectives.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Link href={`/specialization/${department}/program-electives/${subject.id}`}>
                    <Card className="h-full bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 group cursor-pointer backdrop-blur-sm flex flex-col justify-between">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              transition={{ duration: 0.3 }}
                              className="w-10 h-10 rounded-lg bg-gradient-to-r from-secondary/[0.15] to-transparent border border-white/[0.15] flex items-center justify-center backdrop-blur-sm"
                            >
                              <GraduationCap className="w-5 h-5 text-secondary" />
                            </motion.div>
                            <Badge variant="outline" className="bg-white/[0.03] border-secondary/20 text-secondary group-hover:bg-secondary/10 transition-colors">
                              Program Elective
                            </Badge>
                          </div>
                          {subject.code && (
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                              {subject.code}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-lg font-semibold group-hover:text-secondary transition-colors leading-snug">
                          {subject.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm mb-4 group-hover:text-foreground/70 transition-colors line-clamp-3">
                          {subject.description}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                          <Badge
                            variant="outline"
                            className="text-xs bg-white/[0.03] border-white/[0.1] text-muted-foreground group-hover:border-secondary/20 group-hover:text-secondary transition-colors flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3" />
                            {subject.creditHours} Credits
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-xs bg-white/[0.03] border-white/[0.1] text-muted-foreground group-hover:border-secondary/20 group-hover:text-secondary transition-colors"
                          >
                            4 Fixed Folders
                          </Badge>
                          {subject.prerequisites && subject.prerequisites.length > 0 && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                            >
                              Prereq: {subject.prerequisites.join(', ')}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none" />
    </div>
  )
}
