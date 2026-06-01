import { readStoredLocale } from "../i18n/locale";

export function buildQueryString(params) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return;
      }

      value.forEach((item) => {
        if (item === undefined || item === null || item === "") {
          return;
        }

        searchParams.append(key, String(item));
      });

      return;
    }

    searchParams.set(key, String(value));
  });

  return searchParams.toString();
}

export function formatDateTime(value) {
  const locale = readStoredLocale();

  if (!value) {
    return locale === "de" ? "Nicht verfügbar" : locale === "ru" ? "Недоступно" : "Not available";
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function formatDateTimeReadable(value) {
  const locale = readStoredLocale();

  if (!value) {
    return locale === "de" ? "Nicht verfügbar" : locale === "ru" ? "Недоступно" : "Not available";
  }

  try {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const datePart = new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => part.value)
      .join(" ");

    const timePart = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);

    const connector = locale === "de" ? "um" : locale === "ru" ? "в" : "at";

    return `${datePart} ${connector} ${timePart}`;
  } catch {
    return value;
  }
}

export function formatEnumLabel(value) {
  const locale = readStoredLocale();

  if (!value) {
    return locale === "de" ? "Unbekannt" : locale === "ru" ? "Неизвестно" : "Unknown";
  }

  const key = String(value).trim().toUpperCase();
  const labels = ENUM_LABELS[key];

  if (labels) {
    return labels[locale] ?? labels.en;
  }

  return key
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function trimFormPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      typeof value === "string" ? value.trim() : value
    ])
  );
}

const ENUM_LABELS = {
  ACTIVE: { de: "Aktiv", en: "Active", ru: "Активно" },
  ADMIN: { de: "Admin", en: "Admin", ru: "Админ" },
  APPROVED: { de: "Genehmigt", en: "Approved", ru: "Подтверждено" },
  AUTHOR: { de: "Autor", en: "Author", ru: "Автор" },
  BOOK: { de: "Buch", en: "Book", ru: "Книга" },
  CATEGORY: { de: "Kategorie", en: "Category", ru: "Категория" },
  CITY: { de: "Stadt", en: "City", ru: "Город" },
  CREATED_AT: { de: "Erstellt am", en: "Created at", ru: "Создано" },
  DECLINED: { de: "Abgelehnt", en: "Declined", ru: "Отклонено" },
  DEFAULT: { de: "Standard", en: "Default", ru: "По умолчанию" },
  DELETED: { de: "Gelöscht", en: "Deleted", ru: "Удалено" },
  DESCRIPTION: { de: "Beschreibung", en: "Description", ru: "Описание" },
  EMAIL: { de: "E-Mail", en: "Email", ru: "Эл. почта" },
  EXCHANGE: { de: "Tausch", en: "Exchange", ru: "Обмен" },
  EXCHANGED: { de: "Getauscht", en: "Exchanged", ru: "Обменено" },
  FRAUD: { de: "Betrug", en: "Fraud", ru: "Мошенничество" },
  GIFT: { de: "Geschenk", en: "Gift", ru: "Подарок" },
  HIGH: { de: "Hoch", en: "High", ru: "Высокий" },
  INAPPROPRIATE: { de: "Unangemessen", en: "Inappropriate", ru: "Неприемлемый контент" },
  LOW: { de: "Niedrig", en: "Low", ru: "Низкий" },
  NAME: { de: "Name", en: "Name", ru: "Название" },
  OPEN: { de: "In Prüfung", en: "Under review", ru: "На рассмотрении" },
  OTHER: { de: "Andere", en: "Other", ru: "Другое" },
  PENDING: { de: "Ausstehend", en: "Pending", ru: "Ожидает" },
  PROFILE: { de: "Profil", en: "Profile", ru: "Профиль" },
  RECEIVER: { de: "Empfänger", en: "Receiver", ru: "Получатель" },
  REJECTED: { de: "Abgelehnt", en: "Rejected", ru: "Отклонена" },
  REPORT: { de: "Meldung", en: "Report", ru: "Жалоба" },
  REPORTED: { de: "Gemeldet", en: "Reported", ru: "Пожаловано" },
  REPORTER: { de: "Melder", en: "Reporter", ru: "Жалобщик" },
  REQUEST: { de: "Anfrage", en: "Request", ru: "Запрос" },
  RESOLVED: { de: "Bearbeitet", en: "Handled", ru: "Обработана" },
  ROLE: { de: "Rolle", en: "Role", ru: "Роль" },
  SENDER: { de: "Absender", en: "Sender", ru: "Отправитель" },
  SORT_DIRECTION: { de: "Sortierrichtung", en: "Sort direction", ru: "Направление сортировки" },
  SPAM: { de: "Spam", en: "Spam", ru: "Спам" },
  SUPER_ADMIN: { de: "Super-Admin", en: "Super Admin", ru: "Супер-админ" },
  TARGET_TYPE: { de: "Zieltyp", en: "Target type", ru: "Тип цели" },
  UPDATED_AT: { de: "Aktualisiert am", en: "Updated at", ru: "Обновлено" },
  USER: { de: "Benutzer", en: "User", ru: "Пользователь" }
};
