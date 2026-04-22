import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { useLocale } from "../../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../../shared/i18n/rawText";
import {
  buildBookCategoryOptions,
  formatBookCategoryLabel,
  getBookCategoryTagStyle,
  getBookCategoryUiLabel
} from "../../../shared/lib/bookCategory";
import { getCityDisplayName, normalizeCityQueryValue } from "../../../shared/lib/cities";
import {
  buildBookSortOptions,
  getBookTypeLabel,
  getCurrentPublicationYear,
  getPublicationYearSuggestions,
  getTransferConditionLabel,
  getTransferConditionOptions,
  parsePublicationYearInput,
  sanitizePublicationYearInput
} from "../../../shared/lib/bookSearchUi";
import { buildQueryString, formatDateTimeReadable, formatEnumLabel } from "../../../shared/lib/format";
import { useInfiniteScroll } from "../../../shared/lib/useInfiniteScroll";
import { ImageUploadField } from "../../../shared/ui/ImageUploadField";
import { CityField } from "../../../shared/ui/CityField";
import { BookCover, UserIdentityInline } from "../../../shared/ui/Media";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  FilterIcon,
  GiftIcon,
  RestoreIcon,
  SearchIcon,
  SortDirectionIcon,
  TrashIcon,
  UserIcon,
  XIcon
} from "../../../shared/ui/Icons";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../../shared/ui/StateBlocks";

const defaultFilters = {
  bookType: "ALL",
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

const emptyBookForm = {
  name: "",
  description: "",
  author: "",
  category: "",
  publicationYear: "",
  photoBase64: null,
  photoUrl: "",
  city: "",
  contactDetails: "",
  isGift: false
};

const YEAR_SUGGESTIONS = getPublicationYearSuggestions();

const adminCatalogText = {
  de: {
    allLoaded: "Alle passenden Bücher sind geladen.",
    description:
      "Durchsuche den Katalog, prüfe Einträge und öffne einzelne Buchseiten für Moderationsentscheidungen.",
    filtersHide: "Filter ausblenden",
    filtersShow: "Filter anzeigen",
    loadingMore: "Weitere Bücher werden geladen...",
    searchPlaceholder: "Buchtitel eingeben...",
    sortFieldAria: "Sortierfeld",
    sortPlaceholder: "Sortierfeld auswählen",
    sortToggleDescending: "Absteigend sortieren",
    sortToggleAscending: "Aufsteigend sortieren",
    yearHint: `Vier gültige Ziffern zwischen 0001 und ${getCurrentPublicationYear()} eingeben`
  },
  en: {
    allLoaded: "All matching books are loaded",
    description:
      "Search the catalog, review listings, and open any book page when moderation work is needed.",
    filtersHide: "Hide filters",
    filtersShow: "Show filters",
    loadingMore: "Loading more books...",
    searchPlaceholder: "Enter book title...",
    sortFieldAria: "Sort field",
    sortPlaceholder: "Choose a sort field",
    sortToggleDescending: "Sort descending",
    sortToggleAscending: "Sort ascending",
    yearHint: `Enter 4 valid digits between 0001 and ${getCurrentPublicationYear()}`
  },
  ru: {
    allLoaded: "Все подходящие книги уже загружены",
    description:
      "Проверяйте каталог, находите нужные объявления и открывайте страницы книг для модерации без лишних действий.",
    filtersHide: "Скрыть фильтры",
    filtersShow: "Показать фильтры",
    loadingMore: "Подгружаем ещё книги...",
    searchPlaceholder: "Введите название книги...",
    sortFieldAria: "Поле сортировки",
    sortPlaceholder: "Выберите поле сортировки",
    sortToggleDescending: "Сортировать по убыванию",
    sortToggleAscending: "Сортировать по возрастанию",
    yearHint: `Введите 4 корректные цифры от 0001 до ${getCurrentPublicationYear()}`
  }
};

export function AdminBooksPage() {
  const metadataQuery = useMetadataQuery();
  const { locale } = useLocale();
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [searchText, setSearchText] = useState("");
  const [appliedSearchText, setAppliedSearchText] = useState("");
  const [sortState, setSortState] = useState(initialSort);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const text = adminCatalogText[locale] ?? adminCatalogText.en;

  const normalizedFilters = useMemo(() => normalizeAdminBookFilters(filters), [filters]);
  const normalizedDraftFilters = useMemo(
    () => normalizeAdminBookFilters(draftFilters),
    [draftFilters]
  );
  const normalizedInitialFilters = useMemo(
    () => normalizeAdminBookFilters(defaultFilters),
    []
  );
  const normalizedSearchText = useMemo(() => String(searchText ?? "").trim(), [searchText]);
  const normalizedPublicationYear = useMemo(
    () => parsePublicationYearInput(normalizedFilters.publicationYear),
    [normalizedFilters.publicationYear]
  );
  const normalizedDraftPublicationYear = useMemo(
    () => parsePublicationYearInput(normalizedDraftFilters.publicationYear),
    [normalizedDraftFilters.publicationYear]
  );

  const bookTypes = metadataQuery.data?.bookTypes ?? ["ACTIVE", "DELETED", "ALL"];
  const categoryFilterOptions = useMemo(
    () =>
      buildBookCategoryOptions(
        metadataQuery.data?.bookCategories ?? [],
        locale,
        getBookCategoryUiLabel("all", locale),
        draftFilters.category
      ),
    [draftFilters.category, locale, metadataQuery.data?.bookCategories]
  );
  const transferConditionOptions = useMemo(
    () => getTransferConditionOptions(locale, getBookCategoryUiLabel("all", locale)),
    [locale]
  );
  const sortOptions = useMemo(
    () =>
      buildBookSortOptions(metadataQuery.data?.bookSortFields ?? [], locale, {
        emptyLabel: text.sortPlaceholder
      }),
    [locale, metadataQuery.data?.bookSortFields, text.sortPlaceholder]
  );

  const booksQuery = useInfiniteQuery({
    queryKey: [
      "admin-books",
      normalizedFilters.bookType,
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
      const query = buildQueryString({
        pageIndex: pageParam,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        bookType: normalizedFilters.bookType === "ALL" ? undefined : normalizedFilters.bookType,
        searchText: appliedSearchText || undefined,
        author: normalizedFilters.author || undefined,
        category: normalizedFilters.category || undefined,
        city: normalizedFilters.city || undefined,
        publicationYear: normalizedPublicationYear,
        isGift: normalizedFilters.isGift === "" ? undefined : normalizedFilters.isGift === "true",
        sortBy: sortState.sortBy || undefined,
        sortDirection: sortState.sortBy ? sortState.sortDirection : undefined
      });
      const response = await apiRequest(`/admin/books/search?${query}`, { auth: true });

      return response.data;
    },
    getNextPageParam: (lastPage, pages) =>
      pages.length < (lastPage?.totalPages ?? 0) ? pages.length : undefined
  });

  function handleApplyFilters() {
    if (hasYearError) {
      return;
    }

    setDraftFilters(normalizedDraftFilters);
    setFilters(normalizedDraftFilters);
  }

  function handleResetFilters() {
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  }

  function handleSearch() {
    if (!canSearch) {
      return;
    }

    setAppliedSearchText(normalizedSearchText);
  }

  function handleClearSearch() {
    setSearchText("");
    setAppliedSearchText("");
  }

  function updateDraftFilter(name, value) {
    setDraftFilters((current) => ({
      ...current,
      [name]: value
    }));
  }

  const books = useMemo(
    () => (booksQuery.data?.pages ?? []).flatMap((page) => page.content ?? []),
    [booksQuery.data?.pages]
  );
  const totalElements = booksQuery.data?.pages?.[0]?.totalElements ?? 0;
  const hasYearError =
    Boolean(normalizedDraftFilters.publicationYear) && normalizedDraftPublicationYear === undefined;
  const hasPendingFilterChanges = !areAdminBookFiltersEqual(normalizedFilters, normalizedDraftFilters);
  const canSearch = normalizedSearchText.length === 0 || normalizedSearchText.length >= 3;
  const hasSearchChanges = normalizedSearchText !== appliedSearchText;
  const hasAppliedCatalogContext =
    Boolean(appliedSearchText) || !areAdminBookFiltersEqual(normalizedFilters, normalizedInitialFilters);
  const loadMoreRef = useInfiniteScroll({
    enabled: !booksQuery.isPending && !booksQuery.error,
    hasNextPage: booksQuery.hasNextPage,
    isFetchingNextPage: booksQuery.isFetchingNextPage,
    onLoadMore: () => void booksQuery.fetchNextPage()
  });

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{rt(locale, "Book moderation")}</h1>
        <p>{text.description}</p>
      </header>

      <section className="section-card catalog-controls-card">
        <div className="catalog-search-stack">
          <div className="catalog-search-shell">
            <input
              aria-label={rt(locale, "Search text")}
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
                <FilterSelectField
                  className="filter-field-span-2"
                  label={rt(locale, "Book type")}
                  onChange={(value) => updateDraftFilter("bookType", value)}
                  options={bookTypes.map((bookType) => ({
                    label: getBookTypeLabel(bookType, locale),
                    value: bookType
                  }))}
                  value={draftFilters.bookType}
                />
                <FilterField
                  className="filter-field-span-2"
                  label={rt(locale, "Author")}
                  onChange={(value) => updateDraftFilter("author", value)}
                  value={draftFilters.author}
                />
                <FilterSelectField
                  className="filter-field-span-2"
                  label={rt(locale, "Category")}
                  onChange={(value) => updateDraftFilter("category", value)}
                  options={categoryFilterOptions}
                  value={draftFilters.category}
                />
                <CityField
                  className="filter-field-span-2"
                  compactDropdown
                  label={rt(locale, "City")}
                  onChange={(value) => updateDraftFilter("city", value)}
                  value={draftFilters.city}
                />
                <FilterPublicationYearField
                  className="filter-field-year"
                  hint={text.yearHint}
                  label={rt(locale, "Publication year")}
                  onChange={(value) => updateDraftFilter("publicationYear", value)}
                  value={draftFilters.publicationYear}
                />
                <FilterSelectField
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
                    {rt(locale, "Reset")}
                  </button>
                </div>
                {hasYearError ? <span className="muted-line">{text.yearHint}</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="catalog-results-toolbar">
        {hasAppliedCatalogContext ? (
          <span className="muted-line">{rtf(locale, "Found books: {count}", { count: totalElements })}</span>
        ) : (
          <span />
        )}

        <div className="catalog-sort-controls">
          <select
            aria-label={text.sortFieldAria}
            className="field-control catalog-sort-select"
            onChange={(event) =>
              setSortState((current) => ({ ...current, sortBy: event.target.value }))
            }
            value={sortState.sortBy}
          >
            {sortOptions.map((option) => (
              <option key={`admin-sort-${option.value || "empty"}`} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

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

      {metadataQuery.isPending ? <LoadingBlock label={rt(locale, "Loading book metadata")} /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title={rt(locale, "Book metadata could not be loaded")} />
      ) : null}
      {booksQuery.isPending ? <LoadingBlock label={rt(locale, "Loading moderated books")} /> : null}
      {booksQuery.error ? <ErrorBlock error={booksQuery.error} title={rt(locale, "Admin books could not be loaded")} /> : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "No books match these filters")}
          description={rt(locale, "Try resetting the filters or changing the book type, search, or sort combination.")}
        />
      ) : null}

      {books.length > 0 ? (
        <>
          <section className="admin-book-grid">
            {books.map((book) => {
              const deleted = isBookDeleted(book);

              return (
                <article
                  className={`section-card compact-card admin-book-list-card${
                    deleted ? " admin-book-list-card-deleted" : ""
                  }`}
                  key={book.id}
                >
                  <Link className="book-card-cover-link" to={`/admin/books/${book.id}`}>
                    <BookCover className="book-card-cover" photoUrl={book.photoUrl} size="card" title={book.name} />
                  </Link>

                  <div className="book-card-head">
                    <div className="book-card-statuses">
                      {book.isGift ? (
                        <span
                          aria-label={rt(locale, "Gift")}
                          className="gift-icon-badge gift-icon-badge-small"
                          title={rt(locale, "Gift")}
                        >
                          <GiftIcon />
                        </span>
                      ) : null}
                      <span className="category-chip" style={getBookCategoryTagStyle(book.category)}>
                        {formatBookCategoryLabel(
                          book.category,
                          locale,
                          getBookCategoryUiLabel("none", locale)
                        )}
                      </span>
                      <span className="subtle-chip">
                        {book.city ? getCityDisplayName(book.city, locale) : rt(locale, "Not available")}
                      </span>
                    </div>
                  </div>

                  <h2>{book.name || rt(locale, "Untitled book")}</h2>
                  <p className="book-meta book-meta-compact">
                    {book.author || rt(locale, "Unknown author")} / {renderValue(locale, book.publicationYear)}
                  </p>

                  <div className="book-owner">
                    <UserIdentityInline
                      className="admin-book-owner-inline"
                      name={book.ownerNickname}
                      photoUrl={book.ownerPhotoUrl}
                      size="sm"
                    >
                      <strong>{book.ownerNickname || rt(locale, "Unknown owner")}</strong>
                    </UserIdentityInline>
                  </div>

                  <div className="card-actions">
                    <div className="action-icon-group">
                      {book.ownerUserId ? (
                        <Link
                          aria-label={rt(locale, "Open owner")}
                          className="icon-button"
                          title={rt(locale, "Open owner")}
                          to={`/admin/users/${book.ownerUserId}`}
                        >
                          <UserIcon />
                        </Link>
                      ) : null}
                      <Link
                        aria-label={rt(locale, "Open public page")}
                        className="icon-button"
                        title={rt(locale, "Open public page")}
                        to={`/book/${book.id}`}
                      >
                        <ExternalLinkIcon />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
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

function normalizeAdminBookFilters(filters) {
  return {
    ...filters,
    author: String(filters.author ?? "").trim(),
    city: normalizeCityQueryValue(filters.city),
    publicationYear: sanitizePublicationYearInput(filters.publicationYear)
  };
}

function areAdminBookFiltersEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function FilterField({ className = "", label, onChange, value }) {
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

function FilterPublicationYearField({ className = "", hint, label, onChange, value }) {
  const listId = "admin-book-publication-year-options";
  const hasError = Boolean(value) && parsePublicationYearInput(value) === undefined;

  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      <input
        aria-invalid={hasError}
        className="field-control"
        inputMode="numeric"
        list={listId}
        onChange={(event) => onChange(sanitizePublicationYearInput(event.target.value))}
        value={value}
      />
      <datalist id={listId}>
        {YEAR_SUGGESTIONS.map((year) => (
          <option key={year} value={year} />
        ))}
      </datalist>
      {hasError ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

function FilterSelectField({ className = "", label, onChange, options, value }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span>{label}</span>
      <select className="field-control" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={`${label}-${option.value || "empty"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminBookDetailsPage() {
  const queryClient = useQueryClient();
  const { bookId } = useParams();
  const metadataQuery = useMetadataQuery();
  const { locale } = useLocale();
  const [form, setForm] = useState(emptyBookForm);
  const [initialForm, setInitialForm] = useState(emptyBookForm);
  const [pendingAction, setPendingAction] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [moderationError, setModerationError] = useState(null);
  const [moderationMessage, setModerationMessage] = useState("");
  const [photoPending, setPhotoPending] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin-book", String(bookId)],
    enabled: Boolean(bookId),
    queryFn: () => fetchAdminBook(bookId)
  });

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    const nextForm = fromBookToForm(detailQuery.data, locale);
    setForm(nextForm);
    setInitialForm(nextForm);
  }, [detailQuery.data, locale]);

  async function handleSave(event) {
    event.preventDefault();
    setEditError(null);
    setEditMessage("");
    setPhotoError("");
    setPhotoMessage("");

    const payload = toUpdatePayload(form, initialForm);

      if (Object.keys(payload).length === 0) {
        return;
      }

    setPendingAction("save");

    try {
      await apiRequest(`/admin/books/${bookId}`, {
        method: "PATCH",
        auth: true,
        version: detailQuery.data.__version ?? detailQuery.data.version,
        body: payload
      });

      await queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      const nextBook = await queryClient.fetchQuery({
        queryKey: ["admin-book", String(bookId)],
        queryFn: () => fetchAdminBook(bookId)
      });
      const nextForm = fromBookToForm(nextBook, locale);

      setForm(nextForm);
      setInitialForm(nextForm);
      setEditMessage(rt(locale, "Book updated."));
    } catch (error) {
      setEditError(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(rt(locale, "Soft-delete this book from the moderation console?"));

    if (!confirmed) {
      return;
    }

    setModerationError(null);
    setModerationMessage("");
    setPendingAction("delete");

    try {
      await apiRequest(`/admin/books/${bookId}`, {
        method: "DELETE",
        auth: true,
        version: detailQuery.data.__version ?? detailQuery.data.version
      });

      await queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      const nextBook = await queryClient.fetchQuery({
        queryKey: ["admin-book", String(bookId)],
        queryFn: () => fetchAdminBook(bookId)
      });
      const nextForm = fromBookToForm(nextBook, locale);

      setForm(nextForm);
      setInitialForm(nextForm);
      setModerationMessage(rt(locale, "Book deleted."));
    } catch (error) {
      setModerationError(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRestore() {
    const confirmed = window.confirm(rt(locale, "Restore this deleted book?"));

    if (!confirmed) {
      return;
    }

    setModerationError(null);
    setModerationMessage("");
    setPendingAction("restore");

    try {
      await apiRequest(`/admin/books/${bookId}/restore`, {
        method: "PATCH",
        auth: true,
        version: detailQuery.data.__version ?? detailQuery.data.version
      });

      await queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      const nextBook = await queryClient.fetchQuery({
        queryKey: ["admin-book", String(bookId)],
        queryFn: () => fetchAdminBook(bookId)
      });
      const nextForm = fromBookToForm(nextBook, locale);

      setForm(nextForm);
      setInitialForm(nextForm);
      setModerationMessage(rt(locale, "Book restored."));
    } catch (error) {
      setModerationError(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeletePhoto() {
    const confirmed = window.confirm(rt(locale, "Delete the saved photo for this book?"));

    if (!confirmed) {
      return;
    }

    setPhotoPending(true);
    setPhotoError("");
    setPhotoMessage("");
    setEditError(null);
    setEditMessage("");

    try {
      await apiRequest(`/admin/books/${bookId}/photo`, {
        method: "DELETE",
        auth: true,
        version: detailQuery.data.__version ?? detailQuery.data.version
      });

      const nextBook = await queryClient.fetchQuery({
        queryKey: ["admin-book", String(bookId)],
        queryFn: () => fetchAdminBook(bookId)
      });
      const nextPhotoUrl = nextBook.photoUrl ?? "";

      setForm((current) => ({
        ...current,
        photoBase64: null,
        photoUrl: nextPhotoUrl
      }));
      setInitialForm((current) => ({
        ...current,
        photoBase64: null,
        photoUrl: nextPhotoUrl
      }));

      await queryClient.invalidateQueries({ queryKey: ["admin-books"] });
      setPhotoMessage(rt(locale, "Book photo deleted."));
    } catch (error) {
      setPhotoError(error.message);
    } finally {
      setPhotoPending(false);
    }
  }

  if (detailQuery.isPending) {
    return <LoadingBlock label={rt(locale, "Loading admin book details")} />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title={rt(locale, "Admin book details could not be loaded")} />;
  }

  const book = detailQuery.data;
  const deleted = isBookDeleted(book);
  const categoryOptions = buildBookCategoryOptions(
    metadataQuery.data?.bookCategories ?? [],
    locale,
    getBookCategoryUiLabel("select", locale),
    form.category
  );
  const hasChanges = Object.keys(toUpdatePayload(form, initialForm)).length > 0;

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label={rt(locale, "Back to books")} className="back-link" to="/admin/books">
            <ArrowLeftIcon />
          </Link>

          <div className="hero-icon-actions">
            {book.ownerUserId ? (
              <Link
                aria-label={rt(locale, "Open owner")}
                className="icon-button"
                title={rt(locale, "Open owner")}
                to={`/admin/users/${book.ownerUserId}`}
              >
                <UserIcon />
              </Link>
            ) : null}
            <Link
              aria-label={rt(locale, "Open public page")}
              className="icon-button"
              title={rt(locale, "Open public page")}
              to={`/book/${book.id}`}
            >
              <ExternalLinkIcon />
            </Link>
            {deleted ? (
              <button
                aria-label={rt(locale, "Restore book")}
                className="icon-button icon-button-success"
                disabled={pendingAction !== null}
                onClick={() => void handleRestore()}
                title={rt(locale, "Restore book")}
                type="button"
              >
                <RestoreIcon />
              </button>
            ) : (
              <button
                aria-label={rt(locale, "Delete book")}
                className="icon-button icon-button-danger"
                disabled={pendingAction !== null}
                onClick={() => void handleDelete()}
                title={rt(locale, "Delete book")}
                type="button"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </div>

        <div className="book-hero-layout">
          <BookCover expandable photoUrl={book.photoUrl} size="hero" title={book.name} />

          <div>
            <div className="book-hero-tags">
              <span className="category-chip" style={getBookCategoryTagStyle(book.category)}>
                {formatBookCategoryLabel(
                  book.category,
                  locale,
                  getBookCategoryUiLabel("none", locale)
                )}
              </span>
              {book.isGift ? (
                <span aria-label={rt(locale, "Gift")} className="gift-icon-badge" title={rt(locale, "Gift")}>
                  <GiftIcon />
                </span>
              ) : null}
              {book.isExchanged ? (
                <span className="status-pill status-pill-success">{rt(locale, "Exchanged")}</span>
              ) : null}
              {deleted ? <span className="status-pill status-pill-danger">{rt(locale, "Deleted")}</span> : null}
            </div>

            <h1>{book.name || rt(locale, "Untitled book")}</h1>

            <div className="entity-inline entity-inline-spaced book-detail-owner">
              <UserIdentityInline
                className="admin-book-owner-inline"
                name={book.ownerNickname}
                photoUrl={book.ownerPhotoUrl}
                size="sm"
              >
                <strong>{book.ownerNickname || rt(locale, "Unknown owner")}</strong>
              </UserIdentityInline>
            </div>

            <p className="book-detail-description">
              <strong>{rt(locale, "Description")}:</strong>{" "}
              {book.description || rt(locale, "No description provided.")}
            </p>

            <div className="book-hero-facts">
              <p>{rt(locale, "Author")}: {book.author || rt(locale, "Unknown author")}</p>
              <p>{rt(locale, "Publication year")}: {renderValue(locale, book.publicationYear)}</p>
              <p>
                {formatEnumLabel("CITY")}:{" "}
                {book.city ? getCityDisplayName(book.city, locale) : rt(locale, "Not available")}
              </p>
              {book.contactDetails ? <p>{rt(locale, "Contact details")}: {book.contactDetails}</p> : null}
            </div>

            <div className="book-hero-timeline">
              {book.meta?.createdAt ? (
                <p>{rtf(locale, "Created on {value}", { value: formatDateTimeReadable(book.meta?.createdAt) })}</p>
              ) : null}
              {book.meta?.updatedAt ? (
                <p>{rtf(locale, "Updated on {value}", { value: formatDateTimeReadable(book.meta?.updatedAt) })}</p>
              ) : null}
              {book.meta?.deletedAt ? (
                <p>{rtf(locale, "Deleted on {value}", { value: formatDateTimeReadable(book.meta?.deletedAt) })}</p>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {moderationMessage ? <p className="inline-message inline-message-success">{moderationMessage}</p> : null}
      {moderationError ? <ErrorBlock error={moderationError} title={rt(locale, "Book action failed")} /> : null}

      <section className="section-card">
        <form className="content-stack" onSubmit={handleSave}>
          <div className="section-card-header">
            <div className="section-card-header-copy">
              <h2>{rt(locale, "Edit book")}</h2>
              <p>{rt(locale, "Update the information your readers should see in the catalog.")}</p>
            </div>
            <div className="section-card-toolbar">
              <button className="button" disabled={pendingAction !== null || !hasChanges} type="submit">
                {pendingAction === "save" ? rt(locale, "Saving...") : rt(locale, "Save changes")}
              </button>
            </div>
          </div>

          <div className="editor-layout">
            <div className="editor-column">
              <ImageUploadField
                error={photoError}
                entityName={form.name || rt(locale, "Book cover")}
                kind="book"
                label={rt(locale, "Book photo")}
                message={photoMessage}
                onChange={(value) => setForm((current) => ({ ...current, photoBase64: value }))}
                onRemove={handleDeletePhoto}
                photoBase64={form.photoBase64}
                photoUrl={form.photoUrl}
                removePending={photoPending}
              />
            </div>

            <div className="editor-column editor-column-grow">
              <div className="editor-panel editor-panel-form">
                <h3>{rt(locale, "Book details")}</h3>
                <div className="filters-grid editor-form-grid">
                  <Field
                    label={rt(locale, "Name")}
                    onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                    value={form.name}
                  />
                  <Field
                    label={rt(locale, "Author")}
                    onChange={(value) => setForm((current) => ({ ...current, author: value }))}
                    value={form.author}
                  />
                  <SelectField
                    label={rt(locale, "Category")}
                    onChange={(value) => setForm((current) => ({ ...current, category: value }))}
                    options={categoryOptions}
                    value={form.category}
                  />
                  <CityField
                    compactDropdown
                    label={rt(locale, "City")}
                    onChange={(value) => setForm((current) => ({ ...current, city: value }))}
                    value={form.city}
                  />
                  <Field
                    label={rt(locale, "Publication year")}
                    onChange={(value) => setForm((current) => ({ ...current, publicationYear: value }))}
                    type="number"
                    value={form.publicationYear}
                  />
                  <label className="field field-checkbox">
                    <span>{rt(locale, "Gift mode")}</span>
                    <input
                      checked={form.isGift}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, isGift: event.target.checked }))
                      }
                      type="checkbox"
                    />
                  </label>
                  <label className="field editor-field-span-full editor-textarea-field">
                    <span>{rt(locale, "Description")}</span>
                    <textarea
                      className="field-control field-control-textarea"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                      rows={6}
                      value={form.description}
                    />
                  </label>
                  <label className="field editor-field-span-full editor-textarea-field">
                    <span>{rt(locale, "Contact details")}</span>
                    <textarea
                      className="field-control"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, contactDetails: event.target.value }))
                      }
                      rows={5}
                      value={form.contactDetails}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {editMessage ? <p className="inline-message inline-message-success">{editMessage}</p> : null}
          {editError ? <ErrorBlock error={editError} title={rt(locale, "Book action failed")} /> : null}
        </form>
      </section>
    </section>
  );
}

function Field({ label, onChange, type = "text", value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="field-control"
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({ label, onChange, options, required = false, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        className="field-control"
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value || "empty"}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function isBookDeleted(book) {
  return Boolean(book?.meta?.deletedAt);
}

function renderValue(locale, value) {
  return value === null || value === undefined || value === "" ? rt(locale, "Not available") : value;
}

function fromBookToForm(book, locale) {
  return {
    name: book.name ?? "",
    description: book.description ?? "",
    author: book.author ?? "",
    category: book.category ?? "",
    publicationYear: book.publicationYear ? String(book.publicationYear) : "",
    photoBase64: null,
    photoUrl: book.photoUrl ?? "",
    city: book.city ? getCityDisplayName(book.city, locale) : "",
    contactDetails: book.contactDetails ?? "",
    isGift: Boolean(book.isGift)
  };
}

function toUpdatePayload(form, initialForm) {
  const next = {};
  const fields = [
    "name",
    "description",
    "author",
    "category",
    "publicationYear",
    "city",
    "contactDetails",
    "isGift"
  ];

  fields.forEach((field) => {
    const currentValue = normalizeComparableValue(field, form[field]);
    const initialValue = normalizeComparableValue(field, initialForm[field]);

    if (currentValue === initialValue) {
      return;
    }

    if (field === "publicationYear") {
      next.publicationYear = currentValue === "" ? "" : Number(currentValue);
      return;
    }

    next[field] = currentValue;
  });

  if (form.photoBase64 !== null) {
    next.photoBase64 = normalizeImageChange(form.photoBase64);
  }

  return next;
}

function normalizeComparableValue(field, value) {
  if (field === "isGift") {
    return Boolean(value);
  }

  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return value;
}

function normalizeImageChange(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function fetchAdminBook(bookId) {
  const response = await apiRequest(`/admin/books/${bookId}`, { auth: true });

  return withVersion(response);
}

function withVersion(response) {
  return {
    ...response.data,
    __version: response.eTag ?? response.data?.version ?? null
  };
}
