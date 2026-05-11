"use client"

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'word' | 'character';
  direction?: 'top' | 'bottom';
}

export function BlurText({
  text,
  delay = 200,
  className = '',
  animateBy = 'word',
  direction = 'top',
}: BlurTextProps) {
  const elements = animateBy === 'word' ? text.split(' ') : text.split('');
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: delay / 1000,
      }
    }
  };

  const item = {
    hidden: { 
      opacity: 0, 
      filter: 'blur(10px)', 
      y: direction === 'top' ? -20 : 20 
    },
    visible: { 
      opacity: 1, 
      filter: 'blur(0px)', 
      y: 0,
      transition: { duration: 0.3, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {elements.map((element, index) => (
        <motion.span
          key={index}
          variants={item}
          className="inline-block mr-[0.25em]"
          style={{ willChange: "transform, filter, opacity" }}
        >
          {element}{animateBy === 'character' ? '' : ' '}
        </motion.span>
      ))}
    </motion.div>
  );
}