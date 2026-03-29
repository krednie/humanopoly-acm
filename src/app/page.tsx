"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dice6 } from "lucide-react";

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
      if (data.role === "superadmin") router.push("/superadmin");
      else if (data.role === "admin") router.push("/admin");
      else router.push("/player");
    } catch {
      setError("Network error");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#e63946] mb-4 shadow-lg">
            <Dice6 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-widest text-[#2d3436]">HUMANOPOLY</h1>
          <p className="text-gray-400 font-bold text-sm mt-1">Sign in to your team</p>
        </div>

        {/* Rainbow border card */}
        <div className="p-[2px] bg-gradient-to-r from-[#e63946] via-[#f1c40f] via-[#3498db] to-[#27ae60] rounded-2xl shadow-xl">
          <form
            onSubmit={handleLogin}
            className="bg-white rounded-[14px] p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="team1"
                required
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#2d3436] placeholder-gray-300 focus:outline-none focus:border-[#3498db] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                required
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#2d3436] placeholder-gray-300 focus:outline-none focus:border-[#3498db] transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2.5 text-sm font-bold text-[#e63946]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#e63946] to-[#f1c40f] hover:opacity-90 text-white font-black py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md tracking-wide mt-2"
            >
              {loading ? "Signing in…" : "Sign In →"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
