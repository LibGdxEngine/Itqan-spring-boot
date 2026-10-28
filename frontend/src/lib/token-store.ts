// Access/refresh token storage plus silent refresh.
// Access tokens are short-lived (15 min); before one expires we trade the refresh token
// for a new pair so users are not logged out mid-session.

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const ACCESS_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

// Refresh this long before the access token actually expires.
const REFRESH_MARGIN_MS = 60_000;

let refreshInFlight: Promise<string | null> | null = null;

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  return isBrowser() ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
}

function getRefreshToken(): string | null {
  return isBrowser() ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
}

export function setTokens(accessToken: string, refreshToken?: string | null) {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearTokens() {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function expiresAtMs(jwt: string): number | null {
  try {
    const payload = jwt.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = JSON.parse(json).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Exchanges the refresh token for a new token pair. Concurrent callers share one request,
 * because the backend rotates refresh tokens and a second use of the old one would fail.
 * Resolves to null (and clears the session) when the refresh token is missing or rejected.
 */
export function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return Promise.resolve(null);

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        clearTokens();
        return null;
      }
      const data: { token: string; refreshToken?: string } = await response.json();
      setTokens(data.token, data.refreshToken);
      return data.token;
    } catch {
      // Network failure: keep the session; the caller's request will surface the error.
      return getAccessToken();
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Returns an access token, refreshing it first if it is about to expire. */
export async function getValidAccessToken(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;
  const expiresAt = expiresAtMs(token);
  if (expiresAt !== null && expiresAt - Date.now() < REFRESH_MARGIN_MS) {
    return refreshAccessToken();
  }
  return token;
}
