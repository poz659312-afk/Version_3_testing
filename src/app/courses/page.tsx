"use client";

import AdBanner from "@/components/AdBanner";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export default function CoursesPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col overflow-hidden w-full">
      <main className="flex-1 relative">
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

        <section className="w-full py-20 lg:py-32 overflow-hidden relative">
          <div className="container px-4 md:px-6 relative text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
                Curriculum
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                Explore <span className="rock-salt">Courses</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Browse our available courses and start your learning journey today with specialized content tailored just for you.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
            <div className="w-full max-w-4xl mx-auto p-4 rounded-2xl border border-border/40 bg-card/50 backdrop-blur-lg md:backdrop-blur-3xl shadow-xl">
                <AdBanner dataAdSlot="8021269551" />
                <div className="text-center py-20 text-muted-foreground">
                    <p>Course catalog will populate here based on dynamic backend configuration.</p>
                </div>
            </div>
        </section>
      </main>

      <footer className="w-full py-12 border-t border-border bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-4 text-center space-y-4">
            <div className="text-2xl font-black italic tracking-tighter text-foreground/80 rock-salt">Chameleon<span className="text-primary text-xl">.</span></div>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Empowering learners worldwide.
            </p>
        </div>
      </footer>
    </div>
  );
}
