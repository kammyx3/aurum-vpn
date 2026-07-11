"use client";

import { useState } from "react";
import { Shield, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500/10 mb-4">
            <CheckCircle className="h-6 w-6 text-emerald-500" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100 mb-2">Check your email</h1>
          <p className="text-sm text-zinc-500 mb-6">
            We&apos;ve sent a password reset link to <strong className="text-zinc-300">{email}</strong>
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[#c8a54e] hover:text-[#d4b85e]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#c8a54e]/10 mb-4">
            <Shield className="h-6 w-6 text-[#c8a54e]" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100">Reset password</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#c8a54e]/50 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c8a54e] hover:bg-[#b8963e] text-black text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Send reset link
          </button>
        </form>
      </div>
    </div>
  );
}
