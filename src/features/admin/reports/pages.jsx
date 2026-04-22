import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { useLocale } from "../../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../../shared/i18n/rawText";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { UserAvatar } from "../../../shared/ui/Media";
import { ArrowLeftIcon, CheckIcon, ExternalLinkIcon, UserIcon, XIcon } from "../../../shared/ui/Icons";
import { Pagination } from "../../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../../shared/ui/StateBlocks";

const defaultFilters = {
  reportStatuses: [],
  sortDirection: "ASC"
};

export function AdminReportsPage() {
  const { locale } = useLocale();
  const metadataQuery = useMetadataQuery();
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);

  const reportStatuses = metadataQuery.data?.reportStatuses ?? ["OPEN", "RESOLVED", "REJECTED"];

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

      return response.data;
    }
  });

  function handleApplyFilters(event) {
    event.preventDefault();
    setPageIndex(0);
    setFilters({
      reportStatuses: [...draftFilters.reportStatuses],
      sortDirection: draftFilters.sortDirection
    });
  }

  function handleResetFilters() {
    setPageIndex(0);
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  }

  function toggleStatus(status) {
    setDraftFilters((current) => ({
      ...current,
      reportStatuses: current.reportStatuses.includes(status)
        ? current.reportStatuses.filter((item) => item !== status)
        : [...current.reportStatuses, status]
    }));
  }

  const reports = reportsQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{rt(locale, "Moderation queue")}</h1>
        <p>{rt(locale, "Review incoming reports, filter them by status, and open each case in detail.")}</p>
      </header>

      <section className="section-card">
        <form className="content-stack" onSubmit={handleApplyFilters}>
          <div className="filters-grid">
            <label className="field">
              <span>{rt(locale, "Sort direction")}</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    sortDirection: event.target.value
                  }))
                }
                value={draftFilters.sortDirection}
              >
                <option value="ASC">{rt(locale, "Ascending")}</option>
                <option value="DESC">{rt(locale, "Descending")}</option>
              </select>
            </label>

            <div className="field">
              <span>{rt(locale, "Result set")}</span>
              <div className="admin-summary-box">
                <strong>{reportsQuery.data?.totalElements ?? 0}</strong>
                <span>{rt(locale, "matching reports")}</span>
              </div>
            </div>
          </div>

          <div className="field">
            <span>{rt(locale, "Status filters")}</span>
            <div className="checkbox-grid">
              {reportStatuses.map((status) => (
                <label className="field field-checkbox admin-checkbox-card" key={status}>
                  <span>{formatEnumLabel(status)}</span>
                  <input
                    checked={draftFilters.reportStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="filters-actions">
            <button className="button" type="submit">
              {rt(locale, "Apply filters")}
            </button>
            <button className="button button-secondary" onClick={handleResetFilters} type="button">
              {rt(locale, "Reset")}
            </button>
          </div>
        </form>
      </section>

      {metadataQuery.isPending ? <LoadingBlock label={rt(locale, "Loading report metadata")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title={rt(locale, "Report metadata could not be loaded")} />
      ) : null}
      {reportsQuery.isPending ? <LoadingBlock label={rt(locale, "Loading moderation reports")} /> : null}
      {reportsQuery.error ? (
        <ErrorBlock error={reportsQuery.error} title={rt(locale, "Admin reports could not be loaded")} />
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.error && reports.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "No reports match these filters")}
          description={rt(locale, "Try resetting the filters or selecting a different moderation status.")}
        />
      ) : null}

      {reports.length > 0 ? (
        <section className="list-stack">
          {reports.map((report) => (
            <article className="section-card compact-card" key={report.id}>
              <div className="row-between">
                <div className="entity-inline">
                  <UserAvatar
                    name={report.reporter?.nickname || report.reporter?.email}
                    photoUrl={report.reporter?.photoUrl}
                    size="md"
                  />
                  <div>
                    <h2>
                      {formatEnumLabel(report.targetType)} {formatEnumLabel("REPORT")}
                    </h2>
                    <p className="muted-line">
                      {rt(locale, "Reporter")}: {report.reporter?.nickname || rt(locale, "Unknown")} / {formatDateTime(report.meta?.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="pill-row">
                  <span className={`status-pill ${getReportStatusClassName(report.status)}`}>
                    {formatEnumLabel(report.status)}
                  </span>
                </div>
              </div>

              <dl className="detail-list detail-list-compact">
                <div>
                  <dt>{rt(locale, "Reason")}</dt>
                  <dd>{formatEnumLabel(report.reason)}</dd>
                </div>
                <div>
                  <dt>{rt(locale, "Target type")}</dt>
                  <dd>{formatEnumLabel(report.targetType)}</dd>
                </div>
                <div>
                  <dt>{rt(locale, "Created at")}</dt>
                  <dd>{formatDateTime(report.meta?.createdAt)}</dd>
                </div>
                <div>
                  <dt>{rt(locale, "Updated at")}</dt>
                  <dd>{formatDateTime(report.meta?.updatedAt)}</dd>
                </div>
              </dl>

              <p className="book-description">{report.comment || rt(locale, "No moderator note provided.")}</p>

              <div className="card-actions">
                <div className="action-icon-group">
                  <Link
                    aria-label={rt(locale, "Open target")}
                    className="icon-button"
                    title={rt(locale, "Open target")}
                    to={resolveReportTargetLink(report)}
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

                <Link className="button button-secondary" to={`/admin/reports/${report.id}`}>
                  {rt(locale, "Open details")}
                </Link>
              </div>
            </article>
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
  const queryClient = useQueryClient();
  const { reportId } = useParams();
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin-report", String(reportId)],
    enabled: Boolean(reportId),
    queryFn: async () => {
      const response = await apiRequest(`/admin/reports/${reportId}`, { auth: true });

      return withVersion(response);
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
  const reporterRoles =
    (report.reporter?.roles ?? []).map((role) => formatEnumLabel(role)).join(", ") || rt(locale, "None");

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label={rt(locale, "Back to reports")} className="back-link" to="/admin/reports">
            <ArrowLeftIcon />
          </Link>

          <div className="hero-icon-actions">
            <Link
              aria-label={rt(locale, "Open target")}
              className="icon-button"
              title={rt(locale, "Open target")}
              to={resolveReportTargetLink(report)}
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
            <button
              aria-label={rt(locale, "Resolve report")}
              className="icon-button icon-button-success"
              disabled={report.status !== "OPEN" || pendingAction !== null}
              onClick={() => void handleAction("resolve")}
              title={rt(locale, "Resolve report")}
              type="button"
            >
              <CheckIcon />
            </button>
            <button
              aria-label={rt(locale, "Reject report")}
              className="icon-button icon-button-danger"
              disabled={report.status !== "OPEN" || pendingAction !== null}
              onClick={() => void handleAction("reject")}
              title={rt(locale, "Reject report")}
              type="button"
            >
              <XIcon />
            </button>
          </div>
        </div>

        <h1>{formatEnumLabel(report.targetType)} {formatEnumLabel("REPORT")}</h1>
        <p>{rt(locale, "Review this report, inspect the reporter, and decide whether to resolve or reject it.")}</p>
        <div className="hero-meta-line">
          <span>{rt(locale, "Created at")}: {formatDateTime(report.meta?.createdAt)}</span>
          <span>{rt(locale, "Updated at")}: {formatDateTime(report.meta?.updatedAt)}</span>
        </div>
        <div className="pill-row">
          <span className={`status-pill ${getReportStatusClassName(report.status)}`}>
            {formatEnumLabel(report.status)}
          </span>
        </div>
      </header>

      {actionMessage ? <p className="inline-message inline-message-success">{actionMessage}</p> : null}

      <section className="detail-grid">
        <article className="section-card">
          <h2>{rt(locale, "Report overview")}</h2>
          <dl className="detail-list">
            <div>
              <dt>{rt(locale, "Target type")}</dt>
              <dd>{formatEnumLabel(report.targetType)}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Reason")}</dt>
              <dd>{formatEnumLabel(report.reason)}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Status")}</dt>
              <dd>{formatEnumLabel(report.status)}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Comment")}</dt>
              <dd>{report.comment || rt(locale, "No report comment provided.")}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Created at")}</dt>
              <dd>{formatDateTime(report.meta?.createdAt)}</dd>
            </div>
          </dl>
        </article>

        <article className="section-card">
          <div className="entity-header">
            <UserAvatar
              name={report.reporter?.nickname || report.reporter?.email}
              photoUrl={report.reporter?.photoUrl}
              size="lg"
            />
            <div>
              <h2>{rt(locale, "Reporter overview")}</h2>
              <p>{rt(locale, "Review the reporter account and open the full admin user page if needed.")}</p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>{rt(locale, "Reporter nickname")}</dt>
              <dd>{report.reporter?.nickname || rt(locale, "Not available")}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Reporter email")}</dt>
              <dd>{report.reporter?.email || rt(locale, "Not available")}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Reporter roles")}</dt>
              <dd>{reporterRoles}</dd>
            </div>
            <div>
              <dt>{rt(locale, "Reporter navigation")}</dt>
              <dd>
                {report.reporter?.id ? (
                  <Link className="link-inline" to={`/admin/users/${report.reporter.id}`}>
                    {rt(locale, "Open reporter")}
                  </Link>
                ) : (
                  rt(locale, "Not available")
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </section>
  );
}

function resolveReportTargetLink(report) {
  if (report.targetType === "USER") {
    return `/admin/users/${report.targetId}`;
  }

  return `/admin/books/${report.targetId}`;
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

function withVersion(response) {
  return {
    ...response.data,
    __version: response.eTag ?? response.data?.version ?? null
  };
}
