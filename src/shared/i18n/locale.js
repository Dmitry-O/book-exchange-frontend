const LOCALE_STORAGE_KEY = "book-exchange/locale";
const LOCALE_SOURCE_STORAGE_KEY = "book-exchange/locale-source";
const AUTO_LOCALE_CACHE_KEY = "book-exchange/auto-locale-cache";
const GEO_IP_LOCALE_PROVIDERS = [
  {
    url: "https://api.country.is/",
    countryCode: (payload) => payload?.country
  },
  {
    url: "https://ipapi.co/json/",
    countryCode: (payload) => payload?.country_code
  },
  {
    url: "https://ipwho.is/?fields=country_code",
    countryCode: (payload) => payload?.country_code
  },
  {
    url: "https://get.geojs.io/v1/ip/country.json",
    countryCode: (payload) => payload?.country
  }
];

export const SUPPORTED_LOCALES = ["en", "de", "ru"];
const RUSSIAN_REGION_CODES = new Set(["RU", "UA", "BY", "KZ"]);

export function normalizeLocale(value) {
  if (!value || typeof value !== "string") {
    return "en";
  }

  const normalized = value.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(normalized) ? normalized : "en";
}

export function detectBrowserLocale() {
  return "en";
}

function mapCountryCodeToLocale(countryCode) {
  const normalizedCountryCode = String(countryCode ?? "").trim().toUpperCase();

  if (normalizedCountryCode === "DE") {
    return "de";
  }

  if (RUSSIAN_REGION_CODES.has(normalizedCountryCode)) {
    return "ru";
  }

  return "en";
}

function readAutoDetectedLocale() {
  if (typeof window === "undefined") {
    return "en";
  }

  const cached = window.localStorage.getItem(AUTO_LOCALE_CACHE_KEY);
  return cached ? normalizeLocale(cached) : "en";
}

function writeAutoDetectedLocale(locale) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedLocale = normalizeLocale(locale);
  window.localStorage.setItem(AUTO_LOCALE_CACHE_KEY, normalizedLocale);
  window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizedLocale);
  window.localStorage.setItem(LOCALE_SOURCE_STORAGE_KEY, "auto");
}

export function hasStoredLocalePreference() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(LOCALE_SOURCE_STORAGE_KEY) === "manual";
}

export async function detectLocaleFromIp() {
  if (typeof window === "undefined") {
    return "en";
  }

  for (const provider of GEO_IP_LOCALE_PROVIDERS) {
    try {
      const response = await window.fetch(provider.url, {
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        continue;
      }

      const payload = await response.json();
      const countryCode = provider.countryCode(payload);

      if (!countryCode) {
        continue;
      }

      const nextLocale = mapCountryCodeToLocale(countryCode);
      writeAutoDetectedLocale(nextLocale);

      return nextLocale;
    } catch {
      // Try the next provider before falling back to the cached/default locale.
    }
  }

  return readAutoDetectedLocale();
}

export function readStoredLocale() {
  if (typeof window === "undefined") {
    return "en";
  }

  const source = window.localStorage.getItem(LOCALE_SOURCE_STORAGE_KEY);
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);

  if (stored && source === "manual") {
    return normalizeLocale(stored);
  }

  if (source === "auto") {
    return readAutoDetectedLocale();
  }

  return "en";
}

export function writeStoredLocale(locale) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedLocale = normalizeLocale(locale);
  window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizedLocale);
  window.localStorage.setItem(LOCALE_SOURCE_STORAGE_KEY, "manual");
  window.localStorage.removeItem(AUTO_LOCALE_CACHE_KEY);
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

export function getLocaleFlag(locale) {
  switch (normalizeLocale(locale)) {
    case "de":
      return "🇩🇪";
    case "ru":
      return "🇷🇺";
    default:
      return "🇬🇧";
  }
}
