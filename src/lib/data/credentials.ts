// ─────────────────────────────────────────────
// Passwords are loaded from environment variables.
// Set them in .env.local (local) or Vercel dashboard (production).
// See .env.example for the full list of required variables.
// ─────────────────────────────────────────────

export interface Credential {
  teamId: string;
  username: string;
  password: string;
  displayName: string;
  role: "player" | "admin";
  startingBalance: number;
}

export const CREDENTIALS: Credential[] = [
  // ── 6 Player Teams ──
  {
    teamId: "team1",
    username: "team1",
    password: process.env.TEAM1_PASSWORD!,
    displayName: "Team Alpha",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team2",
    username: "team2",
    password: process.env.TEAM2_PASSWORD!,
    displayName: "Team Bravo",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team3",
    username: "team3",
    password: process.env.TEAM3_PASSWORD!,
    displayName: "Team Charlie",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team4",
    username: "team4",
    password: process.env.TEAM4_PASSWORD!,
    displayName: "Team Delta",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team5",
    username: "team5",
    password: process.env.TEAM5_PASSWORD!,
    displayName: "Team Echo",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team6",
    username: "team6",
    password: process.env.TEAM6_PASSWORD!,
    displayName: "Team Foxtrot",
    role: "player",
    startingBalance: 1500,
  },

  // ── 3 Admins ──
  {
    teamId: "admin",
    username: "admin1",
    password: process.env.ADMIN1_PASSWORD!,
    displayName: "Game Master 1",
    role: "admin",
    startingBalance: 0,
  },
  {
    teamId: "admin",
    username: "admin2",
    password: process.env.ADMIN2_PASSWORD!,
    displayName: "Game Master 2",
    role: "admin",
    startingBalance: 0,
  },
  {
    teamId: "admin",
    username: "admin3",
    password: process.env.ADMIN3_PASSWORD!,
    displayName: "Game Master 3",
    role: "admin",
    startingBalance: 0,
  },
];
