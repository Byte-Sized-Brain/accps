"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Activity,
  Cpu,
  CornerDownRight,
  Database,
  Scan,
  CheckCircle2,
  Globe,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import GlassCard from "@/components/GlassCard";
import FileDropZone from "@/components/FileDropZone";
import HexFingerprint from "@/components/HexFingerprint";
import ProtectedRoute from "@/components/ProtectedRoute";
import { checkPlagiarism, PlagiarismResponse } from "@/lib/api";

export default function CheckPage() {
  const [contentType, setContentType] = useState<"text" | "image">("text");
  const [textContent, setTextContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PlagiarismResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("content_type", contentType);

    if (contentType === "text") {
      if (!textContent.trim()) return toast.error("Please enter text to check");
      formData.append("text_content", textContent);
    } else {
      if (!imageFile) return toast.error("Please select an image to check");
      formData.append("file", imageFile);
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await checkPlagiarism(formData);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Check failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-primary";
    if (score >= 70) return "text-orange-500";
    return "text-green-500";
  };

  return (
    <ProtectedRoute>
      <div className="space-y-24 pb-20">
        {/* Verification Hero */}
        <div className="text-center space-y-8 pt-10 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4"
          >
            <div className="h-px w-10 bg-zinc-800" />
            <div className="tag-tech group">
               AI Plagiarism Detection
            </div>
            <div className="h-px w-10 bg-zinc-800" />
          </motion.div>

          <div className="space-y-4">
             <h1 className="text-6xl md:text-8xl font-black title-tech tracking-tight uppercase leading-none">
               CHECK FOR <span className="title-tech-red italic">PLAGIARISM</span>
             </h1>
             <p className="text-zinc-500 max-w-xl mx-auto text-xs font-medium tracking-wide uppercase opacity-70">
               Upload content to check if similar or identical work has already been registered
               by someone else.
             </p>
          </div>
          
          <div className="w-full max-w-md h-[1px] tech-line mx-auto opacity-20" />
        </div>

        {/* Global Analysis Interface */}
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <Scan size={14} className="text-primary" />
                <h2 className="text-sm font-bold text-white">Upload Content to Check</h2>
             </div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500/20 flex items-center justify-center">
                   <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                </span>
                <span className="text-xs text-zinc-600">Ready</span>
             </div>
          </div>

          <GlassCard className="!p-10 border-white/[0.03]">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Hardware Type Switcher */}
              <div className="grid grid-cols-2 gap-6">
                {(["text", "image"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`flex flex-col items-center justify-center gap-2 py-6 rounded border transition-all ${
                      contentType === type
                        ? "bg-primary border-primary text-white"
                        : "bg-zinc-950 border-border text-zinc-500 hover:border-zinc-700"
                    }`}
                  >
                    {type === "text" ? <FileText size={20} /> : <ImageIcon size={20} />}
                    <span className="text-[13px] font-black uppercase tracking-widest">{type} analysis</span>
                  </button>
                ))}
              </div>

              {/* Data Input */}
              <AnimatePresence mode="wait">
                {contentType === "text" ? (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <textarea
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={10}
                      placeholder="Paste the text you want to check..."
                      className="w-full bg-zinc-950 border border-border rounded p-6 text-xs font-mono focus:border-primary/50 outline-none resize-none placeholder:text-zinc-800"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <FileDropZone onFile={setImageFile} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded bg-zinc-900 border border-border text-white font-black text-xs tracking-wide uppercase hover:bg-zinc-800 hover:border-primary transition-all flex items-center justify-center gap-3 group"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-primary" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Search size={16} className="group-hover:text-primary transition-colors" />
                    Check for Plagiarism
                  </>
                )}
              </button>
            </form>
          </GlassCard>

          {/* Result Terminal */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Result Hero */}
                <div className={`p-8 rounded-xl border flex items-center justify-between ${
                  result.is_plagiarized ? "bg-red-500/5 border-primary/40" : "bg-green-500/5 border-green-500/40"
                 }`}>
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-full border ${
                      result.is_plagiarized ? "bg-primary/20 border-primary" : "bg-green-500/20 border-green-500"
                    }`}>
                      {result.is_plagiarized ? <ShieldAlert size={32} className="text-primary" /> : <ShieldCheck size={32} className="text-green-500" />}
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter">
                        {result.is_plagiarized ? "Similar Content Found" : "Looks Original"}
                      </h2>
                      <p className={`text-[13px] font-black uppercase tracking-widest ${
                        result.is_plagiarized ? "text-primary" : "text-green-500"
                      }`}>
                        {result.is_plagiarized
                          ? `Found ${result.exact_match ? "1 exact match, " : ""}${result.similar_content.length} similar in registry${result.web_results?.matches.length ? `, ${result.web_results.matches.length} on the web` : ""}`
                          : `No matches found${result.web_results ? ` (checked registry + ${result.web_results.pages_checked} web pages)` : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-black text-zinc-500 uppercase tracking-widest">Confidence Rating</p>
                    <p className={`text-3xl font-black font-mono ${
                      result.exact_match
                        ? "text-primary"
                        : result.similar_content.length > 0
                          ? getScoreColor(Math.max(...result.similar_content.map(m => m.similarity_score)))
                          : "text-green-500"
                    }`}>
                      {result.exact_match
                        ? "100% - Exact Match"
                        : result.similar_content.length > 0
                          ? `${Math.max(...result.similar_content.map(m => m.similarity_score))}%`
                          : "Original"}
                    </p>
                  </div>
                </div>

                {/* Matches */}
                <div className="grid md:grid-cols-2 gap-6">
                  {result.exact_match && (
                    <GlassCard className="border-primary/50">
                      <div className="flex items-center gap-2 text-primary mb-4">
                        <AlertTriangle size={14} />
                        <span className="text-[13px] font-black uppercase tracking-widest">CRITICAL: EXACT MATCH</span>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[12px] font-black text-zinc-500 uppercase tracking-wider">Asset Title</p>
                          <p className="text-sm font-bold truncate">{result.exact_match.title}</p>
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-zinc-500 uppercase tracking-wider">Legal Owner</p>
                          <p className="text-xs font-mono text-zinc-400 truncate">{result.exact_match.owner_address}</p>
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {result.similar_content.map((match, i) => (
                    <GlassCard key={i} className="hover:border-zinc-700 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Gauge size={14} />
                          <span className="text-[13px] font-black uppercase tracking-widest">SIMILARITY MATCH</span>
                        </div>
                        <span className={`text-xl font-black font-mono ${getScoreColor(match.similarity_score)}`}>
                          {match.similarity_score}%
                        </span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm font-bold truncate">{match.title}</p>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${match.similarity_score}%` }}
                            className={`h-full rounded-full ${
                              match.similarity_score >= 90 ? "bg-primary" : "bg-orange-500"
                            }`}
                          />
                        </div>
                        {match.method && (
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                              {match.method === "semantic" ? "Meaning match" :
                               match.method === "tfidf" ? "Keyword match" :
                               match.method === "cnn" ? "Visual match (AI)" :
                               "Perceptual match"}
                            </span>
                            {match.tfidf_score != null && (
                              <span>Keywords: {match.tfidf_score}%</span>
                            )}
                            {match.semantic_score != null && (
                              <span>Meaning: {match.semantic_score}%</span>
                            )}
                            {match.phash_score != null && (
                              <span>Visual: {match.phash_score}%</span>
                            )}
                            {match.cnn_score != null && match.cnn_score > 0 && (
                              <span>AI: {match.cnn_score}%</span>
                            )}
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  ))}
                </div>

                {/* Web Scan Results */}
                {result.web_results && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Globe size={16} className="text-primary" />
                        Web Scan Results
                      </h3>
                      <span className="text-xs text-zinc-500">
                        Searched {result.web_results.queries_searched} queries, checked {result.web_results.pages_checked} pages
                      </span>
                    </div>

                    {result.web_results.matches.length === 0 ? (
                      <GlassCard>
                        <div className="flex items-center gap-3 text-green-500">
                          <ShieldCheck size={18} />
                          <p className="text-sm font-medium">No copies found on the web</p>
                        </div>
                      </GlassCard>
                    ) : (
                      result.web_results.matches.map((webMatch, i) => (
                        <GlassCard key={i}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 min-w-0 flex-1">
                              <a
                                href={webMatch.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline flex items-center gap-1.5 truncate"
                              >
                                {webMatch.url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]}
                                <ExternalLink size={12} />
                              </a>
                              {webMatch.snippet && (
                                <p className="text-xs text-zinc-400 line-clamp-2">
                                  {webMatch.snippet}
                                </p>
                              )}
                              <p className="text-xs text-zinc-600">
                                Matched query: &quot;{webMatch.source_query}&quot;
                              </p>
                            </div>
                            <span className={`text-lg font-bold font-mono shrink-0 ${getScoreColor(webMatch.similarity_score)}`}>
                              {webMatch.similarity_score}%
                            </span>
                          </div>
                        </GlassCard>
                      ))
                    )}
                  </div>
                )}

                {/* Content Fingerprint */}
                <GlassCard className="bg-zinc-950/50">
                  <HexFingerprint hash={result.fingerprint} label="Content Fingerprint" />
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}

