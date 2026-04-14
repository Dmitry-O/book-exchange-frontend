import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { useLocale } from "../../shared/i18n/LocaleContext";
import { buildBookCategoryOptions, formatBookCategoryLabel } from "../../shared/lib/bookCategory";
import { ImageUploadField } from "../../shared/ui/ImageUploadField";
import { CityField } from "../../shared/ui/CityField";
import { BookCover, UserIdentityInline } from "../../shared/ui/Media";
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

export function MyBooksPage() {
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [pageIndex, setPageIndex] = useState(0);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const booksQuery = useQuery({
    queryKey: ["my-books", pageIndex],
    queryFn: async () => {
      const response = await apiRequest(
        `/book/user?pageIndex=${pageIndex}&pageSize=${DEFAULT_LIST_PAGE_SIZE}`,
        { auth: true }
      );

      return response.data;
    }
  });

  async function handleDelete(book) {
    const confirmed = window.confirm(`Delete "${book.name}" from your books?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(book.id);
    setDeleteError(null);

    try {
      await apiRequest(`/book/user/${book.id}`, {
        method: "DELETE",
        auth: true,
        version: book.version
      });

      await queryClient.invalidateQueries({ queryKey: ["my-books"] });
      await queryClient.invalidateQueries({ queryKey: ["my-book", String(book.id)] });
    } catch (error) {
      setDeleteError(error);
    } finally {
      setDeletingId(null);
    }
  }

  const books = booksQuery.data?.content ?? [];

  return (
    <section className="content-stack my-books-page">
      <header className="section-card">
        <h1>Manage your inventory</h1>
        <p>Keep your active books updated and ready for exchanges.</p>

        <div className="card-actions">
          <Link className="button" to="/app/my-books/new">
            Add new book
          </Link>
          <Link className="button button-secondary" to="/app/my-books/exchanged">
            View exchanged books
          </Link>
        </div>
      </header>

      {deleteError ? <ErrorBlock error={deleteError} title="Book deletion failed" /> : null}
      {booksQuery.isPending ? <LoadingBlock label="Loading your books" /> : null}
      {booksQuery.error ? (
        <ErrorBlock error={booksQuery.error} title="Books could not be loaded" />
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          title="You have not added books yet"
          description="Create the first one to start testing the owner-facing CRUD flow."
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
                <span className="eyebrow">{book.isGift ? "Gift" : "Exchange"}</span>
                <span className="subtle-chip">{book.city || "No city"}</span>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">
                {book.author} / {formatBookCategoryLabel(book.category, locale, "No category")} / {book.city}
              </p>
              <p className="book-description">
                {book.description || "No description provided."}
              </p>

              <div className="card-actions">
                <Link className="button button-secondary" to={`/app/my-books/${book.id}/edit`}>
                  Edit
                </Link>
                <button
                  className="button button-danger"
                  disabled={deletingId === book.id}
                  onClick={() => void handleDelete(book)}
                  type="button"
                >
                  {deletingId === book.id ? "Deleting..." : "Delete"}
                </button>
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

export function CreateBookPage() {
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
        <h1>Add a book</h1>
        <p>Add the main details about your book and make it ready for the catalog.</p>
      </header>

      <BookForm
        error={error}
        form={form}
        mode="create"
        onChange={setForm}
        onSubmit={handleSubmit}
        pending={pending}
        submitLabel="Create book"
      />
    </section>
  );
}

export function MyBookDetailsPage() {
  const { locale } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { bookId } = useParams();
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const bookQuery = useBookDetails(bookId);

  async function handleDelete() {
    const book = bookQuery.data;
    const confirmed = window.confirm(`Delete "${book.name}" from your books?`);

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
    return <LoadingBlock label="Loading book details" />;
  }

  if (bookQuery.error) {
    return <ErrorBlock error={bookQuery.error} title="Book details could not be loaded" />;
  }

  const book = bookQuery.data;

  return (
    <section className="content-stack">
      <header className="section-card book-detail-hero">
        <div className="book-detail-header-bar">
          <Link aria-label="Back to my books" className="back-link" to="/app/my-books">
            <ArrowLeftIcon />
          </Link>

          <div className="hero-icon-actions">
            <Link
              aria-label="Edit book"
              className="icon-button icon-button-secondary"
              to={`/app/my-books/${book.id}/edit`}
            >
              <PencilIcon />
            </Link>
            <button
              aria-label="Delete book"
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
            <h1>{book.name}</h1>
            <p>{book.description}</p>
          </div>
        </div>

        <div className="book-detail-stats">
          <DetailStat label="Author" value={book.author} />
          <DetailStat label="Category" value={formatBookCategoryLabel(book.category, locale, "Not available")} />
          <DetailStat label="City" value={book.city} />
          <DetailStat label="Year" value={book.publicationYear} />
        </div>
      </header>

      {deleteError ? <ErrorBlock error={deleteError} title="Delete request failed" /> : null}

      <section className="content-stack">
        <article className="section-card">
          <h2>Book details</h2>
          <dl className="detail-list">
            <div>
              <dt>Publication year</dt>
              <dd>{book.publicationYear}</dd>
            </div>
            <div>
              <dt>Contact details</dt>
              <dd>{book.contactDetails || "Not provided"}</dd>
            </div>
            <div>
              <dt>Gift mode</dt>
              <dd>{book.isGift ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Exchanged</dt>
              <dd>{book.isExchanged ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </article>
      </section>
    </section>
  );
}

export function EditBookPage() {
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

  useEffect(() => {
    if (!bookQuery.data) {
      return;
    }

    const nextForm = fromBookToForm(bookQuery.data);
    setForm(nextForm);
    setInitialForm(nextForm);
  }, [bookQuery.data?.id]);

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = toUpdatePayload(form, initialForm);

    if (Object.keys(payload).length === 0) {
      setInfoMessage("No changes to save yet.");
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
    const confirmed = window.confirm("Delete the saved photo for this book?");

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
      setPhotoMessage("Book photo deleted.");
    } catch (nextError) {
      setPhotoError(nextError.message);
    } finally {
      setPhotoPending(false);
    }
  }

  if (bookQuery.isPending) {
    return <LoadingBlock label="Loading editable book data" />;
  }

  if (bookQuery.error) {
    return <ErrorBlock error={bookQuery.error} title="Book could not be loaded for editing" />;
  }

  return (
    <section className="content-stack">
      <header className="section-card">
        <h1>Edit "{bookQuery.data.name}"</h1>
        <p>Update the information your readers should see in the catalog.</p>
      </header>

      <BookForm
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
        submitLabel="Save changes"
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
        <h1>Exchanged books</h1>
        <p>Review the books that already completed an exchange.</p>

        <div className="card-actions">
          <Link className="button button-secondary" to="/app/my-books">
            Back to active books
          </Link>
        </div>
      </header>

      {booksQuery.isPending ? <LoadingBlock label="Loading exchanged books" /> : null}
      {booksQuery.error ? (
        <ErrorBlock error={booksQuery.error} title="Exchanged books could not be loaded" />
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          title="No exchanged books yet"
          description="Once exchanges are completed, those books will appear here."
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
                <span className="eyebrow">Exchanged</span>
                <span className="subtle-chip">{book.city || "No city"}</span>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">
                {book.author} / {formatBookCategoryLabel(book.category, locale, "No category")} / {book.city}
              </p>
              <p className="book-description">
                {book.description || "No description stored for this book."}
              </p>

                <div className="book-owner">
                  <UserIdentityInline name={book.ownerNickname} photoUrl={book.ownerPhotoUrl} size="sm">
                    <div>
                      <strong>{book.ownerNickname || "Unknown owner"}</strong>
                      <span>publication year: {book.publicationYear}</span>
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
  const categoryOptions = buildBookCategoryOptions(
    metadataQuery.data?.bookCategories ?? [],
    locale,
    "Select category",
    form.category
  );

  return (
    <section className="section-card">
      <form className="content-stack" onSubmit={onSubmit}>
        <ImageUploadField
          error={photoError}
          entityName={form.name || "Book cover"}
          kind="book"
          label="Book photo"
          message={photoMessage}
          onChange={(value) => onChange((current) => ({ ...current, photoBase64: value }))}
          onRemove={onDeletePhoto}
          photoBase64={form.photoBase64}
          photoUrl={form.photoUrl}
          removePending={photoPending}
        />

        <div className="filters-grid">
          <Field
            label="Name"
            onChange={(value) => onChange((current) => ({ ...current, name: value }))}
            required={mode === "create"}
            value={form.name}
          />
          <Field
            label="Author"
            onChange={(value) => onChange((current) => ({ ...current, author: value }))}
            required={mode === "create"}
            value={form.author}
          />
          <SelectField
            label="Category"
            onChange={(value) => onChange((current) => ({ ...current, category: value }))}
            options={categoryOptions}
            required={mode === "create"}
            value={form.category}
          />
          <CityField
            label="City"
            onChange={(value) => onChange((current) => ({ ...current, city: value }))}
            required={mode === "create"}
            value={form.city}
          />
          <Field
            label="Publication year"
            onChange={(value) =>
              onChange((current) => ({ ...current, publicationYear: value }))
            }
            required={mode === "create"}
            type="number"
            value={form.publicationYear}
          />
          <label className="field field-checkbox">
            <span>Gift mode</span>
            <input
              checked={form.isGift}
              onChange={(event) =>
                onChange((current) => ({ ...current, isGift: event.target.checked }))
              }
              type="checkbox"
            />
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            className="field-control field-control-textarea"
            onChange={(event) =>
              onChange((current) => ({ ...current, description: event.target.value }))
            }
            required={mode === "create"}
            rows={5}
            value={form.description}
          />
        </label>

        <label className="field">
          <span>Contact details</span>
          <textarea
            className="field-control"
            onChange={(event) =>
              onChange((current) => ({ ...current, contactDetails: event.target.value }))
            }
            placeholder="Street, phone, messenger or another contact channel"
            required={mode === "create"}
            rows={3}
            value={form.contactDetails}
          />
        </label>

        {infoMessage ? <p className="inline-message inline-message-success">{infoMessage}</p> : null}
        {error ? <p className="inline-message inline-message-error">{error.message}</p> : null}

        <div className="card-actions">
          <button className="button" disabled={pending} type="submit">
            {pending ? "Saving..." : submitLabel}
          </button>
          <Link className="button button-secondary" to="/app/my-books">
            Cancel
          </Link>
        </div>
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

function DetailStat({ label, value }) {
  return (
    <div className="meta-stat">
      <strong>{value === null || value === undefined || value === "" ? "Not available" : value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <path
        d="M14.75 5.75 8.5 12l6.25 6.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <path
        d="m4 20 4.5-1 8.9-8.9a2.1 2.1 0 0 0 0-3L15.9 5.6a2.1 2.1 0 0 0-3 0L4 14.5 4 20Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M11.5 7.9 16.1 12.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">
      <path
        d="M5 7h14M10 11v6M14 11v6M9 4h6l1 2H8l1-2Zm-2 3 1 12h8l1-12"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
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

function fromBookToForm(book) {
  return {
    name: book.name ?? "",
    description: book.description ?? "",
    author: book.author ?? "",
    category: book.category ?? "",
    publicationYear: book.publicationYear ? String(book.publicationYear) : "",
    photoBase64: null,
    photoUrl: book.photoUrl ?? "",
    city: book.city ?? "",
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
    city: form.city.trim(),
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
