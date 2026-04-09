import { Link } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { apiRequest } from "../../shared/api/http";
import { formatDateTime, formatEnumLabel } from "../../shared/lib/format";
import { BookCover, UserAvatar } from "../../shared/ui/Media";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function UpdatesPage() {
  const [pageIndex, setPageIndex] = useState(0);

  const updatesQuery = useQuery({
    queryKey: ["updates", pageIndex],
    queryFn: async () => {
      const response = await apiRequest(
        `/updates/unread?pageIndex=${pageIndex}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    }
  });

  const items = updatesQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">Unread updates</span>
        <h1>Exchange notifications</h1>
        <p>
          This list proves the frontend can consume your unread exchange update endpoint, including
          `otherUserId`.
        </p>
      </header>

      {updatesQuery.isPending ? <LoadingBlock label="Loading unread updates" /> : null}
      {updatesQuery.error ? (
        <ErrorBlock error={updatesQuery.error} title="Unread updates request failed" />
      ) : null}

      {!updatesQuery.isPending && !updatesQuery.error && items.length === 0 ? (
        <EmptyBlock
          description="When request, offer, or history events appear, they will show up here."
          title="No unread exchange updates"
        />
      ) : null}

      {items.length > 0 ? (
        <section className="list-stack">
          {items.map((item) => (
            <article className="section-card compact-card" key={item.id}>
              <div className="entity-inline entity-inline-spaced">
                <BookCover size="sm" title={item.otherBookName} />
                <UserAvatar name={item.otherUserNickname} size="sm" />
              </div>

              <div className="row-between">
                <div>
                  <h2>{item.otherBookName}</h2>
                  <p className="muted-line">
                    {item.otherUserNickname} / otherUserId {item.otherUserId}
                  </p>
                </div>
                <span className="subtle-chip">{formatEnumLabel(item.status)}</span>
              </div>

              <dl className="detail-list detail-list-compact">
                <div>
                  <dt>Role</dt>
                  <dd>{formatEnumLabel(item.userExchangeRole)}</dd>
                </div>
                <div>
                  <dt>Book id</dt>
                  <dd>{item.otherBookId}</dd>
                </div>
                <div>
                  <dt>Updated at</dt>
                  <dd>{formatDateTime(item.updatedAt)}</dd>
                </div>
                <div>
                  <dt>Version</dt>
                  <dd>{item.version}</dd>
                </div>
              </dl>

              <div className="card-actions">
                <Link className="button button-secondary" to={resolveUpdateTarget(item)}>
                  Open details
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!updatesQuery.isPending && !updatesQuery.error && (updatesQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination onChange={setPageIndex} page={pageIndex} totalPages={updatesQuery.data.totalPages} />
      ) : null}
    </section>
  );
}

function resolveUpdateTarget(item) {
  if (item.status === "PENDING") {
    return item.userExchangeRole === "RECEIVER"
      ? `/app/exchanges/offers/${item.id}`
      : `/app/exchanges/requests/${item.id}`;
  }

  return `/app/history/${item.id}`;
}
