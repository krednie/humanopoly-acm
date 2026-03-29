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
  role: "player" | "admin" | "superadmin";
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

  // ── 6 Team Admins (each assigned to a team by super admin) ──
  {
    teamId: "admin1",
    username: "admin1",
    password: process.env.ADMIN1_PASSWORD!,
    displayName: "Admin 1",
    role: "admin",
    startingBalance: 0,
  },
  {
    teamId: "admin2",
    username: "admin2",
    password: process.env.ADMIN2_PASSWORD!,
    displayName: "Admin 2",
    role: "admin",
    startingBalance: 0,
  },
  {
    teamId: "admin3",
    username: "admin3",
    password: process.env.ADMIN3_PASSWORD!,
    displayName: "Admin 3",
    role: "admin",
    startingBalance: 0,
  },
  {
    teamId: "admin4",
    username: "admin4",
    password: process.env.ADMIN4_PASSWORD!,
    displayName: "Admin 4",
    role: "admin",
    startingBalance: 0,
  },
  {
    teamId: "admin5",
    username: "admin5",
    password: process.env.ADMIN5_PASSWORD!,
    displayName: "Admin 5",
    role: "admin",
    startingBalance: 0,
  },
  {
    teamId: "admin6",
    username: "admin6",
    password: process.env.ADMIN6_PASSWORD!,
    displayName: "Admin 6",
    role: "admin",
    startingBalance: 0,
  },

  // ── Super Admin ──
  {
    teamId: "superadmin",
    username: "superadmin",
    password: process.env.SUPERADMIN_PASSWORD!,
    displayName: "Game Master",
    role: "superadmin",
    startingBalance: 0,
  },
];
