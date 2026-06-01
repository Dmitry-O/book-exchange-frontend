import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMetadataQuery } from "../../shared/api/hooks";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import {
  formatBookCategoryLabel,
  getBookCategoryImageSlug,
  isVisibleBookCategory,
  normalizeBookCategoryKey
} from "../../shared/lib/bookCategory";
import {
  BookIcon,
  CheckIcon,
  GiftIcon,
  SearchIcon,
  SwapIcon,
  UserIcon,
  XIcon
} from "../../shared/ui/Icons";

const HERO_IMAGE_URL = "/home-books-hero.png";
const CATEGORY_IMAGE_FALLBACK_URL = "/home-books-hero.png";
const CATEGORY_IMAGE_BASE_PATH = "/category-images";
const CATEGORY_CARD_LIMIT = 6;

const FALLBACK_CATEGORIES = [
  "Fantasy",
  "Science Fiction",
  "Classic",
  "Psychology",
  "Business",
  "Children"
];

const CATEGORY_VISUALS = {
  FANTASY: {
    position: "50% 42%",
    tint: "rgba(37, 31, 69, 0.68)"
  },
  SCIENCE_FICTION: {
    position: "50% 36%",
    tint: "rgba(22, 83, 97, 0.68)"
  },
  CLASSIC: {
    position: "50% 38%",
    tint: "rgba(92, 58, 38, 0.68)"
  },
  PSYCHOLOGY: {
    position: "50% 40%",
    tint: "rgba(31, 107, 88, 0.7)"
  },
  BUSINESS: {
    position: "50% 42%",
    tint: "rgba(41, 60, 118, 0.7)"
  },
  CHILDREN: {
    position: "50% 35%",
    tint: "rgba(153, 71, 54, 0.68)"
  },
  DEFAULT: {
    position: "68% 52%",
    tint: "rgba(18, 32, 43, 0.66)"
  }
};

const CATEGORY_TAGLINES = {
  FANTASY: {
    en: "Magic, quests, hidden kingdoms, and books that make evenings disappear.",
    de: "Magie, Reisen, geheime Reiche und Bücher, die Abende verschwinden lassen.",
    ru: "Магия, приключения, тайные миры и книги, с которыми вечер исчезает незаметно."
  },
  SCIENCE_FICTION: {
    en: "Future worlds, bold ideas, and stories with a spark of tomorrow.",
    de: "Zukünftige Welten, große Ideen und Geschichten mit einem Funken Morgen.",
    ru: "Миры будущего, смелые идеи и истории, в которых уже слышно завтра."
  },
  CLASSIC: {
    en: "Books that survived trends and still know how to start a conversation.",
    de: "Bücher, die Trends überlebt haben und immer noch Gespräche starten.",
    ru: "Книги, которые пережили моду и все еще отлично начинают разговор."
  },
  PSYCHOLOGY: {
    en: "For habits, focus, relationships, and a little more order in your head.",
    de: "Für Gewohnheiten, Fokus, Beziehungen und etwas mehr Ordnung im Kopf.",
    ru: "Про привычки, фокус, отношения и немного больше порядка в голове."
  },
  BUSINESS: {
    en: "Practical reads about work, products, teams, and decisions.",
    de: "Praktische Lektüre über Arbeit, Produkte, Teams und Entscheidungen.",
    ru: "Практичные книги про работу, продукты, команды и решения."
  },
  CHILDREN: {
    en: "Bright stories that deserve to make more than one childhood warmer.",
    de: "Helle Geschichten, die mehr als eine Kindheit wärmer machen können.",
    ru: "Светлые истории, которые могут согреть больше одного детства."
  }
};

const HOME_COPY = {
  en: {
    eyebrow: "Book Exchange",
    title: "Books should travel, not gather dust",
    description:
      "Exchange books with other readers: find something for your next evening, add books from your shelf, and agree on a swap in a few clicks.",
    searchPlaceholder: "Search by title, description, author, or mood...",
    search: "Search",
    clear: "Clear search",
    openCatalog: "Find books",
    createAccount: "Create account",
    heroProof: ["Books by mood and genre", "Swaps and gift offers", "Stories near you"],
    categoriesEyebrow: "Reader favorites",
    categoriesTitle: "Popular shelves",
    categoriesDescription:
      "Choose a direction that fits your mood, open the catalog, and start from books readers are already ready to share.",
    statsEyebrow: "Platform in numbers",
    statsTitle: "A quick look at the community shelves",
    statsDescription:
      "Here you can see how many readers joined, how many books are waiting for a new owner, and how actively stories are moving between people.",
    stats: {
      users: "readers joined the community",
      books: "books are waiting for new readers",
      exchanges: "exchange stories have started",
      categories: "book moods to start from"
    },
    featuresEyebrow: "How it works",
    featuresTitle: "What you can do here",
    features: [
      {
        title: "Pick a book for your mood",
        description: "Use search and filters to browse titles by genre, author, city, year, or gift offers."
      },
      {
        title: "Share your own shelf",
        description: "Add books you are ready to pass on, upload covers, and keep your listings up to date."
      },
      {
        title: "Agree on a swap",
        description: "Send a request, receive offers, and keep all exchange updates in your account."
      }
    ],
    finalTitle: "Let the next story find you",
    finalDescription:
      "Open the catalog and choose what to read next, or create an account and give one of your books a new route."
  },
  de: {
    eyebrow: "Book Exchange",
    title: "Bücher sollen reisen, nicht im Regal verstauben",
    description:
      "Tausche Bücher mit anderen Lesern: finde etwas für den nächsten Abend, stelle eigene Bücher ein und stimme den Tausch in wenigen Klicks ab.",
    searchPlaceholder: "Nach Titel, Beschreibung, Autor oder Stimmung suchen...",
    search: "Suchen",
    clear: "Suche leeren",
    openCatalog: "Bücher finden",
    createAccount: "Konto erstellen",
    heroProof: ["Bücher nach Stimmung und Genre", "Tausch und Geschenkangebote", "Geschichten in deiner Nähe"],
    categoriesEyebrow: "Favoriten der Leser",
    categoriesTitle: "Beliebte Regale",
    categoriesDescription:
      "Wähle eine Richtung, die zu deiner Stimmung passt, öffne den Katalog und starte mit Büchern, die andere Leser bereits teilen möchten.",
    statsEyebrow: "Plattform in Zahlen",
    statsTitle: "Ein schneller Blick auf die Regale der Community",
    statsDescription:
      "Hier siehst du, wie viele Leser dabei sind, wie viele Bücher auf neue Besitzer warten und wie aktiv Geschichten weiterziehen.",
    stats: {
      users: "Leser sind in der Community",
      books: "Bücher warten auf neue Leser",
      exchanges: "Tauschgeschichten wurden gestartet",
      categories: "Regale für den ersten Schritt"
    },
    featuresEyebrow: "So funktioniert es",
    featuresTitle: "Was du hier machen kannst",
    features: [
      {
        title: "Ein Buch passend zur Stimmung finden",
        description: "Suche und filtere nach Genre, Autor, Stadt, Jahr oder Geschenkangeboten."
      },
      {
        title: "Dein eigenes Regal teilen",
        description: "Stelle Bücher ein, lade Cover hoch und halte deine Angebote aktuell."
      },
      {
        title: "Einen Tausch abstimmen",
        description: "Sende Anfragen, erhalte Angebote und behalte alle Updates in deinem Konto im Blick."
      }
    ],
    finalTitle: "Lass die nächste Geschichte zu dir finden",
    finalDescription:
      "Öffne den Katalog und wähle deine nächste Lektüre, oder erstelle ein Konto und gib einem deiner Bücher eine neue Route."
  },
  ru: {
    eyebrow: "Book Exchange",
    title: "Книги должны путешествовать, а не пылиться на полке",
    description:
      "Меняйтесь книгами с другими читателями: находите что-то для следующего вечера, добавляйте книги со своей полки и договаривайтесь об обмене в пару кликов.",
    searchPlaceholder: "Искать по названию, описанию, автору или настроению...",
    search: "Искать",
    clear: "Очистить поиск",
    openCatalog: "Подобрать книги",
    createAccount: "Создать аккаунт",
    heroProof: ["Книги по настроению и жанрам", "Обмены и подарки", "Истории рядом с вами"],
    categoriesEyebrow: "Выбор читателей",
    categoriesTitle: "Популярные полки",
    categoriesDescription:
      "Выберите направление под настроение, откройте каталог и начните с книг, которыми читатели уже готовы поделиться.",
    statsEyebrow: "Платформа в цифрах",
    statsTitle: "Быстрый взгляд на книжные полки сообщества",
    statsDescription:
      "Здесь видно, сколько читателей уже присоединилось, сколько книг ждут нового владельца и как активно истории переходят из рук в руки.",
    stats: {
      users: "читателей уже в сообществе",
      books: "книг ждут новых читателей",
      exchanges: "историй обмена уже началось",
      categories: "полок, с которых удобно начать"
    },
    featuresEyebrow: "Как это работает",
    featuresTitle: "Что можно сделать на сайте",
    features: [
      {
        title: "Найти книгу под настроение",
        description: "Используйте поиск и фильтры по жанру, автору, городу, году издания или подарочным предложениям."
      },
      {
        title: "Поделиться своей полкой",
        description: "Добавляйте книги, которыми готовы поделиться, загружайте обложки и обновляйте объявления."
      },
      {
        title: "Договориться об обмене",
        description: "Отправляйте запросы, получайте предложения и следите за всеми обновлениями в личном кабинете."
      }
    ],
    finalTitle: "Пусть следующая история найдет вас",
    finalDescription:
      "Откройте каталог и выберите, что читать дальше, или создайте аккаунт и отправьте одну из своих книг в новое путешествие."
  }
};

const FEATURE_ICONS = [SearchIcon, BookIcon, SwapIcon];
const STAT_ICONS = {
  users: UserIcon,
  books: BookIcon,
  exchanges: SwapIcon,
  categories: GiftIcon
};

export function HomePage() {
  const metadataQuery = useMetadataQuery();
  const metadata = metadataQuery.data;
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { locale } = useLocale();
  const text = HOME_COPY[locale] ?? HOME_COPY.en;
  const [searchQuery, setSearchQuery] = useState("");

  const categoryCards = useMemo(
    () =>
      buildCategoryCards(
        metadata?.popularBookCategories ?? [],
        metadata?.bookCategories ?? [],
        locale
      ),
    [locale, metadata?.bookCategories, metadata?.popularBookCategories]
  );

  const statItems = useMemo(() => buildStatItems(metadata, text), [metadata, text]);
  const normalizedSearchQuery = searchQuery.trim();
  const canSubmitSearch = normalizedSearchQuery.length === 0 || normalizedSearchQuery.length >= 3;

  function handleSearchSubmit(event) {
    event.preventDefault();

    if (!canSubmitSearch) {
      return;
    }

    const target = normalizedSearchQuery
      ? `/catalog?searchText=${encodeURIComponent(normalizedSearchQuery)}`
      : "/catalog";

    navigate(target);
  }

  return (
    <div className="content-stack home-page">
      <section className="home-hero" style={{ "--home-hero-image": `url("${HERO_IMAGE_URL}")` }}>
        <div className="home-hero-content">
          <span className="home-eyebrow">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p>{text.description}</p>

          <form className="home-search" onSubmit={handleSearchSubmit}>
            <SearchIcon />
            <input
              aria-label={text.search}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearchSubmit(event);
                }
              }}
              placeholder={text.searchPlaceholder}
              value={searchQuery}
            />
            {searchQuery ? (
              <button
                aria-label={text.clear}
                className="home-search-clear"
                onClick={() => setSearchQuery("")}
                title={text.clear}
                type="button"
              >
                <XIcon />
              </button>
            ) : null}
            <button className="home-search-submit" disabled={!canSubmitSearch} type="submit">
              <SearchIcon />
              <span>{text.search}</span>
            </button>
          </form>

          <div className="home-hero-actions">
            <Link className="button home-primary-button" to="/catalog">
              {text.openCatalog}
            </Link>
            {!isAuthenticated ? (
              <Link className="button button-secondary home-secondary-button" to="/register">
                {text.createAccount}
              </Link>
            ) : null}
          </div>

          <div className="home-proof-row">
            {text.heroProof.map((item) => (
              <span key={item}>
                <CheckIcon />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-categories-section">
        <div className="home-section-heading">
          <span className="home-section-kicker">{text.categoriesEyebrow}</span>
          <h2>{text.categoriesTitle}</h2>
          <p>{text.categoriesDescription}</p>
        </div>

        <div className="home-category-grid">
          {categoryCards.map((category) => (
            <Link
              className="home-category-card"
              key={category.value}
              style={{
                "--category-image": `url("${category.image}")`,
                "--category-fallback-image": `url("${CATEGORY_IMAGE_FALLBACK_URL}")`,
                "--category-position": category.position,
                "--category-tint": category.tint
              }}
              to={`/catalog?category=${encodeURIComponent(category.value)}`}
            >
              {category.bookCount > 0 ? (
                <small className="home-category-count">{formatCategoryBookCount(category.bookCount, locale)}</small>
              ) : null}
              <span>{category.label}</span>
              <p>{category.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-section home-stats-section">
        <div className="home-section-heading home-stats-copy">
          <span className="home-section-kicker">{text.statsEyebrow}</span>
          <h2>{text.statsTitle}</h2>
          <p>{text.statsDescription}</p>
        </div>

        <div className="home-metrics-grid">
          {statItems.map((item) => (
            <MetricCard Icon={item.Icon} key={item.key} label={item.label} value={item.value} />
          ))}
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-heading">
          <span className="home-section-kicker">{text.featuresEyebrow}</span>
          <h2>{text.featuresTitle}</h2>
        </div>

        <div className="home-feature-grid">
          {text.features.map((feature, index) => {
            const Icon = FEATURE_ICONS[index] ?? BookIcon;

            return (
              <article className="home-feature-card" key={feature.title}>
                <span className="home-feature-icon">
                  <Icon />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="home-final-cta">
        <div>
          <h2>{text.finalTitle}</h2>
          <p>{text.finalDescription}</p>
        </div>
        <div className="home-final-actions">
          <Link className="button home-primary-button" to="/catalog">
            {text.openCatalog}
          </Link>
          {!isAuthenticated ? (
            <Link className="button button-secondary home-secondary-button" to="/register">
              {text.createAccount}
            </Link>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ Icon, label, value }) {
  return (
    <article className="home-metric-card">
      <span className="home-metric-icon">
        <Icon />
      </span>
      <strong className="home-metric-value">{formatApproximateCount(value)}</strong>
      <span className="home-metric-label">{label}</span>
    </article>
  );
}

function formatApproximateCount(value) {
  const numericValue = Number(value) || 0;

  if (numericValue <= 0) {
    return "0+";
  }

  if (numericValue < 10) {
    return `${numericValue}+`;
  }

  if (numericValue < 100) {
    return `${Math.floor(numericValue / 10) * 10}+`;
  }

  if (numericValue < 1000) {
    return `${Math.floor(numericValue / 100) * 100}+`;
  }

  return `${Math.floor(numericValue / 1000)}k+`;
}

function buildCategoryCards(popularCategories, categories, locale) {
  const availableCategories = (categories.length ? categories : FALLBACK_CATEGORIES)
    .filter(isVisibleBookCategory);
  const availableByKey = new Map(
    availableCategories.map((category) => [normalizeBookCategoryKey(category), category])
  );
  const popularItems = (popularCategories ?? [])
    .map((item) => ({
      category: availableByKey.get(normalizeBookCategoryKey(item.category)),
      bookCount: Number(item.books) || 0
    }))
    .filter((item) => item.category && item.bookCount > 0);

  const pickedByKey = new Set();
  const picked = [];

  for (const item of popularItems) {
    const key = normalizeBookCategoryKey(item.category);

    if (!pickedByKey.has(key)) {
      picked.push(item);
      pickedByKey.add(key);
    }
  }

  const randomFill = shuffleCategories(
    availableCategories.filter((category) => !pickedByKey.has(normalizeBookCategoryKey(category)))
  ).map((category) => ({ category, bookCount: 0 }));

  const finalCategories = [...picked, ...randomFill].slice(0, CATEGORY_CARD_LIMIT);

  return finalCategories.map(({ category, bookCount }) => {
    const key = normalizeBookCategoryKey(category);
    const visual = CATEGORY_VISUALS[key] ?? CATEGORY_VISUALS.DEFAULT;
    const taglineMap = CATEGORY_TAGLINES[key] ?? {
      en: "A shelf to open when you want something different.",
      de: "Ein Regal für den Moment, in dem es etwas anderes sein soll.",
      ru: "Полка на случай, когда хочется открыть что-то новое."
    };

    return {
      value: category,
      label: formatBookCategoryLabel(category, locale, category),
      tagline: taglineMap[locale] ?? taglineMap.en,
      image: getCategoryImageUrl(category),
      position: visual.position,
      tint: visual.tint,
      bookCount
    };
  });
}

function shuffleCategories(categories) {
  return [...categories].sort(() => Math.random() - 0.5);
}

function getCategoryImageUrl(category) {
  return `${CATEGORY_IMAGE_BASE_PATH}/${getBookCategoryImageSlug(category)}.jpg`;
}

function formatCategoryBookCount(value, locale) {
  const formattedValue = formatApproximateCount(value);

  if (locale === "ru") {
    return `${formattedValue} книг`;
  }

  if (locale === "de") {
    return `${formattedValue} Bücher`;
  }

  return `${formattedValue} books`;
}

function buildStatItems(metadata, text) {
  const statistics = metadata?.statistics;
  const categoriesCount = metadata?.bookCategories?.length;

  return [
    {
      key: "users",
      label: text.stats.users,
      value: statistics?.users
    },
    {
      key: "books",
      label: text.stats.books,
      value: statistics?.books
    },
    {
      key: "exchanges",
      label: text.stats.exchanges,
      value: statistics?.exchanges
    },
    {
      key: "categories",
      label: text.stats.categories,
      value: categoriesCount
    }
  ].map((item) => ({ ...item, Icon: STAT_ICONS[item.key] ?? BookIcon }));
}
