// Client-only "stay logged in for 30 days" preference. No credentials are stored here —
// only a preference flag and, when enabled, an expiry timestamp. Supabase's own session
// tokens (in localStorage, managed by supabase-js) remain the actual auth state; this just
// decides whether we sign the user out early.
const EXPIRY_KEY = "ledger-session-expiry";
const TAB_MARKER_KEY = "ledger-tab-open";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function setPersistentLogin(persist: boolean) {
  if (typeof window === "undefined") return;
  if (persist) {
    window.localStorage.setItem(EXPIRY_KEY, String(Date.now() + THIRTY_DAYS_MS));
  } else {
    window.localStorage.removeItem(EXPIRY_KEY);
  }
}

export function clearPersistentLogin() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(EXPIRY_KEY);
  window.sessionStorage.removeItem(TAB_MARKER_KEY);
}

export function markTabSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TAB_MARKER_KEY, "1");
}

/**
 * Returns true if the session should be force-expired: either the 30-day
 * "stay logged in" window has passed, or the user didn't check that box and
 * this is a fresh browser session (no live tab marker from before).
 */
export function sessionShouldExpire(): boolean {
  if (typeof window === "undefined") return false;

  const expiry = window.localStorage.getItem(EXPIRY_KEY);
  if (expiry) {
    return Date.now() > Number(expiry);
  }

  return window.sessionStorage.getItem(TAB_MARKER_KEY) !== "1";
}
