import { useEffect, useState } from "react";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useAuth } from "../../shared/auth/AuthContext";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { rt, rtf } from "../../shared/i18n/rawText";
import { buildBookCategoryOptions, formatBookCategoryLabel, getBookCategoryTagStyle } from "../../shared/lib/bookCategory";
import { getCityApiValue, getCityDisplayName } from "../../shared/lib/cities";
import { formatDateTimeReadable, formatEnumLabel } from "../../shared/lib/format";
import { useInfiniteScroll } from "../../shared/lib/useInfiniteScroll";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import { CityField } from "../../shared/ui/CityField";
import { BookCover, UserIdentityInline } from "../../shared/ui/Media";
import { ArrowLeftIcon, GiftIcon, PencilIcon, TrashIcon } from "../../shared/ui/Icons";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

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

const infiniteBooksText = {
  de: {
    allLoaded: "Alle deine Bücher sind geladen",
    loadingMore: "Weitere Bücher werden geladen..."
  },
  en: {
    allLoaded: "All your books are loaded",
    loadingMore: "Loading more books..."
  },
  ru: {
    allLoaded: "Все ваши книги уже загружены",
    loadingMore: "Подгружаем ещё книги..."
  }
};

const bookFormText = {
  de: {
    cityRequired: "Wähle eine Stadt aus der Liste aus."
  },
  en: {
    cityRequired: "Choose a city from the list."
  },
  ru: {
    cityRequired: "Выберите город из списка."
  }
};

export function MyBooksPage() {
  const { locale } = useLocale();
  const text = infiniteBooksText[locale] ?? infiniteBooksText.en;

  const booksQuery = useInfiniteQuery({
    queryKey: ["my-books"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const response = await apiRequest(
        `/book/user?pageIndex=${pageParam}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    },
    getNextPageParam: (lastPage, pages) =>
      pages.length < (lastPage?.totalPages ?? 0) ? pages.length : undefined
  });

  const books = (booksQuery.data?.pages ?? []).flatMap((page) => page.content ?? []);
  const loadMoreRef = useInfiniteScroll({
    enabled: !booksQuery.isPending && !booksQuery.error,
    hasNextPage: booksQuery.hasNextPage,
    isFetchingNextPage: booksQuery.isFetchingNextPage,
    onLoadMore: () => void booksQuery.fetchNextPage()
  });

  return (
    <section className="content-stack my-books-page">
      <header className="section-card">
        <div className="section-card-header">
          <div className="section-card-header-copy">
            <h1>{rt(locale, "Manage your inventory")}</h1>
            <p>{rt(locale, "Keep your active books updated and ready for exchanges.")}</p>
          </div>
          <div className="section-card-toolbar my-books-header-actions">
            <Link className="button" to="/app/my-books/new">
              {rt(locale, "Add new book")}
            </Link>
            <Link className="button button-secondary" to="/app/my-books/exchanged">
              {rt(locale, "View exchanged books")}
            </Link>
          </div>
        </div>
      </header>

      {booksQuery.isPending ? <LoadingBlock label={rt(locale, "Loading your books")} /> : null}
      {booksQuery.error ? (
        <ErrorBlock error={booksQuery.error} title={rt(locale, "Books could not be loaded")} />
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "You have not added books yet")}
          description={rt(locale, "Create the first one to start testing the owner-facing CRUD flow.")}
        />
      ) : null}

      {books.length > 0 ? (
        <section className="book-grid">
          {books.map((book) => (
            <article className="book-card" key={book.id}>
              <Link className="book-card-cover-link" to={`/app/my-books/${book.id}`}>
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
                    {formatBookCategoryLabel(book.category, locale, rt(locale, "No category"))}
                  </span>
                  <span className="subtle-chip">
                    {book.city ? getCityDisplayName(book.city, locale) : rt(locale, "No city")}
                  </span>
                </div>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">{book.author || rt(locale, "Unknown author")}</p>
            </article>
          ))}
        </section>
      ) : null}

      {books.length > 0 ? (
        <div className="infinite-scroll-status" ref={loadMoreRef}>
          {booksQuery.isFetchingNextPage
            ? text.loadingMore
            : booksQuery.hasNextPage
              ? ""
              : text.allLoaded}
        </div>
      ) : null}
    </section>
  );
}

export function CreateBookPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyBookForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await apiRequest("/book/user", {
        method: "POST",
        auth: true,
        body: toCreatePayload(form)
      });

      await queryClient.invalidateQueries({ queryKey: ["my-books"] });
      navigate(`/app/my-books/${response.data.id}`, { replace: true });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{rt(locale, "Add a book")}</h1>
        <p>{rt(locale, "Add the main details about your book and make it ready for the catalog.")}</p>
      </header>

      <BookForm
        error={error}
        form={form}
        mode="create"
        onChange={setForm}
        onSubmit={handleSubmit}
        pending={pending}
        submitLabel={rt(locale, "Create book")}
      />
    </section>
  );
}

export function MyBookDetailsPage() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { bookId } = useParams();
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const bookQuery = useBookDetails(bookId);

  async function handleDelete() {
    const book = bookQuery.data;
    const confirmed = window.confirm(
      rtf(locale, 'Delete "{name}" from your books?', { name: book.name })
    );

    if (!confirmed) {
      return;
    }

    setDeletePending(true);
    setDeleteError(null);

    try {
      await apiRequest(`/book/user/${book.id}`, {
        method: "DELETE",
        auth: true,
        version: book.__version ?? book.version
      });

      await queryClient.invalidateQueries({ queryKey: ["my-books"] });
      navigate("/app/my-books", { replace: true });
    } catch (error) {
      setDeleteError(error);
    } finally {
      setDeletePending(false);
    }
  }

  if (bookQuery.isPending) {
    return <LoadingBlock label={rt(locale, "Loading book details")} />;
  }

  if (bookQuery.error) {
    return <ErrorBlock error={bookQuery.error} title={rt(locale, "Book details could not be loaded")} />;
  }

  const book = bookQuery.data;

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label={rt(locale, "Back to my books")} className="back-link" to="/app/my-books">
            <ArrowLeftIcon />
          </Link>

          <div className="hero-icon-actions">
            <Link
              aria-label={rt(locale, "Edit book")}
              className="icon-button icon-button-secondary"
              to={`/app/my-books/${book.id}/edit`}
            >
              <PencilIcon />
            </Link>
            <button
              aria-label={rt(locale, "Delete book")}
              className="icon-button icon-button-danger"
              disabled={deletePending}
              onClick={() => void handleDelete()}
              type="button"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        <div className="book-hero-layout">
          <BookCover expandable photoUrl={book.photoUrl} size="hero" title={book.name} />

          <div>
            <div className="book-hero-tags">
              <span className="category-chip" style={getBookCategoryTagStyle(book.category)}>
                {formatBookCategoryLabel(book.category, locale, rt(locale, "Not available"))}
              </span>
              {book.isGift ? (
                <span aria-label={rt(locale, "Gift")} className="gift-icon-badge" title={rt(locale, "Gift")}>
                  <GiftIcon />
                </span>
              ) : null}
              {book.isExchanged ? (
                <span className="status-pill status-pill-success">{rt(locale, "Exchanged")}</span>
              ) : null}
            </div>
            <h1>{book.name}</h1>

            <div className="book-detail-owner">
              <UserIdentityInline
                name={user?.nickname || book.ownerNickname}
                photoUrl={user?.photoUrl || book.ownerPhotoUrl}
                size="sm"
              >
                <strong>{user?.nickname || book.ownerNickname || rt(locale, "Unknown owner")}</strong>
              </UserIdentityInline>
            </div>

            <p className="book-detail-description">
              <strong>{rt(locale, "Description")}:</strong>{" "}
              {book.description || rt(locale, "No description provided.")}
            </p>

            <div className="book-hero-facts">
              <p>{formatEnumLabel("AUTHOR")}: {book.author || rt(locale, "Not available")}</p>
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

      {deleteError ? <ErrorBlock error={deleteError} title={rt(locale, "Delete request failed")} /> : null}
    </section>
  );
}

export function EditBookPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { bookId } = useParams();
  const bookQuery = useBookDetails(bookId);
  const [form, setForm] = useState(emptyBookForm);
  const [initialForm, setInitialForm] = useState(emptyBookForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState("");
  const [photoPending, setPhotoPending] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoMessage, setPhotoMessage] = useState("");
  const hasChanges = Object.keys(toUpdatePayload(form, initialForm)).length > 0;

  useEffect(() => {
    if (!bookQuery.data) {
      return;
    }

    const nextForm = fromBookToForm(bookQuery.data, locale);
    setForm(nextForm);
    setInitialForm(nextForm);
  }, [bookQuery.data?.id, locale]);

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = toUpdatePayload(form, initialForm);

    if (Object.keys(payload).length === 0) {
      return;
    }

    setPending(true);
    setError(null);
    setInfoMessage("");
    setPhotoError("");
    setPhotoMessage("");

    try {
      await apiRequest(`/book/user/${bookId}`, {
        method: "PATCH",
        auth: true,
        version: bookQuery.data.__version ?? bookQuery.data.version,
        body: payload
      });

      await queryClient.invalidateQueries({ queryKey: ["my-books"] });
      await queryClient.fetchQuery({
        queryKey: ["my-book", String(bookId)],
        queryFn: () => fetchMyBook(bookId)
      });
      navigate(`/app/my-books/${bookId}`, { replace: true });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
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
    setError(null);
    setInfoMessage("");

    try {
      await apiRequest(`/book/user/${bookId}/photo`, {
        method: "DELETE",
        auth: true,
        version: bookQuery.data.__version ?? bookQuery.data.version
      });

      const nextBook = await queryClient.fetchQuery({
        queryKey: ["my-book", String(bookId)],
        queryFn: () => fetchMyBook(bookId)
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

      await queryClient.invalidateQueries({ queryKey: ["my-books"] });
      setPhotoMessage(rt(locale, "Book photo deleted."));
    } catch (nextError) {
      setPhotoError(nextError.message);
    } finally {
      setPhotoPending(false);
    }
  }

  if (bookQuery.isPending) {
    return <LoadingBlock label={rt(locale, "Loading editable book data")} />;
  }

  if (bookQuery.error) {
    return <ErrorBlock error={bookQuery.error} title={rt(locale, "Book could not be loaded for editing")} />;
  }

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{rtf(locale, 'Edit "{name}"', { name: bookQuery.data.name })}</h1>
        <p>{rt(locale, "Update the information your readers should see in the catalog.")}</p>
      </header>

      <BookForm
        canSubmit={hasChanges}
        error={error}
        form={form}
        infoMessage={infoMessage}
        mode="edit"
        onChange={setForm}
        onDeletePhoto={handleDeletePhoto}
        onSubmit={handleSubmit}
        pending={pending}
        photoError={photoError}
        photoMessage={photoMessage}
        photoPending={photoPending}
        submitLabel={rt(locale, "Save changes")}
      />
    </section>
  );
}

export function ExchangedBooksPage() {
  const { locale } = useLocale();
  const [pageIndex, setPageIndex] = useState(0);

  const booksQuery = useQuery({
    queryKey: ["my-books", "exchanged", pageIndex],
    queryFn: async () => {
      const response = await apiRequest(
        `/book/history?pageIndex=${pageIndex}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    }
  });

  const books = booksQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>{rt(locale, "Exchanged books")}</h1>
        <p>{rt(locale, "Review the books that already completed an exchange.")}</p>

        <div className="card-actions">
          <Link className="button button-secondary" to="/app/my-books">
            {rt(locale, "Back to active books")}
          </Link>
        </div>
      </header>

      {booksQuery.isPending ? <LoadingBlock label={rt(locale, "Loading exchanged books")} /> : null}
      {booksQuery.error ? (
        <ErrorBlock error={booksQuery.error} title={rt(locale, "Exchanged books could not be loaded")} />
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          title={rt(locale, "No exchanged books yet")}
          description={rt(locale, "Once exchanges are completed, those books will appear here.")}
        />
      ) : null}

      {books.length > 0 ? (
        <section className="book-grid">
          {books.map((book) => (
            <article className="book-card" key={book.id}>
              <Link className="book-card-cover-link" to={`/app/my-books/${book.id}`}>
                <BookCover className="book-card-cover" photoUrl={book.photoUrl} size="card" title={book.name} />
              </Link>

              <div className="book-card-head">
                <span className="eyebrow">{rt(locale, "Exchanged")}</span>
                <span className="subtle-chip">{book.city || rt(locale, "No city")}</span>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">
                {book.author} / {formatBookCategoryLabel(book.category, locale, rt(locale, "No category"))} / {book.city}
              </p>
              <p className="book-description">
                {book.description || rt(locale, "No description stored for this book.")}
              </p>

                <div className="book-owner">
                  <UserIdentityInline name={book.ownerNickname} photoUrl={book.ownerPhotoUrl} size="sm">
                    <div>
                      <strong>{book.ownerNickname || rt(locale, "Unknown owner")}</strong>
                      <span>{rt(locale, "Publication year")}: {book.publicationYear}</span>
                    </div>
                  </UserIdentityInline>
                </div>
            </article>
          ))}
        </section>
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && (booksQuery.data?.totalPages ?? 0) > 1 ? (
        <Pagination
          onChange={setPageIndex}
          page={pageIndex}
          totalPages={booksQuery.data.totalPages}
        />
      ) : null}
    </section>
  );
}

function BookForm({
  canSubmit = true,
  error,
  form,
  infoMessage,
  mode,
  onChange,
  onDeletePhoto,
  onSubmit,
  pending,
  photoError,
  photoMessage,
  photoPending,
  submitLabel
}) {
  const metadataQuery = useMetadataQuery();
  const { locale } = useLocale();
  const text = bookFormText[locale] ?? bookFormText.en;
  const categoryOptions = buildBookCategoryOptions(
    metadataQuery.data?.bookCategories ?? [],
    locale,
    rt(locale, "Select category"),
    form.category
  );
  const cityError = form.city && !getCityApiValue(form.city) ? text.cityRequired : "";
  const canSave = canSubmit && !cityError;

  return (
    <section className="section-card">
      <form className="content-stack" onSubmit={onSubmit}>
        <div className="section-card-header">
          <div className="section-card-header-copy">
            <h2>{mode === "create" ? rt(locale, "Add a book") : rt(locale, "Edit book")}</h2>
            <p>{rt(locale, "Update the information your readers should see in the catalog.")}</p>
          </div>
          <div className="section-card-toolbar">
            <button className="button" disabled={pending || !canSave} type="submit">
              {pending ? rt(locale, "Saving...") : submitLabel}
            </button>
            <Link className="button button-secondary" to="/app/my-books">
              {rt(locale, "Cancel")}
            </Link>
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
              onChange={(value) => onChange((current) => ({ ...current, photoBase64: value }))}
              onRemove={onDeletePhoto}
              photoBase64={form.photoBase64}
              photoUrl={form.photoUrl}
              removePending={photoPending}
            />
          </div>

          <div className="editor-column editor-column-grow">
            <div className="editor-panel editor-panel-form">
              <h3>{rt(locale, "Book overview")}</h3>
              <div className="filters-grid editor-form-grid">
                <Field
                  label={formatEnumLabel("NAME")}
                  onChange={(value) => onChange((current) => ({ ...current, name: value }))}
                  required={mode === "create"}
                  value={form.name}
                />
                <Field
                  label={formatEnumLabel("AUTHOR")}
                  onChange={(value) => onChange((current) => ({ ...current, author: value }))}
                  required={mode === "create"}
                  value={form.author}
                />
                <SelectField
                  label={formatEnumLabel("CATEGORY")}
                  onChange={(value) => onChange((current) => ({ ...current, category: value }))}
                  options={categoryOptions}
                  required={mode === "create"}
                  value={form.category}
                />
                <CityField
                  error={cityError}
                  label={formatEnumLabel("CITY")}
                  onChange={(value) => onChange((current) => ({ ...current, city: value }))}
                  required={mode === "create"}
                  value={form.city}
                />
                <Field
                  label={rt(locale, "Publication year")}
                  onChange={(value) =>
                    onChange((current) => ({ ...current, publicationYear: value }))
                  }
                  required={mode === "create"}
                  type="number"
                  value={form.publicationYear}
                />
                <label className="field field-checkbox">
                  <span>{rt(locale, "Gift mode")}</span>
                  <input
                    checked={form.isGift}
                    onChange={(event) =>
                      onChange((current) => ({ ...current, isGift: event.target.checked }))
                    }
                    type="checkbox"
                  />
                </label>
                <label className="field editor-field-span-full editor-textarea-field">
                  <span>{formatEnumLabel("DESCRIPTION")}</span>
                  <textarea
                    className="field-control field-control-textarea"
                    onChange={(event) =>
                      onChange((current) => ({ ...current, description: event.target.value }))
                    }
                    required={mode === "create"}
                    rows={6}
                    value={form.description}
                  />
                </label>
                <label className="field editor-field-span-full editor-textarea-field">
                  <span>{rt(locale, "Contact details")}</span>
                  <textarea
                    className="field-control"
                    onChange={(event) =>
                      onChange((current) => ({ ...current, contactDetails: event.target.value }))
                    }
                    placeholder={rt(locale, "Street, phone, messenger or another contact channel")}
                    required={mode === "create"}
                    rows={5}
                    value={form.contactDetails}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {infoMessage ? <p className="inline-message inline-message-success">{infoMessage}</p> : null}
        {error ? <p className="inline-message inline-message-error">{error.message}</p> : null}
      </form>
    </section>
  );
}

function Field({ label, onChange, required = false, type = "text", value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="field-control"
        onChange={(event) => onChange(event.target.value)}
        required={required}
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

function useBookDetails(bookId) {
  return useQuery({
    queryKey: ["my-book", String(bookId)],
    enabled: Boolean(bookId),
    queryFn: () => fetchMyBook(bookId)
  });
}

async function fetchMyBook(bookId) {
  const response = await apiRequest(`/book/user/${bookId}`, { auth: true });

  return {
    ...response.data,
    __version: response.eTag ?? response.data?.version ?? null
  };
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

function toCreatePayload(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    author: form.author.trim(),
    category: form.category.trim(),
    publicationYear: Number(form.publicationYear),
    photoBase64: normalizeOptionalImage(form.photoBase64),
    city: getCityApiValue(form.city) || "",
    contactDetails: form.contactDetails.trim(),
    isGift: Boolean(form.isGift)
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

    if (field === "city") {
      next.city = getCityApiValue(currentValue) || "";
      return;
    }

    next[field] = currentValue;
  });

  if (form.photoBase64 !== null) {
    next.photoBase64 = normalizeImageChange(form.photoBase64);
  }

  if (next.contactDetails === "") {
    delete next.contactDetails;
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

function normalizeOptionalString(value) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalImage(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeImageChange(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function renderValue(locale, value) {
  return value === null || value === undefined || value === "" ? rt(locale, "Not available") : value;
}
