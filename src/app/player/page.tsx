"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TeamState, PropertyState, Task, PendingApproval, Transaction } from "@/lib/types";
import { useGamePoller } from "@/lib/useGamePoller";
import { Dice6, LogOut, Home } from "lucide-react";

// ─── Player-page-specific types ───────────────────────────────────────────────
interface PushDetail { property: PropertyState; task: Task | null; pushedAt: number; }
interface LeaderboardEntry { teamId: string; displayName: string; balance: number; netWorth: number; }

interface PlayerState {
  team: TeamState;
  push: PushDetail | null;
  pendingApprovals: PendingApproval[];
  transactions: Transaction[];
  leaderboard: LeaderboardEntry[];
  properties: Record<string, PropertyState>;
}

// ─── V4 Shared Components ─────────────────────────────────────────────────────
const GradientCard = ({
  children,
  className = "",
  innerClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) => (
  <div className={`p-[2px] bg-gradient-to-r from-[#e63946] via-[#f1c40f] via-[#3498db] to-[#27ae60] rounded-2xl shadow-sm ${className}`}>
    <div className={`bg-white rounded-[14px] h-full ${innerClassName}`}>
      {children}
    </div>
  </div>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMoney(n: number) { return `₮${n.toLocaleString()}`; }
function timeAgo(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}
function getRankColor(i: number) {
  if (i === 0) return "#f1c40f";
  if (i === 1) return "#bdc3c7";
  if (i === 2) return "#cd7f32";
  return "#3498db";
}
function getRankMedal(i: number) {
  if (i === 0) return "🥇";
  if (i === 1) return "🥈";
  if (i === 2) return "🥉";
  return `#${i + 1}`;
}

// ─── VacantPropertyActions ────────────────────────────────────────────────────
interface VacantActionsProps {
  prop: PropertyState;
  task: Task;
  team: TeamState;
  taskOptionsOpen: boolean;
  actionLoading: boolean;
  hasPendingFor: (type: string, propId: string) => boolean;
  onDoneTask: () => void;
  onSubmit: (type: "task_money" | "task_property" | "buy" | "rent", propertyId: string, taskId?: number) => void;
  onSkip: () => void;
}

function VacantPropertyActions({
  prop, task, team, taskOptionsOpen, actionLoading,
  hasPendingFor, onDoneTask, onSubmit, onSkip,
}: VacantActionsProps) {
  const isTaskPending =
    hasPendingFor("task_money", prop.propertyId) ||
    hasPendingFor("task_property", prop.propertyId);
  const showTaskOptions = taskOptionsOpen || isTaskPending;

  return (
    <div className="space-y-3">
      {/* Task display */}
      <div className="bg-amber-50 border-2 border-amber-200/60 rounded-xl p-3">
        <p className="text-xs text-amber-600 font-black uppercase tracking-wider mb-1">🎯 Your Task</p>
        <p className="text-sm font-black text-[#2d3436]">{task.name}</p>
        <p className="text-xs font-bold text-[#27ae60] mt-1">+{formatMoney(prop.price)} reward</p>
      </div>

      {!showTaskOptions ? (
        <div className="flex gap-2 flex-wrap">
          <button
            disabled={actionLoading}
            onClick={onDoneTask}
            className="flex-1 bg-[#27ae60] hover:bg-[#2ecc71] text-white font-black text-sm py-3 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✅ Done Task
          </button>
          <button
            disabled={actionLoading || hasPendingFor("buy", prop.propertyId) || team.balance < prop.price}
            onClick={() => onSubmit("buy", prop.propertyId)}
            className="flex-1 bg-[#3498db] hover:bg-[#2980b9] text-white font-black text-sm py-3 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {hasPendingFor("buy", prop.propertyId) ? "⏳ Pending…" : team.balance < prop.price ? "No funds" : "🏠 Buy"}
          </button>
          <button
            disabled={actionLoading}
            onClick={onSkip}
            className="bg-gray-100 hover:bg-gray-200 border-2 border-gray-200 text-gray-500 hover:text-gray-700 font-black text-sm py-3 px-4 rounded-xl transition"
          >
            Skip
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <button
              disabled={actionLoading || isTaskPending}
              onClick={() => onSubmit("task_money", prop.propertyId, task.taskId)}
              className="flex-1 bg-[#27ae60] hover:bg-[#2ecc71] text-white font-black text-sm py-3 px-2 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed leading-tight"
            >
              {hasPendingFor("task_money", prop.propertyId) ? "⏳ Pending…" : "💰 Keep Money"}
            </button>
            <button
              disabled={actionLoading || isTaskPending}
              onClick={() => onSubmit("task_property", prop.propertyId, task.taskId)}
              className="flex-1 bg-gradient-to-r from-[#8e24aa] to-[#ab47bc] hover:opacity-90 text-white font-black text-sm py-3 px-2 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed leading-tight"
            >
              {hasPendingFor("task_property", prop.propertyId) ? "⏳ Pending…" : "🏠 Get Property"}
            </button>
          </div>
          <div className="flex gap-2 w-full">
            <button disabled className="flex-1 bg-gray-100 border-2 border-gray-200 text-gray-400 font-black text-sm py-2.5 rounded-xl opacity-40 cursor-not-allowed">
              🏠 Buy
            </button>
            <button disabled className="bg-gray-100 border-2 border-gray-200 text-gray-400 font-black text-sm py-2.5 px-4 rounded-xl w-1/3 opacity-40 cursor-not-allowed">
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RentAction ───────────────────────────────────────────────────────────────
interface RentActionProps {
  prop: PropertyState;
  team: TeamState;
  pushedAt: number;
  transactions: Transaction[];
  actionLoading: boolean;
  hasPendingFor: (type: string, propId: string) => boolean;
  onSubmit: (type: "rent", propertyId: string) => void;
}

function RentAction({ prop, team, pushedAt, transactions, actionLoading, hasPendingFor, onSubmit }: RentActionProps) {
  const hasPaidRent = transactions.some(
    (tx) => tx.type === "rent" && tx.propertyId === prop.propertyId && tx.timestamp >= pushedAt
  );
  return (
    <button
      disabled={hasPaidRent || actionLoading || hasPendingFor("rent", prop.propertyId) || team.balance < prop.rent}
      onClick={() => onSubmit("rent", prop.propertyId)}
      className={`w-full font-black py-3 rounded-xl transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
        hasPaidRent
          ? "bg-gray-100 border-2 border-gray-200 text-gray-400"
          : "bg-[#e63946] hover:bg-red-600 text-white"
      }`}
    >
      {hasPaidRent
        ? "✅ Rent Paid"
        : hasPendingFor("rent", prop.propertyId)
        ? "⏳ Rent Request Pending…"
        : team.balance < prop.rent
        ? "Insufficient balance"
        : `💸 Pay Rent ${formatMoney(prop.rent)}`}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [taskOptionsOpen, setTaskOptionsOpen] = useState(false);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const { state, refetch: fetchState } = useGamePoller<PlayerState>("/api/game/state", {
    onFirstLoad: () => setLoading(false),
  });

  // Reset task options when a new push arrives
  useEffect(() => {
    setTaskOptionsOpen(false);
  }, [state?.push?.pushedAt]);

  async function submitRequest(
    type: "task_money" | "task_property" | "buy" | "rent",
    propertyId: string,
    taskId?: number
  ) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/game/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, propertyId, taskId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Error", false); }
      else { showToast("Request sent! Waiting for admin ✓"); fetchState(); }
    } catch { showToast("Network error", false); }
    setActionLoading(false);
  }

  async function skipTile() {
    const res = await fetch("/api/game/skip", { method: "POST" });
    if (res.ok) fetchState();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffef0]">
      <div className="w-8 h-8 border-4 border-[#3498db] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!state) return null;

  const { team, push, pendingApprovals, transactions, leaderboard, properties } = state;
  const netWorth = team.balance + team.ownedProperties.reduce((s, pid) => s + (properties[pid]?.price ?? 0), 0);
  const myRank = leaderboard.findIndex((e) => e.teamId === team.teamId) + 1;

  const hasPendingFor = (type: string, propId: string) =>
    pendingApprovals.some((a) => a.type === type && a.propertyId === propId && a.status === "pending");

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        .font-nunito { font-family: 'Nunito', sans-serif; }
        .bg-dotted {
          background-color: #fffef0;
          background-image: radial-gradient(rgba(0,0,0,0.06) 2px, transparent 2px);
          background-size: 20px 20px;
        }
      `}</style>

      <div className="min-h-screen flex flex-col font-nunito bg-dotted text-[#2d3436]">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl text-sm font-black shadow-xl ${
            toast.ok ? "bg-[#27ae60] text-white" : "bg-[#e63946] text-white"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            {/* Logo + Team Name */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-inner bg-[#e63946]">
                <Dice6 size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase leading-none">Humanopoly</p>
                <h1 className="text-base font-black leading-tight text-[#2d3436]">{team.displayName}</h1>
              </div>
            </div>

            {/* Balance + rank */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-lg font-black text-[#3498db] leading-none">{formatMoney(team.balance)}</p>
                <p className="text-[10px] font-bold text-gray-400 leading-none mt-0.5">NW: <span className="text-[#27ae60]">{formatMoney(netWorth)}</span></p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="bg-gradient-to-r from-[#e63946] to-[#f1c40f] text-white text-xs font-black px-2.5 py-1 rounded-full shadow-sm">
                  #{myRank}
                </div>
                <button onClick={logout} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-[#e63946] font-bold transition">
                  <LogOut size={10} /> Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Progress strip */}
        <div className="w-full h-2 bg-gradient-to-r from-[#e63946] via-[#f1c40f] via-[#3498db] to-[#27ae60] shrink-0" />

        {/* Content */}
        <div className="max-w-lg mx-auto px-4 pt-4 pb-10 w-full space-y-5">

          {/* ── Current Property Panel ── */}
          {push ? (() => {
            const { property: prop, task } = push;
            const isOwn = prop.owner === team.teamId;
            const isOther = prop.owner && !isOwn;

            const accentColor = isOther ? "#e63946" : isOwn ? "#27ae60" : "#3498db";
            const statusLabel = isOwn ? "You Own This ✓" : isOther
              ? `Owned by ${leaderboard.find((l) => l.teamId === prop.owner)?.displayName ?? prop.owner}`
              : "Vacant";

            return (
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">📍 You Landed On</p>
                <GradientCard innerClassName="p-5 space-y-4">
                  {/* Property name + status */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-black text-[#2d3436] leading-tight">{prop.name}</h2>
                      <p className="text-sm font-bold mt-0.5" style={{ color: accentColor }}>{statusLabel}</p>
                    </div>
                    <span
                      className="text-xs font-black px-3 py-1.5 rounded-full text-white shadow-sm"
                      style={{ backgroundColor: accentColor }}
                    >
                      {isOwn ? "Owned" : isOther ? "Pay Rent" : "Vacant"}
                    </span>
                  </div>

                  {/* Price / Rent stat row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3">
                      <p className="text-xs font-black text-gray-400 mb-0.5">Price</p>
                      <p className="font-black text-[#2d3436] text-lg">{formatMoney(prop.price)}</p>
                    </div>
                    <div className="bg-gray-50 border-2 border-gray-100 rounded-xl p-3">
                      <p className="text-xs font-black text-gray-400 mb-0.5">Rent</p>
                      <p className="font-black text-[#e63946] text-lg">{formatMoney(prop.rent)}</p>
                    </div>
                  </div>

                  {/* Case A: Vacant with task */}
                  {!prop.owner && task && (
                    <VacantPropertyActions
                      prop={prop}
                      task={task}
                      team={team}
                      taskOptionsOpen={taskOptionsOpen}
                      actionLoading={actionLoading}
                      hasPendingFor={hasPendingFor}
                      onDoneTask={() => setTaskOptionsOpen(true)}
                      onSubmit={submitRequest}
                      onSkip={skipTile}
                    />
                  )}

                  {/* Case B: Owned by another team */}
                  {isOther && (
                    <RentAction
                      prop={prop}
                      team={team}
                      pushedAt={push.pushedAt}
                      transactions={transactions}
                      actionLoading={actionLoading}
                      hasPendingFor={hasPendingFor}
                      onSubmit={submitRequest}
                    />
                  )}

                  {/* Case C: Owned by self */}
                  {isOwn && (
                    <div className="bg-green-50 border-2 border-green-200/60 rounded-xl p-3 text-center">
                      <p className="text-sm font-black text-[#27ae60]">
                        Others pay you <span className="text-lg">{formatMoney(prop.rent)}</span> when they land here
                      </p>
                    </div>
                  )}
                </GradientCard>
              </div>
            );
          })() : (
            <GradientCard innerClassName="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <p className="text-4xl mb-3">🎲</p>
              <p className="font-black text-xl text-[#2d3436]">Waiting for your tile…</p>
              <p className="font-bold text-sm text-gray-400 mt-1">Admin will assign your property shortly</p>
            </GradientCard>
          )}

          {/* ── Owned Properties ── */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
              🏠 Properties Owned ({team.ownedProperties.length})
            </p>
            {team.ownedProperties.length === 0 ? (
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-center shadow-sm">
                <p className="font-bold text-gray-400 text-sm">No properties yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {team.ownedProperties.map((pid) => {
                  const p = properties[pid];
                  if (!p) return null;
                  return (
                    <GradientCard key={pid} innerClassName="px-4 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Home size={16} className="text-[#3498db]" />
                        <span className="font-black text-[#2d3436]">{p.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-400">Rent</p>
                        <p className="text-sm font-black text-[#27ae60]">{formatMoney(p.rent)}</p>
                      </div>
                    </GradientCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Transaction History ── */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">📋 Transactions</p>
            {transactions.length === 0 ? (
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-5 text-center shadow-sm">
                <p className="font-bold text-gray-400 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="bg-white border-2 border-gray-100 rounded-2xl divide-y-2 divide-gray-50 overflow-hidden shadow-sm">
                {transactions.map((tx) => {
                  const isPos = tx.amount >= 0;
                  return (
                    <div key={tx.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isPos ? "#27ae60" : "#e63946" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#2d3436] truncate">{tx.description}</p>
                        <p className="text-xs font-bold text-gray-400">{timeAgo(tx.timestamp)}</p>
                      </div>
                      <span className={`text-sm font-black tabular-nums ${isPos ? "text-[#27ae60]" : "text-[#e63946]"}`}>
                        {isPos ? "+" : ""}{formatMoney(tx.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Leaderboard ── */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">🏆 Leaderboard</p>
            <div className="flex flex-col gap-2">
              {leaderboard.map((entry, i) => {
                const color = getRankColor(i);
                const isMe = entry.teamId === team.teamId;
                return (
                  <GradientCard key={entry.teamId} innerClassName={`px-4 py-3 flex items-center gap-3 relative overflow-hidden ${isMe ? "bg-sky-50" : ""}`}>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: color }} />
                    <span className="text-base w-6 text-center font-black" style={{ color }}>
                      {getRankMedal(i)}
                    </span>
                    <span className={`flex-1 font-black text-sm ${isMe ? "text-[#3498db]" : "text-[#2d3436]"}`}>
                      {entry.displayName} {isMe ? "(You)" : ""}
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-black text-[#27ae60]">{formatMoney(entry.netWorth)}</p>
                      <p className="text-[10px] font-bold text-gray-400">{formatMoney(entry.balance)} cash</p>
                    </div>
                  </GradientCard>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
