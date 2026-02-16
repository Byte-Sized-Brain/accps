"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  delay?: number;
}

export default function GlassCard({
  children,
  className = "",
  glow = false,
  delay = 0,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.23, 1, 0.32, 1] }}
      className={`glass-tech tech-corners p-8 ${glow ? "glow-primary border-primary/30" : "border-white/5"} ${className}`}
    >
      {children}
    </motion.div>
  );
}


