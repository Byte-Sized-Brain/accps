"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Search, Database, LogOut, User, LogIn, ChevronRight, Activity, Cpu } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { getStatus, StatusResponse } from "@/lib/api";
import { useState, useRef, useEffect } from "react";

const links = [
  { href: "/", label: "Register", icon: Shield, auth: true },
  { href: "/check", label: "Check", icon: Search, auth: true },
  { href: "/registry", label: "Registry", icon: Database, auth: false },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sessionTime, setSessionTime] = useState("00:00:00");
  const [systemStatus, setSystemStatus] = useState<StatusResponse | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setSessionTime(now.toLocaleTimeString("en-GB", { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    getStatus()
      .then(setSystemStatus)
      .catch(() => setSystemStatus(null));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20 relative">
        {/* Detail Line */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] tech-line opacity-30" />
        
        {/* Left: Logo & Status */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-sm bg-primary flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Shield size={20} className="text-white fill-current" />
              </div>
              <div className="absolute -inset-1 rounded-sm border border-primary/20 scale-110 group-hover:scale-125 transition-transform duration-500" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter title-tech leading-none">
                ACCPS
              </h1>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5">Content Protection</p>
            </div>
          </Link>

          {!isAuthPage && (
            <div className="hidden lg:flex items-center gap-6 pl-8 border-l border-white/10 h-10">
              {links.map(({ href, label, auth: requiresAuth }) => {
                if (requiresAuth && !user) return null;
                const active = pathname === href;
                return (
                  <Link key={href} href={href} className="relative group/link py-2">
                    <span className={`text-[13px] font-black tracking-[0.25em] transition-all duration-300 ${
                      active ? "text-primary scale-105" : "text-zinc-500 group-hover/link:text-zinc-200"
                    }`}>
                      {label}
                    </span>
                    {active && (
                      <motion.div
                        layoutId="nav-glow"
                        className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary glow-primary"
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Network & Profile */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-2 px-4 border-r border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-500">Sepolia</span>
          </div>

          {loading ? (
            <div className="w-8 h-8 rounded-sm bg-zinc-900 border border-white/5 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 p-1.5 rounded-sm bg-zinc-950 border border-white/10 hover:border-primary/40 transition-all group"
              >
                <div className="w-7 h-7 rounded-sm bg-zinc-900 border border-white/5 flex items-center justify-center text-[13px] font-black text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
                <div className="flex flex-col items-start pr-2">
                  <span className="text-xs font-bold text-zinc-300 truncate max-w-[100px]">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                </div>
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98, x: 5 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.98, x: 5 }}
                    className="absolute right-0 top-full mt-3 w-64 bg-zinc-950 border border-white/10 rounded-sm shadow-2xl overflow-hidden glass-tech"
                  >
                    <div className="px-5 py-4 border-b border-white/5 bg-zinc-900/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Cpu size={10} className="text-primary" />
                        <p className="text-[13px] font-black text-white tracking-wider">Your Account</p>
                      </div>
                      <p className="text-[12px] text-zinc-500 truncate font-mono">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between w-full px-4 py-3 text-[13px] font-black text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm transition-all group"
                      >
                        <div className="flex items-center gap-3 tracking-wider">
                          <User size={12} className="text-zinc-600 group-hover:text-primary transition-colors" />
                          My Content
                        </div>
                        <ChevronRight size={12} className="text-zinc-700 group-hover:translate-x-1 transition-all" />
                      </Link>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center justify-between w-full px-4 py-3 text-[13px] font-black text-primary/70 hover:text-primary hover:bg-primary/5 rounded-sm transition-all group mt-px"
                      >
                        <div className="flex items-center gap-3 tracking-wider">
                          <LogOut size={12} />
                          Sign Out
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            !isAuthPage && (
              <Link href="/login">
                <button className="relative group px-6 py-3 bg-zinc-950 border border-primary/40 rounded-sm overflow-hidden transition-all hover:border-primary">
                  <div className="absolute inset-0 bg-primary/10 group-hover:bg-primary/20 transition-colors" />
                  <div className="relative flex items-center gap-3">
                    <LogIn size={14} className="text-primary" />
                    <span className="text-[13px] font-black tracking-wide text-white">Sign In</span>
                  </div>
                </button>
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
