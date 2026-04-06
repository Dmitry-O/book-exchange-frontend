import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../shared/api/config";
import { apiRequest } from "../../shared/api/http";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const emptyBookForm = {
  name: "",
  description: "",
  author: "",
  category: "",
  publicationYear: "",
  photoBase64: "",
  city: "",
  contactDetails: "",
  isGift: false
};

export function MyBooksPage() {
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
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">My books</span>
        <h1>Manage your inventory</h1>
        <p>
          This page uses `GET /book/user` and list-level `version` values for direct delete actions.
        </p>

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
              <div className="book-card-head">
                <span className="eyebrow">{book.isGift ? "Gift" : "Exchange"}</span>
                <span className="subtle-chip">v{book.version}</span>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">
                {book.author} / {book.category} / {book.city}
              </p>
              <p className="book-description">
                {book.description || "No description provided."}
              </p>

              <div className="book-owner">
                <strong>{book.isExchanged ? "Already exchanged" : "Active listing"}</strong>
                <span>ownerUserId: {book.ownerUserId ?? "n/a"}</span>
              </div>

              <div className="card-actions">
                <Link className="button button-secondary" to={`/app/my-books/${book.id}`}>
                  Details
                </Link>
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
        <span className="eyebrow">Create</span>
        <h1>Add a book</h1>
        <p>This form sends `POST /book/user` with the full create payload, including contact details.</p>
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
        <div>
          <span className="eyebrow">{book.isGift ? "Gift" : "Exchange"}</span>
          <h1>{book.name}</h1>
          <p>{book.description}</p>
        </div>

        <div className="book-detail-stats">
          <DetailStat label="Author" value={book.author} />
          <DetailStat label="Category" value={book.category} />
          <DetailStat label="City" value={book.city} />
          <DetailStat label="Version" value={book.__version ?? book.version} />
        </div>
      </header>

      {deleteError ? <ErrorBlock error={deleteError} title="Delete request failed" /> : null}

      <section className="detail-grid">
        <article className="section-card">
          <h2>Owner-facing payload snapshot</h2>
          <dl className="detail-list">
            <div>
              <dt>Book id</dt>
              <dd>{book.id}</dd>
            </div>
            <div>
              <dt>Owner user id</dt>
              <dd>{book.ownerUserId}</dd>
            </div>
            <div>
              <dt>Owner nickname</dt>
              <dd>{book.ownerNickname}</dd>
            </div>
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

        <article className="section-card">
          <h2>Next actions</h2>
          <p>
            All editable owner fields now come from `GET /book/user/{'{bookId}'}`, so the edit
            form can be fully prefilled from the backend response.
          </p>

          <div className="card-actions">
            <Link className="button button-secondary" to={`/app/my-books/${book.id}/edit`}>
              Edit book
            </Link>
            <button
              className="button button-danger"
              disabled={deletePending}
              onClick={() => void handleDelete()}
              type="button"
            >
              {deletePending ? "Deleting..." : "Delete book"}
            </button>
          </div>
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

  useEffect(() => {
    if (!bookQuery.data) {
      return;
    }

    const nextForm = fromBookToForm(bookQuery.data);
    setForm(nextForm);
    setInitialForm(nextForm);
  }, [bookQuery.data]);

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

    try {
      await apiRequest(`/book/user/${bookId}`, {
        method: "PATCH",
        auth: true,
        version: bookQuery.data.__version ?? bookQuery.data.version,
        body: payload
      });

      await queryClient.invalidateQueries({ queryKey: ["my-books"] });
      await queryClient.invalidateQueries({ queryKey: ["my-book", String(bookId)] });
      navigate(`/app/my-books/${bookId}`, { replace: true });
    } catch (nextError) {
      setError(nextError);
    } finally {
      setPending(false);
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
        <span className="eyebrow">Edit</span>
        <h1>Edit "{bookQuery.data.name}"</h1>
        <p>
          This form sends `PATCH /book/user/{'{bookId}'}` and only includes fields that changed.
        </p>
      </header>

      <BookForm
        error={error}
        form={form}
        infoMessage={infoMessage}
        mode="edit"
        onChange={setForm}
        onSubmit={handleSubmit}
        pending={pending}
        submitLabel="Save changes"
      />
    </section>
  );
}

export function ExchangedBooksPage() {
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
        <span className="eyebrow">History</span>
        <h1>Exchanged books</h1>
        <p>This screen uses `GET /book/history` and gives you a read-only view of completed inventory.</p>

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
              <div className="book-card-head">
                <span className="eyebrow">Exchanged</span>
                <span className="subtle-chip">v{book.version}</span>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">
                {book.author} / {book.category} / {book.city}
              </p>
              <p className="book-description">
                {book.description || "No description stored for this book."}
              </p>

              <div className="book-owner">
                <strong>{book.ownerNickname || "Unknown owner"}</strong>
                <span>publication year: {book.publicationYear}</span>
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
  onSubmit,
  pending,
  submitLabel
}) {
  return (
    <section className="section-card">
      <form className="content-stack" onSubmit={onSubmit}>
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
          <Field
            label="Category"
            onChange={(value) => onChange((current) => ({ ...current, category: value }))}
            required={mode === "create"}
            value={form.category}
          />
          <Field
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

        <label className="field">
          <span>Photo base64</span>
          <textarea
            className="field-control"
            onChange={(event) =>
              onChange((current) => ({ ...current, photoBase64: event.target.value }))
            }
            placeholder="Optional base64 image string"
            rows={4}
            value={form.photoBase64}
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

function DetailStat({ label, value }) {
  return (
    <div className="meta-stat">
      <strong>{value === null || value === undefined || value === "" ? "Not available" : value}</strong>
      <span>{label}</span>
    </div>
  );
}

function useBookDetails(bookId) {
  return useQuery({
    queryKey: ["my-book", String(bookId)],
    enabled: Boolean(bookId),
    queryFn: async () => {
      const response = await apiRequest(`/book/user/${bookId}`, { auth: true });

      return {
        ...response.data,
        __version: response.eTag ?? response.data?.version ?? null
      };
    }
  });
}

function fromBookToForm(book) {
  return {
    name: book.name ?? "",
    description: book.description ?? "",
    author: book.author ?? "",
    category: book.category ?? "",
    publicationYear: book.publicationYear ? String(book.publicationYear) : "",
    photoBase64: book.photoBase64 ?? "",
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
    photoBase64: normalizeOptionalString(form.photoBase64),
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
    "photoBase64",
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

  if (next.photoBase64 === "") {
    next.photoBase64 = "";
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
