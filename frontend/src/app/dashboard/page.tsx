"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Clock,
  Fingerprint,
  Shield,
  Loader2,
  Cpu,
  Trophy,
  Activity,
  Box,
  CornerDownRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/AuthContext";
import { getMyRecords, ContentRecord } from "@/lib/api";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      getMyRecords()
        .then(setRecords)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 relative">
        <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative">
           <Loader2 size={48} className="animate-spin text-primary opacity-20" />
           <Cpu size={24} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-[13px] font-black text-zinc-600 uppercase tracking-widest font-mono">Loading...</p>
      </div>
    );
  }

  const textCount = records.filter((r) => r.content_type === "text").length;
  const imageCount = records.filter((r) => r.content_type === "image").length;

  return (
    <div className="space-y-20 pb-20">
      {/* Operator Status Header */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-10 p-10 glass-tech tech-corners border-white/[0.03]">
          <div className="relative">
            <div className="w-28 h-28 rounded-sm bg-zinc-950 border border-white/5 flex items-center justify-center text-5xl font-black text-primary shadow-2xl rotate-2 group-hover:rotate-0 transition-all duration-700">
              {(user.displayName || user.email || "U")[0].toUpperCase()}
              <div className="absolute inset-0 border border-primary/20 translate-x-1 translate-y-1 -z-10" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-zinc-950 border border-white/10 flex items-center justify-center shadow-2xl">
              <ShieldCheck size={18} className="text-primary" />
            </div>
          </div>
          
          <div className="text-center md:text-left space-y-4 flex-1">
            <div className="tag-tech inline-flex">
               Your Dashboard
            </div>
            <div>
              <h1 className="text-5xl font-black title-tech tracking-tight leading-tight">
                {user.displayName?.toUpperCase() || "Welcome"}
              </h1>
              <p className="text-zinc-500 font-mono text-sm tracking-widest mt-1 opacity-60 lowercase">{user.email}</p>
            </div>
          </div>

          <div className="hidden lg:flex flex-col items-end gap-3 pt-4">
             <div className="flex items-center gap-4">
                <div className="text-right">
                   <p className="text-xs font-bold text-zinc-600 uppercase">Registered</p>
                   <p className="text-sm font-bold text-white mt-1">{records.length} items</p>
                </div>
                <div className="h-8 w-px bg-zinc-800" />
                <div className="text-right">
                   <p className="text-xs font-bold text-zinc-600 uppercase">Network</p>
                   <p className="text-sm font-bold text-primary mt-1">Sepolia</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Analytics Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            label: "Total Content",
            value: records.length,
            icon: Cpu,
            sub: "All your registered content",
          },
          {
            label: "Text Files",
            value: textCount,
            icon: FileText,
            sub: "Text documents",
          },
          {
            label: "Images",
            value: imageCount,
            icon: ImageIcon,
            sub: "Image files",
          },
        ].map(({ label, value, icon: Icon, sub }, i) => (
          <GlassCard key={label} delay={i * 0.1} className="group hover:border-primary/40 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-4">
                <p className="text-[13px] font-black text-zinc-500 tracking-wider">{label}</p>
                <p className="text-5xl font-black font-mono leading-none">{value.toString().padStart(2, '0')}</p>
                <p className="text-[13px] font-medium text-zinc-600">{sub.toUpperCase()}</p>
              </div>
              <div className="p-3 bg-zinc-950 border border-border rounded-lg group-hover:border-primary/40 transition-colors">
                <Icon size={20} className="text-zinc-700 group-hover:text-primary" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Content List Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-sm font-black text-white tracking-wider flex items-center gap-3 uppercase">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            My Registered Content
          </h2>
          <span className="text-xs font-mono text-zinc-500">{records.length} registered</span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 size={32} className="text-primary animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <GlassCard className="text-center py-24 bg-zinc-950/20 border-dashed">
            <Trophy size={48} className="mx-auto text-zinc-800 mb-6" />
            <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">No content registered yet</p>
            <p className="text-xs text-zinc-600 mt-2">Register your first piece of content to see it here.</p>
          </GlassCard>
        ) : (
          <div className="grid gap-4">
            {records.map((record, i) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="bg-zinc-900/40 border border-border rounded-xl p-5 hover:bg-zinc-900/60 hover:border-primary/30 transition-all group">
                  <div className="flex flex-col md:flex-row md:items-center gap-6">
                    <div className={`w-12 h-12 rounded bg-zinc-950 border border-border flex items-center justify-center shrink-0 group-hover:border-primary/20 transition-colors`}>
                      {record.content_type === "text" ? (
                        <FileText size={20} className="text-zinc-500 group-hover:text-primary transition-colors" />
                      ) : (
                        <ImageIcon size={20} className="text-zinc-500 group-hover:text-primary transition-colors" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">
                          {record.title}
                        </h3>
                        <span className="text-[12px] font-black px-2 py-0.5 rounded bg-zinc-950 border border-border text-zinc-600 uppercase tracking-widest italic group-hover:text-primary group-hover:border-primary/20 transition-all">
                          {record.content_type}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[13px] text-zinc-500 font-mono">
                         <div className="flex items-center gap-2">
                           <Fingerprint size={12} className="text-primary/40" />
                           <span className="truncate max-w-[200px]">{record.fingerprint}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <Clock size={12} />
                           <span>{new Date(record.created_at).toLocaleString()}</span>
                         </div>
                      </div>
                    </div>

                    {record.tx_hash && (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${record.tx_hash.startsWith("0x") ? "" : "0x"}${record.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded bg-zinc-950 border border-border text-[13px] font-black text-zinc-500 hover:text-primary hover:border-primary/40 transition-all uppercase tracking-widest group/btn"
                      >
                        View on Etherscan
                        <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

