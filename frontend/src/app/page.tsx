"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  FileText,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Zap,
  Activity,
  Box,
  CornerDownRight,
  Cpu,
  Search,
  Clock,
  User,
  Hash,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import GlassCard from "@/components/GlassCard";
import FileDropZone from "@/components/FileDropZone";
import HexFingerprint from "@/components/HexFingerprint";
import ProtectedRoute from "@/components/ProtectedRoute";
import { registerContent, RegisterResponse, verifyOnChain } from "@/lib/api";

export default function RegisterPage() {
  const [contentType, setContentType] = useState<"text" | "image">("text");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [textContent, setTextContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RegisterResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [verifyResult, setVerifyResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a title");

    const formData = new FormData();
    formData.append("content_type", contentType);
    formData.append("title", title);
    formData.append("description", description);

    if (contentType === "text") {
      if (!textContent.trim()) return toast.error("Please enter your text content");
      formData.append("text_content", textContent);
    } else {
      if (!imageFile) return toast.error("Please select an image file");
      formData.append("file", imageFile);
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await registerContent(formData);
      setResult(data);
      toast.success("Content registered successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!result?.fingerprint) return;
    setVerifying(true);
    setVerifyResult(null);
    try {
      const data = await verifyOnChain(result.fingerprint);
      setVerifyResult(data);
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-24 pb-20">
        {/* Advanced Hero Section */}
        <div className="relative pt-12 flex flex-col items-center text-center space-y-8">
          {/* Background Decorative Rings */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
          
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4"
          >
            <div className="h-px w-12 bg-zinc-800" />
            <div className="flex items-center gap-2 px-4 py-1 rounded bg-zinc-950 border border-white/5 text-[12px] font-black tracking-wider uppercase text-zinc-500">
               <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
               Blockchain + AI Protection
            </div>
            <div className="h-px w-12 bg-zinc-800" />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <h1 className="text-6xl md:text-8xl font-black title-tech tracking-tight leading-none">
              PROTECT YOUR <br />
              <span className="title-tech-red italic">CONTENT</span>
            </h1>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-6">
               <div className="flex items-center gap-2 text-[13px] font-black text-zinc-600 uppercase tracking-widest">
                  <Cpu size={14} className="text-primary" />
                  <span>AI Fingerprinting</span>
               </div>
               <div className="w-1 h-1 rounded-full bg-zinc-800 hidden md:block" />
               <div className="flex items-center gap-2 text-[13px] font-black text-zinc-600 uppercase tracking-widest">
                  <Box size={14} className="text-primary" />
                  <span>Blockchain Ledger</span>
               </div>
               <div className="w-1 h-1 rounded-full bg-zinc-800 hidden md:block" />
               <div className="flex items-center gap-2 text-[13px] font-black text-zinc-600 uppercase tracking-widest">
                  <Shield size={14} className="text-primary" />
                  <span>IP Protection</span>
               </div>
            </div>
          </motion.div>

          {/* Data Pulse Line */}
          <div className="w-full max-w-lg h-[2px] tech-line opacity-20 mt-12" />
        </div>

        <div className="grid lg:grid-cols-[1fr,380px] gap-12 items-start">
          {/* Main Form Architecture */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-3">
                  <Activity size={14} className="text-primary" />
                  <h2 className="text-sm font-bold text-white">Upload & Register</h2>
               </div>
               <span className="text-xs text-zinc-600">Step-by-step</span>
            </div>

            <GlassCard className="!p-10 border-white/[0.03]">
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="grid md:grid-cols-2 gap-10">
                  {/* Protocol Selector */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                       <label className="text-[13px] font-black text-zinc-500 tracking-wider uppercase">
                         1. Content Type
                       </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {(["text", "image"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setContentType(type)}
                          className={`flex flex-col items-center justify-center gap-4 py-6 rounded-sm border transition-all relative overflow-hidden ${
                            contentType === type
                              ? "bg-primary/5 border-primary text-white shadow-[0_0_20px_rgba(227,30,36,0.1)]"
                              : "bg-zinc-950 border-white/5 text-zinc-600 hover:border-zinc-700 hover:bg-zinc-900"
                          }`}
                        >
                          {contentType === type && (
                            <div className="absolute top-0 right-0 w-8 h-8 bg-primary/20 flex items-center justify-center rounded-bl-xl">
                               <CheckCircle2 size={10} className="text-primary" />
                            </div>
                          )}
                          <div className={contentType === type ? "text-primary transition-colors" : ""}>
                            {type === "text" ? <FileText size={20} /> : <ImageIcon size={20} />}
                          </div>
                          <span className="text-[13px] font-black uppercase tracking-wider">{type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Identification Meta */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                       <label className="text-[13px] font-black text-zinc-500 tracking-wider uppercase">
                         2. Details
                       </label>
                    </div>
                    <div className="space-y-4">
                      <div className="relative group">
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Give your content a title"
                          className="w-full bg-zinc-950 border border-white/5 rounded-sm px-5 py-4 text-sm font-black uppercase tracking-widest focus:border-primary/50 focus:bg-zinc-900/50 outline-none placeholder:text-zinc-800 transition-all text-white font-mono"
                        />
                      </div>
                      <div className="relative group">
                        <input
                          type="text"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Brief description (optional)"
                          className="w-full bg-zinc-950 border border-white/5 rounded-sm px-5 py-4 text-sm font-black uppercase tracking-widest focus:border-primary/50 focus:bg-zinc-900/50 outline-none placeholder:text-zinc-800 transition-all text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Input Section */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                       <label className="text-[13px] font-black text-zinc-500 tracking-wider uppercase">
                         3. Your Content
                       </label>
                    </div>
                    <div className="tag-tech opacity-60">UTF-8 READY</div>
                  </div>
                  
                  <AnimatePresence mode="wait">
                    {contentType === "text" ? (
                      <motion.div
                        key="text"
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        className="relative"
                      >
                        <textarea
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          rows={10}
                          placeholder="Paste or type your text content here..."
                          className="w-full bg-zinc-950 border border-white/5 rounded-sm p-6 text-[13px] font-mono focus:border-primary/40 focus:bg-zinc-900/40 outline-none resize-none placeholder:text-zinc-800 text-zinc-300 leading-relaxed tracking-wider"
                        />
                        <div className="absolute bottom-4 right-6 text-[12px] font-mono text-zinc-700">CHARS: {textContent.length}</div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="image"
                        initial={{ opacity: 0, scale: 0.99 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                      >
                        <FileDropZone onFile={setImageFile} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Hardware Submission */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full group relative py-6 rounded-sm bg-primary hover:bg-primary-light text-white font-black text-[13px] tracking-widest uppercase disabled:opacity-50 transition-all flex items-center justify-center gap-4 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Shield size={16} className="relative z-10" />
                      <span className="relative z-10">Register & Protect</span>
                    </>
                  )}
                </button>
              </form>
            </GlassCard>
          </div>

          {/* Side Module: Results & System Logs */}
          <div className="space-y-8">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <GlassCard glow className="space-y-8 border-primary/30 bg-primary/[0.02]">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-primary">
                          <CheckCircle2 size={18} />
                          <h3 className="text-sm font-bold">Registered Successfully</h3>
                       </div>
                       <div className="h-px w-full bg-primary/10" />
                    </div>

                    <div className="space-y-4">
                       <p className="text-[13px] font-black text-zinc-600 tracking-wider uppercase flex items-center gap-2">
                          <CornerDownRight size={10} /> Cryptographic Fingerprint
                       </p>
                       <div className="p-4 bg-zinc-950 border border-white/5 rounded-sm">
                          <HexFingerprint hash={result.fingerprint} />
                       </div>
                    </div>

                    {result.tx_hash && (
                      <div className="space-y-4 pt-6">
                        <p className="text-[13px] font-black text-zinc-600 tracking-wider uppercase flex items-center gap-2">
                          <CornerDownRight size={10} /> Immutable Evidence
                        </p>
                        <a
                          href={result.etherscan_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-zinc-950 border border-white/5 hover:border-primary/40 rounded-sm group transition-all"
                        >
                          <div className="flex items-center gap-3">
                             <ExternalLink size={14} className="text-zinc-600 group-hover:text-primary" />
                             <span className="text-[13px] font-mono text-zinc-400 group-hover:text-white">
                                {result.tx_hash.slice(0, 16).toUpperCase()}...
                             </span>
                          </div>
                        </a>
                      </div>
                    )}

                    {result.ipfs_hash && (
                      <div className="space-y-2 pt-4">
                        <p className="text-xs font-bold text-zinc-500 uppercase">Stored on IPFS</p>
                        <a
                          href={result.ipfs_url || `https://gateway.pinata.cloud/ipfs/${result.ipfs_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 bg-zinc-950 border border-white/5 hover:border-primary/40 rounded-sm group transition-all text-sm"
                        >
                          <ExternalLink size={14} className="text-zinc-600 group-hover:text-primary" />
                          <span className="font-mono text-xs text-zinc-400 group-hover:text-white truncate">
                            ipfs://{result.ipfs_hash}
                          </span>
                        </a>
                      </div>
                    )}

                    {result.ipfs_warning && (
                      <p className="text-xs text-amber-500 bg-amber-500/5 rounded p-2">
                        {result.ipfs_warning}
                      </p>
                    )}

                    {/* Verify on Blockchain Button */}
                    <div className="pt-4 space-y-4">
                      <div className="h-px w-full bg-white/5" />
                      <button
                        onClick={handleVerify}
                        disabled={verifying}
                        className="w-full flex items-center justify-center gap-3 py-4 rounded-sm border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-black text-[12px] tracking-widest uppercase transition-all disabled:opacity-50"
                      >
                        {verifying ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Search size={14} />
                            Verify on Blockchain
                          </>
                        )}
                      </button>

                      {/* Verification Result */}
                      <AnimatePresence>
                        {verifyResult && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className={`p-5 rounded-sm border space-y-4 ${
                              verifyResult.on_chain
                                ? "border-green-500/30 bg-green-500/5"
                                : "border-amber-500/30 bg-amber-500/5"
                            }`}>
                              <div className="flex items-center gap-2">
                                {verifyResult.on_chain ? (
                                  <ShieldCheck size={16} className="text-green-400" />
                                ) : (
                                  <XCircle size={16} className="text-amber-400" />
                                )}
                                <span className={`text-[13px] font-black tracking-wider uppercase ${
                                  verifyResult.on_chain ? "text-green-400" : "text-amber-400"
                                }`}>
                                  {verifyResult.on_chain ? "Verified On-Chain" : "Not Found On-Chain"}
                                </span>
                              </div>

                              {verifyResult.on_chain && verifyResult.blockchain_record && (
                                <div className="space-y-3 text-[12px] font-mono">
                                  <div className="flex items-start gap-2">
                                    <User size={12} className="text-zinc-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-zinc-500 text-[11px] uppercase tracking-wider">Owner</p>
                                      <p className="text-zinc-300 break-all">{verifyResult.blockchain_record.owner}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Hash size={12} className="text-zinc-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-zinc-500 text-[11px] uppercase tracking-wider">Content Type</p>
                                      <p className="text-zinc-300">{verifyResult.blockchain_record.content_type}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <FileText size={12} className="text-zinc-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-zinc-500 text-[11px] uppercase tracking-wider">Title</p>
                                      <p className="text-zinc-300">{verifyResult.blockchain_record.title}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Clock size={12} className="text-zinc-500 mt-0.5 shrink-0" />
                                    <div>
                                      <p className="text-zinc-500 text-[11px] uppercase tracking-wider">Timestamp</p>
                                      <p className="text-zinc-300">
                                        {new Date(verifyResult.blockchain_record.timestamp * 1000).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>

                                  {result.tx_hash && (
                                    <a
                                      href={`https://sepolia.etherscan.io/tx/${result.tx_hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-center gap-2 mt-3 py-3 rounded-sm bg-zinc-950 border border-white/10 hover:border-green-500/40 transition-all group"
                                    >
                                      <ExternalLink size={13} className="text-zinc-500 group-hover:text-green-400" />
                                      <span className="text-[11px] font-black tracking-widest uppercase text-zinc-400 group-hover:text-white">
                                        View on Etherscan
                                      </span>
                                    </a>
                                  )}
                                </div>
                              )}

                              {!verifyResult.on_chain && (
                                <p className="text-[12px] text-amber-400/70">
                                  Content was saved locally but may not have been written to the blockchain. Check your blockchain configuration.
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <GlassCard className="space-y-8 !bg-zinc-950/30">
                  <div className="flex items-center gap-3">
                     <Cpu size={16} className="text-zinc-500" />
                     <h3 className="text-sm font-bold text-white">How It Works</h3>
                  </div>
                  <div className="space-y-8">
                    {[
                      { step: "01", title: "Upload", text: "Upload your text or image content to the system." },
                      { step: "02", title: "Fingerprint", text: "A unique SHA-256 hash is generated from your content." },
                      { step: "03", title: "Blockchain", text: "Your fingerprint is stored permanently on the Sepolia network." },
                    ].map(({ step, title, text }) => (
                      <div key={step} className="flex gap-4 group">
                        <span className="text-xs font-black text-zinc-800 font-mono group-hover:text-primary transition-colors">{step}</span>
                        <div className="space-y-1">
                          <p className="text-[13px] font-black text-zinc-400 tracking-wider uppercase">{title}</p>
                          <p className="text-[13px] text-zinc-600 font-medium leading-[1.6] tracking-wide">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}
            </AnimatePresence>

            {/* Network Status */}
            <div className="glass-tech tech-corners p-8 flex flex-col gap-4">
               <div className="flex items-center justify-between">
                  <div className="bg-primary/20 p-3 rounded-full">
                     <Shield size={20} className="text-primary" />
                  </div>
                  <div className="text-right">
                     <p className="text-xs font-bold text-zinc-500 uppercase">Network</p>
                     <p className="text-sm font-bold text-white mt-1">Sepolia Testnet</p>
                  </div>
               </div>
               <div className="text-xs text-zinc-500 space-y-1">
                  <p>Content is fingerprinted with SHA-256 and stored on the Ethereum Sepolia blockchain as immutable proof of ownership.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}


