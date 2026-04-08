import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { DEFAULT_LIST_PAGE_SIZE } from "../../../shared/api/config";
import { useMetadataQuery } from "../../../shared/api/hooks";
import { apiRequest } from "../../../shared/api/http";
import { buildQueryString, formatDateTime, formatEnumLabel } from "../../../shared/lib/format";
import { Pagination } from "../../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../../shared/ui/StateBlocks";

const defaultFilters = {
  bookType: "ALL",
  searchText: "",
  author: "",
  category: "",
  city: "",
  publicationYear: "",
  isGift: "",
  sortBy: "",
  sortDirection: "ASC"
};

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

export function AdminBooksPage() {
  const metadataQuery = useMetadataQuery();
  const [pageIndex, setPageIndex] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);

  const bookTypes = metadataQuery.data?.bookTypes ?? ["ACTIVE", "DELETED", "ALL"];
  const bookSortFields = metadataQuery.data?.bookSortFields ?? [];

  const booksQuery = useQuery({
    queryKey: ["admin-books", pageIndex, filters],
    queryFn: async () => {
      const query = buildQueryString({
        pageIndex,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
        bookType: filters.bookType === "ALL" ? undefined : filters.bookType,
        searchText: filters.searchText,
        author: filters.author,
        category: filters.category,
        city: filters.city,
        publicationYear: filters.publicationYear === "" ? undefined : Number(filters.publicationYear),
        isGift: filters.isGift === "" ? undefined : filters.isGift === "true",
        sortBy: filters.sortBy || undefined,
        sortDirection:
          filters.sortBy && filters.sortDirection !== "ASC" ? filters.sortDirection : undefined
      });
      const response = await apiRequest(`/admin/books/search?${query}`, { auth: true });

      return response.data;
    }
  });

  function handleApplyFilters(event) {
    event.preventDefault();
    setPageIndex(0);
    setFilters({
      ...draftFilters,
      searchText: draftFilters.searchText.trim(),
      author: draftFilters.author.trim(),
      category: draftFilters.category.trim(),
      city: draftFilters.city.trim()
    });
  }

  function handleResetFilters() {
    setPageIndex(0);
    setDraftFilters(defaultFilters);
    setFilters(defaultFilters);
  }

  const books = booksQuery.data?.content ?? [];

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">Admin books</span>
        <h1>Book moderation</h1>
        <p>
          This screen uses `GET /admin/books/search` with the full search and sorting contract, then
          opens each book into a moderation detail view.
        </p>
      </header>

      <section className="section-card">
        <form className="content-stack" onSubmit={handleApplyFilters}>
          <div className="filters-grid">
            <label className="field">
              <span>Book type</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    bookType: event.target.value
                  }))
                }
                value={draftFilters.bookType}
              >
                {bookTypes.map((bookType) => (
                  <option key={bookType} value={bookType}>
                    {formatEnumLabel(bookType)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Search text</span>
              <input
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    searchText: event.target.value
                  }))
                }
                placeholder="Book name"
                value={draftFilters.searchText}
              />
            </label>

            <label className="field">
              <span>Author</span>
              <input
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    author: event.target.value
                  }))
                }
                value={draftFilters.author}
              />
            </label>

            <label className="field">
              <span>Category</span>
              <input
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    category: event.target.value
                  }))
                }
                value={draftFilters.category}
              />
            </label>

            <label className="field">
              <span>City</span>
              <input
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    city: event.target.value
                  }))
                }
                value={draftFilters.city}
              />
            </label>

            <label className="field">
              <span>Publication year</span>
              <input
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    publicationYear: event.target.value
                  }))
                }
                type="number"
                value={draftFilters.publicationYear}
              />
            </label>

            <label className="field">
              <span>Gift mode</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    isGift: event.target.value
                  }))
                }
                value={draftFilters.isGift}
              >
                <option value="">All</option>
                <option value="true">Gift only</option>
                <option value="false">Exchange only</option>
              </select>
            </label>

            <div className="field">
              <span>Result set</span>
              <div className="admin-summary-box">
                <strong>{booksQuery.data?.totalElements ?? 0}</strong>
                <span>matching books</span>
              </div>
            </div>
          </div>

          <div className="filters-grid">
            <label className="field">
              <span>Sort by</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    sortBy: event.target.value
                  }))
                }
                value={draftFilters.sortBy}
              >
                <option value="">Default</option>
                {bookSortFields.map((field) => (
                  <option key={field} value={field}>
                    {formatEnumLabel(field)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Sort direction</span>
              <select
                className="field-control"
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    sortDirection: event.target.value
                  }))
                }
                value={draftFilters.sortDirection}
              >
                <option value="ASC">Ascending</option>
                <option value="DESC">Descending</option>
              </select>
            </label>
          </div>

          <div className="filters-actions">
            <button className="button" type="submit">
              Apply filters
            </button>
            <button className="button button-secondary" onClick={handleResetFilters} type="button">
              Reset
            </button>
          </div>
        </form>
      </section>

      {metadataQuery.isPending ? <LoadingBlock label="Loading book metadata" /> : null}
      {metadataQuery.error ? (
        <ErrorBlock error={metadataQuery.error} title="Book metadata could not be loaded" />
      ) : null}
      {booksQuery.isPending ? <LoadingBlock label="Loading moderated books" /> : null}
      {booksQuery.error ? <ErrorBlock error={booksQuery.error} title="Admin books could not be loaded" /> : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          title="No books match these filters"
          description="Try resetting the filters or changing the book type, search, or sort combination."
        />
      ) : null}

      {books.length > 0 ? (
        <section className="list-stack">
          {books.map((book) => {
            const deleted = isBookDeleted(book);

            return (
              <article className="section-card compact-card" key={book.id}>
                <div className="row-between">
                  <div>
                    <h2>{book.name || "Untitled book"}</h2>
                    <p className="muted-line">
                      {book.author || "Unknown author"} / {book.category || "No category"}
                    </p>
                  </div>

                  <div className="pill-row">
                    <span className="subtle-chip">v{book.version}</span>
                    {book.isGift ? <span className="status-pill status-pill-neutral">Gift</span> : null}
                    {book.isExchanged ? (
                      <span className="status-pill status-pill-success">Exchanged</span>
                    ) : null}
                    {deleted ? <span className="status-pill status-pill-danger">Deleted</span> : null}
                  </div>
                </div>

                <dl className="detail-list detail-list-compact">
                  <div>
                    <dt>Owner</dt>
                    <dd>{book.ownerNickname || "Unknown"} (id {book.ownerUserId ?? "n/a"})</dd>
                  </div>
                  <div>
                    <dt>City</dt>
                    <dd>{book.city || "Not available"}</dd>
                  </div>
                  <div>
                    <dt>Publication year</dt>
                    <dd>{renderValue(book.publicationYear)}</dd>
                  </div>
                  <div>
                    <dt>Deleted at</dt>
                    <dd>{formatDateTime(book.meta?.deletedAt)}</dd>
                  </div>
                </dl>

                <p className="book-description">{book.description || "No description provided."}</p>

                <div className="card-actions">
                  <div className="pill-row">
                    {book.ownerUserId ? (
                      <Link className="link-inline" to={`/admin/users/${book.ownerUserId}`}>
                        Open owner
                      </Link>
                    ) : null}
                    <Link className="link-inline" to={`/book/${book.id}`}>
                      Open public page
                    </Link>
                  </div>

                  <Link className="button button-secondary" to={`/admin/books/${book.id}`}>
                    Open details
                  </Link>
                </div>
              </article>
            );
          })}
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

export function AdminBookDetailsPage() {
  const queryClient = useQueryClient();
  const { bookId } = useParams();
  const [form, setForm] = useState(emptyBookForm);
  const [initialForm, setInitialForm] = useState(emptyBookForm);
  const [pendingAction, setPendingAction] = useState(null);
  const [editError, setEditError] = useState(null);
  const [editMessage, setEditMessage] = useState("");
  const [moderationError, setModerationError] = useState(null);
  const [moderationMessage, setModerationMessage] = useState("");

  const detailQuery = useQuery({
    queryKey: ["admin-book", String(bookId)],
    enabled: Boolean(bookId),
    queryFn: () => fetchAdminBook(bookId)
  });

  useEffect(() => {
    if (!detailQuery.data) {
      return;
    }

    const nextForm = fromBookToForm(detailQuery.data);
    setForm(nextForm);
    setInitialForm(nextForm);
  }, [detailQuery.data]);

  async function handleSave(event) {
    event.preventDefault();
    setEditError(null);
    setEditMessage("");

    const payload = toUpdatePayload(form, initialForm);

    if (Object.keys(payload).length === 0) {
      setEditMessage("No changes to save yet.");
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
      const nextForm = fromBookToForm(nextBook);

      setForm(nextForm);
      setInitialForm(nextForm);
      setEditMessage("Book updated.");
    } catch (error) {
      setEditError(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm("Soft-delete this book from the moderation console?");

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
      const nextForm = fromBookToForm(nextBook);

      setForm(nextForm);
      setInitialForm(nextForm);
      setModerationMessage("Book deleted.");
    } catch (error) {
      setModerationError(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRestore() {
    const confirmed = window.confirm("Restore this deleted book?");

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
      const nextForm = fromBookToForm(nextBook);

      setForm(nextForm);
      setInitialForm(nextForm);
      setModerationMessage("Book restored.");
    } catch (error) {
      setModerationError(error);
    } finally {
      setPendingAction(null);
    }
  }

  if (detailQuery.isPending) {
    return <LoadingBlock label="Loading admin book details" />;
  }

  if (detailQuery.error) {
    return <ErrorBlock error={detailQuery.error} title="Admin book details could not be loaded" />;
  }

  const book = detailQuery.data;
  const deleted = isBookDeleted(book);

  return (
    <section className="content-stack">
      <header className="section-card">
        <div className="row-between">
          <div>
            <span className="eyebrow">Admin book details</span>
            <h1>{book.name || "Untitled book"}</h1>
            <p>
              This page uses `GET /admin/books/{'{bookId}'}` and wires together edit, delete, and
              restore actions with optimistic locking.
            </p>
          </div>

          <div className="pill-row">
            <span className="subtle-chip">Book #{book.id}</span>
            <span className="subtle-chip">v{book.__version ?? book.version}</span>
            {deleted ? <span className="status-pill status-pill-danger">Deleted</span> : null}
          </div>
        </div>
      </header>

      <section className="detail-grid">
        <article className="section-card">
          <h2>Book snapshot</h2>
          <dl className="detail-list">
            <div>
              <dt>Owner</dt>
              <dd>
                {book.ownerNickname || "Unknown"} (id {book.ownerUserId ?? "n/a"})
              </dd>
            </div>
            <div>
              <dt>Publication year</dt>
              <dd>{renderValue(book.publicationYear)}</dd>
            </div>
            <div>
              <dt>Gift mode</dt>
              <dd>{book.isGift ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>Exchanged</dt>
              <dd>{book.isExchanged ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt>City</dt>
              <dd>{book.city || "Not available"}</dd>
            </div>
            <div>
              <dt>Contact details</dt>
              <dd>{book.contactDetails || "Not available"}</dd>
            </div>
          </dl>
        </article>

        <article className="section-card">
          <h2>Audit metadata</h2>
          <dl className="detail-list">
            <div>
              <dt>Created at</dt>
              <dd>{formatDateTime(book.meta?.createdAt)}</dd>
            </div>
            <div>
              <dt>Updated at</dt>
              <dd>{formatDateTime(book.meta?.updatedAt)}</dd>
            </div>
            <div>
              <dt>Deleted at</dt>
              <dd>{formatDateTime(book.meta?.deletedAt)}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{book.meta?.createdBy ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Updated by</dt>
              <dd>{book.meta?.updatedBy ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Updated request id</dt>
              <dd>{book.meta?.updatedRequestId || "Not available"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="section-card">
        <h2>Moderation actions</h2>
        {moderationMessage ? (
          <p className="inline-message inline-message-success">{moderationMessage}</p>
        ) : null}
        {moderationError ? <ErrorBlock error={moderationError} title="Book action failed" /> : null}
        <div className="card-actions">
          {book.ownerUserId ? (
            <Link className="button button-secondary" to={`/admin/users/${book.ownerUserId}`}>
              Open owner
            </Link>
          ) : null}
          <Link className="button button-secondary" to={`/book/${book.id}`}>
            Open public page
          </Link>
          <button
            className="button button-danger"
            disabled={deleted || pendingAction !== null}
            onClick={() => void handleDelete()}
            type="button"
          >
            {pendingAction === "delete" ? "Deleting..." : "Delete book"}
          </button>
          <button
            className="button"
            disabled={!deleted || pendingAction !== null}
            onClick={() => void handleRestore()}
            type="button"
          >
            {pendingAction === "restore" ? "Restoring..." : "Restore book"}
          </button>
        </div>
      </section>

      <section className="section-card">
        <h2>Edit book</h2>
        <form className="content-stack" onSubmit={handleSave}>
          <div className="filters-grid">
            <Field
              label="Name"
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              value={form.name}
            />
            <Field
              label="Author"
              onChange={(value) => setForm((current) => ({ ...current, author: value }))}
              value={form.author}
            />
            <Field
              label="Category"
              onChange={(value) => setForm((current) => ({ ...current, category: value }))}
              value={form.category}
            />
            <Field
              label="City"
              onChange={(value) => setForm((current) => ({ ...current, city: value }))}
              value={form.city}
            />
            <Field
              label="Publication year"
              onChange={(value) => setForm((current) => ({ ...current, publicationYear: value }))}
              type="number"
              value={form.publicationYear}
            />
            <label className="field field-checkbox">
              <span>Gift mode</span>
              <input
                checked={form.isGift}
                onChange={(event) =>
                  setForm((current) => ({ ...current, isGift: event.target.checked }))
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
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={5}
              value={form.description}
            />
          </label>

          <label className="field">
            <span>Contact details</span>
            <textarea
              className="field-control"
              onChange={(event) =>
                setForm((current) => ({ ...current, contactDetails: event.target.value }))
              }
              rows={3}
              value={form.contactDetails}
            />
          </label>

          <label className="field">
            <span>Photo base64</span>
            <textarea
              className="field-control"
              onChange={(event) =>
                setForm((current) => ({ ...current, photoBase64: event.target.value }))
              }
              rows={4}
              value={form.photoBase64}
            />
          </label>

          {editMessage ? <p className="inline-message inline-message-success">{editMessage}</p> : null}
          {editError ? <ErrorBlock error={editError} title="Book action failed" /> : null}

          <div className="card-actions">
            <button className="button" disabled={pendingAction !== null} type="submit">
              {pendingAction === "save" ? "Saving..." : "Save changes"}
            </button>
            <Link className="button button-secondary" to="/admin/books">
              Back to books
            </Link>
          </div>
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

function isBookDeleted(book) {
  return Boolean(book?.meta?.deletedAt);
}

function renderValue(value) {
  return value === null || value === undefined || value === "" ? "Not available" : value;
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
