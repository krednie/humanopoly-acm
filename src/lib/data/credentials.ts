// ─────────────────────────────────────────────
// EDIT THIS FILE to change team credentials
// and the admin password.
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
  // 6 Teams
  {
    teamId: "team1",
    username: "team1",
    password: "pass1",
    displayName: "Team Alpha",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team2",
    username: "team2",
    password: "pass2",
    displayName: "Team Bravo",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team3",
    username: "team3",
    password: "pass3",
    displayName: "Team Charlie",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team4",
    username: "team4",
    password: "pass4",
    displayName: "Team Delta",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team5",
    username: "team5",
    password: "pass5",
    displayName: "Team Echo",
    role: "player",
    startingBalance: 1500,
  },
  {
    teamId: "team6",
    username: "team6",
    password: "pass6",
    displayName: "Team Foxtrot",
    role: "player",
    startingBalance: 1500,
  },
  // Admin
  {
    teamId: "admin",
    username: "admin",
    password: "admin123",
    displayName: "Game Master",
    role: "admin",
    startingBalance: 0,
  },
];
