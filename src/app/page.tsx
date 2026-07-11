"use client";

import { useEffect, useState } from "react";
import { Shield, Download, Lock, Zap, Globe, ArrowRight, Server, Smartphone } from "lucide-react";
import Link from "next/link";

type Release = {
  version: string;
  files: { url: string; size: number }[];
  portableUrl: string | null;
};

export default function LandingPage() {
  const [release, setRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/updates/latest")
      .then((r) => r.json())
      .then((data) => {
        if (data.version) setRelease(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#c8a54e]" />
            <span className="font-semibold text-sm tracking-wider">
              <span className="text-[#c8a54e]">AURUM</span>
              <span className="text-muted-foreground ml-1">VPN</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/releases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Releases</Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm font-medium text-[#c8a54e] hover:text-[#d4b85e] transition-colors">Sign In</Link>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c8a54e]/10 border border-[#c8a54e]/20 text-[#c8a54e] text-xs font-medium mb-6">
          <Shield className="h-3 w-3" />
          Secure VPN Management
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
          Your Privacy, <span className="text-[#c8a54e]">Our Priority</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto mb-8 text-sm leading-relaxed">
          AURUM VPN gives you full control over your WireGuard VPN infrastructure.
          Manage devices, monitor activity, and secure your connection.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {loading ? (
            <div className="px-6 py-3 rounded-lg bg-muted text-sm text-muted-foreground">Checking for latest version...</div>
          ) : release ? (
            <a href={release.files[0]?.url || "#"} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#c8a54e] hover:bg-[#b8963e] text-black text-sm font-semibold transition-colors">
              <Download className="h-4 w-4" />
              Download for Windows v{release.version}
            </a>
          ) : null}
          {release?.portableUrl && (
            <a href={release.portableUrl} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors">
              Portable Version
            </a>
          )}
          <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted text-sm font-medium transition-colors">
            View Plans
          </Link>
        </div>
        {release && (
          <p className="text-xs text-muted-foreground mt-3">{(release.files[0]?.size / 1024 / 1024).toFixed(0)} MB &middot; Windows 10/11</p>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Lock, title: "End-to-End Encryption", desc: "WireGuard protocol with modern cryptography. Your data stays private." },
            { icon: Zap, title: "Real-Time Monitoring", desc: "Track device activity, bandwidth usage, and connection status live." },
            { icon: Globe, title: "Multi-Region Servers", desc: "25+ AURUM-owned nodes across the globe." },
            { icon: Server, title: "Server Management", desc: "Full control over your WireGuard server configuration and peers." },
            { icon: Smartphone, title: "Cross-Platform", desc: "Manage devices from a single dashboard." },
            { icon: Shield, title: "Open Source", desc: "Transparent code you can audit. Self-host or use our cloud." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="border border-border rounded-lg p-5 bg-card hover:border-muted-foreground/30 transition-colors">
                <Icon className="h-5 w-5 text-[#c8a54e] mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Ready to get started?</h2>
          <p className="text-muted-foreground text-sm mb-6">Download AURUM VPN and take control of your privacy.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#c8a54e] hover:bg-[#b8963e] text-black text-sm font-semibold transition-colors">
            Create Account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} AURUM VPN</span>
          <div className="flex items-center gap-4">
            <Link href="/releases" className="hover:text-foreground transition-colors">Releases</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
