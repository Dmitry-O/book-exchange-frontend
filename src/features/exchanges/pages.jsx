import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../shared/i18n/rawText";
import { formatBookCategoryLabel, getBookCategoryTagStyle } from "../../shared/lib/bookCategory";
import { getCityDisplayName } from "../../shared/lib/cities";
import { formatEnumLabel } from "../../shared/lib/format";
import { useConfirmDialog } from "../../shared/lib/useUnsavedChangesGuard";
import { BookCover, UserIdentityInline } from "../../shared/ui/Media";
import { ArrowLeftIcon, GiftIcon, HistoryIcon, IncomingIcon, OutgoingIcon, RequestGiftIcon, SwapIcon } from "../../shared/ui/Icons";
import { PageTitle } from "../../shared/ui/PageTitle";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";
import { ReportActionCard } from "../reports/ReportActionCard";

const EXCHANGE_TABS = ["requests", "offers", "history"];

const exchangeTabsText = {
  de: {
    emptyCatalogCta: "Zum Katalog",
    emptyHistoryDescription:
      "Deine abgeschlossenen Tausche erscheinen hier, sobald die ersten Austauschvorgänge beendet sind.",
    emptyHistoryTitle: "Deine Tauschhistorie ist noch leer",
    emptyOffersDescription:
      "Sobald dir jemand einen Büchertausch anbietet oder dein Buch als Geschenk anfragt, erscheinen die Angebote hier.",
    emptyOffersTitle: "Du hast noch keine Tauschangebote",
    emptyRequestsDescription:
      "Öffne den Katalog, wenn du ein weiteres Buch zum Tauschen oder Verschenken finden möchtest.",
    emptyRequestsTitle: "Du hast noch keine Tauschanfragen",
    historyTab: "Verlauf",
    offersTab: "Angebote",
    requestsTab: "Anfragen",
    subtitle:
      "Wechsle hier zwischen deinen Anfragen, eingehenden Angeboten und der bisherigen Tauschhistorie.",
    title: "Tausche"
  },
  en: {
    emptyCatalogCta: "Open catalog",
    emptyHistoryDescription:
      "Completed exchanges will appear here once your first exchange flow reaches a final result.",
    emptyHistoryTitle: "Your exchange history is still empty",
    emptyOffersDescription:
      "Incoming exchange offers and gift requests for your books will appear here.",
    emptyOffersTitle: "You do not have any exchange offers yet",
    emptyRequestsDescription:
      "Open the catalog when you want to find another book for exchange or gift.",
    emptyRequestsTitle: "You do not have any exchange requests yet",
    historyTab: "History",
    offersTab: "Offers",
    requestsTab: "Requests",
    subtitle:
      "Switch here between your requests, incoming offers, and completed exchange history.",
    title: "Exchanges"
  },
  ru: {
    emptyCatalogCta: "Перейти в каталог",
    emptyHistoryDescription:
      "Здесь появятся завершённые обмены, когда у вас появятся первые подтверждённые или отклонённые результаты.",
    emptyHistoryTitle: "Ваша история обмена книгами ещё пуста",
    emptyOffersDescription:
      "Когда кто-то предложит вам обмен или запросит вашу книгу в подарок, это появится здесь.",
    emptyOffersTitle: "У вас ещё нет предложений по обмену книг",
    emptyRequestsDescription:
      "Откройте каталог, если хотите найти ещё одну книгу для обмена или в подарок.",
    emptyRequestsTitle: "У вас ещё нет запросов по обмену книг",
    historyTab: "История",
    offersTab: "Предложения",
    requestsTab: "Запросы",
    subtitle:
      "Здесь можно быстро переключаться между вашими запросами, входящими предложениями и историей обменов.",
    title: "Обмены"
  }
};

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

export function ExchangesPage() {
  const { locale } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveExchangeTab(searchParams.get("tab"));
  const text = getExchangeTabsText(locale);
  const requestsCountQuery = useExchangeCollectionQuery("requests", 0);
  const offersCountQuery = useExchangeCollectionQuery("offers", 0);
  const historyCountQuery = useExchangeCollectionQuery("history", 0);
  const tabCounts = {
    history: historyCountQuery.data?.totalElements ?? 0,
    offers: offersCountQuery.data?.totalElements ?? 0,
    requests: requestsCountQuery.data?.totalElements ?? 0
  };

  return (
    <section className="content-stack">
      <header className="section-card">
        <PageTitle icon={SwapIcon}>{text.title}</PageTitle>
        <p>{text.subtitle}</p>
      </header>

      <section className="section-card exchange-tabs-card">
        <div className="exchange-tabs" role="tablist">
          {EXCHANGE_TABS.map((tab) => {
            const Icon = resolveExchangeTabIcon(tab);
            const selected = tab === activeTab;

            return (
              <button
                aria-selected={selected}
                className={selected ? "exchange-tab exchange-tab-active" : "exchange-tab"}
                key={tab}
                onClick={() => setSearchParams({ tab })}
                role="tab"
                type="button"
              >
                <Icon />
                <span>{formatExchangeTabLabel(text, tab, tabCounts[tab])}</span>
              </button>
            );
          })}
        </div>
      </section>

      <ExchangeTabPanel tab={activeTab} />
    </section>
  );
}

export function RequestsPage() {
  return <Navigate replace to="/app/exchanges?tab=requests" />;
}

export function OffersPage() {
  return <Navigate replace to="/app/exchanges?tab=offers" />;
}

export function HistoryPage() {
  return <Navigate replace to="/app/exchanges?tab=history" />;
}

function ExchangeTabPanel({ tab }) {
  const { locale } = useLocale();
  const [pageIndex, setPageIndex] = useState(0);
  const text = getExchangeTabsText(locale);

  useEffect(() => {
    setPageIndex(0);
  }, [tab]);

  const query = useExchangeCollectionQuery(tab, pageIndex);
  const config = getExchangeTabConfig(locale, tab, text);

  return (
    <ExchangeListPage
      emptyAction={
        <Link className="button button-secondary" to="/catalog">
          {text.emptyCatalogCta}
        </Link>
      }
      emptyDescription={config.emptyDescription}
      emptyTitle={config.emptyTitle}
      fallbackStatus={config.fallbackStatus}
      items={query.data?.content ?? []}
      loadingLabel={config.loadingLabel}
      page={pageIndex}
      query={query}
      routeBase={config.routeBase}
      setPage={setPageIndex}
      showHeader={false}
      title={config.title}
      type={config.type}
    />
  );
}

export function RequestDetailsPage() {
  const { locale } = useLocale();
  const location = useLocation();
  const queryClient = useQueryClient();
  const confirmAction = useConfirmDialog();
  const { exchangeId } = useParams();
  const detailQuery = useExchangeDetails("request", exchangeId);
  const [pendingAction, setPendingAction] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["updates"] });
    void queryClient.invalidateQueries({ queryKey: ["updates", "summary"] });
  }, [detailQuery.data?.id, queryClient]);

  async function handleDecline() {
    const exchange = detailQuery.data;
    const confirmed = await confirmAction({
      cancelLabel: rt(locale, "Cancel"),
      confirmLabel: rt(locale, "Decline request"),
      message: rt(locale, "Decline this request?"),
      title: rt(locale, "Decline request"),
      variant: "warning"
    });

    if (!confirmed) {
      return;
    }

    setPendingAction(true);
    setActionError(null);
    setActionMessage("");

    try {
      await apiRequest(`/request/${exchange.id}/decline`, {
        method: "PATCH",
        auth: true,
        version: exchange.__version ?? exchange.version
      });

      await invalidateExchangeCollections(queryClient);
      await detailQuery.refetch();
      setActionMessage(getExchangeActionMessage(locale, "requestDeclined"));
    } catch (error) {
      setActionError(error);
    } finally {
      setPendingAction(false);
    }
  }

  return (
    <ExchangeDetailsPage
      actionError={actionError}
      actionMessage={actionMessage}
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
      backTo={location.state?.backTo || "/app/exchanges?tab=requests"}
      relation="SENDER"
      subtitle={getExchangeUiText(locale).requestSubtitle}
      title={rt(locale, "Request details")}
      titleIcon={OutgoingIcon}
    />
  );
}

export function OfferDetailsPage() {
  const { locale } = useLocale();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirmAction = useConfirmDialog();
  const { exchangeId } = useParams();
  const detailQuery = useExchangeDetails("offer", exchangeId);
  const [pendingAction, setPendingAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["updates"] });
    void queryClient.invalidateQueries({ queryKey: ["updates", "summary"] });
  }, [detailQuery.data?.id, queryClient]);

  async function handleAction(action) {
    const exchange = detailQuery.data;
    const confirmed = await confirmAction({
      cancelLabel: rt(locale, "Cancel"),
      confirmLabel: action === "approve" ? rt(locale, "Accept offer") : rt(locale, "Decline offer"),
      message:
        action === "approve"
          ? rt(locale, "Accept this offer and automatically decline all other possible offers related to this book?")
          : rt(locale, "Decline this offer?"),
      title: action === "approve" ? rt(locale, "Accept offer") : rt(locale, "Decline offer"),
      variant: "warning"
    });

    if (!confirmed) {
      return;
    }

    setPendingAction(action);
    setActionError(null);
    setActionMessage("");

    try {
      await apiRequest(`/offer/${exchange.id}/${action}`, {
        method: "PATCH",
        auth: true,
        version: exchange.__version ?? exchange.version
      });

      await invalidateExchangeCollections(queryClient);
      if (action === "approve") {
        navigate(`/app/history/${exchange.id}`, {
          replace: true,
          state: { backTo: "/app/exchanges?tab=history" }
        });
        return;
      }

      await detailQuery.refetch();
      setActionMessage(getExchangeActionMessage(locale, "offerDeclined"));
    } catch (error) {
      setActionError(error);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <ExchangeDetailsPage
      actionError={actionError}
      actionMessage={actionMessage}
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
      backTo={location.state?.backTo || "/app/exchanges?tab=offers"}
      relation="RECEIVER"
      subtitle={getExchangeUiText(locale).offerSubtitle}
      title={rt(locale, "Offer details")}
      titleIcon={IncomingIcon}
    />
  );
}

export function HistoryDetailsPage() {
  const { locale } = useLocale();
  const location = useLocation();
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
  const isGiftExchange = !exchange.senderBook && Boolean(exchange.receiverBook?.isGift);
  const giftNotice = getGiftNotice(locale, currentRole, otherUserName);
  const heroMessage =
    exchange.status === "APPROVED"
      ? renderHistorySuccessMessage(locale, text, otherUserName, exchange.contactDetails || rt(locale, "Not provided"))
      : text.historyDeclined;
  const reportTargetUser = {
    id: exchange.otherUserId,
    nickname: otherUserName,
    photoUrl: otherUserPhotoUrl
  };

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <div className="book-detail-header-main">
            <Link aria-label={rt(locale, "Back to history")} className="back-link" to={location.state?.backTo || "/app/exchanges?tab=history"}>
              <ArrowLeftIcon />
            </Link>
            <PageTitle icon={HistoryIcon}>{rt(locale, "Exchange history item")}</PageTitle>
          </div>
          <div className="hero-icon-actions">
            <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
              {formatExchangeStatusLabel(locale, exchange.status)}
            </span>
            <ReportActionCard targetBook={otherBook} targetUser={reportTargetUser} variant="icon" />
          </div>
        </div>
        <p>{rt(locale, "Review the final state of this exchange, its status, and the books involved.")}</p>
        {exchange.status === "APPROVED" ? <p className="muted-line">{heroMessage}</p> : null}
      </header>

      <section className="exchange-detail-books">
        {currentRole === "SENDER" && isGiftExchange ? (
          <ExchangeGiftNoticeCard
            eyebrow={giftNotice.eyebrow}
            ownerName={ownUserName}
            ownerPhotoUrl={ownUserPhotoUrl}
            text={giftNotice.text}
            title={giftNotice.title}
          />
        ) : (
          <ExchangeBookCard
            book={ownBook}
            label={text.yourBook}
            ownerName={ownUserName}
            ownerPhotoUrl={ownUserPhotoUrl}
            showContactDetails={exchange.status === "APPROVED"}
          />
        )}

        <span aria-hidden="true" className="exchange-preview-swap-icon exchange-detail-swap-icon">
          <SwapIcon />
        </span>

        {currentRole === "RECEIVER" && isGiftExchange ? (
          <ExchangeGiftNoticeCard
            eyebrow={giftNotice.eyebrow}
            ownerName={otherUserName}
            ownerPhotoUrl={otherUserPhotoUrl}
            text={giftNotice.text}
            title={giftNotice.title}
          />
        ) : (
          <ExchangeBookCard
            book={otherBook}
            label={formatTemplate(text.bookOfUser, { name: otherUserName })}
            ownerName={otherUserName}
            ownerPhotoUrl={otherUserPhotoUrl}
            showContactDetails={exchange.status === "APPROVED"}
          />
        )}
      </section>
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

  const requestsQuery = useQuery({
    queryKey: ["request-create", "requests", book.id],
    enabled: isAuthenticated && !isOwnBook,
    queryFn: async () => {
      const content = [];
      let pageIndex = 0;
      let totalPages = 1;

      while (pageIndex < totalPages) {
        const response = await apiRequest(`/request?pageIndex=${pageIndex}&pageSize=100`, {
          auth: true
        });
        const page = response.data ?? {};

        content.push(...(page.content ?? []));
        totalPages = page.totalPages ?? 0;
        pageIndex += 1;
      }

      return { content };
    }
  });

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
  const pendingRequests = requestsQuery.data?.content ?? [];
  const blockedSenderBookIds = new Set(
    pendingRequests
      .filter(
        (item) =>
          Number(item?.receiverBookId) === Number(book.id) &&
          Number(item?.otherUserId) === Number(book.ownerUserId) &&
          item?.senderBookId !== null &&
          item?.senderBookId !== undefined
      )
      .map((item) => String(item.senderBookId))
  );
  const hasExistingGiftRequest = pendingRequests.some(
    (item) =>
      Number(item?.receiverBookId) === Number(book.id) &&
      Number(item?.otherUserId) === Number(book.ownerUserId) &&
      (item?.senderBookId === null || item?.senderBookId === undefined)
  );
  const selectableMyBooks = myBooks.filter(
    (item) => !item.isGift && !blockedSenderBookIds.has(String(item.id))
  );

  useEffect(() => {
    if (book.isGift || selectableMyBooks.length === 0) {
      setSenderBookId("");
      return;
    }

    setSenderBookId((current) =>
      selectableMyBooks.some((item) => String(item.id) === current) ? current : ""
    );
  }, [book.isGift, selectableMyBooks]);

  async function handleSubmit(event) {
    event.preventDefault();

    if ((!book.isGift && !senderBookId) || (book.isGift && hasExistingGiftRequest)) {
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
      navigate("/app/exchanges?tab=requests", { replace: true });
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

  if (requestsQuery.isPending || (!book.isGift && myBooksQuery.isPending)) {
    return <LoadingBlock label={rt(locale, "Preparing exchange request")} />;
  }

  if (requestsQuery.error) {
    return <ErrorBlock error={requestsQuery.error} title={rt(locale, "Exchange request data could not be loaded")} />;
  }

  if (!book.isGift && myBooksQuery.error) {
    return <ErrorBlock error={myBooksQuery.error} title={rt(locale, "Your books could not be loaded")} />;
  }

  if (!book.isGift && selectableMyBooks.length === 0) {
    return (
      <section className="section-card">
        <h2>{rt(locale, "No active books available")}</h2>
        <p>{text.noEligibleBooks}</p>
        <div className="card-actions">
          <Link className="button" to="/app/my-books/new">
            {rt(locale, "Add new book")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-card request-creation-card">
      <h2>{book.isGift ? text.giftHeading : text.exchangeHeading}</h2>
      <p className="request-creation-description">{book.isGift ? text.giftDescription : text.exchangeDescription}</p>

      <form className="content-stack" onSubmit={handleSubmit}>
        {!book.isGift ? (
          <section className="request-book-picker-shell">
            <div className="row-between">
              <h3>{text.myBooksHeading}</h3>
              <span className="muted-line">{selectableMyBooks.length}</span>
            </div>

            <div className="request-book-picker-grid">
              {selectableMyBooks.map((item) => {
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

        {book.isGift && hasExistingGiftRequest ? (
          <p className="inline-message inline-message-error">{text.giftRequestExists}</p>
        ) : null}
        {error ? <p className="inline-message inline-message-error">{error.message}</p> : null}

        <div className="card-actions">
          <button
            className="button"
            disabled={pending || (!book.isGift && !senderBookId) || (book.isGift && hasExistingGiftRequest)}
            type="submit"
          >
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
    giftRequestExists: "Für diese Buchseite hast du bereits einen aktiven Geschenkantrag erstellt.",
    giftNote: "Dieses Buch ist als Geschenk markiert. Du kannst es direkt ohne Gegenvorschlag anfragen.",
    myBooksHeading: "Deine Bücher",
    noEligibleBooks:
      "Für dieses Buch gibt es gerade keine freie eigene Gegenbuch-Option mehr. Füge ein neues Buch hinzu und versuche es erneut.",
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
    giftRequestExists: "You already have an active gift request for this book.",
    giftNote: "This listing is marked as a gift, so you can request it directly without a counter-offer.",
    myBooksHeading: "Your books",
    noEligibleBooks:
      "There is no available book left for a new request to this listing. Add another book and try again.",
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
    giftRequestExists: "У вас уже есть активный запрос на получение этой книги в подарок.",
    giftNote: "Эта книга доступна в дар, поэтому её можно запросить сразу без встречной книги.",
    myBooksHeading: "Выберите свою книгу",
    noEligibleBooks:
      "Для этой книги у вас сейчас не осталось доступной книги для нового запроса. Добавьте новую книгу и попробуйте снова.",
    requestButton: "Запросить книгу"
  }
};

function ExchangeListPage({
  emptyAction = null,
  emptyDescription,
  emptyTitle,
  items,
  fallbackStatus = null,
  loadingLabel,
  page,
  query,
  routeBase,
  setPage,
  showHeader = true,
  summary,
  title,
  titleIcon,
  type
}) {
  const { locale } = useLocale();

  return (
    <section className="content-stack">
      {showHeader ? (
        <header className="section-card">
          <PageTitle icon={titleIcon}>{title}</PageTitle>
          <p>{summary}</p>
        </header>
      ) : null}

      {query.isPending ? <LoadingBlock label={loadingLabel} /> : null}
      {query.error ? (
        <ErrorBlock
          error={query.error}
          title={rtf(locale, "{title} could not be loaded", { title: title ?? rt(locale, "Exchanges") })}
        />
      ) : null}

      {!query.isPending && !query.error && items.length === 0 ? (
        <EmptyBlock actions={emptyAction} description={emptyDescription} title={emptyTitle} />
      ) : null}

      {items.length > 0 ? (
        <section className="exchange-card-grid">
          {items.map((item) => (
            <ExchangeListCard
              fallbackStatus={fallbackStatus}
              item={item}
              key={item.id}
              locale={locale}
              type={type}
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

function useExchangeCollectionQuery(tab, pageIndex) {
  return useQuery({
    queryKey: [tab, pageIndex],
    queryFn: async () => {
      const endpoint = tab === "offers" ? "offer" : tab === "history" ? "history" : "request";
      const response = await apiRequest(
        `/${endpoint}?pageIndex=${pageIndex}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    }
  });
}

function getExchangeTabConfig(locale, tab, text) {
  if (tab === "offers") {
    return {
      emptyDescription: text.emptyOffersDescription,
      emptyTitle: text.emptyOffersTitle,
      fallbackStatus: "PENDING",
      loadingLabel: rt(locale, "Loading your offers"),
      routeBase: "/app/exchanges/offers",
      title: text.offersTab,
      type: "offer"
    };
  }

  if (tab === "history") {
    return {
      emptyDescription: text.emptyHistoryDescription,
      emptyTitle: text.emptyHistoryTitle,
      fallbackStatus: null,
      loadingLabel: rt(locale, "Loading exchange history"),
      routeBase: "/app/history",
      title: text.historyTab,
      type: "history"
    };
  }

  return {
    emptyDescription: text.emptyRequestsDescription,
    emptyTitle: text.emptyRequestsTitle,
    fallbackStatus: "PENDING",
    loadingLabel: rt(locale, "Loading your requests"),
    routeBase: "/app/exchanges/requests",
    title: text.requestsTab,
    type: "request"
  };
}

function resolveExchangeTab(value) {
  return EXCHANGE_TABS.includes(value) ? value : "requests";
}

function resolveExchangeTabIcon(tab) {
  if (tab === "offers") {
    return IncomingIcon;
  }

  if (tab === "history") {
    return HistoryIcon;
  }

  return OutgoingIcon;
}

function resolveExchangeTabLabel(text, tab) {
  if (tab === "offers") {
    return text.offersTab;
  }

  if (tab === "history") {
    return text.historyTab;
  }

  return text.requestsTab;
}

function formatExchangeTabLabel(text, tab, count) {
  return `${resolveExchangeTabLabel(text, tab)} (${count ?? 0})`;
}

function ExchangeDetailsPage({
  actionError,
  actionMessage,
  actions,
  backTo,
  detailQuery,
  relation,
  showContactDetails = false,
  subtitle,
  title,
  titleIcon
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
  const isGiftExchange = !exchange.senderBook && Boolean(exchange.receiverBook?.isGift);
  const giftNotice = getGiftNotice(locale, currentRole, otherUserName);
  const reportTargetUser = {
    id: exchange.otherUserId,
    nickname: otherUserName,
    photoUrl: otherUserPhotoUrl
  };

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <div className="book-detail-header-main">
            <Link aria-label={rt(locale, "Back")} className="back-link" to={backTo}>
              <ArrowLeftIcon />
            </Link>
            <PageTitle icon={titleIcon}>{title}</PageTitle>
          </div>
          <div className="hero-icon-actions">
            <span className={`status-pill ${getExchangeStatusClassName(exchange.status)}`}>
              {formatExchangeStatusLabel(locale, exchange.status)}
            </span>
            <ReportActionCard targetBook={otherBook} targetUser={reportTargetUser} variant="icon" />
          </div>
        </div>
        <div className="exchange-detail-hero-row">
          <p>{subtitle}</p>
          {actions ? <div className="card-actions exchange-detail-actions">{actions}</div> : null}
        </div>
      </header>

      {actionMessage ? <p className="inline-message inline-message-success">{actionMessage}</p> : null}
      {actionError ? <ErrorBlock error={actionError} title={rt(locale, "Exchange action failed")} /> : null}

      <section className="exchange-detail-books">
        {currentRole === "SENDER" && isGiftExchange ? (
          <ExchangeGiftNoticeCard
            eyebrow={giftNotice.eyebrow}
            ownerName={ownUserName}
            ownerPhotoUrl={ownUserPhotoUrl}
            text={giftNotice.text}
            title={giftNotice.title}
          />
        ) : (
          <ExchangeBookCard
            book={ownBook}
            label={text.yourBook}
            ownerName={ownUserName}
            ownerPhotoUrl={ownUserPhotoUrl}
            showContactDetails={showContactDetails}
          />
        )}

        <span aria-hidden="true" className="exchange-preview-swap-icon exchange-detail-swap-icon">
          <SwapIcon />
        </span>

        {currentRole === "RECEIVER" && isGiftExchange ? (
          <ExchangeGiftNoticeCard
            eyebrow={giftNotice.eyebrow}
            ownerName={otherUserName}
            ownerPhotoUrl={otherUserPhotoUrl}
            text={giftNotice.text}
            title={giftNotice.title}
          />
        ) : (
          <ExchangeBookCard
            book={otherBook}
            label={formatTemplate(text.bookOfUser, { name: otherUserName })}
            ownerName={otherUserName}
            ownerPhotoUrl={otherUserPhotoUrl}
            showContactDetails={showContactDetails}
          />
        )}
      </section>

    </section>
  );
}

function ExchangeListCard({ fallbackStatus = null, item, locale, to, type }) {
  const resolvedStatus = item.status || fallbackStatus;
  const roleBadge = getExchangeHistoryRoleBadge(locale, item, type);

  return (
    <Link className="section-card compact-card exchange-list-card exchange-list-card-link" to={to}>
      {roleBadge ? <span className="status-pill status-pill-neutral exchange-list-card-role-badge">{roleBadge}</span> : null}
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
                {formatExchangeCardHint(locale, item, type)}
              </p>
            </div>

            {resolvedStatus ? (
              <span className={`status-pill ${getExchangeStatusClassName(resolvedStatus)}`}>
                {formatExchangeStatusLabel(locale, resolvedStatus)}
              </span>
            ) : null}
          </div>

        </div>
      </div>
    </Link>
  );
}

function ExchangeGiftNoticeCard({ eyebrow, ownerName = "", ownerPhotoUrl = "", text, title }) {
  return (
    <article className="section-card exchange-book-card exchange-book-card-note">
      <span className="eyebrow">{eyebrow}</span>
      <div className="exchange-gift-note-content">
        <div>
          <h2>{title}</h2>
          <p className="muted-line">{text}</p>
        </div>
        <span aria-hidden="true" className="request-gift-illustration request-gift-illustration-lg">
          <RequestGiftIcon />
        </span>
      </div>
      {ownerName ? (
        <div className="book-owner exchange-book-owner">
          <UserIdentityInline className="admin-book-owner-inline" name={ownerName} photoUrl={ownerPhotoUrl} size="sm">
            <strong>{ownerName}</strong>
          </UserIdentityInline>
        </div>
      ) : null}
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
      <div className="exchange-preview-pair">
        <span aria-hidden="true" className="request-gift-illustration request-gift-illustration-sm">
          <RequestGiftIcon />
        </span>
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

function ExchangeBookCard({ book, label, ownerName, ownerPhotoUrl, showContactDetails = false }) {
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

          <p className="book-detail-description">
            <strong>{rt(locale, "Description")}:</strong>{" "}
            {book.description || rt(locale, "No description provided.")}
          </p>

          <div className="book-hero-facts">
            <p>{rt(locale, "Author")}: {book.author || rt(locale, "Not available")}</p>
            <p>{rt(locale, "Publication year")}: {renderValue(locale, book.publicationYear)}</p>
            <p>{rt(locale, "City")}: {book.city ? getCityDisplayName(book.city, locale) : rt(locale, "Not available")}</p>
            {showContactDetails && book.contactDetails ? (
              <p>{rt(locale, "Contact details")}: <strong>{book.contactDetails}</strong></p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="book-owner exchange-book-owner">
        <UserIdentityInline className="admin-book-owner-inline" name={ownerName} photoUrl={ownerPhotoUrl} size="sm">
          <strong>{ownerName || rt(locale, "Unknown owner")}</strong>
        </UserIdentityInline>
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

function getExchangeTabsText(locale) {
  return exchangeTabsText[locale] ?? exchangeTabsText.en;
}

function getExchangeActionMessage(locale, kind) {
  const messages = {
    de: {
      offerApproved: "Der Tausch wurde bestätigt. Beide Seiten sehen die Änderung sofort.",
      offerDeclined: "Die Anfrage wurde abgelehnt. Die andere Seite sieht die Änderung sofort.",
      requestDeclined: "Die Anfrage wurde storniert. Die andere Seite sieht die Änderung sofort."
    },
    en: {
      offerApproved: "The exchange was approved. Both users can already see the change.",
      offerDeclined: "The request was declined. The other user can already see the change.",
      requestDeclined: "The request was cancelled. The other user can already see the change."
    },
    ru: {
      offerApproved: "Обмен подтвержден. Оба пользователя уже видят это изменение.",
      offerDeclined: "Запрос отклонен. Другой пользователь уже видит это изменение.",
      requestDeclined: "Запрос отменен. Другой пользователь уже видит это изменение."
    }
  };
  const localeMessages = messages[locale] ?? messages.en;

  return localeMessages[kind] ?? "";
}

function formatTemplate(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

function renderHistorySuccessMessage(locale, text, name, contact) {
  const copy = {
    de: (
      <>
        Du kannst {name} mit diesen Kontaktdaten erreichen: <strong>{contact}</strong>
      </>
    ),
    en: (
      <>
        You can contact {name} using these details: <strong>{contact}</strong>
      </>
    ),
    ru: (
      <>
        Вы можете связаться с пользователем {name} по этим контактным данным: <strong>{contact}</strong>
      </>
    )
  };

  return copy[locale] ?? copy.en;
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
      APPROVED: "Bestätigt",
      DECLINED: "Abgelehnt",
      PENDING: "Ausstehend"
    },
    en: {
      APPROVED: "Approved",
      DECLINED: "Declined",
      PENDING: "Pending"
    },
    ru: {
      APPROVED: "Подтвержден",
      DECLINED: "Отклонен",
      PENDING: "В ожидании"
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

function formatExchangeCardHint(locale, item, type) {
  const role = resolveExchangeCardRole(item, type);
  const isGift = isGiftExchangePreview(item);
  const senderBook = resolveExchangeBookTitle(item.senderBookName, locale);
  const receiverBook = resolveExchangeBookTitle(item.receiverBookName, locale);
  const copy = {
    de: {
      offerGift: <>Dein Buch <strong>{receiverBook}</strong> wurde als Geschenk angefragt.</>,
      offerRegular: <>Dir wird angeboten, dein Buch <strong>{receiverBook}</strong> gegen <strong>{senderBook}</strong> zu tauschen.</>,
      requestGift: <>Du hast das Buch <strong>{receiverBook}</strong> als Geschenk angefragt.</>,
      requestRegular: <>Du hast vorgeschlagen, dein Buch <strong>{senderBook}</strong> gegen <strong>{receiverBook}</strong> zu tauschen.</>
    },
    en: {
      offerGift: <>Your book <strong>{receiverBook}</strong> was requested as a gift.</>,
      offerRegular: <>You are offered to exchange your book <strong>{receiverBook}</strong> for <strong>{senderBook}</strong>.</>,
      requestGift: <>You requested <strong>{receiverBook}</strong> as a gift.</>,
      requestRegular: <>You offered to exchange your book <strong>{senderBook}</strong> for <strong>{receiverBook}</strong>.</>
    },
    ru: {
      offerGift: <>Вашу книгу <strong>{receiverBook}</strong> запросили в подарок.</>,
      offerRegular: <>Вам предлагают обменять свою книгу <strong>{receiverBook}</strong> на книгу <strong>{senderBook}</strong>.</>,
      requestGift: <>Вы запросили книгу <strong>{receiverBook}</strong> в подарок.</>,
      requestRegular: <>Вы предложили обменять свою книгу <strong>{senderBook}</strong> на книгу <strong>{receiverBook}</strong>.</>
    }
  };
  const text = copy[locale] ?? copy.en;

  if (role === "RECEIVER") {
    return isGift ? text.offerGift : text.offerRegular;
  }

  return isGift ? text.requestGift : text.requestRegular;
}

function isGiftExchangePreview(item) {
  return !item?.senderBookName && !item?.senderBookPhotoUrl;
}

function resolveExchangeCardRole(item, type) {
  if (type === "offer") {
    return "RECEIVER";
  }

  if (type === "request") {
    return "SENDER";
  }

  return item?.userExchangeRole ?? null;
}

function getExchangeHistoryRoleBadge(locale, item, type) {
  if (type !== "history" || !item?.userExchangeRole) {
    return null;
  }

  const labels = {
    de: {
      RECEIVER: "Angebot",
      SENDER: "Anfrage"
    },
    en: {
      RECEIVER: "Offer",
      SENDER: "Request"
    },
    ru: {
      RECEIVER: "Предложение",
      SENDER: "Запрос"
    }
  };
  const localeLabels = labels[locale] ?? labels.en;

  return localeLabels[item.userExchangeRole] ?? null;
}

function resolveExchangeBookTitle(title, locale) {
  return title || rt(locale, "Unknown book");
}

function getGiftNotice(locale, role, userName = "") {
  const giftNoticeText = {
    de: {
      receiverLabel: "Geschenkanfrage",
      receiverTitle: "Anfrage ohne Gegenbuch",
      receiverText:
        "Dieses Buch wurde als Geschenk angefragt. Deshalb gibt es in diesem Tausch kein Gegenbuch.",
      receiverTextWithUser:
        "{name} hat dein Buch als Geschenk angefragt. Deshalb gibt es in diesem Tausch kein Gegenbuch.",
      senderLabel: "Geschenkanfrage",
      senderTitle: "Anfrage ohne Gegenbuch",
      senderText:
        "Du hast dieses Buch als Geschenk angefragt. Deshalb ist kein eigenes Gegenbuch erforderlich."
    },
    en: {
      receiverLabel: "Gift request",
      receiverTitle: "Request without a counter-book",
      receiverText:
        "This book was requested as a gift, so there is no counter-book in this exchange.",
      receiverTextWithUser:
        "{name} requested your book as a gift, so there is no counter-book in this exchange.",
      senderLabel: "Gift request",
      senderTitle: "Request without a counter-book",
      senderText:
        "You requested this book as a gift, so a counter-book is not needed for this exchange."
    },
    ru: {
      receiverLabel: "Запрос книги в подарок",
      receiverTitle: "Запрос без встречной книги",
      receiverText:
        "Эту книгу запросили в дар, поэтому в этом обмене нет встречной книги.",
      receiverTextWithUser:
        "Пользователь {name} запросил вашу книгу в дар, поэтому встречная книга для этого запроса не нужна.",
      senderLabel: "Запрос книги в подарок",
      senderTitle: "Запрос без встречной книги",
      senderText:
        "Вы запросили эту книгу в дар, поэтому ваша книга для этого запроса не требуется."
    }
  };
  const text = giftNoticeText[locale] ?? giftNoticeText.en;

  if (role === "RECEIVER") {
    return {
      eyebrow: text.receiverLabel,
      title: text.receiverTitle,
      text:
        userName && text.receiverTextWithUser
          ? formatTemplate(text.receiverTextWithUser, { name: userName })
          : text.receiverText
    };
  }

  return {
    eyebrow: text.senderLabel,
    title: text.senderTitle,
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
