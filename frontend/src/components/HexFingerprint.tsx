"use client";

import { motion } from "framer-motion";

interface Props {
  hash: string;
  label?: string;
}

export default function HexFingerprint({ hash, label = "Fingerprint" }: Props) {
  // Split hash into groups of 8 for visual effect
  const groups = hash.match(/.{1,8}/g) || [];

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-black text-zinc-500 uppercase tracking-wider">
        {label.toUpperCase()}
      </p>
      <div className="flex flex-wrap gap-2 font-mono text-[13px]">
        {groups.map((group, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            className="px-2 py-1 rounded bg-zinc-950 text-primary border border-primary/20 hover:border-primary/50 transition-colors cursor-default"
          >
            {group.toUpperCase()}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

