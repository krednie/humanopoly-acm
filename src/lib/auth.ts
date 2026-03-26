import { CREDENTIALS, Credential } from "./data/credentials";

export interface Session {
  teamId: string;
  displayName: string;
  role: "player" | "admin";
}

const COOKIE_NAME = "humanopoly_session";

export function findCredential(username: string, password: string): Credential | null {
  return CREDENTIALS.find((c) => c.username === username && c.password === password) ?? null;
}

export function encodeSession(session: Session): string {
  return Buffer.from(JSON.stringify(session)).toString("base64");
}

export function decodeSession(cookie: string): Session | null {
  try {
    return JSON.parse(Buffer.from(cookie, "base64").toString("utf-8")) as Session;
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
