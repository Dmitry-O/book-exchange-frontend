import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { BookCover, UserAvatar } from "../../../shared/ui/Media";
import { Pagination } from "../../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../../shared/ui/StateBlocks";

const defaultFilters = {
  exchangeStatuses: []
};

export function AdminExchangesPage() {
  const metadataQuery = useMetadataQuery();
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);

  const exchangeStatuses = metadataQuery.data?.exchangeStatuses ?? ["PENDING", "APPROVED", "DECLINED"];

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

  function handleApplyFilters(event) {
    event.preventDefault();
    setPageIndex(0);
    setFilters({
      exchangeStatuses: [...draftFilters.exchangeStatuses]
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
      exchangeStatuses: current.exchangeStatuses.includes(status)
        ? current.exchangeStatuses.filter((item) => item !== status)
        : [...current.exchangeStatuses, status]
    }));
  }

  const exchanges = exchangesQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">Admin exchanges</span>
        <h1>Exchange oversight</h1>
        <p>
          This screen uses `GET /admin/exchanges` and lets you inspect the full exchange graph by
          status, including sender and receiver users plus books.
        </p>
      </header>

      <section className="section-card">
        <form className="content-stack" onSubmit={handleApplyFilters}>
          <div className="field">
            <span>Status filters</span>
            <div className="checkbox-grid">
              {exchangeStatuses.map((status) => (
                <label className="field field-checkbox admin-checkbox-card" key={status}>
                  <span>{formatEnumLabel(status)}</span>
                  <input
                    checked={draftFilters.exchangeStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="filters-actions">
            <div className="admin-summary-box">
              <strong>{exchangesQuery.data?.totalElements ?? 0}</strong>
              <span>matching exchanges</span>
            </div>
            <div className="pill-row">
              <button className="button" type="submit">
                Apply filters
              </button>
              <button className="button button-secondary" onClick={handleResetFilters} type="button">
                Reset
              </button>
            </div>
          </div>
        </form>
      </section>

      {metadataQuery.isPending ? <LoadingBlock label="Loading exchange metadata" /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title="Exchange metadata could not be loaded" />
      ) : null}
      {exchangesQuery.isPending ? <LoadingBlock label="Loading exchange oversight" /> : null}
      {exchangesQuery.error ? (
        <ErrorBlock error={exchangesQuery.error} title="Admin exchanges could not be loaded" />
      ) : null}

      {!exchangesQuery.isPending && !exchangesQuery.error && exchanges.length === 0 ? (
        <EmptyBlock
          title="No exchanges match these filters"
          description="Try resetting the filters or selecting a different set of exchange statuses."
        />
      ) : null}

      {exchanges.length > 0 ? (
        <section className="list-stack">
          {exchanges.map((exchange) => (
            <article className="section-card compact-card" key={exchange.id}>
              <div className="exchange-preview-pair">
                <BookCover
                  photoUrl={exchange.senderBook?.photoUrl}
                  size="sm"
                  title={exchange.senderBook?.name}
                />
                <BookCover
                  photoUrl={exchange.receiverBook?.photoUrl}
                  size="sm"
                  title={exchange.receiverBook?.name}
                />
              </div>

              <div className="row-between">
                <div>
                  <h2>Exchange #{exchange.id}</h2>
                  <p className="muted-line">
                    {exchange.senderBook?.name || "Unknown sender book"} /{" "}
                    {exchange.receiverBook?.name || "Unknown receiver book"}
                  </p>
                </div>

                <div className="pill-row">
                  <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
                    {formatEnumLabel(exchange.status)}
                  </span>
                  <span className="subtle-chip">v{exchange.version}</span>
                </div>
              </div>

              <dl className="detail-list detail-list-compact">
                <div>
                  <dt>Sender</dt>
                  <dd className="detail-inline-media">
                    <UserAvatar
                      name={exchange.senderUser?.nickname || exchange.senderUser?.email}
                      photoUrl={exchange.senderUser?.photoUrl}
                      size="sm"
                    />
                    <span>{renderUserLabel(exchange.senderUser)}</span>
                  </dd>
                </div>
                <div>
                  <dt>Receiver</dt>
                  <dd className="detail-inline-media">
                    <UserAvatar
                      name={exchange.receiverUser?.nickname || exchange.receiverUser?.email}
                      photoUrl={exchange.receiverUser?.photoUrl}
                      size="sm"
                    />
                    <span>{renderUserLabel(exchange.receiverUser)}</span>
                  </dd>
                </div>
                <div>
                  <dt>Sender read</dt>
                  <dd>{exchange.isReadBySender ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt>Receiver read</dt>
                  <dd>{exchange.isReadByReceiver ? "Yes" : "No"}</dd>
                </div>
              </dl>

              <div className="card-actions">
                <div className="pill-row">
                  {exchange.senderUser?.id ? (
                    <Link className="link-inline" to={`/admin/users/${exchange.senderUser.id}`}>
                      Open sender
                    </Link>
                  ) : null}
                  {exchange.receiverUser?.id ? (
                    <Link className="link-inline" to={`/admin/users/${exchange.receiverUser.id}`}>
                      Open receiver
                    </Link>
                  ) : null}
                </div>

                <Link className="button button-secondary" to={`/admin/exchanges/${exchange.id}`}>
                  Open details
                </Link>
              </div>
            </article>
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
  const { exchangeId } = useParams();

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
    return <LoadingBlock label="Loading exchange details" />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title="Admin exchange details could not be loaded" />;
  }

  const exchange = detailQuery.data;

  return (
    <section className="content-stack">
      <header className="section-card">
        <div className="row-between">
          <div>
            <span className="eyebrow">Admin exchange details</span>
            <h1>Exchange #{exchange.id}</h1>
            <p>
              This screen uses `GET /admin/exchanges/{'{exchangeId}'}` and gives you the full
              audit-friendly view of users, books, read flags, and exchange state.
            </p>
          </div>

          <div className="pill-row">
            <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
              {formatEnumLabel(exchange.status)}
            </span>
            <span className="subtle-chip">v{exchange.__version ?? exchange.version}</span>
          </div>
        </div>
      </header>

      <section className="detail-grid">
        <article className="section-card">
          <h2>Exchange snapshot</h2>
          <dl className="detail-list">
            <div>
              <dt>Status</dt>
              <dd>{formatEnumLabel(exchange.status)}</dd>
            </div>
            <div>
              <dt>Sender read</dt>
              <dd>{exchange.isReadBySender ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Receiver read</dt>
              <dd>{exchange.isReadByReceiver ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Decliner</dt>
              <dd>{renderUserLabel(exchange.declinerUser)}</dd>
            </div>
          </dl>
        </article>

        <article className="section-card">
          <h2>Audit metadata</h2>
          <dl className="detail-list">
            <div>
              <dt>Created at</dt>
              <dd>{formatDateTime(exchange.meta?.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated at</dt>
              <dd>{formatDateTime(exchange.meta?.updatedAt)}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{exchange.meta?.createdBy ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Updated by</dt>
              <dd>{exchange.meta?.updatedBy ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Created request id</dt>
              <dd>{exchange.meta?.createdRequestId || "Not available"}</dd>
            </div>
            <div>
              <dt>Updated request id</dt>
              <dd>{exchange.meta?.updatedRequestId || "Not available"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="detail-grid">
        <UserCard title="Sender user" user={exchange.senderUser} />
        <UserCard title="Receiver user" user={exchange.receiverUser} />
      </section>

      <section className="detail-grid">
        <BookCard title="Sender book" book={exchange.senderBook} />
        <BookCard title="Receiver book" book={exchange.receiverBook} />
      </section>
    </section>
  );
}

function UserCard({ title, user }) {
  return (
    <article className="section-card">
      <div className="entity-header">
        <UserAvatar name={user?.nickname || user?.email} photoUrl={user?.photoUrl} size="lg" />
        <div>
          <h2>{title}</h2>
          <p>{renderUserLabel(user)}</p>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <dt>Email</dt>
          <dd>{user?.email || "Not available"}</dd>
        </div>
        <div>
          <dt>Photo URL</dt>
          <dd>{user?.photoUrl || "Not available"}</dd>
        </div>
        <div>
          <dt>Roles</dt>
          <dd>{(user?.roles ?? []).map((role) => formatEnumLabel(role)).join(", ") || "None"}</dd>
        </div>
        <div>
          <dt>Locale</dt>
          <dd>{user?.locale || "Not available"}</dd>
        </div>
        <div>
          <dt>Ban reason</dt>
          <dd>{user?.banReason || "Not available"}</dd>
        </div>
        <div>
          <dt>Open user</dt>
          <dd>
            {user?.id ? (
              <Link className="link-inline" to={`/admin/users/${user.id}`}>
                Admin user details
              </Link>
            ) : (
              "Not available"
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function BookCard({ title, book }) {
  return (
    <article className="section-card">
      <div className="entity-header">
        <BookCover photoUrl={book?.photoUrl} size="md" title={book?.name} />
        <div>
          <h2>{title}</h2>
          <p>{book?.name || "Not available"}</p>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <dt>Owner</dt>
          <dd className="detail-inline-media">
            <UserAvatar name={book?.ownerNickname} photoUrl={book?.ownerPhotoUrl} size="sm" />
            <span>{book?.ownerNickname || "Unknown"} (id {book?.ownerUserId ?? "n/a"})</span>
          </dd>
        </div>
        <div>
          <dt>Photo URL</dt>
          <dd>{book?.photoUrl || "Not available"}</dd>
        </div>
        <div>
          <dt>Author</dt>
          <dd>{book?.author || "Not available"}</dd>
        </div>
        <div>
          <dt>Category</dt>
          <dd>{book?.category || "Not available"}</dd>
        </div>
        <div>
          <dt>City</dt>
          <dd>{book?.city || "Not available"}</dd>
        </div>
        <div>
          <dt>Publication year</dt>
          <dd>{renderValue(book?.publicationYear)}</dd>
        </div>
        <div>
          <dt>Gift mode</dt>
          <dd>{book?.isGift ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Exchanged</dt>
          <dd>{book?.isExchanged ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt>Open book</dt>
          <dd>
            {book?.id ? (
              <Link className="link-inline" to={`/admin/books/${book.id}`}>
                Admin book details
              </Link>
            ) : (
              "Not available"
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function renderUserLabel(user) {
  if (!user) {
    return "Not available";
  }

  return `${user.nickname || "Unknown user"} (id ${user.id ?? "n/a"})`;
}

function renderValue(value) {
  return value === null || value === undefined || value === "" ? "Not available" : value;
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
