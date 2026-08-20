"use client"

import React from "react"
import { motion } from "framer-motion"
import { Users, Compass, ArrowRight, HeartHandshake } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function AlumniResources() {
  const resources = [
    {
      title: "Graduate Study Spaces & Lounges",
      description: "Collaborate with fellow graduates, join technical group discussions, or study for certifications together.",
      link: "/study-spaces",
      linkLabel: "Enter Study Spaces",
      icon: Users,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Junior Mentorship & Community",
      description: "Give back to upcoming FCDS students by sharing advice, answering questions, or sharing course insights.",
      link: "/study-spaces",
      linkLabel: "Join Mentorship",
      icon: HeartHandshake,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-outfit flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Alumni Hub &amp; Continuous Learning
          </h2>
          <p className="text-sm text-muted-foreground">
            Curated resources, lifelong access hubs, and networking tools for Chameleon graduates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {resources.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <Card className="h-full bg-card/60 backdrop-blur-md border border-border/70 hover:border-primary/40 transition-all flex flex-col justify-between shadow-sm hover:shadow-md group">
              <CardHeader className="p-6 pb-3">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.bg} ${item.color} shrink-0`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground font-outfit group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">
                      Continuous Access
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
                <div>
                  <Link href={item.link}>
                    <Button variant="ghost" className="p-0 h-auto font-semibold text-primary hover:text-primary/80 hover:bg-transparent inline-flex items-center gap-1.5 cursor-pointer">
                      <span>{item.linkLabel}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
