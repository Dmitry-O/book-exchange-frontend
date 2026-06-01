const BOOK_CATEGORY_LABELS = {
  ACTION_ADVENTURE: {
    en: "Action & Adventure",
    de: "Action & Abenteuer",
    ru: "Приключения и экшен"
  },
  ART_DESIGN: {
    en: "Art & Design",
    de: "Kunst & Design",
    ru: "Искусство и дизайн"
  },
  AUTOBIOGRAPHY: {
    en: "Autobiography",
    de: "Autobiografie",
    ru: "Автобиография"
  },
  BIOGRAPHY: {
    en: "Biography",
    de: "Biografie",
    ru: "Биография"
  },
  BUSINESS: {
    en: "Business",
    de: "Wirtschaft",
    ru: "Бизнес"
  },
  CHILDREN: {
    en: "Children",
    de: "Kinder",
    ru: "Детская литература"
  },
  CLASSIC: {
    en: "Classic",
    de: "Klassiker",
    ru: "Классика"
  },
  COMICS: {
    en: "Comics",
    de: "Comics",
    ru: "Комиксы"
  },
  CONTEMPORARY: {
    en: "Contemporary",
    de: "Gegenwartsliteratur",
    ru: "Современная литература"
  },
  COOKING: {
    en: "Cooking",
    de: "Kochen",
    ru: "Кулинария"
  },
  CRIME: {
    en: "Crime",
    de: "Krimi",
    ru: "Криминал"
  },
  DRAMA: {
    en: "Drama",
    de: "Drama",
    ru: "Драма"
  },
  EDUCATION: {
    en: "Education",
    de: "Bildung",
    ru: "Образование"
  },
  FANTASY: {
    en: "Fantasy",
    de: "Fantasy",
    ru: "Фэнтези"
  },
  GRAPHIC_NOVEL: {
    en: "Graphic Novel",
    de: "Graphic Novel",
    ru: "Графический роман"
  },
  HEALTH: {
    en: "Health",
    de: "Gesundheit",
    ru: "Здоровье"
  },
  HISTORY: {
    en: "History",
    de: "Geschichte",
    ru: "История"
  },
  MANGA: {
    en: "Manga",
    de: "Manga",
    ru: "Манга"
  },
  MEMOIR: {
    en: "Memoir",
    de: "Memoiren",
    ru: "Мемуары"
  },
  MYSTERY: {
    en: "Mystery",
    de: "Mystery",
    ru: "Детектив"
  },
  NON_FICTION: {
    en: "Non-fiction",
    de: "Sachbuch",
    ru: "Нон-фикшн"
  },
  NOVEL: {
    en: "Novel",
    de: "Roman",
    ru: "Роман"
  },
  PHILOSOPHY: {
    en: "Philosophy",
    de: "Philosophie",
    ru: "Философия"
  },
  POETRY: {
    en: "Poetry",
    de: "Poesie",
    ru: "Поэзия"
  },
  PSYCHOLOGY: {
    en: "Psychology",
    de: "Psychologie",
    ru: "Психология"
  },
  RELIGION: {
    en: "Religion",
    de: "Religion",
    ru: "Религия"
  },
  ROMANCE: {
    en: "Romance",
    de: "Romantik",
    ru: "Романтика"
  },
  SCIENCE: {
    en: "Science",
    de: "Wissenschaft",
    ru: "Наука"
  },
  SCIENCE_FICTION: {
    en: "Science Fiction",
    de: "Science-Fiction",
    ru: "Научная фантастика"
  },
  SELF_HELP: {
    en: "Self-help",
    de: "Selbsthilfe",
    ru: "Саморазвитие"
  },
  TECHNOLOGY: {
    en: "Technology",
    de: "Technologie",
    ru: "Технологии"
  },
  THRILLER: {
    en: "Thriller",
    de: "Thriller",
    ru: "Триллер"
  },
  TRAVEL: {
    en: "Travel",
    de: "Reisen",
    ru: "Путешествия"
  },
  YOUNG_ADULT: {
    en: "Young Adult",
    de: "Jugendbuch",
    ru: "Подростковая литература"
  },
  OTHER: {
    en: "Other",
    de: "Andere",
    ru: "Другое"
  }
};

const BOOK_CATEGORY_UI_LABELS = {
  all: {
    en: "All",
    de: "Alle",
    ru: "Все"
  },
  select: {
    en: "Select category",
    de: "Kategorie auswählen",
    ru: "Выберите категорию"
  },
  none: {
    en: "No category",
    de: "Keine Kategorie",
    ru: "Без категории"
  }
};

export function formatBookCategoryLabel(value, locale = "en", fallback = "") {
  if (!value) {
    return fallback;
  }

  const key = normalizeBookCategoryKey(value);
  const labels = BOOK_CATEGORY_LABELS[key];

  if (!labels) {
    return value;
  }

  return labels[locale] ?? labels.en ?? value;
}

export function buildBookCategoryOptions(categories, locale = "en", emptyLabel = "", currentValue = "") {
  const nextCategories = categories.filter(isVisibleBookCategory);

  if (isVisibleBookCategory(currentValue) && !nextCategories.includes(currentValue)) {
    nextCategories.push(currentValue);
  }

  return [
    { label: emptyLabel, value: "" },
    ...nextCategories.map((category) => ({
      label: formatBookCategoryLabel(category, locale, category),
      value: category
    }))
  ];
}

export function getBookCategoryUiLabel(kind, locale = "en") {
  const labels = BOOK_CATEGORY_UI_LABELS[kind];

  if (!labels) {
    return "";
  }

  return labels[locale] ?? labels.en ?? "";
}

export function getBookCategoryTagStyle(value) {
  const key = normalizeBookCategoryKey(value);

  if (!key) {
    return undefined;
  }

  const hue =
    Array.from(key).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 360;

  return {
    backgroundColor: `hsla(${hue} 78% 92% / 0.98)`,
    color: `hsl(${hue} 38% 28%)`
  };
}

export function isVisibleBookCategory(value) {
  const key = normalizeBookCategoryKey(value);

  return Boolean(key) && Boolean(BOOK_CATEGORY_LABELS[key]);
}

export function getBookCategoryImageSlug(value) {
  return normalizeBookCategoryKey(value).toLowerCase().replace(/_/g, "-");
}

export function normalizeBookCategoryKey(value) {
  return String(value)
    .trim()
    .normalize("NFKD")
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}
