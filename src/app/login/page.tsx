"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/app/map";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        setError(authError.message === "Invalid login credentials" ? "Invalid email or password" : authError.message);
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-300">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
          className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#c8a54e]/50 transition-colors" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-zinc-300">Password</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Enter your password" required
            className="w-full px-3 py-2 pr-9 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#c8a54e]/50 transition-colors" />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-xs text-[#c8a54e] hover:text-[#d4b85e]">Forgot password?</Link>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c8a54e] hover:bg-[#b8963e] text-black text-sm font-semibold transition-colors disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
        Sign In
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#c8a54e]/10 mb-4">
            <Shield className="h-6 w-6 text-[#c8a54e]" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">Welcome back</h1>
          <p className="text-sm text-zinc-500 mt-1">Sign in to your AURUM VPN account</p>
        </div>
        <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-zinc-500" /></div>}>
          <LoginForm />
        </Suspense>
        <div className="mt-6 text-center">
          <p className="text-xs text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#c8a54e] hover:text-[#d4b85e] font-medium">
              Create one <ArrowRight className="inline h-3 w-3" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
