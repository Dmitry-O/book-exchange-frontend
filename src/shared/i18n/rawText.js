import { EXTRA_RAW_TEXT } from "./rawTextExtra";

export function rt(locale, text) {
  const labels = EXTRA_RAW_TEXT[text] ?? RAW_TEXT[text];

  if (!labels) {
    return text;
  }

  return labels[locale] ?? labels.en ?? text;
}

export function rtf(locale, text, params = {}) {
  return rt(locale, text).replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ""));
}

const RAW_TEXT = {
  "About this book": {
    de: "Über dieses Buch",
    en: "About this book",
    ru: "Об этой книге"
  },
  "Account profile": {
    de: "Kontoprofil",
    en: "Account profile",
    ru: "Профиль аккаунта"
  },
  "Add a book": {
    de: "Buch hinzufügen",
    en: "Add a book",
    ru: "Добавить книгу"
  },
  "Add new book": {
    de: "Neues Buch hinzufügen",
    en: "Add new book",
    ru: "Добавить новую книгу"
  },
  "Add your first book so other users can notice it and offer an exchange.": {
    de: "Füge dein erstes Buch hinzu, damit andere Nutzer es sehen und einen Tausch anbieten können.",
    en: "Add your first book so other users can notice it and offer an exchange.",
    ru: "Добавьте свою первую книгу, чтобы другие пользователи могли заметить её и предложить обмен."
  },
  "Add the main details about your book and make it ready for the catalog.": {
    de: "Füge die wichtigsten Angaben zu deinem Buch hinzu und bereite es für den Katalog vor.",
    en: "Add the main details about your book and make it ready for the catalog.",
    ru: "Добавьте основные данные о книге и подготовьте её для каталога."
  },
  "Approve offer": {
    de: "Angebot annehmen",
    en: "Approve offer",
    ru: "Принять предложение"
  },
  "Approve this offer and mark the books as exchanged?": {
    de: "Dieses Angebot annehmen und die Bücher als getauscht markieren?",
    en: "Approve this offer and mark the books as exchanged?",
    ru: "Принять это предложение и пометить книги как обменённые?"
  },
  "Accept this offer and automatically decline all other possible offers related to this book?": {
    de: "Dieses Angebot annehmen und alle anderen möglichen Angebote für dieses Buch automatisch ablehnen?",
    en: "Accept this offer and automatically decline all other possible offers related to this book?",
    ru: "Принять это предложение и отклонить все другие возможные предложения связанные с этой книгой?"
  },
  "Book could not be loaded": {
    de: "Buch konnte nicht geladen werden",
    en: "Book could not be loaded",
    ru: "Не удалось загрузить книгу"
  },
  "Book could not be loaded for editing": {
    de: "Buch konnte nicht zum Bearbeiten geladen werden",
    en: "Book could not be loaded for editing",
    ru: "Не удалось загрузить книгу для редактирования"
  },
  "Book deletion failed": {
    de: "Buchlöschung fehlgeschlagen",
    en: "Book deletion failed",
    ru: "Не удалось удалить книгу"
  },
  "Book details": {
    de: "Buchdetails",
    en: "Book details",
    ru: "Детали книги"
  },
  "Book details could not be loaded": {
    de: "Buchdetails konnten nicht geladen werden",
    en: "Book details could not be loaded",
    ru: "Не удалось загрузить детали книги"
  },
  "Book photo": {
    de: "Buchfoto",
    en: "Book photo",
    ru: "Фото книги"
  },
  "Books could not be loaded": {
    de: "Bücher konnten nicht geladen werden",
    en: "Books could not be loaded",
    ru: "Не удалось загрузить книги"
  },
  "Choose one target above to continue.": {
    de: "Wähle oben ein Ziel aus, um fortzufahren.",
    en: "Choose one target above to continue.",
    ru: "Выберите цель выше, чтобы продолжить."
  },
  "Comment": {
    de: "Комментарий",
    en: "Comment",
    ru: "Комментарий"
  },
  "Contact details": {
    de: "Kontaktdaten",
    en: "Contact details",
    ru: "Контактные данные"
  },
  "Create a request from any public book page after selecting one of your own books.": {
    de: "Erstelle eine Anfrage auf einer öffentlichen Buchseite, nachdem du eines deiner eigenen Bücher ausgewählt hast.",
    en: "Create a request from any public book page after selecting one of your own books.",
    ru: "Создайте запрос на обмен с публичной страницы книги, выбрав одну из своих книг."
  },
  "Create book": {
    de: "Buch erstellen",
    en: "Create book",
    ru: "Создать книгу"
  },
  "Decline offer": {
    de: "Angebot ablehnen",
    en: "Decline offer",
    ru: "Отклонить предложение"
  },
  "Decline request": {
    de: "Anfrage abbrechen",
    en: "Cancel request",
    ru: "Отменить запрос"
  },
  "Decline this offer?": {
    de: "Dieses Angebot ablehnen?",
    en: "Decline this offer?",
    ru: "Отклонить это предложение?"
  },
  "Decline this request?": {
    de: "Diese Anfrage ablehnen?",
    en: "Decline this request?",
    ru: "Отклонить этот запрос?"
  },
  "Delete": {
    de: "Löschen",
    en: "Delete",
    ru: "Удалить"
  },
  "Delete \"{name}\" from your books?": {
    de: "\"{name}\" aus deinen Büchern löschen?",
    en: "Delete \"{name}\" from your books?",
    ru: "Удалить «{name}» из ваших книг?"
  },
  "Delete \"{name}\" from your books? Any active exchange requests related to this book will be cancelled automatically.": {
    de: "\"{name}\" aus deinen Büchern löschen? Alle aktiven Tauschanfragen zu diesem Buch werden automatisch storniert.",
    en: "Delete \"{name}\" from your books? Any active exchange requests related to this book will be cancelled automatically.",
    ru: "Удалить «{name}» из ваших книг? Все активные запросы на обмен, связанные с этой книгой, будут автоматически отменены."
  },
  "Delete request failed": {
    de: "Löschanfrage fehlgeschlagen",
    en: "Delete request failed",
    ru: "Ошибка при удалении"
  },
  "Delete the saved photo for this book?": {
    de: "Gespeichertes Foto dieses Buchs löschen?",
    en: "Delete the saved photo for this book?",
    ru: "Удалить сохранённое фото этой книги?"
  },
  "Describe what happened and why this should be reviewed": {
    de: "Beschreibe, was passiert ist und warum dies geprüft werden sollte",
    en: "Describe what happened and why this should be reviewed",
    ru: "Опишите, что произошло и почему это нужно проверить"
  },
  "Edit": {
    de: "Bearbeiten",
    en: "Edit",
    ru: "Изменить"
  },
  "Edit \"{name}\"": {
    de: "\"{name}\" bearbeiten",
    en: "Edit \"{name}\"",
    ru: "Редактировать «{name}»"
  },
  "Exchanged": {
    de: "Getauscht",
    en: "Exchanged",
    ru: "Обменена"
  },
  "Exchanged books": {
    de: "Getauschte Bücher",
    en: "Exchanged books",
    ru: "Обменянные книги"
  },
  "Exchanged books could not be loaded": {
    de: "Getauschte Bücher konnten nicht geladen werden",
    en: "Exchanged books could not be loaded",
    ru: "Не удалось загрузить обменянные книги"
  },
  "Exchange": {
    de: "Tausch",
    en: "Exchange",
    ru: "Обмен"
  },
  "Exchange history could not be loaded": {
    de: "Tauschverlauf konnte nicht geladen werden",
    en: "Exchange history could not be loaded",
    ru: "Не удалось загрузить историю обменов"
  },
  "Exchange notifications": {
    de: "Tauschbenachrichtigungen",
    en: "Exchange notifications",
    ru: "Уведомления об обменах"
  },
  "Exchange history details could not be loaded": {
    de: "Details des Tauschverlaufs konnten nicht geladen werden",
    en: "Exchange history details could not be loaded",
    ru: "Не удалось загрузить детали истории обмена"
  },
  "Exchange action failed": {
    de: "Tauschaktion fehlgeschlagen",
    en: "Exchange action failed",
    ru: "Не удалось выполнить действие с обменом"
  },
  "Exchange #{id}": {
    de: "Tausch #{id}",
    en: "Exchange #{id}",
    ru: "Обмен #{id}"
  },
  "Gift": {
    de: "Подарок",
    en: "Gift",
    ru: "Подарок"
  },
  "Gift mode": {
    de: "Als Geschenk abgeben",
    en: "Give as gift",
    ru: "Отдать в подарок"
  },
  "History": {
    de: "Verlauf",
    en: "History",
    ru: "История"
  },
  "Loading book details": {
    de: "Buchdetails werden geladen",
    en: "Loading book details",
    ru: "Загрузка деталей книги"
  },
  "Loading editable book data": {
    de: "Bearbeitbare Buchdaten werden geladen",
    en: "Loading editable book data",
    ru: "Загрузка данных книги для редактирования"
  },
  "Loading exchanged books": {
    de: "Getauschte Bücher werden geladen",
    en: "Loading exchanged books",
    ru: "Загрузка обменянных книг"
  },
  "Loading exchange history": {
    de: "Tauschverlauf wird geladen",
    en: "Loading exchange history",
    ru: "Загрузка истории обменов"
  },
  "Loading reports": {
    de: "Meldungen werden geladen",
    en: "Loading reports",
    ru: "Загрузка жалоб"
  },
  "Loading unread updates": {
    de: "Ungelesene Updates werden geladen",
    en: "Loading unread updates",
    ru: "Загрузка непрочитанных обновлений"
  },
  "Loading your books": {
    de: "Deine Bücher werden geladen",
    en: "Loading your books",
    ru: "Загрузка ваших книг"
  },
  "Loading your offers": {
    de: "Deine Angebote werden geladen",
    en: "Loading your offers",
    ru: "Загрузка ваших предложений"
  },
  "Loading your requests": {
    de: "Deine Anfragen werden geladen",
    en: "Loading your requests",
    ru: "Загрузка ваших запросов"
  },
  "Loading more updates": {
    de: "Weitere Updates werden geladen",
    en: "Loading more updates",
    ru: "Загружаем ещё обновления"
  },
  "Manage your inventory": {
    de: "Verwalte deinen Bestand",
    en: "Manage your inventory",
    ru: "Управляйте своими книгами"
  },
  "Mark all as read": {
    de: "Alles als gelesen markieren",
    en: "Mark all as read",
    ru: "Отметить всё как прочитанное"
  },
  "Keep your active books updated and ready for exchanges.": {
    de: "Halte deine aktiven Bücher aktuell und bereit für Tauschaktionen.",
    en: "Keep your active books updated and ready for exchanges.",
    ru: "Поддерживайте активные книги в актуальном состоянии и готовности к обмену."
  },
  "Moderation report": {
    de: "Moderationsmeldung",
    en: "Moderation report",
    ru: "Жалоба на модерацию"
  },
  "My reports": {
    de: "Meine Meldungen",
    en: "My reports",
    ru: "Мои жалобы"
  },
  "No active books available": {
    de: "Keine aktiven Bücher verfügbar",
    en: "No active books available",
    ru: "Нет доступных активных книг"
  },
  "No active offers": {
    de: "Keine aktiven Angebote",
    en: "No active offers",
    ru: "Нет активных предложений"
  },
  "No active requests": {
    de: "Keine aktiven Anfragen",
    en: "No active requests",
    ru: "Нет активных запросов"
  },
  "No city": {
    de: "Keine Stadt",
    en: "No city",
    ru: "Без города"
  },
  "No description provided.": {
    de: "Keine Beschreibung angegeben.",
    en: "No description provided.",
    ru: "Описание не указано."
  },
  "No description stored for this book.": {
    de: "Für dieses Buch ist keine Beschreibung gespeichert.",
    en: "No description stored for this book.",
    ru: "Для этой книги нет сохранённого описания."
  },
  "No public description available for this book.": {
    de: "Für dieses Buch ist keine öffentliche Beschreibung verfügbar.",
    en: "No public description available for this book.",
    ru: "Для этой книги нет публичного описания."
  },
  "No reports created yet": {
    de: "Noch keine Meldungen erstellt",
    en: "No reports created yet",
    ru: "Жалоб пока нет"
  },
  "No resolved exchanges yet": {
    de: "Noch keine abgeschlossenen Tausche",
    en: "No resolved exchanges yet",
    ru: "Пока нет завершённых обменов"
  },
  "No unread exchange updates": {
    de: "Keine ungelesenen Tauschupdates",
    en: "No unread exchange updates",
    ru: "Нет непрочитанных обновлений обменов"
  },
  "No exchanged books yet": {
    de: "Noch keine getauschten Bücher",
    en: "No exchanged books yet",
    ru: "Пока нет обменянных книг"
  },
  "No reports could be loaded": {
    de: "Meldungen konnten nicht geladen werden",
    en: "No reports could be loaded",
    ru: "Не удалось загрузить жалобы"
  },
  "No changes to save yet.": {
    de: "Es gibt noch keine Änderungen zum Speichern.",
    en: "No changes to save yet.",
    ru: "Изменений для сохранения пока нет."
  },
  "No public description has been added for this book yet.": {
    de: "Für dieses Buch wurde noch keine öffentliche Beschreibung hinzugefügt.",
    en: "No public description has been added for this book yet.",
    ru: "Для этой книги ещё не добавлено публичное описание."
  },
  "No reports match these filters": {
    de: "Keine Meldungen passen zu diesen Filtern",
    en: "No reports match these filters",
    ru: "По этим фильтрам жалобы не найдены"
  },
  "Not provided": {
    de: "Nicht angegeben",
    en: "Not provided",
    ru: "Не указано"
  },
  "Offers waiting for your decision": {
    de: "Angebote, die auf deine Entscheidung warten",
    en: "Offers waiting for your decision",
    ru: "Предложения, ожидающие вашего решения"
  },
  "Open details": {
    de: "Details öffnen",
    en: "Open details",
    ru: "Открыть детали"
  },
  "Open my reports": {
    de: "Meine Meldungen öffnen",
    en: "Open my reports",
    ru: "Открыть мои жалобы"
  },
  "Open owner view": {
    de: "Besitzeransicht öffnen",
    en: "Open owner view",
    ru: "Открыть владелецкую страницу"
  },
  "Open report dialog": {
    de: "Meldedialog öffnen",
    en: "Open report dialog",
    ru: "Открыть окно жалобы"
  },
  "Open reported book": {
    de: "Gemeldetes Buch öffnen",
    en: "Open reported book",
    ru: "Открыть книгу из жалобы"
  },
  "Other user": {
    de: "Anderer Benutzer",
    en: "Other user",
    ru: "Другой пользователь"
  },
  "Pending offer": {
    de: "Offenes Angebot",
    en: "Pending offer",
    ru: "Ожидающее предложение"
  },
  "Pending request": {
    de: "Offene Anfrage",
    en: "Pending request",
    ru: "Ожидающий запрос"
  },
  "Publication year": {
    de: "Erscheinungsjahr",
    en: "Publication year",
    ru: "Год публикации"
  },
  "Reason": {
    de: "Причина",
    en: "Reason",
    ru: "Причина"
  },
  "Read": {
    de: "Gelesen",
    en: "Read",
    ru: "Прочитано"
  },
  "Register": {
    de: "Registrieren",
    en: "Register",
    ru: "Регистрация"
  },
  "Reporting": {
    de: "Melden",
    en: "Reporting",
    ru: "Жалобы"
  },
  "Requests you sent": {
    de: "Von dir gesendete Anfragen",
    en: "Requests you sent",
    ru: "Отправленные вами запросы"
  },
  "Reports could not be loaded": {
    de: "Meldungen konnten nicht geladen werden",
    en: "Reports could not be loaded",
    ru: "Не удалось загрузить жалобы"
  },
  "Resolved exchanges": {
    de: "Tauschverlauf",
    en: "Exchange history",
    ru: "История обменов"
  },
  "Role": {
    de: "Rolle",
    en: "Role",
    ru: "Роль"
  },
  "Save changes": {
    de: "Änderungen speichern",
    en: "Save changes",
    ru: "Сохранить изменения"
  },
  "Soft-delete this book from the moderation console? Any active exchange requests related to this book will be cancelled automatically.": {
    de: "Dieses Buch in der Moderationsansicht weich löschen? Alle aktiven Tauschanfragen zu diesem Buch werden automatisch storniert.",
    en: "Soft-delete this book from the moderation console? Any active exchange requests related to this book will be cancelled automatically.",
    ru: "Удалить эту книгу через панель модерации? Все активные запросы на обмен, связанные с этой книгой, будут автоматически отменены."
  },
  "Select one of your own books and create a request for this listing with `POST /request`.": {
    de: "Wähle eines deiner eigenen Bücher aus und erstelle mit `POST /request` eine Anfrage für dieses Angebot.",
    en: "Select one of your own books and create a request for this listing with `POST /request`.",
    ru: "Выберите одну из своих книг и создайте запрос на это объявление через `POST /request`."
  },
  "Send an exchange request": {
    de: "Tauschanfrage senden",
    en: "Send an exchange request",
    ru: "Отправить запрос на обмен"
  },
  "Sign in": {
    de: "Anmelden",
    en: "Sign in",
    ru: "Войти"
  },
  "This is your own book": {
    de: "Das ist dein eigenes Buch",
    en: "This is your own book",
    ru: "Это ваша собственная книга"
  },
  "This is the final read-only state of the exchange. If the exchange was approved, the contact details above are ready for follow-up between the two users.": {
    de: "Dies ist der endgültige schreibgeschützte Status des Tauschs. Wenn der Tausch genehmigt wurde, können die oben stehenden Kontaktdaten für die weitere Abstimmung zwischen den beiden Benutzern verwendet werden.",
    en: "This is the final read-only state of the exchange. If the exchange was approved, the contact details above are ready for follow-up between the two users.",
    ru: "Это финальное состояние обмена только для чтения. Если обмен был подтверждён, указанные выше контакты готовы для дальнейшей связи между пользователями."
  },
  "This is your own listing, so reporting actions are intentionally hidden here.": {
    de: "Dies ist dein eigenes Angebot, поэтому функции жалобы здесь скрыты.",
    en: "This is your own listing, so reporting actions are intentionally hidden here.",
    ru: "Это ваше собственное объявление, поэтому действия жалобы здесь скрыты."
  },
  "This book cannot be edited because it already participates in an exchange or is in exchange history.": {
    de: "Dieses Buch kann nicht bearbeitet werden, weil es bereits an einem Tausch beteiligt ist oder in der Tauschhistorie steht.",
    en: "This book cannot be edited because it already participates in an exchange or is in exchange history.",
    ru: "Эту книгу нельзя редактировать, потому что она уже участвует в обмене или находится в истории обменов."
  },
  "Try broader filters or remove some filters.": {
    de: "Versuche breitere Filter oder entferne einige Filter.",
    en: "Try broader filters or remove some filters.",
    ru: "Попробуйте более широкие фильтры или уберите часть ограничений."
  },
  "Unread": {
    de: "Ungelesen",
    en: "Unread",
    ru: "Не прочитано"
  },
  "Unread updates request failed": {
    de: "Abfrage ungelesener Updates fehlgeschlagen",
    en: "Unread updates request failed",
    ru: "Не удалось загрузить непрочитанные обновления"
  },
  "Update the information your readers should see in the catalog.": {
    de: "Aktualisiere die Informationen, die Leser im Katalog sehen sollen.",
    en: "Update the information your readers should see in the catalog.",
    ru: "Обновите информацию, которую читатели увидят в каталоге."
  },
  "Version": {
    de: "Version",
    en: "Version",
    ru: "Версия"
  },
  "View exchanged books": {
    de: "Getauschte Bücher öffnen",
    en: "Open exchanged books",
    ru: "Открыть обменянные книги"
  },
  "When request, offer, or history events appear, they will show up here.": {
    de: "Wenn Ereignisse zu Anfragen, Angeboten oder dem Verlauf erscheinen, werden sie hier angezeigt.",
    en: "When request, offer, or history events appear, they will show up here.",
    ru: "Когда появятся события по запросам, предложениям или истории, они будут показаны здесь."
  },
  "When someone asks for one of your books, the offer will appear here.": {
    de: "Wenn jemand eines deiner Bücher anfragt, erscheint das Angebot hier.",
    en: "When someone asks for one of your books, the offer will appear here.",
    ru: "Когда кто-то запросит одну из ваших книг, предложение появится здесь."
  },
  "When you send moderation reports from public book pages, they will appear here.": {
    de: "Wenn du Meldungen von öffentlichen Buchseiten sendest, erscheinen sie hier.",
    en: "When you send moderation reports from public book pages, they will appear here.",
    ru: "Когда вы отправляете жалобы с публичных страниц книг, они будут появляться здесь."
  },
  "You cannot create an exchange request for one of your own listings.": {
    de: "Du kannst keine Tauschanfrage für eines deiner eigenen Angebote erstellen.",
    en: "You cannot create an exchange request for one of your own listings.",
    ru: "Нельзя создать запрос на обмен для собственного объявления."
  },
  "You have not added books yet": {
    de: "Du hast noch keine Bücher hinzugefügt",
    en: "You have not added books yet",
    ru: "Вы ещё не добавили книги"
  },
  "Your books could not be loaded": {
    de: "Deine Bücher konnten nicht geladen werden",
    en: "Your books could not be loaded",
    ru: "Не удалось загрузить ваши книги"
  }
};
