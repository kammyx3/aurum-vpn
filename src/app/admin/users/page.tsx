"use client";

import { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  currentPlan?: { name: string; slug: string } | null;
};

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setProfiles(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-5 w-5 text-[#c8a54e]" />
        <h1 className="text-lg font-semibold text-zinc-100">Users</h1>
      </div>

      <div className="space-y-1">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-400">{p.email[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">{p.displayName || p.email}</p>
                <p className="text-[11px] text-muted-foreground">{p.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.role === "admin" ? "bg-amber-900/30 text-amber-400" : "bg-zinc-800 text-zinc-400"}`}>
                {p.role}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                {p.currentPlan?.name || "Free"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
