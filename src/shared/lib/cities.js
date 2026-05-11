const CITY_ENTRIES = [
  createCity("amsterdam", "Amsterdam", "Amsterdam", "Амстердам"),
  createCity("athens", "Athens", "Athen", "Афины"),
  createCity("barcelona", "Barcelona", "Barcelona", "Барселона"),
  createCity("belgrade", "Belgrade", "Belgrad", "Белград"),
  createCity("berlin", "Berlin", "Berlin", "Берлин"),
  createCity("bologna", "Bologna", "Bologna", "Болонья"),
  createCity("bonn", "Bonn", "Bonn", "Бонн"),
  createCity("bratislava", "Bratislava", "Bratislava", "Братислава"),
  createCity("brussels", "Brussels", "Brüssel", "Брюссель"),
  createCity("bucharest", "Bucharest", "Bukarest", "Бухарест"),
  createCity("budapest", "Budapest", "Budapest", "Будапешт"),
  createCity("chicago", "Chicago", "Chicago", "Чикаго"),
  createCity("cologne", "Cologne", "Köln", "Кёльн"),
  createCity("copenhagen", "Copenhagen", "Kopenhagen", "Копенгаген"),
  createCity("dortmund", "Dortmund", "Dortmund", "Дортмунд"),
  createCity("dresden", "Dresden", "Dresden", "Дрезден"),
  createCity("dublin", "Dublin", "Dublin", "Дублин"),
  createCity("dusseldorf", "Dusseldorf", "Düsseldorf", "Дюссельдорф"),
  createCity("essen", "Essen", "Essen", "Эссен"),
  createCity("florence", "Florence", "Florenz", "Флоренция"),
  createCity("frankfurt", "Frankfurt", "Frankfurt", "Франкфурт"),
  createCity("geneva", "Geneva", "Genf", "Женева"),
  createCity("gdansk", "Gdansk", "Danzig", "Гданьск"),
  createCity("gothenburg", "Gothenburg", "Göteborg", "Гётеборг"),
  createCity("hamburg", "Hamburg", "Hamburg", "Гамбург"),
  createCity("hanover", "Hanover", "Hannover", "Ганновер"),
  createCity("helsinki", "Helsinki", "Helsinki", "Хельсинки"),
  createCity("istanbul", "Istanbul", "Istanbul", "Стамбул"),
  createCity("kazan", "Kazan", "Kasan", "Казань"),
  createCity("krakow", "Krakow", "Krakau", "Краков"),
  createCity("kyiv", "Kyiv", "Kyjiw", "Киев"),
  createCity("leipzig", "Leipzig", "Leipzig", "Лейпциг"),
  createCity("lisbon", "Lisbon", "Lissabon", "Лиссабон"),
  createCity("london", "London", "London", "Лондон"),
  createCity("los-angeles", "Los Angeles", "Los Angeles", "Лос-Анджелес"),
  createCity("lviv", "Lviv", "Lwiw", "Львов"),
  createCity("madrid", "Madrid", "Madrid", "Мадрид"),
  createCity("milan", "Milan", "Mailand", "Милан"),
  createCity("minsk", "Minsk", "Minsk", "Минск"),
  createCity("montreal", "Montreal", "Montreal", "Монреаль"),
  createCity("moscow", "Moscow", "Moskau", "Москва"),
  createCity("munich", "Munich", "München", "Мюнхен"),
  createCity("naples", "Naples", "Neapel", "Неаполь"),
  createCity("new-york", "New York", "New York", "Нью-Йорк"),
  createCity("nice", "Nice", "Nizza", "Ницца"),
  createCity("nuremberg", "Nuremberg", "Nürnberg", "Нюрнберг"),
  createCity("odessa", "Odessa", "Odessa", "Одесса"),
  createCity("oslo", "Oslo", "Oslo", "Осло"),
  createCity("paris", "Paris", "Paris", "Париж"),
  createCity("prague", "Prague", "Prag", "Прага"),
  createCity("riga", "Riga", "Riga", "Рига"),
  createCity("rome", "Rome", "Rom", "Рим"),
  createCity("rotterdam", "Rotterdam", "Rotterdam", "Роттердам"),
  createCity("saint-petersburg", "Saint Petersburg", "Sankt Petersburg", "Санкт-Петербург"),
  createCity("samara", "Samara", "Samara", "Самара"),
  createCity("san-francisco", "San Francisco", "San Francisco", "Сан-Франциско"),
  createCity("seattle", "Seattle", "Seattle", "Сиэтл"),
  createCity("sofia", "Sofia", "Sofia", "София"),
  createCity("stockholm", "Stockholm", "Stockholm", "Стокгольм"),
  createCity("stuttgart", "Stuttgart", "Stuttgart", "Штутгарт"),
  createCity("tallinn", "Tallinn", "Tallinn", "Таллин"),
  createCity("tbilisi", "Tbilisi", "Tiflis", "Тбилиси"),
  createCity("toronto", "Toronto", "Toronto", "Торонто"),
  createCity("valencia", "Valencia", "Valencia", "Валенсия"),
  createCity("vancouver", "Vancouver", "Vancouver", "Ванкувер"),
  createCity("vienna", "Vienna", "Wien", "Вена"),
  createCity("vilnius", "Vilnius", "Vilnius", "Вильнюс"),
  createCity("warsaw", "Warsaw", "Warschau", "Варшава"),
  createCity("yekaterinburg", "Yekaterinburg", "Jekaterinburg", "Екатеринбург"),
  createCity("zurich", "Zurich", "Zürich", "Цюрих")
];

const CITY_LOOKUP = new Map();

CITY_ENTRIES.forEach((entry) => {
  [entry.key, ...Object.values(entry.labels)].forEach((alias) => {
    CITY_LOOKUP.set(normalizeCityValue(alias), entry);
  });
});

export function registerCitySuggestions(suggestions = [], locale = "en") {
  suggestions.forEach((suggestion) => {
    const value = String(suggestion?.value ?? "").trim();
    const label = String(suggestion?.label ?? "").trim();

    if (!value || !label) {
      return;
    }

    const key = normalizeCityValue(value);
    const existingEntry = CITY_LOOKUP.get(key);
    const entry = existingEntry ?? {
      key,
      labels: {
        en: value
      }
    };

    entry.labels = {
      ...entry.labels,
      en: entry.labels.en ?? value,
      [locale]: label
    };

    [entry.key, entry.labels.en, ...Object.values(entry.labels), value, label]
      .filter(Boolean)
      .forEach((alias) => {
        CITY_LOOKUP.set(normalizeCityValue(alias), entry);
      });
  });
}

export function getCityDisplayName(value, locale = "en") {
  if (!value) {
    return "";
  }

  const entry = resolveCityEntry(value);

  if (!entry) {
    return value;
  }

  return entry.labels[locale] ?? entry.labels.en;
}

export function getCityApiValue(value) {
  const entry = resolveCityEntry(value);
  return entry?.labels.en ?? "";
}

export function isKnownCity(value) {
  return Boolean(resolveCityEntry(value));
}

export function normalizeCityQueryValue(value) {
  const trimmedValue = String(value ?? "").trim();

  if (!trimmedValue) {
    return "";
  }

  return getCityApiValue(trimmedValue) || trimmedValue;
}

export function findCitySuggestions(value, locale = "en", limit = 6) {
  const normalizedValue = normalizeCityValue(value);

  if (!normalizedValue) {
    return CITY_ENTRIES.slice(0, limit).map((entry) => toCitySuggestion(entry, locale));
  }

  return CITY_ENTRIES.map((entry, index) => ({
    entry,
    index,
    score: getCityScore(entry, normalizedValue, locale)
  }))
    .filter((item) => item.score < Number.POSITIVE_INFINITY)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return left.score - right.score;
      }

      return left.index - right.index;
    })
    .slice(0, limit)
    .map((item) => toCitySuggestion(item.entry, locale));
}

function toCitySuggestion(entry, locale) {
  return {
    key: entry.key,
    label: entry.labels[locale] ?? entry.labels.en
  };
}

function resolveCityEntry(value) {
  if (!value) {
    return null;
  }

  return CITY_LOOKUP.get(normalizeCityValue(value)) ?? null;
}

function getCityScore(entry, normalizedValue, locale) {
  const localizedLabel = normalizeCityValue(entry.labels[locale] ?? entry.labels.en);
  const aliases = [entry.key, ...Object.values(entry.labels)].map(normalizeCityValue);
  const displayScore = getAliasScore(localizedLabel, normalizedValue);

  if (displayScore < Number.POSITIVE_INFINITY) {
    return displayScore;
  }

  const aliasScores = aliases.map((alias) => getAliasScore(alias, normalizedValue));
  const bestAliasScore = Math.min(...aliasScores);

  if (bestAliasScore < Number.POSITIVE_INFINITY) {
    return bestAliasScore + 10;
  }

  return Number.POSITIVE_INFINITY;
}

function getAliasScore(alias, normalizedValue) {
  if (alias === normalizedValue) {
    return 0;
  }

  if (alias.startsWith(normalizedValue)) {
    return 1;
  }

  if (alias.split(" ").some((part) => part.startsWith(normalizedValue))) {
    return 2;
  }

  if (alias.includes(normalizedValue)) {
    return 3 + alias.indexOf(normalizedValue) / 100;
  }

  return Number.POSITIVE_INFINITY;
}

function createCity(key, en, de, ru) {
  return {
    key,
    labels: { de, en, ru }
  };
}

function normalizeCityValue(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
