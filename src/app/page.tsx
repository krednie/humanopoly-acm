"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); setLoading(false); return; }
      router.push(data.role === "admin" ? "/admin" : "/player");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-violet-600 mb-4 shadow-lg">
            <span className="text-2xl">🎲</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Humanopoly</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to your team</p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleLogin}
          className="bg-[#111118] border border-white/[0.06] rounded-2xl p-6 shadow-2xl space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="team1"
              required
              className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
              className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/30 transition"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-sky-500 to-violet-600 hover:from-sky-400 hover:to-violet-500 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}
