import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { UserAvatar } from "../../../shared/ui/Media";
import { Pagination } from "../../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../../shared/ui/StateBlocks";

const defaultFilters = {
  reportStatuses: [],
  sortDirection: "ASC"
};

export function AdminReportsPage() {
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
        <span className="eyebrow">Admin reports</span>
        <h1>Moderation queue</h1>
        <p>
          This screen uses `GET /admin/reports` with status filters and sort direction, then opens
          individual moderation decisions in the detail view.
        </p>
      </header>

      <section className="section-card">
        <form className="content-stack" onSubmit={handleApplyFilters}>
          <div className="filters-grid">
            <label className="field">
              <span>Sort direction</span>
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
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </label>

            <div className="field">
              <span>Result set</span>
              <div className="admin-summary-box">
                <strong>{reportsQuery.data?.totalElements ?? 0}</strong>
                <span>matching reports</span>
              </div>
            </div>
          </div>

          <div className="field">
            <span>Status filters</span>
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
              Apply filters
            </button>
            <button className="button button-secondary" onClick={handleResetFilters} type="button">
              Reset
            </button>
          </div>
        </form>
      </section>

      {metadataQuery.isPending ? <LoadingBlock label="Loading report metadata" /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title="Report metadata could not be loaded" />
      ) : null}
      {reportsQuery.isPending ? <LoadingBlock label="Loading moderation reports" /> : null}
      {reportsQuery.error ? (
        <ErrorBlock error={reportsQuery.error} title="Admin reports could not be loaded" />
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.error && reports.length === 0 ? (
        <EmptyBlock
          title="No reports match these filters"
          description="Try resetting the filters or selecting a different moderation status."
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
                    {formatEnumLabel(report.targetType)} report #{report.id}
                  </h2>
                  <p className="muted-line">
                    Reporter: {report.reporter?.nickname || "Unknown"} / target {report.targetId}
                  </p>
                  </div>
                </div>

                <div className="pill-row">
                  <span className={`status-pill ${getReportStatusClassName(report.status)}`}>
                    {formatEnumLabel(report.status)}
                  </span>
                  <span className="subtle-chip">v{report.version}</span>
                </div>
              </div>

              <dl className="detail-list detail-list-compact">
                <div>
                  <dt>Reason</dt>
                  <dd>{formatEnumLabel(report.reason)}</dd>
                </div>
                <div>
                  <dt>Target type</dt>
                  <dd>{formatEnumLabel(report.targetType)}</dd>
                </div>
                <div>
                  <dt>Created at</dt>
                  <dd>{formatDateTime(report.meta?.createdAt)}</dd>
                </div>
                <div>
                  <dt>Updated at</dt>
                  <dd>{formatDateTime(report.meta?.updatedAt)}</dd>
                </div>
              </dl>

              <p className="book-description">{report.comment || "No moderator note provided."}</p>

              <div className="card-actions">
                <div className="pill-row">
                  <Link className="link-inline" to={resolveReportTargetLink(report)}>
                    Open target
                  </Link>
                  {report.reporter?.id ? (
                    <Link className="link-inline" to={`/admin/users/${report.reporter.id}`}>
                      Open reporter
                    </Link>
                  ) : null}
                </div>

                <Link className="button button-secondary" to={`/admin/reports/${report.id}`}>
                  Open details
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
        ? "Resolve this report and mark it as handled?"
        : "Reject this report as not actionable?"
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
      setActionMessage(action === "resolve" ? "Report resolved." : "Report rejected.");
    } catch (error) {
      setActionError(error);
    } finally {
      setPendingAction(null);
    }
  }

  if (detailQuery.isPending) {
    return <LoadingBlock label="Loading report details" />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title="Admin report details could not be loaded" />;
  }

  const report = detailQuery.data;
  const reporterRoles =
    (report.reporter?.roles ?? []).map((role) => formatEnumLabel(role)).join(", ") || "None";

  return (
    <section className="content-stack">
      <header className="section-card">
        <div className="row-between">
          <div>
            <span className="eyebrow">Admin report details</span>
            <h1>
              {formatEnumLabel(report.targetType)} report #{report.id}
            </h1>
            <p>
              This page uses `GET /admin/reports/{'{reportId}'}` and lets moderators resolve or
              reject open reports with optimistic locking.
            </p>
          </div>

          <div className="pill-row">
            <span className={`status-pill ${getReportStatusClassName(report.status)}`}>
              {formatEnumLabel(report.status)}
            </span>
            <span className="subtle-chip">v{report.__version ?? report.version}</span>
          </div>
        </div>
      </header>

      {actionMessage ? <p className="inline-message inline-message-success">{actionMessage}</p> : null}

      <section className="detail-grid">
        <article className="section-card">
          <h2>Report snapshot</h2>
          <dl className="detail-list">
            <div>
              <dt>Target type</dt>
              <dd>{formatEnumLabel(report.targetType)}</dd>
            </div>
            <div>
              <dt>Target id</dt>
              <dd>{report.targetId}</dd>
            </div>
            <div>
              <dt>Reason</dt>
              <dd>{formatEnumLabel(report.reason)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{formatEnumLabel(report.status)}</dd>
            </div>
            <div>
              <dt>Comment</dt>
              <dd>{report.comment || "No report comment provided."}</dd>
            </div>
            <div>
              <dt>Target navigation</dt>
              <dd>
                <Link className="link-inline" to={resolveReportTargetLink(report)}>
                  Open target
                </Link>
              </dd>
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
              <h2>Reporter snapshot</h2>
              <p>Reporter media comes from the nested `UserDTO.photoUrl` field.</p>
            </div>
          </div>

          <dl className="detail-list">
            <div>
              <dt>Reporter id</dt>
              <dd>{report.reporter?.id ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Reporter nickname</dt>
              <dd>{report.reporter?.nickname || "Not available"}</dd>
            </div>
            <div>
              <dt>Reporter email</dt>
              <dd>{report.reporter?.email || "Not available"}</dd>
            </div>
            <div>
              <dt>Reporter photo URL</dt>
              <dd>{report.reporter?.photoUrl || "Not available"}</dd>
            </div>
            <div>
              <dt>Reporter roles</dt>
              <dd>{reporterRoles}</dd>
            </div>
            <div>
              <dt>Reporter locale</dt>
              <dd>{report.reporter?.locale || "Not available"}</dd>
            </div>
            <div>
              <dt>Reporter navigation</dt>
              <dd>
                {report.reporter?.id ? (
                  <Link className="link-inline" to={`/admin/users/${report.reporter.id}`}>
                    Open reporter
                  </Link>
                ) : (
                  "Not available"
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="detail-grid">
        <article className="section-card">
          <h2>Moderation actions</h2>
          <p>Open reports can be resolved or rejected here. Closed reports stay read-only.</p>

          {actionError ? <ErrorBlock error={actionError} title="Report action failed" /> : null}

          <div className="card-actions">
            <button
              className="button"
              disabled={report.status !== "OPEN" || pendingAction !== null}
              onClick={() => void handleAction("resolve")}
              type="button"
            >
              {pendingAction === "resolve" ? "Resolving..." : "Resolve report"}
            </button>
            <button
              className="button button-danger"
              disabled={report.status !== "OPEN" || pendingAction !== null}
              onClick={() => void handleAction("reject")}
              type="button"
            >
              {pendingAction === "reject" ? "Rejecting..." : "Reject report"}
            </button>
            <Link className="button button-secondary" to="/admin/reports">
              Back to reports
            </Link>
          </div>
        </article>

        <article className="section-card">
          <h2>Audit metadata</h2>
          <dl className="detail-list">
            <div>
              <dt>Created at</dt>
              <dd>{formatDateTime(report.meta?.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated at</dt>
              <dd>{formatDateTime(report.meta?.updatedAt)}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{report.meta?.createdBy ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Updated by</dt>
              <dd>{report.meta?.updatedBy ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Created request id</dt>
              <dd>{report.meta?.createdRequestId || "Not available"}</dd>
            </div>
            <div>
              <dt>Updated request id</dt>
              <dd>{report.meta?.updatedRequestId || "Not available"}</dd>
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
