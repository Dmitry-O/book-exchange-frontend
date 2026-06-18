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
const demoEmailSandboxSessionPromises = new Map();
let demoEmailSandboxEnabled = false;

export const DEMO_EMAIL_SANDBOX_HEADER = "X-Demo-Email-Sandbox-Id";
export const DEMO_EMAIL_SANDBOX_CHANGED_EVENT = "book-exchange:demo-email-sandbox-changed";
export const DEMO_EMAIL_SANDBOX_MESSAGES_CHANGED_EVENT =
  "book-exchange:demo-email-sandbox-messages-changed";

const DEMO_EMAIL_SANDBOX_STORAGE_KEY = "book-exchange/demo-email-sandbox-id";
const DEMO_EMAIL_SANDBOX_BY_EMAIL_STORAGE_KEY = "book-exchange/demo-email-sandbox-by-email";
const DEMO_EMAIL_ACTIVE_EMAIL_STORAGE_KEY = "book-exchange/demo-email-active-email";
const DEMO_EMAIL_ACTIVE_SANDBOX_STORAGE_KEY = "book-exchange/demo-email-active-sandbox-id";
const DEMO_EMAIL_RELATED_ENDPOINTS = [
  "/auth/register",
  "/auth/forgot_password",
  "/auth/resend_confirmation_email",
  "/auth/initiate_delete_account",
  "/demo/email-sandbox"
];

const TRANSPORT_ERROR_TEXT = {
  de: "Etwas ist schiefgelaufen. Bitte versuche es später noch einmal.",
  en: "Something went wrong. Please try again a little later.",
  ru: "Что-то пошло не так. Попробуйте повторить чуть позже."
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

export function configureDemoEmailSandbox(enabled) {
  demoEmailSandboxEnabled = enabled === true;
}

export function normalizeDemoEmailAddress(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function readActiveDemoEmailAddress() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return normalizeDemoEmailAddress(window.localStorage.getItem(DEMO_EMAIL_ACTIVE_EMAIL_STORAGE_KEY));
  } catch {
    return "";
  }
}

export function readActiveDemoEmailSandboxId() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    const sandboxId =
      window.localStorage.getItem(DEMO_EMAIL_ACTIVE_SANDBOX_STORAGE_KEY) ??
      window.localStorage.getItem(DEMO_EMAIL_SANDBOX_STORAGE_KEY) ??
      "";

    return isValidDemoEmailSandboxId(sandboxId) ? sandboxId : "";
  } catch {
    return "";
  }
}

export function readDemoEmailSandboxId(email = "") {
  if (typeof window === "undefined") {
    return "";
  }

  const normalizedEmail = normalizeDemoEmailAddress(email);

  if (normalizedEmail) {
    return readDemoEmailSandboxIdByEmail(normalizedEmail);
  }

  const activeEmail = readActiveDemoEmailAddress();
  const activeSandboxId = activeEmail ? readDemoEmailSandboxIdByEmail(activeEmail) : "";

  if (activeSandboxId) {
    return activeSandboxId;
  }

  return readActiveDemoEmailSandboxId();
}

export function writeDemoEmailSandboxId(sandboxId, email = "") {
  if (typeof window === "undefined" || !isValidDemoEmailSandboxId(sandboxId)) {
    return;
  }

  try {
    const previousSandboxId = readActiveDemoEmailSandboxId();
    window.localStorage.setItem(DEMO_EMAIL_SANDBOX_STORAGE_KEY, sandboxId);
    window.localStorage.setItem(DEMO_EMAIL_ACTIVE_SANDBOX_STORAGE_KEY, sandboxId);

    const normalizedEmail = normalizeDemoEmailAddress(email) || readActiveDemoEmailAddress();

    if (normalizedEmail) {
      writeActiveDemoEmailAddress(normalizedEmail);
      writeDemoEmailSandboxIdByEmail(normalizedEmail, sandboxId);
    }

    if (previousSandboxId !== sandboxId) {
      window.dispatchEvent(new Event(DEMO_EMAIL_SANDBOX_CHANGED_EVENT));
    }
  } catch {
    // The demo inbox still works for the current request even if storage is blocked.
  }
}

export function clearDemoEmailSandboxId(email = "") {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const activeEmail = readActiveDemoEmailAddress();
    const normalizedEmail = normalizeDemoEmailAddress(email) || readActiveDemoEmailAddress();

    if (normalizedEmail) {
      const sandboxByEmail = readDemoEmailSandboxMap();
      delete sandboxByEmail[normalizedEmail];
      writeDemoEmailSandboxMap(sandboxByEmail);
    }

    if (!normalizedEmail || normalizedEmail === activeEmail) {
      window.localStorage.removeItem(DEMO_EMAIL_SANDBOX_STORAGE_KEY);
      window.localStorage.removeItem(DEMO_EMAIL_ACTIVE_SANDBOX_STORAGE_KEY);
      window.localStorage.removeItem(DEMO_EMAIL_ACTIVE_EMAIL_STORAGE_KEY);
      window.dispatchEvent(new Event(DEMO_EMAIL_SANDBOX_CHANGED_EVENT));
    }
  } catch {
    // Ignore storage cleanup issues.
  }
}

export async function activateDemoEmailSandboxForEmail(email, locale) {
  if (!demoEmailSandboxEnabled) {
    return "";
  }

  const normalizedEmail = normalizeDemoEmailAddress(email);

  if (!normalizedEmail) {
    return readDemoEmailSandboxId();
  }

  writeActiveDemoEmailAddress(normalizedEmail);

  const existingSandboxId = readDemoEmailSandboxIdByEmail(normalizedEmail);

  if (existingSandboxId) {
    writeDemoEmailSandboxId(existingSandboxId, normalizedEmail);
  } else {
    clearActiveDemoEmailSandboxId();
  }

  const promiseKey = `${normalizedEmail}:${existingSandboxId || "new"}`;

  if (!demoEmailSandboxSessionPromises.has(promiseKey)) {
    demoEmailSandboxSessionPromises.set(
      promiseKey,
      createDemoEmailSandboxSession(locale, existingSandboxId, normalizedEmail)
        .finally(() => {
          demoEmailSandboxSessionPromises.delete(promiseKey);
        })
    );
  }

  const sandboxId = await demoEmailSandboxSessionPromises.get(promiseKey);
  return sandboxId || existingSandboxId;
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
  const demoEmail = getDemoEmailForRequest(endpoint, options.body);
  let storedDemoEmailSandboxId = readDemoEmailSandboxId(demoEmail);

  const requestLocale = options.locale ?? getPreferredLocale();

  requestHeaders.set("Accept", "application/json");
  requestHeaders.set("Accept-Language", requestLocale);

  if (!storedDemoEmailSandboxId && shouldPrepareDemoEmailSandboxSession(endpoint)) {
    storedDemoEmailSandboxId = demoEmail
      ? await activateDemoEmailSandboxForEmail(demoEmail, requestLocale)
      : await ensureDemoEmailSandboxSession(requestLocale);
  }

  if (
    storedDemoEmailSandboxId &&
    shouldAttachDemoEmailSandboxHeader(endpoint) &&
    !requestHeaders.has(DEMO_EMAIL_SANDBOX_HEADER)
  ) {
    requestHeaders.set(DEMO_EMAIL_SANDBOX_HEADER, storedDemoEmailSandboxId);
  }

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
      if (isAuthTerminalError(error)) {
        clearAuthSession();
      }
      throw error;
    }
  }

  const payload = await parsePayload(response);
  const requestId = response.headers.get("X-Request-Id");
  const eTag = parseEtag(response.headers.get("ETag"));
  const responseDemoEmailSandboxId = response.headers.get(DEMO_EMAIL_SANDBOX_HEADER);
  const payloadDemoEmailSandboxId = payload?.data?.sandboxId;

  if (demoEmailSandboxEnabled && (responseDemoEmailSandboxId || payloadDemoEmailSandboxId)) {
    const nextSandboxId = responseDemoEmailSandboxId || payloadDemoEmailSandboxId;

    if (demoEmail && readActiveDemoEmailAddress() !== demoEmail) {
      writeDemoEmailSandboxIdByEmail(demoEmail, nextSandboxId);
    } else if (demoEmail || endpoint.startsWith("/demo/email-sandbox/session")) {
      writeDemoEmailSandboxId(nextSandboxId, demoEmail);
    }
  }

  if (!response.ok || payload?.success === false) {
    if (response.status === 401 && options.auth) {
      clearAuthSession();
    }

    const apiError = payload?.error ?? {};

    throw new ApiClientError({
      status: response.status,
      message:
        apiError.message ?? payload?.message ?? getLocalizedText(TRANSPORT_ERROR_TEXT, getPreferredLocale()),
      requestId: apiError.requestId ?? requestId,
      errorCode: apiError.error ?? null,
      path: apiError.path ?? null,
      details: apiError
    });
  }

  if (demoEmailSandboxEnabled && typeof window !== "undefined" && options.method !== "GET") {
    window.dispatchEvent(new Event(DEMO_EMAIL_SANDBOX_MESSAGES_CHANGED_EVENT));
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
            getLocalizedText(TRANSPORT_ERROR_TEXT, getPreferredLocale()),
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
  return error instanceof ApiClientError && [400, 401, 403, 404].includes(error.status);
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

function shouldAttachDemoEmailSandboxHeader(endpoint) {
  return demoEmailSandboxEnabled && DEMO_EMAIL_RELATED_ENDPOINTS.some(
    (item) => endpoint === item || endpoint.startsWith(`${item}?`)
  );
}

function shouldPrepareDemoEmailSandboxSession(endpoint) {
  return shouldAttachDemoEmailSandboxHeader(endpoint) && !endpoint.startsWith("/demo/email-sandbox");
}

async function ensureDemoEmailSandboxSession(locale) {
  if (!demoEmailSandboxEnabled) {
    return "";
  }

  const existingSandboxId = readDemoEmailSandboxId();

  if (existingSandboxId) {
    return existingSandboxId;
  }

  const promiseKey = "anonymous";

  if (!demoEmailSandboxSessionPromises.has(promiseKey)) {
    demoEmailSandboxSessionPromises.set(
      promiseKey,
      createDemoEmailSandboxSession(locale).finally(() => {
        demoEmailSandboxSessionPromises.delete(promiseKey);
      })
    );
  }

  return demoEmailSandboxSessionPromises.get(promiseKey);
}

async function createDemoEmailSandboxSession(locale, requestedSandboxId = "", email = "") {
  if (!demoEmailSandboxEnabled) {
    return "";
  }

  let response;
  const headers = {
    Accept: "application/json",
    "Accept-Language": locale ?? getPreferredLocale()
  };
  const normalizedEmail = normalizeDemoEmailAddress(email);
  const sessionUrl = normalizedEmail
    ? `/demo/email-sandbox/session?email=${encodeURIComponent(normalizedEmail)}`
    : "/demo/email-sandbox/session";

  if (isValidDemoEmailSandboxId(requestedSandboxId)) {
    headers[DEMO_EMAIL_SANDBOX_HEADER] = requestedSandboxId;
  }

  try {
    response = await fetch(`${API_BASE_URL}${sessionUrl}`, {
      method: "POST",
      headers
    });
  } catch {
    return "";
  }

  const payload = await parsePayload(response);
  const sandboxId =
    response.headers.get(DEMO_EMAIL_SANDBOX_HEADER) ?? payload?.data?.sandboxId ?? "";

  if (response.ok && sandboxId) {
    if (normalizedEmail && readActiveDemoEmailAddress() !== normalizedEmail) {
      writeDemoEmailSandboxIdByEmail(normalizedEmail, sandboxId);
    } else {
      writeDemoEmailSandboxId(sandboxId, normalizedEmail);
    }
    return sandboxId;
  }

  return "";
}

function readDemoEmailSandboxIdByEmail(email) {
  const sandboxByEmail = readDemoEmailSandboxMap();
  const sandboxId = sandboxByEmail[normalizeDemoEmailAddress(email)] ?? "";

  return isValidDemoEmailSandboxId(sandboxId) ? sandboxId : "";
}

function writeDemoEmailSandboxIdByEmail(email, sandboxId) {
  const normalizedEmail = normalizeDemoEmailAddress(email);

  if (!normalizedEmail || !isValidDemoEmailSandboxId(sandboxId)) {
    return;
  }

  const sandboxByEmail = readDemoEmailSandboxMap();
  sandboxByEmail[normalizedEmail] = sandboxId;
  writeDemoEmailSandboxMap(sandboxByEmail);
}

function readDemoEmailSandboxMap() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DEMO_EMAIL_SANDBOX_BY_EMAIL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.entries(parsed).reduce((accumulator, [email, sandboxId]) => {
      const normalizedEmail = normalizeDemoEmailAddress(email);

      if (normalizedEmail && isValidDemoEmailSandboxId(sandboxId)) {
        accumulator[normalizedEmail] = sandboxId;
      }

      return accumulator;
    }, {});
  } catch {
    return {};
  }
}

function writeDemoEmailSandboxMap(sandboxByEmail) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      DEMO_EMAIL_SANDBOX_BY_EMAIL_STORAGE_KEY,
      JSON.stringify(sandboxByEmail)
    );
  } catch {
    // Ignore storage cleanup issues.
  }
}

function writeActiveDemoEmailAddress(email) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedEmail = normalizeDemoEmailAddress(email);

  if (!normalizedEmail) {
    return;
  }

  try {
    window.localStorage.setItem(DEMO_EMAIL_ACTIVE_EMAIL_STORAGE_KEY, normalizedEmail);
  } catch {
    // Ignore storage issues.
  }
}

function clearActiveDemoEmailSandboxId() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(DEMO_EMAIL_SANDBOX_STORAGE_KEY);
    window.localStorage.removeItem(DEMO_EMAIL_ACTIVE_SANDBOX_STORAGE_KEY);
    window.dispatchEvent(new Event(DEMO_EMAIL_SANDBOX_CHANGED_EVENT));
  } catch {
    // Ignore storage issues.
  }
}

function getDemoEmailForRequest(endpoint, body) {
  if (!shouldAttachDemoEmailSandboxHeader(endpoint)) {
    return "";
  }

  if (body && typeof body === "object" && !Array.isArray(body) && typeof body.email === "string") {
    return normalizeDemoEmailAddress(body.email);
  }

  const queryIndex = endpoint.indexOf("?");

  if (queryIndex < 0) {
    return "";
  }

  try {
    const searchParams = new URLSearchParams(endpoint.slice(queryIndex + 1));
    return normalizeDemoEmailAddress(searchParams.get("email"));
  } catch {
    return "";
  }
}

function isValidDemoEmailSandboxId(sandboxId) {
  return typeof sandboxId === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(sandboxId);
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
