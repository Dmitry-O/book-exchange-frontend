import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { apiRequest } from "../../shared/api/http";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { rt } from "../../shared/i18n/rawText";
import {
  buildQueryString,
  formatDateTime,
  formatEnumLabel
} from "../../shared/lib/format";
import { BookCover, UserAvatar } from "../../shared/ui/Media";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const UPDATE_FILTERS = ["UNREAD", "ALL", "READ"];

const updatesText = {
  de: {
    allDescription: "Zeige alle Austausch-Updates in einer gemeinsamen Liste.",
    allLabel: "Alle",
    emptyAllDescription:
      "Sobald neue Ereignisse zu Anfragen, Angeboten oder der Historie auftauchen, erscheinen sie hier.",
    emptyAllTitle: "Noch keine Austausch-Updates",
    emptyReadDescription:
      "Sobald du einige Austausch-Updates geoeffnet hast, erscheinen sie hier als bereits gelesen.",
    emptyReadTitle: "Noch keine gelesenen Updates",
    emptyUnreadDescription:
      "Sobald neue Ereignisse zu Anfragen, Angeboten oder der Historie auftauchen, erscheinen sie hier als ungelesen.",
    emptyUnreadTitle: "Keine ungelesenen Updates",
    historyLabel: "Verlauf",
    hourAgo: "Vor einer Stunde",
    loadingAll: "Alle Updates werden geladen",
    loadingRead: "Gelesene Updates werden geladen",
    loadingUnread: "Ungelesene Updates werden geladen",
    minuteAgo: "Vor einer Minute",
    minutesAgo: "Vor {count} Minuten",
    openDetails: "Details oeffnen",
    offerLabel: "Angebot",
    readBadge: "Gelesen",
    readDescription: "Zeige nur Updates, die du schon angesehen hast.",
    readError: "Gelesene Updates konnten nicht geladen werden",
    readLabel: "Bereits gelesen",
    requestLabel: "Anfrage",
    subtitle:
      "Hier siehst du neue Ereignisse zu Anfragen, Angeboten und bereits abgeschlossenen Austauschen.",
    title: "Austausch-Updates",
    today: "Heute",
    unreadBadge: "Neu",
    unreadDescription: "Zeige nur neue Updates, die du noch nicht geoeffnet hast.",
    unreadError: "Ungelesene Updates konnten nicht geladen werden",
    unreadLabel: "Neu",
    unknownUser: "Unbekannter Nutzer",
    updatesError: "Updates konnten nicht geladen werden",
    yesterday: "Gestern"
  },
  en: {
    allDescription: "Show every exchange update in one shared feed.",
    allLabel: "All",
    emptyAllDescription:
      "When new request, offer, or history events appear, they will show up here.",
    emptyAllTitle: "No exchange updates yet",
    emptyReadDescription:
      "Once you open a few exchange updates, they will appear here as already read.",
    emptyReadTitle: "No read updates yet",
    emptyUnreadDescription:
      "When new request, offer, or history events appear, they will show up here as unread.",
    emptyUnreadTitle: "No unread exchange updates",
    historyLabel: "History",
    hourAgo: "An hour ago",
    loadingAll: "Loading all updates",
    loadingRead: "Loading read updates",
    loadingUnread: "Loading unread updates",
    minuteAgo: "A minute ago",
    minutesAgo: "{count} minutes ago",
    openDetails: "Open details",
    offerLabel: "Offer",
    readBadge: "Read",
    readDescription: "Show only updates that you have already opened.",
    readError: "Read updates could not be loaded",
    readLabel: "Read",
    requestLabel: "Request",
    subtitle:
      "This feed shows new events for requests, offers, and completed exchanges.",
    title: "Exchange updates",
    today: "Today",
    unreadBadge: "New",
    unreadDescription: "Show only fresh updates that you have not opened yet.",
    unreadError: "Unread updates could not be loaded",
    unreadLabel: "Unread",
    unknownUser: "Unknown user",
    updatesError: "Updates could not be loaded",
    yesterday: "Yesterday"
  },
  ru: {
    allDescription: "Показывать все обновления по обменам в одной ленте.",
    allLabel: "Все",
    emptyAllDescription:
      "Когда появятся новые события по запросам, предложениям или истории обменов, они будут показаны здесь.",
    emptyAllTitle: "Обновлений по обменам пока нет",
    emptyReadDescription:
      "Когда вы откроете несколько обновлений по обменам, они появятся здесь как уже просмотренные.",
    emptyReadTitle: "Пока нет просмотренных обновлений",
    emptyUnreadDescription:
      "Когда появятся новые события по запросам, предложениям или истории обменов, они будут показаны здесь как непрочитанные.",
    emptyUnreadTitle: "Непрочитанных обновлений нет",
    historyLabel: "История",
    hourAgo: "Час назад",
    loadingAll: "Загружаем все обновления",
    loadingRead: "Загружаем просмотренные обновления",
    loadingUnread: "Загружаем непрочитанные обновления",
    minuteAgo: "Минуту назад",
    minutesAgo: "{count} минут назад",
    openDetails: "Открыть детали",
    offerLabel: "Предложение",
    readBadge: "Прочитано",
    readDescription: "Показывать только те обновления, которые вы уже открывали.",
    readError: "Не удалось загрузить просмотренные обновления",
    readLabel: "Старые",
    requestLabel: "Запрос",
    subtitle:
      "Здесь собраны новые события по запросам, предложениям и уже завершённым обменам.",
    title: "Обновления обменов",
    today: "Сегодня",
    unreadBadge: "Новое",
    unreadDescription: "Показывать только новые обновления, которые вы ещё не открывали.",
    unreadError: "Не удалось загрузить непрочитанные обновления",
    unreadLabel: "Непрочитанные",
    unknownUser: "Неизвестный пользователь",
    updatesError: "Не удалось загрузить обновления",
    yesterday: "Вчера"
  }
};

export function UpdatesPage() {
  const { locale } = useLocale();
  const [pageIndex, setPageIndex] = useState(0);
  const [readState, setReadState] = useState("UNREAD");
  const text = updatesText[locale] ?? updatesText.en;

  const updatesQuery = useQuery({
    queryKey: ["updates", pageIndex, readState],
    queryFn: async () => {
      const response = await apiRequest(
        `/updates?${buildQueryString({
          pageIndex,
          pageSize: DEFAULT_LIST_PAGE_SIZE,
          readState
        })}`,
        { auth: true }
      );

      return response.data;
    }
  });

  const items = updatesQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{text.title}</h1>
        <p>{text.subtitle}</p>
      </header>

      <section className="choice-grid updates-filter-grid">
        {UPDATE_FILTERS.map((filter) => (
          <button
            className={`choice-card${filter === readState ? " choice-card-active" : ""}`}
            key={filter}
            onClick={() => {
              setReadState(filter);
              setPageIndex(0);
            }}
            type="button"
          >
            <strong>{resolveFilterLabel(text, filter)}</strong>
            <span>{resolveFilterDescription(text, filter)}</span>
          </button>
        ))}
      </section>

      {updatesQuery.isPending ? <LoadingBlock label={resolveLoadingLabel(text, readState)} /> : null}
      {updatesQuery.error ? (
        <ErrorBlock error={updatesQuery.error} title={resolveErrorTitle(text, readState)} />
      ) : null}

      {!updatesQuery.isPending && !updatesQuery.error && items.length === 0 ? (
        <EmptyBlock
          description={resolveEmptyDescription(text, readState)}
          title={resolveEmptyTitle(text, readState)}
        />
      ) : null}

      {items.length > 0 ? (
        <section className="list-stack">
          {items.map((item) => {
            const bookLabel = resolveOtherBookLabel(locale, item);
            const otherUserLabel = item.otherUserNickname || text.unknownUser;

            return (
              <Link
                className="section-card compact-card update-card-link"
                key={`${item.id}-${item.exchangeId ?? "exchange"}`}
                to={resolveUpdateTarget(item)}
              >
                <div className="update-card-layout">
                  <div className="entity-inline update-card-media">
                    <BookCover
                      photoUrl={item.otherBookPhotoUrl}
                      size="sm"
                      title={bookLabel}
                    />
                    <UserAvatar name={otherUserLabel} size="sm" />
                  </div>

                  <div className="update-card-content">
                    <div className="update-card-head">
                      <div className="update-card-copy">
                        <h2>{bookLabel}</h2>
                        <p className="muted-line">{otherUserLabel}</p>
                      </div>

                      <div className="pill-row update-card-pills">
                        <span
                          className={`status-pill ${
                            item.isRead ? "status-pill-neutral" : "status-pill-warning"
                          }`}
                        >
                          {item.isRead ? text.readBadge : text.unreadBadge}
                        </span>
                        <span className="subtle-chip">{formatEnumLabel(item.status)}</span>
                      </div>
                    </div>

                    <div className="update-card-meta">
                      <span>{resolveUpdateKindLabel(text, item)}</span>
                      <span title={formatDateTime(item.updatedAt)}>
                        {formatUpdateTimestamp(locale, item.updatedAt)}
                      </span>
                    </div>

                    <span className="update-card-link-label">{text.openDetails}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      ) : null}

      {!updatesQuery.isPending && !updatesQuery.error && (updatesQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination onChange={setPageIndex} page={pageIndex} totalPages={updatesQuery.data.totalPages} />
      ) : null}
    </section>
  );
}

function resolveUpdateTarget(item) {
  const exchangeId = item.exchangeId ?? item.id;

  if (item.status === "PENDING") {
    return item.userExchangeRole === "RECEIVER"
      ? `/app/exchanges/offers/${exchangeId}`
      : `/app/exchanges/requests/${exchangeId}`;
  }

  return `/app/history/${exchangeId}`;
}

function resolveOtherBookLabel(locale, item) {
  if (item.otherBookName) {
    return item.otherBookName;
  }

  return item.userExchangeRole === "RECEIVER"
    ? rt(locale, "Without counter book")
    : rt(locale, "Unknown receiver book");
}

function resolveUpdateKindLabel(text, item) {
  if (item.status === "PENDING") {
    return item.userExchangeRole === "RECEIVER" ? text.offerLabel : text.requestLabel;
  }

  return text.historyLabel;
}

function resolveFilterLabel(text, readState) {
  if (readState === "ALL") {
    return text.allLabel;
  }

  if (readState === "READ") {
    return text.readLabel;
  }

  return text.unreadLabel;
}

function resolveFilterDescription(text, readState) {
  if (readState === "ALL") {
    return text.allDescription;
  }

  if (readState === "READ") {
    return text.readDescription;
  }

  return text.unreadDescription;
}

function resolveLoadingLabel(text, readState) {
  if (readState === "ALL") {
    return text.loadingAll;
  }

  if (readState === "READ") {
    return text.loadingRead;
  }

  return text.loadingUnread;
}

function resolveErrorTitle(text, readState) {
  if (readState === "READ") {
    return text.readError;
  }

  if (readState === "UNREAD") {
    return text.unreadError;
  }

  return text.updatesError;
}

function resolveEmptyTitle(text, readState) {
  if (readState === "ALL") {
    return text.emptyAllTitle;
  }

  if (readState === "READ") {
    return text.emptyReadTitle;
  }

  return text.emptyUnreadTitle;
}

function resolveEmptyDescription(text, readState) {
  if (readState === "ALL") {
    return text.emptyAllDescription;
  }

  if (readState === "READ") {
    return text.emptyReadDescription;
  }

  return text.emptyUnreadDescription;
}

function formatUpdateTimestamp(locale, value) {
  const text = updatesText[locale] ?? updatesText.en;

  if (!value) {
    return rt(locale, "Not available");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();
  const differenceMs = now.getTime() - date.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (differenceMs < minuteMs) {
    return text.minuteAgo;
  }

  if (differenceMs < hourMs) {
    return text.minutesAgo.replace("{count}", String(Math.max(1, Math.floor(differenceMs / minuteMs))));
  }

  if (differenceMs < 2 * hourMs) {
    return text.hourAgo;
  }

  if (isSameCalendarDay(now, date)) {
    return text.today;
  }

  if (isSameCalendarDay(new Date(now.getTime() - dayMs), date)) {
    return text.yesterday;
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(now.getFullYear() !== date.getFullYear() ? { year: "numeric" } : {})
  }).format(date);
}

function isSameCalendarDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
