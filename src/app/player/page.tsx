"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface TeamData {
  teamId: string;
  displayName: string;
  balance: number;
  ownedProperties: string[];
}
interface PropertyData {
  propertyId: string;
  name: string;
  price: number;
  rent: number;
  owner: string | null;
  status: string;
}
interface TaskData { taskId: number; name: string; reward: number; }
interface PushDetail { property: PropertyData; task: TaskData | null; pushedAt: number; }
interface Approval { id: string; type: string; propertyId: string; amount: number; status: string; }
interface Transaction { id: string; type: string; amount: number; description: string; timestamp: number; propertyId?: string; }
interface LeaderboardEntry { teamId: string; displayName: string; balance: number; netWorth: number; }

interface PlayerState {
  team: TeamData;
  push: PushDetail | null;
  pendingApprovals: Approval[];
  transactions: Transaction[];
  leaderboard: LeaderboardEntry[];
  properties: Record<string, PropertyData>;
}

function formatMoney(n: number) {
  return `₮${n.toLocaleString()}`;
}
function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function PlayerPage() {
  const router = useRouter();
  const [state, setState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/game/state?t=${Date.now()}`);
      if (res.status === 401) { router.push("/"); return; }
      if (!res.ok) return;
      const data = await res.json();
      if (data?.team) {
        setState(data);
        setLoading(false);
      }
    } catch { /* silent */ }
  }, [router]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  async function submitRequest(type: "task_money" | "task_property" | "buy" | "rent", propertyId: string, taskId?: number) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/game/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, propertyId, taskId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Error", "error"); }
      else { showToast("Request sent! Waiting for admin approval ✓"); fetchState(); }
    } catch { showToast("Network error", "error"); }
    setActionLoading(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!state) return null;

  const { team, push, pendingApprovals, transactions, leaderboard, properties } = state;
  const netWorth = team.balance + team.ownedProperties.reduce((s, pid) => s + (properties[pid]?.price ?? 0), 0);
  const myRank = leaderboard.findIndex((e) => e.teamId === team.teamId) + 1;

  const hasPendingFor = (type: string, propId: string) =>
    pendingApprovals.some((a) => a.type === type && a.propertyId === propId && a.status === "pending");

  return (
    <div className="min-h-screen pb-8 relative overflow-hidden">
      {/* Bg glows */}
      <div className="fixed top-0 right-0 w-72 h-72 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl fade-in ${toast.type === "success" ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-red-500/20 border border-red-500/30 text-red-300"
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#111118]/90 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-40 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Team</p>
            <h1 className="text-lg font-bold leading-tight">{team.displayName}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Balance</p>
            <p className="text-xl font-bold text-sky-400">{formatMoney(team.balance)}</p>
            <p className="text-xs text-slate-500">Net Worth: <span className="text-emerald-400 font-semibold">{formatMoney(netWorth)}</span></p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-bold px-2.5 py-1 rounded-full">
              #{myRank}
            </div>
            <button onClick={logout} className="text-xs text-slate-600 hover:text-slate-400 transition">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* ── Current Property Panel ── */}
        {push ? (() => {
          const { property: prop, task } = push;
          const isOwn = prop.owner === team.teamId;
          const isOther = prop.owner && !isOwn;

          return (
            <div className="fade-in">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">📍 You Landed On</p>
              <div className={`rounded-2xl border p-5 space-y-4 ${isOther
                  ? "bg-red-500/[0.07] border-red-500/20 glow-red"
                  : isOwn
                    ? "bg-emerald-500/[0.07] border-emerald-500/20 glow-green"
                    : "bg-sky-500/[0.07] border-sky-500/20 glow-blue"
                }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{prop.name}</h2>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {isOwn ? "You own this" : isOther ? `Owned by ${properties[prop.propertyId]?.owner ? leaderboard.find(l => l.teamId === prop.owner)?.displayName ?? prop.owner : "–"}` : "Vacant"}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isOther ? "bg-red-500/20 text-red-300" : isOwn ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300"
                    }`}>
                    {isOwn ? "Owned ✓" : isOther ? "Pay Rent" : "Vacant"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.04] rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Price</p>
                    <p className="font-bold text-white">{formatMoney(prop.price)}</p>
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-0.5">Rent</p>
                    <p className="font-bold text-white">{formatMoney(prop.rent)}</p>
                  </div>
                </div>

                {/* Case A: Vacant */}
                {!prop.owner && task && (
                  <div className="bg-white/[0.04] rounded-xl p-4 space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">🎯 Your Task</p>
                      <p className="text-sm font-semibold text-white">{task.name}</p>
                      <p className="text-xs text-emerald-400 mt-0.5">+{formatMoney(task.reward)} reward</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 w-full">
                        <button
                          disabled={actionLoading || hasPendingFor("task_money", prop.propertyId) || hasPendingFor("task_property", prop.propertyId)}
                          onClick={() => submitRequest("task_money", prop.propertyId, task.taskId)}
                          className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 font-semibold text-sm py-2.5 px-2 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed leading-tight"
                        >
                          {hasPendingFor("task_money", prop.propertyId) ? "⏳ Pending…" : "💰 Keep Money"}
                        </button>
                        <button
                          disabled={actionLoading || hasPendingFor("task_money", prop.propertyId) || hasPendingFor("task_property", prop.propertyId)}
                          onClick={() => submitRequest("task_property", prop.propertyId, task.taskId)}
                          className="flex-1 bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:bg-violet-500/30 font-semibold text-sm py-2.5 px-2 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed leading-tight"
                        >
                          {hasPendingFor("task_property", prop.propertyId) ? "⏳ Pending…" : "🏠 Get Property"}
                        </button>
                      </div>
                      <div className="flex gap-2 w-full">
                        <button
                          disabled={actionLoading || hasPendingFor("buy", prop.propertyId) || team.balance < prop.price}
                          onClick={() => submitRequest("buy", prop.propertyId)}
                          className="flex-1 bg-sky-500/20 border border-sky-500/30 text-sky-300 hover:bg-sky-500/30 font-semibold text-sm py-2.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {hasPendingFor("buy", prop.propertyId) ? "⏳ Pending…" : team.balance < prop.price ? "No funds" : "🏠 Buy"}
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={async () => {
                            const res = await fetch("/api/game/skip", { method: "POST" });
                            if (res.ok) fetchState();
                          }}
                          className="bg-white/[0.06] border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 font-semibold text-sm py-2.5 px-4 rounded-xl transition w-1/3"
                        >
                          Skip
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Case B: Owned by other */}
                {isOther && (() => {
                  const hasPaidRent = transactions.some(
                    (tx) => tx.type === "rent" && tx.propertyId === prop.propertyId && tx.timestamp >= push.pushedAt
                  );
                  return (
                    <button
                      disabled={hasPaidRent || actionLoading || hasPendingFor("rent", prop.propertyId) || team.balance < prop.rent}
                      onClick={() => submitRequest("rent", prop.propertyId)}
                      className={`w-full font-semibold py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed ${hasPaidRent ? "bg-white/10 text-white/50 border border-white/10" : "bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
                        }`}
                    >
                      {hasPaidRent ? "✅ Rent Paid" : hasPendingFor("rent", prop.propertyId) ? "⏳ Rent Request Pending…" : team.balance < prop.rent ? "Insufficient balance" : `💸 Pay Rent ${formatMoney(prop.rent)}`}
                    </button>
                  );
                })()}

                {/* Case C: Owned by self */}
                {isOwn && (
                  <p className="text-sm text-slate-400 text-center py-1">
                    Others landing here pay you <span className="text-emerald-400 font-semibold">{formatMoney(prop.rent)}</span>
                  </p>
                )}
              </div>
            </div>
          );
        })() : (
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-6 text-center">
            <p className="text-3xl mb-2">🎲</p>
            <p className="text-slate-400 text-sm">Waiting for admin to assign your tile…</p>
          </div>
        )}

        {/* ── Owned Properties ── */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">🏠 Properties Owned ({team.ownedProperties.length})</p>
          {team.ownedProperties.length === 0 ? (
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-4 text-center">
              <p className="text-slate-500 text-sm">No properties yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {team.ownedProperties.map((pid) => {
                const p = properties[pid];
                if (!p) return null;
                return (
                  <div key={pid} className="bg-[#111118] border border-white/[0.06] rounded-xl px-4 py-3 flex justify-between items-center card-hover">
                    <span className="text-sm font-medium">{p.name}</span>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Rent</p>
                      <p className="text-sm font-semibold text-emerald-400">{formatMoney(p.rent)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Transaction History ── */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">📋 Transactions</p>
          {transactions.length === 0 ? (
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-4 text-center">
              <p className="text-slate-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04] overflow-hidden">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white">{tx.description}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{timeAgo(tx.timestamp)}</p>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.amount >= 0 ? "+" : ""}{formatMoney(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Leaderboard ── */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">🏆 Leaderboard</p>
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
            {leaderboard.map((entry, i) => (
              <div key={entry.teamId} className={`px-4 py-3 flex items-center gap-3 ${entry.teamId === team.teamId ? "bg-sky-500/10" : ""} ${i < leaderboard.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
                <span className={`text-sm font-bold w-6 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-slate-500"}`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span className={`flex-1 text-sm font-medium ${entry.teamId === team.teamId ? "text-sky-300" : "text-white"}`}>
                  {entry.displayName} {entry.teamId === team.teamId ? "(You)" : ""}
                </span>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{formatMoney(entry.netWorth)}</p>
                  <p className="text-xs text-slate-500">{formatMoney(entry.balance)} cash</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
