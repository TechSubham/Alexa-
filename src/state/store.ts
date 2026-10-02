import type { CookingSession } from "../types.js";

export let activeSession: CookingSession | null = null;

export function setActiveSession(session: CookingSession | null) {
  activeSession = session;
}