import { API_BASE_URL } from "./config";

let authBridge = {
  getSession: () => null,
  setSession: () => {},
  clearSession: () => {}
};

let refreshPromise = null;

export class ApiClientError extends Error {
  constructor({
    status,
    message,
    requestId = null,
    errorCode = null,
    path = null,
    details = null
  }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.requestId = requestId;
    this.errorCode = errorCode;
    this.path = path;
    this.details = details;
  }
}

export function configureApiAuth(nextBridge) {
  authBridge = {
    ...authBridge,
    ...nextBridge
  };
}

export async function apiRequest(
  endpoint,
  {
    method = "GET",
    body,
    headers,
    auth = false,
    version,
    signal
  } = {}
) {
  return performRequest(
    endpoint,
    { method, body, headers, auth, version, signal },
    true
  );
}

async function performRequest(endpoint, options, canRefresh) {
  const session = authBridge.getSession();
  const requestHeaders = new Headers(options.headers ?? {});

  requestHeaders.set("Accept", "application/json");
  requestHeaders.set("Accept-Language", getPreferredLocale());

  if (options.body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (options.version !== undefined && !requestHeaders.has("If-Match")) {
    requestHeaders.set("If-Match", `"${options.version}"`);
  }

  if (options.auth && session?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method,
    headers: requestHeaders,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal
  });

  if (
    response.status === 401 &&
    options.auth &&
    canRefresh &&
    session?.refreshToken
  ) {
    try {
      await refreshAccessToken(session.refreshToken);
      return performRequest(endpoint, options, false);
    } catch (error) {
      authBridge.clearSession();
      throw error;
    }
  }

  const payload = await parsePayload(response);
  const requestId = response.headers.get("X-Request-Id");
  const eTag = parseEtag(response.headers.get("ETag"));

  if (!response.ok || payload?.success === false) {
    const apiError = payload?.error ?? {};

    throw new ApiClientError({
      status: response.status,
      message:
        apiError.message ?? payload?.message ?? response.statusText ?? "Request failed",
      requestId: apiError.requestId ?? requestId,
      errorCode: apiError.error ?? null,
      path: apiError.path ?? null,
      details: apiError
    });
  }

  return {
    data: payload?.data ?? null,
    message: payload?.message ?? null,
    requestId,
    eTag,
    raw: payload
  };
}

async function refreshAccessToken(refreshToken) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh_token`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Language": getPreferredLocale(),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
      });

      const payload = await parsePayload(response);

      if (!response.ok || payload?.success === false) {
        throw new ApiClientError({
          status: response.status,
          message:
            payload?.error?.message ??
            payload?.message ??
            response.statusText ??
            "Could not refresh access token",
          requestId: payload?.error?.requestId ?? response.headers.get("X-Request-Id")
        });
      }

      const currentSession = authBridge.getSession();
      const nextSession = {
        accessToken: payload?.data,
        refreshToken: currentSession?.refreshToken ?? refreshToken
      };

      authBridge.setSession(nextSession);

      return nextSession;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function parsePayload(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseEtag(eTag) {
  if (!eTag) {
    return null;
  }

  return Number.parseInt(eTag.replace(/"/g, ""), 10);
}

function getPreferredLocale() {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return navigator.language || "en";
}
