import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { apiRequest } from "../../shared/api/http";
import { formatDateTime, formatEnumLabel } from "../../shared/lib/format";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function MyReportsPage() {
  const [pageIndex, setPageIndex] = useState(0);

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
        <span className="eyebrow">Reports</span>
        <h1>My reports</h1>
        <p>This page consumes your user-facing report history endpoint and shows real moderation states.</p>
      </header>

      {reportsQuery.isPending ? <LoadingBlock label="Loading reports" /> : null}
      {reportsQuery.error ? (
        <ErrorBlock error={reportsQuery.error} title="Reports could not be loaded" />
      ) : null}

      {!reportsQuery.isPending && !reportsQuery.error && reports.length === 0 ? (
        <EmptyBlock
          title="No reports created yet"
          description="When you send moderation reports from public book pages, they will appear here."
        />
      ) : null}

      {reports.length > 0 ? (
        <section className="list-stack">
          {reports.map((report) => (
            <article className="section-card compact-card" key={report.id}>
              <div className="row-between">
                <div>
                  <h2>
                    {formatEnumLabel(report.targetType)} report #{report.id}
                  </h2>
                  <p className="muted-line">Target ID: {report.targetId}</p>
                </div>
                <span className="subtle-chip">{formatEnumLabel(report.status)}</span>
              </div>

              <dl className="detail-list detail-list-compact">
                <div>
                  <dt>Reason</dt>
                  <dd>{formatEnumLabel(report.reason)}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{report.version}</dd>
                </div>
                <div>
                  <dt>Created</dt>
                  <dd>{formatDateTime(report.createdAt)}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{formatDateTime(report.updatedAt)}</dd>
                </div>
              </dl>

              <p className="book-description">{report.comment}</p>
              {resolveReportLink(report) ? (
                <Link className="link-inline" to={resolveReportLink(report)}>
                  Open reported book
                </Link>
              ) : null}
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

function resolveReportLink(report) {
  if (report.targetType === "BOOK") {
    return `/book/${report.targetId}`;
  }

  return null;
}
