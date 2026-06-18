import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DEMO_EMAIL_SANDBOX_HEADER,
  DEMO_EMAIL_SANDBOX_MESSAGES_CHANGED_EVENT,
  activateDemoEmailSandboxForEmail,
  apiRequest,
  clearDemoEmailSandboxId,
  readActiveDemoEmailAddress,
  readDemoEmailSandboxId
} from "../../shared/api/http";
import { useMetadataQuery } from "../../shared/api/hooks";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { formatDateTime } from "../../shared/lib/format";
import {
  EnvelopeClosedIcon,
  EnvelopeOpenIcon,
  RefreshIcon,
  TrashIcon
} from "../../shared/ui/Icons";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";
import {
  DEMO_INBOX_STATE_EVENT,
  isDemoEmailRead,
  markDemoEmailAsRead
} from "./inboxState";

const INBOX_LIMIT = 20;
const INBOX_REFETCH_INTERVAL_MS = 4000;

const demoInboxText = {
  de: {
    clear: "Alle E-Mails löschen",
    emptyBody: "Diese E-Mail hat keinen Inhalt.",
    emptyDescription:
      "Sobald Book Exchange dir eine Demo-E-Mail sendet, erscheint sie automatisch in diesem Postfach.",
    emptyTitle: "Noch keine Demo-E-Mails",
    expiresAt: "Sitzung aktiv bis",
    from: "Von",
    heroEyebrow: "Demo-Postfach",
    heroTitle: "Dein privates Mailpit-Postfach im Browser",
    heroDescription:
      "E-Mails werden nicht an echte Postfächer gesendet. Diese Demo zeigt Nachrichten für das aktuelle Konto oder die zuletzt verwendete E-Mail.",
    inboxUnavailableDescription:
      "Dieser Bereich ist nur im demo-Profil aktiv. Starte das Backend mit aktivierter demo email sandbox, um Mailpit-Nachrichten hier zu sehen.",
    inboxUnavailableTitle: "Demo inbox ist nicht aktiv",
    latest: "Neueste E-Mails",
    loading: "Demo inbox wird vorbereitet",
    newSession: "Sitzung zurücksetzen",
    noPreview: "Keine Vorschau",
    noSubject: "Ohne Betreff",
    to: "An",
    viewerTitle: "Nachricht",
    waitingHint: "Das Postfach wird automatisch alle paar Sekunden aktualisiert."
  },
  en: {
    clear: "Delete all emails",
    emptyBody: "This email has no content.",
    emptyDescription:
      "Whenever Book Exchange sends you a demo email, it will appear in this inbox automatically",
    emptyTitle: "No demo emails yet",
    expiresAt: "Session active until",
    from: "From",
    heroEyebrow: "Demo inbox",
    heroTitle: "Your private Mailpit inbox inside the browser.",
    heroDescription:
      "Emails are not sent to real mailboxes in the demo. This page shows messages for the current account or the last email you used.",
    inboxUnavailableDescription:
      "This page is available only when the backend runs with the demo email sandbox enabled.",
    inboxUnavailableTitle: "Demo inbox is not active",
    latest: "Latest emails",
    loading: "Preparing demo inbox",
    newSession: "Reset session",
    noPreview: "No preview",
    noSubject: "No subject",
    to: "To",
    viewerTitle: "Message",
    waitingHint: "The inbox refreshes automatically every few seconds."
  },
  ru: {
    clear: "Удалить все письма",
    emptyBody: "В этом письме нет содержимого.",
    emptyDescription:
      "Когда Book Exchange отправит вам demo-письмо, оно автоматически появится в этом почтовом ящике.",
    emptyTitle: "Пока нет demo-писем",
    expiresAt: "Сессия активна до",
    from: "От",
    heroEyebrow: "Демо-почта",
    heroTitle: "Ваш личный Mailpit-inbox прямо в браузере",
    heroDescription:
      "В демо-режиме письма не уходят на реальные адреса. Здесь видны сообщения текущего аккаунта или последней использованной почты.",
    inboxUnavailableDescription:
      "Эта страница работает только в demo-профиле backend-а, когда включена demo email sandbox.",
    inboxUnavailableTitle: "Demo inbox сейчас не активен",
    latest: "Последние письма",
    loading: "Готовим demo inbox",
    newSession: "Сбросить сессию",
    noPreview: "Нет превью",
    noSubject: "Без темы",
    to: "Кому",
    viewerTitle: "Письмо",
    waitingHint: "Почта обновляется автоматически каждые несколько секунд."
  }
};

export function DemoEmailInboxPage() {
  const queryClient = useQueryClient();
  const metadataQuery = useMetadataQuery();
  const { locale } = useLocale();
  const { user } = useAuth();
  const featureEnabled = metadataQuery.data?.features?.demoEmailSandboxEnabled === true;
  const text = demoInboxText[locale] ?? demoInboxText.en;
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [activeEmail, setActiveEmail] = useState(() => readActiveDemoEmailAddress());
  const [storedSandboxId, setStoredSandboxId] = useState(() => readDemoEmailSandboxId());
  const [sessionActivationPending, setSessionActivationPending] = useState(false);
  const [stableExpiry, setStableExpiry] = useState({ sandboxId: "", value: null });
  const [previewHeight, setPreviewHeight] = useState(0);
  const [, setReadStateVersion] = useState(0);
  const previewRef = useRef(null);
  const isSwitchingAccount = Boolean(user?.email && activeEmail !== user.email);

  const sessionQuery = useQuery({
    queryKey: ["demo-email-sandbox", "session", activeEmail || "anonymous"],
    enabled:
      featureEnabled &&
      !storedSandboxId &&
      !isSwitchingAccount &&
      !sessionActivationPending,
    retry: false,
    queryFn: async ({ signal }) => {
      const endpoint = activeEmail
        ? `/demo/email-sandbox/session?email=${encodeURIComponent(activeEmail)}`
        : "/demo/email-sandbox/session";
      const response = await apiRequest(endpoint, { method: "POST", signal });
      return response.data;
    }
  });
  const activeSandboxId = isSwitchingAccount
    ? ""
    : storedSandboxId || (!activeEmail ? sessionQuery.data?.sandboxId : "") || "";
  const needsSession = !activeSandboxId;
  const sessionError = needsSession ? sessionQuery.error : null;
  const sessionPending =
    isSwitchingAccount || (needsSession && (sessionActivationPending || sessionQuery.isPending));

  const messagesQuery = useQuery({
    queryKey: ["demo-email-sandbox", "messages", activeSandboxId, INBOX_LIMIT],
    enabled: featureEnabled && Boolean(activeSandboxId),
    refetchInterval: INBOX_REFETCH_INTERVAL_MS,
    refetchIntervalInBackground: true,
    queryFn: async ({ signal }) => {
      const response = await apiRequest(`/demo/email-sandbox/messages?limit=${INBOX_LIMIT}`, {
        headers: getSandboxHeaders(activeSandboxId),
        signal
      });
      return response.data;
    }
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/demo/email-sandbox/messages", {
        method: "DELETE",
        headers: getSandboxHeaders(activeSandboxId)
      });
      return response.data;
    },
    onSuccess: (data) => {
      setSelectedMessageId(null);
      queryClient.setQueryData(["demo-email-sandbox", "messages", activeSandboxId, INBOX_LIMIT], data);
    }
  });

  const messages = useMemo(() => {
    const responseSandboxId = messagesQuery.data?.sandboxId;

    if (responseSandboxId && responseSandboxId !== activeSandboxId) {
      return [];
    }

    return messagesQuery.data?.messages ?? [];
  }, [activeSandboxId, messagesQuery.data]);
  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedMessageId) ?? messages[0] ?? null,
    [messages, selectedMessageId]
  );
  const responseExpiresAt = messagesQuery.data?.expiresAt ?? sessionQuery.data?.expiresAt ?? null;
  const expiresAt =
    stableExpiry.sandboxId === activeSandboxId ? stableExpiry.value : responseExpiresAt;
  const unavailable =
    !featureEnabled ||
    sessionError?.status === 404 ||
    messagesQuery.error?.status === 404 ||
    (!activeSandboxId && sessionQuery.data?.enabled === false);

  useEffect(() => {
    if (!featureEnabled) {
      void queryClient.cancelQueries({ queryKey: ["demo-email-sandbox"] });
      queryClient.removeQueries({ queryKey: ["demo-email-sandbox"] });
    }
  }, [featureEnabled, queryClient]);

  useEffect(() => {
    const nextEmail = user?.email || readActiveDemoEmailAddress();

    if (!nextEmail) {
      return undefined;
    }

    setActiveEmail(nextEmail);
    setStoredSandboxId(readDemoEmailSandboxId(nextEmail));
    setSelectedMessageId(null);

    const mappedSandboxId = readDemoEmailSandboxId(nextEmail);

    if (mappedSandboxId) {
      setStoredSandboxId(mappedSandboxId);
    }
  }, [featureEnabled, locale, user?.email]);

  useEffect(() => {
    const nextSandboxId = sessionQuery.data?.sandboxId ?? "";

    if (nextSandboxId && nextSandboxId !== storedSandboxId) {
      setStoredSandboxId(nextSandboxId);
    }
  }, [sessionQuery.data?.sandboxId, storedSandboxId]);

  useEffect(() => {
    if (!messages.length) {
      setSelectedMessageId(null);
      return;
    }

    if (!messages.some((message) => message.id === selectedMessageId)) {
      setSelectedMessageId(messages[0].id);
    }
  }, [messages, selectedMessageId]);

  useEffect(() => {
    if (
      activeSandboxId &&
      responseExpiresAt &&
      stableExpiry.sandboxId !== activeSandboxId
    ) {
      setStableExpiry({ sandboxId: activeSandboxId, value: responseExpiresAt });
    }
  }, [activeSandboxId, responseExpiresAt, stableExpiry.sandboxId]);

  useEffect(() => {
    if (activeSandboxId && selectedMessage?.id) {
      markDemoEmailAsRead(activeSandboxId, selectedMessage.id);
    }
  }, [activeSandboxId, selectedMessage?.id]);

  useEffect(() => {
    function refreshReadState() {
      setReadStateVersion((current) => current + 1);
    }

    window.addEventListener(DEMO_INBOX_STATE_EVENT, refreshReadState);
    return () => window.removeEventListener(DEMO_INBOX_STATE_EVENT, refreshReadState);
  }, []);

  useEffect(() => {
    if (!featureEnabled) {
      return undefined;
    }

    let retryTimer = null;

    function refreshMessages() {
      if (!activeSandboxId) {
        return;
      }

      void messagesQuery.refetch();
      window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        void messagesQuery.refetch();
      }, 1200);
    }

    window.addEventListener(DEMO_EMAIL_SANDBOX_MESSAGES_CHANGED_EVENT, refreshMessages);

    return () => {
      window.removeEventListener(DEMO_EMAIL_SANDBOX_MESSAGES_CHANGED_EVENT, refreshMessages);
      window.clearTimeout(retryTimer);
    };
  }, [activeSandboxId, featureEnabled, messagesQuery.refetch]);

  useEffect(() => {
    const preview = previewRef.current;

    if (!preview || typeof ResizeObserver === "undefined") {
      setPreviewHeight(0);
      return undefined;
    }

    const desktopLayout = window.matchMedia("(min-width: 921px)");

    function syncPreviewHeight() {
      setPreviewHeight(desktopLayout.matches ? Math.ceil(preview.getBoundingClientRect().height) : 0);
    }

    const observer = new ResizeObserver(syncPreviewHeight);
    observer.observe(preview);
    desktopLayout.addEventListener("change", syncPreviewHeight);
    syncPreviewHeight();

    return () => {
      observer.disconnect();
      desktopLayout.removeEventListener("change", syncPreviewHeight);
    };
  }, [selectedMessage?.id]);

  async function handleResetLocalSession() {
    if (!featureEnabled) {
      return;
    }

    const email = activeEmail || readActiveDemoEmailAddress();

    clearDemoEmailSandboxId(email);
    setStoredSandboxId("");
    setSelectedMessageId(null);
    queryClient.removeQueries({ queryKey: ["demo-email-sandbox"] });

    if (!email) {
      return;
    }

    setSessionActivationPending(true);

    try {
      const nextSandboxId = await activateDemoEmailSandboxForEmail(email, locale);
      setActiveEmail(readActiveDemoEmailAddress());
      setStoredSandboxId(nextSandboxId || "");
    } finally {
      setSessionActivationPending(false);
    }
  }

  return (
    <section className="content-stack demo-inbox-page">
      <header className="demo-inbox-hero">
        <div className="demo-inbox-hero-copy">
          <span className="home-eyebrow">{text.heroEyebrow}</span>
          <h1>{text.heroTitle}</h1>
          <p>{text.heroDescription}</p>
        </div>

        <div className="demo-inbox-session-card">
          <span className="demo-inbox-session-icon">
            <EnvelopeClosedIcon />
          </span>
          {expiresAt ? (
            <small title={formatDateTime(expiresAt)}>
              {text.expiresAt}: {formatDateTime(expiresAt)}
            </small>
          ) : null}
        </div>
      </header>

      {sessionPending ? <LoadingBlock label={text.loading} /> : null}

      {unavailable ? (
        <ErrorBlock
          error={{ message: text.inboxUnavailableDescription }}
          title={text.inboxUnavailableTitle}
        />
      ) : null}

      {!unavailable && sessionError ? (
        <ErrorBlock error={sessionError} title={text.inboxUnavailableTitle} />
      ) : null}

      {!sessionPending && !sessionError && !unavailable ? (
        <>
          <section className="section-card demo-inbox-toolbar">
            <div>
              <span className="home-section-kicker">{text.latest}</span>
              <h2>{formatMessageCount(text, messages.length)}</h2>
              <p>{text.waitingHint}</p>
            </div>

            <div className="section-card-toolbar">
              <button
                className="button button-danger"
                disabled={!messages.length || clearMutation.isPending}
                onClick={() => void clearMutation.mutateAsync()}
                type="button"
              >
                <TrashIcon />
                <span>{text.clear}</span>
              </button>
              <button
                className="button button-secondary"
                disabled={clearMutation.isPending || messagesQuery.isFetching}
                onClick={() => void handleResetLocalSession()}
                type="button"
              >
                <RefreshIcon />
                <span>{text.newSession}</span>
              </button>
            </div>
          </section>

          {clearMutation.error ? (
            <ErrorBlock error={clearMutation.error} title={text.inboxUnavailableTitle} />
          ) : null}

          {messagesQuery.error ? (
            <ErrorBlock error={messagesQuery.error} title={text.inboxUnavailableTitle} />
          ) : null}

          {messagesQuery.isPending ? <LoadingBlock label={text.loading} /> : null}

          {!messagesQuery.isPending && !messages.length ? (
            <EmptyBlock
              description={text.emptyDescription}
              title={text.emptyTitle}
            />
          ) : null}

          {messages.length ? (
            <section className="demo-inbox-layout">
              <div
                className="demo-inbox-list"
                aria-label={text.latest}
                style={
                  previewHeight
                    ? { height: `${previewHeight}px`, maxHeight: `${previewHeight}px` }
                    : undefined
                }
              >
                {messages.map((message) => (
                  <MessageListItem
                    key={message.id}
                    locale={locale}
                    message={message}
                    onSelect={() => setSelectedMessageId(message.id)}
                    read={isDemoEmailRead(activeSandboxId, message.id)}
                    selected={selectedMessage?.id === message.id}
                    text={text}
                  />
                ))}
              </div>

              <MessagePreview
                locale={locale}
                message={selectedMessage}
                previewRef={previewRef}
                text={text}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

function getSandboxHeaders(sandboxId) {
  return sandboxId ? { [DEMO_EMAIL_SANDBOX_HEADER]: sandboxId } : undefined;
}

function MessageListItem({ locale, message, onSelect, read, selected, text }) {
  const subject = message.subject || text.noSubject;

  return (
    <button
      className={selected ? "demo-inbox-message-card demo-inbox-message-card-active" : "demo-inbox-message-card"}
      onClick={onSelect}
      type="button"
    >
      <span className="demo-inbox-message-icon">
        {read ? <EnvelopeOpenIcon /> : <EnvelopeClosedIcon />}
      </span>

      <span className="demo-inbox-message-copy">
        <strong>{subject}</strong>
        <span>{message.snippet || message.text || text.noPreview}</span>
        <small>
          {text.from}: {message.from || "-"}
        </small>
      </span>

      <time dateTime={message.createdAt ?? undefined}>{formatInboxDate(locale, message.createdAt)}</time>
    </button>
  );
}

function MessagePreview({ locale, message, previewRef, text }) {
  if (!message) {
    return null;
  }

  return (
    <article className="section-card demo-inbox-preview" ref={previewRef}>
      <header className="demo-inbox-preview-header">
        <div>
          <span className="home-section-kicker">{text.viewerTitle}</span>
          <h2>{message.subject || text.noSubject}</h2>
        </div>
        <time dateTime={message.createdAt ?? undefined}>{formatInboxDate(locale, message.createdAt)}</time>
      </header>

      <dl className="demo-inbox-meta">
        <div>
          <dt>{text.from}</dt>
          <dd>{message.from || "-"}</dd>
        </div>
        <div>
          <dt>{text.to}</dt>
          <dd>{formatAddressList(message.to)}</dd>
        </div>
      </dl>

      <iframe
        className="demo-inbox-frame"
        onLoad={resizeMessageFrame}
        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-top-navigation-by-user-activation"
        scrolling="no"
        srcDoc={buildMessageSrcDoc(message, text)}
        title={message.subject || text.viewerTitle}
      />
    </article>
  );
}

function buildMessageSrcDoc(message, text) {
  const body = message.html
    ? message.html
    : `<pre>${escapeHtml(message.text || text.emptyBody)}</pre>`;

  return `<!doctype html>
<html>
<head>
  <base target="_top">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html,
    body {
      height: auto !important;
      min-height: 0 !important;
    }
    body {
      margin: 0;
      padding: 24px;
      color: #12202b;
      font-family: "Segoe UI", Arial, sans-serif;
      line-height: 1.55;
      background: #fffaf2;
    }
    body > * {
      min-height: 0 !important;
    }
    body > table {
      height: auto !important;
    }
    a { color: #1f6b58; font-weight: 700; }
    img {
      display: block;
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain !important;
    }
    pre { white-space: pre-wrap; word-break: break-word; font-family: inherit; }
    table { max-width: 100% !important; }
    td { max-width: 100%; }
  </style>
</head>
<body>${body}</body>
</html>`;
}

function formatAddressList(value) {
  return Array.isArray(value) && value.length ? value.join(", ") : "-";
}

function formatInboxDate(locale, value) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMessageCount(text, count) {
  if (text === demoInboxText.ru) {
    const lastTwo = count % 100;
    const last = count % 10;
    const noun =
      lastTwo >= 11 && lastTwo <= 14
        ? "писем"
        : last === 1
          ? "письмо"
          : last >= 2 && last <= 4
            ? "письма"
            : "писем";

    return `${count} ${noun}`;
  }

  if (text === demoInboxText.de) {
    return `${count} ${count === 1 ? "Nachricht" : "Nachrichten"}`;
  }

  return `${count} ${count === 1 ? "message" : "messages"}`;
}

function resizeMessageFrame(event) {
  const frame = event.currentTarget;
  const body = frame.contentDocument?.body;
  const documentElement = frame.contentDocument?.documentElement;
  const contentHeight = Math.max(body?.scrollHeight ?? 0, documentElement?.scrollHeight ?? 0);

  if (contentHeight > 0) {
    frame.style.height = `${Math.max(220, contentHeight + 4)}px`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
