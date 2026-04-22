import { API_BASE_URL } from "./config";
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession
} from "../auth/session";
import { readStoredLocale } from "../i18n/locale";

let authBridge = {
  getSession: () => null,
  setSession: () => {},
  clearSession: () => {}
};

let refreshPromise = null;

const TRANSPORT_ERROR_TEXT = {
  de: "Verbindung zum Server fehlgeschlagen. Prüfe, ob das Backend läuft, und versuche es erneut.",
  en: "Could not connect to the server. Check that the backend is running and try again.",
  ru: "Не удалось подключиться к серверу. Проверьте, что бэкенд запущен, и попробуйте снова."
};

const ABORTED_REQUEST_TEXT = {
  de: "Die Anfrage wurde abgebrochen.",
  en: "The request was aborted.",
  ru: "Запрос был прерван."
};

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
    locale,
    version,
    signal
  } = {}
) {
  return performRequest(
    endpoint,
    { method, body, headers, auth, locale, version, signal },
    true
  );
}

async function performRequest(endpoint, options, canRefresh) {
  const session = getCurrentSession();
  const requestHeaders = new Headers(options.headers ?? {});

  requestHeaders.set("Accept", "application/json");
  requestHeaders.set("Accept-Language", options.locale ?? getPreferredLocale());

  if (options.body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (options.version !== undefined && !requestHeaders.has("If-Match")) {
    requestHeaders.set("If-Match", `"${options.version}"`);
  }

  if (options.auth && session?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${session.accessToken}`);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method,
      headers: requestHeaders,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal
    });
  } catch (error) {
    if (options.auth && canRefresh && session?.refreshToken) {
      try {
        await refreshAccessToken(session.refreshToken);
        return performRequest(endpoint, options, false);
      } catch (refreshError) {
        if (isAuthTerminalError(refreshError)) {
          clearAuthSession();
        }

        throw refreshError;
      }
    }

    throw normalizeTransportError(error);
  }

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
      clearAuthSession();
      throw error;
    }
  }

  const payload = await parsePayload(response);
  const requestId = response.headers.get("X-Request-Id");
  const eTag = parseEtag(response.headers.get("ETag"));

  if (!response.ok || payload?.success === false) {
    if (response.status === 401 && options.auth) {
      clearAuthSession();
    }

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
      let response;

      try {
        response = await fetch(`${API_BASE_URL}/auth/refresh_token`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Language": getPreferredLocale(),
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ refreshToken })
        });
      } catch (error) {
        throw normalizeTransportError(error);
      }

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

      const currentSession = getCurrentSession();
      const nextSession = {
        accessToken: payload?.data,
        refreshToken: currentSession?.refreshToken ?? refreshToken
      };

      writeStoredSession(nextSession);
      authBridge.setSession(nextSession);

      return nextSession;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

function getCurrentSession() {
  return authBridge.getSession() ?? readStoredSession();
}

function clearAuthSession() {
  clearStoredSession();
  authBridge.clearSession();
}

function isAuthTerminalError(error) {
  return error instanceof ApiClientError;
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
  return readStoredLocale();
}

function normalizeTransportError(error) {
  if (error instanceof ApiClientError) {
    return error;
  }

  const locale = getPreferredLocale();
  const isAborted = error?.name === "AbortError";

  return new ApiClientError({
    status: 0,
    message: isAborted
      ? getLocalizedText(ABORTED_REQUEST_TEXT, locale)
      : getLocalizedText(TRANSPORT_ERROR_TEXT, locale),
    details: {
      cause: error?.message ?? null,
      errorName: error?.name ?? null
    }
  });
}

function getLocalizedText(map, locale) {
  return map[locale] ?? map.en;
}
