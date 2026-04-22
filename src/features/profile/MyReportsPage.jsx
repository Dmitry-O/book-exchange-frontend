import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { apiRequest } from "../../shared/api/http";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { rt } from "../../shared/i18n/rawText";
import { formatEnumLabel } from "../../shared/lib/format";
import { BookCover, UserAvatar } from "../../shared/ui/Media";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const myReportsText = {
  de: {
    bookFallback: "Buch",
    commentLabel: "Kommentar",
    createdLabel: "Erstellt am",
    noComment: "Kein Kommentar angegeben.",
    reportOnBook: "Meldung zu einem Buch",
    reportOnUser: "Meldung zu einem Nutzer",
    unknownUser: "Benutzer",
    updatedLabel: "Aktualisiert am"
  },
  en: {
    bookFallback: "Book",
    commentLabel: "Comment",
    createdLabel: "Created on",
    noComment: "No comment provided.",
    reportOnBook: "Report about a book",
    reportOnUser: "Report about a user",
    unknownUser: "User",
    updatedLabel: "Updated on"
  },
  ru: {
    bookFallback: "Книга",
    commentLabel: "Комментарий",
    createdLabel: "Создана",
    noComment: "Комментарий не указан.",
    reportOnBook: "Жалоба на книгу",
    reportOnUser: "Жалоба на пользователя",
    unknownUser: "Пользователь",
    updatedLabel: "Обновлена"
  }
};

export function MyReportsPage() {
  const { locale } = useLocale();
  const [pageIndex, setPageIndex] = useState(0);
  const text = myReportsText[locale] ?? myReportsText.en;

  const reportsQuery = useQuery({
    queryKey: ["my-reports", pageIndex],
    queryFn: async () => {
      const response = await apiRequest(
        `/report/user?pageIndex=${pageIndex}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    }
  });

  const reports = reportsQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{rt(locale, "My reports")}</h1>
        <p>{rt(locale, "When you send moderation reports from public book pages, they will appear here.")}</p>
      </header>

      {reportsQuery.isPending ? <LoadingBlock label={rt(locale, "Loading reports")} /> : null}
      {reportsQuery.error ? (
        <ErrorBlock error={reportsQuery.error} title={rt(locale, "Reports could not be loaded")} />
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.error && reports.length === 0 ? (
        <EmptyBlock
          description={rt(locale, "When you send moderation reports from public book pages, they will appear here.")}
          title={rt(locale, "No reports created yet")}
        />
      ) : null}

      {reports.length > 0 ? (
        <section className="list-stack">
          {reports.map((report) => {
            const isBookTarget = report.targetType === "BOOK";
            const targetBook = report.targetBook ?? null;
            const targetUser = report.targetUser ?? null;
            const targetTitle = isBookTarget
              ? targetBook?.name || `${text.bookFallback} #${report.targetId}`
              : targetUser?.nickname || `${text.unknownUser} #${report.targetId}`;

            return (
              <article className="section-card compact-card report-card" key={report.id}>
                <div className="row-between report-card-top">
                  <div className="report-target-row">
                    {isBookTarget ? (
                      <Link className="report-target-link" to={`/book/${targetBook?.id ?? report.targetId}`}>
                        <BookCover
                          photoUrl={targetBook?.photoUrl ?? ""}
                          placeholderVariant="fullbleed"
                          size="sm"
                          title={targetTitle}
                        />
                        <div className="report-target-copy">
                          <h2>{text.reportOnBook}</h2>
                          <strong>{targetTitle}</strong>
                          <div className="report-meta-lines">
                            <span>{formatReportDateLine(report.createdAt, locale, text.createdLabel)}</span>
                            <span>{formatReportDateLine(report.updatedAt, locale, text.updatedLabel)}</span>
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="report-target-link report-target-link-static">
                        <UserAvatar name={targetTitle} photoUrl={targetUser?.photoUrl} size="sm" />
                        <div className="report-target-copy">
                          <h2>{text.reportOnUser}</h2>
                          <strong>{targetTitle}</strong>
                          <div className="report-meta-lines">
                            <span>{formatReportDateLine(report.createdAt, locale, text.createdLabel)}</span>
                            <span>{formatReportDateLine(report.updatedAt, locale, text.updatedLabel)}</span>
                          </div>
                        </div>
                      </div>
                    )}
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

                <div className="report-comment-field">
                  <span>{text.commentLabel}</span>
                  <div className="field-control report-comment-value">
                    {report.comment || text.noComment}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.error && (reportsQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination onChange={setPageIndex} page={pageIndex} totalPages={reportsQuery.data.totalPages} />
      ) : null}
    </section>
  );
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

function formatReportDateLine(value, locale, prefix) {
  if (!value) {
    return "";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return `${prefix} ${value}`;
    }

    const { day, month, year } = extractDateParts(date, locale);
    const timePart = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);

    if (locale === "ru") {
      return `${prefix} ${day} ${month} ${year} г. в ${timePart}`;
    }

    if (locale === "de") {
      return `${prefix} ${day}. ${month} ${year} um ${timePart}`;
    }

    return `${prefix} ${day} ${month} ${year} at ${timePart}`;
  } catch {
    return `${prefix} ${value}`;
  }
}

function extractDateParts(date, locale) {
  const parts = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).formatToParts(date);

  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: parts.find((part) => part.type === "month")?.value ?? "",
    year: parts.find((part) => part.type === "year")?.value ?? ""
  };
}
