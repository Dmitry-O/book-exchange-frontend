const LOCALE_STORAGE_KEY = "book-exchange/locale";

export const SUPPORTED_LOCALES = ["en", "de", "ru"];

export function normalizeLocale(value) {
  if (!value || typeof value !== "string") {
    return "en";
  }

  const normalized = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(normalized) ? normalized : "en";
}

export function detectBrowserLocale() {
  if (typeof navigator === "undefined") {
    return "en";
  }

  return normalizeLocale(navigator.language || navigator.languages?.[0] || "en");
}

export function readStoredLocale() {
  if (typeof window === "undefined") {
    return detectBrowserLocale();
  }

  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored ? normalizeLocale(stored) : detectBrowserLocale();
}

export function writeStoredLocale(locale) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
}

export function getLocaleLabel(locale) {
  switch (normalizeLocale(locale)) {
    case "de":
      return "Deutsch";
    case "ru":
      return "Русский";
    default:
      return "English";
  }
}
