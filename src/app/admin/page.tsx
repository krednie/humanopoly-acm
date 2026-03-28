"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────
interface TeamState { teamId: string; displayName: string; balance: number; ownedProperties: string[]; }
interface PropertyState { propertyId: string; name: string; price: number; rent: number; owner: string | null; status: string; }
interface PendingApproval { id: string; type: string; teamId: string; propertyId: string; taskId?: number; amount: number; timestamp: number; status: string; }
interface Transaction { id: string; type: string; teamId: string; amount: number; description: string; timestamp: number; }
interface Task { taskId: number; name: string; reward: number; }
interface GameState {
  teams: Record<string, TeamState>;
  properties: Record<string, PropertyState>;
  currentPush: Record<string, { propertyId: string; taskId: number | null; pushedAt: number } | null>;
  pendingApprovals: PendingApproval[];
  transactions: Transaction[];
  taskUsage: Record<number, number>;
  tasks: Task[];
}

function formatMoney(n: number) { return `₮${n.toLocaleString()}`; }
function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
function typeBadge(type: string) {
  const map: Record<string, string> = { task_money: "bg-emerald-500/20 text-emerald-300", task_property: "bg-violet-500/20 text-violet-300", buy: "bg-sky-500/20 text-sky-300", rent: "bg-red-500/20 text-red-300" };
  return map[type] ?? "bg-white/10 text-white";
}

export default function AdminPage() {
  const router = useRouter();
  const [gs, setGs] = useState<GameState | null>(null);
  const [propertySearch, setPropertySearch] = useState("");
  const [pushTeam, setPushTeam] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  // Override panel
  const [balTeam, setBalTeam] = useState("");
  const [balDelta, setBalDelta] = useState("");
  const [balReason, setBalReason] = useState("");
  // Assign owner panel
  const [ownerPropId, setOwnerPropId] = useState("");
  const [ownerTeamId, setOwnerTeamId] = useState("");
  // Reset
  const [resetConfirm, setResetConfirm] = useState(false);
  // Active tab
  const [tab, setTab] = useState<"approvals" | "properties" | "overrides" | "log">("approvals");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/game/state?t=${Date.now()}`);
    if (res.status === 401) { router.push("/"); return; }
    if (!res.ok) return;
    setGs(await res.json());
  }, [router]);

  useEffect(() => {
    fetchState();
    const iv = setInterval(fetchState, 3000);
    return () => clearInterval(iv);
  }, [fetchState]);

  async function apiFetch(url: string, body: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showToast(data.error ?? "Error", false); return false; }
    showToast("Done ✓"); fetchState(); return true;
  }

  async function pushProperty() {
    if (!pushTeam || !propertySearch) return;
    const found = gs ? Object.values(gs.properties).find((p) => p.name.toLowerCase().includes(propertySearch.toLowerCase())) : null;
    if (!found) { showToast("Property not found", false); return; }
    const ok = await apiFetch("/api/admin/push", { teamId: pushTeam, propertyId: found.propertyId });
    if (ok) { setPropertySearch(""); }
  }

  async function approve(id: string, decision: "approve" | "reject") {
    await apiFetch("/api/admin/approve", { approvalId: id, decision });
  }

  async function editBalance() {
    const delta = parseFloat(balDelta);
    if (!balTeam || isNaN(delta)) { showToast("Fill in team and amount", false); return; }
    const ok = await apiFetch("/api/admin/balance", { teamId: balTeam, delta, reason: balReason || "Manual adjustment" });
    if (ok) { setBalDelta(""); setBalReason(""); }
  }

  async function assignOwner() {
    await apiFetch("/api/admin/property", { propertyId: ownerPropId, teamId: ownerTeamId || null });
  }

  async function resetGame() {
    const res = await fetch("/api/admin/reset", { method: "POST" });
    const data = await res.json();
    if (!res.ok) { showToast(data.error ?? "Reset failed", false); }
    else { showToast("Game reset ✓"); fetchState(); }
    setResetConfirm(false);
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); }

  if (!gs || !gs.teams || !gs.properties) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const teams = Object.values(gs.teams);
  const properties = Object.values(gs.properties);
  const leaderboard = teams
    .map((t) => ({
      ...t,
      netWorth: t.balance + t.ownedProperties.reduce((s, pid) => s + (gs.properties[pid]?.price ?? 0), 0),
    }))
    .sort((a, b) => b.netWorth - a.netWorth);

  const pendingApprovals = gs.pendingApprovals.filter((a) => a.status === "pending");
  const allApprovals = gs.pendingApprovals.slice(0, 50);

  // Property search results
  const propResults = propertySearch
    ? properties.filter((p) => p.name.toLowerCase().includes(propertySearch.toLowerCase())).slice(0, 5)
    : [];

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      <div className="fixed top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl fade-in ${toast.ok ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300" : "bg-red-500/20 border border-red-500/30 text-red-300"
          }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-[#111118]/90 backdrop-blur-xl border-b border-white/[0.06] sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center text-lg">🎲</div>
            <div>
              <h1 className="text-lg font-bold">Humanopoly Admin</h1>
              <p className="text-xs text-slate-500">Game Master Dashboard</p>
            </div>
          </div>
          {pendingApprovals.length > 0 && (
            <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 badge-pulse px-3 py-1 rounded-full text-sm font-semibold">
              ⚠️ {pendingApprovals.length} pending
            </div>
          )}
          <button onClick={logout} className="text-sm text-slate-500 hover:text-white transition px-3 py-1.5 rounded-lg hover:bg-white/5">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Top: Leaderboard + Push ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Leaderboard */}
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-semibold text-sm">🏆 Leaderboard</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {leaderboard.map((t, i) => {
                const pushed = gs.currentPush[t.teamId];
                const pushedPropName = pushed ? gs.properties[pushed.propertyId]?.name : null;
                return (
                  <div key={t.teamId} className="px-5 py-3 flex items-center gap-4">
                    <span className="text-base w-8 text-center">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{t.displayName}</p>
                      {pushedPropName && (
                        <p className="text-xs text-sky-400 truncate">📍 {pushedPropName}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-emerald-400">{formatMoney(t.netWorth)}</p>
                      <p className="text-xs text-slate-500">{formatMoney(t.balance)} cash · {t.ownedProperties.length} props</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Push Property */}
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="font-semibold text-sm">📍 Push Property to Team</h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Select Team</label>
                <select
                  value={pushTeam}
                  onChange={(e) => setPushTeam(e.target.value)}
                  className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/60 transition"
                >
                  <option value="">— Choose team —</option>
                  {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.displayName}</option>)}
                </select>
              </div>
              <div className="relative">
                <label className="text-xs text-slate-500 mb-1.5 block">Search Property</label>
                <input
                  value={propertySearch}
                  onChange={(e) => setPropertySearch(e.target.value)}
                  placeholder="Type property name…"
                  className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/60 transition"
                />
                {propResults.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-[#1a1a24] border border-white/10 rounded-xl overflow-hidden z-20 shadow-xl">
                    {propResults.map((p) => (
                      <button
                        key={p.propertyId}
                        onClick={() => setPropertySearch(p.name)}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-white/[0.06] flex items-center justify-between"
                      >
                        <span>{p.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${p.owner ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}>
                          {p.owner ? gs.teams[p.owner]?.displayName : "Vacant"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Preview selected property */}
              {(() => {
                const found = propertySearch ? properties.find((p) => p.name.toLowerCase() === propertySearch.toLowerCase()) : null;
                if (!found) return null;
                return (
                  <div className="bg-sky-500/[0.07] border border-sky-500/20 rounded-xl p-3 text-sm">
                    <p className="font-medium">{found.name}</p>
                    <p className="text-slate-400 text-xs mt-0.5">Price {formatMoney(found.price)} · Rent {formatMoney(found.rent)} · {found.owner ? `Owned by ${gs.teams[found.owner]?.displayName}` : "Vacant"}</p>
                  </div>
                );
              })()}

              <button
                disabled={!pushTeam || !propertySearch}
                onClick={pushProperty}
                className="w-full bg-gradient-to-r from-sky-500 to-violet-600 hover:opacity-90 text-white font-semibold py-3 rounded-xl transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Push to Team →
              </button>

              {/* Quick clear all pushes */}
              <div className="pt-1 border-t border-white/[0.06]">
                <p className="text-xs text-slate-500 mb-2">Clear individual push:</p>
                <div className="flex flex-wrap gap-2">
                  {teams.map((t) => {
                    const pushed = gs.currentPush[t.teamId];
                    if (!pushed) return null;
                    return (
                      <button
                        key={t.teamId}
                        onClick={() => apiFetch("/api/admin/push", { teamId: t.teamId, clear: true })}
                        className="bg-white/[0.06] border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition"
                      >
                        ✕ {t.displayName}
                      </button>
                    );
                  })}
                  {!teams.some((t) => gs.currentPush[t.teamId]) && (
                    <p className="text-xs text-slate-600">No active pushes</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-[#111118] border border-white/[0.06] rounded-xl p-1 w-fit">
          {(["approvals", "properties", "overrides", "log"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${tab === t ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "text-slate-500 hover:text-white hover:bg-white/[0.05]"
                }`}
            >
              {t === "approvals" && pendingApprovals.length > 0 ? `Approvals (${pendingApprovals.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Pending Approvals Tab ── */}
        {tab === "approvals" && (
          <div className="space-y-3">
            {pendingApprovals.length === 0 ? (
              <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-8 text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-slate-400 text-sm">No pending approvals</p>
              </div>
            ) : pendingApprovals.map((a) => {
              const team = gs.teams[a.teamId];
              const prop = gs.properties[a.propertyId];
              const task = a.taskId ? gs.tasks.find((t) => t.taskId === a.taskId) : null;
              return (
                <div key={a.id} className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 fade-in">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${typeBadge(a.type)}`}>{a.type}</span>
                        <span className="text-xs text-slate-500">{timeAgo(a.timestamp)}</span>
                      </div>
                      <p className="font-semibold">{team?.displayName ?? a.teamId} — {prop?.name ?? a.propertyId}</p>
                      {task && <p className="text-xs text-slate-400 mt-0.5">Task: {task.name}</p>}
                      <p className="text-sm mt-1">
                        <span className={`font-bold ${a.type.startsWith("task") ? "text-emerald-400" : "text-red-400"}`}>
                          {a.type === "task_property" ? "+ Earns Property" : a.type === "task_money" ? `+ ${formatMoney(a.amount)}` : `-${formatMoney(a.amount)}`}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => approve(a.id, "approve")}
                        className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 font-semibold text-sm px-4 py-2 rounded-xl transition"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => approve(a.id, "reject")}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-semibold text-sm px-4 py-2 rounded-xl transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Recent (non-pending) */}
            {allApprovals.filter((a) => a.status !== "pending").length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Recent Decisions</p>
                <div className="bg-[#111118] border border-white/[0.06] rounded-2xl divide-y divide-white/[0.04] overflow-hidden">
                  {allApprovals.filter((a) => a.status !== "pending").slice(0, 10).map((a) => (
                    <div key={a.id} className="px-5 py-3 flex items-center gap-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge(a.type)}`}>{a.type}</span>
                      <span className="flex-1 text-sm text-slate-300">{gs.teams[a.teamId]?.displayName} — {gs.properties[a.propertyId]?.name}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-400"}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Properties Tab ── */}
        {tab === "properties" && (
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-medium">Property</th>
                    <th className="px-4 py-3 text-right font-medium">Price</th>
                    <th className="px-4 py-3 text-right font-medium">Rent</th>
                    <th className="px-4 py-3 text-left font-medium">Owner</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Pushed To</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {properties.map((p) => {
                    const owner = p.owner ? gs.teams[p.owner] : null;
                    const pushedTeams = teams.filter((t) => gs.currentPush[t.teamId]?.propertyId === p.propertyId);
                    return (
                      <tr key={p.propertyId} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatMoney(p.price)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-slate-300">{formatMoney(p.rent)}</td>
                        <td className="px-4 py-3">
                          {owner ? (
                            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-0.5 rounded-full font-medium">{owner.displayName}</span>
                          ) : (
                            <span className="text-slate-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "owned" ? "bg-emerald-500/20 text-emerald-300" :
                              p.status === "locked" ? "bg-amber-500/20 text-amber-300" :
                                "bg-slate-500/20 text-slate-400"
                            }`}>{p.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {pushedTeams.length > 0 ? (
                            <span className="text-xs text-sky-400">{pushedTeams.map((t) => t.displayName).join(", ")}</span>
                          ) : <span className="text-slate-600 text-xs">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Overrides Tab ── */}
        {tab === "overrides" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Edit Balance */}
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm">💰 Edit Team Balance</h3>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Team</label>
                <select value={balTeam} onChange={(e) => setBalTeam(e.target.value)} className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/60 transition">
                  <option value="">— Choose team —</option>
                  {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.displayName} ({formatMoney(t.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Amount (+ to add, - to deduct)</label>
                <input type="number" value={balDelta} onChange={(e) => setBalDelta(e.target.value)} placeholder="e.g. 100 or -50" className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/60 transition" />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Reason (optional)</label>
                <input value={balReason} onChange={(e) => setBalReason(e.target.value)} placeholder="e.g. Bonus round" className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/60 transition" />
              </div>
              <button onClick={editBalance} className="w-full bg-gradient-to-r from-sky-500 to-violet-600 hover:opacity-90 text-white font-semibold py-2.5 rounded-xl transition">
                Apply
              </button>
            </div>

            {/* Assign Owner */}
            <div className="bg-[#111118] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-sm">🏠 Assign Property Owner</h3>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">Property</label>
                <select value={ownerPropId} onChange={(e) => setOwnerPropId(e.target.value)} className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/60 transition">
                  <option value="">— Choose property —</option>
                  {properties.map((p) => <option key={p.propertyId} value={p.propertyId}>{p.name} {p.owner ? `(${gs.teams[p.owner]?.displayName})` : "(vacant)"}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">New Owner (leave blank to clear)</label>
                <select value={ownerTeamId} onChange={(e) => setOwnerTeamId(e.target.value)} className="w-full bg-[#1a1a24] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500/60 transition">
                  <option value="">— None (clear owner) —</option>
                  {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.displayName}</option>)}
                </select>
              </div>
              <button disabled={!ownerPropId} onClick={assignOwner} className="w-full bg-gradient-to-r from-sky-500 to-violet-600 hover:opacity-90 text-white font-semibold py-2.5 rounded-xl transition disabled:opacity-30">
                Assign
              </button>
            </div>

            {/* Reset Game */}
            <div className="lg:col-span-2 bg-[#111118] border border-red-500/20 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-red-400">🔄 Reset Game</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Wipes all game progress and re-seeds the database to starting state.</p>
                </div>
                {!resetConfirm ? (
                  <button
                    onClick={() => setResetConfirm(true)}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 font-semibold text-sm px-5 py-2.5 rounded-xl transition whitespace-nowrap"
                  >
                    Reset Game
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-400 font-medium">Are you sure?</span>
                    <button
                      onClick={resetGame}
                      className="bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 font-semibold text-sm px-4 py-2 rounded-xl transition"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="bg-white/[0.06] border border-white/10 text-slate-400 hover:text-white font-semibold text-sm px-4 py-2 rounded-xl transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Activity Log Tab ── */}
        {tab === "log" && (
          <div className="bg-[#111118] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3 text-left font-medium">Time</th>
                    <th className="px-5 py-3 text-left font-medium">Team</th>
                    <th className="px-5 py-3 text-left font-medium">Action</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {gs.transactions.slice(0, 100).map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{timeAgo(tx.timestamp)}</td>
                      <td className="px-5 py-3 font-medium">{gs.teams[tx.teamId]?.displayName ?? tx.teamId}</td>
                      <td className="px-5 py-3 text-slate-300">{tx.description}</td>
                      <td className={`px-5 py-3 text-right font-bold tabular-nums ${tx.amount >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {tx.amount >= 0 ? "+" : ""}{formatMoney(tx.amount)}
                      </td>
                    </tr>
                  ))}
                  {gs.transactions.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-500">No activity yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
