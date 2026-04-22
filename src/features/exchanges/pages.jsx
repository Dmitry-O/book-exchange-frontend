import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../shared/i18n/rawText";
import { formatBookCategoryLabel, getBookCategoryTagStyle } from "../../shared/lib/bookCategory";
import { getCityDisplayName } from "../../shared/lib/cities";
import { formatEnumLabel } from "../../shared/lib/format";
import { BookCover, UserIdentityInline } from "../../shared/ui/Media";
import { ArrowLeftIcon, GiftIcon, SwapIcon } from "../../shared/ui/Icons";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const exchangeUiText = {
  de: {
    bookOfUser: "Buch von {name}",
    exchangeWithUser: "Tausch mit {name}",
    giftNoteReceiverLabel: "Geschenkanfrage",
    giftNoteReceiverText:
      "Dieses Buch wurde als Geschenk angefragt, deshalb ist kein eigenes Gegenbuch für diesen Tausch erforderlich.",
    giftNoteSenderLabel: "Anfrage ohne Gegenbuch",
    giftNoteSenderText:
      "Du hast dieses Buch als Geschenk angefragt. Deshalb ist kein eigenes Gegenbuch erforderlich.",
    historyDeclined: "Dieser Tauschwunsch wurde abgelehnt.",
    historyReadonly:
      "Dies ist der finale schreibgeschützte Zustand dieses Tauschs.",
    historySuccess:
      "Du kannst {name} mit diesen Kontaktdaten erreichen: {contact}",
    offerSubtitle:
      "Prüfe den eingehenden Tauschvorschlag und entscheide, wie es weitergeht.",
    statusApproved: "BestГ¤tigt",
    statusDeclined: "Abgelehnt",
    statusPending: "Ausstehend",
    requestSubtitle:
      "Verfolge deinen Tauschwunsch und storniere ihn, falls er nicht mehr benötigt wird.",
    unknownUser: "unbekanntem Benutzer",
    yourBook: "Dein Buch"
  },
  en: {
    bookOfUser: "{name}'s book",
    exchangeWithUser: "Exchange with {name}",
    giftNoteReceiverLabel: "Gift request",
    giftNoteReceiverText:
      "This book was requested as a gift, so there is no counter-book in this exchange.",
    giftNoteSenderLabel: "Request without a counter-book",
    giftNoteSenderText:
      "You requested this book as a gift, so a counter-book is not needed for this exchange.",
    historyDeclined: "This exchange request was declined.",
    historyReadonly:
      "This is the final read-only state of this exchange.",
    historySuccess:
      "You can contact {name} using these details: {contact}",
    offerSubtitle:
      "Review the incoming exchange proposal and decide what to do next.",
    statusApproved: "Approved",
    statusDeclined: "Declined",
    statusPending: "Pending",
    requestSubtitle:
      "Track your exchange request and cancel it if it is no longer needed.",
    unknownUser: "unknown user",
    yourBook: "Your book"
  },
  ru: {
    bookOfUser: "Книга {name}",
    exchangeWithUser: "Обмен с пользователем {name}",
    giftNoteLabel: "Запрос подарка",
    giftNoteText:
      "Вы запросили эту книгу в дар, поэтому встречная книга для этого обмена не требуется.",
    historyDeclined: "Этот запрос на обмен был отклонён.",
    historyReadonly:
      "Это финальное состояние обмена только для чтения.",
    historySuccess:
      "Вы можете связаться с пользователем {name} по этим контактным данным: {contact}",
    offerSubtitle:
      "Проверьте входящее предложение обмена и решите, как поступить дальше.",
    requestSubtitle:
      "Следите за своим запросом на обмен и при необходимости отмените его.",
    unknownUser: "неизвестным пользователем",
    yourBook: "Ваша книга"
  }
};

export function RequestsPage() {
  const { locale } = useLocale();
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
      emptyDescription={rt(
        locale,
        "Create a request from any public book page after selecting one of your own books."
      )}
      emptyTitle={rt(locale, "No active requests")}
      fallbackStatus="PENDING"
      items={requestsQuery.data?.content ?? []}
      loadingLabel={rt(locale, "Loading your requests")}
      page={pageIndex}
      query={requestsQuery}
      routeBase="/app/exchanges/requests"
      setPage={setPageIndex}
      summary={rt(
        locale,
        "Track the exchange requests you already sent to other users."
      )}
      title={rt(locale, "Requests you sent")}
    />
  );
}

export function OffersPage() {
  const { locale } = useLocale();
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
      emptyDescription={rt(locale, "When someone asks for one of your books, the offer will appear here.")}
      emptyTitle={rt(locale, "No active offers")}
      fallbackStatus="PENDING"
      items={offersQuery.data?.content ?? []}
      loadingLabel={rt(locale, "Loading your offers")}
      page={pageIndex}
      query={offersQuery}
      routeBase="/app/exchanges/offers"
      setPage={setPageIndex}
      summary={rt(
        locale,
        "Review incoming offers and decide whether to approve or decline them."
      )}
      title={rt(locale, "Offers waiting for your decision")}
    />
  );
}

export function HistoryPage() {
  const { locale } = useLocale();
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
        <h1>{rt(locale, "Resolved exchanges")}</h1>
        <p>{rt(locale, "See approved and declined exchanges in one place.")}</p>
      </header>

      {historyQuery.isPending ? <LoadingBlock label={rt(locale, "Loading exchange history")} /> : null}
      {historyQuery.error ? (
        <ErrorBlock error={historyQuery.error} title={rt(locale, "Exchange history could not be loaded")} />
      ) : null}

      {!historyQuery.isPending && !historyQuery.error && items.length === 0 ? (
        <EmptyBlock
          description={rt(
            locale,
            "Approved and declined exchanges will appear here after the pending flow is resolved."
          )}
          title={rt(locale, "No resolved exchanges yet")}
        />
      ) : null}

      {items.length > 0 ? (
        <section className="list-stack">
          {items.map((item) => (
            <ExchangeListCard
              fallbackStatus={null}
              item={item}
              key={item.id}
              locale={locale}
              to={`/app/history/${item.id}`}
            />
          ))}
        </section>
      ) : null}

      {!historyQuery.isPending && !historyQuery.error && (historyQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination onChange={setPageIndex} page={pageIndex} totalPages={historyQuery.data.totalPages} />
      ) : null}
    </section>
  );
}

export function RequestDetailsPage() {
  const { locale } = useLocale();
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
    const confirmed = window.confirm(rt(locale, "Decline this request?"));

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
            {pendingAction ? rt(locale, "Declining...") : rt(locale, "Decline request")}
          </button>
        ) : null
      }
      detailQuery={detailQuery}
      backTo="/app/exchanges/requests"
      relation="SENDER"
      subtitle={getExchangeUiText(locale).requestSubtitle}
      title={rt(locale, "Request details")}
    />
  );
}

export function OfferDetailsPage() {
  const { locale } = useLocale();
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
        ? rt(locale, "Approve this offer and mark the books as exchanged?")
        : rt(locale, "Decline this offer?")
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
              {pendingAction === "approve" ? rt(locale, "Approving...") : rt(locale, "Approve offer")}
            </button>
            <button
              className="button button-danger"
              disabled={pendingAction !== null}
              onClick={() => void handleAction("decline")}
              type="button"
            >
              {pendingAction === "decline" ? rt(locale, "Declining...") : rt(locale, "Decline offer")}
            </button>
          </>
        ) : null
      }
      detailQuery={detailQuery}
      backTo="/app/exchanges/offers"
      relation="RECEIVER"
      subtitle={getExchangeUiText(locale).offerSubtitle}
      title={rt(locale, "Offer details")}
    />
  );
}

export function HistoryDetailsPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
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
    return <LoadingBlock label={rt(locale, "Loading exchange history details")} />;
  }

  if (detailQuery.error) {
    return (
      <ErrorBlock
        error={detailQuery.error}
        title={rt(locale, "Exchange history details could not be loaded")}
      />
    );
  }

  const exchange = detailQuery.data;
  const text = getExchangeUiText(locale);
  const currentRole = exchange.userExchangeRole;
  const ownBook = currentRole === "SENDER" ? exchange.senderBook : exchange.receiverBook;
  const otherBook = currentRole === "SENDER" ? exchange.receiverBook : exchange.senderBook;
  const otherUserName = exchange.userNickname || otherBook?.ownerNickname || text.unknownUser;
  const ownUserName = user?.nickname || ownBook?.ownerNickname || rt(locale, "Unknown owner");
  const ownUserPhotoUrl = user?.photoUrl || ownBook?.ownerPhotoUrl || "";
  const otherUserPhotoUrl = otherBook?.ownerPhotoUrl || "";
  const isGiftExchange = !ownBook && Boolean(otherBook?.isGift);
  const giftNotice = getGiftNotice(locale, currentRole);
  const heroMessage =
    exchange.status === "APPROVED"
      ? formatTemplate(text.historySuccess, {
          name: otherUserName,
          contact: exchange.contactDetails || rt(locale, "Not provided")
        })
      : text.historyDeclined;

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label={rt(locale, "Back to history")} className="back-link" to="/app/history">
            <ArrowLeftIcon />
          </Link>
          <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
            {formatExchangeStatusLabel(locale, exchange.status)}
          </span>
        </div>
        <h1>{rt(locale, "Resolved exchanges")}</h1>
        <p>{text.historyReadonly}</p>
        <p className="muted-line">{heroMessage}</p>
      </header>

      <section className="exchange-detail-books">
        {isGiftExchange ? (
          <ExchangeGiftNoticeCard label={giftNotice.label} text={giftNotice.text} />
        ) : (
          <ExchangeBookCard
            book={ownBook}
            label={text.yourBook}
            ownerName={ownUserName}
            ownerPhotoUrl={ownUserPhotoUrl}
          />
        )}

        {!isGiftExchange ? (
          <span aria-hidden="true" className="exchange-preview-swap-icon exchange-detail-swap-icon">
            <SwapIcon />
          </span>
        ) : null}

        <ExchangeBookCard
          book={otherBook}
          label={formatTemplate(text.bookOfUser, { name: otherUserName })}
          ownerName={otherUserName}
          ownerPhotoUrl={otherUserPhotoUrl}
        />
      </section>

      <div className="card-actions">
        <Link className="button button-secondary" to="/app/history">
          {rt(locale, "Back to history")}
        </Link>
      </div>
    </section>
  );
}

export function RequestCreationCard({ book }) {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [senderBookId, setSenderBookId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const text = requestCreationText[locale] ?? requestCreationText.en;

  const isOwnBook = isAuthenticated && user?.id === book.ownerUserId;

  const myBooksQuery = useQuery({
    queryKey: ["request-create", "my-books"],
    enabled: isAuthenticated && !isOwnBook && !book.isGift,
    queryFn: async () => {
      const response = await apiRequest("/book/user?pageIndex=0&pageSize=100", {
        auth: true
      });

      return response.data;
    }
  });

  const myBooks = myBooksQuery.data?.content ?? [];

  useEffect(() => {
    if (book.isGift || myBooks.length === 0) {
      setSenderBookId("");
      return;
    }

    setSenderBookId((current) =>
      myBooks.some((item) => String(item.id) === current) ? current : ""
    );
  }, [book.isGift, myBooks]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!book.isGift && !senderBookId) {
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
          senderBookId: book.isGift ? null : Number(senderBookId),
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
        <h2>{rt(locale, "Send an exchange request")}</h2>
        <p>{rt(locale, "You need an account and at least one of your own books before you can start an exchange.")}</p>
        <div className="card-actions">
          <Link className="button" to="/login">
            {rt(locale, "Sign in")}
          </Link>
          <Link className="button button-secondary" to="/register">
            {rt(locale, "Register")}
          </Link>
        </div>
      </section>
    );
  }

  if (isOwnBook) {
    return null;
  }

  if (!book.isGift && myBooksQuery.isPending) {
    return <LoadingBlock label={rt(locale, "Loading your books for exchange")} />;
  }

  if (!book.isGift && myBooksQuery.error) {
    return <ErrorBlock error={myBooksQuery.error} title={rt(locale, "Your books could not be loaded")} />;
  }

  if (!book.isGift && myBooks.length === 0) {
    return (
      <section className="section-card">
        <h2>{rt(locale, "No active books available")}</h2>
        <p>{rt(locale, "Add one of your own books first, then come back here to create a request.")}</p>
        <div className="card-actions">
          <Link className="button" to="/app/my-books/new">
            {rt(locale, "Add my first book")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-card">
      <h2>{book.isGift ? text.giftHeading : text.exchangeHeading}</h2>
      <p>{book.isGift ? text.giftDescription : text.exchangeDescription}</p>

      <form className="content-stack" onSubmit={handleSubmit}>
        {!book.isGift ? (
          <section className="request-book-picker-shell">
            <div className="row-between">
              <h3>{text.myBooksHeading}</h3>
              <span className="muted-line">{myBooks.length}</span>
            </div>

            <div className="request-book-picker-grid">
              {myBooks.map((item) => {
                const selected = senderBookId === String(item.id);

                return (
                  <button
                    className={`request-book-picker-card${selected ? " request-book-picker-card-active" : ""}`}
                    key={item.id}
                    onClick={() => setSenderBookId(String(item.id))}
                    type="button"
                  >
                    <BookCover
                      className="request-book-picker-cover"
                      detectLegacyMockImage
                      photoUrl={item.photoUrl}
                      placeholderVariant="fullbleed"
                      size="card"
                      title={item.name}
                    />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {error ? <p className="inline-message inline-message-error">{error.message}</p> : null}

        <div className="card-actions">
          <button className="button" disabled={pending || (!book.isGift && !senderBookId)} type="submit">
            {pending
              ? rt(locale, "Creating request...")
              : book.isGift
                ? text.requestButton
                : text.exchangeButton}
          </button>
          <Link className="button button-secondary" to="/app/my-books">
            {rt(locale, "Manage my books")}
          </Link>
        </div>
      </form>
    </section>
  );
}

const requestCreationText = {
  de: {
    exchangeButton: "Tausch anbieten",
    exchangeDescription:
      "Wähle eines deiner Bücher aus und sende damit ein Tauschangebot an den Besitzer dieses Inserats.",
    exchangeHeading: "Tausch anbieten",
    giftDescription:
      "Dieses Buch wird verschenkt, deshalb musst du kein eigenes Buch als Gegenvorschlag auswählen.",
    giftEmptyState:
      "Für diese Anfrage erwartet die aktuelle API noch mindestens ein eigenes Buch. Füge zuerst eines hinzu und versuche es dann erneut.",
    giftHeading: "Buch anfragen",
    giftNote: "Dieses Buch ist als Geschenk markiert. Du kannst es direkt ohne Gegenvorschlag anfragen.",
    myBooksHeading: "Deine Bücher",
    requestButton: "Buch anfragen"
  },
  en: {
    exchangeButton: "Offer exchange",
    exchangeDescription:
      "Choose one of your books and send it as an exchange offer for this listing.",
    exchangeHeading: "Offer exchange",
    giftDescription:
      "This book is being gifted, so you do not need to choose one of your own books as a counter-offer.",
    giftEmptyState:
      "The current API still expects at least one of your own books for this request, so add one first and try again.",
    giftHeading: "Request this book",
    giftNote: "This listing is marked as a gift, so you can request it directly without a counter-offer.",
    myBooksHeading: "Your books",
    requestButton: "Request book"
  },
  ru: {
    exchangeButton: "Предложить обмен",
    exchangeDescription:
      "Выберите одну из своих книг и отправьте её как предложение обмена владельцу этого объявления.",
    exchangeHeading: "Предложить обмен",
    giftDescription:
      "Эту книгу отдают в дар, поэтому вам не нужно выбирать свою книгу для встречного предложения.",
    giftEmptyState:
      "Сейчас API всё ещё ожидает хотя бы одну вашу книгу для такого запроса, поэтому сначала добавьте её в профиль.",
    giftHeading: "Запросить книгу",
    giftNote: "Эта книга доступна в дар, поэтому её можно запросить сразу без встречной книги.",
    myBooksHeading: "Выберите свою книгу",
    requestButton: "Запросить книгу"
  }
};

function ExchangeListPage({
  emptyDescription,
  emptyTitle,
  items,
  fallbackStatus = null,
  loadingLabel,
  page,
  query,
  routeBase,
  setPage,
  summary,
  title
}) {
  const { locale } = useLocale();

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{title}</h1>
        <p>{summary}</p>
      </header>

      {query.isPending ? <LoadingBlock label={loadingLabel} /> : null}
      {query.error ? (
        <ErrorBlock error={query.error} title={rtf(locale, "{title} could not be loaded", { title })} />
      ) : null}

      {!query.isPending && !query.error && items.length === 0 ? (
        <EmptyBlock description={emptyDescription} title={emptyTitle} />
      ) : null}

      {items.length > 0 ? (
        <section className="list-stack">
          {items.map((item) => (
            <ExchangeListCard
              fallbackStatus={fallbackStatus}
              item={item}
              key={item.id}
              locale={locale}
              to={`${routeBase}/${item.id}`}
            />
          ))}
        </section>
      ) : null}

      {!query.isPending && !query.error && (query.data?.totalPages ?? 0) > 1 ? (
        <Pagination onChange={setPage} page={page} totalPages={query.data.totalPages} />
      ) : null}
    </section>
  );
}

function ExchangeDetailsPage({
  actionError,
  actions,
  backTo,
  detailQuery,
  relation,
  subtitle,
  title
}) {
  const { locale } = useLocale();
  const { user } = useAuth();

  if (detailQuery.isPending) {
    return <LoadingBlock label={`${rt(locale, "Loading")} ${title.toLowerCase()}`} />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title={rtf(locale, "{title} could not be loaded", { title })} />;
  }

  const exchange = detailQuery.data;
  const text = getExchangeUiText(locale);
  const currentRole = relation;
  const ownBook = currentRole === "SENDER" ? exchange.senderBook : exchange.receiverBook;
  const otherBook = currentRole === "SENDER" ? exchange.receiverBook : exchange.senderBook;
  const otherUserName = exchange.userNickname || otherBook?.ownerNickname || text.unknownUser;
  const ownUserName = user?.nickname || ownBook?.ownerNickname || rt(locale, "Unknown owner");
  const ownUserPhotoUrl = user?.photoUrl || ownBook?.ownerPhotoUrl || "";
  const otherUserPhotoUrl = otherBook?.ownerPhotoUrl || "";
  const isGiftExchange = !ownBook && Boolean(otherBook?.isGift);
  const giftNotice = getGiftNotice(locale, currentRole);

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label={rt(locale, "Back")} className="back-link" to={backTo}>
            <ArrowLeftIcon />
          </Link>
          <div className="hero-icon-actions">
            {actions}
            <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
              {formatExchangeStatusLabel(locale, exchange.status)}
            </span>
          </div>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>

      {actionError ? <ErrorBlock error={actionError} title={rt(locale, "Exchange action failed")} /> : null}

      <section className="exchange-detail-books">
        {isGiftExchange ? (
          <ExchangeGiftNoticeCard label={giftNotice.label} text={giftNotice.text} />
        ) : (
          <ExchangeBookCard
            book={ownBook}
            label={text.yourBook}
            ownerName={ownUserName}
            ownerPhotoUrl={ownUserPhotoUrl}
          />
        )}

        {!isGiftExchange ? (
          <span aria-hidden="true" className="exchange-preview-swap-icon exchange-detail-swap-icon">
            <SwapIcon />
          </span>
        ) : null}

        <ExchangeBookCard
          book={otherBook}
          label={formatTemplate(text.bookOfUser, { name: otherUserName })}
          ownerName={otherUserName}
          ownerPhotoUrl={otherUserPhotoUrl}
        />
      </section>
    </section>
  );
}

function ExchangeListCard({ fallbackStatus = null, item, locale, to }) {
  const resolvedStatus = item.status || fallbackStatus;

  return (
    <article className="section-card compact-card exchange-list-card">
      <div className="exchange-list-card-layout">
        <div className="exchange-list-card-preview">
          <ExchangePreviewPair
            isGiftExchange={isGiftExchangePreview(item)}
            receiverPhotoUrl={item.receiverBookPhotoUrl}
            receiverTitle={resolveReceiverBookLabel(locale, item.receiverBookName)}
            showGiftBadge={isGiftExchangePreview(item)}
            senderPhotoUrl={item.senderBookPhotoUrl}
            senderTitle={resolveSenderBookLabel(locale, item.senderBookName)}
          />
        </div>

        <div className="exchange-list-card-content">
          <div className="exchange-list-card-head">
            <div className="exchange-list-card-copy">
              <h2>{formatExchangeWithUser(locale, item.userNickname)}</h2>
              <p className="exchange-list-card-subtitle">
                {formatExchangeCardHint(locale, item)}
              </p>
            </div>

            {resolvedStatus ? (
              <span className={`status-pill ${getExchangeStatusClassName(resolvedStatus)}`}>
                {formatExchangeStatusLabel(locale, resolvedStatus)}
              </span>
            ) : null}
          </div>

          <div className="exchange-list-card-footer">
            <Link className="button button-secondary button-compact" to={to}>
              {rt(locale, "Open details")}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function ExchangeGiftNoticeCard({ label, text }) {
  return (
    <article className="section-card exchange-book-card exchange-book-card-note">
      <span className="eyebrow">{label}</span>
      <h2>{label}</h2>
      <p className="muted-line">{text}</p>
    </article>
  );
}

function ExchangePreviewPair({
  isGiftExchange = false,
  receiverPhotoUrl,
  receiverTitle,
  senderPhotoUrl,
  senderTitle,
  showGiftBadge = false
}) {
  if (isGiftExchange) {
    return (
      <div className="exchange-preview-pair exchange-preview-pair-single">
        {showGiftBadge ? (
          <span className="gift-icon-badge gift-icon-badge-small exchange-preview-frame-badge">
            <GiftIcon />
          </span>
        ) : null}
        <div className="book-cover-with-badge">
          <BookCover photoUrl={receiverPhotoUrl} size="sm" title={receiverTitle} />
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-preview-pair">
      <BookCover photoUrl={senderPhotoUrl} size="sm" title={senderTitle} />
      <span aria-hidden="true" className="exchange-preview-swap-icon">
        <SwapIcon />
      </span>
      <div className="book-cover-with-badge">
        {showGiftBadge ? (
          <span className="gift-icon-badge gift-icon-badge-small book-cover-corner-badge">
            <GiftIcon />
          </span>
        ) : null}
        <BookCover photoUrl={receiverPhotoUrl} size="sm" title={receiverTitle} />
      </div>
    </div>
  );
}

function ExchangeBookCard({ book, label, ownerName, ownerPhotoUrl }) {
  const { locale } = useLocale();

  if (!book) {
    return (
      <article className="section-card exchange-book-card exchange-book-card-note">
        <span className="eyebrow">{label}</span>
        <h2>{rt(locale, "Not available")}</h2>
      </article>
    );
  }

  return (
    <article className="section-card exchange-book-card">
      <span className="eyebrow">{label}</span>

      <div className="book-hero-layout">
        <div className="book-cover-with-badge">
          {book.isGift ? (
            <span className="gift-icon-badge gift-icon-badge-small book-cover-corner-badge">
              <GiftIcon />
            </span>
          ) : null}
          <BookCover photoUrl={book.photoUrl} size="md" title={book.name} />
        </div>
        <div>
          <div className="book-hero-tags">
            <span className="category-chip" style={getBookCategoryTagStyle(book.category)}>
              {formatBookCategoryLabel(book.category, locale, rt(locale, "Not available"))}
            </span>
          </div>

          <h2>{book.name || rt(locale, "Not available")}</h2>

          <div className="book-detail-owner">
            <UserIdentityInline name={ownerName} photoUrl={ownerPhotoUrl} size="sm">
              <strong>{ownerName || rt(locale, "Unknown owner")}</strong>
            </UserIdentityInline>
          </div>

          <p className="book-detail-description">
            <strong>{rt(locale, "Description")}:</strong>{" "}
            {book.description || rt(locale, "No description provided.")}
          </p>

          <div className="book-hero-facts">
            <p>{rt(locale, "Author")}: {book.author || rt(locale, "Not available")}</p>
            <p>{rt(locale, "Publication year")}: {renderValue(locale, book.publicationYear)}</p>
            <p>{rt(locale, "City")}: {book.city ? getCityDisplayName(book.city, locale) : rt(locale, "Not available")}</p>
            {book.contactDetails ? <p>{rt(locale, "Contact details")}: {book.contactDetails}</p> : null}
          </div>
        </div>
      </div>
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

function renderValue(locale, value) {
  return value === null || value === undefined || value === "" ? rt(locale, "Not available") : value;
}

function getExchangeUiText(locale) {
  return exchangeUiText[locale] ?? exchangeUiText.en;
}

function formatTemplate(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

function formatExchangeWithUser(locale, userNickname) {
  const text = getExchangeUiText(locale);
  return formatTemplate(text.exchangeWithUser, {
    name: userNickname || text.unknownUser
  });
}

function formatExchangeStatusLabel(locale, status) {
  const labels = {
    de: {
      APPROVED: "Bestaetigt",
      DECLINED: "Abgelehnt",
      PENDING: "Ausstehend"
    },
    en: {
      APPROVED: "Approved",
      DECLINED: "Declined",
      PENDING: "Pending"
    },
    ru: {
      APPROVED: "Подтверждён",
      DECLINED: "Отклонён",
      PENDING: "Ожидает"
    }
  };
  const normalizedStatus = String(status || "").toUpperCase();
  const localeLabels = labels[locale] ?? labels.en;

  if (localeLabels[normalizedStatus]) {
    return localeLabels[normalizedStatus];
  }

  return status ? formatEnumLabel(status) : rt(locale, "Not available");
}

function resolveSenderBookLabel(locale, senderBookName) {
  return senderBookName || rt(locale, "Without counter book");
}

function resolveReceiverBookLabel(locale, receiverBookName) {
  return receiverBookName || rt(locale, "Unknown receiver book");
}

function formatExchangeCardHint(locale, item) {
  const labels = {
    de: {
      gift: "Geschenkbuch ohne Gegenbuch",
      regular: "Tausch zwischen zwei Büchern"
    },
    en: {
      gift: "Gift book without a counter-book",
      regular: "Exchange between two books"
    },
    ru: {
      gift: "Подарочная книга без встречной книги",
      regular: "Обмен между двумя книгами"
    }
  };
  const text = labels[locale] ?? labels.en;

  return isGiftExchangePreview(item) ? text.gift : text.regular;
}

function isGiftExchangePreview(item) {
  return !item?.senderBookName && !item?.senderBookPhotoUrl;
}

function getGiftNotice(locale, role) {
  const giftNoticeText = {
    de: {
      receiverLabel: "Geschenkanfrage",
      receiverText:
        "Dieses Buch wurde als Geschenk angefragt. Deshalb gibt es in diesem Tausch kein Gegenbuch.",
      senderLabel: "Anfrage ohne Gegenbuch",
      senderText:
        "Du hast dieses Buch als Geschenk angefragt. Deshalb ist kein eigenes Gegenbuch erforderlich."
    },
    en: {
      receiverLabel: "Gift request",
      receiverText:
        "This book was requested as a gift, so there is no counter-book in this exchange.",
      senderLabel: "Request without a counter-book",
      senderText:
        "You requested this book as a gift, so a counter-book is not needed for this exchange."
    },
    ru: {
      receiverLabel: "Подарочный запрос",
      receiverText:
        "Эту книгу запросили в дар, поэтому в этом обмене нет встречной книги.",
      senderLabel: "Запрос без встречной книги",
      senderText:
        "Вы запросили эту книгу в дар, поэтому ваша книга для этого запроса не требуется."
    }
  };
  const text = giftNoticeText[locale] ?? giftNoticeText.en;

  if (role === "RECEIVER") {
    return {
      label: text.receiverLabel,
      text: text.receiverText
    };
  }

  return {
    label: text.senderLabel,
    text: text.senderText
  };
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
