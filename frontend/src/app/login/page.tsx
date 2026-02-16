"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogIn, Mail, Lock, Loader2, Shield, Activity, Fingerprint, Cpu, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import GlassCard from "@/components/GlassCard";
import { useAuth } from "@/lib/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");
    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("ACCESS GRANTED");
      router.push("/");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message.replace("Firebase: ", "") : "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Welcome!");
      router.push("/");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message.replace("Firebase: ", "") : "GOOGLE AUTH FAILED";
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 relative">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      <div className="w-full max-w-[420px] space-y-10">
        {/* Connection Architecture */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex relative group">
            <div className="absolute -inset-4 bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-all rounded-full" />
            <div className="w-20 h-20 rounded-sm bg-zinc-950 border border-primary/40 flex items-center justify-center relative z-10 shadow-2xl transition-transform duration-700 hover:rotate-6">
              <Shield size={32} className="text-primary" />
              {/* Corner markers */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/60" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/60" />
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">Welcome back</p>
            <h1 className="text-4xl font-black title-tech tracking-tight uppercase leading-none">
              SIGN <span className="title-tech-red italic">IN</span>
            </h1>
          </div>
        </motion.div>

        <GlassCard className="!p-10 border-white/[0.03]">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Input Port 1 */}
            <div className="space-y-4">
              <label className="text-[13px] font-black uppercase tracking-wide text-zinc-600 flex items-center justify-between">
                <span className="flex items-center gap-2">
                   <Mail size={12} className="text-primary/60" /> Email
                </span>
                <span className="opacity-40 font-mono">01_ID</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-border rounded p-4 text-xs font-mono focus:border-primary/50 outline-none transition-colors placeholder:text-zinc-800 text-white"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[13px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Lock size={10} />
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-zinc-950 border border-border rounded p-4 text-xs font-mono focus:border-primary/50 outline-none transition-colors placeholder:text-zinc-800 text-white"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded bg-primary text-white font-black text-xs tracking-wide uppercase hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogIn size={16} />
              )}
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[12px] font-black text-zinc-600 uppercase tracking-widest">or continue with</span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Google sign in */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full py-4 rounded bg-zinc-950 border border-border text-zinc-400 hover:text-white hover:border-zinc-700 transition-all flex items-center justify-center gap-3 text-[13px] font-black uppercase tracking-widest disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70 group-hover:opacity-100">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Footnotes */}
          <div className="mt-8 pt-6 border-t border-zinc-900 text-center">
            <p className="text-[13px] text-zinc-600 font-medium">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline font-black tracking-widest ml-1"
              >
                Sign Up
              </Link>
            </p>
          </div>
        </GlassCard>

        <div className="mt-6 flex items-center justify-center gap-4 text-zinc-700">
           <div className="flex items-center gap-1">
             <Fingerprint size={12} />
             <span className="text-[12px] font-mono">Secure Login</span>
           </div>
           <div className="w-1 h-1 rounded-full bg-zinc-800" />
           <span className="text-[12px] font-mono">256-bit encrypted</span>
        </div>
      </div>
    </div>
  );
}

