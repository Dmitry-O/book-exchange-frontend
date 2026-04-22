const CURRENT_YEAR = new Date().getFullYear();

const SORT_FIELD_LABELS = {
  AUTHOR: {
    de: "Autor",
    en: "Author",
    ru: "Автор"
  },
  CATEGORY: {
    de: "Kategorie",
    en: "Category",
    ru: "Категория"
  },
  CITY: {
    de: "Stadt",
    en: "City",
    ru: "Город"
  },
  CREATED_AT: {
    de: "Veröffentlichungsdatum",
    en: "Publication date",
    ru: "Дата публикации"
  },
  NAME: {
    de: "Titel",
    en: "Title",
    ru: "Название"
  },
  PUBLICATION_YEAR: {
    de: "Erscheinungsjahr",
    en: "Publication year",
    ru: "Год публикации"
  },
  UPDATED_AT: {
    de: "Aktualisierungsdatum",
    en: "Update date",
    ru: "Дата обновления"
  }
};

const TRANSFER_CONDITION_TEXT = {
  exchangeOnly: {
    de: "Nur Tausch",
    en: "Exchange only",
    ru: "Только обмен"
  },
  giftOnly: {
    de: "Nur Geschenk",
    en: "Gift only",
    ru: "Только подарок"
  },
  label: {
    de: "Übergabeart",
    en: "Transfer condition",
    ru: "Условие передачи"
  }
};

const BOOK_TYPE_LABELS = {
  ACTIVE: {
    de: "Aktive",
    en: "Active books",
    ru: "Активные"
  },
  ALL: {
    de: "Alle",
    en: "All",
    ru: "Все"
  },
  DELETED: {
    de: "Gelöschte",
    en: "Deleted books",
    ru: "Удаленные"
  }
};

export function buildBookSortOptions(
  fields,
  locale = "en",
  {
    emptyLabel = "",
    includeUpdated = true
  } = {}
) {
  return [
    { label: emptyLabel, value: "" },
    ...fields
      .filter((field) => includeUpdated || field !== "UPDATED_AT")
      .map((field) => ({
        label: getBookSortFieldLabel(field, locale),
        value: field
      }))
  ];
}

export function getBookSortFieldLabel(value, locale = "en") {
  const key = String(value ?? "").trim().toUpperCase();
  const labels = SORT_FIELD_LABELS[key];

  if (!labels) {
    return value ?? "";
  }

  return labels[locale] ?? labels.en ?? value;
}

export function getBookTypeLabel(value, locale = "en") {
  const labels = BOOK_TYPE_LABELS[String(value ?? "").trim().toUpperCase()];

  if (!labels) {
    return value ?? "";
  }

  return labels[locale] ?? labels.en ?? value;
}

export function getCurrentPublicationYear() {
  return CURRENT_YEAR;
}

export function getPublicationYearSuggestions(limit = 120) {
  const years = [];
  const minYear = Math.max(CURRENT_YEAR - limit + 1, 1);

  for (let year = CURRENT_YEAR; year >= minYear; year -= 1) {
    years.push(String(year));
  }

  return years;
}

export function getTransferConditionLabel(locale = "en") {
  return localize(TRANSFER_CONDITION_TEXT.label, locale);
}

export function getTransferConditionOptions(locale = "en", allLabel = "") {
  return [
    { label: allLabel, value: "" },
    { label: localize(TRANSFER_CONDITION_TEXT.giftOnly, locale), value: "true" },
    { label: localize(TRANSFER_CONDITION_TEXT.exchangeOnly, locale), value: "false" }
  ];
}

export function parsePublicationYearInput(value) {
  const sanitized = sanitizePublicationYearInput(value);

  if (!/^\d{4}$/.test(sanitized)) {
    return undefined;
  }

  const year = Number(sanitized);

  if (year < 1 || year > CURRENT_YEAR) {
    return undefined;
  }

  return year;
}

export function sanitizePublicationYearInput(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, 4);
}

function localize(labels, locale) {
  return labels[locale] ?? labels.en ?? "";
}
