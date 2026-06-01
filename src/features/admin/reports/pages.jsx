import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { useLocale } from "../../../shared/i18n/LocaleContext";
import { rt } from "../../../shared/i18n/rawText";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { BookCover, UserAvatar } from "../../../shared/ui/Media";
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon, FilterIcon, FlagIcon, SortDirectionIcon, UserIcon, XIcon } from "../../../shared/ui/Icons";
import { PageTitle } from "../../../shared/ui/PageTitle";
import { Pagination } from "../../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../../shared/ui/StateBlocks";

const defaultFilters = {
  reportStatuses: [],
  sortDirection: "DESC"
};

const USER_MENU_OPEN_EVENT = "book-exchange:user-menu-open";

const adminReportsText = {
  de: {
    comment: "Kommentar",
    created: "Erstellt",
    emptyDescription: "Wähle einen anderen Moderationsstatus oder ändere die Sortierung.",
    found: "Gefundene Meldungen",
    lastUpdated: "Letzte Aktualisierung",
    noComment: "Kein Kommentar angegeben.",
    pageTitle: "Nutzermeldungen",
    reportOnBook: "Meldung zu einem Buch",
    reportOnUser: "Meldung zu einem Nutzer",
    manageTitle: "Beschwerdeverwaltung",
    sortToggleAscending: "Aufsteigend sortieren",
    sortToggleDescending: "Absteigend sortieren",
    statusFilters: "Statusfilter",
    targetBookFallback: "Buch",
    targetUserFallback: "Nutzer",
    unknownTarget: "Ziel nicht verfügbar"
  },
  en: {
    comment: "Comment",
    created: "Created",
    emptyDescription: "Choose another moderation status or change the sort order.",
    found: "Reports found",
    lastUpdated: "Last updated",
    noComment: "No comment provided.",
    pageTitle: "User reports",
    reportOnBook: "Report about a book",
    reportOnUser: "Report about a user",
    manageTitle: "Report management",
    sortToggleAscending: "Sort ascending",
    sortToggleDescending: "Sort descending",
    statusFilters: "Status filters",
    targetBookFallback: "Book",
    targetUserFallback: "User",
    unknownTarget: "Target unavailable"
  },
  ru: {
    comment: "Комментарий",
    created: "Создана",
    emptyDescription: "Выберите другой статус модерации или измените направление сортировки.",
    found: "Найдено жалоб",
    lastUpdated: "Последнее обновление",
    noComment: "Комментарий не указан.",
    pageTitle: "Жалобы пользователей",
    reportOnBook: "Жалоба на книгу",
    reportOnUser: "Жалоба на пользователя",
    manageTitle: "Управление жалобами",
    sortToggleAscending: "Сортировать по возрастанию",
    sortToggleDescending: "Сортировать по убыванию",
    statusFilters: "Фильтры по статусу",
    targetBookFallback: "Книга",
    targetUserFallback: "Пользователь",
    unknownTarget: "Цель недоступна"
  }
};

export function AdminReportsPage() {
  const { locale } = useLocale();
  const metadataQuery = useMetadataQuery();
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(null);
  const text = getAdminReportsText(locale);

  const reportStatuses = metadataQuery.data?.reportStatuses ?? ["OPEN", "RESOLVED", "REJECTED"];

  useEffect(() => {
    function closeStatusFilters() {
      setFiltersOpen(false);
    }

    function handleDocumentClick(event) {
      if (!filtersRef.current?.contains(event.target)) {
        setFiltersOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    window.addEventListener(USER_MENU_OPEN_EVENT, closeStatusFilters);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      window.removeEventListener(USER_MENU_OPEN_EVENT, closeStatusFilters);
    };
  }, []);

  const reportsQuery = useQuery({
    queryKey: ["admin-reports", pageIndex, filters],
    queryFn: async () => {
      const query = buildQueryString({
        pageIndex,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        reportStatuses: filters.reportStatuses,
        sortDirection: filters.sortDirection === "ASC" ? undefined : filters.sortDirection
      });
      const response = await apiRequest(`/admin/reports?${query}`, { auth: true });

      return {
        ...response.data,
        content: await enrichReportsWithTargets(response.data?.content ?? [])
      };
    }
  });

  function toggleStatus(status) {
    setPageIndex(0);
    setFilters((current) => ({
      ...current,
      reportStatuses: current.reportStatuses.includes(status)
        ? current.reportStatuses.filter((item) => item !== status)
        : [...current.reportStatuses, status]
    }));
  }

  function toggleSortDirection() {
    setPageIndex(0);
    setFilters((current) => ({
      ...current,
      sortDirection: current.sortDirection === "ASC" ? "DESC" : "ASC"
    }));
  }

  const reports = reportsQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <PageTitle admin icon={FlagIcon}>{text.manageTitle}</PageTitle>
        <p>{rt(locale, "Review incoming reports, filter them by status, and open each case in detail.")}</p>
      </header>

      {metadataQuery.isPending ? <LoadingBlock label={rt(locale, "Loading report metadata")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title={rt(locale, "Report metadata could not be loaded")} />
      ) : null}
      {reportsQuery.isPending ? <LoadingBlock label={rt(locale, "Loading moderation reports")} /> : null}
      {reportsQuery.error ? (
        <ErrorBlock error={reportsQuery.error} title={rt(locale, "Admin reports could not be loaded")} />
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.error ? (
        <div className="catalog-results-toolbar admin-reports-results-toolbar">
          <p className="catalog-results-count">{text.found}: {reportsQuery.data?.totalElements ?? 0}</p>
          <div className="admin-filter-toolbar-actions">
            <div className="admin-filter-dropdown-wrap" ref={filtersRef}>
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
                  <div className="checkbox-grid admin-report-status-grid">
                    {reportStatuses.map((status) => (
                      <label className="field field-checkbox admin-checkbox-card admin-report-status-card" key={status}>
                        <span>{formatAdminReportStatusFilterLabel(status, locale)}</span>
                        <input
                          checked={filters.reportStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                          type="checkbox"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <button
              aria-label={
                filters.sortDirection === "ASC"
                  ? text.sortToggleDescending
                  : text.sortToggleAscending
              }
              className="icon-button catalog-sort-direction-button"
              onClick={toggleSortDirection}
              title={
                filters.sortDirection === "ASC"
                  ? text.sortToggleDescending
                  : text.sortToggleAscending
              }
              type="button"
            >
              <SortDirectionIcon direction={filters.sortDirection} />
            </button>
          </div>
        </div>
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.error && reports.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "No reports match these filters")}
          description={text.emptyDescription}
        />
      ) : null}

      {reports.length > 0 ? (
        <section className="report-card-grid">
          {reports.map((report) => (
            <AdminReportCard key={report.id} report={report} text={text} />
          ))}
        </section>
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.error && (reportsQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination
          onChange={setPageIndex}
          page={pageIndex}
          totalPages={reportsQuery.data.totalPages}
        />
      ) : null}
    </section>
  );
}

export function AdminReportDetailsPage() {
  const { locale } = useLocale();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { reportId } = useParams();
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const text = getAdminReportsText(locale);
  const backTo = location.state?.backTo || "/admin/reports";

  const detailQuery = useQuery({
    queryKey: ["admin-report", String(reportId)],
    enabled: Boolean(reportId),
    queryFn: async () => {
      const response = await apiRequest(`/admin/reports/${reportId}`, { auth: true });

      return withVersion(response);
    }
  });

  const targetQuery = useQuery({
    queryKey: [
      "admin-report-target",
      String(reportId),
      detailQuery.data?.targetType,
      detailQuery.data?.targetId
    ],
    enabled: Boolean(detailQuery.data?.targetType && detailQuery.data?.targetId),
    queryFn: async () => {
      const report = detailQuery.data;
      return fetchAdminReportTarget(report);
    }
  });

  async function handleAction(action) {
    const report = detailQuery.data;
    const confirmed = window.confirm(
      action === "resolve"
        ? rt(locale, "Resolve this report and mark it as handled?")
        : rt(locale, "Reject this report as not actionable?")
    );

    if (!confirmed) {
      return;
    }

    setPendingAction(action);
    setActionError(null);
    setActionMessage("");

    try {
      const response = await apiRequest(`/admin/reports/${report.id}/${action}`, {
        method: "PATCH",
        auth: true,
        version: report.__version ?? report.version
      });

      queryClient.setQueryData(["admin-report", String(reportId)], withVersion(response));
      await queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      setActionMessage(
        action === "resolve" ? rt(locale, "Report resolved.") : rt(locale, "Report rejected.")
      );
    } catch (error) {
      setActionError(error);
    } finally {
      setPendingAction(null);
    }
  }

  if (detailQuery.isPending) {
    return <LoadingBlock label={rt(locale, "Loading report details")} />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title={rt(locale, "Admin report details could not be loaded")} />;
  }

  const report = detailQuery.data;
  const isBookTarget = report.targetType === "BOOK";
  const target = targetQuery.data ?? null;
  const targetTitle = resolveReportTargetTitle(report, text, target);
  const title = getReportTitle(report, text);
  const targetLink = resolveReportTargetLink(report);

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero admin-report-detail-hero">
        <div className="book-detail-header-bar">
          <div className="book-detail-header-main">
            <Link aria-label={rt(locale, "Back to reports")} className="back-link" to={backTo}>
              <ArrowLeftIcon />
            </Link>
            <PageTitle admin icon={FlagIcon}>{title}</PageTitle>
          </div>

          <div className="pill-row admin-report-detail-labels">
            <span className={`status-pill ${getReportStatusClassName(report.status)}`}>
              {formatEnumLabel(report.status)}
            </span>
            <span className="status-pill status-pill-neutral">
              {formatReportTargetTypeLabel(report.targetType, locale)}
            </span>
            <span className={`status-pill ${getReportReasonClassName(report.reason)}`}>
              {formatEnumLabel(report.reason)}
            </span>
          </div>
        </div>

        <div className="hero-icon-actions admin-report-navigation-actions">
          <Link
            aria-label={rt(locale, "Open target")}
            className="icon-button"
            title={rt(locale, "Open target")}
            to={targetLink}
          >
            <ExternalLinkIcon />
          </Link>
          {report.reporter?.id ? (
            <Link
              aria-label={rt(locale, "Open reporter")}
              className="icon-button"
              title={rt(locale, "Open reporter")}
              to={`/admin/users/${report.reporter.id}`}
            >
              <UserIcon />
            </Link>
          ) : null}
        </div>

        <div className="admin-report-target-summary">
          {isBookTarget ? (
            <BookCover
              photoUrl={target?.photoUrl ?? report.targetBook?.photoUrl ?? ""}
              placeholderVariant="fullbleed"
              size="md"
              title={targetTitle}
            />
          ) : (
            <UserAvatar
              name={targetTitle}
              photoUrl={target?.photoUrl ?? report.targetUser?.photoUrl}
              size="lg"
            />
          )}

          <div className="admin-report-target-copy">
            <h2>{targetTitle}</h2>
            {!isBookTarget ? <p>{target?.email || rt(locale, "Not available")}</p> : null}

            <div className="admin-user-date-stack admin-report-date-stack">
              <span>{text.created}: {formatDateTime(report.meta?.createdAt)}</span>
              <span>{text.lastUpdated}: {formatDateTime(report.meta?.updatedAt)}</span>
            </div>

            <p className="admin-report-comment-line">
              <strong>{text.comment}:</strong> {report.comment || text.noComment}
            </p>

            {targetQuery.error ? (
              <p className="inline-message inline-message-error">{text.unknownTarget}</p>
            ) : null}
          </div>
        </div>

        {report.status === "OPEN" ? (
          <div className="card-actions admin-report-detail-actions">
            <button
              aria-label={rt(locale, "Resolve report")}
              className="icon-button icon-button-success"
              disabled={pendingAction !== null}
              onClick={() => void handleAction("resolve")}
              title={rt(locale, "Resolve report")}
              type="button"
            >
              <CheckIcon />
            </button>
            <button
              aria-label={rt(locale, "Reject report")}
              className="icon-button icon-button-danger"
              disabled={pendingAction !== null}
              onClick={() => void handleAction("reject")}
              title={rt(locale, "Reject report")}
              type="button"
            >
              <XIcon />
            </button>
          </div>
        ) : null}
      </header>

      {actionMessage ? <p className="inline-message inline-message-success">{actionMessage}</p> : null}
      {actionError ? <ErrorBlock error={actionError} title={rt(locale, "Report action failed")} /> : null}
    </section>
  );
}

function AdminReportCard({ report, text }) {
  const isBookTarget = report.targetType === "BOOK";
  const targetTitle = resolveReportTargetTitle(report, text);
  const cardClasses = [
    "section-card",
    "compact-card",
    "report-card",
    "report-card-link",
    report.status !== "OPEN" ? "report-card-muted" : ""
  ].filter(Boolean).join(" ");

  return (
    <Link className={cardClasses} to={`/admin/reports/${report.id}`}>
      <div className="report-card-top">
        <div className="report-target-row">
          <div className="report-target-link report-target-link-static">
            {isBookTarget ? (
              <BookCover
                photoUrl={report.targetBook?.photoUrl ?? ""}
                placeholderVariant="fullbleed"
                size="sm"
                title={targetTitle}
              />
            ) : (
              <UserAvatar name={targetTitle} photoUrl={report.targetUser?.photoUrl} size="sm" />
            )}
            <div className="report-target-copy">
              <h2>{getReportTitle(report, text)}</h2>
              <strong>{targetTitle}</strong>
            </div>
          </div>
        </div>

        <div className="pill-row report-pill-row">
          <span className={`status-pill ${getReportStatusClassName(report.status)}`}>
            {formatEnumLabel(report.status)}
          </span>
          <span className={`status-pill ${getReportReasonClassName(report.reason)}`}>
            {formatEnumLabel(report.reason)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function resolveReportTargetLink(report) {
  return report.targetType === "USER"
    ? `/admin/users/${report.targetId}`
    : `/admin/books/${report.targetId}`;
}

async function enrichReportsWithTargets(reports) {
  const targetRequests = new Map();

  return Promise.all(
    reports.map(async (report) => {
      if (report.targetBook || report.targetUser || !report.targetType || !report.targetId) {
        return report;
      }

      const targetKey = `${report.targetType}:${report.targetId}`;

      if (!targetRequests.has(targetKey)) {
        targetRequests.set(targetKey, fetchAdminReportTarget(report).catch(() => null));
      }

      const target = await targetRequests.get(targetKey);

      if (!target) {
        return report;
      }

      return report.targetType === "BOOK"
        ? { ...report, targetBook: normalizeReportBookTarget(target) }
        : { ...report, targetUser: normalizeReportUserTarget(target) };
    })
  );
}

async function fetchAdminReportTarget(report) {
  const targetPath =
    report.targetType === "USER"
      ? `/admin/users/${report.targetId}`
      : `/admin/books/${report.targetId}`;
  const response = await apiRequest(targetPath, { auth: true });

  return response.data;
}

function normalizeReportBookTarget(book) {
  return {
    id: book.id,
    name: book.name,
    photoUrl: book.photoUrl,
    ownerUserId: book.ownerUserId,
    ownerNickname: book.ownerNickname,
    ownerPhotoUrl: book.ownerPhotoUrl
  };
}

function normalizeReportUserTarget(user) {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    photoUrl: user.photoUrl
  };
}

function resolveReportTargetTitle(report, text, target = null) {
  if (report.targetType === "BOOK") {
    return (
      target?.name ||
      report.targetBook?.name ||
      `${text.targetBookFallback} #${report.targetId}`
    );
  }

  return (
    target?.nickname ||
    target?.email ||
    report.targetUser?.nickname ||
    `${text.targetUserFallback} #${report.targetId}`
  );
}

function getReportTitle(report, text) {
  return report.targetType === "BOOK" ? text.reportOnBook : text.reportOnUser;
}

function formatReportTargetTypeLabel(targetType, locale) {
  if (targetType === "BOOK") {
    return locale === "ru" ? "Книга" : formatEnumLabel("BOOK");
  }

  return locale === "ru" ? "Пользователь" : formatEnumLabel("USER");
}

function formatAdminReportStatusFilterLabel(status, locale) {
  const labels = {
    de: {
      OPEN: "In Prüfung",
      REJECTED: "Abgelehnte",
      RESOLVED: "Bearbeitete"
    },
    en: {
      OPEN: "Under review",
      REJECTED: "Rejected",
      RESOLVED: "Processed"
    },
    ru: {
      OPEN: "На рассмотрении",
      REJECTED: "Отклоненные",
      RESOLVED: "Обработанные"
    }
  };
  const normalizedStatus = String(status || "").toUpperCase();
  const localeLabels = labels[locale] ?? labels.en;

  return localeLabels[normalizedStatus] || formatEnumLabel(status);
}

function getAdminReportsText(locale) {
  return adminReportsText[locale] ?? adminReportsText.en;
}

function getReportStatusClassName(status) {
  if (status === "OPEN") {
    return "status-pill-warning";
  }

  if (status === "RESOLVED") {
    return "status-pill-success";
  }

  return "status-pill-neutral";
}

function getReportReasonClassName(reason) {
  if (reason === "FRAUD" || reason === "INAPPROPRIATE") {
    return "status-pill-reason-danger";
  }

  if (reason === "SPAM") {
    return "status-pill-reason-warning";
  }

  return "status-pill-reason-neutral";
}

function withVersion(response) {
  return {
    ...response.data,
    __version: response.eTag ?? response.data?.version ?? null
  };
}
