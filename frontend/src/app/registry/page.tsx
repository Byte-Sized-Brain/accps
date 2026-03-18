"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  RefreshCw,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Clock,
  Fingerprint,
  Loader2,
  Terminal,
  Activity,
  Cpu,
  ShieldCheck,
  ChevronDown,
  Search,
  User,
  Hash,
  XCircle,
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { getRecords, verifyOnChain, ContentRecord } from "@/lib/api";

export default function RegistryPage() {
  const [records, setRecords] = useState<ContentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContentRecord | null>(null);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [verifyResults, setVerifyResults] = useState<Record<number, any>>({});

  const handleVerify = async (record: ContentRecord) => {
    setVerifyingId(record.id);
    try {
      const data = await verifyOnChain(record.fingerprint);
      setVerifyResults((prev) => ({ ...prev, [record.id]: data }));
    } catch {
      setVerifyResults((prev) => ({ ...prev, [record.id]: { error: true } }));
    } finally {
      setVerifyingId(null);
    }
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRecords();
      setRecords(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return (
    <div className="space-y-16 pb-20">
      {/* Header Architecture */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="tag-tech group cursor-help">
                Content Registry
             </div>
             <div className="h-px w-8 bg-zinc-800" />
             <div className="flex items-center gap-2 text-[13px] font-bold text-zinc-600 tracking-wide">
                <Terminal size={12} />
                All registered content
             </div>
          </div>
          
          <h1 className="text-6xl font-black title-tech tracking-tight uppercase leading-none">
            CONTENT <span className="title-tech-red italic">REGISTRY</span>
          </h1>
          <p className="text-zinc-500 text-xs font-medium tracking-wide max-w-xl">
            Browse all registered content. Items with a transaction hash are stored on-chain on Sepolia.
            Items without are stored locally only.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end gap-1">
             <span className="text-[12px] font-black text-zinc-600 uppercase tracking-widest leading-none">Registered_Chunks</span>
             <span className="text-2xl font-black font-mono text-white leading-none">
               {records.length.toString().padStart(3, "0")}
             </span>
          </div>
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="relative group p-4 rounded-sm bg-zinc-950 border border-white/5 hover:border-primary/50 transition-all disabled:opacity-50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
            <RefreshCw size={18} className={`relative z-10 text-zinc-400 group-hover:text-primary transition-colors ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Loading Architecture */}
      {loading && records.length === 0 && (
        <div className="grid place-items-center py-40 relative">
          <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative">
             <Loader2 size={48} className="text-primary animate-spin opacity-20" />
             <Activity size={24} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <p className="text-[12px] font-black text-zinc-600 uppercase tracking-widest mt-8 font-mono">
            awaiting_node_handshake...
          </p>
        </div>
      )}

      {/* Empty State Architecture */}
      {!loading && records.length === 0 && (
        <GlassCard className="text-center py-32 border-white/[0.02]">
          <Database size={48} className="mx-auto text-zinc-900 mb-8" />
          <h3 className="text-lg font-black text-zinc-500 uppercase tracking-wider">NO RECORDS FOUND</h3>
          <p className="text-[13px] text-zinc-700 font-mono mt-2 uppercase tracking-widest">Protocol error 404: Null ledger state</p>
        </GlassCard>
      )}

      {/* Ledger Grid Implementation */}
      <div className="space-y-6">
        {/* Hardware Header Line */}
        <div className="hidden md:grid grid-cols-[1fr,140px,180px,120px] gap-6 px-10 text-[12px] font-black text-zinc-600 uppercase tracking-wider">
          <span className="flex items-center gap-2">
             <Cpu size={10} /> Asset_Object
          </span>
          <span>Protocol_Type</span>
          <span>Commit_Stamp</span>
          <span className="text-right pr-4">Network_ID</span>
        </div>

        <AnimatePresence>
          {records.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelected(selected?.id === record.id ? null : record)}
              className="group cursor-pointer"
            >
              <div
                className={`transition-all duration-500 relative tech-corners glass-tech ${
                  selected?.id === record.id
                    ? "bg-primary/[0.03] border-primary/30 shadow-[0_0_30px_rgba(227,30,36,0.05)]"
                    : "bg-zinc-950/20 border-white/[0.03] group-hover:border-white/10"
                } rounded-sm overflow-hidden`}
              >
                <div className="grid md:grid-cols-[1fr,140px,180px,120px] items-center gap-6 p-8 relative">
                  {/* Visual Background Markers */}
                  <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-primary/[0.02] to-transparent pointer-events-none" />
                  
                  {/* Asset Info */}
                  <div className="flex items-center gap-6 min-w-0 relative z-10">
                    <div className={`w-12 h-12 rounded-sm bg-zinc-950 border flex items-center justify-center shrink-0 transition-all duration-500 ${
                      selected?.id === record.id ? "border-primary/40 ring-4 ring-primary/5" : "border-white/5"
                    }`}>
                      {record.content_type === "text" ? (
                        <FileText size={18} className={selected?.id === record.id ? "text-primary" : "text-zinc-500"} />
                      ) : (
                        <ImageIcon size={18} className={selected?.id === record.id ? "text-primary" : "text-zinc-500"} />
                      )}
                    </div>
                    <div className="truncate">
                      <p className={`text-sm font-bold truncate ${selected?.id === record.id ? "text-white" : "text-zinc-300"}`}>
                        {record.title.toUpperCase()}
                      </p>
                      <p className="text-[13px] font-mono text-zinc-500 truncate mt-0.5">
                        OWNER: {record.owner_address}
                      </p>
                    </div>
                  </div>

                  {/* Protocol */}
                  <div className="hidden md:block">
                    <span className={`text-[13px] font-black px-2 py-1 rounded border ${
                      record.content_type === "text" 
                        ? "text-blue-400 border-blue-400/20 bg-blue-400/5" 
                        : "text-primary border-primary/20 bg-primary/5"
                    } uppercase tracking-widest`}>
                      {record.content_type}
                    </span>
                  </div>

                  {/* Timestamp */}
                  <div className="hidden md:flex items-center gap-2 text-zinc-500">
                    <Clock size={12} />
                    <span className="text-[13px] font-bold uppercase">{new Date(record.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Link */}
                  <div className="flex justify-end pr-2">
                    {record.tx_hash ? (
                      <a
                        href={`https://sepolia.etherscan.io/tx/${record.tx_hash.startsWith("0x") ? "" : "0x"}${record.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 rounded hover:bg-primary/20 text-zinc-600 hover:text-primary transition-all border border-transparent hover:border-primary/20"
                      >
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-[12px] font-black text-zinc-700 uppercase tracking-widest">Local</span>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {selected?.id === record.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="px-5 pb-5 pt-2 space-y-6">
                        <div className="h-[1px] bg-gradient-to-r from-primary/40 to-transparent" />
                        
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest">Description</p>
                              <p className="text-xs text-zinc-400 leading-relaxed italic">
                                {record.description || "No description provided"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest">Content Fingerprint</p>
                              <div className="p-3 bg-zinc-950 border border-border rounded font-mono text-[13px] text-primary break-all">
                                {record.fingerprint}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-1">
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest">Blockchain Status</p>
                              <div className="space-y-2">
                                <div className="flex justify-between text-[13px]">
                                  <span className="text-zinc-500 uppercase">Status</span>
                                  <span className={`${record.tx_hash ? 'text-green-500' : 'text-amber-500'} font-bold uppercase`}>{record.tx_hash ? 'On-Chain' : 'Local Only'}</span>
                                </div>
                                <div className="flex justify-between text-[13px]">
                                  <span className="text-zinc-500 uppercase">Network</span>
                                  <span className="text-zinc-300 font-bold">{record.tx_hash ? 'Sepolia Ethereum' : 'Not submitted'}</span>
                                </div>
                                {record.tx_hash && (
                                  <div className="flex justify-between text-[13px]">
                                    <span className="text-zinc-500 uppercase">TX Index</span>
                                    <span className="text-zinc-300 font-mono">{record.tx_hash.slice(0, 12)}...</span>
                                  </div>
                                )}
                                {record.ipfs_hash && (
                                  <div className="flex justify-between text-[13px]">
                                    <span className="text-zinc-500 uppercase">IPFS</span>
                                    <a
                                      href={record.ipfs_url || `https://gateway.pinata.cloud/ipfs/${record.ipfs_hash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline font-mono"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {record.ipfs_hash.slice(0, 12)}...
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Verify on Blockchain Button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVerify(record); }}
                              disabled={verifyingId === record.id}
                              className="w-full flex items-center justify-center gap-2 py-3 rounded-sm border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-black text-[11px] tracking-widest uppercase transition-all disabled:opacity-50"
                            >
                              {verifyingId === record.id ? (
                                <>
                                  <Loader2 size={12} className="animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                <>
                                  <Search size={12} />
                                  Verify on Blockchain
                                </>
                              )}
                            </button>

                            {/* Verification Result */}
                            <AnimatePresence>
                              {verifyResults[record.id] && !verifyResults[record.id].error && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className={`p-4 rounded-sm border space-y-3 ${
                                    verifyResults[record.id].on_chain
                                      ? "border-green-500/30 bg-green-500/5"
                                      : "border-amber-500/30 bg-amber-500/5"
                                  }`}>
                                    <div className="flex items-center gap-2">
                                      {verifyResults[record.id].on_chain ? (
                                        <ShieldCheck size={14} className="text-green-400" />
                                      ) : (
                                        <XCircle size={14} className="text-amber-400" />
                                      )}
                                      <span className={`text-[12px] font-black tracking-wider uppercase ${
                                        verifyResults[record.id].on_chain ? "text-green-400" : "text-amber-400"
                                      }`}>
                                        {verifyResults[record.id].on_chain ? "Verified On-Chain" : "Not Found On-Chain"}
                                      </span>
                                    </div>

                                    {verifyResults[record.id].on_chain && verifyResults[record.id].blockchain_record && (
                                      <div className="space-y-2 text-[11px] font-mono">
                                        <div className="flex items-start gap-2">
                                          <User size={10} className="text-zinc-500 mt-0.5 shrink-0" />
                                          <div className="min-w-0">
                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Owner</p>
                                            <p className="text-zinc-300 break-all">{verifyResults[record.id].blockchain_record.owner}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <Hash size={10} className="text-zinc-500 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Content Type</p>
                                            <p className="text-zinc-300">{verifyResults[record.id].blockchain_record.content_type}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <FileText size={10} className="text-zinc-500 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Title</p>
                                            <p className="text-zinc-300">{verifyResults[record.id].blockchain_record.title}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <Clock size={10} className="text-zinc-500 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider">Timestamp</p>
                                            <p className="text-zinc-300">
                                              {new Date(verifyResults[record.id].blockchain_record.timestamp * 1000).toLocaleString()}
                                            </p>
                                          </div>
                                        </div>

                                        {record.tx_hash && (
                                          <a
                                            href={`https://sepolia.etherscan.io/tx/${record.tx_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={(e) => e.stopPropagation()}
                                            className="flex items-center justify-center gap-2 mt-2 py-2.5 rounded-sm bg-zinc-950 border border-white/10 hover:border-green-500/40 transition-all group"
                                          >
                                            <ExternalLink size={12} className="text-zinc-500 group-hover:text-green-400" />
                                            <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400 group-hover:text-white">
                                              View on Etherscan
                                            </span>
                                          </a>
                                        )}
                                      </div>
                                    )}

                                    {!verifyResults[record.id].on_chain && (
                                      <p className="text-[11px] text-amber-400/70">
                                        Content saved locally but not found on the blockchain.
                                      </p>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

