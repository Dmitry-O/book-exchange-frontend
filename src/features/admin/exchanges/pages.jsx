import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { useLocale } from "../../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../../shared/i18n/rawText";
import { readStoredLocale } from "../../../shared/i18n/locale";
import { formatBookCategoryLabel } from "../../../shared/lib/bookCategory";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { BookCover, UserAvatar } from "../../../shared/ui/Media";
import { ArrowLeftIcon, BookIcon, SwapIcon, UserIcon } from "../../../shared/ui/Icons";
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
  const { locale } = useLocale();

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
        <h1>{rt(locale, "Exchange oversight")}</h1>
        <p>{rt(locale, "Inspect exchanges by status and open full details for books and participants.")}</p>
      </header>

      <section className="section-card">
        <form className="content-stack" onSubmit={handleApplyFilters}>
          <div className="field">
            <span>{rt(locale, "Status filters")}</span>
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
              <span>{rt(locale, "matching exchanges")}</span>
            </div>
            <div className="pill-row">
              <button className="button" type="submit">
                {rt(locale, "Apply filters")}
              </button>
              <button className="button button-secondary" onClick={handleResetFilters} type="button">
                {rt(locale, "Reset")}
              </button>
            </div>
          </div>
        </form>
      </section>

      {metadataQuery.isPending ? <LoadingBlock label={rt(locale, "Loading exchange metadata")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title={rt(locale, "Exchange metadata could not be loaded")} />
      ) : null}
      {exchangesQuery.isPending ? <LoadingBlock label={rt(locale, "Loading exchange oversight")} /> : null}
      {exchangesQuery.error ? (
        <ErrorBlock error={exchangesQuery.error} title={rt(locale, "Admin exchanges could not be loaded")} />
      ) : null}

      {!exchangesQuery.isPending && !exchangesQuery.error && exchanges.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "No exchanges match these filters")}
          description={rt(locale, "Try resetting the filters or selecting a different set of exchange statuses.")}
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
                  title={resolveAdminSenderBookLabel(locale, exchange.senderBook?.name)}
                />
                <span aria-hidden="true" className="exchange-preview-swap-icon">
                  <SwapIcon />
                </span>
                <BookCover
                  photoUrl={exchange.receiverBook?.photoUrl}
                  size="sm"
                  title={resolveAdminReceiverBookLabel(locale, exchange.receiverBook?.name)}
                />
              </div>

              <div className="row-between">
                <div>
                  <h2>{exchange.senderBook?.name || exchange.receiverBook?.name || rt(locale, "Exchange overview")}</h2>
                  <p className="muted-line">
                    {formatAdminExchangeBookSummary(locale, exchange.senderBook?.name, exchange.receiverBook?.name)}
                  </p>
                </div>

                <div className="pill-row">
                  <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
                    {formatEnumLabel(exchange.status)}
                  </span>
                </div>
              </div>

              <dl className="detail-list detail-list-compact">
                <div>
                  <dt>{rt(locale, "Sender")}</dt>
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
                  <dt>{rt(locale, "Receiver")}</dt>
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
                  <dt>{rt(locale, "Sender read")}</dt>
                  <dd>{exchange.isReadBySender ? rt(locale, "Yes") : rt(locale, "No")}</dd>
                </div>
                <div>
                  <dt>{rt(locale, "Receiver read")}</dt>
                  <dd>{exchange.isReadByReceiver ? rt(locale, "Yes") : rt(locale, "No")}</dd>
                </div>
              </dl>

              <div className="card-actions">
                <div className="action-icon-group">
                  {exchange.senderUser?.id ? (
                    <Link
                      aria-label={rt(locale, "Open sender")}
                      className="icon-button"
                      title={rt(locale, "Open sender")}
                      to={`/admin/users/${exchange.senderUser.id}`}
                    >
                      <UserIcon />
                    </Link>
                  ) : null}
                  {exchange.receiverUser?.id ? (
                    <Link
                      aria-label={rt(locale, "Open receiver")}
                      className="icon-button"
                      title={rt(locale, "Open receiver")}
                      to={`/admin/users/${exchange.receiverUser.id}`}
                    >
                      <UserIcon />
                    </Link>
                  ) : null}
                </div>

                <Link className="button button-secondary" to={`/admin/exchanges/${exchange.id}`}>
                  {rt(locale, "Open details")}
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
  const { locale } = useLocale();
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
    return <LoadingBlock label={rt(locale, "Loading exchange details")} />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title={rt(locale, "Admin exchange details could not be loaded")} />;
  }

  const exchange = detailQuery.data;

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label={rt(locale, "Back")} className="back-link" to="/admin/exchanges">
            <ArrowLeftIcon />
          </Link>
          <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
            {formatEnumLabel(exchange.status)}
          </span>
        </div>
        <h1>{exchange.senderBook?.name || exchange.receiverBook?.name || rt(locale, "Exchange overview")}</h1>
        <p>{rt(locale, "See the full exchange details, participants, books, and read states.")}</p>
        <div className="hero-meta-line">
          <span>{rt(locale, "Created at")}: {formatDateTime(exchange.meta?.createdAt)}</span>
          <span>{rt(locale, "Updated at")}: {formatDateTime(exchange.meta?.updatedAt)}</span>
        </div>
      </header>

      <section className="section-card">
        <h2>{rt(locale, "Exchange overview")}</h2>
        <dl className="detail-list detail-list-compact">
          <div>
            <dt>{rt(locale, "Status")}</dt>
            <dd>{formatEnumLabel(exchange.status)}</dd>
          </div>
          <div>
            <dt>{rt(locale, "Sender read")}</dt>
            <dd>{exchange.isReadBySender ? rt(locale, "Yes") : rt(locale, "No")}</dd>
          </div>
          <div>
            <dt>{rt(locale, "Receiver read")}</dt>
            <dd>{exchange.isReadByReceiver ? rt(locale, "Yes") : rt(locale, "No")}</dd>
          </div>
          <div>
            <dt>{rt(locale, "Decliner")}</dt>
            <dd>{renderUserLabel(exchange.declinerUser)}</dd>
          </div>
        </dl>
      </section>

      <section className="detail-grid">
        <UserCard title={rt(locale, "Sender user")} user={exchange.senderUser} />
        <UserCard title={rt(locale, "Receiver user")} user={exchange.receiverUser} />
      </section>

      <section className="detail-grid">
        <BookCard title={rt(locale, "Sender book")} book={exchange.senderBook} />
        <BookCard title={rt(locale, "Receiver book")} book={exchange.receiverBook} />
      </section>
    </section>
  );
}

function UserCard({ title, user }) {
  const { locale } = useLocale();
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
          <dt>{rt(locale, "Email")}</dt>
          <dd>{user?.email || rt(locale, "Not available")}</dd>
        </div>
        <div>
          <dt>{rt(locale, "Roles")}</dt>
          <dd>{(user?.roles ?? []).map((role) => formatEnumLabel(role)).join(", ") || rt(locale, "None")}</dd>
        </div>
        <div>
          <dt>{rt(locale, "Ban reason")}</dt>
          <dd>{user?.banReason || rt(locale, "Not available")}</dd>
        </div>
        <div>
          <dt>{rt(locale, "Open user")}</dt>
          <dd>
            {user?.id ? (
              <Link className="action-link-inline" to={`/admin/users/${user.id}`}>
                <UserIcon />
                <div className="action-link-copy">
                  <strong>{rt(locale, "Open user")}</strong>
                  <span>{rt(locale, "Admin user details")}</span>
                </div>
              </Link>
            ) : (
              rt(locale, "Not available")
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function BookCard({ title, book }) {
  const { locale } = useLocale();

  return (
    <article className="section-card">
      <div className="entity-header">
        <BookCover photoUrl={book?.photoUrl} size="md" title={book?.name} />
        <div>
          <h2>{title}</h2>
          <p>{book?.name || rt(locale, "Not available")}</p>
        </div>
      </div>

      <dl className="detail-list">
        <div>
          <dt>{rt(locale, "Owner")}</dt>
          <dd className="detail-inline-media">
            <UserAvatar name={book?.ownerNickname} photoUrl={book?.ownerPhotoUrl} size="sm" />
            <span>{book?.ownerNickname || rt(locale, "Unknown owner")}</span>
          </dd>
        </div>
        <div>
          <dt>{rt(locale, "Author")}</dt>
          <dd>{book?.author || rt(locale, "Not available")}</dd>
        </div>
        <div>
          <dt>{rt(locale, "Category")}</dt>
          <dd>{formatBookCategoryLabel(book?.category, locale, rt(locale, "Not available"))}</dd>
        </div>
        <div>
          <dt>{rt(locale, "City")}</dt>
          <dd>{book?.city || rt(locale, "Not available")}</dd>
        </div>
        <div>
          <dt>{rt(locale, "Publication year")}</dt>
          <dd>{renderValue(locale, book?.publicationYear)}</dd>
        </div>
        <div>
          <dt>{rt(locale, "Gift mode")}</dt>
          <dd>{book?.isGift ? rt(locale, "Yes") : rt(locale, "No")}</dd>
        </div>
        <div>
          <dt>{rt(locale, "Exchanged")}</dt>
          <dd>{book?.isExchanged ? rt(locale, "Yes") : rt(locale, "No")}</dd>
        </div>
        <div>
          <dt>{rt(locale, "Open book")}</dt>
          <dd>
            {book?.id ? (
              <Link className="action-link-inline" to={`/admin/books/${book.id}`}>
                <BookIcon />
                <div className="action-link-copy">
                  <strong>{rt(locale, "Open book")}</strong>
                  <span>{rt(locale, "Admin book details")}</span>
                </div>
              </Link>
            ) : (
              rt(locale, "Not available")
            )}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function renderUserLabel(user) {
  const locale = readLocaleForLabel();
  if (!user) {
    return rt(locale, "Not available");
  }

  return `${user.nickname || rt(locale, "Unknown user")} (id ${user.id ?? "n/a"})`;
}

function renderValue(locale, value) {
  return value === null || value === undefined || value === "" ? rt(locale, "Not available") : value;
}

function formatAdminExchangeBookSummary(locale, senderBookName, receiverBookName) {
  const senderLabel = resolveAdminSenderBookLabel(locale, senderBookName);
  const receiverLabel = resolveAdminReceiverBookLabel(locale, receiverBookName);

  return [senderLabel, receiverLabel].filter(Boolean).join(" / ");
}

function resolveAdminSenderBookLabel(locale, senderBookName) {
  return senderBookName || rt(locale, "Without counter book");
}

function resolveAdminReceiverBookLabel(locale, receiverBookName) {
  return receiverBookName || rt(locale, "Unknown receiver book");
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

function readLocaleForLabel() {
  return readStoredLocale();
}
