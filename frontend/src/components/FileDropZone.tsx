"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, Image as ImageIcon, Box } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onFile: (file: File) => void;
  accept?: string;
}

export default function FileDropZone({ onFile, accept = "image/*" }: Props) {
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        setFileName(file.name);
        onFile(file);
      }
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFile(file);
    }
  };

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative cursor-pointer rounded border-2 border-dashed p-10 text-center transition-all duration-300 group ${
        dragging
          ? "border-primary bg-primary/10"
          : "border-zinc-800 hover:border-zinc-600 bg-zinc-950/50 hover:bg-zinc-900/50"
      }`}
    >
      <div className="absolute top-2 left-2 flex gap-1">
        <div className="w-1 h-1 bg-zinc-800 rounded-full" />
        <div className="w-1 h-1 bg-zinc-800 rounded-full" />
      </div>
      <div className="absolute bottom-2 right-2 flex gap-1">
        <div className="w-1 h-1 bg-zinc-800 rounded-full" />
        <div className="w-1 h-1 bg-zinc-800 rounded-full" />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <AnimatePresence mode="wait">
        {fileName ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="p-4 rounded bg-primary/20 border border-primary/40">
              <ImageIcon size={32} className="text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-white font-black uppercase tracking-widest font-mono">
                {fileName.toUpperCase()}
              </p>
              <p className="text-[13px] text-zinc-600 font-black uppercase tracking-wider">Ready for analysis</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="p-4 rounded bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-all">
              <Upload size={32} className="text-zinc-600 group-hover:text-zinc-400" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-zinc-400 font-black uppercase tracking-widest">
                Import Visual Asset
              </p>
              <p className="text-[13px] text-zinc-600 font-medium uppercase tracking-wider">Drag and drop / Select from directory</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

