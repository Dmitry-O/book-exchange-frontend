const SESSION_STORAGE_KEY = "book-exchange/session";
const POST_LOGOUT_REDIRECT_KEY = "book-exchange/post-logout";

export function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);

    if (!parsed?.accessToken || !parsed?.refreshToken) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function markPostLogoutRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(POST_LOGOUT_REDIRECT_KEY, "1");
}

export function hasPostLogoutRedirect() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(POST_LOGOUT_REDIRECT_KEY) === "1";
}

export function clearPostLogoutRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(POST_LOGOUT_REDIRECT_KEY);
}
