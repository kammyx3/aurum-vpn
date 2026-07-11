"use client";

import { useEffect, useState } from "react";
import { Shield, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Release = {
  version: string;
  releaseDate: string;
  notes: string;
  files: { url: string; sha512: string; size: number }[];
  portableUrl: string | null;
};

export default function ReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/updates/latest")
      .then((r) => r.json())
      .then((data) => {
        if (data.version) setReleases([data]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-6 w-6 text-[#c8a54e]" />
          <h1 className="text-lg font-semibold">Releases</h1>
        </div>

        {loading && (
          <p className="text-xs text-zinc-500">Loading releases...</p>
        )}

        {!loading && releases.length === 0 && (
          <div className="text-center py-16">
            <Download className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">No releases available yet.</p>
          </div>
        )}

        <div className="space-y-3">
          {releases.map((r) => (
            <div
              key={r.version}
              className="border border-border rounded-lg p-4 bg-card"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">v{r.version}</h2>
                <span className="text-[11px] text-zinc-500">
                  {new Date(r.releaseDate).toLocaleDateString()}
                </span>
              </div>

              {r.notes && (
                <p className="text-xs text-zinc-400 mb-3 whitespace-pre-wrap">
                  {r.notes}
                </p>
              )}

              <div className="space-y-2">
                {r.files.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Download className="h-3.5 w-3.5 text-[#c8a54e] shrink-0" />
                      <span className="text-xs truncate">
                        {f.url.split("/").pop()}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 shrink-0">
                      {(f.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </a>
                ))}

                {r.portableUrl && (
                  <a
                    href={r.portableUrl}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-muted hover:bg-zinc-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Download className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="text-xs truncate">
                        {r.portableUrl.split("/").pop()}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 shrink-0">
                      Portable
                    </span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
