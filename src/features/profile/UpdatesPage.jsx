import { useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { useUnreadUpdatesSummaryQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { rt } from "../../shared/i18n/rawText";
import { buildQueryString, formatDateTime } from "../../shared/lib/format";
import { useInfiniteScroll } from "../../shared/lib/useInfiniteScroll";
import { BookCover, UserAvatar } from "../../shared/ui/Media";
import {
  AdminBadgeIcon,
  AdminGrantedIcon,
  AdminRevokedIcon,
  BellIcon,
  BookIcon,
  CheckIcon,
  DeletedUserIcon,
  EnvelopeClosedIcon,
  EnvelopeOpenIcon,
  FlagIcon,
  GiftIcon,
  MarkReadIcon,
  PencilIcon,
  RequestGiftIcon,
  RestoreIcon,
  SwapIcon,
  TrashIcon,
  UserBlockedIcon,
  UserRestoredIcon,
  UserIcon,
  XIcon
} from "../../shared/ui/Icons";
import { PageTitle } from "../../shared/ui/PageTitle";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const UPDATE_FILTERS = ["ALL", "UNREAD", "READ"];

const updatesText = {
  de: {
    allDescription: "Alle Austausch-Updates in einer Liste",
    allLabel: "Alle",
    emptyAllDescription:
      "Sobald es neue Ereignisse zu deinen Tauschen gibt, erscheinen sie hier in einer gemeinsamen Liste.",
    emptyAllTitle: "Noch keine Austausch-Updates",
    emptyReadDescription:
      "Hier erscheinen Updates, die du bereits geöffnet hast. Schau später noch einmal vorbei oder wechsle den Filter.",
    emptyReadTitle: "Noch keine älteren Updates",
    emptyUnreadDescription:
      "Sobald neue Ereignisse zu deinen Tauschen auftauchen, werden sie hier als neue Updates angezeigt.",
    emptyUnreadTitle: "Keine neuen Updates",
    markAsRead: "Als gelesen markieren",
    markAsUnread: "Als ungelesen markieren",
    pendingOfferGift: "{name} hat dein Buch {receiverBook} als Geschenk angefragt",
    pendingOfferRegular:
      "{name} schlägt vor, dein Buch {receiverBook} gegen {senderBook} zu tauschen",
    pendingRequestGift: "Du hast das Buch {receiverBook} als Geschenk angefragt",
    pendingRequestRegular:
      "Du hast vorgeschlagen, dein Buch {senderBook} gegen {receiverBook} zu tauschen",
    readDescription: "Nur bereits gelesene Updates",
    readLabel: "Gelesen",
    resolvedOfferApprovedGift:
      "Du hast die Geschenkanfrage von {name} für dein Buch {receiverBook} bestätigt",
    resolvedOfferApprovedRegular:
      "Du hast den Tausch deines Buches {receiverBook} gegen {senderBook} von {name} bestätigt",
    resolvedOfferCancelledGift:
      "Die Anfrage auf dein Buch {receiverBook} als Geschenk wurde zurückgezogen",
    resolvedOfferCancelledRegular:
      "Die Anfrage auf dein Buch {receiverBook} gegen {senderBook} wurde zurückgezogen",
    resolvedOfferAutoDeclinedGift:
      "Die Geschenkanfrage für dein Buch {receiverBook} wurde automatisch abgelehnt",
    resolvedOfferAutoDeclinedRegular:
      "Das Tauschangebot für dein Buch {receiverBook} gegen {senderBook} wurde automatisch abgelehnt",
    resolvedOfferDeclinedGift:
      "Du hast die Geschenkanfrage auf dein Buch {receiverBook} abgelehnt",
    resolvedOfferDeclinedRegular:
      "Du hast die Tauschanfrage für dein Buch {receiverBook} gegen {senderBook} abgelehnt",
    resolvedRequestApprovedGift:
      "Deine Anfrage, das Buch {receiverBook} als Geschenk zu erhalten, wurde bestätigt",
    resolvedRequestApprovedRegular:
      "Deine Anfrage, dein Buch {senderBook} gegen {receiverBook} zu tauschen, wurde bestätigt",
    resolvedRequestAutoDeclinedGift:
      "Deine Anfrage, das Buch {receiverBook} als Geschenk zu erhalten, wurde automatisch abgelehnt",
    resolvedRequestAutoDeclinedRegular:
      "Deine Anfrage, dein Buch {senderBook} gegen {receiverBook} zu tauschen, wurde automatisch abgelehnt",
    resolvedRequestCancelledGift:
      "Du hast deine Anfrage storniert, das Buch {receiverBook} als Geschenk zu erhalten",
    resolvedRequestCancelledRegular:
      "Du hast deine Anfrage storniert, dein Buch {senderBook} gegen {receiverBook} zu tauschen",
    resolvedRequestDeclinedGift:
      "{name} hat deine Anfrage auf das Buch {receiverBook} als Geschenk abgelehnt",
    resolvedRequestDeclinedRegular:
      "{name} hat deine Anfrage abgelehnt, dein Buch {senderBook} gegen {receiverBook} zu tauschen",
    statusApproved: "Bestätigt",
    statusDeclined: "Abgelehnt",
    statusPending: "Ausstehend",
    subtitle:
      "Hier siehst du neue und bereits geöffnete Ereignisse zu Anfragen, Angeboten und deiner Tauschhistorie.",
    title: "Austausch-Updates",
    today: "Heute",
    unreadDescription: "Nur neue und noch ungelesene Updates",
    unreadLabel: "Neu",
    unknownBook: "unbekanntes Buch",
    unknownUser: "unbekannter Nutzer",
    updatesError: "Updates konnten nicht geladen werden",
    yesterday: "Gestern"
  },
  en: {
    allDescription: "All exchange updates in one feed",
    allLabel: "All",
    emptyAllDescription:
      "As soon as there are new events for your exchanges, they will appear here in one shared feed.",
    emptyAllTitle: "No exchange updates yet",
    emptyReadDescription:
      "Updates you already opened will appear here. Check back later or switch the filter.",
    emptyReadTitle: "No older updates yet",
    emptyUnreadDescription:
      "As soon as new events appear for your exchanges, they will be shown here as new updates.",
    emptyUnreadTitle: "No new updates",
    markAsRead: "Mark as read",
    markAsUnread: "Mark as unread",
    pendingOfferGift: "{name} requested your book {receiverBook} as a gift",
    pendingOfferRegular:
      "{name} offered to exchange your book {receiverBook} for {senderBook}",
    pendingRequestGift: "You requested the book {receiverBook} as a gift",
    pendingRequestRegular:
      "You offered to exchange your book {senderBook} for {receiverBook}",
    readDescription: "Only already read updates",
    readLabel: "Read",
    resolvedOfferApprovedGift:
      "You approved {name}'s gift request for your book {receiverBook}",
    resolvedOfferApprovedRegular:
      "You approved the exchange of your book {receiverBook} for {senderBook} from {name}",
    resolvedOfferCancelledGift:
      "The gift request for your book {receiverBook} was cancelled",
    resolvedOfferCancelledRegular:
      "The exchange request for your book {receiverBook} for {senderBook} was cancelled",
    resolvedOfferAutoDeclinedGift:
      "The gift request for your book {receiverBook} was declined automatically",
    resolvedOfferAutoDeclinedRegular:
      "The exchange offer for your book {receiverBook} for {senderBook} was declined automatically",
    resolvedOfferDeclinedGift:
      "You declined the gift request for your book {receiverBook}",
    resolvedOfferDeclinedRegular:
      "You declined the exchange request for your book {receiverBook} for {senderBook}",
    resolvedRequestApprovedGift:
      "Your request to receive the book {receiverBook} as a gift was approved",
    resolvedRequestApprovedRegular:
      "Your request to exchange your book {senderBook} for {receiverBook} was approved",
    resolvedRequestAutoDeclinedGift:
      "Your request to receive the book {receiverBook} as a gift was declined automatically",
    resolvedRequestAutoDeclinedRegular:
      "Your request to exchange your book {senderBook} for {receiverBook} was declined automatically",
    resolvedRequestCancelledGift:
      "You cancelled your request to receive the book {receiverBook} as a gift",
    resolvedRequestCancelledRegular:
      "You cancelled your request to exchange your book {senderBook} for {receiverBook}",
    resolvedRequestDeclinedGift:
      "{name} declined your request to receive the book {receiverBook} as a gift",
    resolvedRequestDeclinedRegular:
      "{name} declined your request to exchange your book {senderBook} for {receiverBook}",
    statusApproved: "Approved",
    statusDeclined: "Declined",
    statusPending: "Pending",
    subtitle:
      "This feed shows new and already opened events for your requests, offers, and exchange history.",
    title: "Exchange updates",
    today: "Today",
    unreadDescription: "Only new and still unread updates",
    unreadLabel: "Unread",
    unknownBook: "unknown book",
    unknownUser: "unknown user",
    updatesError: "Updates could not be loaded",
    yesterday: "Yesterday"
  },
  ru: {
    allDescription: "Все обновления по обменам в одной ленте",
    allLabel: "Все",
    emptyAllDescription:
      "Когда по вашим обменам появятся новые события, они будут показаны здесь в одной общей ленте.",
    emptyAllTitle: "Пока здесь нет обновлений по обменам",
    emptyReadDescription:
      "Здесь появятся уже открытые обновления. Можно переключить фильтр или вернуться позже.",
    emptyReadTitle: "Пока нет старых обновлений",
    emptyUnreadDescription:
      "Когда по вашим обменам появятся новые события, они будут показаны здесь как новые обновления.",
    emptyUnreadTitle: "Пока нет непрочитанных обновлений",
    markAsRead: "Отметить как прочитанное",
    markAsUnread: "Отметить как непрочитанное",
    pendingOfferGift: "Пользователь {name} запросил вашу книгу {receiverBook} в подарок",
    pendingOfferRegular:
      "Предложение от пользователя {name} на обмен вашей книги {receiverBook} на книгу {senderBook}",
    pendingRequestGift: "Вы запросили книгу {receiverBook} в подарок",
    pendingRequestRegular:
      "Вы предложили обменять свою книгу {senderBook} на книгу {receiverBook}",
    readDescription: "Только уже прочитанные обновления",
    readLabel: "Прочитанные",
    resolvedOfferApprovedGift:
      "Вы подтвердили запрос пользователя {name} на получение вашей книги {receiverBook} в подарок",
    resolvedOfferApprovedRegular:
      "Вы подтвердили обмен вашей книги {receiverBook} на книгу {senderBook} пользователя {name}",
    resolvedOfferCancelledGift:
      "Запрос на получение вашей книги {receiverBook} в подарок был отменен",
    resolvedOfferCancelledRegular:
      "Запрос на обмен вашей книги {receiverBook} на книгу {senderBook} был отменен",
    resolvedOfferAutoDeclinedGift:
      "Запрос на получение вашей книги {receiverBook} в подарок был отклонен автоматически",
    resolvedOfferAutoDeclinedRegular:
      "Предложение обменять вашу книгу {receiverBook} на книгу {senderBook} было отклонено автоматически",
    resolvedOfferDeclinedGift:
      "Вы отклонили запрос на получение вашей книги {receiverBook} в подарок",
    resolvedOfferDeclinedRegular:
      "Вы отклонили запрос на обмен вашей книги {receiverBook} на книгу {senderBook}",
    resolvedRequestApprovedGift:
      "Ваш запрос на получение книги {receiverBook} в подарок был принят",
    resolvedRequestApprovedRegular:
      "Ваш запрос на обмен вашей книги {senderBook} на книгу {receiverBook} был принят",
    resolvedRequestAutoDeclinedGift:
      "Ваш запрос на получение книги {receiverBook} в подарок был отклонён автоматически",
    resolvedRequestAutoDeclinedRegular:
      "Ваш запрос на обмен вашей книги {senderBook} на книгу {receiverBook} был отклонён автоматически",
    resolvedRequestCancelledGift:
      "Вы отменили запрос на получение книги {receiverBook} в подарок",
    resolvedRequestCancelledRegular:
      "Вы отменили запрос на обмен своей книги {senderBook} на книгу {receiverBook}",
    resolvedRequestDeclinedGift:
      "Пользователь {name} отклонил ваш запрос на получение книги {receiverBook} в подарок",
    resolvedRequestDeclinedRegular:
      "Пользователь {name} отклонил ваш запрос на обмен вашей книги {senderBook} на книгу {receiverBook}",
    statusApproved: "Подтвержден",
    statusDeclined: "Отклонен",
    statusPending: "В ожидании",
    subtitle:
      "Здесь собраны новые и уже открытые события по вашим запросам, предложениям и истории обменов.",
    title: "Обновления обменов",
    today: "Сегодня",
    unreadDescription: "Только новые и ещё непрочитанные обновления",
    unreadLabel: "Непрочитанные",
    unknownBook: "неизвестная книга",
    unknownUser: "неизвестный пользователь",
    updatesError: "Не удалось загрузить обновления",
    yesterday: "Вчера"
  }
};

const generalUpdatesText = {
  de: {
    allDescription: "Alle Updates in einer gemeinsamen Liste",
    emptyAllDescription:
      "Sobald es neue Ereignisse zu Tauschen, Büchern, Beschwerden oder deinem Konto gibt, erscheinen sie hier.",
    emptyAllTitle: "Noch keine Updates",
    emptyUnreadDescription:
      "Neue Ereignisse zu Tauschen, Büchern, Beschwerden und deinem Konto werden hier als ungelesen angezeigt.",
    subtitle:
      "Hier siehst du neue und bereits geöffnete Ereignisse zu Tauschen, Büchern, Beschwerden und deinem Konto.",
    title: "Updates"
  },
  en: {
    allDescription: "All updates in one feed",
    emptyAllDescription:
      "As soon as there are new events for exchanges, books, reports, or your account, they will appear here.",
    emptyAllTitle: "No updates yet",
    emptyUnreadDescription:
      "New events for exchanges, books, reports, and your account will appear here as unread updates.",
    subtitle:
      "This feed shows new and already opened events for exchanges, books, reports, and your account.",
    title: "Updates"
  },
  ru: {
    allDescription: "Все обновления в одной ленте",
    emptyAllDescription:
      "Когда появятся новые события по обменам, книгам, жалобам или аккаунту, они будут показаны здесь.",
    emptyAllTitle: "Пока нет обновлений",
    emptyUnreadDescription:
      "Новые события по обменам, книгам, жалобам и аккаунту будут показаны здесь как непрочитанные.",
    subtitle:
      "Здесь собраны новые и уже открытые события по обменам, книгам, жалобам и вашему аккаунту.",
    title: "Обновления"
  }
};

const systemUpdateText = {
  de: {
    adminBookDeleted: "Ein Administrator hat dein Buch {book} gelöscht",
    adminBookDeletedByYou: "Du hast das Buch {book} gelöscht",
    adminBookPhotoDeleted: "Ein Administrator hat das Foto deines Buches {book} entfernt",
    adminBookPhotoDeletedByYou: "Du hast das Foto des Buches {book} entfernt",
    adminBookRestored: "Ein Administrator hat dein Buch {book} wiederhergestellt",
    adminBookRestoredByYou: "Du hast das Buch {book} wiederhergestellt",
    adminBookUpdated: "Ein Administrator hat dein Buch {book} bearbeitet",
    adminBookUpdatedByYou: "Du hast das Buch {book} bearbeitet",
    adminRightsGranted: "Du hast Administratorrechte erhalten",
    adminRightsGrantedByYou: "Du hast {user} Administratorrechte gegeben",
    adminRightsRevoked: "Deine Administratorrechte wurden entzogen",
    adminRightsRevokedByYou: "Du hast {user} die Administratorrechte entzogen",
    adminUserBanned: "Ein Administrator hat dein Konto gesperrt",
    adminUserBannedByYou: "Du hast den Nutzer {user} gesperrt",
    adminUserDeletedByYou: "Du hast den Nutzer {user} gelöscht",
    adminUserUnbanned: "Ein Administrator hat die Sperre deines Kontos aufgehoben",
    adminUserUnbannedByYou: "Du hast die Sperre für {user} aufgehoben",
    categoryAdmin: "Admin",
    categoryUser: "Nutzer",
    categoryBook: "Buch",
    categoryReport: "Beschwerde",
    categorySecurity: "Sicherheit",
    passwordChanged: "Das Passwort deines Kontos wurde geändert",
    reportRejected: "Deine Beschwerde wurde abgelehnt",
    reportRejectedByYou: "Du hast eine Beschwerde abgelehnt",
    reportResolved: "Deine Beschwerde wurde bearbeitet",
    reportResolvedByYou: "Du hast eine Beschwerde bearbeitet",
    reportSubmitted: "Deine Beschwerde wurde zur Prüfung angenommen",
    reportSubmittedAdmin: "Eine neue Beschwerde wartet auf Prüfung",
    reportTargetBookUpdated: "Das Buch aus deiner Beschwerde {book} wurde von der Moderation bearbeitet",
    unknownBook: "unbekanntes Buch",
    unknownUser: "unbekannter Nutzer"
  },
  en: {
    adminBookDeleted: "An administrator deleted your book {book}",
    adminBookDeletedByYou: "You deleted the book {book}",
    adminBookPhotoDeleted: "An administrator removed the photo from your book {book}",
    adminBookPhotoDeletedByYou: "You removed the photo from the book {book}",
    adminBookRestored: "An administrator restored your book {book}",
    adminBookRestoredByYou: "You restored the book {book}",
    adminBookUpdated: "An administrator edited your book {book}",
    adminBookUpdatedByYou: "You edited the book {book}",
    adminRightsGranted: "You received administrator rights",
    adminRightsGrantedByYou: "You granted administrator rights to {user}",
    adminRightsRevoked: "Your administrator rights were revoked",
    adminRightsRevokedByYou: "You revoked administrator rights from {user}",
    adminUserBanned: "An administrator banned your account",
    adminUserBannedByYou: "You banned the user {user}",
    adminUserDeletedByYou: "You deleted the user {user}",
    adminUserUnbanned: "An administrator removed the ban from your account",
    adminUserUnbannedByYou: "You removed the ban from {user}",
    categoryAdmin: "Admin",
    categoryBook: "Book",
    categoryReport: "Report",
    categorySecurity: "Security",
    passwordChanged: "Your account password was changed",
    reportRejected: "Your report was rejected",
    reportRejectedByYou: "You rejected a report",
    reportResolved: "Your report was processed",
    reportResolvedByYou: "You processed a report",
    reportSubmitted: "Your report was accepted for review",
    reportSubmittedAdmin: "A new report needs review",
    reportTargetBookUpdated: "The book from your report {book} was edited by moderation",
    unknownBook: "unknown book",
    unknownUser: "unknown user"
  },
  ru: {
    adminBookDeleted: "Администратор удалил вашу книгу {book}",
    adminBookDeletedByYou: "Вы удалили книгу {book}",
    adminBookPhotoDeleted: "Администратор удалил фото вашей книги {book}",
    adminBookPhotoDeletedByYou: "Вы удалили фото книги {book}",
    adminBookRestored: "Администратор восстановил вашу книгу {book}",
    adminBookRestoredByYou: "Вы восстановили книгу {book}",
    adminBookUpdated: "Администратор отредактировал вашу книгу {book}",
    adminBookUpdatedByYou: "Вы отредактировали книгу {book}",
    adminRightsGranted: "Вам выдали права администратора",
    adminRightsGrantedByYou: "Вы выдали права администратора пользователю {user}",
    adminRightsRevoked: "Ваши права администратора были отозваны",
    adminRightsRevokedByYou: "Вы отозвали права администратора у пользователя {user}",
    adminUserBanned: "Администратор заблокировал ваш аккаунт",
    adminUserBannedByYou: "Вы заблокировали пользователя {user}",
    adminUserDeletedByYou: "Вы удалили пользователя {user}",
    adminUserUnbanned: "Администратор снял блокировку с вашего аккаунта",
    adminUserUnbannedByYou: "Вы сняли блокировку с пользователя {user}",
    categoryAdmin: "Админ",
    categoryBook: "Книга",
    categoryReport: "Жалоба",
    categoryUser: "Пользователь",
    categorySecurity: "Безопасность",
    passwordChanged: "Пароль вашего аккаунта был изменён",
    reportRejected: "Ваша жалоба была отклонена",
    reportRejectedByYou: "Вы отклонили жалобу",
    reportResolved: "Ваша жалоба была обработана",
    reportResolvedByYou: "Вы обработали жалобу",
    reportSubmitted: "Ваша жалоба принята на рассмотрение",
    reportSubmittedAdmin: "Новая жалоба ожидает проверки",
    reportTargetBookUpdated: "Книга из вашей жалобы {book} была отредактирована модератором",
    unknownBook: "неизвестная книга",
    unknownUser: "неизвестный пользователь"
  }
};

export function UpdatesPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [readState, setReadState] = useState("ALL");
  const [togglePendingId, setTogglePendingId] = useState(null);
  const [markAllPending, setMarkAllPending] = useState(false);
  const text = getUpdatesText(locale);
  const unreadSummaryQuery = useUnreadUpdatesSummaryQuery(true);
  const unreadCount = unreadSummaryQuery.data?.totalElements ?? 0;

  const updatesQuery = useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ["updates", readState],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiRequest(
        `/updates?${buildQueryString({
          pageIndex: pageParam,
          pageSize: DEFAULT_LIST_PAGE_SIZE,
          readState
        })}`,
        { auth: true }
      );

      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const nextPage = (lastPage?.number ?? 0) + 1;
      return nextPage < (lastPage?.totalPages ?? 0) ? nextPage : undefined;
    }
  });

  const items = useMemo(() => {
    const deduplicated = new Map();

    for (const page of updatesQuery.data?.pages ?? []) {
      for (const item of page?.content ?? []) {
        const key = resolveUpdateIdentity(item);

        if (!deduplicated.has(key)) {
          deduplicated.set(key, item);
        }
      }
    }

    return [...deduplicated.values()];
  }, [updatesQuery.data?.pages]);

  const loadMoreRef = useInfiniteScroll({
    enabled: !updatesQuery.isPending && !updatesQuery.error,
    hasNextPage: updatesQuery.hasNextPage,
    isFetchingNextPage: updatesQuery.isFetchingNextPage,
    onLoadMore: () => void updatesQuery.fetchNextPage()
  });

  async function updateReadState(item, nextReadState) {
    const updateId = resolveUpdateIdentity(item);
    const endpoint = isExchangeUpdate(item)
      ? `/updates/${item.exchangeId ?? item.id}/read-state`
      : `/updates/notifications/${item.notificationId ?? item.id}/read-state`;

    setTogglePendingId(updateId);

    try {
      await apiRequest(endpoint, {
        method: "PATCH",
        auth: true,
        body: {
          isRead: nextReadState
        }
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["updates"] }),
        queryClient.invalidateQueries({ queryKey: ["updates", "summary"] })
      ]);
    } finally {
      setTogglePendingId(null);
    }
  }

  async function handleToggleReadState(event, item) {
    event.preventDefault();
    event.stopPropagation();

    const nextReadState = !item.isRead;
    await updateReadState(item, nextReadState);
  }

  async function handleMarkAllAsRead() {
    if (markAllPending || unreadCount <= 0) {
      return;
    }

    setMarkAllPending(true);

    try {
      await apiRequest("/updates/read-state/all", {
        method: "PATCH",
        auth: true
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["updates"] }),
        queryClient.invalidateQueries({ queryKey: ["updates", "summary"] })
      ]);
    } finally {
      setMarkAllPending(false);
    }
  }

  function handleOpenUpdate(item) {
    if (!item.isRead && !isExchangeUpdate(item)) {
      void updateReadState(item, true);
    }

    navigate(resolveUpdateTarget(item), { state: { backTo: "/app/updates" } });
  }

  return (
    <section className="content-stack">
      <header className="section-card">
        <PageTitle icon={BellIcon}>{text.title}</PageTitle>
        <p>{text.subtitle}</p>
      </header>

      <section className="section-card exchange-tabs-card updates-tabs-card">
        <div className="exchange-detail-hero-row updates-toolbar-row">
          <div className="exchange-tabs updates-tabs" role="radiogroup">
            {UPDATE_FILTERS.map((filter) => {
              const checked = filter === readState;

              return (
                <button
                  aria-checked={checked}
                  className={checked ? "exchange-tab exchange-tab-active updates-tab" : "exchange-tab updates-tab"}
                  key={filter}
                  onClick={() => {
                    setReadState(filter);
                  }}
                  role="radio"
                  type="button"
                >
                  <span className="updates-tab-copy">
                    <span className="updates-tab-label">
                      <strong>{resolveFilterLabel(text, filter)}</strong>
                      {filter === "UNREAD" && unreadCount > 0 ? (
                        <span className="updates-tab-badge">{unreadCount}</span>
                      ) : null}
                    </span>
                    <small>{resolveFilterDescription(text, filter)}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <button
            className="button button-secondary button-compact"
            disabled={markAllPending || unreadCount <= 0}
            onClick={() => void handleMarkAllAsRead()}
            type="button"
          >
            <MarkReadIcon />
            <span>{rt(locale, "Mark all as read")}</span>
          </button>
        </div>
      </section>

      {updatesQuery.isPending ? <LoadingBlock label={resolveLoadingLabel(text, readState)} /> : null}
      {updatesQuery.error ? <ErrorBlock error={updatesQuery.error} title={text.updatesError} /> : null}

      {!updatesQuery.isPending && !updatesQuery.error && items.length === 0 ? (
        <EmptyBlock
          description={resolveEmptyDescription(text, readState)}
          title={resolveEmptyTitle(text, readState)}
        />
      ) : null}

      {items.length > 0 ? (
        <section className="list-stack">
          {items.map((item) => {
            const updateId = resolveUpdateIdentity(item);
            const isRead = Boolean(item.isRead);

            return (
              <article
                className={
                  isRead
                    ? "section-card compact-card update-card-article update-card-article-read"
                    : "section-card compact-card update-card-article update-card-article-unread"
                }
                key={updateId}
                onClick={() => handleOpenUpdate(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleOpenUpdate(item);
                  }
                }}
                role="link"
                tabIndex={0}
              >
                <div className="update-card-layout">
                  <div className="update-card-state">
                    <button
                      aria-label={isRead ? text.markAsUnread : text.markAsRead}
                      className={
                        isRead
                          ? "update-card-state-toggle update-card-state-toggle-read"
                          : "update-card-state-toggle update-card-state-toggle-unread"
                      }
                      disabled={togglePendingId === updateId}
                      onClick={(event) => void handleToggleReadState(event, item)}
                      title={isRead ? text.markAsUnread : text.markAsRead}
                      type="button"
                    >
                      {isRead ? <EnvelopeOpenIcon /> : <EnvelopeClosedIcon />}
                    </button>
                    {!isRead ? <span aria-hidden="true" className="update-card-state-dot" /> : null}
                  </div>

                  <div className="update-card-content">
                      <div className="update-card-head">
                        <div className="update-card-copy">
                          <h2>{renderUpdateHeadline(locale, item)}</h2>
                        </div>

                        <div className="update-card-preview-row">
                          <UpdatePreview item={item} locale={locale} />
                        </div>

                      <div className="update-card-head-side">
                        <span className={`status-pill ${getUpdateStatusClassName(item)}`}>
                          {formatUpdateStatusLabel(locale, item)}
                        </span>
                        <span className="update-card-timestamp" title={formatDateTime(item.updateCreatedAt)}>
                          {formatUpdateTimestamp(locale, item.updateCreatedAt)}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              </article>
            );
          })}

          {updatesQuery.hasNextPage ? (
            <div aria-hidden="true" className="infinite-scroll-sentinel" ref={loadMoreRef} />
          ) : null}
          {updatesQuery.isFetchingNextPage ? (
            <LoadingBlock label={rt(locale, "Loading more updates")} />
          ) : null}
        </section>
      ) : null}
    </section>
  );
}

function UpdatePreview({ item, locale }) {
  if (isExchangeUpdate(item)) {
    return <UpdatePreviewPair item={item} locale={locale} />;
  }

  return <SystemUpdatePreview item={item} locale={locale} />;
}

function SystemUpdatePreview({ item, locale }) {
  const text = getSystemUpdateText(locale);
  const reportTargetType = item.reportTargetType || item.targetType || null;
  const hasUserReportTarget =
    reportTargetType === "USER" ||
    (String(item.updateType || "").startsWith("REPORT_") &&
      (item.targetUserNickname !== undefined || item.targetUserPhotoUrl !== undefined));

  if (hasUserReportTarget) {
    return (
      <UserAvatar
        className="system-update-user-avatar"
        name={item.targetUserNickname || text.unknownUser}
        photoUrl={item.targetUserPhotoUrl || ""}
        size="md"
      />
    );
  }

  if (item.book) {
    return (
      <div className="book-cover-with-badge">
        {item.book.isGift ? (
          <span className="gift-icon-badge gift-icon-badge-small book-cover-corner-badge">
            <GiftIcon />
          </span>
        ) : null}
        <BookCover photoUrl={item.book.photoUrl} size="sm" title={resolveBookName(locale, item.book)} />
      </div>
    );
  }

  if (String(item.updateType || "").includes("USER_DELETED")) {
    return (
      <span aria-hidden="true" className="system-update-preview system-update-preview-danger">
        <DeletedUserIcon />
      </span>
    );
  }

  if (item.targetUserNickname || item.targetUserPhotoUrl) {
    return (
      <UserAvatar
        className="system-update-user-avatar"
        name={item.targetUserNickname || text.unknownUser}
        photoUrl={item.targetUserPhotoUrl}
        size="md"
      />
    );
  }

  const Icon = resolveSystemUpdateIcon(item.updateType);

  return (
    <span aria-hidden="true" className={`system-update-preview ${resolveSystemUpdateToneClass(item.updateType)}`}>
      <Icon />
    </span>
  );
}

function UpdatePreviewPair({ item, locale }) {
  const senderBook = resolveSenderBook(item);
  const receiverBook = resolveReceiverBook(item);
  const isGift = isGiftUpdate(item);

  if (isGift) {
    return (
      <div className="exchange-preview-pair">
        <span aria-hidden="true" className="request-gift-illustration request-gift-illustration-sm update-request-gift-illustration">
          <RequestGiftIcon />
        </span>
        <span aria-hidden="true" className="exchange-preview-swap-icon">
          <SwapIcon />
        </span>
        <div className="book-cover-with-badge">
          {receiverBook?.isGift ? (
            <span className="gift-icon-badge gift-icon-badge-small book-cover-corner-badge">
              <GiftIcon />
            </span>
          ) : null}
          <BookCover photoUrl={receiverBook?.photoUrl} size="sm" title={resolveBookName(locale, receiverBook)} />
        </div>
      </div>
    );
  }

  return (
    <div className="exchange-preview-pair">
      <BookCover photoUrl={senderBook?.photoUrl} size="sm" title={resolveBookName(locale, senderBook)} />
      <span aria-hidden="true" className="exchange-preview-swap-icon">
        <SwapIcon />
      </span>
      <div className="book-cover-with-badge">
        {receiverBook?.isGift ? (
          <span className="gift-icon-badge gift-icon-badge-small book-cover-corner-badge">
            <GiftIcon />
          </span>
        ) : null}
        <BookCover photoUrl={receiverBook?.photoUrl} size="sm" title={resolveBookName(locale, receiverBook)} />
      </div>
    </div>
  );
}

function resolveUpdateTarget(item) {
  if (!isExchangeUpdate(item)) {
    return item.targetUrl || resolveSystemUpdateFallbackTarget(item.updateType);
  }

  const exchangeId = item.exchangeId ?? item.id;

  if (item.status === "PENDING") {
    return item.userExchangeRole === "RECEIVER"
      ? `/app/exchanges/offers/${exchangeId}`
      : `/app/exchanges/requests/${exchangeId}`;
  }

  return `/app/history/${exchangeId}`;
}

function renderUpdateHeadline(locale, item) {
  if (!isExchangeUpdate(item)) {
    return renderSystemUpdateHeadline(locale, item);
  }

  const text = getUpdatesText(locale);
  const name = item.otherUserNickname || item.declinerUserNickname || text.unknownUser;
    const senderBook = resolveBookName(locale, resolveSenderBook(item));
    const receiverBook = resolveBookName(locale, resolveReceiverBook(item));
    const isGift = isGiftUpdate(item);
    const isCancelledBySender = item.status === "DECLINED" && item.declinerUserRole === "SENDER";
    const isAutoDeclinedForSender = item.status === "DECLINED" && item.userExchangeRole === "SENDER" && item.autoDeclined;
    const isAutoDeclinedForReceiver = item.status === "DECLINED" && item.userExchangeRole === "RECEIVER" && item.autoDeclined;
    const hasExplicitAutoDecliner = isAutoDeclinedForSender && Boolean(item.declinerUserNickname);

  if (item.status === "PENDING") {
    if (item.userExchangeRole === "RECEIVER") {
      return renderTemplateElement(
        isGift ? text.pendingOfferGift : text.pendingOfferRegular,
        { name, receiverBook, senderBook }
      );
    }

    return renderTemplateElement(
      isGift ? text.pendingRequestGift : text.pendingRequestRegular,
      { receiverBook, senderBook }
    );
  }

  if (item.userExchangeRole === "RECEIVER") {
    if (item.status === "APPROVED") {
      return renderTemplateElement(
        isGift ? text.resolvedOfferApprovedGift : text.resolvedOfferApprovedRegular,
        { name, receiverBook, senderBook }
      );
    }

    return renderTemplateElement(
      isGift
        ? isAutoDeclinedForReceiver
          ? text.resolvedOfferAutoDeclinedGift
          : isCancelledBySender
          ? text.resolvedOfferCancelledGift
          : text.resolvedOfferDeclinedGift
        : isAutoDeclinedForReceiver
          ? text.resolvedOfferAutoDeclinedRegular
          : isCancelledBySender
          ? text.resolvedOfferCancelledRegular
          : text.resolvedOfferDeclinedRegular,
      { name, receiverBook, senderBook }
    );
  }

  if (item.status === "APPROVED") {
    return renderTemplateElement(
      isGift ? text.resolvedRequestApprovedGift : text.resolvedRequestApprovedRegular,
      { receiverBook, senderBook }
    );
  }

    return renderTemplateElement(
      isGift
        ? isAutoDeclinedForSender && !hasExplicitAutoDecliner
          ? text.resolvedRequestAutoDeclinedGift
          : isCancelledBySender
          ? text.resolvedRequestCancelledGift
          : text.resolvedRequestDeclinedGift
        : isAutoDeclinedForSender && !hasExplicitAutoDecliner
          ? text.resolvedRequestAutoDeclinedRegular
          : isCancelledBySender
          ? text.resolvedRequestCancelledRegular
        : text.resolvedRequestDeclinedRegular,
    { name, receiverBook, senderBook }
  );
}

function renderSystemUpdateHeadline(locale, item) {
  const text = getSystemUpdateText(locale);
  const book = resolveBookName(locale, item.book);
  const user = item.targetUserNickname || text.unknownUser;
  const templates = {
    ADMIN_BOOK_UPDATED: text.adminBookUpdated,
    ADMIN_BOOK_UPDATED_BY_YOU: text.adminBookUpdatedByYou,
    ADMIN_BOOK_PHOTO_DELETED: text.adminBookPhotoDeleted,
    ADMIN_BOOK_PHOTO_DELETED_BY_YOU: text.adminBookPhotoDeletedByYou,
    ADMIN_BOOK_DELETED: text.adminBookDeleted,
    ADMIN_BOOK_DELETED_BY_YOU: text.adminBookDeletedByYou,
    ADMIN_BOOK_RESTORED: text.adminBookRestored,
    ADMIN_BOOK_RESTORED_BY_YOU: text.adminBookRestoredByYou,
    ADMIN_RIGHTS_GRANTED: text.adminRightsGranted,
    ADMIN_RIGHTS_REVOKED: text.adminRightsRevoked,
    ADMIN_RIGHTS_GRANTED_BY_YOU: text.adminRightsGrantedByYou,
    ADMIN_RIGHTS_REVOKED_BY_YOU: text.adminRightsRevokedByYou,
    ADMIN_USER_BANNED: text.adminUserBanned,
    ADMIN_USER_UNBANNED: text.adminUserUnbanned,
    ADMIN_USER_BANNED_BY_YOU: text.adminUserBannedByYou,
    ADMIN_USER_UNBANNED_BY_YOU: text.adminUserUnbannedByYou,
    ADMIN_USER_DELETED_BY_YOU: text.adminUserDeletedByYou,
    REPORT_SUBMITTED: text.reportSubmitted,
    REPORT_SUBMITTED_ADMIN: text.reportSubmittedAdmin,
    REPORT_RESOLVED: text.reportResolved,
    REPORT_RESOLVED_BY_YOU: text.reportResolvedByYou,
    REPORT_REJECTED: text.reportRejected,
    REPORT_REJECTED_BY_YOU: text.reportRejectedByYou,
    REPORT_TARGET_BOOK_UPDATED: text.reportTargetBookUpdated,
    PASSWORD_CHANGED: text.passwordChanged
  };

  return renderTemplateElement(templates[item.updateType] || text.passwordChanged, { book, user });
}

function renderTemplateElement(template, params) {
  const parts = String(template).split(/(\{[a-zA-Z]+\})/g).filter(Boolean);

  return parts.map((part, index) => {
    const match = part.match(/^\{(.+)\}$/);

    if (!match) {
      return <span key={`${part}-${index}`}>{part}</span>;
    }

    return <strong key={`${match[1]}-${index}`}>{params[match[1]] ?? ""}</strong>;
  });
}

function resolveSenderBook(item) {
  return item.senderBook ?? null;
}

function resolveReceiverBook(item) {
  return item.receiverBook ?? null;
}

function isExchangeUpdate(item) {
  return !item.updateType || item.updateType === "EXCHANGE";
}

function resolveUpdateIdentity(item) {
  return isExchangeUpdate(item)
    ? `exchange-${item.exchangeId ?? item.id}`
    : `notification-${item.notificationId ?? item.id}`;
}

function resolveSystemUpdateFallbackTarget(updateType) {
  if (updateType === "REPORT_SUBMITTED_ADMIN") {
    return "/admin/reports";
  }

  if (String(updateType || "").startsWith("REPORT_")) {
    return "/app/my-reports";
  }

  if (String(updateType || "").startsWith("ADMIN_BOOK_")) {
    return "/app/my-books";
  }

  return "/app/profile";
}

function resolveBookName(locale, book) {
  const text = getUpdatesText(locale);
  return book?.name || text.unknownBook;
}

function isGiftUpdate(item) {
  return !item.senderBook && Boolean(item.receiverBook?.isGift);
}

function formatUpdateStatusLabel(locale, item) {
  if (!isExchangeUpdate(item)) {
    const text = getSystemUpdateText(locale);
    const type = item.updateType || "";

    if (type.startsWith("ADMIN_BOOK_")) {
      return text.categoryBook;
    }

    if (type.startsWith("REPORT_")) {
      return text.categoryReport;
    }

    if (type.startsWith("ADMIN_USER_")) {
      return text.categoryUser;
    }

    if (type.startsWith("ADMIN_RIGHTS_")) {
      return text.categoryAdmin;
    }

    return text.categorySecurity;
  }

  const text = getUpdatesText(locale);
  const status = item.status;

  if (status === "APPROVED") {
    return text.statusApproved;
  }

  if (status === "DECLINED") {
    return text.statusDeclined;
  }

  return text.statusPending;
}

function getUpdateStatusClassName(item) {
  if (!isExchangeUpdate(item)) {
    const type = item.updateType || "";

    if (
      type === "ADMIN_USER_BANNED" ||
      type === "ADMIN_USER_BANNED_BY_YOU" ||
      type.includes("DELETED") ||
      type.includes("REVOKED") ||
      type === "REPORT_REJECTED" ||
      type === "REPORT_REJECTED_BY_YOU"
    ) {
      return "status-pill-danger";
    }

    if (
      type === "REPORT_SUBMITTED" ||
      type === "REPORT_SUBMITTED_ADMIN" ||
      type === "ADMIN_BOOK_PHOTO_DELETED" ||
      type === "ADMIN_BOOK_PHOTO_DELETED_BY_YOU"
    ) {
      return "status-pill-warning";
    }

    return "status-pill-success";
  }

  const status = item.status;

  if (status === "APPROVED") {
    return "status-pill-success";
  }

  if (status === "DECLINED") {
    return "status-pill-danger";
  }

  return "status-pill-warning";
}

function resolveFilterLabel(text, readState) {
  if (readState === "UNREAD") {
    return text.unreadLabel;
  }

  if (readState === "READ") {
    return text.readLabel;
  }

  return text.allLabel;
}

function resolveFilterDescription(text, readState) {
  if (readState === "UNREAD") {
    return text.unreadDescription;
  }

  if (readState === "READ") {
    return text.readDescription;
  }

  return text.allDescription;
}

function resolveLoadingLabel(text, readState) {
  if (readState === "UNREAD") {
    return text.emptyUnreadTitle;
  }

  if (readState === "READ") {
    return text.emptyReadTitle;
  }

  return text.emptyAllTitle;
}

function resolveEmptyTitle(text, readState) {
  if (readState === "UNREAD") {
    return text.emptyUnreadTitle;
  }

  if (readState === "READ") {
    return text.emptyReadTitle;
  }

  return text.emptyAllTitle;
}

function resolveEmptyDescription(text, readState) {
  if (readState === "UNREAD") {
    return text.emptyUnreadDescription;
  }

  if (readState === "READ") {
    return text.emptyReadDescription;
  }

  return text.emptyAllDescription;
}

function resolveSystemUpdateIcon(updateType) {
  const icons = {
    ADMIN_BOOK_UPDATED: PencilIcon,
    ADMIN_BOOK_UPDATED_BY_YOU: PencilIcon,
    ADMIN_BOOK_PHOTO_DELETED: PencilIcon,
    ADMIN_BOOK_PHOTO_DELETED_BY_YOU: PencilIcon,
    ADMIN_BOOK_DELETED: TrashIcon,
    ADMIN_BOOK_DELETED_BY_YOU: TrashIcon,
    ADMIN_BOOK_RESTORED: RestoreIcon,
    ADMIN_BOOK_RESTORED_BY_YOU: RestoreIcon,
    ADMIN_RIGHTS_GRANTED: AdminGrantedIcon,
    ADMIN_RIGHTS_REVOKED: AdminRevokedIcon,
    ADMIN_RIGHTS_GRANTED_BY_YOU: AdminGrantedIcon,
    ADMIN_RIGHTS_REVOKED_BY_YOU: AdminRevokedIcon,
    ADMIN_USER_BANNED: UserBlockedIcon,
    ADMIN_USER_UNBANNED: UserRestoredIcon,
    ADMIN_USER_BANNED_BY_YOU: UserBlockedIcon,
    ADMIN_USER_UNBANNED_BY_YOU: UserRestoredIcon,
    ADMIN_USER_DELETED_BY_YOU: DeletedUserIcon,
    REPORT_SUBMITTED: FlagIcon,
    REPORT_SUBMITTED_ADMIN: FlagIcon,
    REPORT_RESOLVED: CheckIcon,
    REPORT_RESOLVED_BY_YOU: CheckIcon,
    REPORT_REJECTED: XIcon,
    REPORT_REJECTED_BY_YOU: XIcon,
    REPORT_TARGET_BOOK_UPDATED: PencilIcon,
    PASSWORD_CHANGED: BellIcon
  };

  return icons[updateType] || BookIcon;
}

function resolveSystemUpdateToneClass(updateType) {
  if (String(updateType || "").includes("UNBANNED")) {
    return "system-update-preview-success";
  }

  if (
    updateType === "ADMIN_USER_BANNED" ||
    updateType === "ADMIN_USER_BANNED_BY_YOU" ||
    String(updateType || "").includes("DELETED") ||
    String(updateType || "").includes("REVOKED") ||
    updateType === "REPORT_REJECTED" ||
    updateType === "REPORT_REJECTED_BY_YOU"
  ) {
    return "system-update-preview-danger";
  }

  if (
    updateType === "REPORT_SUBMITTED" ||
    updateType === "REPORT_SUBMITTED_ADMIN" ||
    updateType === "ADMIN_BOOK_PHOTO_DELETED" ||
    updateType === "ADMIN_BOOK_PHOTO_DELETED_BY_YOU"
  ) {
    return "system-update-preview-warning";
  }

  return "system-update-preview-success";
}

function formatUpdateTimestamp(locale, value) {
  const text = getUpdatesText(locale);

  if (!value) {
    return rt(locale, "Not available");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const now = new Date();

  if (isSameCalendarDay(now, date)) {
    return `${text.today}, ${formatTime(locale, date)}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameCalendarDay(yesterday, date)) {
    return `${text.yesterday}, ${formatTime(locale, date)}`;
  }

  const dateLabel = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    ...(now.getFullYear() !== date.getFullYear() ? { year: "numeric" } : {})
  }).format(date);

  return `${dateLabel}, ${formatTime(locale, date)}`;
}

function formatTime(locale, date) {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function isSameCalendarDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getUpdatesText(locale) {
  return {
    ...(updatesText[locale] ?? updatesText.en),
    ...(generalUpdatesText[locale] ?? generalUpdatesText.en)
  };
}

function getSystemUpdateText(locale) {
  return systemUpdateText[locale] ?? systemUpdateText.en;
}
