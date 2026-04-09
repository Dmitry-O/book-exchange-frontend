import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DEFAULT_PAGE_SIZE } from "../../shared/api/config";
import { useMetadataQuery } from "../../shared/api/hooks";
import { apiRequest } from "../../shared/api/http";
import { buildQueryString, formatEnumLabel } from "../../shared/lib/format";
import { BookCover, UserIdentityInline } from "../../shared/ui/Media";
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
    <section className="content-stack catalog-page">
      <header className="section-card">
        <span className="eyebrow">Public API</span>
        <h1>Catalog</h1>
        <p>
          This screen queries your public search endpoint, renders photo URLs from the server, and
          keeps the filtering contract metadata-driven.
        </p>
      </header>

      <section className="section-card">
        <div className="filters-grid">
          <Field
            label="Search text"
            onChange={(value) => updateFilter("searchText", value)}
            value={filters.searchText}
          />
          <Field label="Author" onChange={(value) => updateFilter("author", value)} value={filters.author} />
          <Field
            label="Category"
            onChange={(value) => updateFilter("category", value)}
            value={filters.category}
          />
          <Field label="City" onChange={(value) => updateFilter("city", value)} value={filters.city} />
          <Field
            label="Publication year"
            onChange={(value) => updateFilter("publicationYear", value)}
            type="number"
            value={filters.publicationYear}
          />
          <SelectField
            label="Gift only"
            onChange={(value) => updateFilter("isGift", value)}
            options={[
              { label: "All", value: "" },
              { label: "Gift only", value: "true" },
              { label: "Exchange only", value: "false" }
            ]}
            value={filters.isGift}
          />
          <SelectField
            label="Sort field"
            onChange={(value) => updateFilter("sortBy", value)}
            options={[
              { label: "Default", value: "" },
              ...((metadataQuery.data?.bookSortFields ?? []).map((item) => ({
                label: formatEnumLabel(item),
                value: item
              })))
            ]}
            value={filters.sortBy}
          />
          <SelectField
            label="Sort direction"
            onChange={(value) => updateFilter("sortDirection", value)}
            options={[
              { label: "Ascending", value: "ASC" },
              { label: "Descending", value: "DESC" }
            ]}
            value={filters.sortDirection}
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
      {booksQuery.error ? <ErrorBlock error={booksQuery.error} title="Catalog request failed" /> : null}

      {!booksQuery.isPending && !booksQuery.error && books.length === 0 ? (
        <EmptyBlock
          description="Try broader filters or remove sorting and text constraints."
          title="No books found"
        />
      ) : null}

      {books.length > 0 ? (
        <section className="book-grid">
          {books.map((book) => (
            <article className="book-card" key={book.id}>
              <Link className="book-card-cover-link" to={`/book/${book.id}`}>
                <BookCover className="book-card-cover" photoUrl={book.photoUrl} size="card" title={book.name} />
              </Link>

              <div className="book-card-head">
                <span className="eyebrow">{book.isGift ? "Gift" : "Exchange"}</span>
                <span className="subtle-chip">{book.city || "No city"}</span>
              </div>

              <h2>{book.name}</h2>
              <p className="book-meta">
                {book.author} / {book.category} / {book.publicationYear || "Unknown year"}
              </p>
              <p className="book-description">
                {book.description || "No public description provided for this book yet."}
              </p>

                <div className="book-owner">
                  <UserIdentityInline name={book.ownerNickname} photoUrl={book.ownerPhotoUrl} size="sm">
                    <strong>{book.ownerNickname || "Unknown owner"}</strong>
                  </UserIdentityInline>
                </div>
            </article>
          ))}
        </section>
      ) : null}

      {!booksQuery.isPending && !booksQuery.error && totalPages > 1 ? (
        <Pagination onChange={setPageIndex} page={pageIndex} totalPages={totalPages} />
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
      <select className="field-control" onChange={(event) => onChange(event.target.value)} value={value}>
        {options.map((option) => (
          <option key={`${label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
