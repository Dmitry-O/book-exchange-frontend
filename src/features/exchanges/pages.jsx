import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { formatEnumLabel } from "../../shared/lib/format";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

export function RequestsPage() {
  const [pageIndex, setPageIndex] = useState(0);

  const requestsQuery = useQuery({
    queryKey: ["requests", pageIndex],
    queryFn: async () => {
      const response = await apiRequest(
        `/request?pageIndex=${pageIndex}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    }
  });

  return (
    <ExchangeListPage
      emptyDescription="Create a request from any public book page after selecting one of your own books."
      emptyTitle="No active requests"
      itemLabel="Pending request"
      items={requestsQuery.data?.content ?? []}
      loadingLabel="Loading your requests"
      page={pageIndex}
      query={requestsQuery}
      routeBase="/app/exchanges/requests"
      setPage={setPageIndex}
      title="Requests you sent"
    />
  );
}

export function OffersPage() {
  const [pageIndex, setPageIndex] = useState(0);

  const offersQuery = useQuery({
    queryKey: ["offers", pageIndex],
    queryFn: async () => {
      const response = await apiRequest(
        `/offer?pageIndex=${pageIndex}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    }
  });

  return (
    <ExchangeListPage
      emptyDescription="When someone asks for one of your books, the offer will appear here."
      emptyTitle="No active offers"
      itemLabel="Pending offer"
      items={offersQuery.data?.content ?? []}
      loadingLabel="Loading your offers"
      page={pageIndex}
      query={offersQuery}
      routeBase="/app/exchanges/offers"
      setPage={setPageIndex}
      title="Offers waiting for your decision"
    />
  );
}

export function HistoryPage() {
  const [pageIndex, setPageIndex] = useState(0);

  const historyQuery = useQuery({
    queryKey: ["history", pageIndex],
    queryFn: async () => {
      const response = await apiRequest(
        `/history?pageIndex=${pageIndex}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    }
  });

  const items = historyQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">History</span>
        <h1>Resolved exchanges</h1>
        <p>
          This page consumes `GET /history` and shows completed or declined exchanges outside the
          pending request and offer queues.
        </p>
      </header>

      {historyQuery.isPending ? <LoadingBlock label="Loading exchange history" /> : null}
      {historyQuery.error ? (
        <ErrorBlock error={historyQuery.error} title="Exchange history could not be loaded" />
      ) : null}

      {!historyQuery.isPending && !historyQuery.error && items.length === 0 ? (
        <EmptyBlock
          title="No resolved exchanges yet"
          description="Approved and declined exchanges will appear here after the pending flow is resolved."
        />
      ) : null}

      {items.length > 0 ? (
        <section className="list-stack">
          {items.map((item) => (
            <article className="section-card compact-card" key={item.id}>
              <div className="row-between">
                <div>
                  <h2>Exchange #{item.id}</h2>
                  <p className="muted-line">
                    {item.senderBookName} / {item.receiverBookName}
                  </p>
                </div>
                <span className="subtle-chip">{item.isRead ? "Read" : "Unread"}</span>
              </div>

              <div className="card-actions">
                <span className="muted-line">version {item.version}</span>
                <Link className="button button-secondary" to={`/app/history/${item.id}`}>
                  Open details
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!historyQuery.isPending && !historyQuery.error && (historyQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination
          onChange={setPageIndex}
          page={pageIndex}
          totalPages={historyQuery.data.totalPages}
        />
      ) : null}
    </section>
  );
}

export function RequestDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { exchangeId } = useParams();
  const detailQuery = useExchangeDetails("request", exchangeId);
  const [pendingAction, setPendingAction] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["updates"] });
    void queryClient.invalidateQueries({ queryKey: ["updates", "summary"] });
  }, [detailQuery.data?.id, queryClient]);

  async function handleDecline() {
    const exchange = detailQuery.data;
    const confirmed = window.confirm("Decline this request?");

    if (!confirmed) {
      return;
    }

    setPendingAction(true);
    setActionError(null);

    try {
      await apiRequest(`/request/${exchange.id}/decline`, {
        method: "PATCH",
        auth: true,
        version: exchange.__version ?? exchange.version
      });

      await invalidateExchangeCollections(queryClient);
      navigate(`/app/history/${exchange.id}`, { replace: true });
    } catch (error) {
      setActionError(error);
    } finally {
      setPendingAction(false);
    }
  }

  return (
    <ExchangeDetailsPage
      actionError={actionError}
      actions={
        detailQuery.data?.status === "PENDING" ? (
          <button
            className="button button-danger"
            disabled={pendingAction}
            onClick={() => void handleDecline()}
            type="button"
          >
            {pendingAction ? "Declining..." : "Decline request"}
          </button>
        ) : null
      }
      detailQuery={detailQuery}
      subtitle="This page reads `GET /request/{exchangeId}` and lets the sender decline an active request."
      title="Request details"
    />
  );
}

export function OfferDetailsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { exchangeId } = useParams();
  const detailQuery = useExchangeDetails("offer", exchangeId);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["updates"] });
    void queryClient.invalidateQueries({ queryKey: ["updates", "summary"] });
  }, [detailQuery.data?.id, queryClient]);

  async function handleAction(action) {
    const exchange = detailQuery.data;
    const confirmed = window.confirm(
      action === "approve"
        ? "Approve this offer and mark the books as exchanged?"
        : "Decline this offer?"
    );

    if (!confirmed) {
      return;
    }

    setPendingAction(action);
    setActionError(null);

    try {
      await apiRequest(`/offer/${exchange.id}/${action}`, {
        method: "PATCH",
        auth: true,
        version: exchange.__version ?? exchange.version
      });

      await invalidateExchangeCollections(queryClient);
      navigate(`/app/history/${exchange.id}`, { replace: true });
    } catch (error) {
      setActionError(error);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <ExchangeDetailsPage
      actionError={actionError}
      actions={
        detailQuery.data?.status === "PENDING" ? (
          <>
            <button
              className="button"
              disabled={pendingAction !== null}
              onClick={() => void handleAction("approve")}
              type="button"
            >
              {pendingAction === "approve" ? "Approving..." : "Approve offer"}
            </button>
            <button
              className="button button-danger"
              disabled={pendingAction !== null}
              onClick={() => void handleAction("decline")}
              type="button"
            >
              {pendingAction === "decline" ? "Declining..." : "Decline offer"}
            </button>
          </>
        ) : null
      }
      detailQuery={detailQuery}
      subtitle="This page reads `GET /offer/{exchangeId}` and lets the receiver approve or decline a pending offer."
      title="Offer details"
    />
  );
}

export function HistoryDetailsPage() {
  const queryClient = useQueryClient();
  const { exchangeId } = useParams();

  const detailQuery = useQuery({
    queryKey: ["history-details", String(exchangeId)],
    enabled: Boolean(exchangeId),
    queryFn: async () => {
      const response = await apiRequest(`/history/${exchangeId}`, { auth: true });

      return {
        ...response.data,
        __version: response.eTag ?? response.data?.version ?? null
      };
    }
  });

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["history"] });
    void queryClient.invalidateQueries({ queryKey: ["updates"] });
    void queryClient.invalidateQueries({ queryKey: ["updates", "summary"] });
  }, [detailQuery.data?.id, queryClient]);

  if (detailQuery.isPending) {
    return <LoadingBlock label="Loading exchange history details" />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title="Exchange history details could not be loaded" />;
  }

  const exchange = detailQuery.data;

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">History details</span>
        <h1>Exchange #{exchange.id}</h1>
        <p>
          This page uses `GET /history/{'{exchangeId}'}` and includes role-aware contact details for the completed exchange.
        </p>
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
              <dt>Other user</dt>
              <dd>
                {exchange.userNickname} (id {exchange.otherUserId})
              </dd>
            </div>
            <div>
              <dt>Your role</dt>
              <dd>{formatEnumLabel(exchange.userExchangeRole)}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{exchange.__version ?? exchange.version}</dd>
            </div>
            <div>
              <dt>Contact details</dt>
              <dd>{exchange.contactDetails || "Not provided"}</dd>
            </div>
          </dl>
        </article>

        <article className="section-card">
          <h2>Next actions</h2>
          <p>
            This is the final read-only state of the exchange. If the exchange was approved, the
            contact details above are ready for follow-up between the two users.
          </p>

          <div className="card-actions">
            <Link className="button button-secondary" to="/app/history">
              Back to history
            </Link>
            <Link className="button button-secondary" to="/app/updates">
              Open unread updates
            </Link>
          </div>
        </article>
      </section>

      <section className="detail-grid">
        <ExchangeBookCard book={exchange.senderBook} title="Sender book" />
        <ExchangeBookCard book={exchange.receiverBook} title="Receiver book" />
      </section>
    </section>
  );
}

export function RequestCreationCard({ book }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [senderBookId, setSenderBookId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  const isOwnBook = isAuthenticated && user?.id === book.ownerUserId;

  const myBooksQuery = useQuery({
    queryKey: ["request-create", "my-books"],
    enabled: isAuthenticated && !isOwnBook,
    queryFn: async () => {
      const response = await apiRequest("/book/user?pageIndex=0&pageSize=100", {
        auth: true
      });

      return response.data;
    }
  });

  const myBooks = myBooksQuery.data?.content ?? [];

  useEffect(() => {
    if (myBooks.length === 0) {
      return;
    }

    setSenderBookId((current) => current || String(myBooks[0].id));
  }, [myBooks]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!senderBookId) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await apiRequest("/request", {
        method: "POST",
        auth: true,
        body: {
          receiverUserId: book.ownerUserId,
          senderBookId: Number(senderBookId),
          receiverBookId: book.id
        }
      });

      await invalidateExchangeCollections(queryClient);
      navigate(`/app/exchanges/requests/${response.data.id}`, { replace: true });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <section className="section-card">
        <h2>Send an exchange request</h2>
        <p>You need an account and at least one of your own books before you can start an exchange.</p>
        <div className="card-actions">
          <Link className="button" to="/login">
            Sign in
          </Link>
          <Link className="button button-secondary" to="/register">
            Register
          </Link>
        </div>
      </section>
    );
  }

  if (isOwnBook) {
    return (
      <section className="section-card">
        <h2>This is your own book</h2>
        <p>You cannot create an exchange request for one of your own listings.</p>
        <div className="card-actions">
          <Link className="button button-secondary" to={`/app/my-books/${book.id}`}>
            Open owner view
          </Link>
        </div>
      </section>
    );
  }

  if (myBooksQuery.isPending) {
    return <LoadingBlock label="Loading your books for exchange" />;
  }

  if (myBooksQuery.error) {
    return <ErrorBlock error={myBooksQuery.error} title="Your books could not be loaded" />;
  }

  if (myBooks.length === 0) {
    return (
      <section className="section-card">
        <h2>No active books available</h2>
        <p>Add one of your own books first, then come back here to create a request.</p>
        <div className="card-actions">
          <Link className="button" to="/app/my-books/new">
            Add my first book
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-card">
      <h2>Send an exchange request</h2>
      <p>
        Select one of your own books and create a request for this listing with `POST /request`.
      </p>

      <form className="content-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Your book</span>
          <select
            className="field-control"
            onChange={(event) => setSenderBookId(event.target.value)}
            value={senderBookId}
          >
            {myBooks.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} / {item.author} / {item.city}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="inline-message inline-message-error">{error.message}</p> : null}

        <div className="card-actions">
          <button className="button" disabled={pending || !senderBookId} type="submit">
            {pending ? "Creating request..." : "Create request"}
          </button>
          <Link className="button button-secondary" to="/app/my-books">
            Manage my books
          </Link>
        </div>
      </form>
    </section>
  );
}

function ExchangeListPage({
  emptyDescription,
  emptyTitle,
  itemLabel,
  items,
  loadingLabel,
  page,
  query,
  routeBase,
  setPage,
  title
}) {
  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">Exchange flow</span>
        <h1>{title}</h1>
        <p>
          These cards are backed by your pending exchange endpoints and open into the detailed request or offer view.
        </p>
      </header>

      {query.isPending ? <LoadingBlock label={loadingLabel} /> : null}
      {query.error ? <ErrorBlock error={query.error} title={`${title} could not be loaded`} /> : null}

      {!query.isPending && !query.error && items.length === 0 ? (
        <EmptyBlock title={emptyTitle} description={emptyDescription} />
      ) : null}

      {items.length > 0 ? (
        <section className="list-stack">
          {items.map((item) => (
            <article className="section-card compact-card" key={item.id}>
              <div className="row-between">
                <div>
                  <h2>{itemLabel}</h2>
                  <p className="muted-line">
                    {item.senderBookName} / {item.receiverBookName}
                  </p>
                </div>
                <span className="subtle-chip">v{item.version}</span>
              </div>

              <div className="card-actions">
                <span className="muted-line">Exchange #{item.id}</span>
                <Link className="button button-secondary" to={`${routeBase}/${item.id}`}>
                  Open details
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!query.isPending && !query.error && (query.data?.totalPages ?? 0) > 1 ? (
        <Pagination onChange={setPage} page={page} totalPages={query.data.totalPages} />
      ) : null}
    </section>
  );
}

function ExchangeDetailsPage({ actionError, actions, detailQuery, subtitle, title }) {
  if (detailQuery.isPending) {
    return <LoadingBlock label={`Loading ${title.toLowerCase()}`} />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title={`${title} could not be loaded`} />;
  }

  const exchange = detailQuery.data;

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">Exchange details</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      {actionError ? <ErrorBlock error={actionError} title="Exchange action failed" /> : null}

      <section className="detail-grid">
        <article className="section-card">
          <h2>Exchange snapshot</h2>
          <dl className="detail-list">
            <div>
              <dt>Status</dt>
              <dd>{formatEnumLabel(exchange.status)}</dd>
            </div>
            <div>
              <dt>Other user</dt>
              <dd>
                {exchange.userNickname} (id {exchange.otherUserId})
              </dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{exchange.__version ?? exchange.version}</dd>
            </div>
          </dl>
        </article>

        <article className="section-card">
          <h2>Available actions</h2>
          <p>
            Pending exchanges can be resolved here. Once approved or declined, the exchange will move
            into history.
          </p>

          <div className="card-actions">
            {actions}
            <Link className="button button-secondary" to="/app/updates">
              Open unread updates
            </Link>
          </div>
        </article>
      </section>

      <section className="detail-grid">
        <ExchangeBookCard book={exchange.senderBook} title="Sender book" />
        <ExchangeBookCard book={exchange.receiverBook} title="Receiver book" />
      </section>
    </section>
  );
}

function ExchangeBookCard({ book, title }) {
  return (
    <article className="section-card">
      <h2>{title}</h2>
      <dl className="detail-list">
        <div>
          <dt>Name</dt>
          <dd>{book?.name || "Not available"}</dd>
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
      </dl>
    </article>
  );
}

function useExchangeDetails(kind, exchangeId) {
  return useQuery({
    queryKey: [`${kind}-details`, String(exchangeId)],
    enabled: Boolean(exchangeId),
    queryFn: async () => {
      const response = await apiRequest(`/${kind}/${exchangeId}`, { auth: true });

      return {
        ...response.data,
        __version: response.eTag ?? response.data?.version ?? null
      };
    }
  });
}

async function invalidateExchangeCollections(queryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["requests"] }),
    queryClient.invalidateQueries({ queryKey: ["offers"] }),
    queryClient.invalidateQueries({ queryKey: ["history"] }),
    queryClient.invalidateQueries({ queryKey: ["updates"] }),
    queryClient.invalidateQueries({ queryKey: ["updates", "summary"] })
  ]);
}

function renderValue(value) {
  return value === null || value === undefined || value === "" ? "Not available" : value;
}
