import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { useLocale } from "../../../shared/i18n/LocaleContext";
import { rt } from "../../../shared/i18n/rawText";
import { formatBookCategoryLabel, getBookCategoryTagStyle } from "../../../shared/lib/bookCategory";
import { getCityDisplayName } from "../../../shared/lib/cities";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { BookCover, UserIdentityInline } from "../../../shared/ui/Media";
import {
  ArrowLeftIcon,
  CheckIcon,
  EnvelopeClosedIcon,
  EnvelopeOpenIcon,
  FilterIcon,
  GiftIcon,
  RequestGiftIcon,
  SwapIcon,
  XIcon
} from "../../../shared/ui/Icons";
import { PageTitle } from "../../../shared/ui/PageTitle";
import { Pagination } from "../../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../../shared/ui/StateBlocks";

const defaultFilters = {
  exchangeStatuses: []
};

const USER_MENU_OPEN_EVENT = "book-exchange:user-menu-open";

const adminExchangeText = {
  de: {
    accepted: "{name} hat das Angebot angenommen",
    created: "Erstellt",
    declinedBy: "Abgelehnt von",
    detailsTitle: "Tauschdetails",
    exchangeFound: "Gefundene Tausche",
    giftRequestDescription:
      "Dieser Nutzer hat das Buch als Geschenk angefragt, deshalb ist kein eigenes Gegenbuch erforderlich.",
    lastUpdated: "Letzte Aktualisierung",
    noMatches: "Wähle einen anderen Tauschstatus.",
    read: "Gelesen",
    receiver: "Empfänger",
    sender: "Absender",
    statusFilters: "Statusfilter",
    unread: "Ungelesen",
    withoutCounterBook: "Ohne Gegenbuch"
  },
  en: {
    accepted: "{name} accepted the offer",
    created: "Created",
    declinedBy: "Declined by",
    detailsTitle: "Exchange details",
    exchangeFound: "Exchanges found",
    giftRequestDescription:
      "This user requested the book as a gift, so their own book is not required for this request.",
    lastUpdated: "Last updated",
    noMatches: "Choose another exchange status.",
    read: "Read",
    receiver: "Receiver",
    sender: "Sender",
    statusFilters: "Status filters",
    unread: "Unread",
    withoutCounterBook: "Without counter-book"
  },
  ru: {
    accepted: "Пользователь {name} принял предложение",
    created: "Создан",
    declinedBy: "Отклонен пользователем",
    detailsTitle: "Детали обмена",
    exchangeFound: "Найдено обменов",
    giftRequestDescription:
      "Пользователь запросил эту книгу в дар, поэтому его книга для этого запроса не требуется.",
    lastUpdated: "Последнее обновление",
    noMatches: "Выберите другой статус обмена.",
    read: "Прочитано",
    receiver: "Получатель",
    sender: "Отправитель",
    statusFilters: "Фильтры по статусу",
    unread: "Не прочитано",
    withoutCounterBook: "Без встречной книги"
  }
};

export function AdminExchangesPage() {
  const metadataQuery = useMetadataQuery();
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { locale, t } = useLocale();
  const text = getAdminExchangeText(locale);

  const exchangeStatuses = metadataQuery.data?.exchangeStatuses ?? ["PENDING", "APPROVED", "DECLINED"];

  useEffect(() => {
    function closeStatusFilters() {
      setFiltersOpen(false);
    }

    window.addEventListener(USER_MENU_OPEN_EVENT, closeStatusFilters);

    return () => {
      window.removeEventListener(USER_MENU_OPEN_EVENT, closeStatusFilters);
    };
  }, []);

  const exchangesQuery = useQuery({
    queryKey: ["admin-exchanges", pageIndex, filters],
    queryFn: async () => {
      const query = buildQueryString({
        pageIndex,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        exchangeStatuses: filters.exchangeStatuses
      });
      const response = await apiRequest(`/admin/exchanges?${query}`, { auth: true });

      return response.data;
    }
  });

  function toggleStatus(status) {
    setPageIndex(0);
    setFilters((current) => ({
      ...current,
      exchangeStatuses: current.exchangeStatuses.includes(status)
        ? current.exchangeStatuses.filter((item) => item !== status)
        : [...current.exchangeStatuses, status]
    }));
  }

  const exchanges = exchangesQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <PageTitle admin icon={SwapIcon}>{t("shell.manageExchanges")}</PageTitle>
        <p>{rt(locale, "Inspect exchanges by status and open full details for books and participants.")}</p>
      </header>

      {metadataQuery.isPending ? <LoadingBlock label={rt(locale, "Loading exchange metadata")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title={rt(locale, "Exchange metadata could not be loaded")} />
      ) : null}
      {exchangesQuery.isPending ? <LoadingBlock label={rt(locale, "Loading exchange oversight")} /> : null}
      {exchangesQuery.error ? (
        <ErrorBlock error={exchangesQuery.error} title={rt(locale, "Admin exchanges could not be loaded")} />
      ) : null}

      {!exchangesQuery.isPending && !exchangesQuery.error ? (
        <div className="catalog-results-toolbar admin-exchange-results-toolbar">
          <p className="catalog-results-count">{text.exchangeFound}: {exchangesQuery.data?.totalElements ?? 0}</p>
          <div className="admin-filter-toolbar-actions">
            <div className="admin-filter-dropdown-wrap">
              <button
                aria-expanded={filtersOpen}
                aria-label={text.statusFilters}
                className="icon-button catalog-sort-direction-button"
                onClick={() => setFiltersOpen((current) => !current)}
                title={text.statusFilters}
                type="button"
              >
                <FilterIcon />
              </button>

              {filtersOpen ? (
                <div className="admin-filter-dropdown">
                  <div className="checkbox-grid admin-status-toggle-grid">
                    {exchangeStatuses.map((status) => (
                      <label className="field field-checkbox admin-checkbox-card admin-status-toggle-card" key={status}>
                        <span>{formatAdminExchangeStatusFilterLabel(status, locale)}</span>
                        <input
                          checked={filters.exchangeStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                          type="checkbox"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {!exchangesQuery.isPending && !exchangesQuery.error && exchanges.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "No exchanges match these filters")}
          description={text.noMatches}
        />
      ) : null}

      {exchanges.length > 0 ? (
        <section className="admin-exchange-grid">
          {exchanges.map((exchange) => (
            <AdminExchangeCard exchange={exchange} key={exchange.id} locale={locale} text={text} />
          ))}
        </section>
      ) : null}

      {!exchangesQuery.isPending && !exchangesQuery.error && (exchangesQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination
          onChange={setPageIndex}
          page={pageIndex}
          totalPages={exchangesQuery.data.totalPages}
        />
      ) : null}
    </section>
  );
}

export function AdminExchangeDetailsPage() {
  const { locale } = useLocale();
  const { exchangeId } = useParams();
  const text = getAdminExchangeText(locale);

  const detailQuery = useQuery({
    queryKey: ["admin-exchange", String(exchangeId)],
    enabled: Boolean(exchangeId),
    queryFn: async () => {
      const response = await apiRequest(`/admin/exchanges/${exchangeId}`, { auth: true });

      return {
        ...response.data,
        __version: response.eTag ?? response.data?.version ?? null
      };
    }
  });

  if (detailQuery.isPending) {
    return <LoadingBlock label={rt(locale, "Loading exchange details")} />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title={rt(locale, "Admin exchange details could not be loaded")} />;
  }

  const exchange = detailQuery.data;
  const acceptedName = renderUserName(exchange.receiverUser, locale);
  const declinedName = renderUserName(exchange.declinerUser, locale);

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero admin-exchange-detail-hero">
        <div className="book-detail-header-bar">
          <div className="book-detail-header-main">
            <Link aria-label={rt(locale, "Back")} className="back-link" to="/admin/exchanges">
              <ArrowLeftIcon />
            </Link>
            <PageTitle admin icon={SwapIcon}>{text.detailsTitle}</PageTitle>
          </div>
          <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
            {formatAdminExchangeStatusLabel(exchange.status, locale)}
          </span>
        </div>

        <div className="admin-user-date-stack admin-exchange-date-stack">
          <span>{text.created}: {formatDateTime(exchange.meta?.createdAt)}</span>
          <span>{text.lastUpdated}: {formatDateTime(exchange.meta?.updatedAt)}</span>
        </div>

        {exchange.status === "DECLINED" ? (
          <p className="admin-exchange-decision-line admin-exchange-decision-danger">
            <XIcon />
            <strong>{formatAdminExchangeDeclinedByLabel(locale)}</strong> {declinedName}
          </p>
        ) : null}

        {exchange.status === "APPROVED" ? (
          <p className="admin-exchange-decision-line admin-exchange-decision-success">
            <CheckIcon />
            {formatAdminExchangeAcceptedLabel(locale, acceptedName)}
          </p>
        ) : null}
      </header>

      <section className="admin-exchange-detail-grid">
        <AdminExchangeParticipantCard
          book={exchange.senderBook}
          giftRequest={!exchange.senderBook}
          label={text.sender}
          locale={locale}
          read={exchange.isReadBySender}
          text={text}
          user={exchange.senderUser}
        />

        <span aria-hidden="true" className="exchange-preview-swap-icon exchange-detail-swap-icon admin-exchange-detail-swap">
          <SwapIcon />
        </span>

        <AdminExchangeParticipantCard
          book={exchange.receiverBook}
          label={text.receiver}
          locale={locale}
          read={exchange.isReadByReceiver}
          text={text}
          user={exchange.receiverUser}
        />
      </section>
    </section>
  );
}

function AdminExchangeCard({ exchange, locale, text }) {
  const isGiftRequest = !exchange.senderBook;

  return (
    <Link className="section-card compact-card admin-exchange-card" to={`/admin/exchanges/${exchange.id}`}>
      <div className="admin-exchange-card-title-row">
        <strong>{exchange.senderBook?.name || text.withoutCounterBook}</strong>
        <strong>{exchange.receiverBook?.name || rt(locale, "Unknown receiver book")}</strong>
      </div>

      <div className="admin-exchange-card-media-row">
        <div className="admin-exchange-card-side">
          {isGiftRequest ? (
            <span aria-hidden="true" className="request-gift-illustration request-gift-illustration-card">
              <RequestGiftIcon />
            </span>
          ) : (
            <BookCover photoUrl={exchange.senderBook?.photoUrl} size="sm" title={exchange.senderBook?.name} />
          )}
        </div>

        <span aria-hidden="true" className="exchange-preview-swap-icon admin-exchange-card-swap">
          <SwapIcon />
        </span>

        <div className="admin-exchange-card-side">
          <div className="book-cover-with-badge">
            {exchange.receiverBook?.isGift ? (
              <span className="gift-icon-badge gift-icon-badge-small book-cover-corner-badge">
                <GiftIcon />
              </span>
            ) : null}
            <BookCover photoUrl={exchange.receiverBook?.photoUrl} size="sm" title={exchange.receiverBook?.name} />
          </div>
        </div>
      </div>

      <div className="admin-exchange-card-owner-row">
        <AdminExchangeOwnerInline user={exchange.senderUser} />
        <AdminExchangeOwnerInline align="end" user={exchange.receiverUser} />
      </div>

      <div className="pill-row admin-exchange-card-status">
        <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
          {formatAdminExchangeStatusLabel(exchange.status, locale)}
        </span>
      </div>
    </Link>
  );
}

function AdminExchangeParticipantCard({ book, giftRequest = false, label, locale, read, text, user }) {
  return (
    <article className="section-card exchange-book-card admin-exchange-participant-card">
      <span className="exchange-section-label">{label}</span>

      {giftRequest ? (
        <div className="admin-exchange-gift-request">
          <h2>{text.withoutCounterBook}</h2>
          <p>{text.giftRequestDescription}</p>
          <span aria-hidden="true" className="request-gift-illustration request-gift-illustration-lg">
            <RequestGiftIcon />
          </span>
        </div>
      ) : (
        <div className="admin-exchange-book-detail">
          <Link className="admin-exchange-book-cover-link" to={`/admin/books/${book?.id}`}>
            <div className="book-cover-with-badge">
              {book?.isGift ? (
                <span className="gift-icon-badge gift-icon-badge-small book-cover-corner-badge">
                  <GiftIcon />
                </span>
              ) : null}
              <BookCover photoUrl={book?.photoUrl} size="md" title={book?.name} />
            </div>
          </Link>

          <div className="admin-exchange-book-copy">
            <Link className="admin-exchange-book-title" to={`/admin/books/${book?.id}`}>
              {book?.name || rt(locale, "Not available")}
            </Link>
            <div className="book-hero-tags">
              <span className="category-chip" style={getBookCategoryTagStyle(book?.category)}>
                {formatBookCategoryLabel(book?.category, locale, rt(locale, "Not available"))}
              </span>
            </div>
            <p className="book-detail-description">
              <strong>{rt(locale, "Description")}:</strong>{" "}
              {book?.description || rt(locale, "No description provided.")}
            </p>
            <div className="book-hero-facts">
              <p>{rt(locale, "Author")}: {book?.author || rt(locale, "Not available")}</p>
              <p>{rt(locale, "Publication year")}: {renderValue(locale, book?.publicationYear)}</p>
              <p>{rt(locale, "City")}: {book?.city ? getCityDisplayName(book.city, locale) : rt(locale, "Not available")}</p>
              {book?.contactDetails ? <p>{rt(locale, "Contact details")}: {book.contactDetails}</p> : null}
            </div>
          </div>
        </div>
      )}

      <AdminExchangeUserFooter read={read} text={text} user={user} />
    </article>
  );
}

function AdminExchangeUserFooter({ read, text, user }) {
  const { locale } = useLocale();
  const content = (
    <UserIdentityInline className="admin-book-owner-inline" name={renderUserName(user, locale)} photoUrl={user?.photoUrl} size="sm">
      <strong>{renderUserName(user, locale)}</strong>
    </UserIdentityInline>
  );
  const readIcon = (
    <span
      aria-label={read ? text.read : text.unread}
      className={`read-state-icon ${read ? "read-state-icon-success" : "read-state-icon-muted"}`}
      title={read ? text.read : text.unread}
    >
      {read ? <EnvelopeOpenIcon /> : <EnvelopeClosedIcon />}
    </span>
  );

  if (!user?.id) {
    return (
      <div className="admin-exchange-user-footer-row">
        <div className="book-owner admin-exchange-user-footer-card">{content}</div>
        {readIcon}
      </div>
    );
  }

  return (
    <div className="admin-exchange-user-footer-row">
      <Link className="book-owner admin-exchange-user-footer-card admin-exchange-user-footer-link" to={`/admin/users/${user.id}`}>
        {content}
      </Link>
      {readIcon}
    </div>
  );
}

function AdminExchangeOwnerInline({ align = "start", user }) {
  const { locale } = useLocale();

  return (
    <div className={`book-owner admin-exchange-card-owner admin-exchange-card-owner-${align}`}>
      <UserIdentityInline className="admin-book-owner-inline" name={renderUserName(user, locale)} photoUrl={user?.photoUrl} size="sm">
        <strong>{renderUserName(user, locale)}</strong>
      </UserIdentityInline>
    </div>
  );
}

function renderUserName(user, locale) {
  if (!user) {
    return rt(locale, "Not available");
  }

  return user.nickname || user.email || rt(locale, "Unknown user");
}

function renderValue(locale, value) {
  return value === null || value === undefined || value === "" ? rt(locale, "Not available") : value;
}

function formatTemplate(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

function getAdminExchangeText(locale) {
  return adminExchangeText[locale] ?? adminExchangeText.en;
}

function formatAdminExchangeStatusLabel(status, locale) {
  const labels = {
    de: {
      APPROVED: "Bestätigt",
      DECLINED: "Abgelehnt",
      PENDING: "Ausstehend"
    },
    en: {
      APPROVED: "Approved",
      DECLINED: "Declined",
      PENDING: "Pending"
    },
    ru: {
      APPROVED: "Подтвержден",
      DECLINED: "Отклонен",
      PENDING: "В ожидании"
    }
  };
  const normalizedStatus = String(status || "").toUpperCase();
  const localeLabels = labels[locale] ?? labels.en;

  return localeLabels[normalizedStatus] || formatEnumLabel(status);
}

function formatAdminExchangeStatusFilterLabel(status, locale) {
  const labels = {
    de: {
      APPROVED: "Bestätigte",
      DECLINED: "Abgelehnte",
      PENDING: "Ausstehende"
    },
    en: {
      APPROVED: "Approved",
      DECLINED: "Declined",
      PENDING: "Pending"
    },
    ru: {
      APPROVED: "Подтвержденные",
      DECLINED: "Отклоненные",
      PENDING: "В ожидании"
    }
  };
  const normalizedStatus = String(status || "").toUpperCase();
  const localeLabels = labels[locale] ?? labels.en;

  return localeLabels[normalizedStatus] || formatEnumLabel(status);
}

function formatAdminExchangeAcceptedLabel(locale, userName) {
  const labels = {
    de: "{name} hat das Angebot angenommen",
    en: "{name} accepted the offer",
    ru: "Пользователь {name} принял предложение"
  };

  return formatTemplate(labels[locale] ?? labels.en, { name: userName });
}

function formatAdminExchangeDeclinedByLabel(locale) {
  const labels = {
    de: "Abgelehnt von",
    en: "Declined by",
    ru: "Отклонен пользователем"
  };

  return labels[locale] ?? labels.en;
}

function getExchangeStatusClassName(status) {
  if (status === "PENDING") {
    return "status-pill-warning";
  }

  if (status === "APPROVED") {
    return "status-pill-success";
  }

  return "status-pill-danger";
}
