import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DEFAULT_PAGE_SIZE } from "../../shared/api/config";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { buildQueryString, formatEnumLabel } from "../../shared/lib/format";
import { Pagination } from "../../shared/ui/Pagination";
import { EmptyBlock, ErrorBlock, LoadingBlock } from "../../shared/ui/StateBlocks";

const initialFilters = {
  author: "",
  category: "",
  city: "",
  publicationYear: "",
  isGift: "",
  searchText: "",
  sortBy: "",
  sortDirection: "ASC"
};

export function CatalogPage() {
  const metadataQuery = useMetadataQuery();
  const [filters, setFilters] = useState(initialFilters);
  const [pageIndex, setPageIndex] = useState(0);

  const queryString = useMemo(
    () =>
      buildQueryString({
        pageIndex,
        pageSize: DEFAULT_PAGE_SIZE,
        ...filters
      }),
    [filters, pageIndex]
  );

  const booksQuery = useQuery({
    queryKey: ["catalog", queryString],
    queryFn: async () => {
      const response = await apiRequest(`/book/search?${queryString}`);
      return response.data;
    }
  });

  function updateFilter(name, value) {
    setPageIndex(0);
    setFilters((current) => ({
      ...current,
      [name]: value
    }));
  }

  const books = booksQuery.data?.content ?? [];
  const totalPages = booksQuery.data?.totalPages ?? 0;
  const totalElements = booksQuery.data?.totalElements ?? 0;

  return (
    <section className="content-stack">
      <header className="section-card">
        <span className="eyebrow">Public API</span>
        <h1>Catalog</h1>
        <p>
          This screen queries your public search endpoint and already uses metadata-driven
          sorting options.
        </p>
      </header>

      <section className="section-card">
        <div className="filters-grid">
          <Field
            label="Search text"
            value={filters.searchText}
            onChange={(value) => updateFilter("searchText", value)}
          />
          <Field
            label="Author"
            value={filters.author}
            onChange={(value) => updateFilter("author", value)}
          />
          <Field
            label="Category"
            value={filters.category}
            onChange={(value) => updateFilter("category", value)}
          />
          <Field
            label="City"
            value={filters.city}
            onChange={(value) => updateFilter("city", value)}
          />
          <Field
            label="Publication year"
            type="number"
            value={filters.publicationYear}
            onChange={(value) => updateFilter("publicationYear", value)}
          />
          <SelectField
            label="Gift only"
            value={filters.isGift}
            options={[
              { label: "All", value: "" },
              { label: "Gift only", value: "true" },
              { label: "Exchange only", value: "false" }
            ]}
            onChange={(value) => updateFilter("isGift", value)}
          />
          <SelectField
            label="Sort field"
            value={filters.sortBy}
            options={[
              { label: "Default", value: "" },
              ...((metadataQuery.data?.bookSortFields ?? []).map((item) => ({
                label: formatEnumLabel(item),
                value: item
              })))
            ]}
            onChange={(value) => updateFilter("sortBy", value)}
          />
          <SelectField
            label="Sort direction"
            value={filters.sortDirection}
            options={[
              { label: "Ascending", value: "ASC" },
              { label: "Descending", value: "DESC" }
            ]}
            onChange={(value) => updateFilter("sortDirection", value)}
          />
        </div>

        <div className="filters-actions">
          <button
            className="button button-secondary"
            onClick={() => {
              setFilters(initialFilters);
              setPageIndex(0);
            }}
            type="button"
          >
            Reset filters
          </button>
          <span className="muted-line">{totalElements} books matched</span>
        </div>
      </section>

      {booksQuery.isPending ? <LoadingBlock label="Loading catalog" /> : null}
      {booksQuery.error ? (
        <ErrorBlock error={booksQuery.error} title="Catalog request failed" />
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          title="No books found"
          description="Try broader filters or remove sorting and text constraints."
        />
      ) : null}

      {books.length > 0 ? (
        <section className="book-grid">
          {books.map((book) => (
            <article className="book-card" key={book.id}>
              <div className="book-card-head">
                <span className="eyebrow">{book.isGift ? "Gift" : "Exchange"}</span>
                <span className="subtle-chip">{book.city || "No city"}</span>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">
                {book.author} · {book.category} · {book.publicationYear || "Unknown year"}
              </p>
              <p className="book-description">
                {book.description || "No public description provided for this book yet."}
              </p>

              <div className="book-owner">
                <strong>{book.ownerNickname || "Unknown owner"}</strong>
                <span>ownerUserId: {book.ownerUserId ?? "n/a"}</span>
              </div>

              <div className="card-actions">
                <Link className="button button-secondary" to={`/book/${book.id}`}>
                  Open details
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && totalPages > 1 ? (
        <Pagination page={pageIndex} totalPages={totalPages} onChange={setPageIndex} />
      ) : null}
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

function SelectField({ label, onChange, options, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select
        className="field-control"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
