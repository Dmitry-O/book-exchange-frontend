import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { DEFAULT_PAGE_SIZE } from "../../shared/api/config";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { rt } from "../../shared/i18n/rawText";
import {
  buildBookCategoryOptions,
  formatBookCategoryLabel,
  getBookCategoryTagStyle
} from "../../shared/lib/bookCategory";
import { getCityDisplayName, normalizeCityQueryValue } from "../../shared/lib/cities";
import {
  buildBookSortOptions,
  getCurrentPublicationYear,
  getPublicationYearSuggestions,
  getTransferConditionLabel,
  getTransferConditionOptions,
  parsePublicationYearInput,
  sanitizePublicationYearInput
} from "../../shared/lib/bookSearchUi";
import { buildQueryString } from "../../shared/lib/format";
import { useInfiniteScroll } from "../../shared/lib/useInfiniteScroll";
import { CityField } from "../../shared/ui/CityField";
import { FilterIcon, GiftIcon, SearchIcon, SortDirectionIcon, XIcon } from "../../shared/ui/Icons";
import { BookCover, UserIdentityInline } from "../../shared/ui/Media";
import { PrettySelect } from "../../shared/ui/PrettySelect";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";
import { YearSuggestionField } from "../../shared/ui/YearSuggestionField";

const initialFilters = {
  author: "",
  category: "",
  city: "",
  publicationYear: "",
  isGift: ""
};

const initialSort = {
  sortBy: "",
  sortDirection: "ASC"
};

const YEAR_SUGGESTIONS = getPublicationYearSuggestions();

const catalogPageText = {
  de: {
    allLoaded: "Alle passenden Bücher sind geladen.",
    description:
      "Durchsuche Angebote, vergleiche Bücher und öffne direkt die Detailseiten für Tausch oder Geschenk.",
    filtersHide: "Filter ausblenden",
    filtersShow: "Filter anzeigen",
    heroEyebrow: "Katalog",
    heroTitle: "Finde ein Buch, das schon auf neue Leser wartet.",
    heroFacts: [
      "Nach Titel und Beschreibung suchen",
      "Nach Genre, Stadt, Jahr, Geschenkangeboten und mehr filtern",
      "Bücher tauschen oder Geschenkangebote finden"
    ],
    loadingMore: "Weitere Bücher werden geladen...",
    searchPlaceholder: "Nach Titel oder Beschreibung suchen...",
    sortFieldAria: "Sortierfeld",
    sortPlaceholder: "Sortierfeld auswählen",
    sortToggleDescending: "Absteigend sortieren",
    sortToggleAscending: "Aufsteigend sortieren",
    yearHint: `Vier gültige Ziffern zwischen 0001 und ${getCurrentPublicationYear()} eingeben`
  },
  en: {
    allLoaded: "All matching books are loaded",
    description:
      "Browse listings, compare books, and open detail pages when you want to exchange or request a gift.",
    filtersHide: "Hide filters",
    filtersShow: "Show filters",
    heroEyebrow: "Catalog",
    heroTitle: "Find a book that is already waiting for a new reader.",
    heroFacts: [
      "Search titles and descriptions",
      "Filter by genre, city, year, gifts, and more",
      "Exchange books or find gift offers"
    ],
    loadingMore: "Loading more books...",
    searchPlaceholder: "Search by title or description...",
    sortFieldAria: "Sort field",
    sortPlaceholder: "Choose a sort field",
    sortToggleDescending: "Sort descending",
    sortToggleAscending: "Sort ascending",
    yearHint: `Enter 4 valid digits between 0001 and ${getCurrentPublicationYear()}`
  },
  ru: {
    allLoaded: "Все подходящие книги уже загружены",
    description:
      "Ищите интересные книги, настраивайте каталог под себя и открывайте объявления для обмена или запроса подарка.",
    filtersHide: "Скрыть фильтры",
    filtersShow: "Показать фильтры",
    heroEyebrow: "Каталог",
    heroTitle: "Найдите книгу, которая уже ждет нового читателя.",
    heroFacts: [
      "Ищите по названию и описанию",
      "Фильтруйте по жанру, городу, году, подаркам и не только",
      "Меняйтесь книгами или находите подарочные предложения"
    ],
    loadingMore: "Подгружаем ещё книги...",
    searchPlaceholder: "Искать по названию или описанию...",
    sortFieldAria: "Поле сортировки",
    sortPlaceholder: "Выберите поле сортировки",
    sortToggleDescending: "Сортировать по убыванию",
    sortToggleAscending: "Сортировать по возрастанию",
    yearHint: `Введите 4 корректные цифры от 0001 до ${getCurrentPublicationYear()}`
  }
};

export function CatalogPage() {
  const metadataQuery = useMetadataQuery();
  const { locale, t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => getCatalogFiltersFromSearchParams(searchParams));
  const [draftFilters, setDraftFilters] = useState(() => getCatalogFiltersFromSearchParams(searchParams));
  const [searchText, setSearchText] = useState(() => getCatalogSearchTextFromSearchParams(searchParams));
  const [appliedSearchText, setAppliedSearchText] = useState(() =>
    getCatalogSearchTextFromSearchParams(searchParams).trim()
  );
  const [sortState, setSortState] = useState(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(() => hasCatalogFiltersInSearchParams(searchParams));
  const text = catalogPageText[locale] ?? catalogPageText.en;

  const normalizedFilters = useMemo(() => normalizeCatalogFilters(filters), [filters]);
  const normalizedDraftFilters = useMemo(() => normalizeCatalogFilters(draftFilters), [draftFilters]);
  const normalizedInitialFilters = useMemo(() => normalizeCatalogFilters(initialFilters), []);
  const normalizedSearchText = useMemo(() => String(searchText ?? "").trim(), [searchText]);
  const normalizedPublicationYear = useMemo(
    () => parsePublicationYearInput(normalizedFilters.publicationYear),
    [normalizedFilters.publicationYear]
  );
  const normalizedDraftPublicationYear = useMemo(
    () => parsePublicationYearInput(normalizedDraftFilters.publicationYear),
    [normalizedDraftFilters.publicationYear]
  );

  const categoryOptions = useMemo(
    () =>
      buildBookCategoryOptions(
        metadataQuery.data?.bookCategories ?? [],
        locale,
        t("catalog.all"),
        draftFilters.category
      ),
    [draftFilters.category, locale, metadataQuery.data?.bookCategories, t]
  );

  const transferConditionOptions = useMemo(
    () => getTransferConditionOptions(locale, t("catalog.all")),
    [locale, t]
  );

  const sortOptions = useMemo(
    () =>
      buildBookSortOptions(metadataQuery.data?.bookSortFields ?? [], locale, {
        emptyLabel: text.sortPlaceholder,
        includeUpdated: false
      }),
    [locale, metadataQuery.data?.bookSortFields, text.sortPlaceholder]
  );

  const booksQuery = useInfiniteQuery({
    queryKey: [
      "catalog",
      appliedSearchText,
      normalizedFilters.author,
      normalizedFilters.category,
      normalizedFilters.city,
      normalizedFilters.isGift,
      sortState.sortBy,
      sortState.sortDirection,
      normalizedPublicationYear
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const queryString = buildQueryString({
        pageIndex: pageParam,
        pageSize: DEFAULT_PAGE_SIZE,
        author: normalizedFilters.author || undefined,
        category: normalizedFilters.category || undefined,
        city: normalizedFilters.city || undefined,
        isGift: normalizedFilters.isGift === "" ? undefined : normalizedFilters.isGift === "true",
        publicationYear: normalizedPublicationYear,
        searchText: appliedSearchText || undefined,
        sortBy: sortState.sortBy || undefined,
        sortDirection: sortState.sortBy ? sortState.sortDirection : undefined
      });

      const response = await apiRequest(`/book/search?${queryString}`, { auth: true });
      return response.data;
    },
    getNextPageParam: (lastPage, pages) =>
      pages.length < (lastPage?.totalPages ?? 0) ? pages.length : undefined
  });

  const books = useMemo(
    () => (booksQuery.data?.pages ?? []).flatMap((page) => page.content ?? []),
    [booksQuery.data?.pages]
  );
  const totalElements = booksQuery.data?.pages?.[0]?.totalElements ?? 0;
  const hasYearError =
    Boolean(normalizedDraftFilters.publicationYear) && normalizedDraftPublicationYear === undefined;
  const hasPendingFilterChanges = !areCatalogFiltersEqual(normalizedFilters, normalizedDraftFilters);
  const canSearch = normalizedSearchText.length === 0 || normalizedSearchText.length >= 3;
  const hasSearchChanges = normalizedSearchText !== appliedSearchText;
  const loadMoreRef = useInfiniteScroll({
    enabled: !booksQuery.isPending && !booksQuery.error,
    hasNextPage: booksQuery.hasNextPage,
    isFetchingNextPage: booksQuery.isFetchingNextPage,
    onLoadMore: () => void booksQuery.fetchNextPage()
  });

  useEffect(() => {
    const nextFilters = getCatalogFiltersFromSearchParams(searchParams);
    const nextSearchText = getCatalogSearchTextFromSearchParams(searchParams);

    setFilters(nextFilters);
    setDraftFilters(nextFilters);
    setSearchText(nextSearchText);
    setAppliedSearchText(nextSearchText.trim());

    if (hasCatalogFiltersInSearchParams(searchParams)) {
      setFiltersOpen(true);
    }
  }, [searchParams]);

  function updateDraftFilter(name, value) {
    setDraftFilters((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleApplyFilters() {
    if (hasYearError) {
      return;
    }

    const nextFilters = prepareCatalogFiltersForState(draftFilters);
    setDraftFilters(nextFilters);
    setFilters(nextFilters);
    syncCatalogSearchParams(appliedSearchText, nextFilters);
  }

  function handleResetFilters() {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    syncCatalogSearchParams(appliedSearchText, initialFilters);
  }

  function handleSearch() {
    if (!canSearch) {
      return;
    }

    setAppliedSearchText(normalizedSearchText);
    syncCatalogSearchParams(normalizedSearchText, filters);
  }

  function handleClearSearch() {
    setSearchText("");
    setAppliedSearchText("");
    syncCatalogSearchParams("", filters);
  }

  function syncCatalogSearchParams(nextSearchText, nextFilters) {
    setSearchParams(buildCatalogSearchParams(nextSearchText, nextFilters), { replace: true });
  }

  return (
    <section className="content-stack catalog-page">
      <header className="catalog-hero">
        <div className="catalog-hero-copy">
          <span className="home-eyebrow">{text.heroEyebrow}</span>
          <h1>{text.heroTitle}</h1>
          <p>{text.description}</p>
        </div>
        <div className="catalog-hero-facts">
          {text.heroFacts.map((fact, index) => {
            const Icon = [SearchIcon, FilterIcon, GiftIcon][index] ?? SearchIcon;

            return (
              <span key={fact}>
                <Icon />
                {fact}
              </span>
            );
          })}
        </div>
      </header>

      <section className="section-card catalog-controls-card">
        <div className="catalog-search-stack">
          <div className="catalog-search-shell">
            <input
              aria-label={t("catalog.searchText")}
              className="field-control catalog-search-input"
              onChange={(event) => setSearchText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSearch();
                }
              }}
              placeholder={text.searchPlaceholder}
              value={searchText}
            />
            {searchText ? (
              <button
                aria-label={rt(locale, "Clear")}
                className="catalog-search-clear"
                onClick={handleClearSearch}
                title={rt(locale, "Clear")}
                type="button"
              >
                <XIcon />
              </button>
            ) : null}
            <button
              aria-label={rt(locale, "Search")}
              className="catalog-search-submit"
              disabled={!canSearch || !hasSearchChanges}
              onClick={handleSearch}
              title={rt(locale, "Search")}
              type="button"
            >
              <SearchIcon />
            </button>
            <button
              aria-expanded={filtersOpen}
              aria-label={filtersOpen ? text.filtersHide : text.filtersShow}
              className={`catalog-filter-toggle${filtersOpen ? " catalog-filter-toggle-active" : ""}`}
              onClick={() => setFiltersOpen((current) => !current)}
              title={filtersOpen ? text.filtersHide : text.filtersShow}
              type="button"
            >
              <FilterIcon />
            </button>
          </div>

          {filtersOpen ? (
            <div className="catalog-filters-panel">
              <div className="filters-grid">
                <Field
                  className="filter-field-span-2"
                  label={t("catalog.author")}
                  onChange={(value) => updateDraftFilter("author", value)}
                  value={draftFilters.author}
                />
                <SelectField
                  className="filter-field-span-2"
                  label={t("catalog.category")}
                  onChange={(value) => updateDraftFilter("category", value)}
                  options={categoryOptions}
                  value={draftFilters.category}
                />
                <CityField
                  className="filter-field-span-2"
                  label={t("catalog.city")}
                  onChange={(value) => updateDraftFilter("city", value)}
                  value={draftFilters.city}
                />
                <PublicationYearField
                  className="filter-field-year"
                  hint={text.yearHint}
                  label={t("catalog.publicationYear")}
                  onChange={(value) => updateDraftFilter("publicationYear", value)}
                  value={draftFilters.publicationYear}
                />
                <SelectField
                  className="filter-field-transfer"
                  label={getTransferConditionLabel(locale)}
                  onChange={(value) => updateDraftFilter("isGift", value)}
                  options={transferConditionOptions}
                  value={draftFilters.isGift}
                />
              </div>

              <div className="catalog-actions-bar">
                <div className="filters-actions">
                  <button
                    className="button"
                    disabled={hasYearError || !hasPendingFilterChanges}
                    onClick={handleApplyFilters}
                    type="button"
                  >
                    {rt(locale, "Apply filters")}
                  </button>
                  <button
                    className="button button-secondary"
                    onClick={handleResetFilters}
                    type="button"
                  >
                    {t("catalog.resetFilters")}
                  </button>
                </div>
                {hasYearError ? <span className="muted-line">{text.yearHint}</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="catalog-results-toolbar">
        <span className="muted-line">{t("catalog.booksMatched", { count: totalElements })}</span>

        <div className="catalog-sort-controls">
          <PrettySelect
            ariaLabel={text.sortFieldAria}
            className="catalog-sort-select"
            onChange={(nextValue) =>
              setSortState((current) => ({ ...current, sortBy: nextValue }))
            }
            options={sortOptions}
            value={sortState.sortBy}
          />

          <button
            aria-label={
              sortState.sortDirection === "ASC"
                ? text.sortToggleDescending
                : text.sortToggleAscending
            }
            className="icon-button catalog-sort-direction-button"
            disabled={!sortState.sortBy}
            onClick={() =>
              setSortState((current) => ({
                ...current,
                sortDirection: current.sortDirection === "ASC" ? "DESC" : "ASC"
              }))
            }
            title={
              sortState.sortDirection === "ASC"
                ? text.sortToggleDescending
                : text.sortToggleAscending
            }
            type="button"
          >
            <SortDirectionIcon direction={sortState.sortDirection} />
          </button>
        </div>
      </div>

      {booksQuery.isPending ? <LoadingBlock label={t("catalog.loading")} /> : null}
      {booksQuery.error ? <ErrorBlock error={booksQuery.error} title={t("catalog.requestFailed")} /> : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          description={t("catalog.noBooksDescription")}
          title={t("catalog.noBooks")}
        />
      ) : null}

      {books.length > 0 ? (
        <>
          <section className="book-grid">
            {books.map((book) => (
              <Link className="book-card book-card-link" key={book.id} to={`/book/${book.id}`}>
                <BookCover className="book-card-cover" photoUrl={book.photoUrl} size="card" title={book.name} />

                <div className="book-card-head">
                  <div className="book-card-statuses">
                    {book.isGift ? (
                      <span
                        aria-label={t("catalog.gift")}
                        className="gift-icon-badge gift-icon-badge-small"
                        title={t("catalog.gift")}
                      >
                        <GiftIcon />
                      </span>
                    ) : null}
                    <span className="category-chip" style={getBookCategoryTagStyle(book.category)}>
                      {formatBookCategoryLabel(book.category, locale, t("common.notAvailable"))}
                    </span>
                    <span className="subtle-chip">
                      {book.city ? getCityDisplayName(book.city, locale) : t("catalog.noCity")}
                    </span>
                  </div>
                </div>

                <h2>{book.name}</h2>
                <p className="book-meta book-meta-compact">
                  {formatAuthorYear(locale, book.author, book.publicationYear, t("catalog.unknownYear"))}
                </p>

                <div className="book-owner">
                  <UserIdentityInline name={book.ownerNickname} photoUrl={book.ownerPhotoUrl} size="sm">
                    <strong>{book.ownerNickname || t("catalog.unknownOwner")}</strong>
                  </UserIdentityInline>
                </div>
              </Link>
            ))}
          </section>

          <div className="infinite-scroll-status" ref={loadMoreRef}>
            {booksQuery.isFetchingNextPage
              ? text.loadingMore
              : booksQuery.hasNextPage
                ? ""
                : text.allLoaded}
          </div>
        </>
      ) : null}
    </section>
  );
}

function normalizeCatalogFilters(filters) {
  return {
    ...filters,
    author: String(filters.author ?? "").trim(),
    city: normalizeCityQueryValue(filters.city),
    publicationYear: sanitizePublicationYearInput(filters.publicationYear)
  };
}

function prepareCatalogFiltersForState(filters) {
  return {
    ...filters,
    author: String(filters.author ?? "").trim(),
    publicationYear: sanitizePublicationYearInput(filters.publicationYear)
  };
}

function areCatalogFiltersEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getCatalogSearchTextFromSearchParams(searchParams) {
  return searchParams.get("searchText") ?? searchParams.get("q") ?? "";
}

function getCatalogFiltersFromSearchParams(searchParams) {
  return {
    author: searchParams.get("author") ?? "",
    category: searchParams.get("category") ?? "",
    city: searchParams.get("city") ?? "",
    publicationYear: sanitizePublicationYearInput(searchParams.get("publicationYear") ?? ""),
    isGift: normalizeBooleanSearchParam(searchParams.get("isGift"))
  };
}

function normalizeBooleanSearchParam(value) {
  return value === "true" || value === "false" ? value : "";
}

function buildCatalogSearchParams(searchText, filters) {
  const params = new URLSearchParams();
  const normalizedSearchText = String(searchText ?? "").trim();
  const normalizedFilters = normalizeCatalogFilters(filters);

  if (normalizedSearchText) {
    params.set("searchText", normalizedSearchText);
  }

  Object.entries(normalizedFilters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });

  return params;
}

function hasCatalogFiltersInSearchParams(searchParams) {
  return ["author", "category", "city", "publicationYear", "isGift"].some((key) =>
    Boolean(searchParams.get(key))
  );
}

function formatAuthorYear(locale, author, publicationYear, fallbackYear) {
  const authorLabel = author || rt(locale, "Unknown author");

  return publicationYear ? `${authorLabel}, ${publicationYear}` : `${authorLabel}, ${fallbackYear}`;
}

function Field({ className = "", label, onChange, value }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      <input
        className="field-control"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function PublicationYearField({ className = "", hint, label, onChange, value }) {
  const hasError = Boolean(value) && parsePublicationYearInput(value) === undefined;

  return (
    <YearSuggestionField
      className={className}
      hint={hint}
      isInvalid={hasError}
      label={label}
      onChange={onChange}
      sanitizeValue={sanitizePublicationYearInput}
      suggestions={YEAR_SUGGESTIONS}
      value={value}
    />
  );
}

function SelectField({ className = "", label, onChange, options, value }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      <PrettySelect ariaLabel={label} onChange={onChange} options={options} value={value} />
    </label>
  );
}
