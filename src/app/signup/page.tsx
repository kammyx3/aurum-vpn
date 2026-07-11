"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        await fetch("/api/auth/sync-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseUserId: authData.user.id,
            email,
            displayName: displayName || email.split("@")[0],
          }),
        });

        const freePlan = await fetch("/api/billing/plans").then((r) => r.json());
        if (freePlan.plans?.length > 0) {
          await fetch("/api/billing/assign-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planSlug: "free" }),
          });
        }
      }

      router.push("/app/map");
      router.refresh();
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#c8a54e]/10 mb-4">
            <Shield className="h-6 w-6 text-[#c8a54e]" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Get started with AURUM VPN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:border-[#c8a54e]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Display name (optional)</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:border-[#c8a54e]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              required
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:border-[#c8a54e]/50 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
              className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground placeholder-zinc-500 focus:outline-none focus:border-[#c8a54e]/50 transition-colors"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#c8a54e] hover:bg-[#b8963e] text-black text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-[#c8a54e] hover:text-[#d4b85e] font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
