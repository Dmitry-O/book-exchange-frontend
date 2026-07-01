import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  DEMO_ACCESS_REQUIRED_EVENT,
  apiRequest
} from "../../shared/api/http";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { AlertTriangleIcon, LockIcon } from "../../shared/ui/Icons";

const ACCESS_PARAM = "access";
const DEMO_ACCESS_STORAGE_KEY = "book-exchange/demo-access-granted";

const DEMO_ACCESS_COPY = {
  en: {
    checkingTitle: "Checking demo access",
    checkingDescription: "One moment while we validate the private portfolio link.",
    lockedTitle: "Demo access required",
    lockedDescription:
      "This Book Exchange demo is available through the private link from the resume or portfolio. Open that link again to enter the application.",
    retry: "Check access again",
    invalidToken: "The demo access link is missing, expired, or invalid.",
    technicalError: "Access could not be checked right now."
  },
  de: {
    checkingTitle: "Demo-Zugriff wird geprüft",
    checkingDescription: "Einen Moment, der private Portfolio-Link wird validiert.",
    lockedTitle: "Demo-Zugriff erforderlich",
    lockedDescription:
      "Diese Book-Exchange-Demo ist über den privaten Link aus Lebenslauf oder Portfolio erreichbar. Öffne diesen Link erneut, um die Anwendung zu starten.",
    retry: "Zugriff erneut prüfen",
    invalidToken: "Der Demo-Zugriffslink fehlt, ist abgelaufen oder ungültig.",
    technicalError: "Der Zugriff konnte gerade nicht geprüft werden."
  },
  ru: {
    checkingTitle: "Проверяем demo-доступ",
    checkingDescription: "Секунду, проверяем приватную ссылку из резюме или портфолио.",
    lockedTitle: "Нужен demo-доступ",
    lockedDescription:
      "Эта demo-версия Book Exchange открывается только по приватной ссылке из резюме или портфолио. Откройте эту ссылку ещё раз, чтобы войти в приложение.",
    retry: "Проверить доступ снова",
    invalidToken: "Demo-ссылка отсутствует, истекла или недействительна.",
    technicalError: "Сейчас не удалось проверить доступ."
  }
};

let initialAccessToken;
let bootstrapPromise = null;

export function DemoAccessGate({ children }) {
  const queryClient = useQueryClient();
  const { locale } = useLocale();
  const copy = DEMO_ACCESS_COPY[locale] ?? DEMO_ACCESS_COPY.en;
  const [state, setState] = useState({
    error: null,
    status: "checking"
  });

  useEffect(() => {
    let cancelled = false;

    setState((current) =>
      current.status === "granted" ? current : { error: null, status: "checking" }
    );

    void runDemoAccessBootstrap(locale).then((result) => {
      if (cancelled) {
        return;
      }

      if (result.metadata) {
        queryClient.setQueryData(["metadata"], result.metadata);
      }

      setState({
        error: result.error ?? null,
        status: result.status
      });
    });

    return () => {
      cancelled = true;
    };
  }, [locale, queryClient]);

  useEffect(() => {
    function handleDemoAccessRequired() {
      clearStoredDemoAccessGrant();
      bootstrapPromise = null;
      void queryClient.cancelQueries();
      queryClient.removeQueries();
      setState({
        error: null,
        status: "locked"
      });
    }

    window.addEventListener(DEMO_ACCESS_REQUIRED_EVENT, handleDemoAccessRequired);

    return () => {
      window.removeEventListener(DEMO_ACCESS_REQUIRED_EVENT, handleDemoAccessRequired);
    };
  }, [queryClient]);

  if (state.status === "granted") {
    return children;
  }

  return (
    <DemoAccessScreen
      copy={copy}
      error={state.error}
      loading={state.status === "checking"}
      onRetry={() => {
        bootstrapPromise = null;
        setState({ error: null, status: "checking" });
        void runDemoAccessBootstrap(locale).then((result) => {
          if (result.metadata) {
            queryClient.setQueryData(["metadata"], result.metadata);
          }

          setState({
            error: result.error ?? null,
            status: result.status
          });
        });
      }}
    />
  );
}

function DemoAccessScreen({ copy, error, loading, onRetry }) {
  const message = error
    ? error.errorCode === "SYSTEM_DEMO_ACCESS_REQUIRED" || error.status === 401
      ? copy.invalidToken
      : error.message || copy.technicalError
    : "";

  return (
    <main className="demo-access-screen">
      <section className="demo-access-card">
        <div className="demo-access-icon">
          {loading ? <span className="spinner" aria-hidden="true" /> : <LockIcon />}
        </div>
        <div className="demo-access-copy">
          <p className="eyebrow">Book Exchange</p>
          <h1>{loading ? copy.checkingTitle : copy.lockedTitle}</h1>
          <p>{loading ? copy.checkingDescription : copy.lockedDescription}</p>
        </div>

        {message ? (
          <p className="inline-message inline-message-error demo-access-error">
            <AlertTriangleIcon />
            <span>{message}</span>
          </p>
        ) : null}

        {!loading ? (
          <button className="button demo-access-button" onClick={onRetry} type="button">
            {copy.retry}
          </button>
        ) : null}
      </section>
    </main>
  );
}

async function runDemoAccessBootstrap(locale) {
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrapDemoAccess(locale);
  }

  return bootstrapPromise;
}

async function bootstrapDemoAccess(locale) {
  const accessToken = readInitialAccessToken();

  if (accessToken) {
    try {
      const response = await apiRequest("/demo/access/verify", {
        method: "POST",
        body: { token: accessToken },
        locale
      });

      writeStoredDemoAccessGrant(response.data?.expiresAt ?? null);
      return { status: "granted" };
    } catch (error) {
      clearStoredDemoAccessGrant();
      return { error, status: "locked" };
    } finally {
      removeAccessTokenFromUrl();
    }
  }

  try {
    const response = await apiRequest("/metadata", { locale });
    writeStoredDemoAccessGrant(null);
    return { metadata: response.data, status: "granted" };
  } catch (error) {
    clearStoredDemoAccessGrant();
    return { error, status: "locked" };
  }
}

function readInitialAccessToken() {
  if (initialAccessToken !== undefined) {
    return initialAccessToken;
  }

  if (typeof window === "undefined") {
    initialAccessToken = "";
    return initialAccessToken;
  }

  try {
    const url = new URL(window.location.href);
    initialAccessToken = url.searchParams.get(ACCESS_PARAM)?.trim() ?? "";
  } catch {
    initialAccessToken = "";
  }

  return initialAccessToken;
}

function removeAccessTokenFromUrl() {
  initialAccessToken = "";

  if (typeof window === "undefined") {
    return;
  }

  try {
    const url = new URL(window.location.href);

    if (!url.searchParams.has(ACCESS_PARAM)) {
      return;
    }

    url.searchParams.delete(ACCESS_PARAM);
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl || "/");
  } catch {
    // Keeping the app available is more important than URL cleanup failure.
  }
}

function writeStoredDemoAccessGrant(expiresAt) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      DEMO_ACCESS_STORAGE_KEY,
      JSON.stringify({
        checkedAt: new Date().toISOString(),
        expiresAt: expiresAt ?? null,
        granted: true
      })
    );
  } catch {
    // The HttpOnly cookie is the source of truth; local storage is only UI state.
  }
}

function clearStoredDemoAccessGrant() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(DEMO_ACCESS_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup problems.
  }
}
