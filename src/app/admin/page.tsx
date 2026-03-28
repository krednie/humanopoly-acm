"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamState, PropertyState, PendingApproval, Transaction, Task } from "@/lib/types";
import { useGamePoller } from "@/lib/useGamePoller";
import {
  Dice6, LogOut, Check, X, Users, Coins, Home, Clock, Search, Star,
  Trophy, TrendingUp, TrendingDown, Activity, Zap, Award
} from "lucide-react";

// ─── Shared V4 UI Components ──────────────────────────────────────────────────
const GradientCard = ({ children, className = '', innerClassName = '' }: { children: React.ReactNode, className?: string, innerClassName?: string }) => (
  <div className={`p-[2px] bg-gradient-to-r from-[#e63946] via-[#f1c40f] via-[#3498db] to-[#27ae60] rounded-2xl shadow-sm ${className}`}>
    <div className={`bg-white rounded-[14px] h-full ${innerClassName}`}>
      {children}
    </div>
  </div>
);

const StatPill = ({ icon: Icon, label, value, color, pulsing = false }: { icon: any, label: string, value: string, color: string, pulsing?: boolean }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm shadow-sm" style={{ backgroundColor: color }}>
    <Icon size={16} className="opacity-80" />
    <span className="opacity-90 whitespace-nowrap">{label}</span>
    <div className="flex items-center gap-1.5 ml-1">
      {pulsing && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      <span className="bg-black/20 px-2 py-0.5 rounded-full">{value}</span>
    </div>
  </div>
);

function getTeamColor(rank: number) {
  if (rank === 0) return '#f1c40f'; // Gold
  if (rank === 1) return '#bdc3c7'; // Silver
  if (rank === 2) return '#cd7f32'; // Bronze
  return '#3498db'; // Blue default
}

// ─── Admin-only shape ─────────────────────────────────────────────────────────
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
  const map: Record<string, { bg: string, text: string }> = { 
    task_money: { bg: "#e8f5e9", text: "#2e7d32" }, 
    task_property: { bg: "#f3e5f5", text: "#8e24aa" }, 
    buy: { bg: "#e3f2fd", text: "#1565c0" }, 
    rent: { bg: "#ffebee", text: "#c62828" } 
  };
  const style = map[type];
  if (!style) return { bg: "#f1f5f9", text: "#475569" };
  return style;
}

export default function AdminPage() {
  const router = useRouter();
  const { state: gs, refetch: fetchState } = useGamePoller<GameState>("/api/game/state");

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
    <div className="min-h-screen flex items-center justify-center bg-[#fffef0]">
      <div className="w-8 h-8 border-4 border-[#3498db] border-t-transparent rounded-full animate-spin" />
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
    <>
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
          .font-nunito { font-family: 'Nunito', sans-serif; }
          .bg-dotted {
            background-color: #fffef0;
            background-image: radial-gradient(rgba(0,0,0,0.06) 2px, transparent 2px);
            background-size: 20px 20px;
          }
        `}
      </style>

      <div className="min-h-screen flex flex-col font-nunito bg-dotted text-[#2d3436]">
        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-black shadow-xl fade-in ${
            toast.ok ? "bg-[#27ae60] text-white" : "bg-[#e63946] text-white"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Header — V3 style */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner bg-[#e63946]">
                <Dice6 size={24} />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-widest text-[#2d3436]">HUMANOPOLY</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-black tracking-wider text-white bg-gradient-to-r from-[#e63946] to-[#f1c40f]">ADMIN</span>
              </div>
            </div>

            <div className="flex items-center gap-3 hidden md:flex">
              <StatPill icon={Users} label="Teams" value={teams.length.toString()} color="#3498db" />
              <StatPill icon={Clock} label="Pending" value={pendingApprovals.length.toString()} color="#f1c40f" pulsing={pendingApprovals.length > 0} />
              <StatPill icon={Zap} label="Transactions" value={gs.transactions.length.toString()} color="#27ae60" />
              <StatPill icon={Home} label="Properties" value={properties.length.toString()} color="#e63946" />
            </div>

            <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-[#e63946] transition-colors font-bold text-sm bg-gray-100 hover:bg-red-50 px-4 py-2 rounded-full">
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </header>

        {/* Game Progress Strip */}
        <div className="w-full h-3 bg-gradient-to-r from-[#e63946] via-[#f1c40f] via-[#3498db] to-[#27ae60] shrink-0"></div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-6 max-w-[1600px] mx-auto w-full gap-6 items-start">

          {/* Top Section: Leaderboard + Push Property */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] w-full gap-6">
            
            {/* Leaderboard Column */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-black flex items-center gap-2 mb-2">
                <Trophy className="text-[#f1c40f]" /> Live Rankings
              </h2>
              <div className="flex flex-col gap-3">
                {leaderboard.map((team, i) => {
                  const color = getTeamColor(i);
                  const pushed = gs.currentPush[team.teamId];
                  const pushedPropName = pushed ? gs.properties[pushed.propertyId]?.name : null;

                  return (
                    <GradientCard key={team.teamId} innerClassName={`p-3 flex items-center gap-4 relative overflow-hidden ${i === 0 ? 'bg-yellow-50 py-4' : ''}`}>
                      <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: color }}></div>
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-black text-lg text-gray-700 border-2" style={{ borderColor: color }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-black text-lg leading-none mb-1 truncate">{team.displayName}</div>
                        {pushedPropName ? (
                          <div className="text-xs font-bold text-[#3498db] truncate">📍 At {pushedPropName}</div>
                        ) : (
                          <div className="text-xs font-bold text-gray-400">Waiting for assignment...</div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="bg-[#27ae60] text-white px-3 py-1.5 rounded-lg font-black text-sm shadow-sm inline-block mb-1">
                          {formatMoney(team.netWorth)}
                        </div>
                        <div className="text-xs font-bold text-gray-400">{formatMoney(team.balance)} cash &middot; {team.ownedProperties.length} props</div>
                      </div>
                    </GradientCard>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions (Push Property) Column */}
            <div className="flex flex-col gap-4">
               <h2 className="text-xl font-black flex items-center gap-2 mb-2">
                <Activity className="text-[#3498db]" /> Quick Actions
              </h2>

              <GradientCard innerClassName="p-4 flex flex-col gap-3">
                <h3 className="font-black text-gray-700 flex items-center gap-2">
                  <Home size={18} className="text-[#e63946]" /> Push Property
                </h3>
                <select
                  value={pushTeam}
                  onChange={(e) => setPushTeam(e.target.value)}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg px-3 py-2.5 font-bold text-gray-700 outline-none focus:border-[#3498db] transition-colors"
                >
                  <option value="">— Select Team —</option>
                  {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.displayName}</option>)}
                </select>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                    placeholder="Search property..."
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg pl-9 pr-3 py-2 font-bold text-gray-700 outline-none focus:border-[#3498db] transition-colors"
                  />
                  {propResults.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-gray-100 rounded-xl overflow-hidden z-20 shadow-xl font-bold">
                      {propResults.map((p) => (
                        <button
                          key={p.propertyId}
                          onClick={() => setPropertySearch(p.name)}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                        >
                          <span className="text-gray-700">{p.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${p.owner ? "bg-red-50 text-[#e63946]" : "bg-green-50 text-[#27ae60]"}`}>
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
                    <div className="bg-sky-50 border-2 border-[#3498db]/30 rounded-xl p-3 text-sm">
                      <p className="font-black text-[#3498db]">{found.name}</p>
                      <p className="text-gray-500 text-xs mt-0.5 font-bold">Price {formatMoney(found.price)} &middot; Rent {formatMoney(found.rent)}</p>
                    </div>
                  );
                })()}

                <button
                  disabled={!pushTeam || !propertySearch}
                  onClick={pushProperty}
                  className="w-full mt-1 bg-gradient-to-r from-[#e63946] to-[#f1c40f] text-white py-3 rounded-xl font-black shadow-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wide"
                >
                  Push Property
                </button>

                {/* Clear pushes list */}
                <div className="pt-2 mt-1 border-t-2 border-gray-100">
                  <p className="text-xs text-gray-400 font-bold mb-2">Clear Individual Push</p>
                  <div className="flex flex-wrap gap-2">
                    {teams.map((t) => {
                      if (!gs.currentPush[t.teamId]) return null;
                      return (
                         <button
                           key={t.teamId}
                           onClick={() => apiFetch("/api/admin/push", { teamId: t.teamId, clear: true })}
                           className="bg-gray-100 hover:bg-red-50 hover:text-[#e63946] border-2 border-transparent hover:border-[#e63946]/30 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                         >
                           <X size={12} /> {t.displayName}
                         </button>
                      )
                    })}
                    {!teams.some((t) => gs.currentPush[t.teamId]) && (
                      <p className="text-xs text-gray-400 font-bold">No active pushes.</p>
                    )}
                  </div>
                </div>
              </GradientCard>
            </div>
          </div>

          
          {/* ── Tabs Navigation ── */}
          <div className="w-full mt-4">
             <div className="flex flex-wrap gap-2 bg-white border-2 border-gray-100 rounded-2xl p-1.5 w-fit shadow-sm">
              {(["approvals", "properties", "overrides", "log"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-black capitalize transition-colors ${
                    tab === t 
                      ? "bg-[#3498db] text-white shadow-md" 
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {t === "approvals" && pendingApprovals.length > 0 ? `Approvals (${pendingApprovals.length})` : t}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab Contents ── */}
          <div className="w-full mb-12">
            
            {/* APPROVALS TAB */}
            {tab === "approvals" && (
              <div className="flex flex-col gap-4 max-w-3xl">
                <h2 className="text-xl font-black text-gray-800 flex items-center gap-2 mb-2">
                  <Clock className="text-[#e63946]" /> Pending Approvals
                </h2>

                <div className="flex flex-col gap-4">
                  {pendingApprovals.length > 0 ? (
                    pendingApprovals.map((a) => {
                      const team = gs.teams[a.teamId];
                      const prop = gs.properties[a.propertyId];
                      const task = a.taskId ? gs.tasks.find((t) => t.taskId === a.taskId) : null;
                      const badge = typeBadge(a.type);
                      const isMinus = a.type === "buy" || a.type === "rent";
                      const amountColor = isMinus ? "#e63946" : "#27ae60";

                      return (
                        <GradientCard key={a.id} innerClassName="p-5 flex flex-col gap-4">
                          <div className="flex justify-between items-start">
                            <span className="px-3 py-1 text-xs font-black rounded-md tracking-wider shadow-sm uppercase" style={{ backgroundColor: badge.bg, color: badge.text }}>
                              {a.type}
                            </span>
                            <span className="text-sm font-bold text-gray-400">{timeAgo(a.timestamp)}</span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex flex-shrink-0 items-center justify-center font-black shadow-inner" style={{ backgroundColor: amountColor, color: 'white' }}>
                               {isMinus ? <TrendingDown size={24} /> : <TrendingUp size={24} />}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-bold text-gray-500 mb-0.5">{team?.displayName ?? a.teamId}</div>
                              <div className="text-xl font-black leading-tight text-gray-800">{prop?.name ?? a.propertyId}</div>
                              {task && <div className="text-xs font-bold text-[#f1c40f] mt-1">Task: {task.name}</div>}
                            </div>
                            <div className="text-2xl font-black" style={{ color: amountColor }}>
                              {isMinus ? `-${formatMoney(a.amount)}` : `+${formatMoney(a.amount)}`}
                            </div>
                          </div>
                          
                          <div className="flex gap-3 mt-2">
                            <button 
                              onClick={() => approve(a.id, "reject")}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[#e63946] text-[#e63946] font-black text-lg hover:bg-red-50 transition-colors"
                            >
                              <X size={20} /> REJECT
                            </button>
                            <button 
                              onClick={() => approve(a.id, "approve")}
                              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#27ae60] to-[#2ecc71] text-white font-black text-lg shadow-md hover:opacity-90 transition-opacity"
                            >
                              <Check size={20} /> APPROVE
                            </button>
                          </div>
                        </GradientCard>
                      );
                    })
                  ) : (
                    <div className="h-48 border-4 border-dashed border-gray-200 bg-white/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center text-gray-400">
                      <Check size={48} className="mb-2 text-[#27ae60] opacity-50" />
                      <span className="font-black text-xl">All caught up! ✓</span>
                      <span className="font-bold text-sm mt-1">No pending approvals waiting.</span>
                    </div>
                  )}
                </div>

                {allApprovals.filter(a => a.status !== "pending").length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Recent Decisions</h3>
                    <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                      {allApprovals.filter((a) => a.status !== "pending").slice(0, 10).map((a) => {
                         const badge = typeBadge(a.type);
                         return (
                          <div key={a.id} className="px-5 py-3 flex items-center gap-3 border-b-2 border-gray-50 last:border-0">
                            <span className="text-xs font-black px-2 py-1 rounded-md uppercase" style={{ backgroundColor: badge.bg, color: badge.text }}>{a.type}</span>
                            <span className="flex-1 text-sm font-bold text-gray-600 truncate">{gs.teams[a.teamId]?.displayName} — {gs.properties[a.propertyId]?.name}</span>
                            <span className={`text-xs font-black px-3 py-1 rounded-full ${a.status === "approved" ? "bg-green-100 text-[#27ae60]" : "bg-red-100 text-[#e63946]"}`}>
                              {a.status.toUpperCase()}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PROPERTIES TAB */}
            {tab === "properties" && (
              <div className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b-2 border-gray-100 text-xs text-gray-400 font-black uppercase tracking-wider">
                        <th className="px-5 py-4 text-left">Property</th>
                        <th className="px-4 py-4 text-right">Price</th>
                        <th className="px-4 py-4 text-right">Rent</th>
                        <th className="px-4 py-4 text-left">Owner</th>
                        <th className="px-4 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-50">
                      {properties.map((p) => {
                        const owner = p.owner ? gs.teams[p.owner] : null;
                        return (
                          <tr key={p.propertyId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-4 font-black text-gray-700">{p.name}</td>
                            <td className="px-4 py-4 text-right font-bold text-gray-500">{formatMoney(p.price)}</td>
                            <td className="px-4 py-4 text-right font-bold text-[#e63946]">{formatMoney(p.rent)}</td>
                            <td className="px-4 py-4">
                              {owner ? (
                                <span className="bg-green-100 text-[#27ae60] text-xs px-3 py-1 rounded-full font-black">{owner.displayName}</span>
                              ) : (
                                <span className="text-gray-400 font-bold text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-wider ${
                                p.status === "owned" ? "bg-green-100 text-[#27ae60]" :
                                p.status === "locked" ? "bg-yellow-100 text-[#f1c40f]" : "bg-gray-100 text-gray-500"
                              }`}>{p.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* OVERRIDES TAB */}
            {tab === "overrides" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
                
                {/* Manual Balance Adjustment */}
                <GradientCard innerClassName="p-6 flex flex-col gap-4">
                  <h3 className="font-black text-gray-800 flex items-center gap-2 text-lg">
                    <Coins size={20} className="text-[#f1c40f]" /> Manual Balance Adjustment
                  </h3>
                  <div>
                    <label className="text-xs text-gray-500 font-bold mb-1.5 block">Select Team</label>
                    <select value={balTeam} onChange={(e) => setBalTeam(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:border-[#3498db] transition-colors">
                      <option value="">— Choose team —</option>
                      {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.displayName} ({formatMoney(t.balance)})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-bold mb-1.5 block">Amount (+ to add, - to deduct)</label>
                    <input type="number" value={balDelta} onChange={(e) => setBalDelta(e.target.value)} placeholder="e.g. 100 or -50" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:border-[#3498db] transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-bold mb-1.5 block">Reason Log (optional)</label>
                    <input value={balReason} onChange={(e) => setBalReason(e.target.value)} placeholder="e.g. Admin bonus round" className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:border-[#3498db] transition-colors" />
                  </div>
                  <button onClick={editBalance} className="w-full bg-gradient-to-r from-[#3498db] to-[#2980b9] hover:opacity-90 mt-2 text-white font-black py-3 rounded-xl transition shadow-md tracking-wide">
                    APPLY BALANCE CHANGE
                  </button>
                </GradientCard>

                {/* Manual Owner Assignment */}
                <GradientCard innerClassName="p-6 flex flex-col gap-4">
                  <h3 className="font-black text-gray-800 flex items-center gap-2 text-lg">
                    <Home size={20} className="text-[#3498db]" /> Force Property Ownership
                  </h3>
                  <div>
                    <label className="text-xs text-gray-500 font-bold mb-1.5 block">Property</label>
                    <select value={ownerPropId} onChange={(e) => setOwnerPropId(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:border-[#3498db] transition-colors">
                      <option value="">— Choose property —</option>
                      {properties.map((p) => <option key={p.propertyId} value={p.propertyId}>{p.name} {p.owner ? `(${gs.teams[p.owner]?.displayName})` : "(vacant)"}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-bold mb-1.5 block">New Owner</label>
                    <select value={ownerTeamId} onChange={(e) => setOwnerTeamId(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:border-[#3498db] transition-colors">
                      <option value="">— None (clear owner) —</option>
                      {teams.map((t) => <option key={t.teamId} value={t.teamId}>{t.displayName}</option>)}
                    </select>
                  </div>
                  <button disabled={!ownerPropId} onClick={assignOwner} className="w-full bg-gradient-to-r from-[#27ae60] to-[#2ecc71] hover:opacity-90 mt-auto text-white font-black py-3 rounded-xl transition shadow-md disabled:opacity-40 tracking-wide">
                    SET OWNER
                  </button>
                </GradientCard>

                {/* Danger Zone: Reset Game */}
                <div className="md:col-span-2 border-4 border-dashed border-red-200 bg-red-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center mt-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-[#e63946] mb-4">
                    <X size={32} strokeWidth={3} />
                  </div>
                  <h3 className="text-xl font-black text-[#e63946] mb-2 tracking-wide">Danger Zone: Reset Entire Game</h3>
                  <p className="text-sm font-bold text-gray-500 max-w-md mb-6">This will wipe all game progress, balances, properties, and task states. The database will return to its initial seed. This cannot be undone.</p>
                  
                  {!resetConfirm ? (
                    <button
                      onClick={() => setResetConfirm(true)}
                      className="bg-[#e63946] text-white hover:bg-red-700 font-black tracking-wide text-lg px-8 py-3 rounded-xl transition whitespace-nowrap shadow-md"
                    >
                      RESET GAME TO DEFAULT
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-lg text-[#e63946] font-black animate-pulse">Are you absolutely sure?</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={resetGame}
                          className="bg-black text-red-500 hover:bg-red-600 hover:text-white border-2 border-red-500 font-black px-6 py-3 rounded-xl transition shadow-md tracking-widest"
                        >
                          YES, NUKE IT
                        </button>
                        <button
                          onClick={() => setResetConfirm(false)}
                          className="bg-gray-200 text-gray-600 hover:bg-gray-300 font-black px-6 py-3 rounded-xl transition"
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* LOG TAB */}
            {tab === "log" && (
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm max-w-4xl">
                 <h2 className="text-lg font-black text-gray-800 flex items-center gap-2 mb-4">
                  <Activity size={20} className="text-[#3498db]" /> Transaction History
                </h2>
                <div className="flex flex-col gap-4">
                  {gs.transactions.slice(0, 100).map((tx) => {
                    const isPositive = tx.amount >= 0;
                    return (
                      <div key={tx.id} className="flex items-start gap-3 text-sm pb-4 border-b-2 border-gray-50 last:border-0 last:pb-0">
                        <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: isPositive ? '#27ae60' : '#e63946' }}></div>
                        <div className="flex-1">
                          <span className="font-bold text-gray-800 block leading-tight">{gs.teams[tx.teamId]?.displayName ?? tx.teamId} <span className="text-gray-500 font-semibold">— {tx.description}</span></span>
                          <span className="text-xs font-bold text-gray-400 mt-0.5 inline-block">{timeAgo(tx.timestamp)}</span>
                        </div>
                        <div className={`font-black tracking-wide ${isPositive ? "text-[#27ae60]" : "text-[#e63946]"}`}>
                          {isPositive ? "+" : ""}{formatMoney(tx.amount)}
                        </div>
                      </div>
                    )
                  })}
                  {gs.transactions.length === 0 && (
                     <div className="py-8 text-center text-gray-400 font-bold">No activity yet.</div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
