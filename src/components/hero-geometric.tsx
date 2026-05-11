"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Pacifico } from "next/font/google"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useMemo, useEffect, useState } from "react"

const pacifico = Pacifico({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pacifico",
<<<<<<< HEAD
=======
  display: "swap",
>>>>>>> 16d5d685 (Performance optimizations)
})

export default function HeroGeometric({
  badge = "Chameleon FCDS",
  title1 = "Master Your",
  title2 = "Future Skills",
}: {
  badge?: string
  title1?: string
  title2?: string
}) {
  const prefersReducedMotion = useReducedMotion();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fadeUpVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
    },
  }), []);

<<<<<<< HEAD
  const animationSettings = (!isMounted || prefersReducedMotion) ? { animate: "visible" } : { initial: "hidden", animate: "visible" };
=======
  const animationSettings = useMemo(() => {
    return (!isMounted || prefersReducedMotion) ? { animate: "visible" } : { initial: "hidden", animate: "visible" };
  }, [isMounted, prefersReducedMotion]);
>>>>>>> 16d5d685 (Performance optimizations)

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden "
      style={{
        // backgroundImage: 'url("/images/main-ai.png")', // Replace with your image path
        // backgroundSize: "cover",
        // backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-white/80 dark:bg-black/60 pointer-events-none transition-colors duration-300" />

      {/* Background gradient */}
      <div className="absolute opacity-40" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.3) 0%, rgba(0, 0, 0, 0) 70%)',
        willChange: "opacity"
      }} />

      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ willChange: 'transform, opacity' }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
          >
            <Image 
              src="/images/1212-removebg-preview.png" 
              alt="Kokonut UI" 
              width={20} 
              height={20}
              priority
              loading="eager"
              unoptimized={true} // Only if it's a small static image
            />
            <span className="text-sm text-muted-foreground tracking-wide">{badge}</span>
          </motion.div>

          <motion.div custom={1} variants={fadeUpVariants} {...animationSettings} transition={{ duration: 0.8, ease: "easeInOut", delay: 0.1 }} style={{ willChange: 'transform, opacity' }}>
            <h1 className="text-[65px] md:text-[120px] font-bold mb-6 md:mb-8 tracking-tight leading-tight" >
              <span style={{ WebkitTextStroke: '1.2px currentColor', WebkitTextFillColor: 'transparent' }} className="transition-all duration-1000 dark:border-white/10 border-black/10">{title1}</span>
              <br />
              <span className={cn(
                "text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]",
                pacifico.className,
              )}>
                {title2}
              </span>
            </h1>
          </motion.div>

          <motion.div custom={2} variants={fadeUpVariants} {...animationSettings} transition={{ duration: 0.8, ease: "easeInOut", delay: 0.2 }} style={{ willChange: 'transform, opacity' }}>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
              Transforming ideas into vibrant digital experiences, adapting seamlessly like a chameleon to every challenge and vision.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="absolute bg-gradient-to-t from-black via-transparent to-black/80 pointer-events-none" style={{ willChange: "opacity" }} />
    </div>
  )
}
