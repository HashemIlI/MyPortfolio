'use client';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SectionWrapperProps {
  id?: string;
  className?: string;
  children: ReactNode;
  delay?: number;
}

const variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

export default function SectionWrapper({
  id,
  className = '',
  children,
  delay = 0,
}: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={variants}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
