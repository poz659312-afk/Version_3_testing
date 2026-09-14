// specialization/[department]/faculty-electives/page.tsx
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react"
import { departmentData } from "@/lib/department-data"
import { getFacultyElectivesForDepartment } from "@/lib/electives-data"
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

export default function FacultyElectivesPage({ params }: Props) {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen bg-background flex justify-center items-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"/>
        </div>
      }>
        <FacultyElectivesContent params={params} />
      </Suspense>
    </ErrorBoundary>
  )
}

async function FacultyElectivesContent({ params }: Props) {
  const resolvedParams = await params
  return <FacultyElectivesClient department={resolvedParams.department} />
}

function FacultyElectivesClient({ department }: { department: string }) {
  const dept = departmentData[department]

  if (!dept) {
    notFound()
  }

  const facultyElectives = getFacultyElectivesForDepartment(department)

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground specialization-page font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 blur-xl md:blur-3xl" />

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
                className="text-muted-foreground hover:text-primary hover:bg-primary/10 border border-white/[0.08] backdrop-blur-sm transition-colors cursor-pointer"
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
                className="transition-all duration-1000 text-primary"
              >
                {dept.name}
              </span>
              <br />
              <span className={cn("text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]")}>
                Faculty Electives
              </span>
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Standard official elective courses available across all college departments
            </motion.p>

            <motion.div
              custom={2}
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-center gap-2"
            >
              <Badge variant="outline" className="px-3.5 py-1.5 bg-primary/10 text-primary border-primary/25 font-semibold text-xs rounded-full">
                {facultyElectives.length} Official Elective Courses
              </Badge>
            </motion.div>
          </div>

          {/* Subjects Grid matching [level]/page.tsx exactly */}
          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {facultyElectives.map((subject, index) => (
              <motion.div
                key={subject.id}
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <Link href={`/specialization/${department}/faculty-electives/${subject.id}`}>
                  <Card className="h-full bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.04] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer backdrop-blur-sm flex flex-col justify-between">
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            transition={{ duration: 0.3 }}
                            className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary/[0.15] to-transparent border border-white/[0.15] flex items-center justify-center backdrop-blur-sm"
                          >
                            <BookOpen className="w-5 h-5 text-primary" />
                          </motion.div>
                          <Badge variant="outline" className="bg-white/[0.03] border-primary/20 text-primary group-hover:bg-primary/10 transition-colors">
                            Faculty Elective
                          </Badge>
                        </div>
                        {subject.code && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border">
                            {subject.code}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors leading-snug">
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
                          className="text-xs bg-white/[0.03] border-white/[0.1] text-muted-foreground group-hover:border-primary/20 group-hover:text-primary transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          {subject.creditHours} Credits
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-xs bg-white/[0.03] border-white/[0.1] text-muted-foreground group-hover:border-primary/20 group-hover:text-primary transition-colors"
                        >
                          4 Fixed Folders
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/80 pointer-events-none" />
    </div>
  )
}
